import { CATEGORY_KEYS, RELATION_LABEL, type Relation, type ScenarioCategory } from '../../shared/game';
import {
  ATTRIBUTE_KEYS,
  MODIFIER_MAX,
  MODIFIER_MIN,
  SPECIALTY_COUNT,
  SPECIALTY_MAX_LENGTH,
  STARTING_VALUES,
  type AttributeKey,
} from '../../shared/rules';
import {
  ATTRIBUTE2_KEYS,
  CONSUMABLE_KEYS,
  roleAttributes2Problem,
  type Attributes2,
  ENEMY_TWEAK,
  LARGE_RECOMMENDED,
  LEVEL_MAX,
  LEVEL_MIN,
  MODIFIER2_MAX,
  MODIFIER2_MIN,
  SLOT_KEYS,
  SMALL_MAX_PLAYERS,
  type Attribute2,
  type ConsumableKey,
  type DungeonResult,
  type DungeonSize,
  type EnemyTier,
  type GearSlot,
  type Rarity,
} from '../../shared/rules2';

import { ABILITIES, CONDITIONS, DAMAGE_TYPES, LEVEL_MAX_5E, SKILL_ABILITY, SKILL_KEYS, isAbility, isSkill, parseDice, type Ability, type Condition5e, type DamageType, type Skill } from '../../shared/5e/core';
import { ITEM_INDEX } from '../../shared/5e/item-index';
import { MONSTER_INDEX } from '../../shared/5e/monster-index';
import type { MonsterAction, MonsterData } from '../../shared/5e/types';

export { RELATION_LABEL, type Relation };

/**
 * 剧本数据格式（第1版）。AI 生成的剧本、导入的剧本、手写的测试剧本都存成这个样子，
 * 开团前先过一遍 validateScenario，有错误的不能用。字段说明见 docs/scenario-format.md。
 *
 * 谁能看到什么：
 *   opening（开场）—— 全体玩家
 *   roles[].public / attributes / specialties / appearance —— 全体玩家（选身份时就看得到，不能改）
 *   roles[].secret / goal —— 只有选了这个身份的玩家
 *   locations —— 到过的人逐步知道
 *   clues —— 发现的人（可以分享）
 *   npcs / truth / timeline / endings —— 只有主持AI
 */
export const SCENARIO_FORMAT = 'longniang-trpg/scenario@1';

export type GameTime = { day: number; time: string };

export type Role = {
  key: string;
  name: string;
  public: string;
  secret: string;
  goal: string;
  startLocation: string;
  suggestedSpecialties: string[];
  /**
   * 这个身份固定的属性：第一版是五项把 +2、+1、+1、0、-1 各用一次；第二版是七项，按身份的实际情况分，
   * 每项 -2～+3、加起来 4（见 shared/rules2.ts 的 roleAttributes2Problem；地下城的身份不用）。
   */
  attributes: Record<AttributeKey, number> | Attributes2;
  /** 这个身份固定的两个专长。 */
  specialties: string[];
  /** 这个身份固定的外貌。 */
  appearance: string;
};

/** 缺的时候用的专长（老剧本没写固定专长、建议专长又不够两个时）。 */
const FALLBACK_SPECIALTIES = ['察言观色', '随机应变', '能说会道'];

/**
 * 老剧本（V0.2.0 以前写的、导入的）的身份没有固定的属性、专长、外貌：按身份的顺序给一套默认的，
 * 属性把 +2、+1、+1、0、-1 轮着排，专长用剧本建议的专长补齐两个。
 */
export function defaultRoleSheet(role: Partial<Role>, index: number): Pick<Role, 'attributes' | 'specialties' | 'appearance'> {
  const n = ATTRIBUTE_KEYS.length;
  const attributes = Object.fromEntries(ATTRIBUTE_KEYS.map((k, i) => [k, STARTING_VALUES[(i + n - (index % n)) % n]])) as Record<AttributeKey, number>;
  const specialties = [...new Set([...(role.suggestedSpecialties ?? []), ...FALLBACK_SPECIALTIES])]
    .filter((s) => [...s].length <= SPECIALTY_MAX_LENGTH)
    .slice(0, SPECIALTY_COUNT);
  return { attributes, specialties, appearance: '' };
}

/** 属性是不是 +2、+1、+1、0、-1 各用一次。 */
export function validAttributes(value: unknown): value is Record<AttributeKey, number> {
  if (typeof value !== 'object' || value === null) return false;
  const values = ATTRIBUTE_KEYS.map((k) => (value as Record<string, unknown>)[k]);
  if (!values.every((v) => typeof v === 'number')) return false;
  const given = (values as number[]).sort((a, b) => b - a);
  const expected = [...STARTING_VALUES].sort((a, b) => b - a);
  return given.every((v, i) => v === expected[i]);
}

/** 存在数据库里的老剧本：身份缺固定的属性、专长、外貌的，补上默认的（不改数据库里存的）。 */
export function withRoleSheets(scenario: Scenario): Scenario {
  // 规则第二版（V0.7.0）的身份是七项属性（地下城的身份没有属性），校验时已经检查过，不补第一版的默认值；5E 的身份也没有属性
  if (scenario.rules === 2 || scenario.rules === '5e') return scenario;
  if (scenario.roles.every((r) => validAttributes(r.attributes) && Array.isArray(r.specialties) && typeof r.appearance === 'string')) return scenario;
  return {
    ...scenario,
    roles: scenario.roles.map((r, i) => {
      const fallback = defaultRoleSheet(r, i);
      return {
        ...r,
        suggestedSpecialties: r.suggestedSpecialties ?? [],
        attributes: validAttributes(r.attributes) ? r.attributes : fallback.attributes,
        specialties: Array.isArray(r.specialties) && r.specialties.length === SPECIALTY_COUNT ? r.specialties : fallback.specialties,
        appearance: typeof r.appearance === 'string' ? r.appearance : fallback.appearance,
      };
    }),
  };
}

export type Location = {
  key: string;
  name: string;
  description: string;
  exits: { to: string; minutes: number }[];
  features: string[];
};

export type Clue = {
  key: string;
  title: string;
  content: string;
  location: string;
  points: string[];
  how: string;
  /** 规则第二版（地下城）的线索检定用七项属性；5E 模组（V0.9.0）写技能（或属性）和 DC。 */
  check: { attribute: AttributeKey | Attribute2; modifier: number } | Check5e | null;
  core: boolean;
};

export type Npc = {
  key: string;
  name: string;
  identity: string;
  personality: string;
  knows: string[];
  wants: string;
  speech: string;
  location: string | null;
  attitude: string;
};

export type TimelineEvent = { key: string; at: GameTime; event: string; ifIgnored: string };
/** result：地下城的结局算通关（clear）、活着逃出来（escape）还是失败（fail），决定成长点、能不能带走东西、给不给宝箱。 */
export type Ending = { key: string; title: string; condition: string; summary: string; result?: DungeonResult };

// ---------- 地下城（V0.7.0，规则第二版） ----------

export type DungeonEnemy = {
  key: string;
  name: string;
  tier: EnemyTier;
  description: string;
  /** 特别的本事（主持 AI 照着演；重的伤害只有首领的本事能用）。 */
  abilities: string[];
  /** 在程序按难度算好的数值上微调。 */
  tweak?: { hp?: number; defense?: number; attack?: number };
};

/** 遇敌：每一局从 places 里随机挑一个地点放这一拨敌人（at 是挑中的，装进对局时写上）。 */
export type DungeonEncounter = { key: string; title: string; enemies: { enemy: string; count: number }[]; places: string[]; trigger: string; at?: string };

