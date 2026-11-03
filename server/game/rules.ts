import { randomInt } from 'node:crypto';
import {
  ASSIST_BONUS,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MAX,
  ATTRIBUTE_NAME,
  INCAPACITATED_LEVEL,
  MODIFIER_MAX,
  MODIFIER_MIN,
  outcomeFor,
  PENALTY_LEVEL,
  SPECIALTY_COUNT,
  SPECIALTY_MAX_LENGTH,
  STARTING_VALUES,
  STRESS_LABEL,
  TRACK_MAX,
  WOUND_LABEL,
  type AttributeKey,
  type Outcome,
} from '../../shared/rules';

// 规则引擎：只做计算，不碰数据库。掷骰一律由程序来做，AI只决定掷什么、加减多少。

/** 掷一颗 sides 面的骰子，返回 1～sides。测试时可以换成固定的结果。 */
export type Rng = (sides: number) => number;
export const secureRng: Rng = (sides) => randomInt(1, sides + 1);

export type Dice = [number, number];

export function roll2d6(rng: Rng = secureRng): Dice {
  return [rng(6), rng(6)];
}

export type Attributes = Record<AttributeKey, number>;

/** 一次检定要算进去的东西。 */
export type CheckInput = {
  attribute: AttributeKey;
  attributeValue: number;
  /** 卡片上属性那一项写什么（自带角色的属性带小数时写成「敏捷（1.4）」，V0.6.0）；不写就是属性名。 */
  attributeLabel?: string;
  /** 行动符合的专长，+1；没有就是 null。 */
  specialty: string | null;
  /** 行动正好用上的装备，+1（V0.6.0，一次最多一件）；没有就是 null。 */
  gear?: string | null;
  /** 主持AI按情况给的修正，-2～+2。 */
  modifier: number;
  /** 有人协助，+1。 */
  assisted: boolean;
  /** 伤势、心智、状态带来的减值。 */
  penalties: Penalty[];
};

/** kind：减值从哪来。骰子卡片会给在场的人看，状态和心智只显示成笼统的“状态”“心智”，不暴露具体内容。 */
export type Penalty = { reason: string; value: number; kind?: 'wounds' | 'stress' | 'condition' };

export type CheckResult = {
  dice: Dice;
  total: number;
  outcome: Outcome;
  /** 总点数是怎么来的，给玩家看。 */
  parts: { label: string; value: number }[];
};

/** 检查AI给的检定参数。返回错误说明，没问题时返回 null。 */
export function checkInputError(input: Pick<CheckInput, 'attribute' | 'modifier'>): string | null {
  if (!ATTRIBUTE_KEYS.includes(input.attribute)) return `没有这个属性：${String(input.attribute)}`;
  if (!Number.isInteger(input.modifier) || input.modifier < MODIFIER_MIN || input.modifier > MODIFIER_MAX) {
    return `情境修正要在 ${MODIFIER_MIN}～+${MODIFIER_MAX} 之间`;
  }
  return null;
}

export function resolveCheck(dice: Dice, input: CheckInput): CheckResult {
  const parts = [
    { label: '骰子', value: dice[0] + dice[1] },
    { label: input.attributeLabel ?? ATTRIBUTE_NAME[input.attribute], value: input.attributeValue },
  ];
  if (input.specialty) parts.push({ label: `专长「${input.specialty}」`, value: 1 });
  if (input.gear) parts.push({ label: `装备「${input.gear}」`, value: 1 });
  if (input.modifier) parts.push({ label: '情境修正', value: input.modifier });
  if (input.assisted) parts.push({ label: '协助', value: ASSIST_BONUS });
  for (const p of input.penalties) parts.push({ label: p.reason, value: p.value });
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  return { dice, total, outcome: outcomeFor(dice[0], dice[1], total), parts };
}

export function check(input: CheckInput, rng: Rng = secureRng): CheckResult {
  return resolveCheck(roll2d6(rng), input);
}

/** 对抗：双方各掷一次，总点数高的赢，平局维持原状。 */
export function opposed(a: CheckInput, b: CheckInput, rng: Rng = secureRng) {
  const ra = check(a, rng);
  const rb = check(b, rng);
  const winner: 'a' | 'b' | 'tie' = ra.total > rb.total ? 'a' : rb.total > ra.total ? 'b' : 'tie';
  return { a: ra, b: rb, winner };
}

// ---------- 伤势、心智、状态 ----------

/** 状态标签由主持AI加上或去掉，比如“中毒”“疲惫”；可以带一个对所有检定的减值。 */
export type Condition = { name: string; effect: string; penalty: number };

export type CharacterState = {
  wounds: number;
  stress: number;
  conditions: Condition[];
  dead: boolean;
};

export const FRESH_STATE: CharacterState = { wounds: 0, stress: 0, conditions: [], dead: false };

export function penaltiesFor(state: CharacterState, stressEnabled: boolean): Penalty[] {
  const list: Penalty[] = [];
  if (state.wounds >= PENALTY_LEVEL) list.push({ reason: WOUND_LABEL[state.wounds], value: -1, kind: 'wounds' });
  if (stressEnabled && state.stress >= PENALTY_LEVEL) list.push({ reason: STRESS_LABEL[state.stress], value: -1, kind: 'stress' });
  for (const c of state.conditions) if (c.penalty) list.push({ reason: c.name, value: c.penalty, kind: 'condition' });
  return list;
}

