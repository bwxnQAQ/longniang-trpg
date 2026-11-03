// 5E 规则（V0.9.0）的计算：d20 检定、攻击、伤害（抗性、临时生命值）、生命值到 0 和死亡豁免、专注、休息、法术位。
// 只做计算，不碰数据库；主持工具（tools5e.ts）调用这里。数字和名字在 shared/5e/。
import {
  ABILITY_NAME,
  CONDITION_NAME,
  DAMAGE_NAME,
  EXHAUSTION_MAX,
  MODE_LABEL,
  PHYSICAL,
  abilityMod,
  combineMode,
  parseDice,
  rollD20,
  rollDice,
  type Abilities,
  type Ability,
  type Condition5e,
  type D20Roll,
  type DamageType,
  type Rng,
  type RollMode,
} from '../../shared/5e/core';
import { RAGE_DAMAGE } from '../../shared/5e/class-rules';
import { armorOf, computeSheet } from '../../shared/5e/sheet';
import type { Card5eData, ConditionState, Effect5e, MonsterData, Monster5eState, RulesData, Sheet5e, State5e } from '../../shared/5e/types';

// ==================== 角色状态 ====================

export function newState5e(cardId: number, data: Card5eData, sheet: Sheet5e): State5e {
  return {
    cardId,
    data,
    hp: sheet.hpMax,
    tempHp: 0,
    hitDiceUsed: 0,
    death: null,
    stable: false,
    deathRound: null,
    slotsUsed: [0, 0, 0],
    pactUsed: 0,
    used: {},
    concentration: null,
    conditions: [],
    exhaustion: 0,
    effects: [],
    inspiration: data.species === 'human',
    bardicDie: null,
    wildShape: null,
    inventory: data.inventory.map((i) => ({ ...i })),
    money: data.money,
    gained: [],
    gainedMoney: 0,
  };
}

export function parseState5e(text: string | null | undefined): State5e | null {
  if (!text) return null;
  try {
    const v = JSON.parse(text) as State5e;
    if (!v || typeof v !== 'object' || !v.data) return null;
    return {
      ...v,
      tempHp: Number(v.tempHp ?? 0) || 0,
      hitDiceUsed: Number(v.hitDiceUsed ?? 0) || 0,
      death: v.death ?? null,
      stable: v.stable === true,
      deathRound: typeof v.deathRound === 'number' ? v.deathRound : null,
      slotsUsed: Array.isArray(v.slotsUsed) ? ([0, 1, 2].map((i) => Number(v.slotsUsed[i] ?? 0) || 0) as [number, number, number]) : [0, 0, 0],
      pactUsed: Number(v.pactUsed ?? 0) || 0,
      used: v.used && typeof v.used === 'object' ? v.used : {},
      concentration: v.concentration ?? null,
      conditions: Array.isArray(v.conditions) ? v.conditions : [],
      exhaustion: Number(v.exhaustion ?? 0) || 0,
      effects: Array.isArray(v.effects) ? v.effects : [],
      inspiration: v.inspiration === true,
      bardicDie: typeof v.bardicDie === 'number' ? v.bardicDie : null,
      wildShape: typeof v.wildShape === 'string' ? v.wildShape : null,
      inventory: Array.isArray(v.inventory) ? v.inventory : [],
      money: Number(v.money ?? 0) || 0,
      gained: Array.isArray(v.gained) ? v.gained : [],
      gainedMoney: Number(v.gainedMoney ?? 0) || 0,
    };
  } catch {
    return null;
  }
}

/** 一局里的角色数值：照进来时卡上的样子算（带进来的物品变了，攻击、护甲跟着变）。 */
export function sheetOf(s: State5e, rules: RulesData): Sheet5e {
  return computeSheet({ ...s.data, inventory: s.inventory, money: s.money }, rules);
}

export function hpMaxOf(s: State5e, sheet: Sheet5e): number {
  return sheet.hpMax + s.effects.reduce((sum, e) => sum + (e.mods.hpMax ?? 0), 0);
}

export function hasCondition(list: ConditionState[], key: Condition5e): boolean {
  return list.some((c) => c.key === key);
}

