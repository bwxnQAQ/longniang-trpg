import type { AiClient } from '../ai/client';
import { transaction, type DB } from '../db';
import { HttpError } from '../http';
import type { RealtimeHub } from '../realtime';
import type { Rooms } from '../routes/rooms';
import { formatGameTime, RELATION_LABEL, type Condition, type LogData } from '../../shared/game';
import { STRESS_LABEL, TRACK_MAX, WOUND_LABEL } from '../../shared/rules';
import type { GameEngine } from './engine';
import { characterIdOf, insertLog, LOG_SELECT, LOG_VISIBLE, toLogEntry, type LogRow, type StoredLogData } from './log';
import { characterSnapshots, latestSnapshot, type CharacterSnapshot, type ResolutionSnapshot } from './snapshot';
import { loadCharacters, loadRoom, loadScenario, saveCharacter, type Character } from './world';
import { healCharacter, hpMaxOf, sheetOf } from './rules5e';
import { rules5e } from '../5e/rules-data';

// 房主工具：撤回或重新结算最近一次结算、手动改角色的数值、改游戏时间、改线索归属、导出团录。
// 管理员在「管理」页也用这些，而且能看到、改到全部内容（房主只能动不会剧透的部分）。
// 房主通常自己也在玩：别的角色的状态、别人找到的线索，房主要点“查看”才给，而且记录里会告诉大家“房主查看了……”。

/** 谁在操作：写进记录里给大家看。full 表示能看全部内容（管理员），否则只给不剧透的部分。 */
/** 谁在用主持工具：by 写进记录里；full 是能看到、改到全部内容（不在这一局里玩的管理员、站长）。 */
export type Operator = { by: '房主' | '管理员' | '站长'; full: boolean; userId: number };

/** 给房主看的最近一次结算。 */
export type LastResolution = {
  actionId: number;
  actor: string;
  /** 行动的内容；房主没看到这次结算（不在场）时是 null。 */
  action: string | null;
  resolvedAt: number | null;
  /** 这次结算达成了结局（撤回以后对局继续）。 */
  ended: boolean;
  /** 现在不能撤回的原因；能撤回时是 null。 */
  blocked: string | null;
};

/** 角色的状态：伤势、物品这些，别的玩家看不到。 */
export type HostCharacterState = {
  wounds: number;
  stress: number;
  conditions: Condition[];
  items: string[];
  location: { key: string; name: string } | null;
  /** 可以把他挪到哪些地点：房主只能选他去过的地方，管理员可以选全部。 */
  places: { key: string; name: string }[];
  /** 5E 角色的生命值（V0.9.0）；别的剧本是 null。 */
  hp5e: { hp: number; hpMax: number } | null;
};

export type HostCharacter = {
  id: number;
  name: string;
  playerName: string;
  roleName: string;
  dead: boolean;
  /** 房主自己的角色。 */
  mine: boolean;
  /** 别人的角色要先点“查看”才给（null）；自己的、管理员看的直接给。 */
  state: HostCharacterState | null;
};

export type HostClue = {
  key: string;
  title: string;
  content: string;
  found: boolean;
  holders: number[];
};

/** 线索归属：房主要先点“查看”（clues 是 null，count 是已经找到了几条）。 */
export type HostClues = { clues: HostClue[] | null; count: number };

const MAX_ITEMS = 30;
const MAX_CONDITIONS = 10;

/** 同一个人这么久之内反复查看同一样东西，记录里只写一次。 */
const PEEK_NOTE_WINDOW_MS = 30 * 60 * 1000;
/** 地下城按结局结算过以后（成长点、宝箱、带出来的东西都发了），结局就不能撤回了。 */
const DUNGEON_SETTLED = '这一局地下城已经按结局结算过了（成长点、宝箱、带出来的东西都发了），不能再撤回';

export class HostTools {
  constructor(
    private readonly opts: {
      db: DB;
      rooms: Rooms;
      hub: () => RealtimeHub;
      engine: GameEngine;
      ai: AiClient;
      now: () => number;
    },
  ) {}

  private get db() {
    return this.opts.db;
  }

  private requireRoom(roomId: number) {
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    return room;
  }

  private requireIdle(roomId: number, what: string) {
    if (this.opts.engine.resolutionBusy(roomId)) throw new HttpError(409, `主持人正在结算，等结算完再${what}`);
  }

  /** 房主查看了别人的东西：记录里告诉大家（一段时间里反复看同一样只记一次）。 */
  private notePeek(roomId: number, text: string) {
    const now = this.opts.now();
    const recent = this.db
      .prepare("SELECT 1 FROM log_entries WHERE room_id = ? AND kind = 'system' AND visibility = 'all' AND text = ? AND created_at >= ?")
      .get(roomId, text, now - PEEK_NOTE_WINDOW_MS);
    if (!recent) this.opts.rooms.log({ roomId, kind: 'system', text });
  }

  // ==================== 撤回、重新结算 ====================