export type LootReward =
  | { kind: 'gear'; slot?: GearSlot; rarity?: Exclude<Rarity, 'legendary'> }
  | { kind: 'item'; item: ConsumableKey; count: number }
  | { kind: 'crystals'; amount: number }
  | { kind: 'legendary' }
  /** 秘籍：程序随机挑一门技能（这个角色还没学会的）。 */
  | { kind: 'manual' };

/** 宝物：每一局从 places 里随机挑一个地点藏着（at 是挑中的）。 */
export type DungeonLoot = { key: string; places: string[]; how: string; reward: LootReward; at?: string };

/** 真相的一种变化：这一种真相、这一种下线索的内容、NPC 知道的事和态度。每一局随机一种。 */
export type DungeonVariant = {
  key: string;
  title: string;
  truth: string;
  clues: Record<string, string>;
  npcs: Record<string, { knows?: string[]; wants?: string; attitude?: string }>;
  note: string;
};

export type DungeonWeakness = { key: string; text: string; hint: string };

/** 首领：在哪、有几种弱点（每一局随机一种）；shield 写了的话，开打时首领有护盾，要大家配合破开（大型必须写）。 */
export type DungeonBoss = { enemy: string; location: string; weaknesses: DungeonWeakness[]; shield: string };

/** 这一局挑中的变化（装进对局时由程序定，玩家看不到）。 */
export type DungeonRun = { variant: string; variantTitle: string; encounters: Record<string, string>; loot: Record<string, string>; weakness: string };

export type Dungeon = {
  level: number;
  size: DungeonSize;
  /** 出口：活着走到这里可以选择离开（逃出来）；没有专门的出口是 null。 */
  exit: string | null;
  enemies: DungeonEnemy[];
  encounters: DungeonEncounter[];
  loot: DungeonLoot[];
  variants: DungeonVariant[];
  boss: DungeonBoss;
  run?: DungeonRun;
};

// ---------- 5E 模组（V0.9.0） ----------

/** 5E 线索的检定：技能（或者属性）和 DC。写了技能就用技能的属性。 */
export type Check5e = { skill: Skill | null; ability: Ability; dc: number };

export function isCheck5e(c: Clue['check']): c is Check5e {
  return !!c && 'dc' in c;
}

/** 5E 模组里的怪物：用 SRD 的数据块（monster 写怪物 key），或者自己写（stats）。name 是剧本里的叫法。 */
export type ScenarioMonster5e = { key: string; name: string; description: string; monster: string | null; stats: MonsterData | null };

/** 5E 模组的宝藏：在哪、怎么找到、有什么（SRD 的物品 key，武器护甲可以带 +1）、多少金币。 */
export type Treasure5e = { key: string; location: string; how: string; items: { item: string; count: number }[]; gold: number };

export type Scenario = {
  format: typeof SCENARIO_FORMAT;
  title: string;
  /** 分区（V0.5.0）：老剧本、存在数据库里的老对局没有这一项。 */
  category?: ScenarioCategory | null;
  /** 简介：给挑剧本的人看，不剧透（V0.5.0）。 */
  intro?: string;
  /** 作者的名字（V0.5.0）：自带的写「龙娘跑团」。用户投稿的作者另外记在数据库里。 */
  author?: string;
  /**
   * 可以自带角色卡（V0.7.0 的地下城由程序拼出来的那一趟才有；剧本文件、导入、AI 生成的剧本都不认这一项）。
   * 名字、外貌、背景、属性、专长用角色卡上的；身份的处境、秘密和目标照旧。
   */
  ownCharacters?: boolean;
  /** 用哪一版规则（V0.7.0）：没写是第一版；地下城和五个分区的新剧本是第二版；'5e' 是 5E 规则（V0.9.0）。 */
  rules?: 1 | 2 | '5e';
  /** 5E 模组（V0.9.0）：适合几级的角色（1～5）、怪物、宝藏。 */
  level?: number;
  monsters?: ScenarioMonster5e[];
  treasure?: Treasure5e[];
  /** 地下城（V0.7.0）：敌人、宝物、首领、真相的几种变化。别的剧本没有。 */
  dungeon?: Dungeon | null;
  /** 规则第二版的普通剧本里会和玩家动手的敌人（V0.7.0，可以不写）。地下城的敌人写在 dungeon 里。 */
  enemies?: DungeonEnemy[];
  genre: string;
  tone: string;
  players: { min: number; max: number };
  expectedDays: number;
  relation: Relation;
  stress: boolean;
  start: { label: string; day: number; time: string };
  safety: { avoid: string[] };
  opening: { background: string; situation: string; known: string[] };
  roles: Role[];
  locations: Location[];
  clues: Clue[];
  npcs: Npc[];
  truth: { summary: string; points: { key: string; text: string }[] };
  timeline: TimelineEvent[];
  endings: Ending[];
};

export type ValidationResult = { scenario: Scenario | null; errors: string[]; warnings: string[] };

/** 简介、作者名最多几个字。 */
export const INTRO_MAX = 300;
export const AUTHOR_MAX = 20;

const KEY_RE = /^[a-z][a-z0-9-]{0,39}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** 游戏时间换成从第1天0点起的分钟数，方便比较先后。 */
export function gameMinutes(at: GameTime): number {
  const [h, m] = at.time.split(':').map(Number);
  return (at.day - 1) * 1440 + h * 60 + m;
}

type Obj = Record<string, unknown>;

/** 一边读一边记错误，读不出来的字段给个空值，好让后面的检查接着跑。 */
class Reader {
  errors: string[] = [];
  warnings: string[] = [];

  error(path: string, message: string) {
    this.errors.push(`${path}：${message}`);
  }

  warn(path: string, message: string) {
    this.warnings.push(`${path}：${message}`);
  }

  obj(value: unknown, path: string): Obj {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value as Obj;
    this.error(path, '应该是一个对象 {…}');
    return {};
  }

  str(o: Obj, key: string, path: string, max: number, min = 1): string {
    const v = o[key];
    if (typeof v !== 'string') {
      this.error(`${path}.${key}`, '应该是文字');
      return '';
    }
    const len = [...v.trim()].length;
    if (len < min) this.error(`${path}.${key}`, min === 1 ? '不能为空' : `至少${min}个字`);
    if (len > max) this.error(`${path}.${key}`, `最多${max}个字，现在有${len}个`);
    return v.trim();
  }

  int(o: Obj, key: string, path: string, min: number, max: number): number {
    const v = o[key];
    if (typeof v !== 'number' || !Number.isInteger(v)) {
      this.error(`${path}.${key}`, '应该是整数');
      return min;
    }
    if (v < min || v > max) this.error(`${path}.${key}`, `要在 ${min}～${max} 之间`);
    return v;
  }

  bool(o: Obj, key: string, path: string): boolean {
    const v = o[key];
    if (typeof v !== 'boolean') {
      this.error(`${path}.${key}`, '应该是 true 或 false');
      return false;
    }
    return v;
  }

  arr(o: Obj, key: string, path: string, min: number, max: number): unknown[] {
    const v = o[key];
    if (!Array.isArray(v)) {
      this.error(`${path}.${key}`, '应该是一个列表 […]');
      return [];
    }
    if (v.length < min) this.error(`${path}.${key}`, `至少要有${min}项`);
    if (v.length > max) {
      this.error(`${path}.${key}`, `最多${max}项`);
      // 超了的剧本反正不能用：只查前 max 项（V0.8.0）。特别长的列表一项项查下去会很慢、报出成千上万条问题
      return v.slice(0, max);
    }
    return v;
  }

  strList(o: Obj, key: string, path: string, maxItems: number, maxLen: number): string[] {
    return this.arr(o, key, path, 0, maxItems).map((v, i) => {
      if (typeof v !== 'string' || !v.trim()) {
        this.error(`${path}.${key}[${i}]`, '应该是不为空的文字');
        return '';
      }
      if ([...v].length > maxLen) this.error(`${path}.${key}[${i}]`, `最多${maxLen}个字`);
      return v.trim();
    });
  }