/** 现在能不能自己行动；不能时返回原因。 */
export function actionBlocker(state: CharacterState, stressEnabled: boolean): string | null {
  if (state.dead) return '这个角色已经死了';
  if (state.wounds >= INCAPACITATED_LEVEL) return '濒死，不能行动，要等别人救治';
  if (stressEnabled && state.stress >= INCAPACITATED_LEVEL) return '失控了，暂时不能自己行动';
  return null;
}

/**
 * 受伤或恢复：amount 为正是往坏的方向走几格，为负是恢复几格。
 * 伤势每格依次是 轻伤 → 重伤 → 濒死，濒死之后再受伤就死亡；心智最多到“失控”，不会死。
 * allowDeath 是 false（房主选了角色不会死，V0.6.0）：伤势最多停在濒死。
 */
export function applyHarm(
  state: CharacterState,
  track: 'wounds' | 'stress',
  amount: number,
  allowDeath = true,
): { state: CharacterState; died: boolean } {
  if (!Number.isInteger(amount) || amount === 0 || state.dead) return { state, died: false };
  const current = state[track];
  if (amount < 0) return { state: { ...state, [track]: Math.max(0, current + amount) }, died: false };
  if (track === 'wounds' && current + amount > TRACK_MAX) {
    if (!allowDeath) return { state: { ...state, wounds: TRACK_MAX }, died: false };
    return { state: { ...state, wounds: TRACK_MAX, dead: true }, died: true };
  }
  return { state: { ...state, [track]: Math.min(TRACK_MAX, current + amount) }, died: false };
}

// ---------- 车卡 ----------

export type NewCharacter = {
  name: string;
  roleKey: string;
  attributes: Attributes;
  specialties: string[];
  appearance: string;
  goal: string;
};

/** 检查玩家提交的角色卡。roleKeys 是剧本里还没被别人选走的身份。 */
export function validateNewCharacter(
  input: unknown,
  roleKeys: string[],
): { ok: true; value: NewCharacter } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const o = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;

  const name = typeof o.name === 'string' ? o.name.trim() : '';
  if (name.length < 1 || [...name].length > 20) errors.push('角色名要在1～20个字之间');

  const roleKey = typeof o.roleKey === 'string' ? o.roleKey : '';
  if (!roleKeys.includes(roleKey)) errors.push('请从剧本给的身份里选一个（可能已经被别人选走了）');

  const attrs = (typeof o.attributes === 'object' && o.attributes !== null ? o.attributes : {}) as Record<string, unknown>;
  const values = ATTRIBUTE_KEYS.map((k) => attrs[k]);
  const given = values.filter((v): v is number => typeof v === 'number').sort((a, b) => b - a);
  const expected = [...STARTING_VALUES].sort((a, b) => b - a);
  if (given.length !== ATTRIBUTE_KEYS.length || given.some((v, i) => v !== expected[i])) {
    errors.push(`五个属性要把 ${STARTING_VALUES.map((v) => (v > 0 ? `+${v}` : String(v))).join('、')} 各用一次`);
  }

  const specialties = Array.isArray(o.specialties)
    ? o.specialties.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
    : [];
  if (specialties.length !== SPECIALTY_COUNT) errors.push(`要选${SPECIALTY_COUNT}个专长`);
  if (specialties.some((s) => [...s].length > SPECIALTY_MAX_LENGTH)) errors.push(`每个专长最多${SPECIALTY_MAX_LENGTH}个字`);
  if (new Set(specialties).size !== specialties.length) errors.push('两个专长不能一样');

  const appearance = typeof o.appearance === 'string' ? o.appearance.trim() : '';
  const goal = typeof o.goal === 'string' ? o.goal.trim() : '';
  if ([...appearance].length > 200) errors.push('外貌描述最多200字');
  if ([...goal].length > 200) errors.push('个人目标最多200字');

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      roleKey,
      attributes: Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, attrs[k] as number])) as Attributes,
      specialties,
      appearance,
      goal,
    },
  };
}

// ---------- 成长 ----------

export type Growth = { type: 'attribute'; key: AttributeKey } | { type: 'specialty'; name: string };

/** 章节结束时的成长：一个属性 +1（最高 +3），或者学会一个新专长。 */
export function applyGrowth(
  attributes: Attributes,
  specialties: string[],
  growth: Growth,
): { ok: true; attributes: Attributes; specialties: string[] } | { ok: false; error: string } {
  if (growth.type === 'attribute') {
    if (!ATTRIBUTE_KEYS.includes(growth.key)) return { ok: false, error: '没有这个属性' };
    if (attributes[growth.key] >= ATTRIBUTE_MAX) return { ok: false, error: `${ATTRIBUTE_NAME[growth.key]}已经是最高的 +${ATTRIBUTE_MAX} 了` };
    return { ok: true, attributes: { ...attributes, [growth.key]: attributes[growth.key] + 1 }, specialties };
  }
  const name = growth.name.trim();
  if (!name || [...name].length > SPECIALTY_MAX_LENGTH) return { ok: false, error: `专长要在1～${SPECIALTY_MAX_LENGTH}个字之间` };
  if (specialties.includes(name)) return { ok: false, error: '已经有这个专长了' };
  return { ok: true, attributes, specialties: [...specialties, name] };
}
