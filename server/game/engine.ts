import fs from 'node:fs';
import path from 'node:path';
import { AiSwitchedOff, MODEL_GROUP_LABEL, type AiClient, type AiPurpose } from '../ai/client';
import { AiError, AiRefusal } from '../ai/types';
import { creditOf, outOfCredit } from '../credit';
import { transaction, type DB } from '../db';
import { HttpError } from '../http';
import type { RealtimeHub } from '../realtime';
import type { Rooms } from '../routes/rooms';
import type { Safety } from '../safety';
import { parseStyle, type Catchup, type CatchupItem, type GameState, type MyAction, type PetCompanion, type PlaceInfo, type RoomStyle, type RoomTodo, type ScenarioSummary } from '../../shared/game';
import { petGrowth } from '../pets';
import type { Cards } from '../cards';
import type { Cards5e } from '../cards5e';
import { monsterData, rules5e } from '../5e/rules-data';
import { computeSheet } from '../../shared/5e/sheet';
import { canPlayAs5e, convertTo5e, magicWorld, modOf, pregenData, pregenOf } from './mod5e';
import { newState5e } from './rules5e';
import { Rules5eContext } from './tools5e';
import { character5eView, class5eLine, fight5eView } from './view5e';
import { answerQuestion, estimateMinutes, runDm, summarizeCatchup, summarizeStory } from './dm';
import { characterIdOf, insertLog, LOG_SELECT, LOG_VISIBLE, toLogEntry, type LogEntryView, type LogRow, type StoredLogData } from './log';
import { buildDmContext, type RecentEntry } from './prompts';
import { secureRng, type Rng } from './rules';
import { newV2State, type V2State } from './rules2';
import { gameMinutes, rollDungeonRun, validateScenario, type Role, type Scenario } from './scenario';
import { hiddenScenarios, rankedDungeon, SCENARIO_KEY_RE, summarizeScenario } from './scenario-library';
import { characterSnapshots, saveSnapshot, updateSnapshot, type ResolutionSnapshot } from './snapshot';
import { ResolutionContext } from './tools';
import { Rules2Context } from './tools2';
import { consumableOf, levelPenalty, shorthandedPenalty, validRoleAttributes2, type Attributes2 } from '../../shared/rules2';
import type { Character2View, DungeonView, LootView } from '../../shared/game';
import { anyGearView } from '../legendary';
import { skillOf, skillView } from '../skills';
import { defenseOf } from './rules2';
import {
  aiSeatNamed,
  clearAiSeats,
  companionsOf,
  companionsStartText,
  dropAiSeat,
  isAiSeat,
  loadAiSeats,
  loadPlayScenario,
  rememberFormerName,
  roomCompanions,
  takeoverOf,
  takeoverText,
} from './companions';
import { rejectInvisibleName } from '../util';
import {
  characterOfUser,
  emptyWorld,
  foundClues,
  loadCharacters,
  loadOriginalScenario,
  loadRoom,
  loadScenario,
  parseWorld,
  saveCharacter,
  blockerFor,
  type Character,
  type RoomRow,
  type RoomStatus,
} from './world';

// 游戏引擎：开局、行动、计时、回合、AI结算，都在这里。
// 同一局的结算排成一队，一个一个来；不同的局互不影响。

export type EngineOptions = {
  db: DB;
  hub: () => RealtimeHub;
  rooms: Rooms;
  ai: AiClient;
  /** 违规处理：被 Anthropic 拒绝的内容按情况封号或标给管理员。 */
  safety: Safety;
  scenarioDir: string;
  now?: () => number;
  rng?: Rng;
  /** 现实时间快进多少倍。测试时设 QUICK_WAIT=1 是 60 倍：等15分钟变成等15秒。 */
  timeScale?: number;
  /** 多久检查一次到期的行动（毫秒）；0 表示不自动检查，测试里手动调用 tick()。 */
  tickMs?: number;
};

type ActionRow = {
  id: number;
  room_id: number;
  character_id: number;
  content: string;
  status: 'waiting' | 'resolving' | 'done' | 'withdrawn' | 'failed';
  mode: 'timed' | 'round';
  round: number | null;
  submitted_at: number;
  due_at: number | null;
  game_start: number | null;
  game_minutes: number | null;
  estimate_note: string | null;
  attempts: number;
  last_error: string | null;
  /** 1 = 被 Anthropic 的安全机制拒绝过，不能再重试 */
  refused: number;
  /** 1 = 悄悄做：同一地点的人看不到交了什么。 */
  secret: number;
  /** 协助别人的哪个行动（跟着那个行动一起结算，不单独调用 AI）。 */
  assist_of: number | null;
  /** 1 = 勾了「让宠物帮一把」（V0.6.0）。 */
  pet_help: number;
};

type NarrationRow = { id: number; text: string; data: string | null; game_time: number | null };

/** 估时失败时按这么多游戏分钟算。 */
const DEFAULT_MINUTES = 30;
/** 估时最多等这么久（V0.9.1）：等不到就按 DEFAULT_MINUTES 算，不让行动一直干等（以前要等到请求本身超时，五分钟）。 */
const ESTIMATE_TIMEOUT_MS = 90_000;
/** AI结算失败后（网络、限流等）自动重试的次数和间隔（现实分钟）。 */
const MAX_ATTEMPTS = 3;
const RETRY_MINUTES = [1, 5, 15];
/** 给主持AI看最近多少条经历的原文；更早的并进主持人的笔记（剧情摘要）。 */
const RECENT_FOR_DM = 8;
/** 没并进笔记的经历攒到 RECENT_FOR_DM + SUMMARY_BATCH 条，就把最近 RECENT_FOR_DM 条以外的并进笔记。 */
const SUMMARY_BATCH = 6;
/** 一次最多把多少条并进笔记（之前写笔记失败、攒了很多的时候分几次并）。 */
const SUMMARY_BATCH_MAX = 30;
/** 笔记暂时写不成时，最多给主持AI看这么多条原文。 */
const UNSUMMARIZED_MAX = 24;
/** 写笔记失败以后，过这么久（现实时间）再试。 */
const SUMMARY_RETRY_MS = 10 * 60_000;
const RECENT_FOR_ANSWER = 6;
const ACTION_MAX_LENGTH = 500;
/** 对白（角色当面说的话）最多多少字。 */
const SAY_MAX_LENGTH = 300;
/** 协助时附带的一句话最多多少字。 */
const ASSIST_NOTE_MAX = 100;
/** “你不在时发生了什么”最多直接列几件事；再多就让AI写摘要。 */
const CATCHUP_LIST_MAX = 6;

/** 冻结着的对局（有成员被封号）不能开局、不能继续。 */
export const FROZEN_MESSAGE = '这一局有成员被封号了，冻结到他解封以后才能继续';

/** 不计时的对局：刚断线的人（刷新页面、网络抖一下）这么久里还算在这一轮里（V0.7.1 审查）。 */
export const UNTIMED_RECONNECT_GRACE_MS = 45_000;
/** 服务器刚启动时，不计时的对局等关服务器那会儿还在的人连回来的时间。 */
export const UNTIMED_STARTUP_GRACE_MS = 60_000;

export class GameEngine {
  private readonly db: DB;
  private readonly hub: () => RealtimeHub;
  private readonly rooms: Rooms;
  private readonly ai: AiClient;
  private readonly safety: Safety;
  private readonly scenarioDir: string;
  readonly now: () => number;
  private readonly rng: Rng;
  readonly timeScale: number;
  private readonly tickMs: number;

  private readonly queues = new Map<number, Promise<void>>();
  private readonly queuedActions = new Set<number>();
  private readonly roundsInFlight = new Set<number>();
  private readonly asking = new Set<string>();
  /** 正在估时的行动：同一个行动不重复估（重复估要多花一次钱，还会改掉出结果的时间）。 */
  private readonly estimating = new Set<number>();
  /** 从合并的输入框交的行动：估时发现其实是在问主持人问题，就改成场外提问（重启后清空，按行动算）。 */
  private readonly convertible = new Set<number>();
  /** 正在写的“你不在时”摘要，避免同一段重复写。 */
  private readonly catchupsInFlight = new Set<string>();
  /** 写失败过的“你不在时”摘要：同一段不再重试，只给列表（重启后清空）。 */
  private readonly catchupsFailed = new Set<string>();
  /** 正在写剧情笔记的对局。 */
  private readonly storySummariesInFlight = new Set<number>();
  /** 剧情笔记写失败的对局，到这个时间再试。 */
  private readonly storySummaryRetryAt = new Map<number, number>();
  /** 撤回过结算的次数：正在写的剧情笔记如果是撤回之前开始写的，写好了也不用（里面可能有撤掉的事）。 */
  private readonly storyEpoch = new Map<number, number>();
  private readonly pending = new Set<Promise<void>>();
  private interval: NodeJS.Timeout | null = null;
  private timer: NodeJS.Timeout | null = null;
  /** 服务器启动的时间（不计时的对局：刚启动时等关服务器那会儿还在的人连回来）。 */
  private startedAt = 0;
  /** 不计时的对局：宽限期过了以后再看看这一轮能不能结算（每局一个计时器）。 */
  private graceTimers = new Map<number, NodeJS.Timeout>();
  private readonly abort = new AbortController();
  private stopped = false;
  /** 对局开始了（by：谁开的，写进通知；actorId：按按钮的人，不用通知他）。 */
  onGameStarted: ((roomId: number, by: string, actorId: number | null) => void) | null = null;
  /** 一局走到了结局（V0.5.0：宠物成长；V0.6.0：结局图鉴、成就、作者分成、宠物日记）。 */
  onGameFinished: ((roomId: number) => void) | null = null;
  /** 角色卡（V0.7.0，服务器组装时接上）：地下城里建角色、扣用掉的道具、不会重复掉的传奇装备。 */
  cards: Cards | null = null;
  /** 5E 角色卡（V0.9.0，服务器组装时接上）：5E 模组里建角色。 */
  cards5e: Cards5e | null = null;
  /** 一次结算写进去了，里面有这些检定（V0.6.0：成就）。 */
  onResolved: ((rolls: { characterId: number; outcome: string; hidden: boolean; petSaved: boolean }[]) => void) | null = null;
  /** 回合模式下这一轮已经有人交了，还在等这些人（还没交的参与者的账号；V0.8.0：浏览器推送，过一会儿再用 roundWaitingFor 问）。 */
  onRoundWaiting: ((roomId: number, userIds: number[]) => void) | null = null;

  constructor(opts: EngineOptions) {
    this.db = opts.db;
    this.hub = opts.hub;
    this.rooms = opts.rooms;
    this.ai = opts.ai;
    this.safety = opts.safety;
    this.scenarioDir = opts.scenarioDir;
    this.now = opts.now ?? Date.now;
    this.rng = opts.rng ?? secureRng;
    this.timeScale = opts.timeScale ?? 1;
    this.tickMs = opts.tickMs ?? 15_000;
  }

  // ==================== 启动和停止 ====================

  start() {
    this.startedAt = this.now();
    this.fillBuiltinRoleSheets();
    // 上次关服务器时正在结算的行动，放回去重新结算（结算是一次性写入的，不会只写了一半）
    this.db.prepare("UPDATE actions SET status = 'waiting' WHERE status = 'resolving'").run();
    for (const r of this.db.prepare("SELECT id FROM rooms WHERE status = 'running'").all() as { id: number }[]) this.syncRoom(r.id);
    for (const a of this.db.prepare("SELECT id FROM actions WHERE status = 'waiting' AND game_minutes IS NULL").all() as { id: number }[]) {
      this.startEstimate(a.id);
    }
    if (this.tickMs > 0) {
      this.interval = setInterval(() => this.safely('检查到期的行动', () => this.tick()), this.tickMs);
      this.interval.unref();
    }
    this.tick();
  }

  async stop() {
    this.stopped = true;
    if (this.interval) clearInterval(this.interval);
    if (this.timer) clearTimeout(this.timer);
    for (const t of this.graceTimers.values()) clearTimeout(t);
    this.graceTimers.clear();
    this.abort.abort();
    await this.idle();
  }

  /** 计时器里调用的：出错（比如数据库被别的程序锁住）只记下来，不让整个服务器崩掉（V0.8.0）。 */
  private safely(what: string, fn: () => void) {
    try {
      fn();
    } catch (err) {
      console.error(`${what}时出错：`, err);
    }
  }

  /** 等所有排着队的结算、估时、问答都做完（测试用）。 */
  async idle() {
    while (this.pending.size) await Promise.allSettled([...this.pending]);
  }

  private track(work: Promise<void>) {
    const p = work.catch((err) => console.error('后台任务出错：', err));
    this.pending.add(p);
    void p.then(() => this.pending.delete(p));
  }

  private enqueue(roomId: number, job: () => Promise<void>) {
    const prev = this.queues.get(roomId) ?? Promise.resolve();
    const next = prev.then(async () => {
      if (!this.stopped) await job();
    });
    const settled = next.catch((err) => console.error('对局任务出错：', err));
    this.queues.set(roomId, settled);
    this.track(settled);
    void settled.then(() => {
      if (this.queues.get(roomId) === settled) this.queues.delete(roomId);
    });
  }

  /** 通知这一局的网页：游戏状态变了，重新拉取；“我的对局”页面也更新一下待办。 */
  pushGame(roomId: number) {
    this.hub().toRoom(roomId, 'game', { roomId });
    this.rooms.activity(roomId);
  }

  // ==================== 时钟和模式 ====================

  gameNow(room: Pick<RoomRow, 'game_clock' | 'clock_real_base' | 'time_ratio'>): number {
    const base = room.game_clock ?? 0;
    if (room.clock_real_base === null) return base;
    return base + ((this.now() - room.clock_real_base) * room.time_ratio * this.timeScale) / 60_000;
  }

  /** 游戏时间往前跳到 to（只往前，不往回）。 */
  private advanceClock(roomId: number, to: number) {
    const room = loadRoom(this.db, roomId);
    if (!room || to <= this.gameNow(room)) return;
    if (room.clock_real_base === null) this.db.prepare('UPDATE rooms SET game_clock = ? WHERE id = ?').run(to, roomId);
    else this.db.prepare('UPDATE rooms SET game_clock = ?, clock_real_base = ? WHERE id = ?').run(to, this.now(), roomId);
  }

  /** 计时模式下时钟跟着现实时间走；回合模式、暂停、没开始、结束时停着。 */
  private syncClock(roomId: number) {
    const room = loadRoom(this.db, roomId);
    if (!room || room.game_clock === null) return;
    const shouldRun = room.status === 'running' && this.rooms.presence(roomId).mode === 'timed';
    if (shouldRun && room.clock_real_base === null) {
      this.db.prepare('UPDATE rooms SET clock_real_base = ? WHERE id = ?').run(this.now(), roomId);
    } else if (!shouldRun && room.clock_real_base !== null) {
      this.db.prepare('UPDATE rooms SET game_clock = ?, clock_real_base = NULL WHERE id = ?').run(this.gameNow(room), roomId);
    }
  }

  /**
   * 在线情况（或者「不计时」）变了以后：同步时钟；全员到齐（或者设了不计时）时把等待中的行动转成回合行动（不用再等），
   * 转回计时模式时把回合行动转回计时行动（从提交时算起，继续等）。
   */
  syncRoom(roomId: number) {
    const room = loadRoom(this.db, roomId);
    if (!room || this.stopped) return;
    const mode = this.rooms.presence(roomId).mode;
    let changed = 0;
    transaction(this.db, () => {
      this.syncClock(roomId);
      if (room.status !== 'running') return;
      if (mode === 'round') {
        changed = Number(
          this.db
            .prepare("UPDATE actions SET mode = 'round', round = ? WHERE room_id = ? AND status = 'waiting' AND mode = 'timed'")
            .run(room.round_no, roomId).changes,
        );
      } else {
        changed = Number(
          this.db.prepare("UPDATE actions SET mode = 'timed' WHERE room_id = ? AND status = 'waiting' AND mode = 'round'").run(roomId).changes,
        );
      }
    });
    this.pushGame(roomId);
    if (changed && mode === 'timed') this.tick();
    if (mode === 'round') this.maybeResolveRound(roomId);
    this.scheduleNext();
  }

  // ==================== 计时 ====================

  /** 找出到时间的计时行动，排队结算。 */
  tick() {
    // 管理员关掉了 AI：到期的行动先放着，打开以后再结算
    if (this.stopped || this.ai.switchedOff) return;
    const due = this.db
      .prepare(
        `SELECT a.id, a.room_id FROM actions a JOIN rooms r ON r.id = a.room_id
         WHERE a.status = 'waiting' AND a.mode = 'timed' AND a.due_at IS NOT NULL AND a.due_at <= ? AND r.status = 'running'
           AND a.assist_of IS NULL
         ORDER BY a.due_at, a.id`,
      )
      .all(this.now()) as { id: number; room_id: number }[];
    for (const a of due) this.enqueueTimed(a.room_id, a.id);
    this.scheduleNext();
  }

  /** 在下一个行动到期的时候准时醒来（最多隔 tickMs 也会醒一次）。 */
  private scheduleNext() {
    if (this.stopped || this.tickMs <= 0) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const rows = this.db
      .prepare(
        `SELECT a.id, a.due_at FROM actions a JOIN rooms r ON r.id = a.room_id
         WHERE a.status = 'waiting' AND a.mode = 'timed' AND a.due_at IS NOT NULL AND r.status = 'running' AND a.assist_of IS NULL
         ORDER BY a.due_at LIMIT 50`,
      )
      .all() as { id: number; due_at: number }[];
    const next = rows.find((r) => !this.queuedActions.has(r.id));
    if (!next) return;
    const delay = Math.max(0, Math.min(next.due_at - this.now(), this.tickMs)) + 50;
    this.timer = setTimeout(() => this.safely('检查到期的行动', () => this.tick()), delay);
    this.timer.unref();
  }

  private enqueueTimed(roomId: number, actionId: number) {
    if (this.queuedActions.has(actionId)) return;
    this.queuedActions.add(actionId);
    this.enqueue(roomId, async () => {
      try {
        const action = this.loadAction(actionId);
        const room = loadRoom(this.db, roomId);
        if (!action || !room || room.status !== 'running') return;
        if (action.status !== 'waiting' || action.mode !== 'timed' || action.due_at === null || action.due_at > this.now()) return;
        if (this.ai.switchedOff) return;
        const claimed = this.db
          .prepare("UPDATE actions SET status = 'resolving' WHERE id = ? AND status = 'waiting' AND mode = 'timed'")
          .run(actionId);
        if (!claimed.changes) return;
        this.pushGame(roomId);
        await this.resolveOne(actionId, action.game_start ?? Math.floor(this.gameNow(room)));
      } finally {
        this.queuedActions.delete(actionId);
        this.pushGame(roomId);
        // 这期间可能已经转成了回合模式，而参与这一轮的人变了（比如这个行动失败了）：再看看这一轮能不能开始
        this.maybeResolveRound(roomId);
        this.scheduleNext();
      }
    });
  }