  key(o: Obj, path: string): string {
    const v = o.key;
    if (typeof v !== 'string' || !KEY_RE.test(v)) {
      this.error(`${path}.key`, 'key 只能用小写英文字母、数字和短横线，以字母开头，比如 ledger-room');
      return '';
    }
    return v;
  }

  time(o: Obj, key: string, path: string): string {
    const v = o[key];
    if (typeof v !== 'string' || !TIME_RE.test(v)) {
      this.error(`${path}.${key}`, '时间要写成 24 小时制的“时:分”，比如 08:30');
      return '00:00';
    }
    return v;
  }

  oneOf<T extends string>(o: Obj, key: string, path: string, options: readonly T[]): T {
    const v = o[key];
    if (typeof v !== 'string' || !options.includes(v as T)) {
      this.error(`${path}.${key}`, `只能是 ${options.join(' / ')} 之一`);
      return options[0];
    }
    return v as T;
  }

  /** 检查同一类东西里 key 有没有重复。 */
  unique(items: { key: string }[], path: string) {
    const seen = new Set<string>();
    for (const item of items) {
      if (!item.key) continue;
      if (seen.has(item.key)) this.error(path, `key「${item.key}」重复了`);
      seen.add(item.key);
    }
  }
}

export function validateScenario(data: unknown): ValidationResult {
  const r = new Reader();
  const root = r.obj(data, '剧本');

  if (root.format !== SCENARIO_FORMAT) r.error('format', `应该是 "${SCENARIO_FORMAT}"`);
  const title = r.str(root, 'title', '剧本', 40);
  // 分区、简介、作者是 V0.5.0 加的：不写也行，写了就要写对
  const blank = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && !v.trim());
  const category: ScenarioCategory | null = blank(root.category) ? null : r.oneOf(root, 'category', '剧本', CATEGORY_KEYS);
  const intro = blank(root.intro) ? '' : r.str(root, 'intro', '剧本', INTRO_MAX);
  const author = blank(root.author) ? '' : r.str(root, 'author', '剧本', AUTHOR_MAX);
  const genre = r.str(root, 'genre', '剧本', 20);
  const tone = r.str(root, 'tone', '剧本', 60);
  // 规则第二版（V0.7.0）：地下城必须写 rules: 2 和 dungeon；5E 模组（V0.9.0）写 "rules": "5e"
  const is5e = root.rules === '5e';
  const rules: 1 | 2 | '5e' = is5e ? '5e' : root.rules === undefined || root.rules === null ? 1 : (r.int(root, 'rules', '剧本', 1, 2) as 1 | 2);
  if (typeof root.rules === 'string' && !is5e) r.error('rules', '规则只能写 1、2 或者 "5e"');
  const isDungeon = category === 'dungeon';
  if (isDungeon && rules !== 2) r.error('rules', '地下城要用规则第二版：写 "rules": 2');
  if (!isDungeon && root.dungeon !== undefined && root.dungeon !== null) r.error('dungeon', '只有地下城（category 写 "dungeon"）才能写 dungeon');

  const playersObj = r.obj(root.players, 'players');
  const players = { min: r.int(playersObj, 'min', 'players', 1, 6), max: r.int(playersObj, 'max', 'players', 1, 6) };
  if (players.min > players.max) r.error('players', 'min 不能比 max 大');

  const expectedDays = r.int(root, 'expectedDays', '剧本', 1, 30);
  const relation = r.oneOf(root, 'relation', '剧本', ['coop', 'secrets', 'versus'] as const);
  const stress = r.bool(root, 'stress', '剧本');

  const startObj = r.obj(root.start, 'start');
  const start = { label: r.str(startObj, 'label', 'start', 60), day: r.int(startObj, 'day', 'start', 1, 365), time: r.time(startObj, 'time', 'start') };

  const safetyObj = root.safety === undefined ? {} : r.obj(root.safety, 'safety');
  const safety = { avoid: safetyObj.avoid === undefined ? [] : r.strList(safetyObj, 'avoid', 'safety', 20, 40) };

  const openingObj = r.obj(root.opening, 'opening');
  const opening = {
    background: r.str(openingObj, 'background', 'opening', 1500),
    situation: r.str(openingObj, 'situation', 'opening', 1500),
    known: r.strList(openingObj, 'known', 'opening', 20, 200),
  };

  let sheetsMissing = 0;
  const roles: Role[] = r.arr(root, 'roles', '剧本', 1, 12).map((v, i) => {
    const p = `roles[${i}]`;
    const o = r.obj(v, p);
    const role = {
      key: r.key(o, p),
      name: r.str(o, 'name', p, 20),
      public: r.str(o, 'public', p, 300),
      secret: r.str(o, 'secret', p, 600, 0),
      goal: r.str(o, 'goal', p, 300),
      startLocation: r.str(o, 'startLocation', p, 40),
      suggestedSpecialties: o.suggestedSpecialties === undefined ? [] : r.strList(o, 'suggestedSpecialties', p, 4, SPECIALTY_MAX_LENGTH),
    };
    // 固定的属性、专长、外貌：写了就要写对；老剧本没写的，按顺序给一套默认的。
    // 地下城（规则第二版）只能用自带角色卡，身份只是故事里的处境：属性、专长不用写（写了也不用），外貌可写可不写
    const fallback = defaultRoleSheet(role, i);
    // 5E 模组（V0.9.0）：玩家带自己的 5E 角色卡进来，身份只是故事里的处境（和地下城一样）
    if ((rules === 2 && isDungeon) || rules === '5e') {
      const appearance = o.appearance === undefined ? '' : r.str(o, 'appearance', p, 200, 0);
      return { ...role, attributes: fallback.attributes, specialties: fallback.specialties, appearance };
    }
    if (rules === 2) {
      // 规则第二版的普通剧本：身份的七项属性按身份的实际情况分（每项 -2～+3、加起来 4，几个身份之间大体平衡），正好两个专长，写外貌
      let attributes: Role['attributes'] = fallback.attributes;
      const problem = roleAttributes2Problem(o.attributes);
      if (problem) r.error(`${p}.attributes`, problem);
      else attributes = Object.fromEntries(ATTRIBUTE2_KEYS.map((k) => [k, (o.attributes as Record<string, number>)[k]])) as Attributes2;
      const specialties = r.strList(o, 'specialties', p, SPECIALTY_COUNT, SPECIALTY_MAX_LENGTH);
      if (specialties.length !== SPECIALTY_COUNT) r.error(`${p}.specialties`, `要正好${SPECIALTY_COUNT}个专长`);
      else if (new Set(specialties).size !== specialties.length) r.error(`${p}.specialties`, '两个专长不能一样');
      const appearance = r.str(o, 'appearance', p, 200, 0);
      return { ...role, attributes, specialties, appearance };
    }
    let attributes = fallback.attributes;
    if (o.attributes !== undefined) {
      if (validAttributes(o.attributes)) {
        attributes = Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, (o.attributes as Record<string, number>)[k]])) as Record<AttributeKey, number>;
      } else {
        r.error(`${p}.attributes`, `五个属性（${ATTRIBUTE_KEYS.join('、')}）要把 ${STARTING_VALUES.map((x) => (x > 0 ? `+${x}` : String(x))).join('、')} 各用一次`);
      }
    }
    let specialties = fallback.specialties;
    if (o.specialties !== undefined) {
      specialties = r.strList(o, 'specialties', p, SPECIALTY_COUNT, SPECIALTY_MAX_LENGTH);
      if (specialties.length !== SPECIALTY_COUNT) r.error(`${p}.specialties`, `要正好${SPECIALTY_COUNT}个专长`);
      else if (new Set(specialties).size !== specialties.length) r.error(`${p}.specialties`, '两个专长不能一样');
    }
    const appearance = o.appearance === undefined ? fallback.appearance : r.str(o, 'appearance', p, 200, 0);
    if (o.attributes === undefined || o.specialties === undefined || o.appearance === undefined) sheetsMissing++;
    return { ...role, attributes, specialties, appearance };
  });
  if (sheetsMissing) {
    r.warn('roles', `有${sheetsMissing}个身份没写固定的属性、专长或外貌（attributes / specialties / appearance），按顺序给了默认的`);
  }

  const locations: Location[] = r.arr(root, 'locations', '剧本', 1, 40).map((v, i) => {
    const p = `locations[${i}]`;
    const o = r.obj(v, p);
    return {
      key: r.key(o, p),
      name: r.str(o, 'name', p, 20),
      description: r.str(o, 'description', p, 600),
      exits: r.arr(o, 'exits', p, 0, 12).map((e, j) => {
        const ep = `${p}.exits[${j}]`;
        const eo = r.obj(e, ep);
        return { to: r.str(eo, 'to', ep, 40), minutes: r.int(eo, 'minutes', ep, 1, 1440) };
      }),
      features: o.features === undefined ? [] : r.strList(o, 'features', p, 12, 200),
    };
  });

  const truthObj = r.obj(root.truth, 'truth');
  const truth = {
    summary: r.str(truthObj, 'summary', 'truth', 1500),
    points: r.arr(truthObj, 'points', 'truth', 1, 20).map((v, i) => {
      const p = `truth.points[${i}]`;
      const o = r.obj(v, p);
      return { key: r.key(o, p), text: r.str(o, 'text', p, 500) };
    }),
  };

  const clues: Clue[] = r.arr(root, 'clues', '剧本', 1, 80).map((v, i) => {
    const p = `clues[${i}]`;
    const o = r.obj(v, p);
    let check: Clue['check'] = null;
    if (o.check !== null && o.check !== undefined) {
      const co = r.obj(o.check, `${p}.check`);
      check =
        rules === '5e'
          ? readCheck5e(r, co, `${p}.check`)
          : rules === 2
          ? {
              attribute: r.oneOf(co, 'attribute', `${p}.check`, ATTRIBUTE2_KEYS),
              modifier: r.int(co, 'modifier', `${p}.check`, MODIFIER2_MIN, MODIFIER2_MAX),
            }
          : {
              attribute: r.oneOf(co, 'attribute', `${p}.check`, ATTRIBUTE_KEYS),
              modifier: r.int(co, 'modifier', `${p}.check`, MODIFIER_MIN, MODIFIER_MAX),
            };
    }
    return {
      key: r.key(o, p),
      title: r.str(o, 'title', p, 30),
      content: r.str(o, 'content', p, 800),
      location: r.str(o, 'location', p, 40),
      points: r.strList(o, 'points', p, 6, 40),
      how: r.str(o, 'how', p, 200),
      check,
      core: r.bool(o, 'core', p),
    };
  });

  const npcs: Npc[] = (root.npcs === undefined ? [] : r.arr(root, 'npcs', '剧本', 0, 40)).map((v, i) => {
    const p = `npcs[${i}]`;
    const o = r.obj(v, p);
    return {
      key: r.key(o, p),
      name: r.str(o, 'name', p, 20),
      identity: r.str(o, 'identity', p, 200),
      personality: r.str(o, 'personality', p, 200),
      knows: r.strList(o, 'knows', p, 12, 300),
      wants: r.str(o, 'wants', p, 200),
      speech: r.str(o, 'speech', p, 200),
      location: o.location === null ? null : r.str(o, 'location', p, 40),
      attitude: r.str(o, 'attitude', p, 200),
    };
  });

  const timeline: TimelineEvent[] = (root.timeline === undefined ? [] : r.arr(root, 'timeline', '剧本', 0, 40)).map((v, i) => {
    const p = `timeline[${i}]`;
    const o = r.obj(v, p);
    const atObj = r.obj(o.at, `${p}.at`);
    return {
      key: r.key(o, p),
      at: { day: r.int(atObj, 'day', `${p}.at`, 1, 365), time: r.time(atObj, 'time', `${p}.at`) },
      event: r.str(o, 'event', p, 500),
      ifIgnored: r.str(o, 'ifIgnored', p, 500, 0),
    };
  });

  const endings: Ending[] = r.arr(root, 'endings', '剧本', 1, 10).map((v, i) => {
    const p = `endings[${i}]`;
    const o = r.obj(v, p);
    const ending: Ending = {
      key: r.key(o, p),
      title: r.str(o, 'title', p, 20),
      condition: r.str(o, 'condition', p, 500),
      summary: r.str(o, 'summary', p, 800),
    };
    if (isDungeon) ending.result = r.oneOf(o, 'result', p, ['clear', 'escape', 'fail'] as const);
    return ending;
  });

  const dungeon = isDungeon ? readDungeon(r, root.dungeon) : null;
  // 规则第二版的普通剧本可以写会和玩家动手的敌人（战斗用，数值由程序按难度 1 算）
  let enemies: DungeonEnemy[] = [];
  if (!isDungeon && root.enemies !== undefined && root.enemies !== null) {
    if (rules !== 2) r.error('enemies', rules === '5e' ? '5E 模组的怪物写在 monsters 里' : '只有规则第二版的剧本（"rules": 2）才能写 enemies');
    else enemies = readEnemies(r, root, '剧本');
    r.unique(enemies, 'enemies');
  }
  // 5E 模组（V0.9.0）：适合的等级、怪物、宝藏
  let level5e = 1;
  let monsters5e: ScenarioMonster5e[] = [];
  let treasure5e: Treasure5e[] = [];
  if (rules === '5e') {
    level5e = root.level === undefined || root.level === null ? 1 : r.int(root, 'level', '剧本', 1, LEVEL_MAX_5E);
    monsters5e = root.monsters === undefined || root.monsters === null ? [] : readMonsters5e(r, root);
    r.unique(monsters5e, 'monsters');
    treasure5e = root.treasure === undefined || root.treasure === null ? [] : readTreasure5e(r, root);
    r.unique(treasure5e, 'treasure');
  } else {
    if (root.monsters !== undefined && root.monsters !== null) r.error('monsters', '只有 5E 模组（"rules": "5e"）才能写 monsters');
    if (root.treasure !== undefined && root.treasure !== null) r.error('treasure', '只有 5E 模组（"rules": "5e"）才能写 treasure');
  }

  // ---------- 前后对得上 ----------

  for (const [items, path] of [
    [roles, 'roles'],
    [locations, 'locations'],
    [clues, 'clues'],
    [npcs, 'npcs'],
    [truth.points, 'truth.points'],
    [timeline, 'timeline'],
    [endings, 'endings'],
  ] as const) {
    r.unique(items, path);
  }

  const locationKeys = new Set(locations.map((l) => l.key));
  const pointKeys = new Set(truth.points.map((p) => p.key));
  // 下面的检查都查表，不在循环里一遍遍扫列表（V0.8.0：特别构造的剧本会让检查变得很慢）。
  // 每个地点的出口通向哪些地点：标识重复的，按排在前面的那个地点算（和以前用 find 一样）
  const exitsOf = new Map<string, Set<string>>();
  for (const loc of locations) if (!exitsOf.has(loc.key)) exitsOf.set(loc.key, new Set(loc.exits.map((e) => e.to)));

  if (roles.length < players.max) {
    r.error('roles', `最多${players.max}个人玩，至少要准备${players.max}个身份，现在只有${roles.length}个`);
  }
  roles.forEach((role, i) => {
    if (role.startLocation && !locationKeys.has(role.startLocation)) r.error(`roles[${i}].startLocation`, `没有这个地点「${role.startLocation}」`);
  });

  locations.forEach((loc, i) => {
    loc.exits.forEach((exit, j) => {
      if (!exit.to) return;
      if (!locationKeys.has(exit.to)) r.error(`locations[${i}].exits[${j}].to`, `没有这个地点「${exit.to}」`);
      else if (exit.to === loc.key) r.error(`locations[${i}].exits[${j}].to`, '出口不能通向自己');
      else if (!exitsOf.get(exit.to)?.has(loc.key)) {
        r.warn(`locations[${i}].exits[${j}]`, `只能从「${loc.key}」去「${exit.to}」，回不来；如果不是故意的，给对面也加一个出口`);
      }
    });
  });

  clues.forEach((clue, i) => {
    if (clue.location && !locationKeys.has(clue.location)) r.error(`clues[${i}].location`, `没有这个地点「${clue.location}」`);
    if (clue.points.length === 0) r.error(`clues[${i}].points`, '至少要指向一条真相');
    for (const point of clue.points) {
      if (point && !pointKeys.has(point)) r.error(`clues[${i}].points`, `truth.points 里没有「${point}」`);
    }
  });

  npcs.forEach((npc, i) => {
    if (npc.location && !locationKeys.has(npc.location)) r.error(`npcs[${i}].location`, `没有这个地点「${npc.location}」`);
  });

  // 每条真相至少要有一条线索指向它；最好有两条，一条没找到还有退路（一条线索把同一条真相写了两遍的，算一条）
  const pointedBy = new Map<string, number>();
  for (const clue of clues) for (const point of new Set(clue.points)) pointedBy.set(point, (pointedBy.get(point) ?? 0) + 1);
  for (const point of truth.points) {
    const n = pointedBy.get(point.key) ?? 0;
    if (n === 0) r.error(`truth.points「${point.key}」`, '没有任何线索指向这条真相，玩家不可能查出来');
    else if (n === 1) r.warn(`truth.points「${point.key}」`, '只有一条线索指向这条真相；最好再加一条，免得错过一条就卡住');
  }
  if (!clues.some((c) => c.core)) r.warn('clues', '没有标记为 core 的关键线索');

  // 从各身份的起点出发，看哪些地点走得到
  const reachable = new Set<string>();
  const queue = roles.map((role) => role.startLocation).filter((k) => locationKeys.has(k));
  for (let head = 0; head < queue.length; head++) {
    const k = queue[head];
    if (reachable.has(k)) continue;
    reachable.add(k);
    for (const to of exitsOf.get(k) ?? []) if (!reachable.has(to)) queue.push(to);
  }
  // 每个地点有哪些关键线索（按线索的顺序）
  const coreAt = new Map<string, Clue[]>();
  for (const clue of clues) {
    if (!clue.core) continue;
    const list = coreAt.get(clue.location);
    if (list) list.push(clue);
    else coreAt.set(clue.location, [clue]);
  }
  locations.forEach((loc, i) => {
    if (!loc.key || reachable.has(loc.key)) return;
    const coreHere = coreAt.get(loc.key) ?? [];
    if (coreHere.length) r.error(`locations[${i}]`, `「${loc.name}」从任何起点都走不到，但这里有关键线索：${coreHere.map((c) => c.key).join('、')}`);
    else r.warn(`locations[${i}]`, `「${loc.name}」从任何起点都走不到`);
  });

  const startAt = gameMinutes(start);
  timeline.forEach((ev, i) => {
    if (gameMinutes(ev.at) < startAt) r.warn(`timeline[${i}]`, '发生在开场之前，玩家赶不上');
    if (i > 0 && gameMinutes(ev.at) < gameMinutes(timeline[i - 1].at)) r.warn(`timeline[${i}]`, '比上一条还早，最好按时间顺序排');
  });
  if (endings.length < 2) r.warn('endings', '只有一个结局；至少准备两个，让玩家的选择有分量');
  if (dungeon) checkDungeon(r, dungeon, { players, locationKeys, clueKeys: new Set(clues.map((c) => c.key)), npcKeys: new Set(npcs.map((n) => n.key)), endings });
  treasure5e.forEach((t, i) => {
    if (t.location && !locationKeys.has(t.location)) r.error(`treasure[${i}].location`, `没有这个地点「${t.location}」`);
  });

  const scenario: Scenario | null = r.errors.length
    ? null
    : {
        format: SCENARIO_FORMAT,
        title,
        category,
        intro,
        author,
        ...(rules === 2 ? { rules: 2 as const, ...(dungeon ? { dungeon } : {}), ...(enemies.length ? { enemies } : {}) } : {}),
        ...(rules === '5e' ? { rules: '5e' as const, level: level5e, monsters: monsters5e, treasure: treasure5e } : {}),
        genre,
        tone,
        players,
        expectedDays,
        relation,
        stress,
        start,
        safety,
        opening,
        roles,
        locations,
        clues,
        npcs,
        truth,
        timeline,
        endings,
      };
  return { scenario, errors: r.errors, warnings: r.warnings };
}