  /**
   * 这次结算还能不能自动撤回：它改过的角色之后又变过（交换过东西、在「角色的数值」里改过），退回结算前会把之后的变化一起抹掉，
   * 东西还可能变成两份。这时不让撤回，返回原因；能撤回返回 null。
   */
  private undoConflict(roomId: number, s: ResolutionSnapshot): string | null {
    const message = (names: string[]) =>
      `这次结算以后，${names.length ? `「${names.join('」「')}」` : '有角色'}的状态又变过（交换过东西，或者在「角色的数值」里改过），不能自动撤回了。需要的话在「角色的数值」里手动改回去。`;
    if (s.after) {
      const current = new Map(characterSnapshots(this.db, roomId).map((c) => [c.id, c]));
      const same = (a: CharacterSnapshot, b: CharacterSnapshot | undefined) =>
        !!b &&
        a.wounds === b.wounds &&
        a.stress === b.stress &&
        a.conditions === b.conditions &&
        a.items === b.items &&
        a.location === b.location &&
        a.visited === b.visited &&
        a.dead === b.dead &&
        (a.v2 ?? null) === (b.v2 ?? null) &&
        (a.v5 ?? null) === (b.v5 ?? null);
      const moved = s.after.filter((a) => !same(a, current.get(a.id)));
      if (!moved.length) return null;
      const names = loadCharacters(this.db, roomId);
      return message(moved.map((a) => names.find((c) => c.id === a.id)?.name).filter((n): n is string => !!n));
    }
    // 早先的快照没记结算后的样子：之后有人交换过东西就不撤（撤回会把所有角色都退回结算前）
    const since = s.logs.length ? Math.max(...s.logs) : 0;
    const gave = this.db.prepare("SELECT 1 FROM log_entries WHERE room_id = ? AND id > ? AND json_extract(data, '$.type') = 'give'").get(roomId, since);
    return gave ? message([]) : null;
  }

  lastResolution(roomId: number, op: Operator): LastResolution | null {
    const room = this.requireRoom(roomId);
    const s = latestSnapshot(this.db, roomId);
    if (!s) return null;
    const row = this.db
      .prepare('SELECT a.content, a.status, a.resolved_at, c.name FROM actions a JOIN characters c ON c.id = a.character_id WHERE a.id = ?')
      .get(s.actionId) as { content: string; status: string; resolved_at: number | null; name: string } | undefined;
    if (!row || row.status !== 'done') return null;
    let blocked: string | null = null;
    if (this.opts.engine.resolutionBusy(roomId)) blocked = '主持人正在结算，等结算完再撤回';
    else if (room.status === 'ended' && !s.ended) blocked = '对局已经结束了';
    else if (s.ended && this.dungeonSettled(roomId)) blocked = DUNGEON_SETTLED;
    else blocked = this.undoConflict(roomId, s);
    // 房主自己也在玩：这次结算他没看到（不在场），就不给他看行动的内容
    const visible =
      op.full ||
      (s.logs.length > 0 &&
        !!this.db
          .prepare(`SELECT 1 FROM log_entries l WHERE l.id = ? AND l.room_id = ? AND ${LOG_VISIBLE}`)
          .get(s.logs[0], roomId, op.userId, characterIdOf(this.db, roomId, op.userId) ?? -1));
    return { actionId: s.actionId, actor: row.name, action: visible ? row.content : null, resolvedAt: row.resolved_at, ended: s.ended, blocked };
  }