/** 失能：失能、麻痹、石化、震慑、昏迷都算。 */
export function incapacitated(list: ConditionState[]): boolean {
  return list.some((c) => ['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious'].includes(c.key));
}

export function isRaging(s: State5e): boolean {
  return s.effects.some((e) => e.key === 'rage');
}

/** 现在的护甲等级：卡上算好的，加上效果（法师护甲、树肤术、虔诚护盾、护盾术）；荒野变形时用野兽的。 */
export function currentAc(s: State5e, sheet: Sheet5e, rules: RulesData, beast: MonsterData | null): number {
  let ac = sheet.ac;
  if (beast) ac = beast.ac;
  else {
    const body = armorOf(rules, s.data.equipped.armor);
    const wearing = !!body && body.kind !== 'shield' && s.inventory.some((i) => i.key === body.itemKey);
    const shield = armorOf(rules, s.data.equipped.shield);
    const shieldBonus = shield && s.inventory.some((i) => i.key === shield.itemKey) ? 2 + shield.plus : 0;
    for (const e of s.effects) if (e.mods.acBase !== undefined && !wearing) ac = Math.max(ac, e.mods.acBase + sheet.mods.dex + shieldBonus);
  }
  for (const e of s.effects) if (e.mods.acMin !== undefined) ac = Math.max(ac, e.mods.acMin);
  for (const e of s.effects) ac += e.mods.ac ?? 0;
  return ac;
}

// ==================== d20 检定 ====================

export type D20Result = {
  d20: D20Roll;
  /** 加值的明细：标签和数值（骰子类的加值写成掷出来的数）。 */
  parts: { label: string; value: number }[];
  total: number;
  /** 掷出 20 / 1（攻击时是重击 / 必失）。 */
  natural20: boolean;
  natural1: boolean;
  mode: RollMode;
  /** 用掉的英雄激励、诗人激励（重掷、加骰）。 */
  rescued: string | null;
};

export type D20Input = {
  label: string;
  bonus: number;
  /** 别的加值：祝福术的 1d4、神导术、宠物帮忙……（骰子写成 "1d4"，负的 "-1d4"）。 */
  extras?: { label: string; dice?: string; value?: number }[];
  advantage?: boolean;
  disadvantage?: boolean;
  /** 力竭等级：每级 −2。 */
  exhaustion?: number;
  /** 成功的线：到了就算成功（检定的 DC、攻击的 AC）；不给就不判断成败（对抗检定）。 */
  target?: number;
  /** 没成功时用英雄激励重掷 d20、用诗人激励加骰（主持人说了可以用才用）。 */
  rescue?: { inspiration?: boolean; bardicDie?: number | null };
  /** 掷到几以上算重击（勇士 19）。 */
  critOn?: number;
};

export function d20Test(input: D20Input, rng: Rng): D20Result & { inspirationUsed: boolean; bardicUsed: boolean } {
  const mode = combineMode(!!input.advantage, !!input.disadvantage);
  const roll = (d20: D20Roll) => {
    const parts: { label: string; value: number }[] = [{ label: `d20${mode !== 'normal' ? `（${MODE_LABEL[mode]}：${d20.rolls.join('、')}）` : ''}`, value: d20.kept }];
    if (input.bonus) parts.push({ label: input.label, value: input.bonus });
    for (const x of input.extras ?? []) {
      if (x.dice) {
        const d = parseDice(x.dice);
        if (d) parts.push({ label: `${x.label}（${x.dice}）`, value: rollDice(d, rng).total });
      } else if (x.value) parts.push({ label: x.label, value: x.value });
    }
    if (input.exhaustion) parts.push({ label: `力竭 ${input.exhaustion} 级`, value: -2 * input.exhaustion });
    const total = parts.reduce((s, p) => s + p.value, 0);
    return { d20, parts, total };
  };
  let r = roll(rollD20(rng, mode));
  let rescued: string | null = null;
  let inspirationUsed = false;
  let bardicUsed = false;
  const failed = (x: { d20: D20Roll; total: number }) => input.target !== undefined && (x.d20.kept === 1 || (x.total < input.target && !(input.critOn && x.d20.kept >= input.critOn)));
  if (failed(r) && input.rescue?.bardicDie) {
    const extra = rng(input.rescue.bardicDie);
    r = { ...r, parts: [...r.parts, { label: `诗人激励（d${input.rescue.bardicDie}）`, value: extra }], total: r.total + extra };
    rescued = `诗人激励 +${extra}`;
    bardicUsed = true;
  }
  if (failed(r) && input.rescue?.inspiration) {
    const again = roll(rollD20(rng, mode));
    rescued = `${rescued ? `${rescued}，仍然不够，` : ''}英雄激励重掷：${r.total} → ${again.total}`;
    r = again;
    inspirationUsed = true;
  }
  return {
    ...r,
    natural20: r.d20.kept >= (input.critOn ?? 20),
    natural1: r.d20.kept === 1,
    mode,
    rescued,
    inspirationUsed,
    bardicUsed,
  };
}