  // ==================== 回合 ====================

  /**
   * 回合模式下这一轮要等谁：在线、活着、能行动、没有卡在失败行动上的角色。
   * 已经交了回合行动的角色也算：不计时的对局人不齐时也是回合模式，交了行动又离开的人，行动跟着这一轮结算；
   * 不在线、也没交的不等（这一轮他的角色不行动）；没有人在线时，交了的行动照样结算。
   * AI 额度用完的人交不了行动，也不等他（他已经交了的行动照样结算）。
   */
  private roundParticipants(roomId: number, characters = loadCharacters(this.db, roomId)): Character[] {
    const online = new Set(this.hub().onlineUserIds(roomId));
    // 不计时的对局：刚断线的人（刷新页面、网络抖一下）、服务器刚启动时还没连回来的人，宽限期里照样等他
    for (const userId of this.untimedGrace(roomId).users) online.add(userId);
    const stress = loadScenario(this.db, roomId)?.scenario.stress ?? false;
    const withStatus = (where: string) =>
      new Set((this.db.prepare(`SELECT character_id FROM actions WHERE room_id = ? AND ${where}`).all(roomId) as { character_id: number }[]).map((r) => r.character_id));
    const failed = withStatus("status = 'failed'");
    const submitted = withStatus("status = 'waiting' AND mode = 'round'");
    return characters.filter(
      (c) => (submitted.has(c.id) || (online.has(c.userId) && !outOfCredit(this.db, c.userId))) && !blockerFor(c, stress) && !failed.has(c.id),
    );
  }

  /**
   * 不计时的对局里还在宽限期里的人（V0.7.1 审查）：
   * - 刚断线的（离开不到 UNTIMED_RECONNECT_GRACE_MS）：刷新页面、网络抖一下不算走了，这一轮照样等他；
   * - 服务器刚启动（不到 UNTIMED_STARTUP_GRACE_MS）、关服务器那会儿还开着对局页、还没连回来的人。
   * until：最早的宽限期什么时候过（过了再看看这一轮能不能结算）。别的对局没有宽限期。
   */
  private untimedGrace(roomId: number): { users: Set<number>; until: number | null } {
    const users = new Set<number>();
    const room = loadRoom(this.db, roomId);
    if (!room || room.untimed !== 1) return { users, until: null };
    const now = this.now();
    let until: number | null = null;
    const rows = this.db.prepare('SELECT user_id, left_at, last_seen_at FROM players WHERE room_id = ?').all(roomId) as {
      user_id: number;
      left_at: number | null;
      last_seen_at: number | null;
    }[];
    for (const r of rows) {
      let end: number | null = null;
      if (r.left_at !== null && now - r.left_at < UNTIMED_RECONNECT_GRACE_MS) end = r.left_at + UNTIMED_RECONNECT_GRACE_MS;
      else if (now - this.startedAt < UNTIMED_STARTUP_GRACE_MS && r.last_seen_at !== null && r.last_seen_at > (r.left_at ?? 0) && r.last_seen_at <= this.startedAt) {
        end = this.startedAt + UNTIMED_STARTUP_GRACE_MS;
      }
      if (end === null) continue;
      users.add(r.user_id);
      until = until === null ? end : Math.min(until, end);
    }
    return { users, until };
  }

  /** 不计时的对局在等宽限期里的人：宽限期过了再看一次（不用等别的事情发生）。 */
  private recheckAfterGrace(roomId: number) {
    const { until } = this.untimedGrace(roomId);
    if (until === null || this.stopped || this.graceTimers.has(roomId)) return;
    const t = setTimeout(() => {
      this.graceTimers.delete(roomId);
      this.safely('宽限期过了以后检查这一轮', () => this.syncRoom(roomId));
    }, Math.min(Math.max(0, until - this.now()) + 100, 2 ** 31 - 1)); // 电脑时钟被往回调过时也不超过 setTimeout 的上限（超了 Node 会改成 1 毫秒）
    t.unref?.();
    this.graceTimers.set(roomId, t);
  }

  /** 回合模式下因为额度用完、这一轮不等的角色。 */
  private outOfCreditCharacters(roomId: number, characters: Character[]): number[] {
    const online = this.hub().onlineUserIds(roomId);
    return characters.filter((c) => online.has(c.userId) && !c.dead && outOfCredit(this.db, c.userId)).map((c) => c.id);
  }

  /**
   * 有人的额度变了（被记了账、管理员发了额度）：他在的各局刷新一下；额度用完的人不再算回合的参与者，
   * 等他的回合可能可以开始了。force：额度没用完也刷新（管理员改了额度，网页上要显示新的数）。
   */
  creditChanged(userIds: number[], force = false) {
    if (this.stopped) return;
    for (const userId of new Set(userIds)) {
      if (!force && !outOfCredit(this.db, userId)) continue;
      const rooms = this.db
        .prepare("SELECT r.id FROM rooms r JOIN players p ON p.room_id = r.id WHERE p.user_id = ? AND r.status = 'running'")
        .all(userId) as { id: number }[];
      for (const r of rooms) {
        this.pushGame(r.id);
        this.maybeResolveRound(r.id);
      }
    }
  }

  private roundBusy(roomId: number): boolean {
    return (
      this.roundsInFlight.has(roomId) ||
      !!this.db.prepare("SELECT 1 FROM actions WHERE room_id = ? AND status = 'resolving' AND mode = 'round'").get(roomId)
    );
  }

  /**
   * 这一轮该交的人都交了（并且都估好了时），就开始结算。
   * 上一轮没结算完的行动（中途关了 AI、重启了服务器、撤回了结局）先接着结算，不用再等别人。
   */
  private maybeResolveRound(roomId: number) {
    if (this.stopped || this.roundsInFlight.has(roomId) || this.ai.switchedOff) return;
    const room = loadRoom(this.db, roomId);
    if (!room || room.status !== 'running' || this.rooms.presence(roomId).mode !== 'round') return;
    const carried = this.carriedOver(roomId, room.round_no);
    if (carried.length) {
      this.roundsInFlight.add(roomId);
      this.enqueue(roomId, async () => {
        try {
          await this.resolveCarriedOver(roomId);
        } finally {
          this.roundsInFlight.delete(roomId);
          this.pushGame(roomId);
          this.maybeResolveRound(roomId);
        }
      });
      return;
    }
    const participants = this.roundParticipants(roomId);
    if (!participants.length) return;
    const waiting = this.db
      .prepare("SELECT character_id, game_minutes FROM actions WHERE room_id = ? AND status = 'waiting' AND mode = 'round' AND round >= ?")
      .all(roomId, room.round_no) as { character_id: number; game_minutes: number | null }[];
    const ready = participants.every((c) => waiting.some((a) => a.character_id === c.id && a.game_minutes !== null));
    if (!ready) {
      // 不计时的对局在等刚断线的人：宽限期过了他还没回来，这一轮就不等他了
      this.recheckAfterGrace(roomId);
      // 浏览器推送（V0.8.0）：这一轮已经有人交了，告诉它还在等谁（还没交的人）
      if (this.onRoundWaiting && waiting.length) {
        const missing = participants.filter((c) => !waiting.some((a) => a.character_id === c.id)).map((c) => c.userId);
        try {
          if (missing.length) this.onRoundWaiting(roomId, missing);
        } catch (err) {
          console.error('浏览器推送出错：', err);
        }
      }
      return;
    }
    this.roundsInFlight.add(roomId);
    this.enqueue(roomId, async () => {
      try {
        await this.resolveRound(roomId);
      } finally {
        this.roundsInFlight.delete(roomId);
        this.pushGame(roomId);
        // 结算期间有人受伤倒下、行动失败，或者有人已经交了下一轮：再检查一次
        this.maybeResolveRound(roomId);
      }
    });
  }

  /**
   * 回合模式下这一轮已经有人交了行动、还在等谁（还没交的参与者的账号）；没有在等人是 null。
   * 只读，不改任何东西（V0.8.0：浏览器推送等了一会儿以后用它再问一次）。
   */
  roundWaitingFor(roomId: number): { round: number; userIds: number[] } | null {
    if (this.stopped || this.roundsInFlight.has(roomId) || this.ai.switchedOff) return null;
    const room = loadRoom(this.db, roomId);
    if (!room || room.status !== 'running' || this.rooms.presence(roomId).mode !== 'round') return null;
    const submitted = new Set(
      (
        this.db
          .prepare("SELECT character_id FROM actions WHERE room_id = ? AND status = 'waiting' AND mode = 'round' AND round >= ?")
          .all(roomId, room.round_no) as { character_id: number }[]
      ).map((a) => a.character_id),
    );
    if (!submitted.size) return null;
    const userIds = this.roundParticipants(roomId)
      .filter((c) => !submitted.has(c.id))
      .map((c) => c.userId);
    return userIds.length ? { round: room.round_no, userIds } : null;
  }

  private async resolveRound(roomId: number) {
    const room = loadRoom(this.db, roomId);
    if (!room || room.status !== 'running' || this.rooms.presence(roomId).mode !== 'round') return;
    const actions = this.db
      .prepare(
        `SELECT * FROM actions WHERE room_id = ? AND status = 'waiting' AND mode = 'round' AND round >= ? AND game_minutes IS NOT NULL
         ORDER BY submitted_at, id`,
      )
      .all(roomId, room.round_no) as ActionRow[];
    if (!actions.length) return;
    this.orderByInitiative(room, actions);
    // 同一轮的行动同时开始；按提交的先后一个个结算，后结算的能看到先结算的结果（在打仗的按先后手，见 orderByInitiative）。
    // 开始结算时轮次就加一：这一轮的行动记着这一轮的编号，中途被打断、放回去的（编号比现在小）以后接着结算
    const start = Math.floor(this.gameNow(room));
    transaction(this.db, () => {
      const claim = this.db.prepare("UPDATE actions SET status = 'resolving', game_start = ?, round = ? WHERE id = ? AND status = 'waiting'");
      for (const a of actions) claim.run(start, room.round_no, a.id);
      this.db.prepare('UPDATE rooms SET round_no = round_no + 1 WHERE id = ?').run(roomId);
    });
    this.pushGame(roomId);
    await this.resolveClaimed(roomId, actions.map((a) => a.id));
  }

  /**
   * 规则第二版、5E：同一场战斗里的人，这一轮按开打时掷的先后手结算（不按谁先交）。
   * 5E 这一轮已经行动过的人排到还没行动的人后面（他再行动就是下一轮了）。
   * 只在这场战斗的行动占着的那几个位置里重新排，别处的行动顺序不变。
   */
  private orderByInitiative(room: RoomRow, actions: ActionRow[]) {
    const world = parseWorld(room.world);
    if (!Object.keys(world.combats).length && !Object.keys(world.fights5e).length) return;
    const where = new Map(loadCharacters(this.db, room.id).map((c) => [c.id, c.location]));
    const groups = new Map<string, number[]>();
    const rank = new Map<number, number>();
    actions.forEach((a, i) => {
      const location = where.get(a.character_id);
      const five = location ? world.fights5e[location] : undefined;
      const fight = location ? (world.combats[location] ?? five) : undefined;
      const ref = `c${a.character_id}`;
      const at = fight ? fight.order.findIndex((o) => o.id === ref) : -1;
      if (!location || at < 0) return;
      rank.set(a.id, at + (five?.acted.includes(ref) ? fight!.order.length : 0));
      groups.set(location, [...(groups.get(location) ?? []), i]);
    });
    for (const positions of groups.values()) {
      const sorted = positions.map((i) => actions[i]).sort((x, y) => rank.get(x.id)! - rank.get(y.id)!);
      positions.forEach((pos, k) => (actions[pos] = sorted[k]));
    }
  }

  /** 上一轮被打断、放回去等着的行动（轮次编号比现在小）。 */
  private carriedOver(roomId: number, roundNo: number): ActionRow[] {
    return this.db
      .prepare(
        `SELECT * FROM actions WHERE room_id = ? AND status = 'waiting' AND mode = 'round' AND round < ? AND game_minutes IS NOT NULL
         ORDER BY round, submitted_at, id`,
      )
      .all(roomId, roundNo) as ActionRow[];
  }

  /** 接着结算上一轮被打断的行动：开始时间还是那一轮的，不再等别人，也不算新的一轮。 */
  private async resolveCarriedOver(roomId: number) {
    const room = loadRoom(this.db, roomId);
    if (!room || room.status !== 'running' || this.rooms.presence(roomId).mode !== 'round') return;
    const actions = this.carriedOver(roomId, room.round_no);
    if (!actions.length) return;
    transaction(this.db, () => {
      const claim = this.db.prepare("UPDATE actions SET status = 'resolving' WHERE id = ? AND status = 'waiting'");
      for (const a of actions) claim.run(a.id);
    });
    this.pushGame(roomId);
    await this.resolveClaimed(roomId, actions.map((a) => a.id));
  }

  /**
   * 一个个结算已经认领的回合行动。中途对局结束了就停下（剩下的由结局处理）；
   * 中途管理员关了 AI：剩下的放回去等着（还记着原来的轮次和开始时间），打开以后接着结算。
   */
  private async resolveClaimed(roomId: number, ids: number[]) {
    for (let i = 0; i < ids.length; i++) {
      if (this.stopped) return;
      const current = loadRoom(this.db, roomId);
      if (!current || current.status === 'ended') break;
      if (this.ai.switchedOff) {
        const release = this.db.prepare("UPDATE actions SET status = 'waiting', due_at = COALESCE(due_at, ?) WHERE id = ? AND status = 'resolving'");
        transaction(this.db, () => {
          for (const id of ids.slice(i)) release.run(this.now(), id);
        });
        break;
      }
      const action = this.loadAction(ids[i]);
      if (!action) continue;
      await this.resolveOne(action.id, action.game_start ?? Math.floor(this.gameNow(current)));
      this.pushGame(roomId);
      // 5E（V0.9.0）：这次结算里打起来了（或者有人走进了打仗的地方），这一轮剩下的行动按新掷的先攻重新排
      const after = loadRoom(this.db, roomId);
      if (after && i + 1 < ids.length && Object.keys(parseWorld(after.world).fights5e).length) {
        const rest = ids.slice(i + 1).map((id) => this.loadAction(id)).filter((a): a is ActionRow => !!a);
        this.orderByInitiative(after, rest);
        ids.splice(i + 1, ids.length - (i + 1), ...rest.map((a) => a.id));
      }
    }
  }

  // ==================== 结算 ====================

  private loadAction(id: number): ActionRow | undefined {
    return this.db.prepare('SELECT * FROM actions WHERE id = ?').get(id) as ActionRow | undefined;
  }

  /** 这个角色的宠物这一局已经出过手了（撤回那次结算，掷骰的记录删掉，机会就回来了）。 */
  private petHelpUsed(roomId: number, characterId: number): boolean {
    return !!this.db.prepare('SELECT 1 FROM rolls WHERE room_id = ? AND character_id = ? AND pet_help = 1').get(roomId, characterId);
  }

  /** 这一局每个角色的主人用的骰子皮肤：角色编号 → 皮肤。 */
  private diceSkins(roomId: number): Map<number, string | null> {
    return new Map(
      (
        this.db
          .prepare('SELECT c.id, u.dice_skin FROM characters c JOIN players p ON p.id = c.player_id JOIN users u ON u.id = p.user_id WHERE c.room_id = ?')
          .all(roomId) as { id: number; dice_skin: string | null }[]
      ).map((r) => [r.id, r.dice_skin]),
    );
  }

  /** 这一局的主持风格。 */
  roomStyle(roomId: number): RoomStyle {
    return parseStyle(loadRoom(this.db, roomId)?.style);
  }

  /** 房主改主持风格（之后的结算按新的来）。 */
  setRoomStyle(roomId: number, style: RoomStyle) {
    this.db.prepare('UPDATE rooms SET style = ? WHERE id = ?').run(JSON.stringify(style), roomId);
    this.pushGame(roomId);
  }

  /** 场外问答用：这个玩家看得到的最近几段经历（结算和私密信息），从早到晚。 */
  private recentNarration(roomId: number, limit: number, viewer: { userId: number; characterId: number }): RecentEntry[] {
    const rows = this.db
      .prepare(
        `SELECT l.id, l.text, l.data, l.game_time FROM log_entries l
         WHERE l.room_id = ? AND l.kind = 'narration' AND json_extract(l.data, '$.type') IN ('resolution', 'private', 'say', 'give') AND ${LOG_VISIBLE}
         ORDER BY l.id DESC LIMIT ?`,
      )
      .all(roomId, viewer.userId, viewer.characterId, limit) as NarrationRow[];
    return rows.reverse().map((r) => ({ text: r.text, gameTime: r.game_time, data: r.data ? (JSON.parse(r.data) as StoredLogData) : null }));
  }

  /**
   * 还没并进主持人笔记的经历（结算和私密信息），从早到晚，带上每段有哪些角色知道，
   * 免得把别人私下知道的事写进这个角色的叙述。newest 表示只要最新的几条，oldest 表示只要最早的几条。
   */
  private unsummarized(roomId: number, afterId: number, pick: { newest: number } | { oldest: number }): (RecentEntry & { id: number })[] {
    const newest = 'newest' in pick;
    const rows = this.db
      .prepare(
        `SELECT l.id, l.text, l.data, l.game_time FROM log_entries l
         WHERE l.room_id = ? AND l.id > ? AND l.kind = 'narration' AND json_extract(l.data, '$.type') IN ('resolution', 'private', 'say', 'give')
         ORDER BY l.id ${newest ? 'DESC' : 'ASC'} LIMIT ?`,
      )
      .all(roomId, afterId, newest ? pick.newest : pick.oldest) as NarrationRow[];
    if (newest) rows.reverse();
    const audienceOf = this.db.prepare(
      "SELECT c.name FROM knowledge k JOIN characters c ON c.id = k.character_id WHERE k.content_type = 'log' AND k.content_id = ? ORDER BY c.id",
    );
    return rows.map((r) => ({
      id: r.id,
      text: r.text,
      gameTime: r.game_time,
      data: r.data ? (JSON.parse(r.data) as StoredLogData) : null,
      audience: (audienceOf.all(r.id) as { name: string }[]).map((x) => x.name),
    }));
  }