  /**
   * 撤回最近一次结算：角色、世界、时钟回到结算前，这次结算写的记录、找到的线索都撤掉。
   * regenerate：撤回以后让主持人按原来的行动重新结算一次；否则这个行动算撤回，玩家可以重新写。
   */
  undo(roomId: number, op: Operator, regenerate: boolean): { actionId: number } {
    const room = this.requireRoom(roomId);
    if (room.status === 'preparing') throw new HttpError(409, '对局还没开始');
    this.requireIdle(roomId, '撤回');
    const s = latestSnapshot(this.db, roomId);
    const action = s
      ? (this.db.prepare('SELECT a.*, c.name AS actor FROM actions a JOIN characters c ON c.id = a.character_id WHERE a.id = ?').get(s.actionId) as
          | { id: number; status: string; game_start: number | null; actor: string; character_id: number }
          | undefined)
      : undefined;
    if (!s || !action || action.status !== 'done') throw new HttpError(409, '没有可以撤回的结算');
    if (room.status === 'ended' && !s.ended) throw new HttpError(409, '对局已经结束了，不能撤回');
    if (s.ended && this.dungeonSettled(roomId)) throw new HttpError(409, DUNGEON_SETTLED);
    const conflict = this.undoConflict(roomId, s);
    if (conflict) throw new HttpError(409, conflict);
    if (regenerate) {
      const ai = this.opts.ai.statusFor('resolve', roomId);
      if (!ai.ready) throw new HttpError(503, ai.message ?? 'AI 暂时用不了');
      // 他已经交了下一个行动：再把这一个放回去结算，一个角色就同时有两个行动了
      const newer = this.db
        .prepare("SELECT 1 FROM actions WHERE character_id = ? AND id != ? AND status IN ('waiting', 'resolving', 'failed')")
        .get(action.character_id, action.id);
      if (newer) throw new HttpError(409, `「${action.actor}」已经交了新的行动，不能再重新结算这一次；可以只撤回`);
    }

    const now = this.opts.now();
    let logId = 0;
    let removed: number[] = [];
    transaction(this.db, () => {
      // 先写这条记录再删：撤掉的记录编号最大，先删的话新记录会用上同样的编号
      const text = regenerate
        ? `${op.by}撤回了「${action.actor}」上一次行动的结果，让主持人重新结算`
        : `${op.by}撤回了「${action.actor}」上一次行动的结果，这个行动不算了`;
      logId = insertLog(this.db, { roomId, kind: 'system', text, now });
      removed = this.restore(roomId, s, room.status, now);
      if (regenerate) {
        this.db.prepare("UPDATE actions SET status = 'resolving', result = NULL, resolved_at = NULL, last_error = NULL WHERE id = ?").run(action.id);
        // 协助这个行动的人跟着一起重新结算（他已经交了新行动的，就不再算他协助）
        this.db
          .prepare(
            `UPDATE actions SET status = 'resolving', result = NULL, resolved_at = NULL WHERE assist_of = ? AND status = 'done'
               AND NOT EXISTS (SELECT 1 FROM actions b WHERE b.character_id = actions.character_id AND b.id != actions.id
                 AND b.status IN ('waiting', 'resolving', 'failed'))`,
          )
          .run(action.id);
      } else {
        this.db.prepare("UPDATE actions SET status = 'withdrawn', result = NULL, last_error = ? WHERE id = ?").run(`${op.by}撤回了结算`, action.id);
        this.db
          .prepare("UPDATE actions SET status = 'withdrawn', result = NULL, last_error = ? WHERE assist_of = ? AND status = 'done'")
          .run(`${op.by}撤回了要协助的那次结算`, action.id);
      }
    });

    // 网页上去掉撤掉的记录；对局因为结局结束了的，回到进行中
    this.opts.hub().toRoom(roomId, 'log-removed', { ids: removed });
    this.opts.rooms.publishLog(logId);
    this.opts.engine.storyChanged(roomId);
    if (s.ended) {
      this.opts.hub().toRoom(roomId, 'room', { roomId, status: s.status });
      this.opts.rooms.notifyRoomsChanged(roomId);
    }
    this.opts.rooms.broadcastPresence(roomId);
    this.opts.engine.syncRoom(roomId);
    // 重新结算的钱记给按按钮的人，不记给行动的主人
    if (regenerate) this.opts.engine.resolveAgain(roomId, action.id, op.userId);
    // 放回去的行动（对局因为结局结束时撤下的）接着估时、结算
    this.opts.engine.resumeRoom(roomId);
    return { actionId: action.id };
  }

  /** 地下城已经按结局结算过了（有人拿到了成长点、宝箱、带出来的东西）。 */
  private dungeonSettled(roomId: number): boolean {
    return !!this.db
      .prepare('SELECT 1 FROM card_history h JOIN rooms r ON r.id = h.room_id AND r.created_at = h.room_created_at WHERE h.room_id = ? LIMIT 1')
      .get(roomId);
  }

