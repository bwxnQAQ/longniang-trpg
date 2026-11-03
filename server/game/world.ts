import type { DB } from '../db';
import type { Condition, PetCompanion } from '../../shared/game';
import { ATTRIBUTE_KEYS } from '../../shared/rules';
import type { EnemyTier, Severity } from '../../shared/rules2';
import { actionBlocker, type Attributes, type CharacterState } from './rules';
import { parseV2, type V2State } from './rules2';
import { parseState5e } from './rules5e';
import type { Fight5e, State5e } from '../../shared/5e/types';
import { withRoleSheets, type Scenario } from './scenario';

// 一局游戏的状态：从数据库读出来、整理成方便用的样子。

/** 程序记下的世界变化：NPC的变化、处理过的时间线事件、结局。剧本本身不变。 */
export type World = {
  npcs: Record<string, NpcState>;
  events: Record<string, { happened: boolean; note: string; at: number }>;
  ending: { key: string; title: string; epilogue: string; at: number } | null;
  /** 地下城（V0.7.0）：每个地点正在打的仗（地点 key → 战斗）。 */
  combats: Record<string, CombatState>;
  /** 地下城：已经被拿走的宝物（宝物 key → 角色编号）、已经遇上过的敌人（遇敌 key → 次数）。 */
  lootTaken: Record<string, number>;
  encountered: Record<string, number>;
  /** 5E 模组（V0.9.0）：每个地点正在打的仗（地点 key → 战斗）、已经拿走的宝藏（宝藏 key → 角色编号）。 */
  fights5e: Record<string, Fight5e>;
  treasureTaken: Record<string, number>;
};

/** 一场战斗：在哪、第几轮（每结算一次这里的行动算一轮）、先后手、敌人。 */
export type CombatState = {
  location: string;
  round: number;
  order: { id: string; name: string; side: 'ally' | 'enemy'; initiative: number }[];
  enemies: EnemyState[];
};

/** 战斗里的一个敌人：数值由程序按难度算好，主持 AI 只决定它怎么行动。id 是这场战斗里的编号（比如 rat-2）。 */
export type EnemyState = {
  id: string;
  key: string;
  name: string;
  tier: EnemyTier;
  hp: number;
  hpMax: number;
  defense: number;
  attack: number;
  maxSeverity: Severity;
  damageBonus: number;
  abilities: string[];
  /** 不再参战：倒下了，或者逃走、投降了（fled）。 */
  defeated: boolean;
  fled?: boolean;
  /** 首领的护盾：还在的时候打不动（伤害是 0），要大家配合破开。 */
  shielded: boolean;
};

export type NpcState = { location?: string | null; attitude?: string; dead?: boolean; notes?: string[] };

export function emptyWorld(): World {
  return { npcs: {}, events: {}, ending: null, combats: {}, lootTaken: {}, encountered: {}, fights5e: {}, treasureTaken: {} };
}

export function parseWorld(text: string | null | undefined): World {
  try {
    const data = JSON.parse(text || '{}') as Partial<World>;
    const obj = <T,>(v: unknown): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : ({} as T));
    return {
      npcs: obj<World['npcs']>(data.npcs),
      events: obj<World['events']>(data.events),
      ending: data.ending ?? null,
      combats: obj<World['combats']>(data.combats),
      lootTaken: obj<World['lootTaken']>(data.lootTaken),
      encountered: obj<World['encountered']>(data.encountered),
      fights5e: obj<World['fights5e']>(data.fights5e),
      treasureTaken: obj<World['treasureTaken']>(data.treasureTaken),
    };
  } catch {
    return emptyWorld();
  }
}

export type RoomStatus = 'preparing' | 'running' | 'paused' | 'ended';

export type RoomRow = {
  id: number;
  name: string;
  host_user_id: number;
  max_players: number;
  model: 'claude' | 'deepseek';
  status: RoomStatus;
  /** 不计时（V0.7.1）：人不齐时，在线的人也照样一轮一轮结算。 */
  untimed: number;
  time_ratio: number;
  min_wait_minutes: number;
  max_wait_minutes: number;
  game_clock: number | null;
  clock_real_base: number | null;
  round_no: number;
  paused_at: number | null;
  world: string;
  cost_limit_usd: number | null;
  /** 这一局的主持用哪个模型（房主选的）；NULL 是跟随网站的设置。 */
  dm_model: string | null;
  /** 有成员被封号、冻结起来的时间（等他解封）；没冻结是 NULL。 */
  frozen_at: number | null;
  /** 冻结时这一局正在进行，是冻结让它暂停的：解封以后自动接着进行。 */
  frozen_paused: number;
  /** 主持风格（JSON，V0.6.0）；没设是 NULL（默认）。 */
  style: string | null;
};