// ---------- 5E 模组（V0.9.0） ----------

const MONSTER_KEYS = new Set(MONSTER_INDEX.map((m) => m.key));
const ITEM_KEYS = new Map(ITEM_INDEX.map((i) => [i.key, i.kind]));

/** 物品 key 对不对：SRD 的物品；武器、护甲后面可以带 +1～+3。 */
export function validItemKey5e(key: string): boolean {
  const m = /^(.*)\+([1-3])$/.exec(key);
  if (m) {
    const kind = ITEM_KEYS.get(m[1]);
    return kind === 'weapon' || kind === 'armor';
  }
  return ITEM_KEYS.has(key);
}

function readCheck5e(r: Reader, co: Obj, path: string): Check5e {
  const skill = co.skill === undefined || co.skill === null ? null : r.oneOf(co, 'skill', path, SKILL_KEYS);
  const ability = co.ability === undefined || co.ability === null ? (skill ? SKILL_ABILITY[skill] : null) : r.oneOf(co, 'ability', path, ABILITIES);
  if (!skill && !ability) r.error(path, '5E 的检定要写 skill（技能）或 ability（属性），再写 dc');
  return { skill, ability: ability ?? 'wis', dc: r.int(co, 'dc', path, 5, 30) };
}

function readMonsters5e(r: Reader, root: Obj): ScenarioMonster5e[] {
  return r.arr(root, 'monsters', '剧本', 0, 20).map((v, i) => {
    const p = `monsters[${i}]`;
    const o = r.obj(v, p);
    const key = r.key(o, p);
    const name = r.str(o, 'name', p, 20);
    const description = r.str(o, 'description', p, 300);
    const hasRef = o.monster !== undefined && o.monster !== null;
    const hasStats = o.stats !== undefined && o.stats !== null;
    if (hasRef === hasStats) {
      r.error(p, '写 monster（用 SRD 的怪物，填怪物 key）或者 stats（自己写数据块），两个写一个');
      return { key, name, description, monster: null, stats: null };
    }
    if (hasRef) {
      const monster = r.str(o, 'monster', p, 60);
      if (monster && !MONSTER_KEYS.has(monster)) r.error(`${p}.monster`, `没有这个怪物「${monster}」（要用 SRD 怪物表里的 key）`);
      return { key, name, description, monster, stats: null };
    }
    return { key, name, description, monster: null, stats: readStats5e(r, r.obj(o.stats, `${p}.stats`), `${p}.stats`, name) };
  });
}