  /** 退回结算前的样子。返回撤掉的记录编号（网页上要去掉）。 */
  private restore(roomId: number, s: ResolutionSnapshot, statusNow: string, now: number): number[] {
    const db = this.db;
    const room = loadRoom(db, roomId)!;
    // 这次结算用掉的道具（V0.7.0）：已经从账号背包里扣了，退回去（角色身上带着的道具跟着快照退回）
    const refund = db.prepare('INSERT INTO pet_items (user_id, item, count) VALUES (?, ?, 1) ON CONFLICT (user_id, item) DO UPDATE SET count = count + 1');
    const ownerOf = db.prepare('SELECT p.user_id FROM characters c JOIN players p ON p.id = c.player_id WHERE c.id = ? AND c.room_id = ?');
    for (const id of s.logs) {
      const row = db.prepare('SELECT data FROM log_entries WHERE id = ? AND room_id = ?').get(id, roomId) as { data: string | null } | undefined;
      let uses: { characterId: number; item: string }[] = [];
      try {
        const data = row?.data ? (JSON.parse(row.data) as { type?: string; itemUses?: { characterId: number; item: string }[] }) : null;
        if (data?.type === 'resolution' && Array.isArray(data.itemUses)) uses = data.itemUses;
      } catch {
        uses = [];
      }
      for (const u of uses) {
        const owner = ownerOf.get(u.characterId, roomId) as { user_id: number } | undefined;
        if (owner) refund.run(owner.user_id, u.item);
      }
    }
    const restoreCharacter = db.prepare(
      'UPDATE characters SET wounds = ?, stress = ?, conditions = ?, items = ?, location = ?, visited = ?, dead = ?, v2 = COALESCE(?, v2), v5 = COALESCE(?, v5) WHERE id = ? AND room_id = ?',
    );
    // 只退回这次结算改过的角色（早先的快照没记，就全部退回）
    const touched = s.after ? new Set(s.after.map((c) => c.id)) : null;
    for (const c of s.characters) {
      if (touched && !touched.has(c.id)) continue;
      restoreCharacter.run(c.wounds, c.stress, c.conditions, c.items, c.location, c.visited, c.dead, c.v2 ?? null, c.v5 ?? null, c.id, roomId);
    }

    // 时钟：退回这次结算让它往前跳的那一段，之后（现实时间里）走过的照样算
    const clock = Math.max(0, this.opts.engine.gameNow(room) - Math.max(0, s.clockAfter - s.clockBefore));
    const status = s.ended && statusNow === 'ended' ? s.status : statusNow;
    db.prepare('UPDATE rooms SET world = ?, round_no = ?, status = ?, game_clock = ?, clock_real_base = ?, paused_at = ? WHERE id = ?').run(
      s.world,
      s.roundNo,
      status,
      clock,
      room.clock_real_base === null ? null : now,
      status === 'paused' ? (room.paused_at ?? now) : null,
      roomId,
    );

    // 主持人的笔记已经写进了这次结算的内容：退回结算前的笔记
    const memo = db.prepare('SELECT summary_until_log_id FROM rooms WHERE id = ?').get(roomId) as { summary_until_log_id: number };
    if (s.logs.length && memo.summary_until_log_id >= Math.min(...s.logs)) {
      db.prepare('UPDATE rooms SET story_summary = ?, summary_until_log_id = ? WHERE id = ?').run(s.summary.text, s.summary.until, roomId);
    }

    const list = (ids: unknown[]) => ids.map(() => '?').join(',') || 'NULL';

    // 这次才找到的线索：编号和 key 都对得上才撤（房主可能已经把它删了，编号又被别的线索用上）
    const clueRows = s.clueRows ?? s.clues.map((id) => ({ id, key: null as string | null }));
    const gone: { id: number; key: string }[] = [];
    for (const c of clueRows) {
      const row = db.prepare('SELECT id, clue_key FROM clues WHERE id = ? AND room_id = ?').get(c.id, roomId) as { id: number; clue_key: string } | undefined;
      if (row && (c.key === null || row.clue_key === c.key)) gone.push({ id: row.id, key: row.clue_key });
    }
    // 之后有人把这些线索分享出去的记录也一起撤掉
    const keys = gone.map((c) => c.key);
    const shares =
      keys.length && s.logs.length
        ? (
            db
              .prepare(
                `SELECT id FROM log_entries WHERE room_id = ? AND id > ? AND json_extract(data, '$.type') = 'share'
                 AND json_extract(data, '$.clue.key') IN (${list(keys)})`,
              )
              .all(roomId, Math.min(...s.logs), ...keys) as { id: number }[]
          ).map((r) => r.id)
        : [];
    const logs = [...s.logs, ...shares];

    db.prepare(`DELETE FROM knowledge WHERE room_id = ? AND content_type = 'log' AND content_id IN (${list(logs)})`).run(roomId, ...logs);
    db.prepare(`DELETE FROM log_entries WHERE room_id = ? AND id IN (${list(logs)})`).run(roomId, ...logs);
    // 这次结算让谁知道了哪条线索：内容也对得上才删
    if (s.knowledgeRows) {
      const forget = db.prepare("DELETE FROM knowledge WHERE id = ? AND room_id = ? AND content_type = 'clue' AND content_id = ? AND character_id = ?");
      for (const k of s.knowledgeRows) forget.run(k.id, roomId, k.clueId, k.characterId);
    } else {
      db.prepare(`DELETE FROM knowledge WHERE room_id = ? AND content_type = 'clue' AND id IN (${list(s.knowledge)})`).run(roomId, ...s.knowledge);
    }
    // 这次才找到的线索整条撤掉（之后分享出去的知情也一起撤掉）
    for (const c of gone) {
      db.prepare("DELETE FROM knowledge WHERE room_id = ? AND content_type = 'clue' AND content_id = ?").run(roomId, c.id);
      db.prepare('DELETE FROM clues WHERE id = ? AND room_id = ?').run(c.id, roomId);
    }
    db.prepare('DELETE FROM rolls WHERE action_id = ?').run(s.actionId);
    // 对局因为结局结束时撤下的行动放回去：在等的接着等，出错的还是出错
    const back = db.prepare("UPDATE actions SET status = ?, due_at = COALESCE(due_at, ?) WHERE id = ? AND status = 'withdrawn'");
    for (const a of s.withdrawn) back.run(a.status === 'failed' ? 'failed' : 'waiting', now, a.id);
    db.prepare('DELETE FROM resolution_snapshots WHERE action_id = ?').run(s.actionId);
    // “你不在时”的摘要里可能有撤掉的事
    db.prepare('UPDATE players SET catchup_text = NULL, catchup_after_id = NULL, catchup_until_id = NULL WHERE room_id = ?').run(roomId);
    return logs;
  }

  // ==================== 角色的数值 ====================