export function loadRoom(db: DB, roomId: number): RoomRow | undefined {
  return db
    .prepare(
      `SELECT id, name, host_user_id, max_players, model, status, untimed, time_ratio, min_wait_minutes,
         max_wait_minutes, game_clock, clock_real_base, round_no, paused_at, world, cost_limit_usd, dm_model, frozen_at, frozen_paused, style
       FROM rooms WHERE id = ?`,
    )
    .get(roomId) as RoomRow | undefined;
}

/** revealed：房主是不是看过完整剧本（存成过文件）。 */
export type StoredScenario = { scenario: Scenario; source: 'builtin' | 'generated' | 'imported'; key: string | null; revealed: boolean };

export function loadScenario(db: DB, roomId: number): StoredScenario | null {
  const row = db.prepare('SELECT data, source, scenario_key, revealed_at FROM scenarios WHERE room_id = ?').get(roomId) as
    | { data: string; source: StoredScenario['source']; scenario_key: string | null; revealed_at: number | null }
    | undefined;
  if (!row) return null;
  // 老剧本的身份没有固定的属性、专长、外貌：补上默认的
  return { scenario: withRoleSheets(JSON.parse(row.data) as Scenario), source: row.source, key: row.scenario_key, revealed: row.revealed_at !== null };
}

/**
 * 这一局的整份原剧本（投稿用）：地下城装进对局时随机定下了这一局的变化，原来的整份另外存着（V0.7.1 起）；
 * 别的剧本、V0.7.1 以前装进去的，就是这一局用的那一份。
 */
export function loadOriginalScenario(db: DB, roomId: number): Scenario | null {
  const row = db.prepare('SELECT original FROM scenarios WHERE room_id = ?').get(roomId) as { original: string | null } | undefined;
  if (!row) return null;
  return row.original ? withRoleSheets(JSON.parse(row.original) as Scenario) : (loadScenario(db, roomId)?.scenario ?? null);
}

/** V0.6.0 的自带角色带进剧本的装备（第一版规则；V0.7.0 起自带角色只进地下城，用规则第二版的装备）。 */
export type GearInGame = { key: string; name: string; use: string; lore?: string };

export type Character = {
  id: number;
  roomId: number;
  playerId: number;
  userId: number;
  playerName: string;
  roleKey: string;
  name: string;
  attributes: Attributes;
  specialties: string[];
  appearance: string;
  goal: string;
  wounds: number;
  stress: number;
  conditions: Condition[];
  items: string[];
  location: string | null;
  visited: string[];
  dead: boolean;
  /** 带进这一局的宠物（只陪伴）。 */
  pet: PetCompanion | null;
  /** 用哪张自带角色卡建的（V0.6.0；用身份自带的角色是 null）；卡上写的背景。 */
  cardId: number | null;
  background: string;
  /** 带进这一局的装备（V0.6.0，自带角色才有）：行动正好用上、而且还带在身上（物品里有）时检定 +1。 */
  gear: GearInGame[];
  /** 地下城里的角色（规则第二版，V0.7.0）：生命值、精神值、装备、道具、捡到的东西。别的剧本是 null。 */
  v2: V2State | null;
  /** 5E 模组里的角色（V0.9.0）：带进来的 5E 角色卡和这一局的状态（生命值、法术位、资源、状态、物品）。别的剧本是 null。 */
  v5?: State5e | null;
  /** 用哪张 5E 角色卡建的（V0.9.0）；别的剧本是 null。 */
  card5eId?: number | null;
  /** 接替了 AI 队友、又换了名字的（V0.8.0）：他之前在故事里叫什么（只给主持 AI 看）。别的角色没有。 */
  formerName?: string;
};

type CharacterRow = {
  id: number;
  room_id: number;
  player_id: number;
  user_id: number;
  display_name: string;
  role_key: string;
  name: string;
  attributes: string;
  specialties: string;
  appearance: string;
  goal: string;
  wounds: number;
  stress: number;
  conditions: string;
  items: string;
  location: string | null;
  visited: string;
  dead: number;
  pet: string | null;
  card_id: number | null;
  background: string | null;
  gear: string | null;
  v2: string | null;
  v5: string | null;
  card5e_id: number | null;
  former_name: string | null;
};