/** 自己写的怪物数据块。 */
function readStats5e(r: Reader, o: Obj, p: string, name: string): MonsterData {
  const crRaw = o.cr;
  const cr = typeof crRaw === 'number' && [0, 0.125, 0.25, 0.5].includes(crRaw) ? crRaw : r.int(o, 'cr', p, 0, 10);
  const abilitiesObj = r.obj(o.abilities, `${p}.abilities`);
  const abilities = Object.fromEntries(ABILITIES.map((a) => [a, r.int(abilitiesObj, a, `${p}.abilities`, 1, 30)])) as Record<Ability, number>;
  const bonusMap = <K extends string>(key: string, keys: readonly K[]): Partial<Record<K, number>> => {
    if (o[key] === undefined || o[key] === null) return {};
    const m = r.obj(o[key], `${p}.${key}`);
    const out: Partial<Record<K, number>> = {};
    for (const k of Object.keys(m)) {
      if (!(keys as readonly string[]).includes(k)) r.error(`${p}.${key}.${k}`, `只能是 ${keys.join(' / ')}`);
      else out[k as K] = r.int(m, k, `${p}.${key}`, -5, 15);
    }
    return out;
  };
  const typeList = (key: string): string[] => {
    if (o[key] === undefined || o[key] === null) return [];
    return r.arr(o, key, p, 0, 13).map((t, j) => {
      if (typeof t !== 'string' || !(DAMAGE_TYPES as readonly string[]).includes(t)) {
        r.error(`${p}.${key}[${j}]`, `伤害类型只能是 ${DAMAGE_TYPES.join(' / ')}`);
        return 'fire';
      }
      return t;
    });
  };
  const conditionImmune = (o.conditionImmune === undefined || o.conditionImmune === null ? [] : r.arr(o, 'conditionImmune', p, 0, 15)).map((t, j) => {
    if (typeof t !== 'string' || !(CONDITIONS as readonly string[]).includes(t)) {
      r.error(`${p}.conditionImmune[${j}]`, `状态只能是 ${CONDITIONS.join(' / ')}`);
      return 'charmed' as Condition5e;
    }
    return t as Condition5e;
  });
  const actions = (key: string, min: number, max: number): MonsterAction[] =>
    (o[key] === undefined || o[key] === null ? (min ? r.arr(o, key, p, min, max) : []) : r.arr(o, key, p, min, max)).map((v, j) => readAction5e(r, r.obj(v, `${p}.${key}[${j}]`), `${p}.${key}[${j}]`));
  const pb = cr >= 5 ? 3 : 2;
  return {
    key: '',
    name,
    size: o.size === undefined ? '中型' : r.str(o, 'size', p, 10),
    type: o.type === undefined ? '' : r.str(o, 'type', p, 20, 0),
    alignment: o.alignment === undefined ? '' : r.str(o, 'alignment', p, 20, 0),
    ac: r.int(o, 'ac', p, 5, 25),
    acNote: '',
    hp: r.int(o, 'hp', p, 1, 300),
    hitDice: o.hitDice === undefined ? '' : r.str(o, 'hitDice', p, 20, 0),
    speed: o.speed === undefined ? '30 尺' : r.str(o, 'speed', p, 60),
    abilities,
    saves: bonusMap('saves', ABILITIES),
    skills: bonusMap('skills', SKILL_KEYS),
    resist: typeList('resist'),
    vulnerable: typeList('vulnerable'),
    immune: typeList('immune'),
    conditionImmune,
    senses: o.senses === undefined ? `被动察觉 ${10 + Math.floor((abilities.wis - 10) / 2)}` : r.str(o, 'senses', p, 80),
    languages: o.languages === undefined ? '' : r.str(o, 'languages', p, 80, 0),
    cr,
    xp: 0,
    pb,
    traits: actions('traits', 0, 6),
    actions: actions('actions', 1, 8),
    bonusActions: actions('bonusActions', 0, 4),
    reactions: actions('reactions', 0, 4),
  };
}