export function describeD20(r: D20Result): string {
  return `${r.parts.map((p, i) => (i === 0 ? `${p.label} ${p.value}` : `${p.label} ${p.value >= 0 ? '+' : ''}${p.value}`)).join(' ')} = ${r.total}`;
}

// ==================== 伤害、治疗 ====================

export type DamagePart = { dice: string; type: DamageType; label?: string };
export type RolledDamage = { parts: { label: string; type: DamageType; rolls: number[]; total: number }[]; total: number };

/** 掷伤害：每段单独掷，重击时骰子翻倍；minEach 是巨武器战斗（1、2 当 3）。 */
export function rollDamage(parts: DamagePart[], rng: Rng, opts: { crit?: boolean; minEach?: number; bonus?: number; bonusLabel?: string } = {}): RolledDamage {
  const out: RolledDamage['parts'] = [];
  for (const p of parts) {
    const d = parseDice(p.dice);
    if (!d) continue;
    const r = rollDice(d, rng, { crit: opts.crit, minEach: opts.minEach });
    out.push({ label: p.label ?? p.dice, type: p.type, rolls: r.rolls, total: Math.max(0, r.total) });
  }
  if (opts.bonus && out.length) {
    out[0].total += opts.bonus;
    out[0].label += opts.bonusLabel ? `+${opts.bonusLabel}` : '';
  }
  return { parts: out, total: out.reduce((s, p) => s + p.total, 0) };
}

/** 按抗性、免疫、易伤调整一段伤害。 */
export function adjustForType(amount: number, type: DamageType, resist: Set<string>, immune: Set<string>, vulnerable: Set<string>): { amount: number; note: string | null } {
  if (immune.has(type)) return { amount: 0, note: `免疫${DAMAGE_NAME[type]}` };
  let a = amount;
  let note: string | null = null;
  if (resist.has(type)) {
    a = Math.floor(a / 2);
    note = `抗性：${DAMAGE_NAME[type]}减半`;
  }
  if (vulnerable.has(type)) {
    a *= 2;
    note = `易伤：${DAMAGE_NAME[type]}加倍`;
  }
  return { amount: a, note };
}

/** 角色的抗性：卡上的（种族），加上效果（狂暴、防护能量……）。石化时所有伤害都有抗性。 */
export function resistOf(s: State5e, sheet: Sheet5e): Set<string> {
  const out = new Set<string>(sheet.resist);
  for (const e of s.effects) for (const t of e.mods.resist ?? []) out.add(t);
  if (hasCondition(s.conditions, 'petrified')) for (const t of Object.keys(DAMAGE_NAME)) out.add(t);
  return out;
}

export type HarmOutcome = {
  before: number;
  after: number;
  tempBefore: number;
  tempAfter: number;
  /** 这一下扣了多少（抗性、临时生命值算过以后的实际扣血）。 */
  taken: number;
  notes: string[];
  /** 到 0 倒下了、直接死了、已经倒地又挨打（死亡豁免失败几次）。 */
  downed: boolean;
  died: boolean;
  deathFailures: number;
  /** 要不要做专注豁免、DC 多少。 */
  concentrationDc: number | null;
};