const CHARACTER_SELECT = `
  SELECT c.*, p.user_id, u.display_name
  FROM characters c JOIN players p ON p.id = c.player_id JOIN users u ON u.id = p.user_id`;

function jsonOr<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

function toCharacter(row: CharacterRow): Character {
  const attrs = jsonOr<Record<string, number>>(row.attributes, {});
  return {
    id: row.id,
    roomId: row.room_id,
    playerId: row.player_id,
    userId: row.user_id,
    playerName: row.display_name,
    roleKey: row.role_key,
    name: row.name,
    attributes: Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, Number(attrs[k] ?? 0)])) as Attributes,
    specialties: jsonOr<string[]>(row.specialties, []),
    appearance: row.appearance,
    goal: row.goal,
    wounds: row.wounds,
    stress: row.stress,
    conditions: jsonOr<Condition[]>(row.conditions, []),
    items: jsonOr<string[]>(row.items, []),
    location: row.location,
    visited: jsonOr<string[]>(row.visited, []),
    dead: row.dead === 1,
    pet: row.pet ? jsonOr<PetCompanion | null>(row.pet, null) : null,
    cardId: row.card_id ?? null,
    background: row.background ?? '',
    gear: row.gear ? jsonOr<GearInGame[]>(row.gear, []) : [],
    v2: parseV2(row.v2),
    v5: parseState5e(row.v5),
    card5eId: row.card5e_id ?? null,
    ...(row.former_name ? { formerName: row.former_name } : {}),
  };
}

export function loadCharacters(db: DB, roomId: number): Character[] {
  return (db.prepare(`${CHARACTER_SELECT} WHERE c.room_id = ? ORDER BY c.id`).all(roomId) as CharacterRow[]).map(toCharacter);
}

export function characterOfUser(db: DB, roomId: number, userId: number): Character | null {
  const row = db.prepare(`${CHARACTER_SELECT} WHERE c.room_id = ? AND p.user_id = ?`).get(roomId, userId) as CharacterRow | undefined;
  return row ? toCharacter(row) : null;
}

/**
 * 现在不能自己行动的原因（能行动是 null）。规则第二版（V0.7.0）：只有死了不能行动；倒地濒死的还能挣扎求生、呼救，
 * 失控的那一次由主持人照失控来写。第一版照旧看伤势和心智。
 */
export function blockerFor(c: Character, stressEnabled: boolean): string | null {
  if (c.v2) return c.dead ? '这个角色已经死了' : null;
  // 5E（V0.9.0）：死了不能行动；倒地昏迷的照样能交（结算时先掷死亡豁免，别的事做不了）
  if (c.v5) return c.dead ? '这个角色已经死了' : null;
  return actionBlocker(stateOf(c), stressEnabled);
}

export function stateOf(c: Pick<Character, 'wounds' | 'stress' | 'conditions' | 'dead'>): CharacterState {
  return { wounds: c.wounds, stress: c.stress, conditions: c.conditions, dead: c.dead };
}

/** 把角色的可变部分写回数据库。 */
export function saveCharacter(db: DB, c: Character) {
  db.prepare(
    `UPDATE characters SET wounds = ?, stress = ?, conditions = ?, items = ?, location = ?, visited = ?, dead = ?, v2 = ?, v5 = ?
     WHERE id = ?`,
  ).run(
    c.wounds,
    c.stress,
    JSON.stringify(c.conditions),
    JSON.stringify(c.items),
    c.location,
    JSON.stringify(c.visited),
    c.dead ? 1 : 0,
    c.v2 ? JSON.stringify(c.v2) : null,
    c.v5 ? JSON.stringify(c.v5) : null,
    c.id,
  );
}

/** 这一局里已经被发现的线索，以及各自有谁知道。 */
export function foundClues(db: DB, roomId: number): { key: string; holders: number[]; foundAt: number | null }[] {
  const rows = db
    .prepare(
      `SELECT cl.clue_key, cl.found_game_time, k.character_id
       FROM clues cl LEFT JOIN knowledge k ON k.content_type = 'clue' AND k.content_id = cl.id
       WHERE cl.room_id = ? ORDER BY cl.id`,
    )
    .all(roomId) as { clue_key: string; found_game_time: number | null; character_id: number | null }[];
  const map = new Map<string, { key: string; holders: number[]; foundAt: number | null }>();
  for (const r of rows) {
    let entry = map.get(r.clue_key);
    if (!entry) map.set(r.clue_key, (entry = { key: r.clue_key, holders: [], foundAt: r.found_game_time }));
    if (r.character_id !== null) entry.holders.push(r.character_id);
  }
  return [...map.values()];
}