function readAction5e(r: Reader, o: Obj, p: string): MonsterAction {
  const damage = (o.damage === undefined || o.damage === null ? [] : r.arr(o, 'damage', p, 0, 3)).map((v, j) => {
    const dp = `${p}.damage[${j}]`;
    const d = r.obj(v, dp);
    const dice = r.str(d, 'dice', dp, 20);
    if (dice && !parseDice(dice)) r.error(`${dp}.dice`, '骰子要写成 2d6+3 这样');
    const type = r.oneOf(d, 'type', dp, DAMAGE_TYPES) as DamageType;
    // 第二段以后可以写 when：adv 攻击有优势时才有、if 描述里的条件满足才有、or 换掉第一段
    if (d.when === undefined || d.when === null) return { dice: dice.replace(/\s/g, ''), type };
    if (j === 0) r.error(`${dp}.when`, '第一段伤害一直都有，不能写 when');
    return { dice: dice.replace(/\s/g, ''), type, when: r.oneOf(d, 'when', dp, ['adv', 'if', 'or'] as const) };
  });
  let save: MonsterAction['save'] = null;
  if (o.save !== undefined && o.save !== null) {
    const so = r.obj(o.save, `${p}.save`);
    save = { ability: r.oneOf(so, 'ability', `${p}.save`, ABILITIES), dc: r.int(so, 'dc', `${p}.save`, 5, 25), onSuccess: r.oneOf(so, 'onSuccess', `${p}.save`, ['half', 'none'] as const) };
  }
  let saveCondition: Condition5e | undefined;
  if (o.saveCondition !== undefined && o.saveCondition !== null) {
    if (!save) r.error(`${p}.saveCondition`, '写了 saveCondition（豁免失败后的状态）就要写 save');
    saveCondition = r.oneOf(o, 'saveCondition', p, CONDITIONS) as Condition5e;
  }
  return {
    ...(saveCondition ? { saveCondition } : {}),
    name: r.str(o, 'name', p, 30),
    desc: r.str(o, 'desc', p, 400),
    attack: o.attack === undefined || o.attack === null ? null : r.int(o, 'attack', p, -5, 15),
    damage,
    save,
    recharge: o.recharge === undefined || o.recharge === null ? null : r.int(o, 'recharge', p, 4, 6),
    perDay: o.perDay === undefined || o.perDay === null ? null : r.int(o, 'perDay', p, 1, 3),
    multiattack: o.multiattack === true,
  };
}

function readTreasure5e(r: Reader, root: Obj): Treasure5e[] {
  return r.arr(root, 'treasure', '剧本', 0, 30).map((v, i) => {
    const p = `treasure[${i}]`;
    const o = r.obj(v, p);
    const items = (o.items === undefined || o.items === null ? [] : r.arr(o, 'items', p, 0, 8)).map((x, j) => {
      const ip = `${p}.items[${j}]`;
      const io = r.obj(x, ip);
      const item = r.str(io, 'item', ip, 60);
      if (item && !validItemKey5e(item)) r.error(`${ip}.item`, `没有这个物品「${item}」（要用 SRD 物品表里的 key；武器、护甲后面可以加 +1、+2、+3）`);
      return { item, count: r.int(io, 'count', ip, 1, 50) };
    });
    const gold = o.gold === undefined || o.gold === null ? 0 : r.int(o, 'gold', p, 0, 10000);
    if (!items.length && !gold) r.error(p, '宝藏里至少要有一件物品或者一些金币');
    return { key: r.key(o, p), location: r.str(o, 'location', p, 40), how: r.str(o, 'how', p, 200), items, gold };
  });
}

/** 5E 模组里的怪物数据块：SRD 的（monsters 传进来查），或者剧本自己写的。 */
export function scenarioMonster5e(scenario: Scenario, key: string, srd: (key: string) => MonsterData | null): (MonsterData & { label: string; description: string }) | null {
  const m = scenario.monsters?.find((x) => x.key === key);
  if (!m) return null;
  const data = m.monster ? srd(m.monster) : m.stats;
  return data ? { ...data, key: m.key, label: m.name, description: m.description } : null;
}

