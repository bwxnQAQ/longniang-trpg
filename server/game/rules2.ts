// 规则第二版（V0.7.0，地下城）的计算：只做计算，不碰数据库。数字在 shared/rules2.ts。
import { outcomeFor } from '../../shared/rules';
import { ATTRIBUTE2_KEYS, ATTRIBUTE2_NAME, ATTACK_DIE, CONSUMABLE_KEYS, DYING_TURNS, SEVERITY, characterDefense, maxHp, maxMp, type Attribute2, type Attributes2, type ConsumableKey, type Rarity, type Severity, SPECIALTY2_BONUS } from '../../shared/rules2';
import { gearTotals, type GearView } from '../../shared/gear2';
import { freshGearView } from '../legendary';
import { roll2d6, type CheckResult, type Dice, type Penalty, type Rng } from './rules';

/** 这一局捡到的一样东西（结束时活着才带得走）。 */
export type LootItem =
  | { kind: 'gear'; base: string; rarity: Rarity }
  | { kind: 'item'; item: ConsumableKey; count: number }
  | { kind: 'crystals'; amount: number }
  /** 秘籍（技能编号）：带出去以后在「我的角色」里研读。 */
  | { kind: 'manual'; skill: string };

/** 地下城里一个角色的状态（存在 characters.v2，JSON）。 */
export type V2State = {
  attributes: Attributes2;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  /** 濒死：还剩几次（同一地点再结算几次行动没人救就死）；没倒下是 null。 */
  dying: number | null;
  /** 精神值到了 0：下一次自己的行动失控，之后精神值回到 1。 */
  lostControl: boolean;
  /** 进来时穿着的装备（V0.7.0 存的没有部位，读的时候按现在的定义补上，下次保存就是新的样子）。 */
  gear: GearView[];
  /** 带进来的道具还剩几个。 */
  bag: Partial<Record<ConsumableKey, number>>;
  /** 这一局捡到的东西。 */
  loot: LootItem[];
  /** 传奇装备的本事这一局用过了（装备编号）。 */
  abilitiesUsed: string[];
  /** 学会的技能（技能编号）。 */
  skills: string[];
  /** 下一次检定或攻击的加值（同伴的「激励」之类）。 */
  boost: number;
  /** 这场战斗里护甲多加的（「金钟罩」之类，战斗结束就没了）。 */
  ward: number;
  /** 这一局碰上过几次奇遇。 */
  qiyu: number;
};

export function newV2State(attributes: Attributes2, gear: GearView[], bag: Partial<Record<ConsumableKey, number>>, skills: string[] = []): V2State {
  const hpMax = maxHp(attributes.constitution);
  const mpMax = maxMp(attributes.will);
  return { attributes, hp: hpMax, hpMax, mp: mpMax, mpMax, dying: null, lostControl: false, gear, bag, loot: [], abilitiesUsed: [], skills, boost: 0, ward: 0, qiyu: 0 };
}

export function parseV2(text: string | null | undefined): V2State | null {
  if (!text) return null;
  try {
    const v = JSON.parse(text) as Partial<V2State>;
    if (!v || typeof v !== 'object' || !v.attributes) return null;
    const attributes = Object.fromEntries(ATTRIBUTE2_KEYS.map((k) => [k, Number(v.attributes?.[k] ?? 0)])) as Attributes2;
    const hpMax = Number(v.hpMax ?? maxHp(attributes.constitution));
    const mpMax = Number(v.mpMax ?? maxMp(attributes.will));
    const bag: V2State['bag'] = {};
    for (const k of CONSUMABLE_KEYS) {
      const n = Number(v.bag?.[k] ?? 0);
      if (n > 0) bag[k] = Math.floor(n);
    }
    return {
      attributes,
      hp: Number(v.hp ?? hpMax),
      hpMax,
      mp: Number(v.mp ?? mpMax),
      mpMax,
      dying: typeof v.dying === 'number' ? v.dying : null,
      lostControl: v.lostControl === true,
      gear: Array.isArray(v.gear) ? v.gear.map(freshGearView).filter((g): g is GearView => !!g) : [],
      bag,
      loot: Array.isArray(v.loot) ? v.loot : [],
      abilitiesUsed: Array.isArray(v.abilitiesUsed) ? v.abilitiesUsed : [],
      skills: Array.isArray(v.skills) ? v.skills.filter((x): x is string => typeof x === 'string') : [],
      boost: Number(v.boost ?? 0) || 0,
      ward: Number(v.ward ?? 0) || 0,
      qiyu: Number(v.qiyu ?? 0) || 0,
    };
  } catch {
    return null;
  }
}

/** 主手的武器：加它那一项属性的攻击和伤害。 */
export function weaponOf(s: V2State): GearView | null {
  return gearTotals(s.gear).weapon;
}

/** 身上的护甲合起来减多少伤（护甲点 ÷ 3 往上取整，不低于最好的那一件，最多 6；不含这场战斗的护身）。 */
export function reductionOf(s: V2State): number {
  return gearTotals(s.gear).reduction;
}