  /**
   * 各角色和他们的状态。房主自己的角色直接给；别人的角色只给 reveal 里点了“查看”的，
   * 并且在记录里告诉大家“房主查看了某某的状态”。管理员全部直接给。
   */
  characters(roomId: number, op: Operator, reveal: number[] = []): HostCharacter[] {
    this.requireRoom(roomId);
    const scenario = loadScenario(this.db, roomId)?.scenario;
    const nameOf = (key: string) => scenario?.locations.find((l) => l.key === key)?.name ?? key;
    const mine = op.full ? null : characterIdOf(this.db, roomId, op.userId);
    return loadCharacters(this.db, roomId).map((c) => {
      const shown = op.full || c.id === mine || reveal.includes(c.id);
      if (shown && !op.full && c.id !== mine) this.notePeek(roomId, `${op.by}查看了「${c.name}」的状态`);
      const keys = op.full && scenario ? scenario.locations.map((l) => l.key) : c.visited;
      return {
        id: c.id,
        name: c.name,
        playerName: c.playerName,
        roleName: scenario?.roles.find((r) => r.key === c.roleKey)?.name ?? c.roleKey,
        dead: c.dead,
        mine: c.id === mine,
        state: shown
          ? {
              wounds: c.wounds,
              stress: c.stress,
              conditions: c.conditions,
              items: c.items,
              location: c.location ? { key: c.location, name: nameOf(c.location) } : null,
              places: keys.map((key) => ({ key, name: nameOf(key) })),
              hp5e: c.v5 ? { hp: c.v5.hp, hpMax: hpMaxOf(c.v5, sheetOf(c.v5, rules5e())) } : null,
            }
          : null,
      };
    });
  }

  /**
   * 手动改角色时新写的物品、状态（以后会发给主持 AI）：返回要检查的文字，没有新写的是 null。
   */
  editText(roomId: number, characterId: number, input: unknown): string | null {
    const c = loadCharacters(this.db, roomId).find((x) => x.id === characterId);
    const o = (input && typeof input === 'object' && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
    if (!c) return null;
    const lines: string[] = [];
    if (Array.isArray(o.items)) {
      for (const x of o.items) if (typeof x === 'string' && x.trim() && !c.items.includes(x.trim())) lines.push(`物品：${x.trim()}`);
    }
    if (Array.isArray(o.conditions)) {
      for (const raw of o.conditions) {
        const k = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
        const name = typeof k.name === 'string' ? k.name.trim() : '';
        const effect = typeof k.effect === 'string' ? k.effect.trim() : '';
        if (!name || c.conditions.some((x) => x.name === name && x.effect === effect)) continue;
        lines.push(`状态：${name}${effect ? `（${effect}）` : ''}`);
      }
    }
    return lines.length ? lines.join('\n') : null;
  }

  /** 手动改角色的伤势、心智、状态、物品、位置、生死。只改给了的字段。 */
  editCharacter(roomId: number, characterId: number, input: unknown, op: Operator) {
    const room = this.requireRoom(roomId);
    if (room.status === 'preparing') throw new HttpError(409, '对局还没开始，角色卡由玩家自己改');
    if (room.status === 'ended') throw new HttpError(409, '对局已经结束了');
    this.requireIdle(roomId, '改');
    const scenario = loadScenario(this.db, roomId)?.scenario;
    const c = loadCharacters(this.db, roomId).find((x) => x.id === characterId);
    if (!c || !scenario) throw new HttpError(404, '没有这个角色');
    const o = (input && typeof input === 'object' && !Array.isArray(input) ? input : null) as Record<string, unknown> | null;
    if (!o) throw new HttpError(400, '请求格式不对');

    const before: Character = structuredClone(c);
    const changes: string[] = [];
    const track = (value: unknown, label: string, labels: readonly string[], set: (n: number) => void, from: number) => {
      if (value === undefined) return;
      if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > TRACK_MAX) throw new HttpError(400, `${label}要在0～${TRACK_MAX}之间`);
      if (value !== from) changes.push(`${label}：${labels[from]} → ${labels[value as number]}`);
      set(value as number);
    };
    track(o.wounds, '伤势', WOUND_LABEL, (n) => (c.wounds = n), before.wounds);
    if (o.stress !== undefined && !scenario.stress && o.stress !== c.stress) throw new HttpError(400, '这个剧本没有开启心智规则');
    track(o.stress, '心智', STRESS_LABEL, (n) => (c.stress = n), before.stress);

    if (o.items !== undefined) {
      if (!Array.isArray(o.items) || o.items.length > MAX_ITEMS) throw new HttpError(400, `物品最多${MAX_ITEMS}件`);
      const items = o.items.map((x) => (typeof x === 'string' ? [...x.trim()].slice(0, 20).join('') : '')).filter(Boolean);
      const gained = items.filter((x) => !before.items.includes(x));
      const lost = before.items.filter((x) => !items.includes(x));
      if (gained.length) changes.push(`得到：${gained.join('、')}`);
      if (lost.length) changes.push(`失去：${lost.join('、')}`);
      c.items = items;
    }

    if (o.conditions !== undefined) {
      if (!Array.isArray(o.conditions) || o.conditions.length > MAX_CONDITIONS) throw new HttpError(400, `状态最多${MAX_CONDITIONS}个`);
      const conditions: Condition[] = [];
      for (const raw of o.conditions) {
        const x = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
        const name = typeof x.name === 'string' ? [...x.name.trim()].slice(0, 10).join('') : '';
        if (!name || conditions.some((k) => k.name === name)) continue;
        const effect = typeof x.effect === 'string' ? [...x.effect.trim()].slice(0, 60).join('') : '';
        const penalty = Number.isInteger(x.penalty) ? Math.max(-2, Math.min(0, x.penalty as number)) : 0;
        conditions.push({ name, effect, penalty });
      }
      const names = (list: Condition[]) => list.map((k) => k.name);
      const added = conditions.filter((k) => !names(before.conditions).includes(k.name));
      const removed = before.conditions.filter((k) => !names(conditions).includes(k.name));
      if (added.length) changes.push(`状态：${added.map((k) => k.name).join('、')}`);
      if (removed.length) changes.push(`不再：${removed.map((k) => k.name).join('、')}`);
      c.conditions = conditions;
    }

    if (o.location !== undefined) {
      const key = typeof o.location === 'string' ? o.location : '';
      const place = scenario.locations.find((l) => l.key === key);
      // 房主只能把角色挪到他去过的地方：列出所有地点会剧透
      if (!place || (!op.full && !before.visited.includes(key))) throw new HttpError(400, '只能选这个角色去过的地点');
      if (key !== before.location) {
        const from = scenario.locations.find((l) => l.key === before.location)?.name ?? '不知道在哪';
        changes.push(`位置：${from} → ${place.name}`);
        c.location = key;
        if (!c.visited.includes(key)) c.visited = [...c.visited, key];
      }
    }

    if (o.dead !== undefined) {
      if (typeof o.dead !== 'boolean') throw new HttpError(400, '请求格式不对');
      if (o.dead !== before.dead) changes.push(o.dead ? '角色死亡' : '角色复活');
      c.dead = o.dead;
    }

    // 5E 角色的生命值（V0.9.0）：改到 0 是倒地（开始掷死亡豁免），从 0 改上去就醒过来
    if (o.hp5e !== undefined && c.v5) {
      const s = c.v5;
      const max = hpMaxOf(s, sheetOf(s, rules5e()));
      if (!Number.isInteger(o.hp5e) || (o.hp5e as number) < 0 || (o.hp5e as number) > max) throw new HttpError(400, `生命值要在 0～${max} 之间`);
      const hp = o.hp5e as number;
      if (hp !== s.hp) {
        changes.push(`生命值：${s.hp} → ${hp}`);
        if (hp === 0) {
          s.hp = 0;
          s.death = { success: 0, failure: 0 };
          s.stable = false;
          s.deathRound = null;
          if (!s.conditions.some((x) => x.key === 'unconscious')) s.conditions.push({ key: 'unconscious', note: '生命值到 0' });
        } else if (s.hp === 0) {
          healCharacter(s, sheetOf(s, rules5e()), hp);
        } else {
          s.hp = hp;
        }
      }
    }

    if (!changes.length) return { changed: false };
    const now = this.opts.now();
    const ids = transaction(this.db, () => {
      saveCharacter(this.db, c);
      return [
        // 具体改了什么只告诉角色的主人（物品、状态别人本来就看不到）；大家只知道改过
        insertLog(this.db, { roomId, kind: 'system', text: `${op.by}调整了「${c.name}」的状态`, now }),
        insertLog(this.db, { roomId, kind: 'system', text: `${op.by}调整了你的角色：${changes.join('；')}`, targetUserId: c.userId, now }),
      ];
    });
    for (const id of ids) this.opts.rooms.publishLog(id);
    if (before.dead !== c.dead) this.opts.rooms.broadcastPresence(roomId);
    this.opts.engine.syncRoom(roomId);
    return { changed: true };
  }