  /** 主持AI的记忆：更早的剧情笔记，加上笔记之后的经历原文。 */
  private dmMemory(roomId: number): { summary: string; recent: RecentEntry[] } {
    const room = this.db.prepare('SELECT story_summary, summary_until_log_id FROM rooms WHERE id = ?').get(roomId) as
      | { story_summary: string; summary_until_log_id: number }
      | undefined;
    if (!room) return { summary: '', recent: [] };
    const recent = this.unsummarized(roomId, room.summary_until_log_id, { newest: UNSUMMARIZED_MAX }).map(({ id: _id, ...e }) => e);
    return { summary: room.story_summary, recent };
  }

  /**
   * 结算完以后：没并进笔记的经历攒够了，就在后台把最近 RECENT_FOR_DM 条以外的并进笔记。
   * 不占结算的队列；写笔记期间的结算照样用旧笔记加上全部原文，不会漏。失败了过一阵再试。
   */
  private maybeSummarizeStory(roomId: number) {
    if (this.stopped || this.storySummariesInFlight.has(roomId) || !this.ai.statusFor('summary', roomId).ready) return;
    if ((this.storySummaryRetryAt.get(roomId) ?? 0) > this.now()) return;
    const room = this.db.prepare('SELECT status, story_summary, summary_until_log_id FROM rooms WHERE id = ?').get(roomId) as
      | { status: RoomStatus; story_summary: string; summary_until_log_id: number }
      | undefined;
    if (!room || room.status === 'ended' || room.status === 'preparing') return;
    const { n } = this.db
      .prepare(
        `SELECT COUNT(*) AS n FROM log_entries l
         WHERE l.room_id = ? AND l.id > ? AND l.kind = 'narration' AND json_extract(l.data, '$.type') IN ('resolution', 'private', 'say', 'give')`,
      )
      .get(roomId, room.summary_until_log_id) as { n: number };
    if (n < RECENT_FOR_DM + SUMMARY_BATCH) return;
    const entries = this.unsummarized(roomId, room.summary_until_log_id, { oldest: Math.min(n - RECENT_FOR_DM, SUMMARY_BATCH_MAX) });
    const until = entries[entries.length - 1].id;

    this.storySummariesInFlight.add(roomId);
    const epoch = this.storyEpoch.get(roomId) ?? 0;
    this.track(
      (async () => {
        try {
          const summary = await summarizeStory({
            ai: this.ai,
            previous: room.story_summary,
            entries: entries.map(({ id: _id, ...e }) => e),
            companions: roomCompanions(this.db, roomId),
            // 大家共用的调用，不算到某一个玩家头上
            meta: { roomId },
            signal: this.abort.signal,
          });
          if (this.stopped || (this.storyEpoch.get(roomId) ?? 0) !== epoch) return;
          this.db
            .prepare('UPDATE rooms SET story_summary = ?, summary_until_log_id = ? WHERE id = ? AND summary_until_log_id = ?')
            .run(summary, until, roomId, room.summary_until_log_id);
          this.storySummaryRetryAt.delete(roomId);
        } catch (err) {
          if (this.stopped) return;
          this.storySummaryRetryAt.set(roomId, this.now() + SUMMARY_RETRY_MS);
          console.error(`对局 ${roomId} 写剧情笔记失败：`, err instanceof Error ? err.message : err);
          if (err instanceof AiRefusal) {
            this.safety.refusal({
              userId: null,
              roomId,
              source: 'summary',
              content: entries.map((e) => e.text).join('\n\n'),
              category: err.category,
              soloAuthor: false,
            });
          }
        } finally {
          this.storySummariesInFlight.delete(roomId);
        }
      })(),
    );
  }

  /** 结算一个行动：调用主持AI，成功后一次性写入所有变化。payer：花费记给谁（不写就是行动的主人）。 */
  private async resolveOne(actionId: number, gameStart: number, payer: number | null = null): Promise<void> {
    const action = this.loadAction(actionId);
    if (!action || action.status !== 'resolving') return;
    const roomId = action.room_id;
    // 协助别人的行动：跟着那个行动一起结算，不单独调用 AI
    if (action.assist_of !== null) {
      this.settleAssist(action);
      return;
    }
    try {
      const room = loadRoom(this.db, roomId);
      // 给主持 AI 用、结算用的剧本：交给 AI 演的身份变成标着「AI 队友」的 NPC（V0.8.0，数据库里存的剧本不变）
      const stored = loadPlayScenario(this.db, roomId);
      if (!room || !stored) return;
      const scenario = stored.scenario;
      const characters = loadCharacters(this.db, roomId);
      const actor = characters.find((c) => c.id === action.character_id);
      if (!actor) return;

      const blocker = blockerFor(actor, scenario.stress);
      if (blocker) {
        this.db.prepare("UPDATE actions SET status = 'withdrawn', last_error = ? WHERE id = ?").run(blocker, actionId);
        this.rooms.log({ roomId, kind: 'system', text: `你的行动取消了：${blocker}。`, targetUserId: actor.userId });
        // 协助这个行动的人：这一次的协助也取消，他们可以重新交行动
        this.dropOrphanAssists(roomId);
        return;
      }
      if (this.ai.switchedOff) throw new AiSwitchedOff();
      const ready = this.ai.statusFor('resolve', roomId);
      if (!ready.ready) throw new AiError(ready.message ?? 'AI 暂时用不了', false);

      const world = parseWorld(room.world);
      const clues = foundClues(this.db, roomId);
      const minutes = action.game_minutes ?? DEFAULT_MINUTES;
      const gameEnd = gameStart + minutes;
      const style = parseStyle(room.style);
      const input = {
        scenario,
        world,
        characters,
        clueHolders: new Map(clues.map((c) => [c.key, new Set(c.holders)])),
        actorId: actor.id,
        gameEnd,
        rng: this.rng,
        allowDeath: style.death,
        // 宠物出手（V0.6.0）：交行动时勾了、带着宠物、这一局还没帮过
        petHelp:
          action.pet_help === 1 && actor.pet && !this.petHelpUsed(roomId, actor.id)
            ? { characterId: actor.id, pet: actor.pet.name, attributes: petGrowth(this.db, actor.userId) }
            : null,
        skins: this.diceSkins(roomId),
      };
      // 规则第二版（V0.7.0）：生命值、战斗、道具、宝物、技能、奇遇；5E 规则（V0.9.0）：d20、法术、职业能力、怪物
      const ctx =
        scenario.rules === '5e'
          ? new Rules5eContext({ ...input, rules: rules5e(), srd: monsterData })
          : scenario.rules === 2
            ? new Rules2Context({
                ...input,
                players: characters.length,
                pick: (n) => this.rng(n) - 1,
                ownedLegendary: new Map(characters.map((c) => [c.userId, this.cards?.ownedLegendary(c.userId) ?? new Set<string>()])),
              })
            : new ResolutionContext(input);
      // 同一地点别人还在等结果的行动（悄悄做的不给主持人看：这次的叙述别人也看得到，免得写进去）
      const pending = (
        this.db
          .prepare(
            `SELECT c.name, a.content, c.location FROM actions a JOIN characters c ON c.id = a.character_id
             WHERE a.room_id = ? AND a.id != ? AND a.status IN ('waiting', 'resolving') AND COALESCE(a.assist_of, 0) != ? AND a.secret = 0`,
          )
          .all(roomId, actionId, actionId) as { name: string; content: string; location: string | null }[]
      )
        .filter((p) => p.location && p.location === actor.location)
        .map((p) => ({ characterName: p.name, content: p.content }));
      // 在场协助这个行动的角色
      const assistants = (
        this.db
          .prepare(
            `SELECT c.id, c.name FROM actions a JOIN characters c ON c.id = a.character_id
             WHERE a.assist_of = ? AND a.status IN ('waiting', 'resolving') AND c.dead = 0 ORDER BY a.id`,
          )
          .all(actionId) as { id: number; name: string }[]
      ).filter((a) => characters.find((c) => c.id === a.id)?.location === actor.location);

      const memory = this.dmMemory(roomId);
      // 5E：结算开始时程序先处理了一些事（到时间的效果、死亡豁免），主持人看到的是处理完的样子
      const five = ctx instanceof Rules5eContext ? ctx : null;
      const context = buildDmContext({
        scenario,
        world: five ? five.world : world,
        characters: five ? [...five.characters.values()] : characters,
        turnNotes: five?.turnNotes,
        clues,
        actor: five ? five.characters.get(actor.id)! : actor,
        action: { content: action.content, gameStart, minutes, secret: action.secret === 1 },
        pending,
        assistants,
        summary: memory.summary,
        recent: memory.recent,
        companions: stored.companions,
      });
      const meta = { roomId, actionId, userId: this.userOfCharacter(actor.id), payer };
      const narration = await runDm({ ai: this.ai, scenario, context, ctx, meta, style, signal: this.abort.signal });
      if (this.stopped) return;
      // 结算做完：倒地的人倒数、失控的人回过神、这里的仗过了一轮
      if (ctx instanceof Rules2Context || ctx instanceof Rules5eContext) ctx.finish();
      this.commit(action, scenario, gameStart, gameEnd, narration, ctx);
      this.maybeSummarizeStory(roomId);
    } catch (err) {
      if (this.stopped) return;
      this.fail(action, err);
    }
  }