/** 检定时自动算上的饰品：这一项属性加得最多的那一件（不加攻击；几件不叠加）。 */
export function accessoryFor(s: V2State, attribute: Attribute2): GearView | null {
  return gearTotals(s.gear).checks[attribute] ?? null;
}

export function defenseOf(s: V2State): number {
  return characterDefense(s.attributes.agility);
}

// ---------- 检定 ----------

export type Check2Input = {
  attribute: Attribute2;
  value: number;
  specialty: string | null;
  /** 自动算上的装备（饰品、攻击时的武器）。 */
  gear: { name: string; bonus: number } | null;
  modifier: number;
  assisted: boolean;
  /** 难度、人手不足、状态带来的减值（排在最后）。 */
  penalties: Penalty[];
  /** 用上首领的弱点（攻击时 +3）。 */
  weakness?: number;
  /** 同伴给的加成（「激励」之类，用一次就没了）。 */
  boost?: number;
  /** 别的加值（技能之类）。 */
  extra?: { label: string; value: number }[];
};

export function resolveCheck2(dice: Dice, input: Check2Input): CheckResult {
  const parts = [
    { label: '骰子', value: dice[0] + dice[1] },
    { label: ATTRIBUTE2_NAME[input.attribute], value: input.value },
  ];
  if (input.specialty) parts.push({ label: `专长「${input.specialty}」`, value: SPECIALTY2_BONUS });
  if (input.gear && input.gear.bonus) parts.push({ label: `装备「${input.gear.name}」`, value: input.gear.bonus });
  if (input.weakness) parts.push({ label: '弱点', value: input.weakness });
  for (const x of input.extra ?? []) if (x.value) parts.push(x);
  if (input.boost) parts.push({ label: '同伴的加成', value: input.boost });
  if (input.modifier) parts.push({ label: '情境修正', value: input.modifier });
  if (input.assisted) parts.push({ label: '协助', value: 1 });
  for (const p of input.penalties) if (p.value) parts.push({ label: p.reason, value: p.value });
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  return { dice, total, outcome: outcomeFor(dice[0], dice[1], total), parts };
}

export function check2(input: Check2Input, rng: Rng): CheckResult {
  return resolveCheck2(roll2d6(rng), input);
}

// ---------- 伤害 ----------

/** 按轻重掷伤害（在这一档的范围里随机），再加上难度带来的加值。 */
export function rollSeverity(severity: Severity, bonus: number, rng: Rng): number {
  const { min, max } = SEVERITY[severity];
  return min + rng(max - min + 1) - 1 + bonus;
}

/** 打中敌人的伤害：1d6 + 武器加值；大成功翻倍；用上弱点再翻倍。 */
export function attackDamage(weaponBonus: number, critical: boolean, weakness: boolean, rng: Rng): number {
  let damage = rng(ATTACK_DIE) + weaponBonus;
  if (critical) damage *= 2;
  if (weakness) damage *= 2;
  return damage;
}

/** 护甲减伤：打中了至少扣 1 点。 */
export function afterArmor(damage: number, armor: number): number {
  return Math.max(1, damage - armor);
}

export type HarmResult = { before: number; after: number; dying: boolean; died: boolean; lostControl: boolean };

/**
 * 扣生命值：到 0 倒地濒死（DYING_TURNS 次以内没人救就死）；已经濒死的再受伤就死了（不会死的风格停在濒死）。
 * 扣精神值：到 0 失控（下一次自己的行动失控，之后回到 1）。
 */
export function applyHp(s: V2State, delta: number, allowDeath: boolean): HarmResult & { dead: boolean } {
  const before = s.hp;
  let died = false;
  let dying = false;
  if (delta < 0 && s.dying !== null) {
    // 倒地以后再挨打：会死的风格直接死
    if (allowDeath) died = true;
    s.hp = 0;
  } else {
    s.hp = Math.max(0, Math.min(s.hpMax, s.hp + delta));
    if (s.hp === 0 && delta < 0) {
      s.dying = DYING_TURNS;
      dying = true;
    } else if (s.hp > 0 && s.dying !== null) {
      s.dying = null;
    }
  }
  return { before, after: s.hp, dying, died, lostControl: false, dead: died };
}

export function applyMp(s: V2State, delta: number): HarmResult {
  const before = s.mp;
  s.mp = Math.max(0, Math.min(s.mpMax, s.mp + delta));
  let lostControl = false;
  if (s.mp === 0 && delta < 0 && !s.lostControl) {
    s.lostControl = true;
    lostControl = true;
  }
  return { before, after: s.mp, dying: false, died: false, lostControl };
}

/** 2d6 + bonus（药水、清心丸、火油用）。 */
export function roll2d6Plus(bonus: number, rng: Rng): number {
  const [a, b] = roll2d6(rng);
  return a + b + bonus;
}
