import type { DB } from '../db';
import type { RoomStatus } from './world';

// 撤回、重新结算用的快照：每次结算写入时，记下结算前的样子和这次新加了什么。
// 只能从最近的一次往回撤（撤回以后，再往前一次的又变成“最近的一次”）。

export type CharacterSnapshot = {
  id: number;
  wounds: number;
  stress: number;
  conditions: string;
  items: string;
  location: string | null;
  visited: string;
  dead: number;
  /** 地下城里的状态（V0.7.0，JSON；别的剧本、早先的快照是 null 或没有）。 */
  v2?: string | null;
  /** 5E 模组里的状态（V0.9.0，JSON；别的剧本、早先的快照是 null 或没有）。 */
  v5?: string | null;
};

export type ResolutionSnapshot = {
  actionId: number;
  /** 结算前所有角色的可变状态。 */
  characters: CharacterSnapshot[];
  /**
   * 这次结算改过的角色，结算刚写完时的样子。撤回时只退回这些角色，而且要和现在的样子对得上
   * （之后交换过东西、房主改过数值，就不能自动撤回）。早先的快照没有这一项。
   */
  after?: CharacterSnapshot[];
  /** 结算前的世界状态（NPC、时间线事件、结局）、轮次、对局状态。 */
  world: string;
  roundNo: number;
  status: RoomStatus;
  /** 结算前后的游戏时间：结算可能让时钟往前跳，撤回时把跳过的时间退回去。 */
  clockBefore: number;
  clockAfter: number;
  /** 结算前主持人的剧情笔记写到哪里了。 */
  summary: { text: string; until: number };
  /** 这次结算新加的记录、新找到的线索、新的知情（线索）。 */
  logs: number[];
  clues: number[];
  knowledge: number[];
  /**
   * 新找到的线索和新的知情，连同内容一起记下：撤回时内容也对得上才删。
   * 房主可能已经把这条线索删了、编号又被别的线索用上（SQLite 会重用最大的编号）。早先的快照没有这两项。
   */
  clueRows?: { id: number; key: string }[];
  knowledgeRows?: { id: number; clueId: number; characterId: number }[];
  /** 这次结算达成了结局：对局结束时撤下的那些行动，撤回结算时放回去。 */
  ended: boolean;
  withdrawn: { id: number; status: string }[];
};

/** 每局留最近几次结算的快照。 */
export const SNAPSHOTS_KEPT = 10;

export function characterSnapshots(db: DB, roomId: number): CharacterSnapshot[] {
  return db
    .prepare('SELECT id, wounds, stress, conditions, items, location, visited, dead, v2, v5 FROM characters WHERE room_id = ? ORDER BY id')
    .all(roomId) as CharacterSnapshot[];
}

export function saveSnapshot(db: DB, roomId: number, snapshot: ResolutionSnapshot, now: number) {
  db.prepare('INSERT OR REPLACE INTO resolution_snapshots (action_id, room_id, state, created_at) VALUES (?, ?, ?, ?)').run(
    snapshot.actionId,
    roomId,
    JSON.stringify(snapshot),
    now,
  );
  db.prepare(
    `DELETE FROM resolution_snapshots WHERE room_id = ? AND id NOT IN
       (SELECT id FROM resolution_snapshots WHERE room_id = ? ORDER BY id DESC LIMIT ?)`,
  ).run(roomId, roomId, SNAPSHOTS_KEPT);
}

export function loadSnapshot(db: DB, actionId: number): ResolutionSnapshot | null {
  const row = db.prepare('SELECT state FROM resolution_snapshots WHERE action_id = ?').get(actionId) as { state: string } | undefined;
  return row ? (JSON.parse(row.state) as ResolutionSnapshot) : null;
}

/** 这一局最近一次结算的快照。 */
export function latestSnapshot(db: DB, roomId: number): ResolutionSnapshot | null {
  const row = db.prepare('SELECT state FROM resolution_snapshots WHERE room_id = ? ORDER BY id DESC LIMIT 1').get(roomId) as
    | { state: string }
    | undefined;
  return row ? (JSON.parse(row.state) as ResolutionSnapshot) : null;
}

export function updateSnapshot(db: DB, actionId: number, change: (s: ResolutionSnapshot) => void) {
  const s = loadSnapshot(db, actionId);
  if (!s) return;
  change(s);
  db.prepare('UPDATE resolution_snapshots SET state = ? WHERE action_id = ?').run(JSON.stringify(s), actionId);
}