  private commit(action: ActionRow, scenario: Scenario, gameStart: number, gameEnd: number, narration: string, ctx: ResolutionContext) {
    const roomId = action.room_id;
    const now = this.now();
    const logIds: number[] = [];
    const ok = transaction(this.db, () => {
      const room = loadRoom(this.db, roomId);
      const current = this.loadAction(action.id);
      // 结算期间对局被结束、删除，或者行动被处理掉了：这次结算作废
      if (!room || !current || current.status !== 'resolving' || room.status === 'ended' || room.status === 'preparing') return false;

      // 撤回用的快照：结算前的样子；下面新加的记录、线索、知情也一条条记下
      const memo = this.db.prepare('SELECT story_summary, summary_until_log_id FROM rooms WHERE id = ?').get(roomId) as {
        story_summary: string;
        summary_until_log_id: number;
      };
      const snapshot: ResolutionSnapshot = {
        actionId: action.id,
        characters: characterSnapshots(this.db, roomId),
        world: room.world,
        roundNo: room.round_no,
        status: room.status,
        clockBefore: this.gameNow(room),
        clockAfter: this.gameNow(room),
        summary: { text: memo.story_summary, until: memo.summary_until_log_id },
        logs: [],
        clues: [],
        knowledge: [],
        clueRows: [],
        knowledgeRows: [],
        ended: false,
        withdrawn: [],
      };

      const addRoll = this.db.prepare(
        `INSERT INTO rolls (room_id, action_id, character_id, attribute, modifier, die1, die2, total, outcome, hidden, detail, pet_help, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const r of ctx.rolls) {
        addRoll.run(
          roomId,
          action.id,
          r.characterId,
          r.attribute,
          r.modifier,
          r.result.dice[0],
          r.result.dice[1],
          r.result.total,
          r.result.outcome,
          r.hidden ? 1 : 0,
          JSON.stringify(r.detail),
          r.petHelp ? 1 : 0,
          now,
        );
      }

      for (const id of ctx.changed) {
        const c = ctx.characters.get(id);
        if (c) saveCharacter(this.db, c);
      }
      // 这次结算改过的角色，改完以后的样子：撤回时对得上才退回去（之后又交换过东西、房主改过数值的，就不能自动撤回了）
      snapshot.after = characterSnapshots(this.db, roomId).filter((c) => ctx.changed.has(c.id));

      const at = Math.floor(gameEnd);
      for (const [key, ids] of ctx.clueGrants) {
        const found = this.db
          .prepare('INSERT OR IGNORE INTO clues (room_id, clue_key, found_by_character_id, found_game_time, created_at) VALUES (?, ?, ?, ?, ?)')
          .run(roomId, key, [...ids][0], at, now);
        if (found.changes) {
          snapshot.clues.push(Number(found.lastInsertRowid));
          snapshot.clueRows!.push({ id: Number(found.lastInsertRowid), key });
        }
        const clue = this.db.prepare('SELECT id FROM clues WHERE room_id = ? AND clue_key = ?').get(roomId, key) as { id: number };
        const know = this.db.prepare(
          "INSERT OR IGNORE INTO knowledge (room_id, content_type, content_id, character_id, game_time, created_at) VALUES (?, 'clue', ?, ?, ?, ?)",
        );
        for (const id of ids) {
          const added = know.run(roomId, clue.id, id, at, now);
          if (added.changes) {
            snapshot.knowledge.push(Number(added.lastInsertRowid));
            snapshot.knowledgeRows!.push({ id: Number(added.lastInsertRowid), clueId: clue.id, characterId: id });
          }
        }
      }

      if (ctx.worldChanged) this.db.prepare('UPDATE rooms SET world = ? WHERE id = ?').run(JSON.stringify(ctx.world), roomId);

      const actor = ctx.characters.get(ctx.actorId)!;
      const secret = action.secret === 1;
      const data: StoredLogData = {
        type: 'resolution',
        actor: actor.name,
        action: action.content,
        gameStart,
        gameEnd: at,
        rolls: ctx.cards,
        clues: [...ctx.clueGrants].map(([key, ids]) => ({
          key,
          title: scenario.clues.find((c) => c.key === key)?.title ?? key,
          to: [...ids],
        })),
        changes: ctx.changes,
        ...(secret ? { secret: true } : {}),
        ...((ctx instanceof Rules2Context || ctx instanceof Rules5eContext) && ctx.events.length ? { events: ctx.events } : {}),
        ...(ctx instanceof Rules2Context && ctx.itemUses.length ? { itemUses: ctx.itemUses } : {}),
      };
      // 用掉的道具（V0.7.0）：从账号的背包里扣
      if (ctx instanceof Rules2Context && ctx.itemUses.length) this.cards?.consumeItems(ctx.itemUses, (id) => this.userOfCharacter(id));
      // 悄悄做的：叙述只给行动的人自己（在场的人察觉到了什么，主持人用 private_message 单独告诉他们）
      const audience = secret ? [actor.id] : ctx.audience();
      logIds.push(insertLog(this.db, { roomId, kind: 'narration', text: narration, audience, data, gameTime: at, now }));
      for (const m of ctx.privateMessages) {
        logIds.push(
          insertLog(this.db, { roomId, kind: 'narration', text: m.text, audience: [m.characterId], data: { type: 'private', gameTime: at }, gameTime: at, now }),
        );
      }
      // 走到了别处（不是悄悄走的）：原地没跟着走的人看不到叙述，只告诉他们他往哪去了（V0.7.1）
      const behind = secret ? null : ctx.leftBehind();
      if (behind) {
        const text = !behind.to
          ? `${actor.name}离开了「${behind.from}」。`
          : `${actor.name}离开了「${behind.from}」，往「${behind.to}」${behind.far ? '那边' : ''}去了。`;
        logIds.push(insertLog(this.db, { roomId, kind: 'narration', text, audience: behind.ids, data: { type: 'private', gameTime: at }, gameTime: at, now }));
      }
      // 结果落到了看不到这段叙述的人身上（悄悄做的；走到了别处、留在原地的人）：受伤、拿到或丢了东西、被挪了地方、知道了线索，
      // 单独告诉每个人他自己身上的变化（不带行动的内容）；主持人没单独跟他说过的，加一句还不知道是怎么回事
      const shown = new Set(audience);
      {
        const affected = new Map<number, { changes: string[]; clues: string[] }>();
        const entry = (id: number) => affected.get(id) ?? affected.set(id, { changes: [], clues: [] }).get(id)!;
        for (const ch of ctx.changes) if (!shown.has(ch.characterId)) entry(ch.characterId).changes.push(ch.text);
        for (const [key, ids] of ctx.clueGrants) {
          const title = scenario.clues.find((c) => c.key === key)?.title ?? key;
          for (const id of ids) if (!shown.has(id)) entry(id).clues.push(title);
        }
        for (const [id, what] of affected) {
          const told = ctx.privateMessages.some((m) => m.characterId === id);
          // 和叙述一样用第三人称、写角色的名字
          const parts: string[] = [];
          if (what.changes.length) parts.push(`身上起了变化：${what.changes.join('；')}`);
          if (what.clues.length) parts.push(`${what.changes.length ? '也' : ''}知道了：${what.clues.map((t) => `「${t}」`).join('、')}`);
          const text = `${ctx.characters.get(id)?.name ?? '角色'}${parts.join('。')}。${told ? '' : '还不知道是怎么回事。'}`;
          logIds.push(insertLog(this.db, { roomId, kind: 'narration', text, audience: [id], data: { type: 'private', gameTime: at }, gameTime: at, now }));
        }
      }

      this.db
        .prepare("UPDATE actions SET status = 'done', resolved_at = ?, game_start = ?, last_error = NULL, result = ? WHERE id = ?")
        .run(now, gameStart, JSON.stringify({ narration, trace: ctx.trace, ...(ctx.dmNotes.length ? { notes: ctx.dmNotes } : {}) }), action.id);
      // 协助这个行动的人：他们这一次的行动也就完成了
      this.db
        .prepare("UPDATE actions SET status = 'done', resolved_at = ?, game_start = ?, last_error = NULL, result = ? WHERE assist_of = ? AND status IN ('waiting', 'resolving')")
        .run(now, gameStart, JSON.stringify({ assisted: action.id }), action.id);
      this.advanceClock(roomId, gameEnd);
      snapshot.logs = [...logIds];
      snapshot.clockAfter = this.gameNow(loadRoom(this.db, roomId)!);
      saveSnapshot(this.db, roomId, snapshot, now);
      return true;
    });
    if (!ok) return;
    for (const id of logIds) this.rooms.publishLog(id);
    // 地下城里碰上了奇遇（V0.7.0）：隐藏成就
    for (const ch of ctx.changes) {
      if (!ch.text.startsWith('奇遇：')) continue;
      const userId = this.userOfCharacter(ch.characterId);
      if (userId !== null) this.cards?.achievements?.unlock(userId, 'qiyu');
    }
    // 成就（V0.6.0）：大成功、大失败、宠物转败为胜
    if (ctx.rolls.length) {
      try {
        this.onResolved?.(ctx.rolls.map((r) => ({ characterId: r.characterId, outcome: r.result.outcome, hidden: r.hidden, petSaved: !!r.petSaved })));
      } catch (err) {
        console.error('结算以后算成就出错：', err);
      }
    }
    if (ctx.ending) this.finishGame(roomId, action.id);
    else if ([...ctx.changed].some((id) => ctx.characters.get(id)?.dead)) {
      // 有角色死了：参与游戏的人变了，回合模式要重新判断
      this.rooms.broadcastPresence(roomId);
      this.syncRoom(roomId);
    } else if (ctx.changed.size) {
      // 有人倒下（濒死、失控）以后不再算这一轮的参与者，等他的人可以继续了
      this.maybeResolveRound(roomId);
    }
    this.pushGame(roomId);
  }

  private fail(action: ActionRow, err: unknown) {
    if (err instanceof AiRefusal) {
      this.refuse(action.id, err);
      return;
    }
    if (err instanceof AiSwitchedOff) {
      // 管理员关掉了 AI：不算失败，也不算重试次数，放回去等着，打开以后接着结算
      this.db
        .prepare("UPDATE actions SET status = 'waiting', due_at = COALESCE(due_at, ?) WHERE id = ? AND status = 'resolving'")
        .run(this.now(), action.id);
      this.pushGame(action.room_id);
      return;
    }
    const message = err instanceof AiError ? err.message : '服务器出错了';
    if (err instanceof AiError) console.error(`结算行动 ${action.id} 失败：${message}`);
    else console.error(`结算行动 ${action.id} 出错：`, err);
    const retryable = err instanceof AiError && err.retryable;
    const current = this.loadAction(action.id);
    if (!current || current.status !== 'resolving') return;
    const attempts = current.attempts + 1;
    if (retryable && current.mode === 'timed' && attempts < MAX_ATTEMPTS) {
      const due = this.now() + RETRY_MINUTES[attempts - 1] * 60_000;
      this.db
        .prepare("UPDATE actions SET status = 'waiting', attempts = ?, last_error = ?, due_at = ? WHERE id = ?")
        .run(attempts, message, due, action.id);
      // 结算期间可能已经全员到齐、转成了回合模式：按现在的模式放回去
      this.syncRoom(action.room_id);
      return;
    }
    this.db.prepare("UPDATE actions SET status = 'failed', attempts = ?, last_error = ? WHERE id = ?").run(attempts, message, action.id);
    this.dropOrphanAssists(action.room_id);
    // 这个角色不再算这一轮的参与者，其他人不用再等他
    this.maybeResolveRound(action.room_id);
    const owner = this.userOfCharacter(action.character_id);
    if (owner !== null) {
      this.rooms.log({
        roomId: action.room_id,
        kind: 'system',
        text: `你的行动没能结算：${message}。可以在行动框里点“重试”，或者撤回后重新写。`,
        targetUserId: owner,
      });
    }
  }

  /**
   * 行动被 Anthropic 的安全机制拒绝了（估时或结算时都可能）。
   * 同样的内容再发通常还会被拒，而且拒绝算在整个 API 账号上，所以标成失败，不自动重试，也不让手动重试，只能撤回。
   */
  private refuse(actionId: number, err: AiRefusal) {
    console.error(`行动 ${actionId} 被安全机制拒绝了（类别：${err.category ?? '没有类别'}）`);
    const updated = this.db
      .prepare(
        "UPDATE actions SET status = 'failed', refused = 1, attempts = attempts + 1, last_error = ? WHERE id = ? AND status IN ('waiting', 'resolving')",
      )
      .run(err.message, actionId);
    if (!updated.changes) return;
    const action = this.loadAction(actionId)!;
    this.dropOrphanAssists(action.room_id);
    // 这个角色不再算这一轮的参与者，其他人不用再等他
    this.maybeResolveRound(action.room_id);
    const owner = this.userOfCharacter(action.character_id);
    if (owner !== null) {
      this.rooms.log({
        roomId: action.room_id,
        kind: 'system',
        text: `${err.message}，不能重试。请撤回以后换个写法。`,
        targetUserId: owner,
      });
    }
    this.pushGame(action.room_id);
    // 单人局里的内容只来自他一个人：封号；多人局里发给 AI 的内容混着别人的：标给管理员看
    this.safety.refusal({
      userId: owner,
      roomId: action.room_id,
      source: 'action',
      content: action.content,
      category: err.category,
      soloAuthor: this.rooms.memberIds(action.room_id).length === 1,
    });
  }

  /**
   * 协助的行动：跟着要协助的那个行动走。那个行动已经结算了，这个就算完成；
   * 那个行动还在等（极少见：模式切换时先被认领了），放回去接着等；那个行动没有进行，这个也取消。
   */
  private settleAssist(action: ActionRow) {
    const target = action.assist_of === null ? undefined : this.loadAction(action.assist_of);
    if (target?.status === 'done') {
      this.db
        .prepare("UPDATE actions SET status = 'done', resolved_at = ?, last_error = NULL, result = ? WHERE id = ? AND status = 'resolving'")
        .run(this.now(), JSON.stringify({ assisted: target.id }), action.id);
    } else if (target && (target.status === 'waiting' || target.status === 'resolving')) {
      this.db.prepare("UPDATE actions SET status = 'waiting' WHERE id = ? AND status = 'resolving'").run(action.id);
    } else {
      this.dropOrphanAssists(action.room_id);
    }
    this.pushGame(action.room_id);
  }

  /** 要协助的行动被撤回、没能结算：协助它的行动也取消，告诉协助的人可以重新交行动。 */
  private dropOrphanAssists(roomId: number) {
    const orphans = this.db
      .prepare(
        `SELECT a.id, a.character_id FROM actions a JOIN actions t ON t.id = a.assist_of
         WHERE a.room_id = ? AND a.status IN ('waiting', 'resolving', 'failed') AND t.status IN ('withdrawn', 'failed')`,
      )
      .all(roomId) as { id: number; character_id: number }[];
    if (!orphans.length) return;
    const drop = this.db.prepare("UPDATE actions SET status = 'withdrawn', last_error = ? WHERE id = ?");
    for (const a of orphans) {
      drop.run('要协助的行动没有进行', a.id);
      const owner = this.userOfCharacter(a.character_id);
      if (owner !== null) {
        this.rooms.log({ roomId, kind: 'system', text: '你要协助的行动被撤回了，或者没能结算：你这一次的协助也取消了，可以重新交行动。', targetUserId: owner });
      }
    }
    this.pushGame(roomId);
    this.maybeResolveRound(roomId);
  }

  /** 账号被封禁：撤回他在各局里还在等的行动（已经在结算的照样结算完）。 */
  withdrawUserActions(userId: number) {
    const mine = `SELECT c.id FROM characters c JOIN players p ON p.id = c.player_id WHERE p.user_id = ?`;
    const rooms = this.db
      .prepare(`SELECT DISTINCT room_id FROM actions WHERE status IN ('waiting', 'failed') AND character_id IN (${mine})`)
      .all(userId) as { room_id: number }[];
    if (!rooms.length) return;
    this.db
      .prepare(`UPDATE actions SET status = 'withdrawn', last_error = '账号被封禁' WHERE status IN ('waiting', 'failed') AND character_id IN (${mine})`)
      .run(userId);
    for (const r of rooms) {
      this.dropOrphanAssists(r.room_id);
      this.pushGame(r.room_id);
      this.maybeResolveRound(r.room_id);
    }
    this.scheduleNext();
  }

  /** 管理员打开或关掉 AI 以后：通知各局刷新；打开时把搁下的估时、结算接着做。 */
  onAiSwitch(enabled: boolean) {
    const rooms = this.db.prepare("SELECT id, status FROM rooms WHERE status != 'ended'").all() as { id: number; status: RoomStatus }[];
    if (enabled) {
      for (const a of this.db.prepare("SELECT id FROM actions WHERE status = 'waiting' AND game_minutes IS NULL").all() as { id: number }[]) {
        this.startEstimate(a.id);
      }
      this.tick();
      for (const r of rooms) if (r.status === 'running') this.maybeResolveRound(r.id);
    }
    for (const r of rooms) this.pushGame(r.id);
  }

  private userOfCharacter(characterId: number): number | null {
    const row = this.db
      .prepare('SELECT p.user_id FROM characters c JOIN players p ON p.id = c.player_id WHERE c.id = ?')
      .get(characterId) as { user_id: number } | undefined;
    return row?.user_id ?? null;
  }

  // ==================== 对局状态切换 ====================

  /** 开始、暂停、继续、结束对局。by 是谁做的（房主、管理员、站长），写进记录里；actorId 是按按钮的人。 */
  changeStatus(roomId: number, next: 'running' | 'paused' | 'ended', by: string = '房主', actorId: number | null = null): RoomStatus {
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (next === 'running' && room.frozen_at !== null) throw new HttpError(409, FROZEN_MESSAGE);
    let started = false;
    if (next === 'running' && room.status === 'preparing') {
      this.startGame(room, by);
      started = true;
    } else if (next === 'running' && room.status === 'paused') this.resume(room, by);
    else if (next === 'paused' && room.status === 'running') this.pause(room, by);
    else if (next === 'ended' && room.status !== 'ended') this.endByHost(room, by);
    else throw new HttpError(409, '现在不能这样切换');
    this.hub().toRoom(roomId, 'room', { roomId, status: next });
    this.rooms.notifyRoomsChanged(roomId);
    this.pushGame(roomId);
    if (started) this.onGameStarted?.(roomId, by, actorId);
    return next;
  }

  /**
   * 开局：房主（或管理员）随时可以开，不用等所有人都打开页面、都建好角色；至少要有一个角色。
   * 人数比剧本建议的少也能开（网页上会提醒）；还没建角色的人开局以后照样能建，建好就加入故事。
   */
  private startGame(room: RoomRow, by: string) {
    if (this.scenarioJobRunning(room.id)) throw new HttpError(409, 'AI 正在生成剧本，等生成完或者取消以后再开始');
    const stored = loadScenario(this.db, room.id);
    if (!stored) throw new HttpError(409, '先选一个剧本');
    const { scenario } = stored;
    const characters = loadCharacters(this.db, room.id);
    if (!characters.length) throw new HttpError(409, '还没有人选身份建角色，至少要有一个角色才能开局');
    if (characters.length > scenario.players.max) throw new HttpError(409, `这个剧本最多${scenario.players.max}个角色`);

    const start = gameMinutes(scenario.start);
    const now = this.now();
    const logIds: number[] = [];
    transaction(this.db, () => {
      const world = emptyWorld();
      // 开场时间之前（含开场那一刻）的事件，已经写在开场里了
      for (const e of scenario.timeline) {
        if (gameMinutes(e.at) <= start) world.events[e.key] = { happened: true, note: '开场时已经发生', at: gameMinutes(e.at) };
      }
      this.db
        .prepare(
          "UPDATE rooms SET status = 'running', game_clock = ?, clock_real_base = NULL, round_no = 1, world = ?, paused_at = NULL WHERE id = ?",
        )
        .run(start, JSON.stringify(world), room.id);
      const model = this.ai.modelFor('resolve', room.id);
      const started = by === '房主' ? '对局开始了' : `${by}开始了对局`;
      logIds.push(insertLog(this.db, { roomId: room.id, kind: 'system', text: `${started}（主持：${this.ai.modelName(model)}）`, now }));
      // 交给 AI 演的身份（V0.8.0）：告诉大家谁由 AI 来演
      const companions = companionsOf(scenario, loadAiSeats(this.db, room.id), characters.map((c) => c.roleKey));
      if (companions.length) logIds.push(insertLog(this.db, { roomId: room.id, kind: 'system', text: companionsStartText(companions), now }));
      logIds.push(
        insertLog(this.db, {
          roomId: room.id,
          kind: 'narration',
          text: scenario.opening.situation,
          data: { type: 'opening', title: scenario.title, background: scenario.opening.background, situation: scenario.opening.situation, known: scenario.opening.known },
          gameTime: start,
          now,
        }),
      );
      for (const c of characters) logIds.push(this.placeCharacter(c, scenario, start, now));
    });
    for (const id of logIds) this.rooms.publishLog(id);
    this.syncRoom(room.id);
  }

  /**
   * 把角色放到身份的起点，并私下告诉玩家他的身份秘密。返回那条私密记录的编号。
   * at：放到别的地点（V0.8.0：接替 AI 队友的角色放到队友现在的位置）。
   */
  private placeCharacter(c: Character, scenario: Scenario, gameTime: number, now: number, at?: string): number {
    const role = scenario.roles.find((r) => r.key === c.roleKey)!;
    const start = at ?? role.startLocation;
    const place = scenario.locations.find((l) => l.key === start);
    this.db.prepare('UPDATE characters SET location = ?, visited = ? WHERE id = ?').run(start, JSON.stringify([start]), c.id);
    const lines = [`你是${c.name}，${role.name}。${role.public}`];
    if (role.secret) lines.push(`只有你知道：${role.secret}`);
    lines.push(`你的目标：${role.goal}`);
    lines.push(`你现在在「${place?.name ?? start}」。`);
    return insertLog(this.db, {
      roomId: c.roomId,
      kind: 'narration',
      text: lines.join('\n'),
      audience: [c.id],
      data: { type: 'role', roleName: role.name, secret: role.secret, goal: role.goal, location: place?.name ?? start },
      gameTime,
      now,
    });
  }

  private pause(room: RoomRow, by: string) {
    transaction(this.db, () => {
      this.db
        .prepare("UPDATE rooms SET status = 'paused', paused_at = ?, game_clock = ?, clock_real_base = NULL WHERE id = ?")
        .run(this.now(), this.gameNow(room), room.id);
    });
    this.rooms.addLog(room.id, 'system', `${by}暂停了对局`);
  }

  /**
   * 有成员被封号：他在的每一局（没结束的）都冻结起来，等他解封：进行中的暂停，没开始的不能开局，暂停中的不能继续。
   * 记录里只说有成员被封号，不点名。
   */
  freezeRoomsOf(userId: number) {
    const ids = this.db
      .prepare("SELECT r.id FROM rooms r JOIN players p ON p.room_id = r.id WHERE p.user_id = ? AND r.status != 'ended' AND r.frozen_at IS NULL")
      .all(userId) as { id: number }[];
    for (const { id } of ids) {
      const room = loadRoom(this.db, id);
      if (!room) continue;
      const running = room.status === 'running';
      transaction(this.db, () => {
        if (running) {
          this.db
            .prepare("UPDATE rooms SET status = 'paused', paused_at = ?, game_clock = ?, clock_real_base = NULL WHERE id = ?")
            .run(this.now(), this.gameNow(room), id);
        }
        this.db.prepare('UPDATE rooms SET frozen_at = ?, frozen_paused = ? WHERE id = ?').run(this.now(), running ? 1 : 0, id);
      });
      this.rooms.addLog(id, 'system', '这一局有成员被封号了，先冻结起来，等他解封以后再继续');
      this.hub().toRoom(id, 'room', { roomId: id, status: running ? 'paused' : room.status });
      this.rooms.notifyRoomsChanged(id);
      this.pushGame(id);
    }
  }

  /**
   * 解封了、被封的账号删掉了：他在的冻结着的对局，没有别的成员还被封着的话，解除冻结；
   * 是冻结让它暂停的，接着进行（房主自己暂停的、还没开局的，等房主来）。
   */
  unfreezeRoomsOf(userId: number) {
    const ids = this.db
      .prepare('SELECT r.id FROM rooms r JOIN players p ON p.room_id = r.id WHERE p.user_id = ? AND r.frozen_at IS NOT NULL')
      .all(userId) as { id: number }[];
    for (const { id } of ids) {
      const stillBanned = this.db
        .prepare('SELECT 1 FROM players p JOIN users u ON u.id = p.user_id WHERE p.room_id = ? AND u.banned_at IS NOT NULL AND u.deleted_at IS NULL')
        .get(id);
      if (stillBanned) continue;
      const room = loadRoom(this.db, id);
      if (!room) continue;
      this.db.prepare('UPDATE rooms SET frozen_at = NULL, frozen_paused = 0 WHERE id = ?').run(id);
      if (room.frozen_paused === 1 && room.status === 'paused') {
        this.resume(room, '网站', '冻结解除了，对局继续');
        this.hub().toRoom(id, 'room', { roomId: id, status: 'running' });
      } else {
        this.rooms.addLog(id, 'system', room.status === 'preparing' ? '冻结解除了，可以开局了' : '冻结解除了，房主可以让对局继续');
      }
      this.rooms.notifyRoomsChanged(id);
      this.pushGame(id);
    }
  }

  private resume(room: RoomRow, by: string, text?: string) {
    // 暂停的这段时间不算：等待中的行动往后顺延
    const shift = room.paused_at ? Math.max(0, this.now() - room.paused_at) : 0;
    transaction(this.db, () => {
      this.db
        .prepare("UPDATE actions SET due_at = due_at + ? WHERE room_id = ? AND status = 'waiting' AND due_at IS NOT NULL")
        .run(shift, room.id);
      this.db.prepare("UPDATE rooms SET status = 'running', paused_at = NULL WHERE id = ?").run(room.id);
    });
    this.rooms.addLog(room.id, 'system', text ?? (by === '房主' ? '对局继续' : `${by}让对局继续`));
    this.syncRoom(room.id);
  }

  private stopRoom(roomId: number) {
    const room = loadRoom(this.db, roomId);
    if (!room) return;
    this.db
      .prepare("UPDATE rooms SET status = 'ended', game_clock = ?, clock_real_base = NULL, paused_at = NULL WHERE id = ?")
      .run(room.game_clock === null ? null : this.gameNow(room), roomId);
    this.db
      .prepare("UPDATE actions SET status = 'withdrawn' WHERE room_id = ? AND status IN ('waiting', 'resolving', 'failed')")
      .run(roomId);
  }

  private endByHost(room: RoomRow, by: string) {
    transaction(this.db, () => this.stopRoom(room.id));
    this.rooms.addLog(room.id, 'system', by === '房主' ? '对局结束了' : `${by}结束了对局`);
  }

  /** 主持AI宣布达成了某个结局：结束对局，所有人看到结局和真相。byAction 是达成结局的那次结算（撤回时要用）。 */
  private finishGame(roomId: number, byAction: number) {
    const room = loadRoom(this.db, roomId);
    const stored = loadScenario(this.db, roomId);
    if (!room || !stored || room.status === 'ended') return;
    const ending = parseWorld(room.world).ending;
    const now = this.now();
    const ids: number[] = [];
    transaction(this.db, () => {
      const withdrawn = this.db
        .prepare(
          "SELECT a.id, a.status, c.name FROM actions a JOIN characters c ON c.id = a.character_id WHERE a.room_id = ? AND a.status IN ('waiting', 'resolving', 'failed') ORDER BY a.id",
        )
        .all(roomId) as { id: number; status: string; name: string }[];
      this.stopRoom(roomId);
      if (ending) {
        ids.push(
          insertLog(this.db, {
            roomId,
            kind: 'narration',
            text: ending.epilogue,
            data: { type: 'ending', title: ending.title, epilogue: ending.epilogue, truth: stored.scenario.truth.summary },
            gameTime: ending.at,
            now,
          }),
        );
      }
      // 结局之前交了、还没结算的行动不再结算：说一声是谁的，免得玩家以为丢了
      const unsettled = [...new Set(withdrawn.map((a) => a.name))];
      ids.push(insertLog(this.db, { roomId, kind: 'system', text: unsettled.length ? `对局结束了，${unsettled.join('、')}还没结算的行动不再结算` : '对局结束了', now }));
      updateSnapshot(this.db, byAction, (s) => {
        s.ended = true;
        s.withdrawn = withdrawn.map((a) => ({ id: a.id, status: a.status }));
        s.logs.push(...ids);
      });
    });
    for (const id of ids) this.rooms.publishLog(id);
    this.hub().toRoom(roomId, 'room', { roomId, status: 'ended' });
    this.rooms.notifyRoomsChanged(roomId);
    if (ending) this.onGameFinished?.(roomId);
  }

  // ==================== 房主工具要用的 ====================

  /** 这一局有没有正在结算、排着队等结算的行动（撤回、改数值之前要等它做完）。 */
  resolutionBusy(roomId: number): boolean {
    return (
      this.queues.has(roomId) ||
      this.roundsInFlight.has(roomId) ||
      !!this.db.prepare("SELECT 1 FROM actions WHERE room_id = ? AND status = 'resolving'").get(roomId)
    );
  }

  /** 撤回了结算：正在写的剧情笔记作废，写失败等着重试的也马上可以再写。 */
  storyChanged(roomId: number) {
    this.storyEpoch.set(roomId, (this.storyEpoch.get(roomId) ?? 0) + 1);
    this.storySummaryRetryAt.delete(roomId);
  }

  /** 这一局里在等的行动接着做：没估时的估时，到期的结算，回合凑齐了就开始。 */
  resumeRoom(roomId: number) {
    const unestimated = this.db
      .prepare("SELECT id FROM actions WHERE room_id = ? AND status = 'waiting' AND game_minutes IS NULL")
      .all(roomId) as { id: number }[];
    for (const a of unestimated) this.startEstimate(a.id);
    this.tick();
    this.maybeResolveRound(roomId);
  }

  /** 重新结算：行动已经放回“结算中”，排进这一局的队列。payer：花费记给谁（让主持人重新结算的房主）。 */
  resolveAgain(roomId: number, actionId: number, payer: number | null = null) {
    this.enqueue(roomId, async () => {
      try {
        const action = this.loadAction(actionId);
        const room = loadRoom(this.db, roomId);
        if (!action || !room || action.status !== 'resolving') return;
        await this.resolveOne(actionId, action.game_start ?? Math.floor(this.gameNow(room)), payer);
      } finally {
        this.pushGame(roomId);
        this.maybeResolveRound(roomId);
        this.scheduleNext();
      }
    });
  }

  // ==================== 剧本 ====================

  /**
   * V0.2.0 以前选的现成剧本：存下来的那份里，身份还没有固定的属性、专长、外貌。
   * scenarios 文件夹里同一个剧本现在写了的，照着补上（身份对得上才补；已经建好的角色不动），
   * 以后在这一局选身份、中途加入的人，拿到的是剧本设计好的那一套，而不是按顺序给的默认值。启动时做一次，补过的不再补。
   */
  fillBuiltinRoleSheets() {
    const rows = this.db
      .prepare("SELECT room_id, scenario_key, data FROM scenarios WHERE source = 'builtin' AND scenario_key IS NOT NULL")
      .all() as { room_id: number; scenario_key: string; data: string }[];
    const complete = (r: Partial<Role>) => r.attributes !== undefined && r.specialties !== undefined && r.appearance !== undefined;
    const files = new Map<string, Scenario | null>();
    for (const row of rows) {
      let data: Scenario;
      try {
        data = JSON.parse(row.data) as Scenario;
      } catch {
        continue;
      }
      if (!Array.isArray(data.roles) || data.roles.every(complete)) continue;
      if (!files.has(row.scenario_key)) {
        const file = `${row.scenario_key}.json`;
        const ok = SCENARIO_KEY_RE.test(row.scenario_key) && fs.existsSync(path.join(this.scenarioDir, file));
        files.set(row.scenario_key, ok ? this.readBuiltin(file).scenario : null);
      }
      const current = files.get(row.scenario_key);
      if (!current) continue;
      let changed = false;
      const roles = data.roles.map((r) => {
        const match = complete(r) ? undefined : current.roles.find((c) => c.key === r.key);
        if (!match) return r;
        changed = true;
        return { ...r, attributes: match.attributes, specialties: match.specialties, appearance: match.appearance };
      });
      if (changed) this.db.prepare('UPDATE scenarios SET data = ? WHERE room_id = ?').run(JSON.stringify({ ...data, roles }), row.room_id);
    }
  }

  private readBuiltin(file: string): { key: string; scenario: Scenario | null; errors: string[] } {
    const key = path.basename(file, '.json');
    try {
      const text = fs.readFileSync(path.join(this.scenarioDir, file), 'utf8').replace(/^﻿/, '');
      const result = validateScenario(JSON.parse(text));
      return { key, scenario: result.scenario, errors: result.errors };
    } catch (err) {
      return { key, scenario: null, errors: [err instanceof Error ? err.message : String(err)] };
    }
  }

  /** 剧本文件夹（管理页的剧本管理用）。 */
  get scenarioFolder(): string {
    return this.scenarioDir;
  }

  /** scenarios 文件夹里能用的剧本（管理员下架了的不算）。 */
  listScenarios(): ScenarioSummary[] {
    let files: string[] = [];
    try {
      // 文件名不合规矩的（大写、空格这些）选不了，管理页上也不列：这里也不列
      files = fs
        .readdirSync(this.scenarioDir)
        .filter((f) => f.endsWith('.json') && SCENARIO_KEY_RE.test(path.basename(f, '.json')))
        .sort();
    } catch {
      return [];
    }
    const hidden = hiddenScenarios(this.db);
    const list: ScenarioSummary[] = [];
    for (const file of files) {
      if (hidden.has(path.basename(file, '.json'))) continue;
      const { key, scenario, errors } = this.readBuiltin(file);
      if (scenario) list.push(summarize(key, scenario));
      else console.warn(`剧本 ${file} 有错误，没有列出来：${errors.slice(0, 3).join('；')}`);
    }
    // 从小到大：预计天数少的、人数少的排前面
    return list.sort((a, b) => a.expectedDays - b.expectedDays || a.players.max - b.players.max || a.title.localeCompare(b.title, 'zh'));
  }

  /** 剧本对人数的限制（还没选剧本时是 null）。 */
  scenarioMaxPlayers(roomId: number): number | null {
    return loadScenario(this.db, roomId)?.scenario.players.max ?? null;
  }

  /**
   * 选剧本的检查（不写入）：读出剧本、检查格式。导入的剧本，路由会先发给 AI 检查内容，再调用 applyScenarioChoice。
   */
  parseScenarioChoice(roomId: number, input: { key?: unknown; data?: unknown }): ScenarioChoice {
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (room.status !== 'preparing') throw new HttpError(409, '对局已经开始了，不能再换剧本');
    if (this.scenarioJobRunning(roomId)) throw new HttpError(409, 'AI 正在生成剧本，先取消再换');

    let scenario: Scenario;
    let source: 'builtin' | 'imported';
    let key: string | null = null;
    if (typeof input.key === 'string') {
      scenario = this.libraryScenario(input.key);
      source = 'builtin';
      key = input.key;
    } else if (input.data !== undefined) {
      const result = validateScenario(input.data);
      if (!result.scenario) {
        const n = result.errors.length;
        throw new HttpError(400, `剧本有${n}处错误：${result.errors.slice(0, 5).join('；')}${n > 5 ? '……' : ''}`);
      }
      scenario = result.scenario;
      source = 'imported';
    } else {
      throw new HttpError(400, '请选择一个剧本');
    }
    return { scenario, source, key };
  }

  /** 剧本大厅（scenarios 文件夹）里的一个剧本：要存在、没下架、格式没错。 */
  libraryScenario(key: string): Scenario {
    if (!SCENARIO_KEY_RE.test(key) || !fs.existsSync(path.join(this.scenarioDir, `${key}.json`))) {
      throw new HttpError(404, '没有这个剧本');
    }
    if (hiddenScenarios(this.db).has(key)) throw new HttpError(409, '这个剧本已经下架了，选别的吧');
    const read = this.readBuiltin(`${key}.json`);
    if (!read.scenario) throw new HttpError(409, `这个剧本文件有错误：${read.errors.slice(0, 3).join('；')}`);
    return read.scenario;
  }

  applyScenarioChoice(roomId: number, choice: ScenarioChoice, by = '房主', opts: { mod5e?: boolean } = {}) {
    // 检查内容期间可能开始了生成剧本
    if (this.scenarioJobRunning(roomId)) throw new HttpError(409, 'AI 正在生成剧本，先取消再换');
    const what = choice.source === 'imported' ? '导入了剧本' : '选了剧本';
    const mod = !!opts.mod5e && canPlayAs5e(choice.scenario);
    this.installScenario(roomId, choice.scenario, choice.source, choice.key, `${by}${what}《${choice.scenario.title}》${mod ? '，用 5E 规则玩' : ''}`, { mod5e: mod });
  }

  /**
   * 用不用 5E 规则玩这个剧本（V1.0.0 5E mod，房主在开团准备里切换）：用的话每个身份转成一个 5E 角色、检定换成 5E 的；
   * 不用就换回原来的那份。换了以后大家建的角色清空，重新选身份；交给 AI 演的身份也取消（5E 规则下没有 AI 队友）。
   */
  setMod5e(roomId: number, userId: number, on: boolean) {
    const { by } = this.rooms.requireManager(roomId, userId, '只有房主能换规则');
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (room.status !== 'preparing') throw new HttpError(409, '对局已经开始了，不能再换规则');
    if (this.scenarioJobRunning(roomId)) throw new HttpError(409, 'AI 正在生成剧本，等它做完');
    const stored = loadScenario(this.db, roomId);
    if (!stored) throw new HttpError(409, '先选一个剧本');
    const current = modOf(stored.scenario);
    if (on === !!current) return;
    const original = current ? loadOriginalScenario(this.db, roomId) : stored.scenario;
    if (!original || !canPlayAs5e(original)) throw new HttpError(409, stored.scenario.dungeon ? '地下城不能换成 5E 规则' : '这个剧本本来就是 5E 模组');
    let cleared = 0;
    let seatsCleared = 0;
    transaction(this.db, () => {
      cleared = Number(this.db.prepare('DELETE FROM characters WHERE room_id = ?').run(roomId).changes);
      seatsCleared = clearAiSeats(this.db, roomId);
      this.db
        .prepare('UPDATE scenarios SET data = ?, original = ? WHERE room_id = ?')
        .run(JSON.stringify(on ? convertTo5e(original) : original), on ? JSON.stringify(original) : null, roomId);
    });
    this.rooms.addLog(
      roomId,
      'system',
      `${by}${on ? '改成用 5E 规则玩：每个身份都转成了一个 5E 角色，检定也换成了 5E 的' : '改回了剧本原来的规则'}${cleared ? '，之前建的角色清空了，请重新选身份' : ''}${seatsCleared ? '，交给 AI 演的身份也取消了' : ''}`,
    );
    this.hub().toRoom(roomId, 'members', { roomId });
    if (cleared) this.rooms.broadcastPresence(roomId);
    this.pushGame(roomId);
  }

  /**
   * 把一份检查过的剧本用到这一局（选现成的、导入文件、AI 生成、转换文本都走这里）。
   * 之前建的角色卡清空，大家按新剧本重新建。
   */
  installScenario(
    roomId: number,
    scenario: Scenario,
    source: 'builtin' | 'generated' | 'imported',
    key: string | null,
    logText: string,
    opts: { mod5e?: boolean } = {},
  ) {
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (room.status !== 'preparing') throw new HttpError(409, '对局已经开始了，不能再换剧本');
    const members = this.rooms.memberIds(roomId).length;
    if (members > scenario.players.max) {
      throw new HttpError(409, `《${scenario.title}》最多${scenario.players.max}个人玩，这一局现在有${members}个人`);
    }
    let cleared = 0;
    let seatsCleared = 0;
    transaction(this.db, () => {
      cleared = Number(this.db.prepare('DELETE FROM characters WHERE room_id = ?').run(roomId).changes);
      // 交给 AI 演的身份（V0.8.0）也清掉：新剧本的身份不一样
      seatsCleared = clearAiSeats(this.db, roomId);
      // 地下城：data 是随机定好的这一局，original 留着原来的整份（投稿用，V0.7.1）；
      // 用 5E 规则玩（V1.0.0）：data 是转好的那份，original 留着原来的（投稿、换回去用）
      const mod = !!opts.mod5e && canPlayAs5e(scenario);
      this.db
        .prepare(
          `INSERT INTO scenarios (room_id, source, scenario_key, data, original, created_at) VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (room_id) DO UPDATE SET source = excluded.source, scenario_key = excluded.scenario_key,
             data = excluded.data, original = excluded.original, created_at = excluded.created_at, revealed_at = NULL`,
        )
        .run(
          roomId,
          source,
          key,
          JSON.stringify(mod ? convertTo5e(scenario) : rollDungeonRun(scenario, (n) => this.rng(n) - 1)),
          scenario.dungeon || mod ? JSON.stringify(scenario) : null,
          this.now(),
        );
    });
    this.rooms.addLog(
      roomId,
      'system',
      `${logText}${cleared ? '，之前建的角色卡清空了，请重新建' : ''}${seatsCleared ? '，交给 AI 演的身份也取消了' : ''}`,
    );
    this.hub().toRoom(roomId, 'members', { roomId });
    if (cleared) this.rooms.broadcastPresence(roomId);
    this.pushGame(roomId);
  }

  /** 这一局有没有正在进行的 AI 生成剧本、转换剧本。 */
  scenarioJobRunning(roomId: number): boolean {
    return !!this.db.prepare("SELECT 1 FROM scenario_jobs WHERE room_id = ? AND status = 'running'").get(roomId);
  }

  /**
   * 房主要看完整剧本（包括真相）：AI 生成的剧本第一次看时，在记录里告诉大家，免得有人不知道房主已经知道了。
   * 返回剧本的完整数据，网页存成文件。
   */
  revealScenario(roomId: number, userId: number): { scenario: Scenario; source: string } {
    const { by } = this.rooms.requireManager(roomId, userId, '只有房主能看完整剧本');
    const row = this.db.prepare('SELECT source, data, revealed_at FROM scenarios WHERE room_id = ?').get(roomId) as
      | { source: string; data: string; revealed_at: number | null }
      | undefined;
    if (!row) throw new HttpError(404, '这一局还没有剧本');
    const scenario = JSON.parse(row.data) as Scenario;
    if (row.revealed_at === null) {
      this.db.prepare('UPDATE scenarios SET revealed_at = ? WHERE room_id = ?').run(this.now(), roomId);
      if (row.source === 'generated') this.rooms.addLog(roomId, 'system', `${by}看了完整剧本，包括真相和线索`);
      this.pushGame(roomId);
    }
    return { scenario, source: row.source };
  }

  // ==================== 车卡 ====================

  /**
   * 建角色的检查（不写入）。返回要发给 AI 检查的文字：玩家自己写的名字，和带进来的宠物的名字、介绍（V0.5.0）；
   * 和现在的一样时不用再查，都不用查是 null。
   */
  checkCharacter(roomId: number, userId: number, input: unknown): string | null {
    const { v, existing } = this.prepareCharacter(roomId, userId, input);
    const parts: string[] = [];
    if (!existing || existing.name !== v.name) parts.push(`名字：${v.name}`);
    // 自带角色卡（V0.6.0）、5E 角色卡（V0.9.0）：外貌、背景也发给主持 AI，换了卡就检查一遍
    if ((v.cardId !== null && (!existing || existing.cardId !== v.cardId)) || (v.card5eId !== null && (!existing || existing.card5eId !== v.card5eId))) {
      parts.push(`自带角色的外貌：${v.appearance || '（没写）'}\n自带角色的背景：${v.background || '（没写）'}`);
    }
    if (v.pet && (!existing || existing.pet?.name !== v.pet.name || existing.pet?.description !== v.pet.description)) {
      parts.push(`带着的宠物：${v.pet.name}${v.pet.description ? `（${v.pet.description}）` : ''}`);
    }
    return parts.length ? parts.join('\n') : null;
  }

  /**
   * 选身份、起名字。属性、专长、外貌是剧本给这个身份定好的，不能改；身份的秘密和目标选了以后才看得到。
   * 选定的身份不能换（换了就能看到别的身份的秘密）；开局前可以改名字。开局以后还没建角色的人照样能建（中途加入）。
   */
  private prepareCharacter(roomId: number, userId: number, input: unknown) {
    const room = loadRoom(this.db, roomId);
    const stored = loadScenario(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (!stored) throw new HttpError(409, '房主还没选剧本');
    if (room.status === 'ended') throw new HttpError(409, '这一局已经结束了');
    const player = this.db.prepare('SELECT id FROM players WHERE room_id = ? AND user_id = ?').get(roomId, userId) as { id: number } | undefined;
    if (!player) throw new HttpError(404, '你不在这一局里');
    const existing = characterOfUser(this.db, roomId, userId);
    if (existing && room.status !== 'preparing') throw new HttpError(409, '对局已经开始了，角色不能再改');

    const o = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
    const scenario = stored.scenario;
    const dungeon = scenario.rules === 2 && !!scenario.dungeon;
    // 用 5E 规则玩普通剧本（V1.0.0 5E mod）：用身份转成的 5E 角色，玩家只起名字（不带自己的 5E 卡）
    const mod = modOf(scenario);
    // 5E 模组（V0.9.0）：只能带自己的 5E 角色卡；名字、外貌、背景、职业、属性、法术、装备都用卡上的
    const entry5 =
      scenario.rules === '5e' && !mod
        ? (() => {
            if (!this.cards5e) throw new HttpError(503, '5E 角色卡暂时用不了');
            const cardId = Number(o.cardId);
            if (!Number.isInteger(cardId)) throw new HttpError(400, '5E 模组只能带自己的 5E 角色：请选一张 5E 角色卡（在「我的角色」的「5E 角色」里做）');
            return this.cards5e.entry(userId, cardId, roomId);
          })()
        : null;
    // 地下城（V0.7.0）：只能带自带角色卡；名字、外貌、背景、属性、专长、装备、技能用卡上的，再选带哪些道具
    const entry = dungeon
      ? (() => {
          if (!this.cards) throw new HttpError(503, '角色卡暂时用不了');
          const cardId = Number(o.cardId);
          if (!Number.isInteger(cardId)) throw new HttpError(400, '地下城只能带自己的角色卡进去：请选一张角色卡（在「我的角色」里做）');
          return this.cards.entry(userId, cardId, roomId, o.bag);
        })()
      : null;
    const name = entry ? entry.name : entry5 ? entry5.name : typeof o.name === 'string' ? o.name.trim() : '';
    if (!name || [...name].length > 20) throw new HttpError(400, '角色名要在1～20个字之间');
    // 新起的角色名不能有看不见的字符（V0.8.0 安全审查）；地下城、5E 模组用角色卡上的名字（建卡、改卡时查过），没改名的照旧
    if (!entry && !entry5 && name !== existing?.name) rejectInvisibleName(name);
    const roleKey = typeof o.roleKey === 'string' ? o.roleKey : '';
    if (existing && roleKey !== existing.roleKey) throw new HttpError(409, '身份选定以后不能换（你已经看过这个身份的秘密了），只能改名字');
    const role = scenario.roles.find((r) => r.key === roleKey);
    if (!role) throw new HttpError(400, '请从剧本给的身份里选一个');
    const characters = loadCharacters(this.db, roomId);
    if (characters.some((c) => c.userId !== userId && c.roleKey === roleKey)) throw new HttpError(409, '这个身份已经被别人选走了，换一个吧');
    if (characters.some((c) => c.userId !== userId && c.name === name)) throw new HttpError(409, '这个角色名已经有人用了');
    // 交给 AI 演的身份（V0.8.0）：准备阶段玩家选不了（房主取消以后才能选）；开局以后中途加入的玩家可以接替（见 saveCharacter）。
    // 名字不能和 AI 队友的一样（正在接替的那个除外：可以接着用他的名字）
    const takeover = !existing && isAiSeat(this.db, roomId, roleKey);
    if (takeover && room.status === 'preparing') throw new HttpError(409, '这个身份交给 AI 演了，房主取消以后才能选');
    if (existing?.name !== name && aiSeatNamed(this.db, roomId, name, takeover ? roleKey : '')) throw new HttpError(409, '这个名字已经给 AI 队友用了，换一个吧');
    // 带上宠物（V0.5.0，只陪伴）：没说的（以前的网页、只改名字）照旧
    let pet: PetCompanion | null = existing?.pet ?? null;
    if (o.withPet === true) {
      pet = (this.db.prepare('SELECT name, description FROM pets WHERE user_id = ?').get(userId) as PetCompanion | undefined) ?? null;
      if (!pet) throw new HttpError(409, '你还没有宠物');
    } else if (o.withPet === false) {
      pet = null;
    }
    // 规则第二版（V0.7.0）：生命值、精神值从满的开始；普通剧本用身份的七项属性
    let v2: V2State | null = null;
    if (entry) v2 = newV2State(entry.attributes, entry.gear, entry.bag, entry.skills);
    else if (scenario.rules === 2 && validRoleAttributes2(role.attributes)) v2 = newV2State(role.attributes as Attributes2, [], {});
    // 5E（V0.9.0）：生命值满的，法术位、能力都是满的，带着卡上的东西；5E mod 用身份转成的角色（存在转好的剧本里，缺了就现转）
    const pregen = mod ? (pregenOf(role)?.data ?? pregenData(role, { magic: magicWorld(scenario), level: mod.level })) : null;
    const v5 = entry5
      ? newState5e(entry5.cardId, entry5.data, computeSheet(entry5.data, rules5e()))
      : pregen
        ? newState5e(0, pregen, computeSheet(pregen, rules5e()))
        : null;
    const v = {
      name,
      roleKey,
      attributes: v2 ? (v2.attributes as unknown as Character['attributes']) : v5 ? ({} as Character['attributes']) : (role.attributes as Character['attributes']),
      specialties: entry ? entry.specialties : v5 ? [] : role.specialties,
      appearance: entry ? entry.appearance : entry5 ? entry5.appearance : role.appearance,
      background: entry ? entry.background : entry5 ? entry5.background : '',
      cardId: entry ? entry.cardId : null,
      card5eId: entry5 ? entry5.cardId : null,
      goal: '',
      pet,
      v2,
      v5,
      /** 地下城、5E 模组换了卡（或者带的道具）：属性这些整个换掉；别的只改名字和宠物（5E mod 的角色跟着身份，改不了）。 */
      sheetChosen: !!entry || !!entry5,
    };
    return { room, stored, player, existing, v, takeover };
  }

  saveCharacter(roomId: number, userId: number, input: unknown) {
    const { room, stored, player, existing, v, takeover } = this.prepareCharacter(roomId, userId, input);
    const now = this.now();
    // 接替 AI 演的身份（V0.8.0，开局以后才有）：他原来叫什么、角色放在哪（他现在的位置）
    const replacing = takeover ? takeoverOf(this.db, roomId, v.roleKey, parseWorld(room.world)) : null;
    const created = transaction(this.db, (): Character | null => {
      const pet = v.pet ? JSON.stringify(v.pet) : null;
      if (v.cardId !== null) this.db.prepare('UPDATE character_cards SET used_at = COALESCE(used_at, ?) WHERE id = ?').run(now, v.cardId);
      if (v.card5eId !== null) this.db.prepare('UPDATE cards5e SET used_at = COALESCE(used_at, ?) WHERE id = ?').run(now, v.card5eId);
      if (existing) {
        // 已经选定的身份：开局前能改名字、带不带宠物，也能换成自带的角色卡或者换回来（V0.6.0）。
        // 没说用不用角色卡的（以前的网页）属性这些不动，升级以前按旧规则建的角色也照旧
        if (v.sheetChosen) {
          this.db
            .prepare('UPDATE characters SET name = ?, pet = ?, attributes = ?, specialties = ?, appearance = ?, background = ?, card_id = ?, v2 = ?, card5e_id = ?, v5 = ? WHERE id = ?')
            .run(
              v.name,
              pet,
              JSON.stringify(v.attributes),
              JSON.stringify(v.specialties),
              v.appearance,
              v.background,
              v.cardId,
              v.v2 ? JSON.stringify(v.v2) : null,
              v.card5eId,
              v.v5 ? JSON.stringify(v.v5) : null,
              existing.id,
            );
        } else {
          this.db.prepare('UPDATE characters SET name = ?, pet = ? WHERE id = ?').run(v.name, pet, existing.id);
        }
        return null;
      }
      // 接替：这个身份不再交给 AI（和建角色在同一个事务里）
      if (takeover) dropAiSeat(this.db, roomId, v.roleKey);
      this.db
        .prepare(
          `INSERT INTO characters (room_id, player_id, role_key, name, attributes, specialties, appearance, goal, pet, card_id, background, v2, card5e_id, v5, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          roomId,
          player.id,
          v.roleKey,
          v.name,
          JSON.stringify(v.attributes),
          JSON.stringify(v.specialties),
          v.appearance,
          v.goal,
          pet,
          v.cardId,
          v.background,
          v.v2 ? JSON.stringify(v.v2) : null,
          v.card5eId,
          v.v5 ? JSON.stringify(v.v5) : null,
          now,
        );
      const mine = characterOfUser(this.db, roomId, userId);
      // 接替时换了名字：记下他之前在故事里叫什么（主持 AI 每次结算都看得到）
      if (mine && replacing && replacing.companion.name !== mine.name) rememberFormerName(this.db, mine.id, replacing.companion.name);
      return mine;
    });

    const roleName = stored.scenario.roles.find((r) => r.key === v.roleKey)?.name ?? v.roleKey;
    if (created) {
      const c = created;
      if (room.status === 'running' || room.status === 'paused') {
        // 中途加入：直接放到起点（接替 AI 队友的放到他现在的位置），私下告诉他身份
        const id = this.placeCharacter(c, stored.scenario, Math.floor(this.gameNow(room)), now, replacing?.location);
        const pet = c.pet ? `，带着宠物「${c.pet.name}」` : '';
        this.rooms.addLog(
          roomId,
          'system',
          replacing
            ? `${takeoverText(c.playerName, c.name, roleName, replacing.companion.name)}${pet}`
            : `${c.playerName} 的${c.card5eId ? ' 5E 角色' : c.cardId ? '自带角色' : '角色'}「${c.name}」（${roleName}）加入了故事${pet}`,
        );
        this.rooms.publishLog(id);
        this.syncRoom(roomId);
      } else {
        this.rooms.addLog(
          roomId,
          'system',
          `${c.playerName} ${c.card5eId ? '带来了自己的 5E 角色' : c.cardId ? '带来了自己的角色' : '建好了角色'}「${c.name}」（${roleName}）${c.pet ? `，带着宠物「${c.pet.name}」` : ''}`,
        );
      }
      this.rooms.broadcastPresence(roomId);
    }
    this.hub().toRoom(roomId, 'members', { roomId });
    this.pushGame(roomId);
  }

  // ==================== 行动 ====================

  /**
   * 交行动之前的检查（不写入）。路由先用它检查，再看额度、检查内容，最后才真的提交。
   * purposes：这个行动要用到的 AI（默认：检查内容、估时、结算）。
   */
  validateAction(roomId: number, userId: number, rawContent: unknown, purposes: AiPurpose[] = ['moderation', 'estimate', 'resolve']) {
    const content = typeof rawContent === 'string' ? rawContent.trim() : '';
    if (!content || [...content].length > ACTION_MAX_LENGTH) throw new HttpError(400, `行动要在1～${ACTION_MAX_LENGTH}个字之间`);
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (room.status === 'preparing') throw new HttpError(409, '对局还没开始');
    if (room.status === 'paused') throw new HttpError(409, '对局暂停中，等房主继续');
    if (room.status === 'ended') throw new HttpError(409, '这一局已经结束了');
    this.requireAi(roomId, purposes);
    const me = characterOfUser(this.db, roomId, userId);
    if (!me) throw new HttpError(409, '你还没有角色');
    const stored = loadScenario(this.db, roomId)!;
    const blocker = blockerFor(me, stored.scenario.stress);
    if (blocker) throw new HttpError(409, blocker);
    if (this.db.prepare("SELECT 1 FROM actions WHERE character_id = ? AND status IN ('waiting', 'resolving', 'failed')").get(me.id)) {
      throw new HttpError(409, '上一个行动还没有结果。想换一个，先撤回上一个');
    }
    const mode = this.rooms.presence(roomId).mode;
    if (mode === 'round' && this.roundBusy(roomId)) throw new HttpError(409, '这一轮正在结算，结算完再提交下一个行动');
    return { content, room, me, mode };
  }

  /**
   * 交行动。secret：悄悄做，同一地点的人看不到交了什么。
   * convertible：从合并的输入框交的，估时发现其实是在问主持人问题，就改成场外提问。
   */
  submitAction(roomId: number, userId: number, rawContent: unknown, opts: { secret?: boolean; convertible?: boolean; petHelp?: boolean } = {}): MyAction {
    const { content, room, me, mode } = this.validateAction(roomId, userId, rawContent);
    if (opts.petHelp) {
      if (!me.pet) throw new HttpError(409, '你的角色没有带宠物');
      if (this.petHelpUsed(roomId, me.id)) throw new HttpError(409, `${me.pet.name}这一局已经帮过忙了`);
    }
    const now = this.now();
    const { lastInsertRowid } = this.db
      .prepare(
        `INSERT INTO actions (room_id, character_id, content, status, mode, round, submitted_at, game_start, secret, pet_help)
         VALUES (?, ?, ?, 'waiting', ?, ?, ?, ?, ?, ?)`,
      )
      .run(roomId, me.id, content, mode, room.round_no, now, Math.floor(this.gameNow(room)), opts.secret ? 1 : 0, opts.petHelp ? 1 : 0);
    const id = Number(lastInsertRowid);
    if (opts.convertible) this.convertible.add(id);
    this.pushGame(roomId);
    this.startEstimate(id);
    return this.myAction(me.id)!;
  }

  // ==================== 玩家之间的互动 ====================

  /**
   * 协助之前的检查（不写入）：要协助的是同一地点另一个角色还在等结果的行动（不是悄悄做的，也不是别人的协助）；
   * 自己现在能交行动。note 是协助时附带的一句话（可以不写）。
   */
  validateAssist(roomId: number, userId: number, targetId: number, rawNote: unknown) {
    const note = typeof rawNote === 'string' ? rawNote.trim() : '';
    if ([...note].length > ASSIST_NOTE_MAX) throw new HttpError(400, `附带的话最多${ASSIST_NOTE_MAX}个字`);
    const target = this.loadAction(targetId);
    if (!target || target.room_id !== roomId) throw new HttpError(404, '没有这个行动');
    // 自己能不能交行动：和交普通行动一样检查（占位的内容只是为了通过长度检查）。
    // 协助不单独估时，跟着那个行动一起结算；附带的话要先检查内容
    const { room, me, mode } = this.validateAction(roomId, userId, '协助', note ? ['moderation', 'resolve'] : ['resolve']);
    const actor = loadCharacters(this.db, roomId).find((c) => c.id === target.character_id);
    if (!actor || actor.id === me.id) throw new HttpError(400, '只能协助别人的行动');
    if (target.assist_of !== null) throw new HttpError(409, '这本身就是一个协助，去协助原来的那个行动吧');
    if (target.secret) throw new HttpError(404, '没有这个行动');
    if (target.status !== 'waiting') throw new HttpError(409, target.status === 'resolving' ? '主持人已经在结算这个行动了，来不及协助' : '这个行动已经有结果了');
    if (actor.dead || !me.location || actor.location !== me.location) throw new HttpError(409, `要和${actor.name}在同一个地点才能协助`);
    const content = `协助${actor.name}：${target.content}${note ? `\n（${me.name}：${note}）` : ''}`;
    return { room, me, mode, target, actor, note, content };
  }

  /** 协助：花掉自己这一次行动，跟着那个行动一起结算（不单独调用 AI），检定 +1，失败的后果也一起担。 */
  assist(roomId: number, userId: number, targetId: number, rawNote: unknown): MyAction {
    const { room, me, target, content } = this.validateAssist(roomId, userId, targetId, rawNote);
    const now = this.now();
    this.db
      .prepare(
        `INSERT INTO actions (room_id, character_id, content, status, mode, round, submitted_at, due_at, game_start, game_minutes, estimate_note, assist_of)
         VALUES (?, ?, ?, 'waiting', ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        roomId,
        me.id,
        content,
        target.mode,
        target.round ?? room.round_no,
        now,
        target.due_at,
        target.game_start ?? Math.floor(this.gameNow(room)),
        target.game_minutes,
        '跟着要协助的行动一起结算',
        target.id,
      );
    const owner = this.userOfCharacter(target.character_id);
    if (owner !== null) {
      this.rooms.log({ roomId, kind: 'system', text: `${me.name}要协助你的行动：检定 +1，结果一起承担。`, targetUserId: owner });
    }
    this.pushGame(roomId);
    this.maybeResolveRound(roomId);
    return this.myAction(me.id)!;
  }

  /** 同一地点、还活着的角色（包括自己）。 */
  private sameLocation(roomId: number, me: Character): Character[] {
    if (!me.location) return [me];
    return loadCharacters(this.db, roomId).filter((c) => !c.dead && c.location === me.location);
  }

  /** 对白之前的检查（不写入）。to 是悄悄话的对象（角色编号），不写就是说给在场的所有人听。 */
  validateSay(roomId: number, userId: number, rawText: unknown, rawTo: unknown) {
    const text = typeof rawText === 'string' ? rawText.trim() : '';
    if (!text || [...text].length > SAY_MAX_LENGTH) throw new HttpError(400, `要说的话在1～${SAY_MAX_LENGTH}个字之间`);
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (room.status !== 'running') throw new HttpError(409, room.status === 'paused' ? '对局暂停中，等房主继续' : room.status === 'preparing' ? '对局还没开始' : '这一局已经结束了');
    const me = characterOfUser(this.db, roomId, userId);
    if (!me) throw new HttpError(409, '你还没有角色');
    if (me.dead) throw new HttpError(409, '你的角色已经死了');
    // 濒死、失控的角色不能行动，也说不了话（场外聊天照样能用）
    const blocker = blockerFor(me, loadScenario(this.db, roomId)?.scenario.stress ?? false);
    if (blocker) throw new HttpError(409, blocker);
    const here = this.sameLocation(roomId, me);
    let target: Character | null = null;
    if (rawTo !== undefined && rawTo !== null) {
      target = here.find((c) => c.id === rawTo && c.id !== me.id) ?? null;
      if (!target) throw new HttpError(409, '悄悄话只能说给同一个地点、还活着的其他角色');
    }
    return { text, room, me, here, target };
  }

  /**
   * 对白：角色当面说的话。同一地点的角色马上就能看到（悄悄话只有对方看到），不花游戏时间、不调用 AI。
   * 主持人结算以后的行动时也看得到这些话。
   */
  say(roomId: number, userId: number, rawText: unknown, rawTo: unknown) {
    const { text, room, me, here, target } = this.validateSay(roomId, userId, rawText, rawTo);
    const id = insertLog(this.db, {
      roomId,
      kind: 'narration',
      text,
      authorUserId: userId,
      audience: target ? [me.id, target.id] : here.map((c) => c.id),
      data: { type: 'say', speaker: me.name, to: target?.name ?? null },
      gameTime: Math.floor(this.gameNow(room)),
      now: this.now(),
    });
    this.rooms.publishLog(id);
    return { heardBy: (target ? [target] : here.filter((c) => c.id !== me.id)).map((c) => c.name) };
  }

  /** 把自己的一件东西交给同一地点的另一个角色：马上生效，在场的人都看得到。 */
  giveItem(roomId: number, userId: number, rawItem: unknown, rawTo: unknown) {
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (room.status !== 'running') throw new HttpError(409, room.status === 'paused' ? '对局暂停中，等房主继续' : '对局不在进行中');
    // 结算时会整个写回角色的状态：这时候给东西会被覆盖掉
    if (this.resolutionBusy(roomId)) throw new HttpError(409, '主持人正在结算，等结算完再给');
    const me = characterOfUser(this.db, roomId, userId);
    if (!me) throw new HttpError(409, '你还没有角色');
    if (me.dead) throw new HttpError(409, '你的角色已经死了');
    const blocker = blockerFor(me, loadScenario(this.db, roomId)?.scenario.stress ?? false);
    if (blocker) throw new HttpError(409, blocker);
    const item = typeof rawItem === 'string' ? rawItem.trim() : '';
    const index = me.items.indexOf(item);
    if (index < 0) throw new HttpError(404, '你身上没有这件东西');
    const here = this.sameLocation(roomId, me);
    const target = here.find((c) => c.id === rawTo && c.id !== me.id);
    if (!target) throw new HttpError(409, '只能交给同一个地点、还活着的其他角色');
    const now = this.now();
    const logId = transaction(this.db, () => {
      me.items.splice(index, 1);
      target.items.push(item);
      saveCharacter(this.db, me);
      saveCharacter(this.db, target);
      return insertLog(this.db, {
        roomId,
        kind: 'narration',
        text: `${me.name}把「${item}」交给了${target.name}`,
        audience: here.map((c) => c.id),
        data: { type: 'give', from: me.name, to: target.name, item },
        gameTime: Math.floor(this.gameNow(room)),
        now,
      });
    });
    this.rooms.publishLog(logId);
    this.pushGame(roomId);
    return { to: target.name, item };
  }

  /** 估算耗时（后台进行），估好以后定下出结果的时间。 */
  private startEstimate(actionId: number) {
    // 管理员关掉了 AI：先不估，打开以后再估
    if (this.estimating.has(actionId) || this.ai.switchedOff) return;
    this.estimating.add(actionId);
    this.track(
      (async () => {
        try {
          await this.estimate(actionId);
        } finally {
          this.estimating.delete(actionId);
        }
      })(),
    );
  }

  private async estimate(actionId: number) {
    const action = this.loadAction(actionId);
    // 协助的行动不用估：跟着要协助的那个行动
    if (!action || action.status !== 'waiting' || action.game_minutes !== null || action.assist_of !== null) return;
    const roomId = action.room_id;
    // 估时的 AI 也要知道 AI 队友是谁（V0.8.0）
    const stored = loadPlayScenario(this.db, roomId);
    const actor = loadCharacters(this.db, roomId).find((c) => c.id === action.character_id);
    if (!stored || !actor) return;
    let minutes = DEFAULT_MINUTES;
    let note: string;
    let kind: 'action' | 'question' = 'action';
    const limit = AbortSignal.timeout(ESTIMATE_TIMEOUT_MS);
    try {
      const estimate = await estimateMinutes({
        ai: this.ai,
        scenario: stored.scenario,
        actor,
        content: action.content,
        companions: stored.companions,
        meta: { roomId, actionId, userId: this.userOfCharacter(actor.id) },
        signal: AbortSignal.any([this.abort.signal, limit]),
      });
      minutes = estimate.minutes;
      note = estimate.reason;
      kind = estimate.kind;
    } catch (err) {
      if (this.stopped) return;
      if (err instanceof AiRefusal) {
        this.refuse(actionId, err);
        return;
      }
      if (err instanceof AiSwitchedOff) return;
      const why = limit.aborted ? `等了 ${ESTIMATE_TIMEOUT_MS / 1000} 秒还没估出来，按 ${DEFAULT_MINUTES} 分钟算` : err instanceof Error ? err.message : String(err);
      console.error(`估算行动 ${actionId} 的耗时失败：`, why);
      note = `估时失败，按${DEFAULT_MINUTES}分钟算`;
    }
    if (this.stopped) return;
    // 从合并的输入框交的：主持人看这其实是在问问题，改成场外提问，不算行动
    const convertible = this.convertible.delete(actionId);
    if (kind === 'question' && convertible) {
      this.convertToQuestion(action);
      return;
    }
    const room = loadRoom(this.db, roomId);
    if (!room) return;
    const realMinutes = Math.min(room.max_wait_minutes, Math.max(room.min_wait_minutes, minutes / room.time_ratio));
    const waitMs = Math.round((realMinutes * 60_000) / this.timeScale);
    const updated = this.db
      .prepare("UPDATE actions SET game_minutes = ?, estimate_note = ?, due_at = submitted_at + ? WHERE id = ? AND status = 'waiting'")
      .run(minutes, note, waitMs, actionId);
    if (!updated.changes) return;
    // 协助这个行动的人：跟着它的耗时和出结果的时间
    this.db
      .prepare("UPDATE actions SET game_minutes = ?, due_at = (SELECT due_at FROM actions WHERE id = ?) WHERE assist_of = ? AND status = 'waiting'")
      .run(minutes, actionId, actionId);
    this.pushGame(roomId);
    this.maybeResolveRound(roomId);
    this.tick();
  }

  withdrawAction(roomId: number, userId: number, actionId: number) {
    const me = characterOfUser(this.db, roomId, userId);
    const action = this.loadAction(actionId);
    if (!me || !action || action.room_id !== roomId || action.character_id !== me.id) throw new HttpError(404, '没有这个行动');
    if (action.status === 'resolving') throw new HttpError(409, '主持人已经在结算这个行动了，撤不回来');
    if (action.status !== 'waiting' && action.status !== 'failed') throw new HttpError(409, '这个行动已经有结果了');
    this.db.prepare("UPDATE actions SET status = 'withdrawn' WHERE id = ?").run(actionId);
    this.convertible.delete(actionId);
    this.dropOrphanAssists(roomId);
    this.pushGame(roomId);
    this.maybeResolveRound(roomId);
    this.scheduleNext();
  }

  retryAction(roomId: number, userId: number, actionId: number) {
    const me = characterOfUser(this.db, roomId, userId);
    const action = this.loadAction(actionId);
    if (!me || !action || action.room_id !== roomId || action.character_id !== me.id) throw new HttpError(404, '没有这个行动');
    if (action.status !== 'failed') throw new HttpError(409, '只有没能结算的行动可以重试');
    if (action.refused) throw new HttpError(409, '这个行动被 AI 的安全机制拒绝了，不能重试，请撤回以后换个写法');
    const room = loadRoom(this.db, roomId)!;
    if (room.status !== 'running') throw new HttpError(409, room.status === 'paused' ? '对局暂停中，等房主继续' : '对局不在进行中');
    // 内容检查过了：只要结算（还没估时的话也要估时）
    this.requireAi(roomId, action.game_minutes === null ? ['estimate', 'resolve'] : ['resolve']);
    const mode = this.rooms.presence(roomId).mode;
    // 等待的时间已经过去了：计时模式下马上结算，回合模式下并进这一轮
    this.db
      .prepare("UPDATE actions SET status = 'waiting', attempts = 0, last_error = NULL, mode = ?, round = ?, due_at = ? WHERE id = ?")
      .run(mode, room.round_no, this.now(), actionId);
    if (action.game_minutes === null) this.startEstimate(actionId);
    this.pushGame(roomId);
    this.maybeResolveRound(roomId);
    this.tick();
  }

  private myAction(characterId: number): MyAction | null {
    const a = this.db
      .prepare("SELECT * FROM actions WHERE character_id = ? AND status IN ('waiting', 'resolving', 'failed') ORDER BY id DESC LIMIT 1")
      .get(characterId) as ActionRow | undefined;
    if (!a) return null;
    const assisting =
      a.assist_of === null
        ? null
        : ((this.db.prepare('SELECT c.name FROM actions t JOIN characters c ON c.id = t.character_id WHERE t.id = ?').get(a.assist_of) as { name: string } | undefined)
            ?.name ?? null);
    return {
      secret: a.secret === 1,
      assisting,
      petHelp: a.pet_help === 1,
      id: a.id,
      content: a.content,
      mode: a.mode,
      status: a.status as MyAction['status'],
      submittedAt: a.submitted_at,
      dueAt: a.game_minutes === null ? null : a.due_at,
      gameMinutes: a.game_minutes,
      estimateNote: a.estimate_note,
      error: a.last_error,
      refused: a.refused === 1,
    };
  }

  // ==================== “我的对局”里的待办 ====================

  /** 这一局里要你处理的事和你不在时的新进展。 */
  roomTodo(roomId: number, userId: number, role: 'host' | 'player', status: RoomStatus): RoomTodo {
    const todo: RoomTodo = { setup: null, action: null, canAct: false, newResults: 0, newStory: 0, newChat: 0 };
    const characters = loadCharacters(this.db, roomId);
    const me = characters.find((c) => c.userId === userId) ?? null;
    // 只要知道有没有剧本、要不要心智规则：不用把整份剧本读出来（「我的对局」每一局都要算一遍；结束了的局用不着）
    const scenarioRow =
      status === 'ended'
        ? undefined
        : (this.db.prepare("SELECT json_extract(data, '$.stress') AS stress FROM scenarios WHERE room_id = ?").get(roomId) as { stress: number | null } | undefined);
    const hasScenario = !!scenarioRow;

    if (status === 'preparing') {
      if (this.scenarioJobRunning(roomId)) todo.setup = 'generating';
      else if (!hasScenario) todo.setup = role === 'host' ? 'pick-scenario' : 'wait-scenario';
      else if (!me) todo.setup = 'make-character';
      else if (role !== 'host') todo.setup = 'wait-start';
      else todo.setup = characters.length >= 1 ? 'start' : 'wait-players';
      return todo;
    }
    // 开局以后才进来、还没建角色的：选个身份就能加入故事
    if (!me && hasScenario && (status === 'running' || status === 'paused')) todo.setup = 'make-character';

    const action = me ? this.myAction(me.id) : null;
    if (action) todo.action = { status: action.status, mode: action.mode, dueAt: action.dueAt, refused: action.refused };
    todo.canAct =
      status === 'running' && !!me && !me.dead && !action && hasScenario && blockerFor(me, scenarioRow?.stress === 1) === null;

    // 正开着这一局的页面：新消息都看着呢，没有“没看过的”
    if (this.hub().isOnline(roomId, userId)) return todo;
    const mark = this.rooms.seenMark(roomId, userId);
    if (!mark) return todo;
    const counts = this.db
      .prepare(
        `SELECT
           COALESCE(SUM(l.kind = 'narration'), 0) AS story,
           COALESCE(SUM(l.kind = 'ooc' AND l.visibility = 'all' AND COALESCE(l.author_user_id, 0) <> ?), 0) AS chat
         FROM log_entries l WHERE l.room_id = ? AND l.id > ? AND ${LOG_VISIBLE}`,
      )
      .get(userId, roomId, mark.logId, userId, me?.id ?? -1) as { story: number; chat: number };
    todo.newStory = counts.story;
    todo.newChat = counts.chat;
    if (me && mark.at !== null) {
      const results = this.db
        .prepare("SELECT COUNT(*) AS n FROM actions WHERE character_id = ? AND status = 'done' AND resolved_at > ?")
        .get(me.id, mark.at) as { n: number };
      todo.newResults = results.n;
    }
    return todo;
  }

  // ==================== 场外问答 ====================

  /** 场外提问之前的检查（不写入）。 */
  validateQuestion(roomId: number, userId: number, rawQuestion: unknown) {
    const question = typeof rawQuestion === 'string' ? rawQuestion.trim() : '';
    if (!question || [...question].length > 300) throw new HttpError(400, '问题要在1～300个字之间');
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (room.status !== 'running' && room.status !== 'paused') throw new HttpError(409, '对局开始以后才能问主持人');
    this.requireAi(roomId, ['moderation', 'answer']);
    const me = characterOfUser(this.db, roomId, userId);
    const stored = loadScenario(this.db, roomId);
    if (!me || !stored) throw new HttpError(409, '你还没有角色');
    const key = `${roomId}:${userId}`;
    if (this.asking.has(key)) throw new HttpError(409, '上一个问题还没回答完');
    return { question, room, me, stored, key };
  }

  ask(roomId: number, userId: number, rawQuestion: unknown) {
    const { question, room, me, stored } = this.validateQuestion(roomId, userId, rawQuestion);
    this.startAnswer(room, me, stored, userId, question);
  }

  /** 合并的输入框交的行动其实是在问问题：撤下这个行动，改成场外提问（内容交行动时已经检查过）。 */
  private convertToQuestion(action: ActionRow) {
    const updated = this.db
      .prepare("UPDATE actions SET status = 'withdrawn', last_error = ? WHERE id = ? AND status = 'waiting'")
      .run('主持人看这是在问问题，改成了场外提问', action.id);
    if (!updated.changes) return;
    const roomId = action.room_id;
    this.dropOrphanAssists(roomId);
    this.pushGame(roomId);
    this.maybeResolveRound(roomId);
    this.scheduleNext();
    const userId = this.userOfCharacter(action.character_id);
    const room = loadRoom(this.db, roomId);
    const stored = loadScenario(this.db, roomId);
    const me = userId === null ? null : characterOfUser(this.db, roomId, userId);
    if (userId === null || !room || !stored || !me || (room.status !== 'running' && room.status !== 'paused')) return;
    if (this.asking.has(`${roomId}:${userId}`)) {
      this.rooms.log({ roomId, kind: 'system', text: '主持人看你写的是在问问题，但上一个问题还没回答完。等回答以后再问一次吧。', targetUserId: userId });
      return;
    }
    this.rooms.log({ roomId, kind: 'system', text: '主持人看你写的是在问问题，改成了场外提问：不花游戏时间，这一轮你还可以交行动。', targetUserId: userId });
    this.startAnswer(room, me, stored, userId, action.content);
  }

  /** 场外问答：记下问题，后台让 AI 回答，回答好了推给他。 */
  private startAnswer(room: RoomRow, me: Character, stored: NonNullable<ReturnType<typeof loadScenario>>, userId: number, question: string) {
    const roomId = room.id;
    const key = `${roomId}:${userId}`;
    this.asking.add(key);

    this.rooms.log({ roomId, kind: 'ooc', text: question, authorUserId: userId, targetUserId: userId, data: { type: 'question' } });
    const clueKeys = this.db
      .prepare(
        `SELECT cl.clue_key FROM knowledge k JOIN clues cl ON cl.id = k.content_id
         WHERE k.content_type = 'clue' AND k.character_id = ? ORDER BY k.id`,
      )
      .all(me.id) as { clue_key: string }[];
    const clues = clueKeys
      .map((r) => stored.scenario.clues.find((c) => c.key === r.clue_key))
      .filter((c) => c !== undefined)
      .map((c) => ({ title: c.title, content: c.content }));
    // AI 队友（V0.8.0）：只给名字、身份和公开介绍（秘密只有主持结算时看得到）
    const companions = companionsOf(stored.scenario, loadAiSeats(this.db, roomId), loadCharacters(this.db, roomId).map((c) => c.roleKey)).map(
      (c) => ({ name: c.name, roleName: c.roleName, public: c.role.public }),
    );

    this.track(
      (async () => {
        try {
          const answer = await answerQuestion({
            ai: this.ai,
            context: {
              scenario: stored.scenario,
              me,
              clues,
              recent: this.recentNarration(roomId, RECENT_FOR_ANSWER, { userId, characterId: me.id }),
              gameTime: this.gameNow(room),
              question,
              companions,
            },
            meta: { roomId, userId },
            language: parseStyle(room.style).language,
            signal: this.abort.signal,
          });
          if (this.stopped) return;
          this.rooms.log({ roomId, kind: 'ooc', text: answer, targetUserId: userId, data: { type: 'answer' } });
        } catch (err) {
          if (this.stopped) return;
          const message = err instanceof AiError ? err.message : '服务器出错了';
          if (!(err instanceof AiError)) console.error('场外问答出错：', err);
          const text = err instanceof AiRefusal ? `${message}，换个问法吧。` : `主持人暂时回答不了：${message}`;
          this.rooms.log({ roomId, kind: 'system', text, targetUserId: userId });
          // 发给 AI 的除了问题，还有他看得到的最近的经历：多人局里混着别人写的行动，只标给管理员看；单人局按违规处理
          if (err instanceof AiRefusal) {
            this.safety.refusal({
              userId,
              roomId,
              source: 'question',
              content: question,
              category: err.category,
              soloAuthor: this.rooms.memberIds(roomId).length === 1,
            });
          }
        } finally {
          this.asking.delete(key);
        }
      })(),
    );
  }

  // ==================== 你不在时发生了什么 ====================

  /**
   * 离开一阵子再打开对局时，先给他看这段时间里他的角色知道的事。
   * 内容少就直接列出来；多了让AI写一段摘要（只用他看得到的内容，记在他自己名下），写好以后推给他。
   */
  catchup(roomId: number, userId: number, untilId: number | null = null): Catchup {
    this.rooms.requireMember(roomId, userId);
    const none: Catchup = { since: null, afterId: null, untilId: null, items: [], more: 0, chatCount: 0, summary: null, summarizing: false };
    const mark = this.rooms.seenMark(roomId, userId);
    if (!mark) return none;
    const characterId = characterIdOf(this.db, roomId, userId);
    const rows = this.db
      .prepare(`${LOG_SELECT} WHERE l.room_id = ? AND l.id > ? AND l.id <= ? AND ${LOG_VISIBLE} ORDER BY l.id`)
      .all(roomId, mark.logId, untilId ?? Number.MAX_SAFE_INTEGER, userId, characterId ?? -1) as LogRow[];
    const chatCount = rows.filter((r) => r.kind === 'ooc' && r.visibility === 'all' && r.author_id !== userId).length;
    const story = rows.filter((r) => r.kind === 'narration').map((r) => toLogEntry(r, characterId));
    const base = { ...none, since: mark.at, afterId: mark.logId, chatCount };
    if (!story.length) return base;
    const until = story[story.length - 1].id;
    const items = story.map((e) => storyItem(e, 120));
    if (items.length <= CATCHUP_LIST_MAX) return { ...base, untilId: until, items };

    const cached = this.db
      .prepare('SELECT catchup_text FROM players WHERE room_id = ? AND user_id = ? AND catchup_after_id = ? AND catchup_until_id = ?')
      .get(roomId, userId, mark.logId, until) as { catchup_text: string | null } | undefined;
    const recent = { ...base, untilId: until, items: items.slice(-CATCHUP_LIST_MAX), more: items.length - CATCHUP_LIST_MAX };
    if (cached?.catchup_text) return { ...recent, summary: cached.catchup_text };
    // 摘要的钱记在他自己名下：额度用完了就只给列表
    if (!this.ai.statusFor('summary', roomId).ready || outOfCredit(this.db, userId)) return recent;

    const key = `${roomId}:${userId}:${mark.logId}:${until}`;
    if (this.catchupsFailed.has(key)) return recent;
    if (!this.catchupsInFlight.has(key)) {
      this.catchupsInFlight.add(key);
      const name = characterOfUser(this.db, roomId, userId)?.name ?? null;
      const entries = story.map((e) => storyItem(e, 400));
      const epoch = this.storyEpoch.get(roomId) ?? 0;
      this.track(
        (async () => {
          let summary: string | null = null;
          try {
            summary = await summarizeCatchup({
              ai: this.ai,
              characterName: name,
              entries,
              companions: roomCompanions(this.db, roomId),
              meta: { roomId, userId },
              language: this.roomStyle(roomId).language,
              signal: this.abort.signal,
            });
            // 写摘要的这一会儿里房主撤回了结算：摘要里可能有撤掉的事，不用了
            if ((this.storyEpoch.get(roomId) ?? 0) !== epoch) summary = null;
            else {
              this.db
                .prepare('UPDATE players SET catchup_after_id = ?, catchup_until_id = ?, catchup_text = ? WHERE room_id = ? AND user_id = ?')
                .run(mark.logId, until, summary, roomId, userId);
            }
          } catch (err) {
            if (this.stopped) return;
            this.catchupsFailed.add(key);
            console.error('写“你不在时”的摘要失败：', err instanceof Error ? err.message : err);
            if (err instanceof AiRefusal) {
              this.safety.refusal({
                userId,
                roomId,
                source: 'summary',
                content: entries.map((e) => `${e.label}\n${e.text}`).join('\n\n'),
                category: err.category,
                soloAuthor: false,
              });
            }
          } finally {
            this.catchupsInFlight.delete(key);
          }
          if (this.stopped) return;
          // 写好了（或者没写成，就只看列表）：推给他
          this.hub().toRoom(roomId, 'catchup', { afterId: mark.logId, untilId: until, summary }, (id) => id === userId);
        })(),
      );
    }
    return { ...recent, summarizing: true };
  }

  // ==================== 分享线索 ====================

  /**
   * 把自己知道的一条线索告诉别的角色：不要求在同一个地点，不算行动，马上生效。
   * to 是角色编号的数组，或者 'all'（所有还活着的其他角色）。
   * 记录只发给分享的人和收到的人；主持AI从知情表里知道他们都知道了。
   */
  shareClue(roomId: number, userId: number, rawKey: unknown, rawTo: unknown) {
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (room.status === 'preparing') throw new HttpError(409, '对局还没开始');
    if (room.status === 'ended') throw new HttpError(409, '这一局已经结束了');
    const me = characterOfUser(this.db, roomId, userId);
    if (!me) throw new HttpError(409, '你还没有角色');
    if (me.dead) throw new HttpError(409, '你的角色已经死了');
    const key = typeof rawKey === 'string' ? rawKey : '';
    const known = this.db
      .prepare(
        `SELECT cl.id FROM clues cl JOIN knowledge k ON k.content_type = 'clue' AND k.content_id = cl.id
         WHERE cl.room_id = ? AND cl.clue_key = ? AND k.character_id = ?`,
      )
      .get(roomId, key, me.id) as { id: number } | undefined;
    const clue = loadScenario(this.db, roomId)?.scenario.clues.find((c) => c.key === key);
    if (!known || !clue) throw new HttpError(404, '你还不知道这条线索');

    const others = loadCharacters(this.db, roomId).filter((c) => c.id !== me.id && !c.dead);
    let targets: Character[];
    if (rawTo === 'all') {
      targets = others;
    } else if (Array.isArray(rawTo) && rawTo.length > 0 && rawTo.every((x) => Number.isInteger(x))) {
      const ids = new Set(rawTo as number[]);
      targets = others.filter((c) => ids.has(c.id));
      if (targets.length !== ids.size) throw new HttpError(400, '只能分享给这一局里还活着的其他角色');
    } else {
      throw new HttpError(400, '选一下要告诉谁');
    }
    if (!targets.length) throw new HttpError(409, '这一局没有别的角色可以告诉');

    const now = this.now();
    const gameTime = Math.floor(this.gameNow(room));
    const names = targets.map((t) => t.name);
    const logId = transaction(this.db, () => {
      const know = this.db.prepare(
        `INSERT OR IGNORE INTO knowledge (room_id, content_type, content_id, character_id, game_time, created_at, source_character_id)
         VALUES (?, 'clue', ?, ?, ?, ?, ?)`,
      );
      for (const t of targets) know.run(roomId, known.id, t.id, gameTime, now, me.id);
      return insertLog(this.db, {
        roomId,
        kind: 'narration',
        text: `${me.name}把线索「${clue.title}」告诉了${names.join('、')}`,
        audience: [me.id, ...targets.map((t) => t.id)],
        data: { type: 'share', from: me.name, to: names, clue: { key, title: clue.title } },
        gameTime,
        now,
      });
    });
    this.rooms.publishLog(logId);
    this.pushGame(roomId);
    return { sharedWith: names };
  }

  // ==================== 发给网页的游戏状态 ====================

  gameState(roomId: number, userId: number): GameState {
    const { watching, manager } = this.rooms.access(roomId, userId);
    const room = loadRoom(this.db, roomId)!;
    const stored = loadScenario(this.db, roomId);
    const scenario = stored?.scenario ?? null;
    const characters = loadCharacters(this.db, roomId);
    // 观看的人没有角色，也看不到谁的角色卡、线索
    const me = watching ? null : (characters.find((c) => c.userId === userId) ?? null);
    const mode = this.rooms.presence(roomId).mode;
    const world = parseWorld(room.world);
    // 交给 AI 演的身份（V0.8.0）：名字和身份大家都看得到
    const companions = scenario
      ? companionsOf(scenario, loadAiSeats(this.db, roomId), characters.map((c) => c.roleKey)).map(({ roleKey, roleName, name }) => ({ roleKey, roleName, name }))
      : [];

    const place = (key: string | null): PlaceInfo | null => {
      const loc = scenario?.locations.find((l) => l.key === key);
      if (!scenario || !loc) return null;
      return {
        key: loc.key,
        name: loc.name,
        description: loc.description,
        exits: loc.exits.map((e) => ({ key: e.to, name: scenario.locations.find((l) => l.key === e.to)?.name ?? e.to, minutes: e.minutes })),
      };
    };

    let round: GameState['round'] = null;
    if (room.status === 'running' && mode === 'round') {
      const participants = this.roundParticipants(roomId, characters);
      const acting = new Set(
        (
          this.db
            .prepare("SELECT character_id FROM actions WHERE room_id = ? AND mode = 'round' AND status IN ('waiting', 'resolving')")
            .all(roomId) as { character_id: number }[]
        ).map((r) => r.character_id),
      );
      round = {
        number: room.round_no,
        submitted: [...acting],
        waitingFor: participants.filter((c) => !acting.has(c.id)).map((c) => c.id),
        resolving: this.roundBusy(roomId),
        noCredit: this.outOfCreditCharacters(roomId, characters).filter((id) => !acting.has(id)),
      };
    }

    const resolving = (
      this.db
        .prepare("SELECT c.name FROM actions a JOIN characters c ON c.id = a.character_id WHERE a.room_id = ? AND a.status = 'resolving' ORDER BY a.id")
        .all(roomId) as { name: string }[]
    ).map((r) => r.name);

    const clues = me
      ? (
          this.db
            .prepare(
              `SELECT cl.clue_key, k.game_time, src.name AS from_name
               FROM knowledge k JOIN clues cl ON cl.id = k.content_id LEFT JOIN characters src ON src.id = k.source_character_id
               WHERE k.content_type = 'clue' AND k.character_id = ? ORDER BY k.id`,
            )
            .all(me.id) as { clue_key: string; game_time: number | null; from_name: string | null }[]
        ).flatMap((r) => {
          const clue = scenario?.clues.find((c) => c.key === r.clue_key);
          return clue ? [{ key: clue.key, title: clue.title, content: clue.content, gameTime: r.game_time, from: r.from_name }] : [];
        })
      : [];

    const roleOf = (key: string) => scenario?.roles.find((r) => r.key === key);
    const aiStatus = this.ai.statusFor(['moderation', 'estimate', 'resolve'], roomId);

    // 同一地点的其他角色，和他们在等结果的行动（悄悄做的不给内容）
    const myAction = me ? this.myAction(me.id) : null;
    let nearby: GameState['nearby'] = [];
    if (me && !me.dead && me.location) {
      const pendingRows = this.db
        .prepare(
          `SELECT a.id, a.character_id, a.content, a.status, a.secret, a.assist_of FROM actions a
           WHERE a.room_id = ? AND a.status IN ('waiting', 'resolving') ORDER BY a.id`,
        )
        .all(roomId) as { id: number; character_id: number; content: string; status: 'waiting' | 'resolving'; secret: number; assist_of: number | null }[];
      const nameOfCharacter = (id: number) => characters.find((c) => c.id === id)?.name ?? '';
      const canActNow =
        room.status === 'running' && !myAction && !!scenario && blockerFor(me, scenario.stress) === null && !(mode === 'round' && this.roundBusy(roomId));
      nearby = characters
        .filter((c) => c.id !== me.id && !c.dead && c.location === me.location)
        .map((c) => {
          const a = pendingRows.find((r) => r.character_id === c.id);
          const target = a?.assist_of ? pendingRows.find((r) => r.id === a.assist_of) : undefined;
          return {
            id: c.id,
            name: c.name,
            roleName: roleOf(c.roleKey)?.name ?? c.roleKey,
            action: a
              ? {
                  id: a.id,
                  content: a.secret ? null : a.content,
                  status: a.status,
                  assisting: target ? nameOfCharacter(target.character_id) : null,
                  assistedBy: pendingRows.filter((r) => r.assist_of === a.id).map((r) => nameOfCharacter(r.character_id)),
                  canAssist: canActNow && a.status === 'waiting' && a.secret === 0 && a.assist_of === null,
                }
              : null,
          };
        });
    }

    return {
      now: this.now(),
      watching,
      manager,
      scenario:
        scenario && stored
          ? {
              ...summarize(stored.key ?? 'imported', scenario),
              source: stored.source,
              revealed: stored.revealed,
              mod5e: modOf(scenario) ? 'on' : canPlayAs5e(scenario) ? 'off' : null,
              opening: scenario.opening,
              roles: scenario.roles.map((r) => {
                const holder = characters.find((c) => c.roleKey === r.key);
                return {
                  key: r.key,
                  name: r.name,
                  public: r.public,
                  suggestedSpecialties: r.suggestedSpecialties,
                  // 地下城、5E 模组的身份没有属性和专长（玩家带自己的角色卡）
                  attributes: scenario.dungeon || scenario.rules === '5e' ? {} : r.attributes,
                  specialties: scenario.dungeon || scenario.rules === '5e' ? [] : r.specialties,
                  appearance: r.appearance,
                  // 交给 AI 演的身份也算有人了：是 AI 队友的名字（V0.8.0）
                  takenBy: holder?.name ?? companions.find((c) => c.roleKey === r.key)?.name ?? null,
                  mine: !!me && holder?.id === me.id,
                  pregen5e: pregenOf(r)?.view ?? null,
                };
              }),
            }
          : null,
      clock:
        room.game_clock === null
          ? null
          : {
              minutes: this.gameNow(room),
              running: room.clock_real_base !== null,
              minutesPerMs: (room.time_ratio * this.timeScale) / 60_000,
            },
      mode,
      style: parseStyle(room.style),
      dungeon: scenario?.rules === 2 ? dungeonView(scenario, world, me, characters.length, !!stored && rankedDungeon(stored)) : null,
      fight5e: scenario?.rules === '5e' ? fight5eView(world, me, characters) : null,
      round,
      me: me
        ? {
            id: me.id,
            name: me.name,
            roleKey: me.roleKey,
            roleName: roleOf(me.roleKey)?.name ?? me.roleKey,
            rolePublic: roleOf(me.roleKey)?.public ?? '',
            roleSecret: roleOf(me.roleKey)?.secret ?? '',
            roleGoal: roleOf(me.roleKey)?.goal ?? '',
            attributes: me.attributes,
            specialties: me.specialties,
            appearance: me.appearance,
            goal: me.goal,
            wounds: me.wounds,
            stress: me.stress,
            conditions: me.conditions,
            items: me.items,
            location: place(me.location),
            visited: me.visited.map(place).filter((p) => p !== null),
            dead: me.dead,
            blocked: scenario ? blockerFor(me, scenario.stress) : null,
            pet: me.pet,
            petHelp: me.pet ? (this.petHelpUsed(roomId, me.id) ? 'used' : 'ready') : null,
            cardId: me.cardId,
            background: me.background,
            v2: me.v2 ? character2View(me.v2) : null,
            v5: me.v5 ? character5eView(me.v5) : null,
          }
        : null,
      myPet: (this.db.prepare('SELECT name, description FROM pets WHERE user_id = ?').get(userId) as PetCompanion | undefined) ?? null,
      others: characters
        .filter((c) => c.id !== me?.id)
        .map((c) => ({
          id: c.id,
          userId: c.userId,
          playerName: c.playerName,
          name: c.name,
          roleName: roleOf(c.roleKey)?.name ?? c.roleKey,
          rolePublic: roleOf(c.roleKey)?.public ?? '',
          appearance: c.appearance,
          dead: c.dead,
          petName: c.pet?.name ?? null,
          class5e: class5eLine(c),
        })),
      companions,
      myAction,
      nearby,
      clues,
      resolving,
      ending:
        room.status === 'ended' && world.ending && scenario
          ? { title: world.ending.title, epilogue: world.ending.epilogue, truth: scenario.truth.summary }
          : null,
      cost: manager ? Math.round(this.ai.roomCost(roomId) * 10000) / 10000 : null,
      credit: creditOf(this.db, userId),
      ai: aiStatus,
      // 能选的只有房主的身份能用的模型（站长在「管理」→「AI」里设），「跟随网站设置」也换成这一局实际用的默认模型
      dmModel: {
        // 选过的模型这一局房主的身份现在不能用了（站长改了设置、房主换了人）：当成没选
        chosen: room.dm_model && this.ai.roomAllowedModels(roomId).includes(room.dm_model) ? room.dm_model : null,
        current: this.ai.modelFor('resolve', roomId),
        siteDefault: this.ai.roomDmDefault(roomId),
        options: this.ai.modelOptions().filter((o) => this.ai.roomAllowedModels(roomId).includes(o.model)),
      },
    };
  }

  /** 这一局要用的 AI 能不能用（管理员关掉了、那一家没设置密钥时不能用）。 */
  requireAi(roomId: number, purposes: AiPurpose | AiPurpose[]) {
    const status = this.ai.statusFor(purposes, roomId);
    if (!status.ready) throw new HttpError(503, status.message ?? 'AI 暂时用不了');
  }

  /** 房主（或能管这一局的管理员）选这一局的主持模型：null 是跟随网站的设置。 */
  setDmModel(roomId: number, model: string | null, by: string, opts: { quiet?: boolean } = {}) {
    const room = loadRoom(this.db, roomId);
    if (!room) throw new HttpError(404, '对局不存在');
    if (room.status === 'ended') throw new HttpError(409, '这一局已经结束了');
    if (model !== null && !this.ai.isKnownModel(model)) throw new HttpError(400, `只能选 ${this.ai.knownModels().join('、')}`);
    if (model !== null && !this.ai.roomAllowedModels(roomId).includes(model)) {
      const group = MODEL_GROUP_LABEL[this.ai.roomGroup(roomId)];
      throw new HttpError(403, `这一局的房主是${group}，只能选：${this.ai.roomAllowedModels(roomId).map((m) => this.ai.modelName(m)).join('、')}`);
    }
    if (model !== null) {
      const usable = this.ai.modelUsable(model);
      if (!usable.ready) throw new HttpError(409, usable.message ?? '这个模型现在用不了');
    }
    if (room.dm_model === model) return;
    this.db.prepare('UPDATE rooms SET dm_model = ? WHERE id = ?').run(model, roomId);
    // 开局时选的：开局的记录里会写，这里不另写一条
    if (opts.quiet) return;
    const name = (m: string) => this.ai.modelName(m);
    this.rooms.addLog(
      roomId,
      'system',
      model === null ? `${by}把主持模型改回了跟随网站设置（现在是 ${name(this.ai.roomDmDefault(roomId))}）` : `${by}把这一局的主持模型换成了 ${name(model)}`,
    );
    this.pushGame(roomId);
  }
}

export type ScenarioChoice = { scenario: Scenario; source: 'builtin' | 'imported'; key: string | null };

function summarize(key: string, s: Scenario): ScenarioSummary {
  return summarizeScenario(key, s);
}

/** 记录里的一件事，写成一句标题加一段节选（给“你不在时”的列表和摘要用）。 */
function storyItem(e: LogEntryView, textMax: number): CatchupItem {
  const clip = (text: string, max: number) => {
    const chars = [...text];
    return chars.length > max ? chars.slice(0, max).join('') + '……' : text;
  };
  const d = e.data;
  let label: string;
  let text = '';
  if (d?.type === 'resolution') {
    label = `${d.actor}：${clip(d.action, 40)}`;
    text = clip(e.text, textMax);
    if (d.clues.length) text += `（拿到线索：${d.clues.map((c) => c.title).join('、')}）`;
    if (d.changes.length) text += `（${d.changes.join('；')}）`;
  } else if (d?.type === 'private') {
    label = '只有你察觉到';
    text = clip(e.text, textMax);
  } else if (d?.type === 'share') {
    label = e.text;
  } else if (d?.type === 'opening') {
    label = `对局开始了：${d.title}`;
    text = clip(e.text, textMax);
  } else if (d?.type === 'role') {
    label = '你的身份';
    text = clip(e.text, textMax);
  } else if (d?.type === 'ending') {
    label = `结局：${d.title}`;
    text = clip(d.epilogue, textMax);
  } else {
    label = clip(e.text, 60);
  }
  return { id: e.id, gameTime: e.gameTime, label, text };
}

/** 网页上自己角色的规则第二版状态（V0.7.0）。 */
function character2View(s: V2State): Character2View {
  return {
    attributes: s.attributes,
    hp: s.hp,
    hpMax: s.hpMax,
    mp: s.mp,
    mpMax: s.mpMax,
    dying: s.dying,
    lostControl: s.lostControl,
    defense: defenseOf(s),
    gear: s.gear,
    bag: s.bag,
    loot: s.loot.map((l): LootView => {
      if (l.kind === 'gear') {
        const g = anyGearView(0, l.base, l.rarity);
        return g ? { kind: 'gear', gear: g } : { kind: 'crystals', amount: 0 };
      }
      if (l.kind === 'item') return { kind: 'item', item: l.item, name: consumableOf(l.item)?.name ?? l.item, count: l.count };
      if (l.kind === 'manual') return { kind: 'manual', name: `秘籍《${skillOf(l.skill)?.name ?? '？'}》` };
      return { kind: 'crystals', amount: l.amount };
    }),
    skills: s.skills.map((k) => skillView(k)).filter((x): x is NonNullable<typeof x> => !!x),
    boost: s.boost,
    ward: s.ward,
  };
}

/** 网页上的地下城局面：难度、减值、自己所在地点正在打的仗。普通的第二版剧本难度按 1 算。 */
function dungeonView(scenario: Scenario, world: ReturnType<typeof parseWorld>, me: Character | null, players: number, ranked: boolean): DungeonView {
  const level = scenario.dungeon?.level ?? 1;
  const size = scenario.dungeon?.size ?? 'small';
  const fight = me?.location ? world.combats[me.location] : undefined;
  return {
    level,
    size,
    isDungeon: !!scenario.dungeon,
    ranked: !!scenario.dungeon && ranked,
    penalty: levelPenalty(level) + shorthandedPenalty(size, players),
    combat: fight
      ? {
          order: fight.order.map((o) => ({ name: o.name, side: o.side, initiative: o.initiative })),
          enemies: fight.enemies.map((e) => ({ id: e.id, name: e.name, tier: e.tier, hp: e.hp, hpMax: e.hpMax, defeated: e.defeated, ...(e.fled ? { fled: true } : {}), shielded: e.shielded })),
        }
      : null,
  };
}