/**
 * 角色受伤：先扣临时生命值，再扣生命值。到 0 倒下（昏迷、开始死亡豁免）；剩下的伤害不少于生命值上限就直接死。
 * 已经倒地的再受伤：死亡豁免失败一次（重击两次），三次失败就死。allowDeath 为 false（房主选了不会死）时停在倒地。
 */
export function harmCharacter(s: State5e, sheet: Sheet5e, damage: { amount: number; type: DamageType; crit?: boolean }[], allowDeath: boolean): HarmOutcome {
  const resist = resistOf(s, sheet);
  const notes: string[] = [];
  let total = 0;
  for (const d of damage) {
    const r = adjustForType(d.amount, d.type, resist, new Set(), new Set());
    if (r.note) notes.push(r.note);
    total += r.amount;
  }
  const before = s.hp;
  const tempBefore = s.tempHp;
  let left = total;
  if (s.tempHp > 0 && left > 0) {
    const used = Math.min(s.tempHp, left);
    s.tempHp -= used;
    left -= used;
    notes.push(`临时生命值挡掉 ${used} 点`);
  }
  const out: HarmOutcome = { before, after: s.hp, tempBefore, tempAfter: s.tempHp, taken: total, notes, downed: false, died: false, deathFailures: 0, concentrationDc: null };
  if (left <= 0) return out;
  const max = hpMaxOf(s, sheet);
  if (s.hp === 0) {
    // 已经倒地：每次受伤算一次死亡豁免失败（重击两次）；一下的伤害不少于生命值上限，直接死
    const crit = damage.some((d) => d.crit);
    if (left >= max && allowDeath) {
      out.died = true;
      return out;
    }
    s.stable = false;
    s.death = s.death ?? { success: 0, failure: 0 };
    const add = crit ? 2 : 1;
    s.death.failure = Math.min(3, s.death.failure + add);
    out.deathFailures = add;
    if (s.death.failure >= 3) {
      if (allowDeath) out.died = true;
      else s.death.failure = 2;
    }
    return out;
  }
  const remaining = left - s.hp;
  s.hp = Math.max(0, s.hp - left);
  out.after = s.hp;
  if (s.hp === 0) {
    if (remaining >= max && allowDeath) {
      out.died = true;
      notes.push('伤害太重，当场死亡');
      return out;
    }
    out.downed = true;
    s.death = { success: 0, failure: 0 };
    s.stable = false;
    s.deathRound = null;
    addCondition(s.conditions, { key: 'unconscious', note: '生命值到 0' });
    addCondition(s.conditions, { key: 'prone', note: '倒下了' });
  }
  if (s.concentration && total > 0) out.concentrationDc = Math.min(30, Math.max(10, Math.floor(total / 2)));
  return out;
}

/** 回复生命值：不超过上限；倒地的回到 1 以上就醒过来，死亡豁免清零。 */
export function healCharacter(s: State5e, sheet: Sheet5e, amount: number): { before: number; after: number; revived: boolean } {
  const before = s.hp;
  const max = hpMaxOf(s, sheet);
  s.hp = Math.min(max, s.hp + Math.max(0, amount));
  const revived = before === 0 && s.hp > 0;
  if (revived) {
    s.death = null;
    s.stable = false;
    s.deathRound = null;
    s.conditions = s.conditions.filter((c) => !(c.key === 'unconscious' && c.note === '生命值到 0'));
  }
  return { before, after: s.hp, revived };
}

/** 临时生命值不叠加：取高的。 */
export function grantTempHp(s: { tempHp: number }, amount: number): { before: number; after: number } {
  const before = s.tempHp;
  s.tempHp = Math.max(s.tempHp, Math.max(0, amount));
  return { before, after: s.tempHp };
}

