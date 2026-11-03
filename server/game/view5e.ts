// 5E 模组（V0.9.0）在网页上的样子：自己的角色、所在地点正在打的仗、别人的角色的一句话介绍。
import { SKILL_KEYS, CONDITION_NAME } from '../../shared/5e/core';
import { itemName } from '../../shared/5e/sheet';
import type { State5e } from '../../shared/5e/types';
import type { Character5eView, Fight5eView } from '../../shared/game';
import { monsterData, rules5e } from '../5e/rules-data';
import { currentAc, freeCastsLeft, hpMaxOf, pactLeft, resourceLeft, sheetOf, slotsLeft } from './rules5e';
import type { Character, World } from './world';

export function character5eView(s: State5e): Character5eView {
  const rules = rules5e();
  const sheet = sheetOf(s, rules);
  const beast = s.wildShape ? monsterData(s.wildShape) : null;
  const sp = sheet.spell;
  const spellName = (k: string) => rules.spells.find((x) => x.key === k)?.name ?? k;
  const eq = s.data.equipped;
  const worn = new Set([eq.armor, eq.shield, eq.main, eq.off].filter((k): k is string => !!k));
  return {
    cardId: s.cardId,
    level: sheet.level,
    speciesName: sheet.speciesName,
    className: sheet.className,
    subclassName: sheet.subclassName,
    backgroundName: sheet.backgroundName,
    hp: s.hp,
    hpMax: hpMaxOf(s, sheet),
    tempHp: s.tempHp,
    ac: currentAc(s, sheet, rules, beast),
    speed: sheet.speed,
    initiative: sheet.initiative,
    pb: sheet.pb,
    passivePerception: sheet.passivePerception,
    stealthDis: s.wildShape ? null : sheet.stealthDis,
    abilities: sheet.abilities,
    mods: sheet.mods,
    saves: (Object.keys(sheet.saves) as (keyof typeof sheet.saves)[]).filter((a) => sheet.saves[a].prof),
    skills: SKILL_KEYS.map((k) => ({ key: k, mod: sheet.skills[k].mod, prof: sheet.skills[k].prof })),
    hitDice: { left: Math.max(0, sheet.level - s.hitDiceUsed), max: sheet.level, die: sheet.hitDie },
    death: s.hp === 0 && !s.stable ? (s.death ?? { success: 0, failure: 0 }) : null,
    stable: s.hp === 0 && s.stable,
    conditions: s.conditions.map((c) => ({ key: c.key, note: c.note ?? '' })),
    exhaustion: s.exhaustion,
    effects: s.effects.map((e) => ({ name: e.name, note: e.note, conc: e.conc !== undefined })),
    concentration: s.concentration?.name ?? null,
    inspiration: s.inspiration,
    bardicDie: s.bardicDie,
    wildShape: beast?.name ?? null,
    attacks: sheet.attacks,
    spell: sp
      ? {
          dc: sp.dc,
          attack: sp.attack,
          slots: [1, 2, 3].filter((L) => sp.slots[L - 1]).map((L) => ({ level: L, left: slotsLeft(s, sheet, L), max: sp.slots[L - 1] })),
          pact: sp.pact ? { level: sp.pact.level, left: pactLeft(s, sheet), max: sp.pact.count } : null,
          cantrips: sp.cantrips.map((k) => ({ key: k, name: spellName(k) })),
          prepared: sp.prepared.map((k) => ({ key: k, name: spellName(k), level: rules.spells.find((x) => x.key === k)?.level ?? 1 })),
          free: Object.entries(sp.free).map(([k, max]) => ({ key: k, name: spellName(k), left: freeCastsLeft(s, sheet, k), max })),
        }
      : null,
    resources: sheet.resources.map((r) => ({ key: r.key, name: r.name, max: r.max, recover: r.recover, left: resourceLeft(s, sheet, r.key) })),
    features: sheet.features.map((f) => ({ name: f.name, source: f.source })),
    inventory: s.inventory.map((i) => ({ key: i.key, name: itemName(rules, i.key), qty: i.qty, equipped: worn.has(i.key) })),
    money: s.money,
    // 这一局多出来的：现在身上比进来时多的东西和钱（拿到又用掉了的不算；结局时带走的就是这些）
    gained: s.inventory
      .filter((i) => i.qty > (s.data.inventory.find((x) => x.key === i.key)?.qty ?? 0))
      .map((i) => ({ name: itemName(rules, i.key), qty: i.qty - (s.data.inventory.find((x) => x.key === i.key)?.qty ?? 0) })),
    gainedMoney: Math.max(0, Math.round(s.money) - s.data.money),
  };
}

/** 你所在地点正在打的仗。 */
export function fight5eView(world: World, me: Character | null, characters: Character[]): Fight5eView | null {
  const f = me?.location ? world.fights5e?.[me.location] : undefined;
  if (!f) return null;
  return {
    round: f.round,
    order: f.order.map((o) => {
      const c = o.side === 'ally' ? characters.find((x) => `c${x.id}` === o.id) : null;
      const m = o.side === 'enemy' ? f.monsters.find((x) => x.id === o.id) : null;
      return { name: o.name, side: o.side, initiative: o.initiative, acted: f.acted.includes(o.id), down: c ? c.dead || c.v5?.hp === 0 : !!m?.defeated };
    }),
    monsters: f.monsters.map((m) => ({
      id: m.id,
      name: m.name,
      hp: m.hp,
      hpMax: m.hpMax,
      conditions: m.conditions.map((c) => CONDITION_NAME[c.key]),
      defeated: m.defeated,
      ...(m.fled ? { fled: true } : {}),
    })),
  };
}

/** 别人的 5E 角色的一句话：种族、职业、等级。 */
export function class5eLine(c: Character): string | null {
  if (!c.v5) return null;
  const sheet = sheetOf(c.v5, rules5e());
  return `${sheet.speciesName}${sheet.className} ${sheet.level} 级`;
}