  // ==================== 游戏时间 ====================

  setClock(roomId: number, input: unknown, op: Operator) {
    const room = this.requireRoom(roomId);
    if (room.status === 'preparing') throw new HttpError(409, '对局还没开始');
    if (room.status === 'ended') throw new HttpError(409, '对局已经结束了');
    this.requireIdle(roomId, '改时间');
    const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    const day = o.day;
    const time = typeof o.time === 'string' ? o.time.match(/^(\d{1,2}):(\d{2})$/) : null;
    if (!Number.isInteger(day) || (day as number) < 1 || (day as number) > 60) throw new HttpError(400, '第几天要在1～60之间');
    if (!time || Number(time[1]) > 23 || Number(time[2]) > 59) throw new HttpError(400, '时间要写成 时:分');
    const minutes = ((day as number) - 1) * 1440 + Number(time[1]) * 60 + Number(time[2]);
    const now = this.opts.now();
    this.db
      .prepare('UPDATE rooms SET game_clock = ?, clock_real_base = CASE WHEN clock_real_base IS NULL THEN NULL ELSE ? END WHERE id = ?')
      .run(minutes, now, roomId);
    this.opts.rooms.log({ roomId, kind: 'system', text: `${op.by}把游戏时间调到了${formatGameTime(minutes)}` });
    this.opts.engine.pushGame(roomId);
    return { minutes };
  }

  // ==================== 线索归属 ====================

  /**
   * 线索和谁知道：房主只看已经被找到的，而且要先点“查看”（reveal），记录里会告诉大家；管理员直接看剧本里的全部。
   */
  clues(roomId: number, op: Operator, reveal: boolean): HostClues {
    this.requireRoom(roomId);
    const scenario = loadScenario(this.db, roomId)?.scenario;
    if (!scenario) return { clues: [], count: 0 };
    const { n } = this.db.prepare('SELECT COUNT(*) AS n FROM clues WHERE room_id = ?').get(roomId) as { n: number };
    if (!op.full && !reveal) return { clues: null, count: n };
    if (!op.full && n > 0) this.notePeek(roomId, `${op.by}查看了已经找到的线索和它们的归属`);
    return { clues: this.clueList(roomId, op, scenario.clues), count: n };
  }

