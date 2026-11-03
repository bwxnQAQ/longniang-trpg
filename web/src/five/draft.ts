// 做 5E 卡时的草稿（V0.9.0）：换了职业、种族、背景以后，跟着它们的选择清掉；起始装备换了就重算物品和钱。
import { ABILITIES, STANDARD_ARRAY, type Abilities, type Skill } from '../../../shared/5e/core';
import { PRIORITY } from '../../../shared/5e/quick';
import { fightingStyleLevel, masteryCount } from '../../../shared/5e/class-rules';
import { autoEquip, classOf, startingInventory } from '../../../shared/5e/sheet';
import type { Card5eData, ClassKey, RulesData } from '../../../shared/5e/types';

/** 种族给的技能、专长（换种族时清掉）。 */
const SPECIES_SKILL_SOURCES = ['keen-senses', 'skillful'];

/** 起始装备：物品和钱照选的那两套算，再自动穿上最好的。 */
export function withStartingGear(card: Card5eData, rules: RulesData): Card5eData {
  const { inventory, money } = startingInventory(card, rules);
  const next = { ...card, inventory, money };
  next.equipped = autoEquip(next, rules);
  return next;
}

/** 一张空白的 1 级卡（还没选职业以外的东西）：照职业的推荐分好属性。 */
export function blankCard(rules: RulesData, cls: ClassKey): Card5eData {
  const bg = rules.backgrounds[0];
  const card: Card5eData = {
    v: 1,
    class: cls,
    subclass: null,
    level: 1,
    earned: 0,
    species: 'human',
    lineage: null,
    size: 'medium',
    lineageAbility: null,
    background: bg.key,
    method: 'array',
    base: arrayFor(cls),
    bgBonus: {},
    asi: [],
    classSkills: [],
    bonusSkills: [],
    expertise: [],
    originFeats: [{ key: bg.feat, source: 'background', ...(bg.featList ? { list: bg.featList } : {}) }],
    fightingStyle: null,
    styleCantrips: [],
    masteries: [],
    order: null,
    cantrips: [],
    prepared: [],
    spellbook: [],
    invocations: [],
    tome: null,
    metamagic: [],
    hunterPrey: null,
    land: null,
    wildShapes: [],
    equipmentChoice: { class: 0, background: 0 },
    inventory: [],
    money: 0,
    equipped: { armor: null, shield: null, main: null, off: null },
  };
  return withStartingGear(card, rules);
}

/** 标准数组按职业的推荐顺序分：主要属性 15，其次 14…… */
export function arrayFor(cls: ClassKey): Abilities {
  const base = {} as Abilities;
  PRIORITY[cls].forEach((a, i) => (base[a] = STANDARD_ARRAY[i]));
  return base;
}

/** 换职业：职业的选择（技能、专精、战斗风格、精通、职责、法术、祈唤、超魔……）清掉，起始装备换成新职业的第一套。 */
export function changeClass(card: Card5eData, cls: ClassKey, rules: RulesData): Card5eData {
  if (card.class === cls) return card;
  // 属性还是照上一个职业推荐分的（没自己动过）：换成新职业推荐的分法
  const untouched = card.method === 'array' && ABILITIES.every((a) => card.base[a] === arrayFor(card.class)[a]);
  const next: Card5eData = {
    ...card,
    class: cls,
    base: untouched ? arrayFor(cls) : card.base,
    subclass: null,
    classSkills: [],
    bonusSkills: card.bonusSkills.filter((b) => SPECIES_SKILL_SOURCES.includes(b.source)),
    expertise: [],
    fightingStyle: null,
    styleCantrips: [],
    masteries: [],
    order: null,
    cantrips: [],
    prepared: [],
    spellbook: [],
    invocations: [],
    tome: null,
    metamagic: [],
    hunterPrey: null,
    land: null,
    wildShapes: [],
    equipmentChoice: { ...card.equipmentChoice, class: 0 },
  };
  return withStartingGear(next, rules);
}

/** 换种族：亚种、体型、血统法术的属性、种族给的技能和专长清掉。 */
export function changeSpecies(card: Card5eData, key: string, rules: RulesData): Card5eData {
  if (card.species === key) return card;
  const sp = rules.species.find((s) => s.key === key);
  return {
    ...card,
    species: key,
    lineage: null,
    size: sp?.size === 'small' ? 'small' : 'medium',
    lineageAbility: null,
    bonusSkills: card.bonusSkills.filter((b) => !SPECIES_SKILL_SOURCES.includes(b.source)),
    originFeats: card.originFeats.filter((f) => f.source !== 'species'),
  };
}

/** 换背景：属性加值、背景的专长换成新背景的；职业技能和新背景重复的去掉；起始装备换成新背景的第一套。 */
export function changeBackground(card: Card5eData, key: string, rules: RulesData): Card5eData {
  if (card.background === key) return card;
  const bg = rules.backgrounds.find((b) => b.key === key);
  if (!bg) return card;
  const taken = new Set<Skill>(bg.skills);
  const next: Card5eData = {
    ...card,
    background: key,
    bgBonus: {},
    classSkills: card.classSkills.filter((s) => !taken.has(s)),
    expertise: [],
    originFeats: [{ key: bg.feat, source: 'background', ...(bg.featList ? { list: bg.featList } : {}) }, ...card.originFeats.filter((f) => f.source !== 'background')],
    equipmentChoice: { ...card.equipmentChoice, background: 0 },
  };
  return withStartingGear(next, rules);
}

/** 升级：等级 +1，挣到的级数 -1；别的照旧（新一级的选择在升级页里做）。 */
export function levelUpDraft(card: Card5eData): Card5eData {
  return { ...structuredClone(card), level: card.level + 1, earned: Math.max(0, card.earned - 1) };
}

/** 这个职业施法吗（法术那一步要不要）。 */
export function castsSpells(card: Card5eData, rules: RulesData): boolean {
  return !!classOf(rules, card.class)?.spellcasting;
}

/** 切换一个多选：在里面就拿掉，不在就加上（满了不加）。 */
export function toggle<T>(list: T[], item: T, max: number): T[] {
  if (list.includes(item)) return list.filter((x) => x !== item);
  if (list.length >= max) return list;
  return [...list, item];
}

/** 这一级在「职业特性」那一步有没有要选的（职责、战斗风格、精通、子职业、超魔、魔能祈唤、野兽形态）。 */
export function hasFeatureChoices(card: Card5eData): boolean {
  const L = card.level;
  const style = fightingStyleLevel(card.class);
  return (
    card.class === 'cleric' ||
    card.class === 'druid' ||
    (style !== null && L >= style) ||
    masteryCount(card.class, L) > 0 ||
    L >= 3 ||
    (card.class === 'sorcerer' && L >= 2) ||
    card.class === 'warlock'
  );
}
