import type { DB } from '../db';
import type { LogData, RollCard } from '../../shared/game';

// 对局记录：写入、按“谁能看到”过滤、整理成发给网页的样子。

export type LogKind = 'narration' | 'ooc' | 'system';

/** 存在数据库里的附加数据。和发给网页的 LogData 基本一样，只是线索和状态变化还带着“给谁看”。 */
export type StoredLogData =
  | Exclude<LogData, { type: 'resolution' }>
  | {
      type: 'resolution';
      actor: string;
      action: string;
      gameStart: number;
      gameEnd: number;
      rolls: RollCard[];
      clues: { key: string; title: string; to: number[] }[];
      changes: { characterId: number; text: string }[];
      /** 悄悄做的行动：叙述只发给行动的人自己，观看的人也看不到。 */
      secret?: boolean;
      /** 地下城里大家都看得到的战况（V0.7.0）。 */
      events?: string[];
      /** 这次用掉的、从账号背包里扣了的道具（V0.7.0）：房主撤回这次结算时退回去。不发给网页。 */
      itemUses?: { characterId: number; item: string }[];
    };

export type LogRow = {
  id: number;
  room_id: number;
  kind: LogKind;
  visibility: 'all' | 'private';
  target_user_id: number | null;
  text: string;
  data: string | null;
  game_time: number | null;
  created_at: number;
  author_id: number | null;
  author_name: string | null;
};

export const LOG_SELECT = `
  SELECT l.id, l.room_id, l.kind, l.visibility, l.target_user_id, l.text, l.data, l.game_time, l.created_at,
         u.id AS author_id, u.display_name AS author_name
  FROM log_entries l LEFT JOIN users u ON u.id = l.author_user_id`;

/** 某人能不能看到这条记录：公开的、发给他本人的、或者他的角色在知情表里。 */
export const LOG_VISIBLE = `(l.visibility = 'all' OR l.target_user_id = ? OR EXISTS (
  SELECT 1 FROM knowledge k WHERE k.content_type = 'log' AND k.content_id = l.id AND k.character_id = ?))`;

/**
 * 观看的人（不在这一局里：大厅里看公开对局的人、管理员）能看到的：开场、结算的叙述（悄悄做的除外）、结局、对白（悄悄话除外）、
 * 交给别人东西、公开的系统消息。私密信息（身份秘密、只告诉某个人的事、线索分享）、场外聊天、场外问答都不给。
 */
const SPECTATOR_TYPES = ['opening', 'resolution', 'ending', 'give'];
export const LOG_SPECTATOR = `((l.kind = 'system' AND l.visibility = 'all') OR (l.kind = 'narration' AND (
  (json_extract(l.data, '$.type') IN (${SPECTATOR_TYPES.map((t) => `'${t}'`).join(', ')}) AND COALESCE(json_extract(l.data, '$.secret'), 0) = 0)
  OR (json_extract(l.data, '$.type') = 'say' AND json_extract(l.data, '$.to') IS NULL))))`;

export function spectatorCanSee(row: LogRow): boolean {
  if (row.kind === 'system') return row.visibility === 'all';
  if (row.kind !== 'narration' || !row.data) return false;
  try {
    const data = JSON.parse(row.data) as { type?: string; to?: unknown; secret?: unknown };
    if (data.type === 'say') return data.to === undefined || data.to === null;
    return !!data.type && SPECTATOR_TYPES.includes(data.type) && !data.secret;
  } catch {
    return false;
  }
}

export type NewLog = {
  roomId: number;
  kind: LogKind;
  text: string;
  now: number;
  authorUserId?: number | null;
  /** 只发给这个人（比如场外问答、出错提示）。 */
  targetUserId?: number | null;
  /** 只给这些角色看（叙述、私密信息）。 */
  audience?: number[];
  data?: StoredLogData | null;
  gameTime?: number | null;
};

export function insertLog(db: DB, log: NewLog): number {
  const isPrivate = log.targetUserId != null || log.audience !== undefined;
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO log_entries (room_id, kind, visibility, target_user_id, author_user_id, text, data, game_time, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      log.roomId,
      log.kind,
      isPrivate ? 'private' : 'all',
      log.targetUserId ?? null,
      log.authorUserId ?? null,
      log.text,
      log.data ? JSON.stringify(log.data) : null,
      log.gameTime == null ? null : Math.floor(log.gameTime),
      log.now,
    );
  const id = Number(lastInsertRowid);
  if (log.audience?.length) {
    const add = db.prepare(
      `INSERT OR IGNORE INTO knowledge (room_id, content_type, content_id, character_id, game_time, created_at)
       VALUES (?, 'log', ?, ?, ?, ?)`,
    );
    for (const characterId of new Set(log.audience)) {
      add.run(log.roomId, id, characterId, log.gameTime == null ? null : Math.floor(log.gameTime), log.now);
    }
  }
  return id;
}

export function loadLogRow(db: DB, id: number): LogRow | undefined {
  return db.prepare(`${LOG_SELECT} WHERE l.id = ?`).get(id) as LogRow | undefined;
}

export function canSee(db: DB, row: LogRow, userId: number, characterId: number | null): boolean {
  if (row.visibility === 'all' || row.target_user_id === userId) return true;
  if (characterId === null) return false;
  return !!db
    .prepare("SELECT 1 FROM knowledge WHERE content_type = 'log' AND content_id = ? AND character_id = ?")
    .get(row.id, characterId);
}

export type LogEntryView = {
  id: number;
  kind: LogKind;
  text: string;
  private: boolean;
  author: { id: number; displayName: string } | null;
  createdAt: number;
  gameTime: number | null;
  data: LogData | null;
};

/** 整理成发给某个人的样子：线索和状态变化只留下他自己的。 */
export function toLogEntry(row: LogRow, viewerCharacterId: number | null): LogEntryView {
  let data: LogData | null = null;
  if (row.data) {
    try {
      const stored = JSON.parse(row.data) as StoredLogData;
      if (stored.type === 'resolution') {
        const { itemUses: _itemUses, ...shown } = stored;
        data = {
          ...shown,
          clues: shown.clues.filter((c) => viewerCharacterId !== null && c.to.includes(viewerCharacterId)).map(({ key, title }) => ({ key, title })),
          changes: shown.changes.filter((c) => c.characterId === viewerCharacterId).map((c) => c.text),
        };
      } else {
        data = stored;
      }
    } catch {
      data = null;
    }
  }
  return {
    id: row.id,
    kind: row.kind,
    text: row.text,
    private: row.visibility === 'private',
    author: row.author_id !== null ? { id: row.author_id, displayName: row.author_name ?? '' } : null,
    createdAt: row.created_at,
    gameTime: row.game_time,
    data,
  };
}

export function characterIdOf(db: DB, roomId: number, userId: number): number | null {
  const row = db
    .prepare('SELECT c.id FROM characters c JOIN players p ON p.id = c.player_id WHERE c.room_id = ? AND p.user_id = ?')
    .get(roomId, userId) as { id: number } | undefined;
  return row?.id ?? null;
}