  private clueList(roomId: number, op: Operator, all: { key: string; title: string; content: string }[]): HostClue[] {
    const rows = this.db
      .prepare(
        `SELECT cl.clue_key, k.character_id FROM clues cl
         LEFT JOIN knowledge k ON k.content_type = 'clue' AND k.content_id = cl.id WHERE cl.room_id = ?`,
      )
      .all(roomId) as { clue_key: string; character_id: number | null }[];
    const found = new Map<string, number[]>();
    for (const r of rows) {
      const list = found.get(r.clue_key) ?? [];
      if (r.character_id !== null) list.push(r.character_id);
      found.set(r.clue_key, list);
    }
    return all
      .filter((c) => op.full || found.has(c.key))
      .map((c) => ({ key: c.key, title: c.title, content: c.content, found: found.has(c.key), holders: found.get(c.key) ?? [] }));
  }

  /** 设定一条线索有哪些角色知道。没人知道了就算没找到；房主只能改已经被找到的线索。 */
  setClueHolders(roomId: number, key: string, input: unknown, op: Operator) {
    const room = this.requireRoom(roomId);
    if (room.status === 'preparing') throw new HttpError(409, '对局还没开始');
    this.requireIdle(roomId, '改');
    const scenario = loadScenario(this.db, roomId)?.scenario;
    const clue = scenario?.clues.find((c) => c.key === key);
    if (!clue) throw new HttpError(404, '没有这条线索');
    const raw = (input && typeof input === 'object' ? (input as Record<string, unknown>).characterIds : null) as unknown;
    if (!Array.isArray(raw) || !raw.every((x) => Number.isInteger(x))) throw new HttpError(400, '选一下哪些角色知道');
    const characters = loadCharacters(this.db, roomId);
    const want = [...new Set(raw as number[])];
    if (want.some((id) => !characters.some((c) => c.id === id))) throw new HttpError(400, '只能选这一局里的角色');

    const row = this.db.prepare('SELECT id FROM clues WHERE room_id = ? AND clue_key = ?').get(roomId, key) as { id: number } | undefined;
    if (!row && !op.full) throw new HttpError(404, '这条线索还没有人找到');
    const had = row
      ? (this.db.prepare("SELECT character_id FROM knowledge WHERE content_type = 'clue' AND content_id = ?").all(row.id) as { character_id: number }[]).map(
          (r) => r.character_id,
        )
      : [];
    const added = want.filter((id) => !had.includes(id));
    const removed = had.filter((id) => !want.includes(id));
    if (!added.length && !removed.length) return { changed: false };

    const now = this.opts.now();
    const gameTime = Math.floor(this.opts.engine.gameNow(room));
    const nameOf = (id: number) => characters.find((c) => c.id === id)!;
    const ids = transaction(this.db, () => {
      let clueId = row?.id;
      if (!clueId && want.length) {
        clueId = Number(
          this.db
            .prepare('INSERT INTO clues (room_id, clue_key, found_by_character_id, found_game_time, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(roomId, key, want[0], gameTime, now).lastInsertRowid,
        );
      }
      if (clueId) {
        const add = this.db.prepare(
          "INSERT OR IGNORE INTO knowledge (room_id, content_type, content_id, character_id, game_time, created_at) VALUES (?, 'clue', ?, ?, ?, ?)",
        );
        for (const id of added) add.run(roomId, clueId, id, gameTime, now);
        const remove = this.db.prepare("DELETE FROM knowledge WHERE content_type = 'clue' AND content_id = ? AND character_id = ?");
        for (const id of removed) remove.run(clueId, id);
        if (!want.length) this.db.prepare('DELETE FROM clues WHERE id = ?').run(clueId);
      }
      // 线索的名字只告诉有关的人；大家只知道改过
      const logs = [insertLog(this.db, { roomId, kind: 'system', text: `${op.by}调整了线索的归属`, now })];
      for (const id of added) {
        logs.push(insertLog(this.db, { roomId, kind: 'system', text: `${op.by}让你的角色「${nameOf(id).name}」知道了线索「${clue.title}」`, targetUserId: nameOf(id).userId, now }));
      }
      for (const id of removed) {
        logs.push(insertLog(this.db, { roomId, kind: 'system', text: `${op.by}让你的角色「${nameOf(id).name}」不再知道线索「${clue.title}」`, targetUserId: nameOf(id).userId, now }));
      }
      return logs;
    });
    for (const id of ids) this.opts.rooms.publishLog(id);
    this.opts.engine.pushGame(roomId);
    return { changed: true };
  }

  // ==================== 团录 ====================

  /**
   * 导出团录（Markdown）。玩家导出的是自己能看到的部分；管理员导出全部，私密的内容注明谁看得到。
   */
  exportLog(roomId: number, viewer: { userId: number; displayName: string } | 'admin'): { filename: string; content: string } {
    const room = this.db.prepare('SELECT name, created_at FROM rooms WHERE id = ?').get(roomId) as { name: string; created_at: number } | undefined;
    if (!room) throw new HttpError(404, '对局不存在');
    const scenario = loadScenario(this.db, roomId)?.scenario ?? null;
    const characters = loadCharacters(this.db, roomId);
    const characterId = viewer === 'admin' ? null : (characters.find((c) => c.userId === viewer.userId)?.id ?? null);
    const rows =
      viewer === 'admin'
        ? (this.db.prepare(`${LOG_SELECT} WHERE l.room_id = ? ORDER BY l.id`).all(roomId) as LogRow[])
        : (this.db.prepare(`${LOG_SELECT} WHERE l.room_id = ? AND ${LOG_VISIBLE} ORDER BY l.id`).all(roomId, viewer.userId, characterId ?? -1) as LogRow[]);

    const audience = this.db.prepare(
      "SELECT c.name FROM knowledge k JOIN characters c ON c.id = k.character_id WHERE k.content_type = 'log' AND k.content_id = ? ORDER BY c.id",
    );
    const userName = this.db.prepare('SELECT display_name FROM users WHERE id = ?');
    const date = new Date(this.opts.now());
    const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const lines: string[] = [];
    lines.push(`# ${scenario ? `《${scenario.title}》` : ''}团录：${room.name}`, '');
    lines.push(`- 导出时间：${stamp}`);
    if (scenario) lines.push(`- 剧本：${scenario.title}（${scenario.genre}，${RELATION_LABEL[scenario.relation]}）`);
    lines.push(`- 角色：${characters.map((c) => `${c.name}（${c.playerName}）`).join('、') || '还没有'}`);
    lines.push(
      viewer === 'admin'
        ? '- 管理员导出的完整团录，包括所有私密内容；私密的内容注明了谁看得到。'
        : `- ${viewer.displayName} 导出，只包含你能看到的内容。`,
      '',
    );

    let lastTime: number | null = null;
    for (const row of rows) {
      const entry = toLogEntry(row, viewer === 'admin' ? null : characterId);
      const stored = row.data ? (JSON.parse(row.data) as StoredLogData) : null;
      if (row.game_time !== null && row.kind === 'narration' && row.game_time !== lastTime) {
        lines.push(`## ${formatGameTime(row.game_time)}`, '');
        lastTime = row.game_time;
      }
      let who = '';
      if (row.visibility === 'private') {
        if (viewer === 'admin') {
          const names = (audience.all(row.id) as { name: string }[]).map((r) => r.name);
          const target = row.target_user_id !== null ? (userName.get(row.target_user_id) as { display_name: string } | undefined)?.display_name : null;
          who = `（只有${[...names, ...(target ? [target] : [])].join('、') || '当事人'}看得到）`;
        } else {
          who = '（其他玩家看不到）';
        }
      }
      lines.push(...this.formatEntry(entry.data, stored, row, who, viewer === 'admin'), '');
    }
    const safeName = room.name.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40) || '对局';
    return { filename: `团录-${safeName}-${stamp}.md`, content: lines.join('\n').trimEnd() + '\n' };
  }