void isAbility;
void isSkill;

// ---------- 地下城（V0.7.0） ----------

function readDungeon(r: Reader, value: unknown): Dungeon {
  const o = r.obj(value, 'dungeon');
  const level = r.int(o, 'level', 'dungeon', LEVEL_MIN, LEVEL_MAX);
  const size = r.oneOf(o, 'size', 'dungeon', ['small', 'large'] as const);
  const exit = o.exit === undefined || o.exit === null ? null : r.str(o, 'exit', 'dungeon', 40);

  return readDungeonRest(r, o, level, size, exit, readEnemies(r, o, 'dungeon', 1));
}

function readEnemies(r: Reader, o: Obj, path: string, min = 0): DungeonEnemy[] {
  return r.arr(o, 'enemies', path, min, 20).map((v, i) => {
    const p = `${path === '剧本' ? '' : `${path}.`}enemies[${i}]`;
    const e = r.obj(v, p);
    const enemy: DungeonEnemy = {
      key: r.key(e, p),
      name: r.str(e, 'name', p, 20),
      tier: r.oneOf(e, 'tier', p, ['minion', 'elite', 'boss'] as const),
      description: r.str(e, 'description', p, 300),
      abilities: e.abilities === undefined ? [] : r.strList(e, 'abilities', p, 4, 120),
    };
    if (e.tweak !== undefined && e.tweak !== null) {
      const t = r.obj(e.tweak, `${p}.tweak`);
      const tweak: NonNullable<DungeonEnemy['tweak']> = {};
      for (const k of ['hp', 'defense', 'attack'] as const) {
        if (t[k] !== undefined) tweak[k] = r.int(t, k, `${p}.tweak`, ENEMY_TWEAK[k][0], ENEMY_TWEAK[k][1]);
      }
      enemy.tweak = tweak;
    }
    return enemy;
  });
}

function readDungeonRest(r: Reader, o: Obj, level: number, size: DungeonSize, exit: string | null, enemies: DungeonEnemy[]): Dungeon {
  const encounters: DungeonEncounter[] = (o.encounters === undefined ? [] : r.arr(o, 'encounters', 'dungeon', 0, 20)).map((v, i) => {
    const p = `dungeon.encounters[${i}]`;
    const e = r.obj(v, p);
    return {
      key: r.key(e, p),
      title: r.str(e, 'title', p, 30),
      enemies: r.arr(e, 'enemies', p, 1, 6).map((x, j) => {
        const xp = `${p}.enemies[${j}]`;
        const xo = r.obj(x, xp);
        return { enemy: r.str(xo, 'enemy', xp, 40), count: r.int(xo, 'count', xp, 1, 6) };
      }),
      places: r.strList(e, 'places', p, 6, 40),
      trigger: r.str(e, 'trigger', p, 200),
    };
  });

  const loot: DungeonLoot[] = (o.loot === undefined ? [] : r.arr(o, 'loot', 'dungeon', 0, 30)).map((v, i) => {
    const p = `dungeon.loot[${i}]`;
    const l = r.obj(v, p);
    const ro = r.obj(l.reward, `${p}.reward`);
    const kind = r.oneOf(ro, 'kind', `${p}.reward`, ['gear', 'item', 'crystals', 'legendary', 'manual'] as const);
    let reward: LootReward;
    if (kind === 'gear') {
      reward = { kind };
      if (ro.slot !== undefined && ro.slot !== null) reward.slot = r.oneOf(ro, 'slot', `${p}.reward`, SLOT_KEYS);
      if (ro.rarity !== undefined && ro.rarity !== null) reward.rarity = r.oneOf(ro, 'rarity', `${p}.reward`, ['common', 'fine', 'rare', 'epic'] as const);
    } else if (kind === 'item') {
      reward = { kind, item: r.oneOf(ro, 'item', `${p}.reward`, CONSUMABLE_KEYS), count: r.int(ro, 'count', `${p}.reward`, 1, 3) };
    } else if (kind === 'crystals') {
      reward = { kind, amount: r.int(ro, 'amount', `${p}.reward`, 5, 200) };
    } else {
      reward = { kind };
    }
    return { key: r.key(l, p), places: r.strList(l, 'places', p, 6, 40), how: r.str(l, 'how', p, 200), reward };
  });

  const variants: DungeonVariant[] = r.arr(o, 'variants', 'dungeon', 2, 4).map((v, i) => {
    const p = `dungeon.variants[${i}]`;
    const x = r.obj(v, p);
    const clues: Record<string, string> = {};
    if (x.clues !== undefined && x.clues !== null) {
      for (const [k, text] of Object.entries(r.obj(x.clues, `${p}.clues`))) {
        if (typeof text !== 'string' || !text.trim()) r.error(`${p}.clues.${k}`, '应该是这一种真相下这条线索的内容（文字）');
        else if ([...text.trim()].length > 800) r.error(`${p}.clues.${k}`, '最多800个字');
        else clues[k] = text.trim();
      }
    }
    const npcs: DungeonVariant['npcs'] = {};
    if (x.npcs !== undefined && x.npcs !== null) {
      for (const [k, nv] of Object.entries(r.obj(x.npcs, `${p}.npcs`))) {
        const np = `${p}.npcs.${k}`;
        const no = r.obj(nv, np);
        const entry: DungeonVariant['npcs'][string] = {};
        if (no.knows !== undefined) entry.knows = r.strList(no, 'knows', np, 12, 300);
        if (no.wants !== undefined) entry.wants = r.str(no, 'wants', np, 200);
        if (no.attitude !== undefined) entry.attitude = r.str(no, 'attitude', np, 200);
        npcs[k] = entry;
      }
    }
    return {
      key: r.key(x, p),
      title: r.str(x, 'title', p, 30),
      truth: r.str(x, 'truth', p, 1500),
      clues,
      npcs,
      note: x.note === undefined ? '' : r.str(x, 'note', p, 500, 0),
    };
  });

  const bo = r.obj(o.boss, 'dungeon.boss');
  const boss: DungeonBoss = {
    enemy: r.str(bo, 'enemy', 'dungeon.boss', 40),
    location: r.str(bo, 'location', 'dungeon.boss', 40),
    weaknesses: r.arr(bo, 'weaknesses', 'dungeon.boss', 2, 4).map((v, i) => {
      const p = `dungeon.boss.weaknesses[${i}]`;
      const w = r.obj(v, p);
      return { key: r.key(w, p), text: r.str(w, 'text', p, 300), hint: r.str(w, 'hint', p, 300) };
    }),
    shield: bo.shield === undefined || bo.shield === null ? '' : r.str(bo, 'shield', 'dungeon.boss', 400, 0),
  };

  return { level, size, exit, enemies, encounters, loot, variants, boss };
}