/** 掷一次死亡豁免：10 以上成功，20 回 1 点生命值醒来，1 算两次失败；三次成功稳定，三次失败死亡。 */
export function deathSave(s: State5e, rng: Rng, allowDeath: boolean): { roll: number; result: 'success' | 'failure' | 'revived' | 'stable' | 'dead'; success: number; failure: number } {
  const roll = rng(20);
  s.death = s.death ?? { success: 0, failure: 0 };
  if (roll === 20) {
    s.hp = 1;
    s.death = null;
    s.stable = false;
    s.conditions = s.conditions.filter((c) => !(c.key === 'unconscious' && c.note === '生命值到 0'));
    return { roll, result: 'revived', success: 0, failure: 0 };
  }
  if (roll >= 10) s.death.success += 1;
  else s.death.failure += roll === 1 ? 2 : 1;
  const { success, failure } = s.death;
  if (failure >= 3) {
    if (allowDeath) return { roll, result: 'dead', success, failure: 3 };
    s.death.failure = 2;
    return { roll, result: 'failure', success, failure: 2 };
  }
  if (success >= 3) {
    s.stable = true;
    s.death = null;
    return { roll, result: 'stable', success: 3, failure };
  }
  return { roll, result: roll >= 10 ? 'success' : 'failure', success, failure };
}

/** 倒地、还没稳定（要掷死亡豁免）。 */
export function dying(s: State5e): boolean {
  return s.hp === 0 && !s.stable;
}

// ==================== 状态、效果 ====================

export function addCondition(list: ConditionState[], c: ConditionState) {
  const i = list.findIndex((x) => x.key === c.key);
  if (i >= 0) list[i] = { ...list[i], ...c };
  else list.push(c);
}

export function removeCondition(list: ConditionState[], key: Condition5e): boolean {
  const i = list.findIndex((x) => x.key === key);
  if (i < 0) return false;
  list.splice(i, 1);
  return true;
}

export function conditionNames(list: ConditionState[]): string[] {
  return list.map((c) => CONDITION_NAME[c.key] + (c.note ? `（${c.note}）` : ''));
}

let effectSeq = 0;
export function effectId(): string {
  effectSeq = (effectSeq + 1) % 1_000_000;
  return `e${Date.now().toString(36)}${effectSeq.toString(36)}`;
}

/** 攻击者的优势、劣势（自己身上的状态和效果）。 */
export function attackerMode(conditions: ConditionState[], effects: Effect5e[], exhaustionLevel = 0): { adv: string[]; dis: string[] } {
  const adv: string[] = [];
  const dis: string[] = [];
  for (const c of conditions) {
    if (c.key === 'invisible') adv.push('隐形');
    if (['blinded', 'frightened', 'poisoned', 'prone', 'restrained'].includes(c.key)) dis.push(CONDITION_NAME[c.key]);
  }
  for (const e of effects) {
    if (e.mods.advAttack) adv.push(e.name);
    if (e.mods.disAttack) dis.push(e.name);
  }
  void exhaustionLevel;
  return { adv, dis };
}

/** 被攻击的一方带来的优势、劣势（melee：攻击者在 5 尺内）。 */
export function targetMode(conditions: ConditionState[], effects: Effect5e[], melee: boolean, attackerId: string): { adv: string[]; dis: string[]; autoCrit: boolean } {
  const adv: string[] = [];
  const dis: string[] = [];
  let autoCrit = false;
  for (const c of conditions) {
    if (['blinded', 'paralyzed', 'petrified', 'restrained', 'stunned', 'unconscious'].includes(c.key)) adv.push(`目标${CONDITION_NAME[c.key]}`);
    if (c.key === 'invisible') dis.push('目标隐形');
    if (c.key === 'prone') (melee ? adv : dis).push('目标倒地');
    if ((c.key === 'paralyzed' || c.key === 'unconscious') && melee) autoCrit = true;
  }
  for (const e of effects) {
    if (e.vs && e.vs !== attackerId) continue;
    if (e.mods.advAgainst) adv.push(e.name);
    if (e.mods.disAgainst) dis.push(e.name);
  }
  return { adv, dis, autoCrit };
}

/** 豁免时的自动失败（麻痹、震慑、昏迷、石化时的力量和敏捷豁免）。 */
export function autoFailSave(conditions: ConditionState[], ability: Ability): boolean {
  return (ability === 'str' || ability === 'dex') && conditions.some((c) => ['paralyzed', 'stunned', 'unconscious', 'petrified'].includes(c.key));
}