  private formatEntry(data: LogData | null, stored: StoredLogData | null, row: LogRow, who: string, full: boolean): string[] {
    const quote = (text: string) => text.split('\n').map((l) => `> ${l}`);
    if (row.kind === 'system') return [`*${row.text}*${who}`];
    if (row.kind === 'ooc') {
      if (data?.type === 'question') return [`**场外提问${who}**（${row.author_name ?? '玩家'}）：${row.text}`];
      if (data?.type === 'answer') return [`**主持人的回答${who}**：${row.text}`];
      return [`**${row.author_name ?? '玩家'}**（场外）：${row.text}`];
    }
    switch (data?.type) {
      case 'opening':
        return [`**开场：${data.title}**`, '', data.background, '', data.situation, ...(data.known.length ? ['', '大家都知道：', ...data.known.map((k) => `- ${k}`)] : [])];
      case 'role':
        return [`**身份${who}**`, '', row.text];
      case 'resolution': {
        const out = [`**${data.actor}**${who}：${data.action}`, '', row.text];
        for (const r of data.rolls) out.push('', `- 检定：${r.who}（${r.reason}）${r.dice.join('+')} → ${r.total}`);
        // 管理员看到全部角色拿到的线索和变化；玩家只有自己的
        const s = stored?.type === 'resolution' ? stored : null;
        const clues = full && s ? s.clues.map((c) => c.title) : data.clues.map((c) => c.title);
        const changes = full && s ? s.changes.map((c) => c.text) : data.changes;
        if (clues.length) out.push(`- 线索：${clues.join('、')}`);
        if (changes.length) out.push(`- 变化：${changes.join('；')}`);
        return out;
      }
      case 'private':
        return [`*私下${who}*`, '', row.text];
      case 'share':
        return [`*${row.text}*${who}`];
      case 'ending':
        return [`**结局：${data.title}**`, '', data.epilogue, '', '**真相**', '', ...quote(data.truth)];
      default:
        return [row.text];
    }
  }
}