function checkDungeon(
  r: Reader,
  d: Dungeon,
  ctx: { players: { min: number; max: number }; locationKeys: Set<string>; clueKeys: Set<string>; npcKeys: Set<string>; endings: Ending[] },
) {
  for (const [items, path] of [
    [d.enemies, 'dungeon.enemies'],
    [d.encounters, 'dungeon.encounters'],
    [d.loot, 'dungeon.loot'],
    [d.variants, 'dungeon.variants'],
    [d.boss.weaknesses, 'dungeon.boss.weaknesses'],
  ] as const) {
    r.unique(items, path);
  }
  const place = (key: string, path: string) => {
    if (key && !ctx.locationKeys.has(key)) r.error(path, `没有这个地点「${key}」`);
  };
  if (d.size === 'small' && ctx.players.max > SMALL_MAX_PLAYERS) r.error('players', `小型地下城最多 ${SMALL_MAX_PLAYERS} 个人`);
  if (d.size === 'large' && (ctx.players.max < LARGE_RECOMMENDED || ctx.players.max > 6)) {
    r.error('players', `大型地下城推荐 ${LARGE_RECOMMENDED} 个人：players.max 要在 ${LARGE_RECOMMENDED}～6 之间`);
  }
  if (d.exit) place(d.exit, 'dungeon.exit');

  const enemyKeys = new Map(d.enemies.map((e) => [e.key, e]));
  d.encounters.forEach((e, i) => {
    e.enemies.forEach((x, j) => {
      if (x.enemy && !enemyKeys.has(x.enemy)) r.error(`dungeon.encounters[${i}].enemies[${j}].enemy`, `dungeon.enemies 里没有「${x.enemy}」`);
      else if (enemyKeys.get(x.enemy)?.tier === 'boss') r.error(`dungeon.encounters[${i}].enemies[${j}]`, '首领不放在遇敌里，写在 dungeon.boss');
    });
    if (!e.places.length) r.error(`dungeon.encounters[${i}].places`, '至少写一个地点');
    e.places.forEach((k, j) => place(k, `dungeon.encounters[${i}].places[${j}]`));
  });
  d.loot.forEach((l, i) => {
    if (!l.places.length) r.error(`dungeon.loot[${i}].places`, '至少写一个地点');
    l.places.forEach((k, j) => place(k, `dungeon.loot[${i}].places[${j}]`));
    if (l.reward.kind === 'legendary' && d.size !== 'large') r.error(`dungeon.loot[${i}].reward`, '传奇装备只在大型地下城里掉');
  });
  if (!d.loot.some((l) => l.reward.kind === 'item')) r.warn('dungeon.loot', '没有放道具（药水之类），玩家受了伤很难撑下去');

  const bossEnemy = enemyKeys.get(d.boss.enemy);
  if (!bossEnemy) r.error('dungeon.boss.enemy', `dungeon.enemies 里没有「${d.boss.enemy}」`);
  else if (bossEnemy.tier !== 'boss') r.error('dungeon.boss.enemy', `「${d.boss.enemy}」的 tier 要是 boss`);
  place(d.boss.location, 'dungeon.boss.location');
  if (d.size === 'large' && !d.boss.shield) r.error('dungeon.boss.shield', '大型地下城的首领要写 shield：开打时它的护盾要几个人怎样配合才能破开');

  d.variants.forEach((v, i) => {
    for (const k of Object.keys(v.clues)) if (!ctx.clueKeys.has(k)) r.error(`dungeon.variants[${i}].clues`, `clues 里没有「${k}」`);
    for (const k of Object.keys(v.npcs)) if (!ctx.npcKeys.has(k)) r.error(`dungeon.variants[${i}].npcs`, `npcs 里没有「${k}」`);
  });

  if (!ctx.endings.some((e) => e.result === 'clear')) r.error('endings', '地下城至少要有一个通关的结局（result 写 "clear"）');
  if (!ctx.endings.some((e) => e.result === 'fail')) r.warn('endings', '没有失败的结局（result 写 "fail"）：全军覆没或者被困住时该怎么收尾');
}

/**
 * 装进对局时给地下城挑这一局的变化：真相是哪一种、每一拨敌人和每件宝物在哪、首领的弱点是哪一种。
 * 返回这一局用的剧本：真相、线索内容、NPC 换成挑中的那一种，别的变化去掉（主持 AI 只看得到这一局的）。
 * rand(n) 返回 0～n-1。已经挑过的（有 run）原样返回。
 */
export function rollDungeonRun(scenario: Scenario, rand: (n: number) => number): Scenario {
  const d = scenario.dungeon;
  if (!d || d.run) return scenario;
  const pick = <T,>(list: readonly T[]): T => list[rand(list.length)];
  const variant = pick(d.variants);
  const weakness = pick(d.boss.weaknesses);
  const encounters = Object.fromEntries(d.encounters.map((e) => [e.key, pick(e.places)]));
  const loot = Object.fromEntries(d.loot.map((l) => [l.key, pick(l.places)]));
  return {
    ...scenario,
    truth: { ...scenario.truth, summary: `${scenario.truth.summary}\n\n【这一局的真相：${variant.title}】${variant.truth}` },
    clues: scenario.clues.map((c) => (variant.clues[c.key] ? { ...c, content: variant.clues[c.key] } : c)),
    npcs: scenario.npcs.map((n) => {
      const o = variant.npcs[n.key];
      return o ? { ...n, ...(o.knows ? { knows: o.knows } : {}), ...(o.wants ? { wants: o.wants } : {}), ...(o.attitude ? { attitude: o.attitude } : {}) } : n;
    }),
    dungeon: {
      ...d,
      // 挑中的变化已经套进了真相、线索、NPC：这里只留标题和给主持人的提示，不再把同样的内容放一遍
      variants: [{ ...variant, truth: '', clues: {}, npcs: {} }],
      boss: { ...d.boss, weaknesses: [weakness] },
      encounters: d.encounters.map((e) => ({ ...e, at: encounters[e.key] })),
      loot: d.loot.map((l) => ({ ...l, at: loot[l.key] })),
      run: { variant: variant.key, variantTitle: variant.title, encounters, loot, weakness: weakness.key },
    },
  };
}

/**
 * AI 生成的剧本要求更严（V0.8.3 从 studio.ts 挪到这里，写剧本 skill 的检查脚本也用）：每条真相至少 3 条线索、分散在不同地点；时间线不超出预计的天数。
 * 剧本可能还有别的错误、格式不全，这里只看读得出来的部分，和格式检查的错误一起交给 AI 改。
 */
export function strictIssues(data: unknown): string[] {
  const s = (data ?? {}) as Partial<Record<keyof Scenario, any>>;
  const issues: string[] = [];
  const clues = Array.isArray(s.clues) ? s.clues.filter((c: any) => c && Array.isArray(c.points)) : [];
  const points = Array.isArray(s.truth?.points) ? s.truth.points.filter((p: any) => p && typeof p.key === 'string') : [];
  for (const point of points) {
    const found = clues.filter((c: any) => c.points.includes(point.key));
    if (found.length < 3) issues.push(`truth.points「${point.key}」：只有${found.length}条线索指向这条真相，至少要3条`);
    else if (new Set(found.map((c: any) => c.location)).size < 2) issues.push(`truth.points「${point.key}」：指向这条真相的线索都在同一个地点，要分散到至少两个地点`);
  }
  // 生成的剧本要有简介（挑剧本时看的）
  if (typeof s.intro !== 'string' || !s.intro.trim()) issues.push('intro：要写一段简介');
  // 生成的剧本每个身份都要写固定的属性、专长、外貌（老剧本没写时会补默认的，生成的不行）
  // 地下城的身份只是角色在这个故事里的处境：属性、专长、外貌都在玩家自己的角色卡上
  (Array.isArray(s.roles) ? s.roles : []).forEach((r: any, i: number) => {
    const missing = (s.dungeon || s.rules === '5e' ? [] : ['attributes', 'specialties', 'appearance']).filter((k) => r?.[k] === undefined);
    if (missing.length) issues.push(`roles[${i}]：缺少固定的 ${missing.join('、')}`);
  });
  const startDay = typeof s.start?.day === 'number' ? s.start.day : 1;
  const days = typeof s.expectedDays === 'number' ? s.expectedDays : 30;
  (Array.isArray(s.timeline) ? s.timeline : []).forEach((e: any, i: number) => {
    const day = e?.at?.day;
    if (typeof day === 'number' && day > startDay + days) issues.push(`timeline[${i}]：发生在第${day}天，超出了预计的${days}天（开场是第${startDay}天，时间线最晚写到第${startDay + days}天）`);
  });
  return issues;
}