/** 去掉靠某个角色专注维持的效果和状态（专注断了）：返回去掉了几样。 */
export function dropConcentrationEffects(holderEffects: Effect5e[][], holderConditions: ConditionState[][], casterId: number): number {
  let n = 0;
  for (const list of holderEffects) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].conc === casterId) {
        list.splice(i, 1);
        n++;
      }
    }
  }
  for (const list of holderConditions) {
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].conc === casterId) {
        list.splice(i, 1);
        n++;
      }
    }
  }
  return n;
}

// ==================== 休息 ====================

/**
 * 短休：花生命骰回血（每颗生命骰 + 体质调整值），职业资源照规则恢复（短休全回的、短休回一次的）、契约魔法的法术位回满。
 * dice：花几颗生命骰（不超过剩下的）。返回恢复了什么，给主持人看。
 */
export function shortRest(s: State5e, sheet: Sheet5e, dice: number, rng: Rng): string[] {
  const out: string[] = [];
  const left = sheet.level - s.hitDiceUsed;
  const n = Math.max(0, Math.min(left, Math.floor(dice)));
  if (n > 0 && s.hp > 0) {
    let healed = 0;
    for (let i = 0; i < n; i++) healed += Math.max(1, rng(sheet.hitDie) + sheet.mods.con);
    s.hitDiceUsed += n;
    const r = healCharacter(s, sheet, healed);
    out.push(`花了 ${n} 颗生命骰，生命值 ${r.before} → ${r.after}`);
  }
  for (const res of sheet.resources) {
    const used = s.used[res.key] ?? 0;
    if (!used) continue;
    if (res.recover === 'short') s.used[res.key] = 0;
    else if (res.recover === 'short-one') s.used[res.key] = used - 1;
    else continue;
    out.push(`${res.name}恢复了`);
  }
  if (s.pactUsed) {
    s.pactUsed = 0;
    out.push('契约魔法的法术位回满了');
  }
  s.effects = s.effects.filter((e) => e.until !== 'short' && e.until !== 'combat');
  return out;
}

/** 长休：生命值回满、生命骰全回、法术位和资源回满、力竭减一级、英雄激励（人类）。 */
export function longRest(s: State5e, sheet: Sheet5e): string[] {
  const out: string[] = [];
  if (s.hp > 0 || s.stable) {
    const before = s.hp;
    s.hp = hpMaxOf(s, sheet);
    if (before !== s.hp) out.push(`生命值 ${before} → ${s.hp}`);
    s.death = null;
  }
  s.hitDiceUsed = 0;
  s.slotsUsed = [0, 0, 0];
  s.pactUsed = 0;
  s.used = {};
  s.tempHp = 0;
  s.effects = s.effects.filter((e) => e.until !== 'short' && e.until !== 'long' && e.until !== 'combat');
  if (s.exhaustion > 0) {
    s.exhaustion -= 1;
    out.push(`力竭减到 ${s.exhaustion} 级`);
  }
  if (s.data.species === 'human' && !s.inspiration) {
    s.inspiration = true;
    out.push('得到英雄激励（人类的「足智多谋」）');
  }
  out.push('法术位、职业资源都回满了');
  return out;
}

// ==================== 法术位 ====================

/** 还剩几个某一环的法术位（契约魔法的单独算）。 */
export function slotsLeft(s: State5e, sheet: Sheet5e, level: number): number {
  if (level < 1 || level > 3) return 0;
  return Math.max(0, (sheet.spell?.slots[level - 1] ?? 0) - s.slotsUsed[level - 1]);
}

export function pactLeft(s: State5e, sheet: Sheet5e): number {
  return Math.max(0, (sheet.spell?.pact?.count ?? 0) - s.pactUsed);
}

