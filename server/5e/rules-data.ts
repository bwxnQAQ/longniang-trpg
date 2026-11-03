// 5E 规则数据（V0.9.0）：把生成的数据文件（server/5e/data/，SRD 5.2.1 + 中文译文）拼成网页和服务器共用的格式。
import type { MonsterData, RulesData, SpellData } from '../../shared/5e/types';
import { CLASSES, FEATURES, INVOCATIONS, METAMAGIC, SUBCLASSES } from './data/classes';
import { ARMOR, GEAR, MAGIC_ITEMS, MASTERIES, PROPERTIES, WEAPONS } from './data/equipment';
import { MONSTERS } from './data/monsters';
import { BACKGROUNDS, CONDITION_TEXT, FEATS, SKILL_TEXT, SPECIES, TRAITS } from './data/origins';
import { SPELLS } from './data/spells';

let cached: RulesData | null = null;

/** 做卡、看角色卡要用的规则数据（不含怪物）。 */
export function rules5e(): RulesData {
  if (cached) return cached;
  cached = {
    classes: CLASSES,
    subclasses: SUBCLASSES,
    features: FEATURES,
    species: SPECIES,
    traits: TRAITS,
    backgrounds: BACKGROUNDS,
    feats: FEATS,
    weapons: WEAPONS,
    armor: ARMOR,
    gear: GEAR,
    magicItems: MAGIC_ITEMS,
    spells: SPELLS,
    invocations: INVOCATIONS,
    metamagic: METAMAGIC,
    masteries: MASTERIES,
    properties: PROPERTIES,
    conditions: CONDITION_TEXT,
    skills: SKILL_TEXT,
    beasts: MONSTERS.filter((m) => m.type === '野兽' && m.cr <= 1).map((m) => ({
      key: m.key,
      name: m.name,
      cr: m.cr,
      fly: m.speed.includes('飞行'),
      swim: m.speed.includes('游泳'),
    })),
  };
  return cached;
}

const monsterMap = new Map(MONSTERS.map((m) => [m.key, m]));
const spellMap = new Map(SPELLS.map((s) => [s.key, s]));

export function monsterData(key: string): MonsterData | null {
  return monsterMap.get(key) ?? null;
}

export function allMonsters(): MonsterData[] {
  return MONSTERS;
}

export function spellData(key: string): SpellData | null {
  return spellMap.get(key) ?? null;
}