export function slotSummary(s: State5e, sheet: Sheet5e): string {
  const parts: string[] = [];
  for (let L = 1; L <= 3; L++) {
    const max = sheet.spell?.slots[L - 1] ?? 0;
    if (max) parts.push(`${L} 环 ${slotsLeft(s, sheet, L)}/${max}`);
  }
  const pact = sheet.spell?.pact;
  if (pact) parts.push(`契约魔法 ${pact.level} 环 ${pactLeft(s, sheet)}/${pact.count}`);
  return parts.join('、');
}

export function resourceLeft(s: State5e, sheet: Sheet5e, key: string): number {
  const r = sheet.resources.find((x) => x.key === key);
  return r ? Math.max(0, r.max - (s.used[key] ?? 0)) : 0;
}

export function useResource(s: State5e, sheet: Sheet5e, key: string, n = 1): boolean {
  if (resourceLeft(s, sheet, key) < n) return false;
  s.used[key] = (s.used[key] ?? 0) + n;
  return true;
}

/** 免费施放（猎人印记、至圣斩、血统法术……）还剩几次。 */
export function freeCastsLeft(s: State5e, sheet: Sheet5e, spell: string): number {
  const max = sheet.spell?.free[spell] ?? 0;
  return Math.max(0, max - (s.used[`free:${spell}`] ?? 0));
}

// ==================== 怪物 ====================

export function newMonster(m: MonsterData, id: string, name?: string): Monster5eState {
  return { id, key: m.key, name: name || m.name, hp: m.hp, hpMax: m.hp, tempHp: 0, ac: m.ac, conditions: [], effects: [], defeated: false, spent: [], usedPerDay: {} };
}

export function monsterSaveBonus(m: MonsterData, ability: Ability): number {
  return m.saves[ability] ?? abilityMod(m.abilities[ability]);
}

export function monsterSets(m: MonsterData): { resist: Set<string>; immune: Set<string>; vulnerable: Set<string> } {
  return { resist: new Set(m.resist), immune: new Set(m.immune), vulnerable: new Set(m.vulnerable) };
}

/** 怪物受伤：免疫、抗性、易伤，先扣临时生命值；到 0 倒下。 */
export function harmMonster(mon: Monster5eState, data: MonsterData | null, damage: { amount: number; type: DamageType }[]): { before: number; after: number; taken: number; notes: string[]; defeated: boolean } {
  const sets = data ? monsterSets(data) : { resist: new Set<string>(), immune: new Set<string>(), vulnerable: new Set<string>() };
  for (const e of mon.effects) for (const t of e.mods.resist ?? []) sets.resist.add(t);
  const notes: string[] = [];
  let total = 0;
  for (const d of damage) {
    const r = adjustForType(d.amount, d.type, sets.resist, sets.immune, sets.vulnerable);
    if (r.note) notes.push(r.note);
    total += r.amount;
  }
  const before = mon.hp;
  let left = total;
  if (mon.tempHp > 0) {
    const used = Math.min(mon.tempHp, left);
    mon.tempHp -= used;
    left -= used;
  }
  mon.hp = Math.max(0, mon.hp - left);
  const defeated = mon.hp === 0 && !mon.defeated;
  if (mon.hp === 0) mon.defeated = true;
  return { before, after: mon.hp, taken: total, notes, defeated };
}

/** 怪物的属性调整值（检定、先攻用）。 */
export function monsterMods(m: MonsterData): Abilities {
  return Object.fromEntries(Object.entries(m.abilities).map(([k, v]) => [k, abilityMod(v)])) as Abilities;
}

export const RAGE_BONUS = (level: number) => RAGE_DAMAGE[Math.max(1, Math.min(5, level)) - 1];
export const ABILITY_LABEL = ABILITY_NAME;
export { PHYSICAL, EXHAUSTION_MAX };

/** 短休时自动用的能力（不走 use_feature）：用错了时告诉主持人。 */
export const REST_ONLY: Record<string, string> = {
  'arcane-recovery': '奥术回复在短休（rest）时自动用：有用掉的法术位就恢复（玩家想留着，rest 填 keep_recovery）',
  'sorcerous-restoration': '术法复苏在短休（rest）时自动用：有用掉的术法点就恢复（玩家想留着，rest 填 keep_recovery）',
};
