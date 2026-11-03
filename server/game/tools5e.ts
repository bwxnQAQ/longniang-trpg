// 5E 规则（V0.9.0）的一次结算：检定、豁免、攻击、怪物行动、施法、职业能力、伤害治疗、状态、战斗、休息、物品、宝藏。
// 工具定义在 tools5e-defs.ts，计算在 rules5e.ts；和别的规则一样，只改这里的副本，结算成功才写进数据库。
import {
  ABILITIES,
  ABILITY_NAME,
  CONDITION_NAME,
  DAMAGE_NAME,
  EXHAUSTION_MAX,
  SKILL_ABILITY,
  SKILL_NAME,
  abilityMod,
  formatDice,
  formatMoney,
  isAbility,
  isCondition,
  isDamageType,
  isSkill,
  parseDice,
  rollDice,
  signed,
  type Ability,
  type Condition5e,
  type DamageType,
  type Skill,
} from '../../shared/5e/core';
import { bardicDie, martialArtsDie, sneakDice } from '../../shared/5e/class-rules';
import { armorOf, itemName, spellAbility, splitItemKey, weaponOf } from '../../shared/5e/sheet';
import type { AttackOption, ConditionState, Effect5e, Fight5e, MonsterAction, MonsterData, Monster5eState, RulesData, Sheet5e, SpellData, State5e } from '../../shared/5e/types';
import { OUTCOME_LABEL, type AttributeKey, type Outcome } from '../../shared/rules';
import type { RollCard } from '../../shared/game';
import {
  RAGE_BONUS,
  REST_ONLY,
  addCondition,
  attackerMode,
  autoFailSave,
  conditionNames,
  currentAc,
  d20Test,
  deathSave,
  describeD20,
  dropConcentrationEffects,
  dying,
  effectId,
  freeCastsLeft,
  grantTempHp,
  harmCharacter,
  harmMonster,
  hasCondition,
  healCharacter,
  hpMaxOf,
  incapacitated,
  isRaging,
  longRest,
  monsterMods,
  monsterSaveBonus,
  newMonster,
  pactLeft,
  removeCondition,
  resourceLeft,
  rollDamage,
  sheetOf,
  shortRest,
  slotSummary,
  slotsLeft,
  targetMode,
  useResource,
  type D20Input,
  type D20Result,
  type DamagePart,
} from './rules5e';
import { turnLine } from './prompts5e';
import { scenarioMonster5e, type Scenario } from './scenario';
import { SHARED_TOOLS_5E } from './tools5e-defs';
import { ok, ResolutionContext, text, ToolError, type Input, type ResolutionInput, type ToolResult } from './tools';
import type { Character } from './world';

export type Rules5eInput = ResolutionInput & {
  rules: RulesData;
  /** SRD 怪物的数据块。 */
  srd: (key: string) => MonsterData | null;
};

/** 宠物帮忙重掷时，5E 的属性对到宠物的五项属性。 */
const PET_ATTRIBUTE: Record<Ability, AttributeKey> = { str: 'body', con: 'body', dex: 'agility', int: 'intellect', wis: 'perception', cha: 'charm' };

/** 持续一阵、之后的回合再生效的法术：施放时只扣法术位、处理专注，伤害和豁免等到 spell_effect。 */
const DELAYED_SPELLS = new Set(['spike-growth', 'sleet-storm', 'stinking-cloud', 'web', 'spirit-guardians', 'zone-of-truth', 'flaming-sphere', 'dragons-breath', 'conjure-animals', 'moonbeam', 'silence', 'fog-cloud', 'darkness', 'entangle', 'grease', 'hypnotic-pattern', 'plant-growth', 'wind-wall', 'call-lightning']);
/** 施放时生效一次，之后还能用 spell_effect 再生效的（灵体武器、召雷术、灼热金属、月华之光……）。 */
const REPEATABLE_SPELLS = new Set(['spiritual-weapon', 'call-lightning', 'heat-metal', 'moonbeam', 'flaming-sphere', 'spirit-guardians', 'dragons-breath', 'spike-growth', 'sleet-storm', 'stinking-cloud', 'web', 'conjure-animals', 'witch-bolt', 'vampiric-touch', 'searing-smite', 'ensnaring-strike', 'hex', 'hunters-mark']);

type PC = { c: Character; s: State5e; sheet: Sheet5e };
type Targets = { pcs: PC[]; mons: Monster5eState[]; npcs: string[] };

export class Rules5eContext extends ResolutionContext {
  /** 大家都看得到的战况（开打、先攻、倒下、死亡豁免……）。 */
  readonly events: string[] = [];
  /** 这次结算开始时程序先处理的事（到了这一回合结束的效果、死亡豁免）：写进给主持人的状态里。 */
  readonly turnNotes: string[] = [];
  readonly rules: RulesData;
  private readonly srd: (key: string) => MonsterData | null;
  private readonly sheets = new Map<number, Sheet5e>();
  /** 这一回合用过的「每回合一次」：偷袭、凶蛮攻击者、巨像杀手、狂战士的狂乱（角色编号 → 用过的）。 */
  private readonly onceThisTurn = new Map<number, Set<string>>();
  /** 这次结算里已经开始过回合的怪物（「到它下回合开始」的效果只在它这次第一个动作前结束一次）。 */
  private readonly monsterTurns = new Set<string>();

  constructor(input: Rules5eInput) {
    super(input);
    this.rules = input.rules;
    this.srd = input.srd;
    this.beginTurn();
  }

  /**
   * 一次工具调用要么全做完、要么什么都不改：出错时（参数不对、次数不够）把这次调用改过的角色、世界、记录都退回去，
   * 免得扣了法术位却没施成法。
   */
  override execute(name: string, rawInput: unknown): ToolResult {
    const snap = this.snapshot();
    const result = super.execute(name, rawInput);
    if (result.isError) this.restore(snap);
    return result;
  }

  private snapshot() {
    const sets = <K,>(m: Map<K, Set<number | string>>) => new Map([...m].map(([k, v]) => [k, new Set(v)]));
    return {
      characters: structuredClone([...this.characters.entries()]),
      world: structuredClone(this.world),
      lengths: [this.rolls.length, this.cards.length, this.changes.length, this.privateMessages.length, this.events.length, this.turnNotes.length],
      changed: new Set(this.changed),
      clueGrants: sets(this.clueGrants),
      clueHolders: sets(this.clueHolders),
      ending: this.ending,
      worldChanged: this.worldChanged,
      petHelper: this.petHelper,
      once: new Map([...this.onceThisTurn].map(([k, v]) => [k, new Set(v)])),
      monsterTurns: new Set(this.monsterTurns),
    };
  }

  private restore(s: ReturnType<Rules5eContext['snapshot']>) {
    this.characters.clear();
    for (const [id, c] of s.characters) this.characters.set(id, c);
    Object.assign(this.world, s.world);
    const lists = [this.rolls, this.cards, this.changes, this.privateMessages, this.events, this.turnNotes];
    lists.forEach((list, i) => (list.length = s.lengths[i]));
    this.changed.clear();
    for (const id of s.changed) this.changed.add(id);
    this.clueGrants.clear();
    for (const [k, v] of s.clueGrants) this.clueGrants.set(k, v as Set<number>);
    this.clueHolders.clear();
    for (const [k, v] of s.clueHolders) this.clueHolders.set(k, v as Set<number>);
    this.ending = s.ending;
    this.worldChanged = s.worldChanged;
    this.petHelper = s.petHelper;
    this.onceThisTurn.clear();
    for (const [k, v] of s.once) this.onceThisTurn.set(k, v);
    this.monsterTurns.clear();
    for (const id of s.monsterTurns) this.monsterTurns.add(id);
    this.sheets.clear();
  }

  // ==================== 工具分派 ====================

  protected run(name: string, input: Input): ToolResult {
    switch (name) {
      case 'check':
        return this.check(input);
      case 'saving_throw':
        return this.savingThrow(input);
      case 'contest':
        return this.contest(input);
      case 'attack':
        return this.attack(input);
      case 'monster_action':
        return this.monsterAction(input);
      case 'cast_spell':
        return this.castSpell(input);
      case 'spell_effect':
        return this.spellEffect(input);
      case 'use_feature':
        return this.useFeature(input);
      case 'damage':
        return this.damageTool(input);
      case 'heal':
        return this.healTool(input);
      case 'condition':
        return this.conditionTool(input);
      case 'start_combat':
        return this.startCombat(input);
      case 'end_combat':
        return this.endCombat(input);
      case 'update_enemy':
        return this.updateEnemy(input);
      case 'rest':
        return this.rest(input);
      case 'use_item':
        return this.useItem(input);
      case 'give_treasure':
        return this.giveTreasure(input);
      case 'update_character':
        return this.updateCharacter5e(input);
      case 'move_character': {
        const c = this.character(input.character);
        const from = c.location;
        const result = super.run(name, input);
        if (result.isError || c.location === from) return result;
        const notes: string[] = [];
        if (from) notes.push(...this.leaveFight(c, from));
        if (c.location && c.v5 && !c.dead) notes.push(...this.joinFight(c, c.location));
        if (!notes.length) return result;
        return ok({ ...(JSON.parse(result.content) as Record<string, unknown>), combat: notes });
      }
      default:
        if (SHARED_TOOLS_5E.has(name)) return super.run(name, input);
        throw new ToolError(`没有这个工具：${name}`);
    }
  }

  // ==================== 回合开始、结束 ====================

  private get fights(): Record<string, Fight5e> {
    return (this.world.fights5e ??= {});
  }

  /**
   * 结算开始：轮到这个角色，「到他下个回合开始」的效果结束；倒地的角色掷死亡豁免（战斗里一轮一次）。
   * 他这一轮已经行动过了（有人没交行动，这一轮迟迟过不完），他再行动就算进了新的一轮。
   * 战斗外：同一个地方倒地的人，每次结算各掷一次死亡豁免。
   */
  private beginTurn() {
    const actor = this.characters.get(this.actorId);
    if (!actor?.v5 || actor.dead) return;
    const ref = `c${actor.id}`;
    const fight = actor.location ? this.fights[actor.location] : undefined;
    if (fight && fight.order.some((o) => o.id === ref) && fight.acted.includes(ref)) this.nextRound(fight);
    this.expireTurnEffects(ref);
    if (dying(actor.v5) && (!fight || actor.v5.deathRound !== fight.round)) this.rollDeathSave(actor, fight?.round ?? null, '轮到他了');
    if (!fight && actor.location) {
      for (const c of this.characters.values()) {
        if (c.id === actor.id || c.dead || !c.v5 || c.location !== actor.location || !dying(c.v5)) continue;
        this.rollDeathSave(c, null, '时间过去了一会儿');
      }
    }
  }

  /**
   * ref 的回合开始了：去掉「到 ref 的下个回合开始就结束」的效果、状态（所有人身上的）；
   * 「到 ref 的下一个回合结束」的状态标上 ending，这次结算做完时去掉（finish）。
   */
  private expireTurnEffects(ref: string) {
    const until = (list: ConditionState[]) => {
      let marked = false;
      for (const x of list) {
        if (x.turnOf === ref && x.endOfTurn && !x.ending) {
          x.ending = true;
          marked = true;
        }
      }
      return marked;
    };
    for (const c of this.characters.values()) {
      const s = c.v5;
      if (!s) continue;
      const before = s.effects.length + s.conditions.length;
      const ended = s.effects.filter((e) => e.turnOf === ref).map((e) => e.name);
      s.effects = s.effects.filter((e) => e.turnOf !== ref);
      s.conditions = s.conditions.filter((x) => x.turnOf !== ref || x.endOfTurn);
      if (until(s.conditions)) this.changed.add(c.id);
      if (before !== s.effects.length + s.conditions.length) {
        this.changed.add(c.id);
        if (ended.length) this.turnNotes.push(`${c.name}身上的${ended.join('、')}到时间了`);
      }
    }
    for (const f of Object.values(this.fights)) {
      for (const m of f.monsters) {
        const before = m.effects.length + m.conditions.length;
        m.effects = m.effects.filter((e) => e.turnOf !== ref);
        m.conditions = m.conditions.filter((x) => x.turnOf !== ref || x.endOfTurn);
        if (until(m.conditions)) this.worldChanged = true;
        if (before !== m.effects.length + m.conditions.length) this.worldChanged = true;
      }
    }
  }

  /** 「到某人下一个回合结束」的状态：那个回合在这次结算里开始过了，结算做完就去掉。 */
  private endTurnConditions() {
    for (const c of this.characters.values()) {
      const s = c.v5;
      if (!s?.conditions.some((x) => x.ending)) continue;
      const gone = s.conditions.filter((x) => x.ending).map((x) => CONDITION_NAME[x.key]);
      s.conditions = s.conditions.filter((x) => !x.ending);
      this.change(c, `不再${gone.join('、')}（到时间了）`);
    }
    for (const f of Object.values(this.fights)) {
      for (const m of f.monsters) {
        if (!m.conditions.some((x) => x.ending)) continue;
        const gone = m.conditions.filter((x) => x.ending).map((x) => CONDITION_NAME[x.key]);
        m.conditions = m.conditions.filter((x) => !x.ending);
        if (!m.defeated) this.events.push(`${m.name}不再${gone.join('、')}`);
        this.worldChanged = true;
      }
    }
  }

  private rollDeathSave(c: Character, round: number | null, why: string) {
    const s = c.v5!;
    const r = deathSave(s, this.rng, this.allowDeath);
    s.deathRound = round;
    this.changed.add(c.id);
    const tally = `成功 ${r.success}、失败 ${r.failure}`;
    let line: string;
    if (r.result === 'revived') {
      line = `${c.name}掷出 20，挣扎着醒了过来（生命值 1）`;
      this.change(c, '死亡豁免掷出 20，醒了过来（生命值 1）');
    } else if (r.result === 'stable') {
      line = `${c.name}的死亡豁免成功了三次，稳定下来了（还昏迷着）`;
      this.change(c, '稳定下来了（还昏迷着）');
    } else if (r.result === 'dead') {
      this.kill(c);
      line = `${c.name}的死亡豁免失败了三次，死了`;
    } else line = `${c.name}掷死亡豁免：${r.roll}，${r.result === 'success' ? '成功' : r.roll === 1 ? '掷出 1，算两次失败' : '失败'}（${tally}）`;
    this.events.push(line);
    this.turnNotes.push(`${why}，${line}`);
    this.cards.push(this.cardOf(c.name, '死亡豁免', { kind: 'death', rolls: [r.roll], mode: 'normal', target: 10, success: r.roll >= 10, crit: r.roll === 20 }, [{ label: 'd20', value: r.roll }], r.roll, c.id));
  }

  /** 角色死了：记下来，他维持的专注跟着结束。 */
  private kill(c: Character) {
    c.dead = true;
    if (c.v5) {
      c.v5.death = null;
      if (c.v5.concentration) this.endConcentration({ c, s: c.v5, sheet: this.sheetFor(c) }, '死了');
    }
    this.change(c, '死亡');
  }

  /** 结算做完：到这个回合结束的状态去掉；行动的角色这一轮行动过了。 */
  finish() {
    this.endTurnConditions();
    const actor = this.characters.get(this.actorId);
    if (!actor?.location) return;
    const fight = this.fights[actor.location];
    if (fight?.order.some((o) => o.id === `c${actor.id}`)) this.acted(fight, `c${actor.id}`);
  }

  /** id（角色是 c+编号，怪物是它的编号）这一轮行动过了；还在打的都行动过了，就进入下一轮。 */
  private acted(fight: Fight5e, id: string) {
    if (!fight.acted.includes(id)) fight.acted.push(id);
    this.worldChanged = true;
    const active = fight.order.filter((o) =>
      o.side === 'ally' ? !this.characters.get(Number(o.id.slice(1)))?.dead : !fight.monsters.find((m) => m.id === o.id)?.defeated,
    );
    if (active.length && active.every((o) => fight.acted.includes(o.id))) this.nextRound(fight);
  }

  /** 进入新的一轮：倒地、这一轮没轮到自己（没在自己的回合里掷过）的人，补掷一次死亡豁免。 */
  private nextRound(fight: Fight5e) {
    const actedBefore = new Set(fight.acted);
    fight.round += 1;
    fight.acted = [];
    this.worldChanged = true;
    this.events.push(`第 ${fight.round} 轮`);
    for (const c of this.characters.values()) {
      if (c.dead || !c.v5 || c.location !== fight.location || !dying(c.v5)) continue;
      if (actedBefore.has(`c${c.id}`) || (c.v5.deathRound !== null && c.v5.deathRound >= fight.round - 1)) continue;
      this.rollDeathSave(c, fight.round - 1, '这一轮过去了');
    }
  }

  // ==================== 共用的小工具 ====================

  private pc(raw: unknown, opts: { alive?: boolean } = { alive: true }): PC {
    const c = this.character(raw);
    if (!c.v5) throw new ToolError(`${c.name}不是 5E 角色`);
    if (opts.alive !== false && c.dead) throw new ToolError(`${c.name}已经死了`);
    return { c, s: c.v5, sheet: this.sheetFor(c) };
  }

  private sheetFor(c: Character): Sheet5e {
    let sh = this.sheets.get(c.id);
    if (!sh) {
      sh = sheetOf(c.v5!, this.rules);
      this.sheets.set(c.id, sh);
    }
    return sh;
  }

  private invalidate(c: Character) {
    this.sheets.delete(c.id);
  }

  private change(c: Character, line: string) {
    this.changes.push({ characterId: c.id, text: line });
    this.changed.add(c.id);
  }

  private once(c: Character, key: string): boolean {
    const set = this.onceThisTurn.get(c.id) ?? new Set<string>();
    this.onceThisTurn.set(c.id, set);
    if (set.has(key)) return false;
    set.add(key);
    return true;
  }

  private fightAt(location: string | null): Fight5e | null {
    return location ? (this.fights[location] ?? null) : null;
  }

  private monsterIn(fight: Fight5e | null, raw: unknown): Monster5eState {
    if (!fight) {
      const elsewhere = Object.keys(this.fights).map((k) => `${this.placeName(k)}（${k}）`);
      throw new ToolError(`这里没有在打仗：先用 start_combat 开打${elsewhere.length ? `（现在在打仗的地方：${elsewhere.join('、')}；要参加那里的战斗得先走过去）` : ''}`);
    }
    const m = fight.monsters.find((x) => x.id === raw);
    if (!m) throw new ToolError(`这场战斗里没有「${String(raw)}」，现在的敌人：${fight.monsters.map((x) => `${x.id}=${x.name}${x.defeated ? '（倒下了）' : ''}`).join('、')}`);
    return m;
  }

  /** 怪物的数据块（剧本里写的或者 SRD 的）。 */
  private mdata(m: Monster5eState): MonsterData {
    const d = scenarioMonster5e(this.scenario, m.key, this.srd);
    if (!d) throw new ToolError(`剧本里没有怪物「${m.key}」的数据块`);
    return d;
  }

  /** 角色所在地点的战斗里，按编号找一批敌人（没在打仗时报错）。 */
  private enemiesNear(c: Character, ids: unknown): Monster5eState[] {
    const list = Array.isArray(ids) ? ids : [];
    if (!list.length) return [];
    const fight = this.fightAt(c.location);
    return list.map((id) => this.monsterIn(fight, id));
  }

  private targets(actor: Character, input: Input, opts: { allowDead?: boolean } = {}): Targets {
    const pcs = (Array.isArray(input.characters) ? input.characters : []).map((x) => this.pc(x, { alive: !opts.allowDead }));
    const mons = this.enemiesNear(actor, input.enemies);
    const npcs = (Array.isArray(input.npcs) ? input.npcs : []).map((k) => {
      const n = this.scenario.npcs.find((x) => x.key === k);
      if (!n) throw new ToolError(`没有这个 NPC：${String(k)}`);
      return n.key;
    });
    return { pcs, mons, npcs };
  }

  /** 角色身上效果给的骰子（祝福术、灾祸术……）：kind 是 attack、save、check。 */
  private effectDice(s: State5e, kind: 'attackDice' | 'saveDice' | 'checkDice', vs?: string): { label: string; dice: string }[] {
    const out: { label: string; dice: string }[] = [];
    for (const e of s.effects) {
      const d = e.mods[kind];
      if (!d) continue;
      if (e.vs && vs && e.vs !== vs) continue;
      out.push({ label: e.name, dice: d });
    }
    return out;
  }

  /** 用掉「用一次就没了」的效果（神导术、稳定瞄准、侵扰……）。 */
  private consumeOnce(s: State5e, pred: (e: Effect5e) => boolean) {
    s.effects = s.effects.filter((e) => !(e.once && pred(e)));
  }

  /** 角色对敌人掷完一次攻击：用掉他身上「下一次攻击有优势」（稳定瞄准、侵扰、协助）和敌人身上「下一次对它的攻击有优势」（震慑拳）。 */
  private usedAttackBoosts(s: State5e, m: Monster5eState) {
    this.consumeOnce(s, (e) => !!e.mods.advAttack && (!e.vs || e.vs === m.id));
    const before = m.effects.length;
    m.effects = m.effects.filter((e) => !(e.once && e.mods.advAgainst));
    if (m.effects.length !== before) this.worldChanged = true;
  }

  private cardOf(who: string, label: string, d20: NonNullable<RollCard['d20']>, parts: { label: string; value: number }[], total: number, characterId: number | null): RollCard {
    const kept = d20.rolls.length > 1 ? (d20.mode === 'advantage' ? Math.max(...d20.rolls) : Math.min(...d20.rolls)) : d20.rolls[0];
    const outcome: Outcome = d20.crit ? 'critical' : kept === 1 && d20.kind !== 'death' ? 'fumble' : d20.success === false ? 'failure' : 'success';
    return {
      who,
      reason: label,
      attribute: label,
      dice: [kept, 0],
      parts,
      total,
      outcome,
      skin: characterId !== null ? (this.skins.get(characterId) ?? null) : null,
      d20,
    };
  }

  /** 记下一次角色的 d20 检定（数据库的 rolls 表、骰子卡片）。 */
  private record(c: Character, attribute: string, label: string, r: D20Result, kind: NonNullable<RollCard['d20']>['kind'], opts: { target: number | null; success: boolean | null; hidden?: boolean; crit?: boolean; damage?: { total: number; type: string } | null; combat?: RollCard['combat']; note?: string }) {
    const outcome: Outcome = opts.crit || (kind !== 'attack' && r.natural20) ? 'critical' : r.natural1 ? 'fumble' : opts.success === false ? 'failure' : 'success';
    // 优势、劣势时第二颗是没取的那颗
    const dice: [number, number] = [r.d20.kept, r.d20.rolls.length > 1 ? r.d20.rolls[r.d20.rolls.indexOf(r.d20.kept) === 0 ? 1 : 0] : 0];
    this.rolls.push({
      characterId: c.id,
      attribute,
      modifier: r.total - r.d20.kept,
      result: { dice, total: r.total, outcome, parts: r.parts },
      hidden: !!opts.hidden,
      detail: { reason: label, kind, rolls: r.d20.rolls, mode: r.mode, target: opts.target, success: opts.success, ...(r.rescued ? { rescued: r.rescued } : {}) },
    });
    if (opts.hidden) return;
    this.cards.push({
      who: c.name,
      reason: label,
      attribute: label,
      dice,
      parts: r.parts,
      total: r.total,
      outcome,
      skin: this.skins.get(c.id) ?? null,
      ...(opts.combat ? { combat: opts.combat } : {}),
      d20: { kind, rolls: r.d20.rolls, mode: r.mode, target: opts.target, success: opts.success, ...(opts.crit ? { crit: true } : {}), ...(opts.damage ? { damage: opts.damage } : {}), ...(opts.note || r.rescued ? { note: [opts.note, r.rescued].filter(Boolean).join('；') } : {}) },
    });
  }

  /** 宠物帮着重掷（V0.6.0 的宠物出手）：这次结算第一次没成功时用。 */
  private withPetHelp(c: Character, ability: Ability, input: D20Input, first: ReturnType<typeof d20Test>, failed: (r: D20Result) => boolean): { r: ReturnType<typeof d20Test>; pet: string | null } {
    if (!failed(first)) return { r: first, pet: null };
    const help = this.takePetHelp(c.id, PET_ATTRIBUTE[ability]);
    if (!help) return { r: first, pet: null };
    const again = d20Test({ ...input, extras: [...(input.extras ?? []), ...(help.bonus ? [{ label: `${help.pet}帮忙`, value: help.bonus }] : [])] }, this.rng);
    again.rescued = `${help.pet}帮着重掷：${first.total} → ${again.total}${again.rescued ? `；${again.rescued}` : ''}`;
    return { r: again, pet: help.pet };
  }

  /** 角色用诗人激励、英雄激励的准备：rescue 为 true 时交给 d20Test。 */
  private rescueOf(s: State5e, input: Input): D20Input['rescue'] {
    if (input.rescue !== true) return undefined;
    return { inspiration: s.inspiration, bardicDie: s.bardicDie };
  }

  private afterRescue(c: Character, s: State5e, r: { inspirationUsed: boolean; bardicUsed: boolean }) {
    if (r.inspirationUsed) {
      s.inspiration = false;
      this.change(c, '用掉了英雄激励');
    }
    if (r.bardicUsed) {
      s.bardicDie = null;
      this.change(c, '用掉了诗人激励');
    }
  }

  private advFrom(input: Input): { adv: string[]; dis: string[] } {
    return { adv: input.advantage === true ? ['情境'] : [], dis: input.disadvantage === true ? ['情境'] : [] };
  }

  /** 掩护：一半被挡住 AC +2，大半被挡住 +5。 */
  private cover(input: Input): number {
    return input.cover === 'half' ? 2 : input.cover === 'three-quarters' ? 5 : 0;
  }

  /** 这次攻击要掷到的怪物 AC：数据块的，加上它身上的效果和掩护。 */
  private monsterAc(m: Monster5eState, input: Input): number {
    return m.ac + m.effects.reduce((sum, e) => sum + (e.mods.ac ?? 0), 0) + this.cover(input);
  }

  // ==================== 检定 ====================

  private check(input: Input): ToolResult {
    const { c, s, sheet } = this.pc(input.character);
    if (dying(s) || hasCondition(s.conditions, 'unconscious')) throw new ToolError(`${c.name}昏迷着，做不了检定`);
    const sk = isSkill(input.skill) ? (input.skill as Skill) : null;
    const ab: Ability = isAbility(input.ability) ? (input.ability as Ability) : sk ? SKILL_ABILITY[sk] : (() => { throw new ToolError('要写 skill（技能）或 ability（属性）'); })();
    const beast = s.wildShape ? this.srd(s.wildShape) : null;
    // 荒野变形：力量、敏捷、体质用野兽的
    const score = beast && ['str', 'dex', 'con'].includes(ab) ? beast.abilities[ab] : sheet.abilities[ab];
    let bonus = abilityMod(score);
    const labelParts: string[] = [];
    if (sk) {
      const prof = sheet.skills[sk].prof;
      bonus += Math.floor(sheet.pb * prof);
      // 奇术师、秘术师：奥秘、宗教（自然）检定加感知
      bonus += sheet.skills[sk].mod - sheet.mods[SKILL_ABILITY[sk]] - Math.floor(sheet.pb * prof);
      labelParts.push(SKILL_NAME[sk]);
    }
    if (input.tool === true) bonus += sheet.pb;
    const dc = Number.isInteger(input.dc) ? Math.max(5, Math.min(30, input.dc as number)) : undefined;
    const { adv, dis } = this.advFrom(input);
    for (const x of s.conditions) if (x.key === 'frightened' || x.key === 'poisoned') dis.push(CONDITION_NAME[x.key]);
    for (const e of s.effects) if (e.mods.advChecks?.includes(ab)) adv.push(e.name);
    const noisy = sk === 'stealth' ? this.stealthArmor(s) : null;
    if (noisy) dis.push(noisy);
    if (sk === 'athletics' && s.data.subclass === 'champion' && sheet.level >= 3) adv.push('卓越运动');
    const label = `${ABILITY_NAME[ab]}${sk ? `（${SKILL_NAME[sk]}）` : ''}检定`;
    const extras = this.effectDice(s, 'checkDice');
    const d20in: D20Input = { label: sk ? SKILL_NAME[sk] : ABILITY_NAME[ab], bonus, extras, advantage: adv.length > 0, disadvantage: dis.length > 0, exhaustion: s.exhaustion, target: dc, rescue: this.rescueOf(s, input) };
    const hidden = input.hidden === true;
    const first = d20Test(d20in, this.rng);
    const failed = (r: D20Result) => dc !== undefined && r.total < dc;
    const { r, pet } = hidden ? { r: first, pet: null } : this.withPetHelp(c, ab, d20in, first, failed);
    this.afterRescue(c, s, r);
    if (extras.length) this.consumeOnce(s, (e) => !!e.mods.checkDice);
    this.consumeOnce(s, (e) => !!e.mods.advChecks?.includes(ab));
    // 战士的战术思维：检定没成功，花一次回气 +1d10；还是不够就不算用掉
    let tactical: string | null = null;
    if (input.rescue === true && failed(r) && s.data.class === 'fighter' && sheet.level >= 2 && resourceLeft(s, sheet, 'second-wind') > 0) {
      const extra = this.rng(10);
      if (r.total + extra >= dc!) {
        useResource(s, sheet, 'second-wind');
        r.parts.push({ label: '战术思维（1d10）', value: extra });
        r.total += extra;
        tactical = `战术思维 +${extra}，用掉一次回气`;
        this.change(c, '战术思维：用掉一次回气');
      } else tactical = `战术思维掷了 ${extra}，还是不够，回气没用掉`;
    }
    const success = dc === undefined ? null : r.total >= dc;
    const reason = text(input.reason, 60) || label;
    this.record(c, sk ?? ab, reason, r, 'check', { target: dc ?? null, success, hidden, note: [adv.length ? `优势：${adv.join('、')}` : '', dis.length ? `劣势：${dis.join('、')}` : '', tactical ?? ''].filter(Boolean).join('；') });
    this.changed.add(c.id);
    return ok({
      character: c.name,
      check: label,
      total: r.total,
      breakdown: describeD20(r),
      ...(dc !== undefined ? { dc, success } : {}),
      ...(r.natural20 ? { natural_20: true } : {}),
      ...(r.natural1 ? { natural_1: true } : {}),
      ...(adv.length || dis.length ? { mode: r.mode, because: [...adv.map((x) => `优势：${x}`), ...dis.map((x) => `劣势：${x}`)] } : {}),
      ...(r.rescued ? { rescued: r.rescued } : {}),
      ...(tactical ? { tactical_mind: tactical } : {}),
      ...(pet ? { pet_help: `${pet}（这个角色带着的宠物）扑上去帮了一把，重掷了一次；叙述里写上它怎么帮的忙，结果以重掷的为准` } : {}),
      hidden,
    });
  }

  /** 穿着隐匿劣势的护甲（链甲、板甲……）：隐匿检定劣势（荒野变形时不算）。 */
  private stealthArmor(s: State5e): string | null {
    if (s.wildShape) return null;
    const armor = armorOf(this.rules, s.data.equipped?.armor);
    return armor?.stealthDisadvantage ? `穿着${armor.name}` : null;
  }

  /** 角色的豁免：熟练、效果（祝福术……）、优势（狂暴的力量、危险感知的敏捷、侏儒的心智）、自动失败。 */
  private pcSave(p: PC, ability: Ability, dc: number, opts: { adv?: string[]; dis?: string[]; reason: string; rescue?: D20Input['rescue']; hidden?: boolean; concentration?: boolean }): { success: boolean; total: number; detail: string } {
    const { c, s, sheet } = p;
    const reason = opts.reason;
    if (autoFailSave(s.conditions, ability)) {
      this.events.push(`${c.name}的${ABILITY_NAME[ability]}豁免自动失败`);
      return { success: false, total: 0, detail: `${conditionNames(s.conditions).join('、')}：${ABILITY_NAME[ability]}豁免自动失败` };
    }
    const beast = s.wildShape ? this.srd(s.wildShape) : null;
    const score = beast && ['str', 'dex', 'con'].includes(ability) ? beast.abilities[ability] : sheet.abilities[ability];
    const bonus = abilityMod(score) + (sheet.saves[ability].prof ? sheet.pb : 0);
    const adv = [...(opts.adv ?? [])];
    const dis = [...(opts.dis ?? [])];
    if (ability === 'str' && isRaging(s)) adv.push('狂暴');
    if (ability === 'dex' && s.data.class === 'barbarian' && sheet.level >= 2 && !incapacitated(s.conditions)) adv.push('危险感知');
    if (['int', 'wis', 'cha'].includes(ability) && s.data.species === 'gnome') adv.push('侏儒的机敏');
    if (opts.concentration && s.data.invocations?.some((i) => i.key === 'eldritch-mind')) adv.push('魔能心智');
    for (const e of s.effects) if (e.mods.advSaves?.includes(ability)) adv.push(e.name);
    if (ability === 'dex' && hasCondition(s.conditions, 'restrained')) dis.push('束缚');
    const extras = this.effectDice(s, 'saveDice');
    // 防护斗篷、防护戒指：豁免 +1
    for (const it of s.inventory) {
      const mi = this.rules.magicItems.find((m) => m.key === it.key);
      if (mi?.mech?.saves) extras.push({ label: mi.name, dice: String(mi.mech.saves) });
    }
    const input: D20Input = { label: `${ABILITY_NAME[ability]}豁免`, bonus, extras, advantage: adv.length > 0, disadvantage: dis.length > 0, exhaustion: s.exhaustion, target: dc, rescue: opts.rescue };
    const first = d20Test(input, this.rng);
    const { r } = opts.hidden ? { r: first } : this.withPetHelp(c, ability, input, first, (x) => x.total < dc);
    this.afterRescue(c, s, r as ReturnType<typeof d20Test>);
    const success = r.total >= dc;
    this.record(c, `save-${ability}`, reason, r, 'save', { target: dc, success, hidden: opts.hidden, note: [adv.length ? `优势：${adv.join('、')}` : '', dis.length ? `劣势：${dis.join('、')}` : ''].filter(Boolean).join('；') });
    return { success, total: r.total, detail: describeD20(r) };
  }

  /** 怪物的豁免。 */
  private monsterSave(m: Monster5eState, ability: Ability, dc: number, opts: { adv?: boolean; dis?: boolean; reason: string }): { success: boolean; total: number; detail: string } {
    const data = this.mdata(m);
    if (autoFailSave(m.conditions, ability)) return { success: false, total: 0, detail: `${ABILITY_NAME[ability]}豁免自动失败（${conditionNames(m.conditions).join('、')}）` };
    const dis = !!opts.dis || (ability === 'dex' && hasCondition(m.conditions, 'restrained'));
    const extras = m.effects.filter((e) => e.mods.saveDice).map((e) => ({ label: e.name, dice: e.mods.saveDice! }));
    const r = d20Test({ label: `${ABILITY_NAME[ability]}豁免`, bonus: monsterSaveBonus(data, ability), extras, advantage: !!opts.adv, disadvantage: dis, target: dc }, this.rng);
    const success = r.total >= dc;
    this.cards.push(this.cardOf(m.name, opts.reason, { kind: 'save', rolls: r.d20.rolls, mode: r.mode, target: dc, success }, r.parts, r.total, null));
    return { success, total: r.total, detail: describeD20(r) };
  }

  private savingThrow(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const ability = isAbility(input.ability) ? (input.ability as Ability) : null;
    if (!ability) throw new ToolError('ability 要写 str、dex、con、int、wis、cha 之一');
    const dc = Number.isInteger(input.dc) ? Math.max(5, Math.min(30, input.dc as number)) : null;
    if (dc === null) throw new ToolError('要写 dc');
    const reason = text(input.reason, 60) || `${ABILITY_NAME[ability]}豁免`;
    const endCondition = isCondition(input.end_condition) ? (input.end_condition as Condition5e) : null;
    const t = this.targets(actor, input);
    if (!t.pcs.length && !t.mons.length) throw new ToolError('characters 或 enemies 至少写一个');
    const { adv, dis } = this.advFrom(input);
    const results: Record<string, unknown>[] = [];
    for (const p of t.pcs) {
      const r = this.pcSave(p, ability, dc, { adv, dis, reason, rescue: this.rescueOf(p.s, input) });
      if (r.success && endCondition && removeCondition(p.s.conditions, endCondition)) this.change(p.c, `不再${CONDITION_NAME[endCondition]}`);
      this.changed.add(p.c.id);
      results.push({ character: p.c.name, total: r.total, success: r.success, breakdown: r.detail });
    }
    for (const m of t.mons) {
      const r = this.monsterSave(m, ability, dc, { adv: adv.length > 0, dis: dis.length > 0, reason });
      if (r.success && endCondition && removeCondition(m.conditions, endCondition)) this.events.push(`${m.name}不再${CONDITION_NAME[endCondition]}`);
      this.worldChanged = true;
      results.push({ enemy: m.id, name: m.name, total: r.total, success: r.success, breakdown: r.detail });
    }
    return ok({ save: `${ABILITY_NAME[ability]}豁免 DC ${dc}`, results });
  }

  private contest(input: Input): ToolResult {
    const { c, s, sheet } = this.pc(input.character);
    const sk = isSkill(input.skill) ? (input.skill as Skill) : null;
    const ab: Ability = isAbility(input.ability) ? (input.ability as Ability) : sk ? SKILL_ABILITY[sk] : 'str';
    const bonus = sk ? sheet.skills[sk].mod : sheet.mods[ab];
    const { adv, dis } = this.advFrom(input);
    for (const x of s.conditions) if (x.key === 'frightened' || x.key === 'poisoned') dis.push(CONDITION_NAME[x.key]);
    for (const e of s.effects) if (e.mods.advChecks?.includes(ab)) adv.push(e.name);
    const noisy = sk === 'stealth' ? this.stealthArmor(s) : null;
    if (noisy) dis.push(noisy);
    const reason = text(input.reason, 60) || '对抗';
    const mine = d20Test({ label: sk ? SKILL_NAME[sk] : ABILITY_NAME[ab], bonus, advantage: adv.length > 0, disadvantage: dis.length > 0, exhaustion: s.exhaustion }, this.rng);
    this.consumeOnce(s, (e) => !!e.mods.advChecks?.includes(ab));
    let otherName: string;
    let shown: string;
    let other: D20Result;
    if (input.opponent_character !== undefined && input.opponent_character !== null) {
      const o = this.pc(input.opponent_character);
      if (o.c.id === c.id) throw new ToolError('不能和自己对抗');
      const osk = isSkill(input.opponent_skill) ? (input.opponent_skill as Skill) : null;
      const oab: Ability = isAbility(input.opponent_ability) ? (input.opponent_ability as Ability) : osk ? SKILL_ABILITY[osk] : ab;
      other = d20Test({ label: osk ? SKILL_NAME[osk] : ABILITY_NAME[oab], bonus: osk ? o.sheet.skills[osk].mod : o.sheet.mods[oab], exhaustion: o.s.exhaustion }, this.rng);
      otherName = o.c.name;
      shown = o.c.name;
    } else if (typeof input.opponent_enemy === 'string') {
      const m = this.monsterIn(this.fightAt(c.location), input.opponent_enemy);
      const data = this.mdata(m);
      const osk = isSkill(input.opponent_skill) ? (input.opponent_skill as Skill) : null;
      const oab: Ability = isAbility(input.opponent_ability) ? (input.opponent_ability as Ability) : osk ? SKILL_ABILITY[osk] : ab;
      const ob = osk && data.skills[osk] !== undefined ? data.skills[osk]! : monsterMods(data)[oab];
      other = d20Test({ label: osk ? SKILL_NAME[osk] : ABILITY_NAME[oab], bonus: ob }, this.rng);
      otherName = m.name;
      shown = m.name;
    } else {
      const npc = this.scenario.npcs.find((n) => n.key === input.npc);
      if (!npc) throw new ToolError('对手要写 opponent_character、opponent_enemy，或者 npc（NPC 的 key）和 npc_bonus');
      const b = Number.isInteger(input.npc_bonus) ? Math.max(-2, Math.min(10, input.npc_bonus as number)) : 0;
      other = d20Test({ label: '本事', bonus: b }, this.rng);
      otherName = npc.name;
      shown = text(input.npc_label, 12) || '对手';
    }
    const winner = mine.total > other.total ? 'a' : other.total > mine.total ? 'b' : 'tie';
    const card = this.cardOf(c.name, reason, { kind: 'contest', rolls: mine.d20.rolls, mode: mine.mode, target: null, success: winner === 'a' ? true : winner === 'b' ? false : null }, mine.parts, mine.total, c.id);
    card.versus = { who: shown, dice: [other.d20.kept, 0], parts: other.parts, total: other.total, outcome: 'success' as Outcome };
    card.winner = winner;
    this.cards.push(card);
    this.rolls.push({
      characterId: c.id,
      attribute: sk ?? ab,
      modifier: bonus,
      result: { dice: [mine.d20.kept, 0], total: mine.total, outcome: winner === 'a' ? 'success' : 'failure', parts: mine.parts },
      hidden: false,
      detail: { reason, kind: 'contest', opposed: { name: otherName, total: other.total }, winner },
    });
    return ok({
      character: c.name,
      total: mine.total,
      breakdown: describeD20(mine),
      ...(adv.length || dis.length ? { mode: mine.mode, because: [...adv.map((x) => `优势：${x}`), ...dis.map((x) => `劣势：${x}`)] } : {}),
      opponent: otherName,
      opponent_total: other.total,
      opponent_breakdown: describeD20(other),
      winner: winner === 'a' ? c.name : winner === 'b' ? otherName : '平局，维持原状',
    });
  }

  // ==================== 攻击 ====================

  private attackOption(p: PC, key: string): AttackOption & { weapon: ReturnType<typeof weaponOf> } {
    const k = String(key || '').trim();
    if (k === 'unarmed' || k === '徒手打击') {
      const a = p.sheet.attacks.find((x) => x.key === 'unarmed')!;
      return { ...a, weapon: null };
    }
    const a = p.sheet.attacks.find((x) => x.key === k && x.kind === 'weapon');
    if (!a) {
      const list = p.sheet.attacks.filter((x) => x.kind !== 'spell').map((x) => `${x.key}（${x.name}）`).join('、');
      throw new ToolError(`${p.c.name}身上没有「${k}」。能用的攻击：${list}。攻击类戏法用 cast_spell`);
    }
    return { ...a, weapon: weaponOf(this.rules, a.key) };
  }

  private attack(input: Input): ToolResult {
    const p = this.pc(input.character);
    const { c, s, sheet } = p;
    if (dying(s) || incapacitated(s.conditions)) throw new ToolError(`${c.name}现在${dying(s) ? '倒地昏迷' : '失能'}，不能攻击`);
    const fight = this.fightAt(c.location);
    const m = this.monsterIn(fight, input.target);
    if (m.defeated) throw new ToolError(`${m.name}（${m.id}）已经倒下了`);
    this.mdata(m);
    const beast = s.wildShape ? this.srd(s.wildShape) : null;
    if (beast) throw new ToolError(`${c.name}正处于荒野变形（${beast.name}），攻击用野兽的动作：请用 use_feature（feature: wild-shape-attack，option 写野兽的动作名）`);
    const opt = this.attackOption(p, String(input.weapon ?? ''));
    const w = opt.weapon;
    const ref = `c${c.id}`;
    const ac = this.monsterAc(m, input);
    const notes: string[] = [];
    const reason = text(input.reason, 60) || '攻击';
    const melee = !w || !w.ranged;
    const strBased = opt.ability === 'str';
    // 优势、劣势
    const { adv, dis } = this.advFrom(input);
    const am = attackerMode(s.conditions, s.effects.filter((e) => !e.vs || e.vs === m.id), s.exhaustion);
    adv.push(...am.adv);
    dis.push(...am.dis);
    const tm = targetMode(m.conditions, m.effects, melee, ref);
    adv.push(...tm.adv);
    dis.push(...tm.dis);
    if (input.reckless === true) {
      if (s.data.class !== 'barbarian' || sheet.level < 2) notes.push('只有 2 级以上的野蛮人能鲁莽攻击，没有算');
      else if (!strBased) notes.push('鲁莽攻击只对力量攻击有优势');
      else {
        adv.push('鲁莽攻击');
        if (!s.effects.some((e) => e.key === 'reckless')) {
          s.effects.push({ id: effectId(), key: 'reckless', name: '鲁莽攻击', from: c.name, turnOf: ref, mods: { advAgainst: true }, note: '到他下回合开始前，别人攻击他有优势' });
          this.change(c, '鲁莽攻击：到下回合开始前，别人攻击他有优势');
        }
      }
    }
    // 攻击加值
    const extras = this.effectDice(s, 'attackDice', m.id).map((x) => ({ label: x.label, dice: x.dice }));
    const critOn = s.data.subclass === 'champion' && sheet.level >= 3 ? 19 : 20;
    const first = d20Test({ label: opt.name, bonus: opt.toHit, extras, advantage: adv.length > 0, disadvantage: dis.length > 0, exhaustion: s.exhaustion, target: ac, critOn, rescue: this.rescueOf(s, input) }, this.rng);
    const hits = (r: D20Result) => !r.natural1 && (r.natural20 || r.total >= ac);
    const { r, pet } = this.withPetHelp(c, opt.ability, { label: opt.name, bonus: opt.toHit, extras, advantage: adv.length > 0, disadvantage: dis.length > 0, exhaustion: s.exhaustion, target: ac, critOn }, first, (x) => !hits(x));
    this.afterRescue(c, s, r);
    this.usedAttackBoosts(s, m);
    const hit = hits(r);
    const crit = hit && (r.natural20 || tm.autoCrit);
    const mastery = opt.mastery;
    const report: string[] = [];
    let total = 0;
    let damageType: DamageType = opt.damageType;
    if (hit) {
      // 伤害骰：武器（多用武器双手用大的骰子）、武艺骰；加值：属性调整值（副手不加，除非双武器战斗）
      let dice = parseDice(opt.damage) ?? { count: 0, sides: 0, bonus: 1 };
      if (w && input.two_handed === true && w.versatile) dice = { ...(parseDice(w.versatile) ?? dice), bonus: dice.bonus };
      // 副手的附赠攻击：伤害不加（正的）属性调整值，除非有双武器战斗风格
      if (input.offhand === true && s.data.fightingStyle !== 'two-weapon-fighting' && sheet.mods[opt.ability] > 0) {
        dice = { ...dice, bonus: dice.bonus - sheet.mods[opt.ability] };
        notes.push('副手攻击不加属性调整值');
      }
      if (w && hasPactBlade(s) && !w.ranged && input.damage_type && isDamageType(input.damage_type)) damageType = input.damage_type as DamageType;
      const gwf = s.data.fightingStyle === 'great-weapon-fighting' && melee && !!w && (w.properties.includes('two-handed') || (w.properties.includes('versatile') && input.two_handed === true));
      const parts: DamagePart[] = [{ dice: formatDice({ ...dice, bonus: 0 }), type: damageType, label: opt.name }];
      let flat = dice.bonus;
      // 狂暴：力量攻击的伤害加值
      if (isRaging(s) && strBased) {
        flat += RAGE_BONUS(sheet.level);
        notes.push(`狂暴 +${RAGE_BONUS(sheet.level)}`);
      }
      // 效果加的伤害骰（猎人印记、脆弱诅咒、神恩、魔化武器……）
      for (const e of s.effects) {
        if (!e.mods.damageDice) continue;
        if (e.vs && e.vs !== m.id) continue;
        parts.push({ dice: e.mods.damageDice, type: e.mods.damageType ?? damageType, label: e.name });
      }
      // 偷袭
      if (input.sneak_attack === true && s.data.class === 'rogue') {
        const eligible = !!w && (w.ranged || w.properties.includes('finesse'));
        const why = !eligible ? '要用灵巧或远程武器' : r.mode === 'disadvantage' ? '有劣势时不能偷袭' : r.mode !== 'advantage' && input.ally_adjacent !== true ? '要有优势，或者目标 5 尺内有盟友' : null;
        if (why) notes.push(`偷袭没成：${why}`);
        else if (!this.once(c, 'sneak')) notes.push('偷袭每回合只能一次');
        else {
          let n = sneakDice(sheet.level);
          if (input.cunning_strike && sheet.level >= 5) n -= 1;
          parts.push({ dice: `${n}d6`, type: damageType, label: '偷袭' });
        }
      }
      // 狂战士的狂乱：狂暴中鲁莽攻击，这回合第一次力量攻击命中多掷（狂暴伤害）颗 d6
      if (s.data.subclass === 'path-of-the-berserker' && sheet.level >= 3 && isRaging(s) && strBased && s.effects.some((e) => e.key === 'reckless') && this.once(c, 'frenzy')) {
        parts.push({ dice: `${RAGE_BONUS(sheet.level)}d6`, type: damageType, label: '狂乱' });
      }
      // 巨像杀手：目标已经受了伤，每回合一次多 1d8
      if (s.data.hunterPrey === 'colossus-slayer' && sheet.level >= 3 && m.hp < m.hpMax && this.once(c, 'colossus')) parts.push({ dice: '1d8', type: damageType, label: '巨像杀手' });
      const rolled = rollDamage(parts, this.rng, { crit, minEach: gwf ? 3 : undefined, bonus: flat });
      // 凶蛮攻击者：每回合一次，武器伤害骰掷两次取高
      if (w && (s.data.originFeats ?? []).some((f) => f.key === 'savage-attacker') && this.once(c, 'savage')) {
        const again = rollDamage([parts[0]], this.rng, { crit, minEach: gwf ? 3 : undefined });
        const first = rolled.parts[0].total - flat;
        if (again.parts[0] && again.parts[0].total > first) {
          const diff = again.parts[0].total - first;
          rolled.parts[0].total += diff;
          rolled.total += diff;
          notes.push('凶蛮攻击者：武器伤害骰掷了两次，取高的');
        }
      }
      const res = this.hitMonster(m, rolled.parts.map((x) => ({ amount: x.total, type: x.type })), c);
      total = res.taken;
      report.push(`${m.name}受到 ${res.taken} 点伤害（${rolled.parts.map((x) => `${x.label} ${x.total} ${DAMAGE_NAME[x.type]}`).join('、')}${flat ? `，含加值 ${signed(flat)}` : ''}）${res.notes.length ? `，${res.notes.join('、')}` : ''}`);
      // 斩击类法术：命中以后马上施放（武器这一下已经把目标打倒了，就不用了）
      if (typeof input.smite === 'string') {
        if (m.defeated) report.push('目标已经倒下了，没有再用斩击');
        else report.push(...this.smite(p, m, String(input.smite), input.smite_slot, crit));
      }
      // 震慑拳
      if (input.stunning_strike === true) report.push(...this.stunningStrike(p, m));
      if (input.cunning_strike && s.data.class === 'rogue' && sheet.level >= 5) report.push(...this.cunningStrike(p, m, String(input.cunning_strike)));
      if (input.open_hand && s.data.subclass === 'warrior-of-the-open-hand') report.push(...this.openHand(p, m, String(input.open_hand)));
      // 武器精通（命中时）
      if (mastery && !m.defeated) report.push(...this.masteryOnHit(p, m, mastery, opt));
    } else {
      report.push('没打中');
      // 擦伤：没打中也造成属性调整值的伤害
      if (mastery === 'graze') {
        const mod = sheet.mods[opt.ability];
        if (mod > 0) {
          const res = this.hitMonster(m, [{ amount: mod, type: damageType }], c);
          total = res.taken;
          report.push(`擦伤：${m.name}还是受到 ${res.taken} 点伤害`);
        }
      }
    }
    this.record(c, 'attack', reason, r, 'attack', {
      target: ac,
      success: hit,
      crit,
      damage: total ? { total, type: DAMAGE_NAME[damageType] } : null,
      combat: { kind: 'attack', target: m.name, defense: ac, hit, damage: total || null },
      note: [adv.length ? `优势：${adv.join('、')}` : '', dis.length ? `劣势：${dis.join('、')}` : ''].filter(Boolean).join('；'),
    });
    this.changed.add(c.id);
    const left = fight!.monsters.filter((x) => !x.defeated);
    return ok({
      character: c.name,
      weapon: opt.name,
      total: r.total,
      breakdown: describeD20(r),
      ac: ac,
      hit,
      ...(crit ? { critical: true } : {}),
      damage: total,
      result: report,
      enemy: { id: m.id, hp: `${m.hp}/${m.hpMax}`, defeated: m.defeated },
      enemies_left: left.map((x) => `${x.id}=${x.name}（${x.hp}/${x.hpMax}）`),
      ...(left.length === 0 ? { tip: '这场战斗里的敌人都倒下了：附近还有没放出来的敌人、要接着打的，用 start_combat 放出来；不打了就叙述完用 end_combat 结束战斗' } : {}),
      ...(notes.length ? { notes } : {}),
      ...(pet ? { pet_help: `${pet}（这个角色带着的宠物）扑上去帮了一把，重掷了一次；叙述里写上它怎么帮的忙` } : {}),
    });
  }

  /**
   * 怪物受伤（统一走这里）：免疫、抗性、易伤、临时生命值，扣血，倒下。被驱散的不死生物受了伤，驱散就结束
   * （灼烧不死的伤害除外：keepTurned）。
   */
  private hitMonster(m: Monster5eState, damage: { amount: number; type: DamageType }[], by: Character | null, opts: { keepTurned?: boolean } = {}) {
    const res = harmMonster(m, this.mdata(m), damage);
    this.worldChanged = true;
    if (res.taken > 0 && !opts.keepTurned && m.conditions.some((x) => x.note?.startsWith('驱散不死'))) {
      m.conditions = m.conditions.filter((x) => !x.note?.startsWith('驱散不死'));
      if (!res.defeated) this.events.push(`${m.name}受了伤，不再被驱散`);
    }
    if (res.defeated) this.monsterDown(by, m);
    return res;
  }

  /** 怪物倒下：事件、邪魔宗主的黑暗者祝福。 */
  private monsterDown(by: Character | null, m: Monster5eState) {
    this.events.push(`${m.name}倒下了`);
    if (!by?.v5) return;
    const s = by.v5;
    const sheet = this.sheetFor(by);
    if (s.data.subclass === 'fiend-patron' && sheet.level >= 3) {
      const amount = Math.max(1, sheet.mods.cha + sheet.level);
      const g = grantTempHp(s, amount);
      if (g.after !== g.before) this.change(by, `黑暗者祝福：临时生命值 ${g.after}`);
    }
  }

  /** 至圣斩、灼热斩、耀光斩、诱捕打击：命中以后施放。 */
  private smite(p: PC, m: Monster5eState, key: string, rawSlot: unknown, crit: boolean): string[] {
    const spell = this.rules.spells.find((x) => x.key === key);
    if (!spell) return [`没有这个法术：${key}`];
    const known = p.sheet.spell?.prepared.includes(key);
    if (!known) return [`${p.c.name}没有准备${spell.name}`];
    const cost = this.payForSpell(p, spell, Number.isInteger(rawSlot) ? (rawSlot as number) : null, 'auto');
    if (typeof cost === 'string') return [cost];
    const level = cost.level;
    const out = [`${spell.name}（${cost.label}）`];
    if (spell.concentration) this.startConcentration(p, spell, level);
    const mech = spell.mech;
    if (mech?.damage) {
      let dice = mech.damage;
      if (mech.damagePerSlot && level > spell.level) dice = addDice(dice, mech.damagePerSlot, level - spell.level);
      const parts: DamagePart[] = [{ dice, type: mech.damageType ?? 'radiant', label: spell.name }];
      if (key === 'divine-smite' && /undead|fiend|不死|邪魔/i.test(this.mdata(m).type)) parts.push({ dice: '1d8', type: 'radiant', label: '对邪魔、不死生物' });
      const rolled = rollDamage(parts, this.rng, { crit });
      const res = this.hitMonster(m, rolled.parts.map((x) => ({ amount: x.total, type: x.type })), p.c);
      out.push(`${m.name}多受到 ${res.taken} 点${DAMAGE_NAME[parts[0].type]}伤害`);
    }
    if (mech?.effect || mech?.condition) out.push(`${spell.name}的其他效果照法术说明叙述：${spell.text.slice(0, 120)}`);
    return out;
  }

  private stunningStrike(p: PC, m: Monster5eState): string[] {
    const { c, s, sheet } = p;
    if (s.data.class !== 'monk' || sheet.level < 5) return ['震慑拳要 5 级武僧'];
    if (m.defeated) return [];
    if (!this.once(c, 'stunning')) return ['震慑拳每回合一次'];
    if (!useResource(s, sheet, 'focus')) return ['功力点不够，没用成震慑拳'];
    const dc = 8 + sheet.mods.wis + sheet.pb;
    const r = this.monsterSave(m, 'con', dc, { reason: '震慑拳' });
    this.change(c, '震慑拳：花了 1 点功力点');
    if (!r.success) {
      addCondition(m.conditions, { key: 'stunned', note: '震慑拳', from: c.name, turnOf: `c${c.id}` });
      return [`震慑拳：${m.name}体质豁免失败（${r.total} 对 DC ${dc}），震慑到 ${c.name} 下回合开始`];
    }
    m.effects.push({ id: effectId(), key: 'stunning-strike', name: '震慑拳（减速）', from: c.name, turnOf: `c${c.id}`, mods: { advAgainst: true }, once: true, note: '速度减半，下一次对它的攻击有优势' });
    return [`震慑拳：${m.name}体质豁免成功（${r.total} 对 DC ${dc}），速度减半，下一次对它的攻击有优势`];
  }

  private cunningStrike(p: PC, m: Monster5eState, kind: string): string[] {
    const { c, sheet } = p;
    const dc = 8 + sheet.mods.dex + sheet.pb;
    if (m.defeated) return [];
    if (kind === 'poison') {
      const r = this.monsterSave(m, 'con', dc, { reason: '诡诈打击：下毒' });
      if (!r.success) addCondition(m.conditions, { key: 'poisoned', note: '诡诈打击（每回合结束时可以再体质豁免）', from: c.name });
      return [`诡诈打击（下毒）：${m.name}${r.success ? '豁免成功' : '中毒了'}`];
    }
    if (kind === 'trip') {
      const r = this.monsterSave(m, 'dex', dc, { reason: '诡诈打击：绊倒' });
      if (!r.success) addCondition(m.conditions, { key: 'prone', note: '诡诈打击', from: c.name });
      return [`诡诈打击（绊倒）：${m.name}${r.success ? '豁免成功' : '倒地了'}`];
    }
    return [`诡诈打击（撤离）：${c.name}可以移动最多一半速度，不引发借机攻击`];
  }

  private openHand(p: PC, m: Monster5eState, kind: string): string[] {
    const { c, sheet } = p;
    if (m.defeated) return [];
    const dc = 8 + sheet.mods.wis + sheet.pb;
    if (kind === 'addle') return [`散打（扰乱）：${m.name}到它下回合开始前不能借机攻击`];
    if (kind === 'push') {
      const r = this.monsterSave(m, 'str', dc, { reason: '散打：推开' });
      return [`散打（推开）：${m.name}${r.success ? '站稳了' : '被推开最多 15 尺'}`];
    }
    const r = this.monsterSave(m, 'dex', dc, { reason: '散打：击倒' });
    if (!r.success) addCondition(m.conditions, { key: 'prone', note: '散打', from: c.name });
    return [`散打（击倒）：${m.name}${r.success ? '站稳了' : '倒地了'}`];
  }

  /** 武器精通命中时的效果。 */
  private masteryOnHit(p: PC, m: Monster5eState, mastery: string, opt: AttackOption): string[] {
    const { c, sheet } = p;
    const ref = `c${c.id}`;
    switch (mastery) {
      case 'vex':
        p.s.effects.push({ id: effectId(), key: 'vex', name: '侵扰', from: c.name, vs: m.id, until: 'combat', once: true, mods: { advAttack: true }, note: `下一次攻击${m.name}有优势` });
        return [`侵扰：${c.name}下一次攻击${m.name}有优势`];
      case 'sap':
        m.effects.push({ id: effectId(), key: 'sap', name: '削弱', from: c.name, turnOf: ref, once: true, mods: { disAttack: true }, note: '下一次攻击有劣势' });
        return [`削弱：${m.name}下一次攻击有劣势`];
      case 'slow':
        return [`迟缓：${m.name}的速度减 10 尺，到${c.name}下回合开始`];
      case 'push':
        return [`推离：可以把${m.name}推开最多 10 尺（大型或更小）`];
      case 'topple': {
        const dc = 8 + sheet.mods[opt.ability] + sheet.pb;
        const r = this.monsterSave(m, 'con', dc, { reason: '击倒' });
        if (!r.success) addCondition(m.conditions, { key: 'prone', note: '击倒', from: c.name });
        return [`击倒：${m.name}${r.success ? '站稳了' : '倒地了'}`];
      }
      case 'cleave':
        return ['顺劈：这回合还能对 5 尺内的另一个敌人再攻击一次（不加属性调整值，每回合一次）'];
      case 'nick':
        return ['迅击：双持的副手攻击算在攻击动作里（不用附赠动作）'];
      default:
        return [];
    }
  }

  // ==================== 怪物行动 ====================

  private findAction(data: MonsterData, raw: unknown): { a: MonsterAction; group: string } {
    const groups: [string, MonsterAction[]][] = [
      ['actions', data.actions],
      ['bonusActions', data.bonusActions],
      ['reactions', data.reactions],
      ['traits', data.traits],
    ];
    const all = groups.flatMap(([g, list]) => list.map((a) => ({ a, group: g })));
    const s = String(raw ?? '').trim();
    if (/^\d+$/.test(s)) {
      const x = data.actions[Number(s) - 1];
      if (x) return { a: x, group: 'actions' };
    }
    const exact = all.find((x) => x.a.name === s || x.a.name.replace(/（.*?）/g, '') === s);
    if (exact) return exact;
    const loose = all.find((x) => x.a.name.includes(s) || (s && s.includes(x.a.name.replace(/（.*?）/g, ''))));
    if (loose) return loose;
    throw new ToolError(`${data.name}没有「${s}」这个动作。它的动作：${all.map((x) => x.a.name).join('、')}`);
  }

  private monsterAction(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const fight = this.fightAt(actor.location);
    const m = this.monsterIn(fight, input.enemy);
    if (m.defeated) throw new ToolError(`${m.name}（${m.id}）已经倒下了`);
    if (incapacitated(m.conditions)) throw new ToolError(`${m.name}现在${conditionNames(m.conditions).join('、')}，不能行动`);
    const data = this.mdata(m);
    const { a, group } = this.findAction(data, input.action);
    const reason = text(input.reason, 60) || a.name;
    if (!this.monsterTurns.has(m.id)) {
      this.monsterTurns.add(m.id);
      this.expireTurnEffects(m.id);
    }
    // 充能：用过的本事每次掷 d6 看回没回来；每日几次的数次数
    if (a.recharge) {
      if (m.spent.includes(a.name)) {
        const d = this.rng(6);
        if (d >= a.recharge) {
          m.spent = m.spent.filter((x) => x !== a.name);
          this.events.push(`${m.name}的${a.name}充能了（d6 = ${d}）`);
        } else throw new ToolError(`${m.name}的「${a.name}」还没充能（掷了 ${d}，要 ${a.recharge} 以上），这回合用别的动作`);
      }
    }
    if (a.perDay) {
      const used = m.usedPerDay[a.name] ?? 0;
      if (used >= a.perDay) throw new ToolError(`${m.name}的「${a.name}」今天已经用了 ${used} 次`);
    }
    if (a.multiattack) {
      this.acted(fight!, m.id);
      return ok({ enemy: m.name, action: a.name, desc: a.desc, note: '多重攻击：把里面写的攻击各调用一次 monster_action' });
    }
    const targetIds = Array.isArray(input.targets) ? input.targets : [];
    const targets = targetIds.map((id) => this.pc(id));
    const reactions = new Map<number, string>();
    for (const raw of Array.isArray(input.reactions) ? input.reactions : []) {
      const o = (raw && typeof raw === 'object' ? raw : {}) as Input;
      const id = Number(o.character);
      if (Number.isInteger(id) && typeof o.reaction === 'string') reactions.set(id, o.reaction);
    }
    const results: Record<string, unknown>[] = [];
    const baseParts = (alternative: boolean, extra: boolean, adv: boolean): DamagePart[] => {
      const out: DamagePart[] = [];
      const alt = a.damage.filter((d) => d.when === 'or');
      if (alternative && alt.length) out.push(...alt.map((d) => ({ dice: d.dice, type: d.type, label: a.name })));
      else if (a.damage[0]) out.push({ dice: a.damage[0].dice, type: a.damage[0].type, label: a.name });
      for (const d of a.damage.slice(1)) {
        if (!d.when || (d.when === 'adv' && adv) || (d.when === 'if' && extra)) out.push({ dice: d.dice, type: d.type, label: a.name });
      }
      return out;
    };
    if (a.attack !== null) {
      if (!targets.length) throw new ToolError('攻击要写 targets（被打的角色编号）');
      for (const t of targets) {
        const ref = `c${t.c.id}`;
        const beast = t.s.wildShape ? this.srd(t.s.wildShape) : null;
        let ac = currentAc(t.s, t.sheet, this.rules, beast) + this.cover(input);
        const { adv, dis } = this.advFrom(input);
        const am = attackerMode(m.conditions, m.effects.filter((e) => !e.vs || e.vs === ref));
        adv.push(...am.adv);
        dis.push(...am.dis);
        const melee = !/远程|射程|Ranged|range/.test(a.desc);
        const tm = targetMode(t.s.conditions, t.s.effects, melee, m.id);
        adv.push(...tm.adv);
        dis.push(...tm.dis);
        const r = d20Test({ label: a.name, bonus: a.attack, advantage: adv.length > 0, disadvantage: dis.length > 0, target: ac }, this.rng);
        m.effects = m.effects.filter((e) => !(e.once && (e.mods.disAttack || e.mods.advAttack)));
        let hit = !r.natural1 && (r.natural20 || r.total >= ac);
        const notes: string[] = [];
        // 护盾术：被打中时施放，AC +5
        if (hit && reactions.get(t.c.id) === 'shield' && !r.natural20) {
          const spell = this.rules.spells.find((x) => x.key === 'shield')!;
          if (!t.sheet.spell?.prepared.includes('shield') && !t.sheet.spell?.cantrips.includes('shield')) notes.push(`${t.c.name}没有准备护盾术`);
          else {
            const cost = this.payForSpell(t, spell, null, 'auto');
            if (typeof cost === 'string') notes.push(cost);
            else {
              t.s.effects.push({ id: effectId(), key: 'shield', name: '护盾术', from: t.c.name, turnOf: ref, mods: { ac: 5 }, note: 'AC +5，到他下回合开始' });
              ac += 5;
              hit = r.total >= ac;
              notes.push(`${t.c.name}施放护盾术（${cost.label}），AC 变成 ${ac}${hit ? '，还是被打中了' : '，挡住了'}`);
              this.change(t.c, `护盾术：AC +5（${cost.label}）`);
            }
          }
        }
        const crit = hit && (r.natural20 || tm.autoCrit);
        let taken = 0;
        let outcome: Record<string, unknown> = {};
        if (hit) {
          const rolled = rollDamage(baseParts(input.alternative === true, input.extra === true, r.mode === 'advantage'), this.rng, { crit });
          let amounts = rolled.parts.map((x) => ({ amount: x.total, type: x.type, crit }));
          const reaction = reactions.get(t.c.id);
          if (reaction === 'uncanny-dodge') {
            if (t.s.data.class === 'rogue' && t.sheet.level >= 5) {
              amounts = amounts.map((x) => ({ ...x, amount: Math.floor(x.amount / 2) }));
              notes.push(`${t.c.name}用直觉闪避，伤害减半`);
            } else notes.push('直觉闪避要 5 级游荡者');
          } else if (reaction === 'deflect-attacks') {
            if (t.s.data.class === 'monk' && t.sheet.level >= 3) {
              const cut = this.rng(10) + t.sheet.mods.dex + t.sheet.level;
              let left = cut;
              amounts = amounts.map((x) => {
                if (!['bludgeoning', 'piercing', 'slashing'].includes(x.type)) return x;
                const use = Math.min(left, x.amount);
                left -= use;
                return { ...x, amount: x.amount - use };
              });
              notes.push(`${t.c.name}用拨挡攻击减了 ${cut - left} 点伤害`);
            } else notes.push('拨挡攻击要 3 级武僧');
          } else if (reaction === 'stones-endurance') {
            if (t.s.data.lineage === 'giant-ancestry-stones-endurance' && useResource(t.s, t.sheet, 'giant-ancestry')) {
              const cut = this.rng(12) + t.sheet.mods.con;
              let left = Math.max(0, cut);
              amounts = amounts.map((x) => {
                const use = Math.min(left, x.amount);
                left -= use;
                return { ...x, amount: x.amount - use };
              });
              notes.push(`${t.c.name}用石之坚忍减了 ${Math.max(0, cut) - left} 点伤害`);
            } else notes.push('石之坚忍用不了（不是石巨人祖先，或者次数用完了）');
          }
          const harm = this.harmPc(t, amounts, a.name);
          taken = harm.taken;
          outcome = harm.result;
          // 命中以后还要豁免的（食尸鬼的爪击……）
          if (a.save && !t.c.dead && t.s.hp > 0) {
            const sv = this.pcSave(t, a.save.ability, a.save.dc, { reason: `${a.name}：${ABILITY_NAME[a.save.ability]}豁免` });
            if (!sv.success && a.saveCondition) {
              addCondition(t.s.conditions, { key: a.saveCondition, note: a.name, from: m.name });
              this.change(t.c, `${CONDITION_NAME[a.saveCondition]}（${m.name}的${a.name}）`);
            }
            outcome = { ...outcome, save: sv.success ? '豁免成功' : `豁免失败${a.saveCondition ? `，${CONDITION_NAME[a.saveCondition]}` : ''}` };
          }
        }
        this.cards.push({
          ...this.cardOf(m.name, `${a.name}→${t.c.name}`, { kind: 'attack', rolls: r.d20.rolls, mode: r.mode, target: ac, success: hit, ...(crit ? { crit: true } : {}), damage: taken ? { total: taken, type: DAMAGE_NAME[a.damage[0]?.type ?? 'bludgeoning'] } : null }, r.parts, r.total, null),
          combat: { kind: 'enemy', target: t.c.name, defense: ac, hit, damage: taken || null },
        });
        results.push({ target: t.c.name, total: r.total, breakdown: describeD20(r), ac, hit, ...(crit ? { critical: true } : {}), damage: taken, ...outcome, ...(notes.length ? { notes } : {}) });
      }
    } else if (a.save) {
      if (!targets.length) throw new ToolError('要豁免的本事要写 targets（范围里的角色编号）');
      const sv = a.save;
      const parts = baseParts(input.alternative === true, input.extra === true, false);
      const rolled = parts.length ? rollDamage(parts, this.rng) : null;
      for (const t of targets) {
        const r = this.pcSave(t, sv.ability, sv.dc, { reason: `${a.name}：${ABILITY_NAME[sv.ability]}豁免` });
        let outcome: Record<string, unknown> = { save: r.success ? '成功' : '失败', breakdown: r.detail };
        if (rolled) {
          const factor = r.success ? (sv.onSuccess === 'half' ? 0.5 : 0) : 1;
          const amounts = rolled.parts.map((x) => ({ amount: Math.floor(x.total * factor), type: x.type }));
          if (factor > 0) {
            const harm = this.harmPc(t, amounts, a.name);
            outcome = { ...outcome, damage: harm.taken, ...harm.result };
          } else outcome = { ...outcome, damage: 0 };
        }
        if (!r.success && a.saveCondition && !t.c.dead) {
          addCondition(t.s.conditions, { key: a.saveCondition, note: a.name, from: m.name });
          this.change(t.c, `${CONDITION_NAME[a.saveCondition]}（${m.name}的${a.name}）`);
          outcome = { ...outcome, condition: CONDITION_NAME[a.saveCondition] };
        }
        results.push({ target: t.c.name, ...outcome });
      }
    } else {
      results.push({ note: '这个动作不用掷骰，照描述叙述；要伤害、状态的话用 damage、condition' });
    }
    if (a.recharge) m.spent = [...new Set([...m.spent, a.name])];
    if (a.perDay) m.usedPerDay[a.name] = (m.usedPerDay[a.name] ?? 0) + 1;
    if (fight && group !== 'reactions') this.acted(fight, m.id);
    this.worldChanged = true;
    return ok({ enemy: m.name, action: a.name, desc: a.desc, results, reason });
  }

  /** 角色受伤（统一走这里）：抗性、临时生命值、倒地、死亡、专注豁免、兽人的坚韧不屈、荒野变形。 */
  private harmPc(p: PC, damage: { amount: number; type: DamageType; crit?: boolean }[], why: string): { taken: number; result: Record<string, unknown> } {
    const { c, s, sheet } = p;
    const out = harmCharacter(s, sheet, damage, this.allowDeath);
    // 兽人：坚韧不屈（生命值到 0 但没直接死，改成 1；长休一次）
    if (out.downed && s.data.species === 'orc' && useResource(s, sheet, 'relentless-endurance')) {
      s.hp = 1;
      s.death = null;
      s.conditions = s.conditions.filter((x) => !(x.note === '生命值到 0' || x.note === '倒下了'));
      out.downed = false;
      out.after = 1;
      out.notes.push('坚韧不屈：没有倒下，生命值留在 1');
    }
    this.changed.add(c.id);
    if (out.died) {
      this.kill(c);
      this.events.push(`${c.name}倒下了，再也没有起来`);
      return { taken: out.taken, result: { result: `${c.name}死了`, notes: out.notes } };
    }
    if (out.taken > 0) this.change(c, `生命值 ${out.before} → ${out.after}${out.tempBefore !== out.tempAfter ? `（临时生命值 ${out.tempBefore} → ${out.tempAfter}）` : ''}（${why}）`);
    if (out.downed) {
      // 倒下昏迷（失能）：狂暴结束、专注断了、荒野变形变回来
      this.events.push(`${c.name}倒下了，昏迷不醒`);
      s.effects = s.effects.filter((e) => e.key !== 'rage');
      if (s.wildShape) s.wildShape = null;
      this.endConcentration(p, '倒下了');
    }
    if (out.deathFailures) this.events.push(`${c.name}倒地时又受了伤，死亡豁免失败 ${out.deathFailures} 次（共 ${s.death?.failure ?? 3} 次）`);
    // 专注：受伤要做体质豁免
    let concentration: string | null = null;
    if (out.concentrationDc !== null && s.concentration && !c.dead) {
      const r = this.pcSave(p, 'con', out.concentrationDc, { reason: `维持专注（${s.concentration.name}）`, concentration: true });
      if (!r.success) {
        concentration = `专注豁免失败（DC ${out.concentrationDc}），${s.concentration.name}结束了`;
        this.endConcentration(p, '专注被打断');
      } else concentration = `专注豁免成功（DC ${out.concentrationDc}），${s.concentration.name}还在`;
    }
    return {
      taken: out.taken,
      result: {
        hp: `${s.hp}/${hpMaxOf(s, sheet)}${s.tempHp ? `（临时 ${s.tempHp}）` : ''}`,
        ...(out.downed ? { downed: '生命值到 0，倒下昏迷，开始掷死亡豁免' } : {}),
        ...(out.notes.length ? { notes: out.notes } : {}),
        ...(concentration ? { concentration } : {}),
      },
    };
  }

  // ==================== 施法 ====================

  /**
   * 付施法的代价：戏法不用；免费次数；仪式；契约魔法；法术位（slot 不填用法术本身的环级，没有就往上找）。
   * mode：auto 先用免费次数、再用法术位（斩击、护盾术用）。返回实际环级和说明，付不起返回原因。
   */
  private payForSpell(p: PC, spell: SpellData, slot: number | null, mode: 'slot' | 'free' | 'ritual' | 'auto'): { level: number; label: string } | string {
    const { c, s, sheet } = p;
    if (spell.level === 0) return { level: 0, label: '戏法' };
    if (mode === 'ritual') {
      if (!spell.ritual) return `${spell.name}不能仪式施放`;
      return { level: spell.level, label: '仪式施法，多花 10 分钟' };
    }
    if (mode === 'free' || (mode === 'auto' && freeCastsLeft(s, sheet, spell.key) > 0)) {
      if (freeCastsLeft(s, sheet, spell.key) <= 0) return `${c.name}的${spell.name}没有免费次数了（要用法术位）`;
      if ((sheet.spell?.free[spell.key] ?? 0) < 99) s.used[`free:${spell.key}`] = (s.used[`free:${spell.key}`] ?? 0) + 1;
      this.changed.add(c.id);
      return { level: spell.level, label: '免费施放' };
    }
    const pact = sheet.spell?.pact;
    if (pact && (s.data.class === 'warlock')) {
      if (pactLeft(s, sheet) <= 0) return `${c.name}的契约魔法法术位用完了（短休回满）`;
      if (spell.level > pact.level) return `${spell.name}是 ${spell.level} 环，契约魔法的法术位只有 ${pact.level} 环`;
      s.pactUsed += 1;
      this.changed.add(c.id);
      return { level: pact.level, label: `契约魔法 ${pact.level} 环` };
    }
    let level = slot ?? spell.level;
    if (level < spell.level) return `${spell.name}至少要 ${spell.level} 环的法术位`;
    if (level > 3) return '这一版最高 3 环法术位';
    if (slot === null) while (level <= 3 && slotsLeft(s, sheet, level) <= 0) level++;
    if (level > 3 || slotsLeft(s, sheet, level) <= 0) return `${c.name}没有${slot ? ` ${slot} 环` : '可用'}的法术位了（${slotSummary(s, sheet) || '没有法术位'}）`;
    s.slotsUsed[level - 1] += 1;
    this.changed.add(c.id);
    return { level, label: `${level} 环法术位` };
  }

  private startConcentration(p: PC, spell: SpellData, level: number) {
    if (p.s.concentration) this.endConcentration(p, `换成专注${spell.name}`);
    p.s.concentration = { spell: spell.key, name: spell.name, level };
    this.change(p.c, `专注：${spell.name}`);
  }

  private endConcentration(p: PC, why: string) {
    const conc = p.s.concentration;
    if (!conc) return;
    p.s.concentration = null;
    const effects: Effect5e[][] = [];
    const conditions: State5e['conditions'][] = [];
    for (const c of this.characters.values()) {
      if (!c.v5) continue;
      effects.push(c.v5.effects);
      conditions.push(c.v5.conditions);
      this.changed.add(c.id);
    }
    for (const f of Object.values(this.fights)) {
      for (const m of f.monsters) {
        effects.push(m.effects);
        conditions.push(m.conditions);
      }
    }
    dropConcentrationEffects(effects, conditions, p.c.id);
    this.worldChanged = true;
    this.change(p.c, `${conc.name}结束了（${why}）`);
  }

  private castSpell(input: Input): ToolResult {
    const p = this.pc(input.character);
    const { c, s, sheet } = p;
    const key = String(input.spell ?? '').trim();
    const spell = this.rules.spells.find((x) => x.key === key);
    if (!spell) throw new ToolError(`没有这个法术：${key}`);
    if (dying(s) || (incapacitated(s.conditions) && spell.timing !== 'reaction')) throw new ToolError(`${c.name}现在${dying(s) ? '倒地昏迷' : '失能'}，施不了法`);
    if (isRaging(s)) throw new ToolError(`${c.name}正在狂暴，不能施法`);
    if (s.wildShape) throw new ToolError(`${c.name}正处于荒野变形，不能施法`);
    const sp = sheet.spell;
    const knows = !!sp && (sp.cantrips.includes(key) || sp.prepared.includes(key) || (input.use === 'ritual' && !!sp.spellbook?.includes(key)));
    if (!knows) {
      const list = sp ? [...sp.cantrips, ...sp.prepared].map((k) => `${this.rules.spells.find((x) => x.key === k)?.name ?? k}（${k}）`).join('、') : '';
      throw new ToolError(`${c.name}没有准备${spell.name}。${list ? `他能用的法术：${list}` : '他不会施法'}`);
    }
    // 没说用什么：有免费次数（猎人印记、血统法术、魔能祈唤……）、又没指定环级的，先用免费的
    const slot = Number.isInteger(input.slot) ? (input.slot as number) : null;
    const mode =
      input.use === 'free' ? 'free' : input.use === 'ritual' ? 'ritual' : input.use === 'slot' ? 'slot' : slot === null && freeCastsLeft(s, sheet, key) > 0 ? 'free' : 'slot';
    const cost = this.payForSpell(p, spell, slot, mode);
    if (typeof cost === 'string') throw new ToolError(cost);
    // 超魔：扣术法点
    const notes: string[] = [];
    const meta = typeof input.metamagic === 'string' ? input.metamagic : null;
    if (meta) {
      const mm = this.rules.metamagic.find((x) => x.key === meta);
      if (!mm || !s.data.metamagic.includes(meta)) notes.push(`${c.name}不会这个超魔，没有用`);
      else if (!useResource(s, sheet, 'sorcery-points', mm.cost ?? 1)) notes.push(`术法点不够，没用成${mm.name}`);
      else {
        notes.push(`${mm.name}：花了 ${mm.cost ?? 1} 点术法点`);
        this.change(c, `${mm.name}（术法点 −${mm.cost ?? 1}）`);
      }
    }
    const before = spell.concentration ? (s.concentration?.name ?? null) : null;
    if (spell.concentration) this.startConcentration(p, spell, cost.level);
    const reason = text(input.reason, 60) || spell.name;
    const delayed = DELAYED_SPELLS.has(key);
    const effect = delayed ? { results: [] as Record<string, unknown>[], notes: ['这个法术的伤害、豁免要等生物进入范围或者之后的回合才有：到时候用 spell_effect'] } : this.resolveSpell(p, spell, cost.level, input, meta);
    this.events.push(`${c.name}施放${spell.name}${cost.level > spell.level ? `（${cost.level} 环）` : ''}`);
    this.change(c, `施放${spell.name}（${cost.label}）`);
    return ok({
      character: c.name,
      spell: spell.name,
      cast_at: cost.label,
      ...(spell.concentration ? { concentration: `${c.name}现在专注于${spell.name}${before ? `（之前专注的${before}结束了）` : ''}` } : {}),
      results: effect.results,
      ...([...notes, ...effect.notes].length ? { notes: [...notes, ...effect.notes] } : {}),
      spell_text: spell.text.length > 400 ? `${spell.text.slice(0, 400)}……` : spell.text,
      slots_left: slotSummary(s, sheet) || '没有法术位',
      reason,
    });
  }

  /** 照法术的机制结算一次（施放时，或者 spell_effect 再生效时）。 */
  private resolveSpell(p: PC, spell: SpellData, level: number, input: Input, meta: string | null = null): { results: Record<string, unknown>[]; notes: string[] } {
    const { c, s, sheet } = p;
    const mech = spell.mech;
    const results: Record<string, unknown>[] = [];
    const notes: string[] = [];
    if (!mech) {
      notes.push('这个法术没有程序能算的数字：照法术说明叙述效果，需要检定、豁免、状态时用别的工具');
      return { results, notes };
    }
    const t = this.targets(c, input, { allowDead: !!mech.heal });
    const ab = spellAbility(sheet, spell.key);
    const innate = s.effects.some((e) => e.key === 'innate-sorcery') && s.data.class === 'sorcerer';
    const dc = 8 + sheet.pb + sheet.mods[ab] + (innate ? 1 : 0);
    const attackBonus = sheet.pb + sheet.mods[ab];
    const up = Math.max(0, level - spell.level);
    // 伤害骰：戏法 5 级、升环
    let damage = mech.damage ?? null;
    if (damage && spell.level === 0 && sheet.level >= 5 && mech.cantripDice) damage = mech.cantripDice;
    if (damage && mech.damagePerSlot && up) damage = addDice(damage, mech.damagePerSlot, up);
    const agonizing = spell.level === 0 && s.data.invocations?.some((i) => i.key === 'agonizing-blast' && i.cantrip === spell.key);
    const flat = (mech.addMod ? sheet.mods[ab] : 0) + (agonizing ? sheet.mods.cha : 0);
    const dtype: DamageType = isDamageType(input.damage_type) && (mech.damageChoices?.includes(input.damage_type as DamageType) || meta === 'transmuted-spell') ? (input.damage_type as DamageType) : (mech.damageType ?? 'force');
    let count = mech.count ?? 1;
    if (spell.level === 0 && sheet.level >= 5 && mech.countAtLevel5) count = mech.countAtLevel5;
    if (mech.countPerSlot && up) count += mech.countPerSlot * up;
    const potent = s.data.subclass === 'evoker' && sheet.level >= 3 && spell.level === 0;
    const careful = meta === 'careful-spell';
    const heightened = meta === 'heightened-spell';

    // 范围法术的伤害只掷一次，所有目标用同一个数（豁免成功的减半）
    let shared: number | null = null;
    const amountOf = () => (shared ??= rollDamage([{ dice: damage!, type: dtype, label: spell.name }], this.rng, { bonus: flat }).total);
    const applyMonster = (m: Monster5eState, factor: number, why: string, own = false) => {
      if (!damage) return null;
      const total = own ? rollDamage([{ dice: damage, type: dtype, label: spell.name }], this.rng, { bonus: flat }).total : amountOf();
      const res = this.hitMonster(m, [{ amount: Math.floor(total * factor), type: dtype }], c);
      return `${m.name}受到 ${res.taken} 点${DAMAGE_NAME[dtype]}伤害${res.notes.length ? `（${res.notes.join('、')}）` : ''}${why}${res.defeated ? '，倒下了' : `（${res.after}/${m.hpMax}）`}`;
    };
    const applyPc = (target: PC, factor: number, why: string, own = false) => {
      if (!damage) return null;
      const total = own ? rollDamage([{ dice: damage, type: dtype, label: spell.name }], this.rng, { bonus: flat }).total : amountOf();
      const harm = this.harmPc(target, [{ amount: Math.floor(total * factor), type: dtype }], spell.name);
      return `${target.c.name}受到 ${harm.taken} 点${DAMAGE_NAME[dtype]}伤害${why}（${JSON.stringify(harm.result)}）`;
    };
    // 法术带来的状态：专注的跟着专注走；不专注的到施法者下个回合开始（之后要接着算的，你用 condition 再加）
    const condition = (who: { conditions: State5e['conditions'] }, name: string) => {
      if (!mech.condition) return null;
      addCondition(who.conditions, { key: mech.condition, note: spell.name, from: c.name, ...(spell.concentration ? { conc: c.id } : { turnOf: `c${c.id}` }) });
      return `${name}${CONDITION_NAME[mech.condition]}`;
    };

    // ----- 攻击类 -----
    if (mech.attack) {
      const list = t.mons;
      if (!list.length) {
        throw new ToolError(
          `${spell.name}要掷法术攻击，只能打战斗里的敌人：enemies 写打谁（几道就写几次）。` +
            (t.npcs.length || t.pcs.length ? '对 NPC、角色出手：剧本 monsters 里有他的就用 start_combat 让他参战；没有的照情况用 check、contest 裁定' : ''),
        );
      }
      for (let i = 0; i < Math.max(1, count); i++) {
        const m = list[i % list.length];
        if (m.defeated) {
          results.push({ ray: i + 1, target: m.name, note: '已经倒下了' });
          continue;
        }
        const { adv, dis } = this.advFrom(input);
        const am = attackerMode(s.conditions, s.effects.filter((e) => !e.vs || e.vs === m.id));
        adv.push(...am.adv);
        dis.push(...am.dis);
        if (innate) adv.push('先天术法');
        const tm = targetMode(m.conditions, m.effects, mech.attack === 'melee', `c${c.id}`);
        adv.push(...tm.adv);
        dis.push(...tm.dis);
        const ac = this.monsterAc(m, input);
        const r = d20Test({ label: '法术攻击', bonus: attackBonus, extras: this.effectDice(s, 'attackDice', m.id), advantage: adv.length > 0, disadvantage: dis.length > 0, exhaustion: s.exhaustion, target: ac }, this.rng);
        this.usedAttackBoosts(s, m);
        const hit = !r.natural1 && (r.natural20 || r.total >= ac);
        const crit = hit && (r.natural20 || tm.autoCrit);
        let line: string | null = null;
        if (hit && damage) {
          const rolled = rollDamage([{ dice: damage, type: dtype, label: spell.name }], this.rng, { crit, bonus: flat });
          const res = this.hitMonster(m, [{ amount: rolled.total, type: dtype }], c);
          line = `命中，${m.name}受到 ${res.taken} 点${DAMAGE_NAME[dtype]}伤害${res.defeated ? '，倒下了' : `（${res.after}/${m.hpMax}）`}`;
          if (mech.condition && !m.defeated) line += `，${condition(m, m.name)}`;
        } else if (hit) line = mech.condition ? `命中，${condition(m, m.name)}` : '命中';
        else if (potent && damage) line = `没命中，强力戏法：${applyMonster(m, 0.5, '（一半）', true)}`;
        else line = '没命中';
        this.record(c, 'spell-attack', `${spell.name}→${m.name}`, r, 'attack', { target: ac, success: hit, crit, combat: { kind: 'attack', target: m.name, defense: ac, hit, damage: null } });
        results.push({ ray: i + 1, target: m.name, total: r.total, ac: ac, hit, ...(crit ? { critical: true } : {}), result: line });
      }
      if (spell.key === 'spiritual-weapon' || spell.key === 'flame-blade') notes.push('之后的回合再攻击用 spell_effect');
      return { results, notes };
    }

    // ----- 自动命中（魔法飞弹） -----
    if (mech.auto && damage && !mech.save) {
      const all = [...t.mons.map((m) => ({ m })), ...t.pcs.map((x) => ({ x }))];
      if (!all.length) throw new ToolError(`${spell.name}要写目标（enemies，几道就写几次）`);
      for (let i = 0; i < Math.max(1, count); i++) {
        const tg = all[i % all.length];
        results.push({ dart: i + 1, result: 'm' in tg ? applyMonster(tg.m!, 1, '', true) : applyPc(tg.x!, 1, '', true) });
      }
      return { results, notes };
    }

    // ----- 豁免类 -----
    if (mech.save) {
      if (!t.mons.length && !t.pcs.length && !t.npcs.length) throw new ToolError(`${spell.name}要目标做豁免：写 enemies、characters 或 npcs`);
      for (const m of t.mons) {
        if (m.defeated) continue;
        const r = this.monsterSave(m, mech.save, dc, { reason: `${spell.name}：${ABILITY_NAME[mech.save]}豁免`, dis: heightened });
        const factor = r.success ? (mech.onSave === 'half' || potent ? 0.5 : 0) : 1;
        const line = damage && factor > 0 ? applyMonster(m, factor, r.success ? '（豁免成功，减半）' : '') : null;
        const cond = !r.success && !m.defeated ? condition(m, m.name) : null;
        this.worldChanged = true;
        results.push({ target: m.name, save: `${r.total} 对 DC ${dc}，${r.success ? '成功' : '失败'}`, ...(line ? { damage: line } : {}), ...(cond ? { condition: cond } : {}) });
      }
      for (const x of t.pcs) {
        if (careful) {
          results.push({ target: x.c.name, save: '谨慎法术：自动成功', ...(mech.onSave === 'half' ? { damage: '没有伤害' } : {}) });
          continue;
        }
        const r = this.pcSave(x, mech.save, dc, { reason: `${spell.name}：${ABILITY_NAME[mech.save]}豁免` });
        const factor = r.success ? (mech.onSave === 'half' ? 0.5 : 0) : 1;
        const line = damage && factor > 0 ? applyPc(x, factor, r.success ? '（豁免成功，减半）' : '') : null;
        const cond = !r.success && !x.c.dead ? condition(x.s, x.c.name) : null;
        if (cond) this.change(x.c, `${CONDITION_NAME[mech.condition!]}（${spell.name}）`);
        results.push({ target: x.c.name, save: `${r.total} 对 DC ${dc}，${r.success ? '成功' : '失败'}`, ...(line ? { damage: line } : {}), ...(cond ? { condition: cond } : {}) });
      }
      const npcBonus = Number.isInteger(input.npc_save_bonus) ? Math.max(-1, Math.min(6, input.npc_save_bonus as number)) : 0;
      for (const key of t.npcs) {
        const npc = this.scenario.npcs.find((n) => n.key === key)!;
        const r = d20Test({ label: `${ABILITY_NAME[mech.save]}豁免`, bonus: npcBonus, target: dc }, this.rng);
        const success = r.total >= dc;
        this.cards.push(this.cardOf('对方', `${spell.name}：${ABILITY_NAME[mech.save]}豁免`, { kind: 'save', rolls: r.d20.rolls, mode: r.mode, target: dc, success }, r.parts, r.total, null));
        results.push({ npc: npc.name, save: `${r.total} 对 DC ${dc}，${success ? '成功' : '失败'}`, note: success ? '没有生效（伤害减半的照规则写）' : `生效了${mech.condition ? `：${CONDITION_NAME[mech.condition]}` : ''}；NPC 没有生命值记账，结果照着写，需要的话用 update_npc 记下` });
      }
      if (mech.effect) results.push(...this.applySpellEffect(p, spell, level, t, mech.effect));
      return { results, notes };
    }

    // ----- 自动生效的伤害（至圣斩、灼热金属……）-----
    if (mech.auto && damage) {
      for (const m of t.mons) results.push({ target: m.name, result: applyMonster(m, 1, '') });
      for (const x of t.pcs) results.push({ target: x.c.name, result: applyPc(x, 1, '') });
    }

    // ----- 治疗、临时生命值 -----
    if (mech.heal) {
      const targets = t.pcs.length ? t.pcs : [p];
      let dice = mech.heal;
      if (mech.healPerSlot && up) dice = addDice(dice, mech.healPerSlot, up);
      const life = s.data.subclass === 'life-domain' && sheet.level >= 3 && level >= 1 ? 2 + level : 0;
      for (const x of targets) {
        if (x.c.dead) {
          results.push({ target: x.c.name, result: '已经死了，治疗没用' });
          continue;
        }
        const rolled = rollDice(parseDice(dice) ?? { count: 0, sides: 0, bonus: 1 }, this.rng);
        const amount = Math.max(0, rolled.total + (mech.addMod ? sheet.mods[ab] : 0) + life);
        const r = healCharacter(x.s, x.sheet, amount);
        this.change(x.c, `生命值 ${r.before} → ${r.after}（${spell.name}）`);
        if (r.revived) this.events.push(`${x.c.name}醒了过来`);
        results.push({ target: x.c.name, healed: r.after - r.before, ...(r.after - r.before < amount ? { rolled: amount } : {}), hp: `${r.before} → ${r.after}`, ...(life ? { note: `生命门徒 +${life}` } : {}) });
      }
    }
    if (mech.tempHp) {
      const targets = t.pcs.length ? t.pcs : [p];
      let base = mech.tempHp;
      let flatUp = 0;
      if (mech.tempHpPerSlot && up) {
        if (/^\d+$/.test(mech.tempHpPerSlot)) flatUp = Number(mech.tempHpPerSlot) * up;
        else base = addDice(base, mech.tempHpPerSlot, up);
      }
      // 邪魔活力：虚假生命不用掷，直接取最大
      const maxed = spell.key === 'false-life' && s.data.invocations?.some((i) => i.key === 'fiendish-vigor');
      for (const x of targets) {
        const d = parseDice(base) ?? { count: 0, sides: 0, bonus: 0 };
        const amount = (maxed ? Math.abs(d.count) * d.sides + d.bonus : rollDice(d, this.rng).total) + flatUp;
        const g = grantTempHp(x.s, amount);
        this.change(x.c, `临时生命值 ${g.after}（${spell.name}）`);
        results.push({ target: x.c.name, temp_hp: g.after });
      }
    }
    if (mech.effect) results.push(...this.applySpellEffect(p, spell, level, t, mech.effect));
    if (!results.length) notes.push('照法术说明叙述效果');
    return { results, notes };
  }

  /** 法术的持续效果记在目标（或自己）身上：专注的跟着专注走，别的按持续时间。 */
  private applySpellEffect(p: PC, spell: SpellData, level: number, t: Targets, e: NonNullable<SpellData['mech']>['effect'] & object): Record<string, unknown>[] {
    const { c } = p;
    const out: Record<string, unknown>[] = [];
    const up = Math.max(0, level - spell.level);
    const until: Effect5e['until'] = spell.concentration ? undefined : /小时|直到|8 小时|24 小时/.test(spell.duration) ? 'long' : /1 轮|下个回合/.test(spell.duration) ? undefined : 'combat';
    const turnOf = !spell.concentration && /1 轮|下个回合开始/.test(spell.duration + e.note) ? `c${c.id}` : undefined;
    const vsTarget = e.vsTarget ? (t.mons[0]?.id ?? (t.pcs[0] && t.pcs[0].c.id !== c.id ? `c${t.pcs[0].c.id}` : undefined)) : undefined;
    const mods: Effect5e['mods'] = {
      ...(e.ac ? { ac: e.ac } : {}),
      ...(e.acBase ? { acBase: e.acBase } : {}),
      ...(e.acMin ? { acMin: e.acMin } : {}),
      ...(e.attackDice ? { attackDice: e.attackDice } : {}),
      ...(e.saveDice ? { saveDice: e.saveDice } : {}),
      ...(e.damageDice ? { damageDice: e.damageDice, damageType: e.damageType } : {}),
      ...(e.resist ? { resist: e.resist } : {}),
      ...(e.hpMax ? { hpMax: e.hpMax + (e.hpMaxPerSlot ?? 0) * up } : {}),
    };
    const effect = (): Effect5e => ({
      id: effectId(),
      key: spell.key,
      name: spell.name,
      from: c.name,
      ...(spell.concentration ? { conc: c.id } : {}),
      ...(until ? { until } : {}),
      ...(turnOf ? { turnOf } : {}),
      ...(vsTarget ? { vs: vsTarget } : {}),
      mods,
      note: e.note,
    });
    const onPc = (x: PC) => {
      x.s.effects = x.s.effects.filter((y) => !(y.key === spell.key && y.from === c.name));
      x.s.effects.push(effect());
      if (mods.hpMax) {
        const r = healCharacter(x.s, x.sheet, mods.hpMax);
        this.change(x.c, `${spell.name}：生命值上限 +${mods.hpMax}（${r.before} → ${r.after}）`);
      } else this.change(x.c, `${spell.name}：${e.note}`);
      out.push({ target: x.c.name, effect: e.note });
    };
    if (e.target === 'self' || (!t.pcs.length && !t.mons.length)) onPc(p);
    else {
      for (const x of t.pcs) onPc(x);
      for (const m of t.mons) {
        m.effects = m.effects.filter((y) => !(y.key === spell.key && y.from === c.name));
        m.effects.push(effect());
        this.worldChanged = true;
        out.push({ target: m.name, effect: e.note });
      }
    }
    return out;
  }

  private spellEffect(input: Input): ToolResult {
    const p = this.pc(input.character);
    const { c, s } = p;
    const key = String(input.spell ?? '').trim();
    const spell = this.rules.spells.find((x) => x.key === key);
    if (!spell) throw new ToolError(`没有这个法术：${key}`);
    const conc = s.concentration;
    const active = conc?.spell === key || (!spell.concentration && REPEATABLE_SPELLS.has(key));
    if (!active) throw new ToolError(`${c.name}现在没有在维持${spell.name}${conc ? `（他专注的是${conc.name}）` : ''}：要先 cast_spell`);
    const level = conc?.spell === key ? (conc.level ?? spell.level) : spell.level;
    const r = this.resolveSpell(p, { ...spell, mech: spell.mech ? { ...spell.mech, effect: undefined } : null }, level, input);
    return ok({ character: c.name, spell: spell.name, level, results: r.results, ...(r.notes.length ? { notes: r.notes } : {}) });
  }

  // ==================== 职业、种族能力 ====================

  private useFeature(input: Input): ToolResult {
    const p = this.pc(input.character);
    const { c, s, sheet } = p;
    const feature = String(input.feature ?? '').trim();
    const option = typeof input.option === 'string' ? input.option.trim() : '';
    const reason = text(input.reason, 60) || feature;
    const need = (key: string, n = 1) => {
      if (!useResource(s, sheet, key, n)) {
        const r = sheet.resources.find((x) => x.key === key);
        throw new ToolError(r ? `${c.name}的${r.name}用完了（还剩 ${resourceLeft(s, sheet, key)}）` : `${c.name}没有这个能力`);
      }
    };
    const self = (line: string) => {
      this.change(c, line);
      return line;
    };
    const ref = `c${c.id}`;
    const result: Record<string, unknown> = { character: c.name, feature };
    switch (feature) {
      case 'rage': {
        if (s.data.class !== 'barbarian') throw new ToolError('只有野蛮人能狂暴');
        if (isRaging(s)) throw new ToolError(`${c.name}已经在狂暴了`);
        const body = armorOf(this.rules, s.data.equipped.armor);
        if (body?.kind === 'heavy') throw new ToolError('穿着重甲不能狂暴');
        need('rage');
        s.effects.push({ id: effectId(), key: 'rage', name: '狂暴', from: c.name, until: 'combat', mods: { resist: ['bludgeoning', 'piercing', 'slashing'], advChecks: ['str'], advSaves: ['str'], rageDamage: RAGE_BONUS(sheet.level) }, note: `钝击、穿刺、挥砍伤害减半；力量检定和豁免有优势；力量攻击伤害 +${RAGE_BONUS(sheet.level)}；不能施法、不能专注` });
        if (s.concentration) this.endConcentration(p, '狂暴了');
        result.result = self(`狂暴（还剩 ${resourceLeft(s, sheet, 'rage')} 次）`);
        break;
      }
      case 'end-rage':
        s.effects = s.effects.filter((e) => e.key !== 'rage');
        result.result = self('狂暴结束了');
        break;
      case 'second-wind': {
        if (s.data.class !== 'fighter') throw new ToolError('只有战士有回气');
        need('second-wind');
        const amount = this.rng(10) + sheet.level;
        const r = healCharacter(s, sheet, amount);
        result.result = self(`回气：${healedText(amount, r)}`);
        break;
      }
      case 'action-surge':
        if (s.data.class !== 'fighter' || sheet.level < 2) throw new ToolError('动作如潮要 2 级战士');
        need('action-surge');
        result.result = self('动作如潮：这回合多一个动作（不能是魔法动作）');
        break;
      case 'bardic-inspiration': {
        if (s.data.class !== 'bard') throw new ToolError('只有吟游诗人有诗人激励');
        const t = this.pc(input.target_character);
        if (t.c.id === c.id) throw new ToolError('诗人激励要给别人');
        need('bardic-inspiration');
        t.s.bardicDie = bardicDie(sheet.level);
        this.change(t.c, `得到诗人激励（d${t.s.bardicDie}）`);
        result.result = self(`给了${t.c.name}一颗诗人激励骰（d${t.s.bardicDie}，一小时内 d20 检定失败时可以加上）`);
        break;
      }
      case 'cutting-words': {
        if (s.data.subclass !== 'college-of-lore' || sheet.level < 3) throw new ToolError('刻薄言辞要逸闻学院 3 级');
        need('bardic-inspiration');
        const n = this.rng(bardicDie(sheet.level));
        result.result = self(`刻薄言辞：掷出 ${n}，从敌人这次的攻击、检定或伤害里减掉 ${n}（你照这个结果叙述）`);
        break;
      }
      case 'channel-divinity':
        return this.channelDivinity(p, option, input, reason);
      case 'lay-on-hands': {
        if (s.data.class !== 'paladin') throw new ToolError('只有圣武士有圣疗');
        const t = input.target_character !== undefined ? this.pc(input.target_character, { alive: true }) : p;
        const pool = resourceLeft(s, sheet, 'lay-on-hands');
        if (option === 'cure-poison' || option === 'poison') {
          need('lay-on-hands', 5);
          removeCondition(t.s.conditions, 'poisoned');
          this.change(t.c, '圣疗：解除中毒');
          result.result = `用 5 点圣疗池解除了${t.c.name}的中毒（池里还剩 ${resourceLeft(s, sheet, 'lay-on-hands')}）`;
          break;
        }
        const amount = Number.isInteger(input.amount) ? Math.max(1, Math.min(pool, input.amount as number)) : Math.min(pool, hpMaxOf(t.s, t.sheet) - t.s.hp);
        if (amount <= 0) throw new ToolError(pool <= 0 ? '圣疗池空了' : `${t.c.name}的生命值是满的`);
        need('lay-on-hands', amount);
        const r = healCharacter(t.s, t.sheet, amount);
        this.change(t.c, `圣疗：生命值 ${r.before} → ${r.after}`);
        result.result = `圣疗：${t.c.name}恢复 ${amount} 点生命值（${r.before} → ${r.after}，池里还剩 ${resourceLeft(s, sheet, 'lay-on-hands')}）`;
        break;
      }
      case 'wild-shape': {
        if (s.data.class !== 'druid' || sheet.level < 2) throw new ToolError('荒野变形要 2 级德鲁伊');
        if (option === 'end' || option === '') {
          if (!s.wildShape) throw new ToolError(`${c.name}没有在变形`);
          s.wildShape = null;
          result.result = self('变回了原来的样子');
          break;
        }
        if (!s.data.wildShapes.includes(option)) throw new ToolError(`${c.name}会的形态：${s.data.wildShapes.map((k) => `${this.rules.beasts.find((b) => b.key === k)?.name ?? k}（${k}）`).join('、')}`);
        const beast = this.srd(option);
        if (!beast) throw new ToolError(`没有这种野兽：${option}`);
        need('wild-shape');
        s.wildShape = option;
        const g = grantTempHp(s, sheet.level);
        result.result = self(`荒野变形成${beast.name}（临时生命值 ${g.after}；AC ${beast.ac}，攻击：${beast.actions.map((a) => a.name).join('、')}；用 use_feature 的 wild-shape-attack 攻击）`);
        break;
      }
      case 'wild-shape-attack': {
        if (!s.wildShape) throw new ToolError(`${c.name}没有在变形`);
        return this.beastAttack(p, option, input, reason);
      }
      case 'lands-aid': {
        if (s.data.subclass !== 'circle-of-the-land' || sheet.level < 3) throw new ToolError('大地援助要大地结社 3 级');
        need('wild-shape');
        const dc = 8 + sheet.pb + sheet.mods.wis;
        const lines: string[] = [];
        const dmg = rollDice(parseDice(sheet.level >= 10 ? '3d6' : '2d6')!, this.rng).total;
        for (const m of this.enemiesNear(c, input.enemies)) {
          const r = this.monsterSave(m, 'con', dc, { reason: '大地援助：体质豁免' });
          const res = this.hitMonster(m, [{ amount: r.success ? Math.floor(dmg / 2) : dmg, type: 'necrotic' }], c);
          lines.push(`${m.name}${r.success ? '豁免成功，' : ''}受到 ${res.taken} 点暗蚀伤害`);
        }
        if (input.target_character !== undefined) {
          const t = this.pc(input.target_character);
          const amount = rollDice(parseDice('2d6')!, this.rng).total;
          const r = healCharacter(t.s, t.sheet, amount);
          this.change(t.c, `大地援助：生命值 ${r.before} → ${r.after}`);
          lines.push(`${t.c.name}${healedText(amount, r)}`);
        }
        result.result = lines;
        this.change(c, '大地援助：用掉一次荒野变形');
        break;
      }
      case 'flurry-of-blows':
        if (s.data.class !== 'monk' || sheet.level < 2) throw new ToolError('疾风连击要 2 级武僧');
        need('focus');
        result.result = self('疾风连击：花 1 点功力点，用附赠动作徒手打击两次（各用 attack，weapon 写 unarmed）');
        break;
      case 'patient-defense':
        if (s.data.class !== 'monk' || sheet.level < 2) throw new ToolError('坚强防御要 2 级武僧');
        need('focus');
        s.effects.push({ id: effectId(), key: 'dodge', name: '闪避', from: c.name, turnOf: ref, mods: { disAgainst: true, advSaves: ['dex'] }, note: '到他下回合开始前，别人打他有劣势，敏捷豁免有优势' });
        result.result = self('坚强防御：花 1 点功力点，撤离加闪避');
        break;
      case 'step-of-the-wind':
        if (s.data.class !== 'monk' || sheet.level < 2) throw new ToolError('疾步如风要 2 级武僧');
        need('focus');
        result.result = self('疾步如风：花 1 点功力点，撤离加疾走，这回合跳跃距离翻倍');
        break;
      case 'dodge':
        s.effects.push({ id: effectId(), key: 'dodge', name: '闪避', from: c.name, turnOf: ref, mods: { disAgainst: true, advSaves: ['dex'] }, note: '到他下回合开始前，别人打他有劣势，敏捷豁免有优势' });
        result.result = self('闪避：到下回合开始前，别人打他有劣势，敏捷豁免有优势');
        break;
      case 'help': {
        // 协助动作（谁都能用）：写了身边的一个敌人是协助攻击（同伴下一次打它有优势），没写是协助检定（同伴下一次属性检定有优势）；到协助的人下回合开始失效
        const t = this.pc(input.target_character);
        if (t.c.id === c.id) throw new ToolError('协助要给别人：target_character 写被协助的同伴');
        if (t.c.location !== c.location) throw new ToolError(`${t.c.name}不在${c.name}身边，协助不了`);
        const foes = this.enemiesNear(c, input.enemies);
        if (foes.length > 1) throw new ToolError('协助攻击只能写一个敌人（enemies 写一个）');
        const m = foes[0];
        if (m?.defeated) throw new ToolError(`${m.name}已经倒下了`);
        const name = `${c.name}的协助`;
        t.s.effects = t.s.effects.filter((e) => !(e.key === 'help' && e.from === c.name));
        if (m) {
          t.s.effects.push({ id: effectId(), key: 'help', name, from: c.name, vs: m.id, turnOf: ref, once: true, mods: { advAttack: true }, note: `下一次攻击${m.name}有优势（到${c.name}下回合开始）` });
          this.change(t.c, `${name}：下一次攻击${m.name}有优势`);
          result.result = self(`协助${t.c.name}：牵制住${m.name}，${t.c.name}下一次攻击它有优势（到${c.name}下回合开始前有效）`);
        } else {
          t.s.effects.push({ id: effectId(), key: 'help', name, from: c.name, turnOf: ref, once: true, mods: { advChecks: [...ABILITIES] }, note: `下一次属性检定有优势（到${c.name}下回合开始）` });
          this.change(t.c, `${name}：下一次属性检定有优势`);
          result.result = self(`协助${t.c.name}：${t.c.name}下一次属性检定有优势（到${c.name}下回合开始前有效）`);
        }
        break;
      }
      case 'steady-aim':
        if (s.data.class !== 'rogue' || sheet.level < 3) throw new ToolError('稳定瞄准要 3 级游荡者');
        s.effects.push({ id: effectId(), key: 'steady-aim', name: '稳定瞄准', from: c.name, turnOf: ref, once: true, mods: { advAttack: true }, note: '这回合下一次攻击有优势（这回合不能移动）' });
        result.result = self('稳定瞄准：这回合下一次攻击有优势');
        break;
      case 'innate-sorcery':
        if (s.data.class !== 'sorcerer') throw new ToolError('只有术士有先天术法');
        need('innate-sorcery');
        s.effects.push({ id: effectId(), key: 'innate-sorcery', name: '先天术法', from: c.name, until: 'combat', mods: { spellDc: 1 }, note: '1 分钟：术士法术的豁免 DC +1，法术攻击有优势' });
        result.result = self('先天术法：1 分钟内法术豁免 DC +1，法术攻击有优势');
        break;
      case 'font-of-magic': {
        if (s.data.class !== 'sorcerer' || sheet.level < 2) throw new ToolError('术法之源要 2 级术士');
        const lv = Number.isInteger(input.amount) ? (input.amount as number) : 1;
        if (option === 'to-points') {
          if (lv < 1 || lv > 3 || slotsLeft(s, sheet, lv) <= 0) throw new ToolError(`没有 ${lv} 环的法术位可以换`);
          s.slotsUsed[lv - 1] += 1;
          s.used['sorcery-points'] = Math.max(0, (s.used['sorcery-points'] ?? 0) - lv);
          result.result = self(`用掉一个 ${lv} 环法术位，换回 ${lv} 点术法点（现在 ${resourceLeft(s, sheet, 'sorcery-points')} 点）`);
        } else {
          const cost: Record<number, number> = { 1: 2, 2: 3, 3: 5 };
          const minLevel: Record<number, number> = { 1: 2, 2: 3, 3: 5 };
          if (!cost[lv] || sheet.level < minLevel[lv]) throw new ToolError(`${sheet.level} 级的术士造不了 ${lv} 环法术位`);
          if (s.slotsUsed[lv - 1] <= 0) throw new ToolError(`${c.name}的 ${lv} 环法术位是满的，不用造`);
          need('sorcery-points', cost[lv]);
          s.slotsUsed[lv - 1] = Math.max(0, s.slotsUsed[lv - 1] - 1);
          result.result = self(`花 ${cost[lv]} 点术法点造了一个 ${lv} 环法术位`);
        }
        break;
      }
      case 'magical-cunning': {
        if (s.data.class !== 'warlock' || sheet.level < 2) throw new ToolError('魔法机巧要 2 级邪术师');
        need('magical-cunning');
        const back = Math.ceil((sheet.spell?.pact?.count ?? 0) / 2);
        s.pactUsed = Math.max(0, s.pactUsed - back);
        result.result = self(`魔法机巧：恢复 ${back} 个契约魔法法术位`);
        break;
      }
      case 'breath-weapon': {
        if (s.data.species !== 'dragonborn') throw new ToolError('只有龙裔有吐息武器');
        need('breath-weapon');
        const lineage = this.rules.species.find((x) => x.key === 'dragonborn')?.lineages.find((l) => l.key === s.data.lineage);
        const type = (lineage?.damageType ?? 'fire') as DamageType;
        const dc = 8 + sheet.mods.con + sheet.pb;
        const dice = sheet.level >= 5 ? '2d10' : '1d10';
        const rolled = rollDice(parseDice(dice)!, this.rng).total;
        const lines: string[] = [];
        for (const m of this.enemiesNear(c, input.enemies)) {
          const r = this.monsterSave(m, 'dex', dc, { reason: '吐息武器：敏捷豁免' });
          const res = this.hitMonster(m, [{ amount: r.success ? Math.floor(rolled / 2) : rolled, type }], c);
          lines.push(`${m.name}${r.success ? '豁免成功，' : ''}受到 ${res.taken} 点${DAMAGE_NAME[type]}伤害`);
        }
        for (const x of (Array.isArray(input.characters) ? input.characters : []).map((id) => this.pc(id))) {
          const r = this.pcSave(x, 'dex', dc, { reason: '吐息武器：敏捷豁免' });
          const h = this.harmPc(x, [{ amount: r.success ? Math.floor(rolled / 2) : rolled, type }], '吐息武器');
          lines.push(`${x.c.name}受到 ${h.taken} 点伤害`);
        }
        result.result = lines;
        this.change(c, `吐息武器（${dice} ${DAMAGE_NAME[type]}，DC ${dc}）`);
        break;
      }
      case 'giant-ancestry': {
        if (s.data.species !== 'goliath') throw new ToolError('只有歌利亚有巨人祖先');
        need('giant-ancestry');
        const lines: string[] = [];
        const lineage = s.data.lineage ?? '';
        const target = this.enemiesNear(c, input.enemies)[0];
        if (lineage.endsWith('fires-burn') && target) {
          const res = this.hitMonster(target, [{ amount: this.rng(10), type: 'fire' }], c);
          lines.push(`火之灼烧：${target.name}多受 ${res.taken} 点火焰伤害`);
        } else if (lineage.endsWith('frosts-chill') && target) {
          const res = this.hitMonster(target, [{ amount: this.rng(6), type: 'cold' }], c);
          lines.push(`霜之寒意：${target.name}多受 ${res.taken} 点冷冻伤害，速度 −10 尺`);
        } else if (lineage.endsWith('hills-tumble') && target) {
          addCondition(target.conditions, { key: 'prone', note: '丘之颠仆', from: c.name });
          this.worldChanged = true;
          lines.push(`丘之颠仆：${target.name}倒地`);
        } else if (lineage.endsWith('storms-thunder') && target) {
          const res = this.hitMonster(target, [{ amount: this.rng(8), type: 'thunder' }], c);
          lines.push(`风暴之雷：${target.name}受到 ${res.taken} 点雷鸣伤害`);
        } else if (lineage.endsWith('stones-endurance')) {
          throw new ToolError('石之坚忍是被打中时用的反应：在 monster_action 的 reactions 里填 stones-endurance');
        } else if (lineage.endsWith('clouds-jaunt')) {
          lines.push('云之跃迁：附赠动作，传送到 30 尺内一个看得见的空位');
        } else throw new ToolError('火之灼烧、霜之寒意、丘之颠仆、风暴之雷要在 enemies 里写目标');
        result.result = lines;
        this.change(c, '用了一次巨人祖先');
        break;
      }
      case 'large-form':
        if (s.data.species !== 'goliath' || sheet.level < 5) throw new ToolError('巨大形态要 5 级歌利亚');
        need('large-form');
        s.effects.push({ id: effectId(), key: 'large-form', name: '巨大形态', from: c.name, until: 'combat', mods: { advChecks: ['str'] }, note: '10 分钟：变成大型，力量检定有优势，速度 +10 尺' });
        result.result = self('巨大形态：变成大型，力量检定有优势，速度 +10 尺');
        break;
      case 'adrenaline-rush': {
        if (s.data.species !== 'orc') throw new ToolError('只有兽人有肾上腺素激增');
        need('adrenaline-rush');
        const g = grantTempHp(s, sheet.pb);
        result.result = self(`肾上腺素激增：附赠动作疾走，临时生命值 ${g.after}`);
        break;
      }
      case 'draconic-flight':
        if (s.data.species !== 'dragonborn' || sheet.level < 5) throw new ToolError('龙族飞行要 5 级龙裔');
        need('draconic-flight');
        result.result = self('龙族飞行：10 分钟内有飞行速度');
        break;
      case 'stonecunning':
        if (s.data.species !== 'dwarf') throw new ToolError('只有矮人有石工知识');
        need('stonecunning');
        result.result = self('石工知识：10 分钟内在石面上有 60 尺震颤感知');
        break;
      default:
        if (feature in REST_ONLY) throw new ToolError(`${REST_ONLY[feature]}，不用 use_feature`);
        throw new ToolError(`没有这个能力：${feature}。${c.name}的资源：${sheet.resources.map((r) => `${r.name}（${r.key}，剩 ${resourceLeft(s, sheet, r.key)}）`).join('、') || '没有'}`);
    }
    this.changed.add(c.id);
    result.reason = reason;
    result.resources = sheet.resources.map((r) => `${r.name} ${resourceLeft(s, sheet, r.key)}/${r.max}`);
    return ok(result);
  }

  private channelDivinity(p: PC, option: string, input: Input, reason: string): ToolResult {
    const { c, s, sheet } = p;
    const isCleric = s.data.class === 'cleric' && sheet.level >= 2;
    const isPaladin = s.data.class === 'paladin' && sheet.level >= 3;
    if (!isCleric && !isPaladin) throw new ToolError('引导神力要 2 级牧师或 3 级圣武士');
    if (!useResource(s, sheet, 'channel-divinity')) throw new ToolError(`${c.name}的引导神力用完了`);
    const dc = 8 + sheet.pb + sheet.mods[isCleric ? 'wis' : 'cha'];
    const lines: string[] = [];
    switch (option) {
      case 'divine-spark': {
        if (!isCleric) throw new ToolError('神圣火花是牧师的');
        const roll = this.rng(8) + sheet.mods.wis;
        if (input.target_character !== undefined) {
          const t = this.pc(input.target_character);
          const r = healCharacter(t.s, t.sheet, Math.max(0, roll));
          this.change(t.c, `神圣火花：生命值 ${r.before} → ${r.after}`);
          lines.push(`${t.c.name}${healedText(Math.max(0, roll), r)}`);
        } else {
          const m = this.enemiesNear(c, input.enemies)[0];
          if (!m) throw new ToolError('神圣火花要写 target_character（治疗）或 enemies（伤害）');
          const r = this.monsterSave(m, 'con', dc, { reason: '神圣火花：体质豁免' });
          const type: DamageType = input.damage_type === 'necrotic' ? 'necrotic' : 'radiant';
          const res = this.hitMonster(m, [{ amount: Math.max(0, r.success ? Math.floor(roll / 2) : roll), type }], c);
          lines.push(`${m.name}${r.success ? '豁免成功，' : ''}受到 ${res.taken} 点${DAMAGE_NAME[type]}伤害`);
        }
        break;
      }
      case 'turn-undead': {
        if (!isCleric) throw new ToolError('驱散不死是牧师的');
        for (const m of this.enemiesNear(c, input.enemies)) {
          const data = this.mdata(m);
          if (!/不死|undead/i.test(data.type)) {
            lines.push(`${m.name}不是不死生物，不受影响`);
            continue;
          }
          const r = this.monsterSave(m, 'wis', dc, { reason: '驱散不死：感知豁免' });
          if (r.success) {
            lines.push(`${m.name}豁免成功`);
            continue;
          }
          addCondition(m.conditions, { key: 'frightened', note: '驱散不死（1 分钟，受伤就结束）', from: c.name });
          addCondition(m.conditions, { key: 'incapacitated', note: '驱散不死', from: c.name });
          let extra = '';
          if (sheet.level >= 5) {
            const n = Math.max(1, sheet.mods.wis);
            const dmg = rollDice({ count: n, sides: 8, bonus: 0 }, this.rng).total;
            const res = this.hitMonster(m, [{ amount: dmg, type: 'radiant' }], c, { keepTurned: true });
            extra = `，灼烧不死：受到 ${res.taken} 点光耀伤害`;
          }
          this.worldChanged = true;
          lines.push(`${m.name}恐慌、失能，拼命逃开${extra}`);
        }
        break;
      }
      case 'preserve-life': {
        if (s.data.subclass !== 'life-domain' || sheet.level < 3) throw new ToolError('保存生命要生命领域 3 级');
        let pool = 5 * sheet.level;
        const targets = (Array.isArray(input.characters) ? input.characters : []).map((id) => this.pc(id));
        const each = Number.isInteger(input.amount) ? (input.amount as number) : Math.floor(pool / Math.max(1, targets.length));
        for (const t of targets) {
          const cap = Math.floor(hpMaxOf(t.s, t.sheet) / 2);
          const give = Math.max(0, Math.min(pool, each, cap - t.s.hp));
          if (give <= 0) {
            lines.push(`${t.c.name}的生命值已经过了一半，保存生命不能再加`);
            continue;
          }
          pool -= give;
          const r = healCharacter(t.s, t.sheet, give);
          this.change(t.c, `保存生命：生命值 ${r.before} → ${r.after}`);
          lines.push(`${t.c.name}${healedText(give, r)}`);
        }
        break;
      }
      case 'sacred-weapon': {
        if (s.data.subclass !== 'oath-of-devotion') throw new ToolError('神圣武器要奉献之誓');
        const bonus = Math.max(1, sheet.mods.cha);
        s.effects.push({ id: effectId(), key: 'sacred-weapon', name: '神圣武器', from: c.name, until: 'combat', mods: { attackDice: String(bonus) }, note: `10 分钟：近战武器攻击检定 +${bonus}，可以造成光耀伤害，发出光亮` });
        lines.push(`神圣武器：近战攻击检定 +${bonus}`);
        this.change(c, '神圣武器');
        break;
      }
      case 'divine-sense':
        if (!isPaladin) throw new ToolError('神圣感知是圣武士的');
        lines.push('神圣感知：10 分钟内知道 60 尺内天界生物、邪魔、不死生物的位置和类型（照剧本告诉他）');
        break;
      default:
        s.used['channel-divinity'] = Math.max(0, (s.used['channel-divinity'] ?? 1) - 1);
        throw new ToolError('引导神力要写 option：divine-spark、turn-undead、preserve-life、sacred-weapon、divine-sense');
    }
    this.changed.add(c.id);
    this.change(c, `引导神力（还剩 ${resourceLeft(s, sheet, 'channel-divinity')} 次）`);
    return ok({ character: c.name, feature: 'channel-divinity', option, result: lines, reason });
  }

  /** 荒野变形以后用野兽的攻击。 */
  private beastAttack(p: PC, actionName: string, input: Input, reason: string): ToolResult {
    const { c, s } = p;
    const beast = this.srd(s.wildShape!);
    if (!beast) throw new ToolError('野兽数据找不到');
    const fight = this.fightAt(c.location);
    const enemiesList = Array.isArray(input.enemies) ? input.enemies : [];
    const m = this.monsterIn(fight, enemiesList[0]);
    if (m.defeated) throw new ToolError(`${m.name}已经倒下了`);
    const { a } = this.findAction(beast, actionName || '1');
    if (a.attack === null) throw new ToolError(`${beast.name}的「${a.name}」不是攻击`);
    const { adv, dis } = this.advFrom(input);
    const am = attackerMode(s.conditions, s.effects.filter((e) => !e.vs || e.vs === m.id));
    adv.push(...am.adv);
    dis.push(...am.dis);
    const tm = targetMode(m.conditions, m.effects, true, `c${c.id}`);
    adv.push(...tm.adv);
    dis.push(...tm.dis);
    const ac = this.monsterAc(m, input);
    const r = d20Test({ label: `${beast.name}·${a.name}`, bonus: a.attack, advantage: adv.length > 0, disadvantage: dis.length > 0, target: ac }, this.rng);
    this.usedAttackBoosts(s, m);
    const hit = !r.natural1 && (r.natural20 || r.total >= ac);
    let taken = 0;
    if (hit) {
      const rolled = rollDamage(a.damage.filter((d) => !d.when).map((d) => ({ dice: d.dice, type: d.type, label: a.name })), this.rng, { crit: r.natural20 });
      taken = this.hitMonster(m, rolled.parts.map((x) => ({ amount: x.total, type: x.type })), c).taken;
    }
    this.record(c, 'attack', reason, r, 'attack', { target: ac, success: hit, crit: hit && r.natural20, combat: { kind: 'attack', target: m.name, defense: ac, hit, damage: taken || null } });
    return ok({ character: c.name, form: beast.name, action: a.name, total: r.total, ac: ac, hit, damage: taken, enemy: { id: m.id, hp: `${m.hp}/${m.hpMax}`, defeated: m.defeated } });
  }

  // ==================== 伤害、治疗、状态 ====================

  private damageTool(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const dice = parseDice(String(input.dice ?? ''));
    if (!dice) throw new ToolError('dice 要写成 2d6、3d10+3 这样');
    const type = isDamageType(input.type) ? (input.type as DamageType) : null;
    if (!type) throw new ToolError('type 要写伤害类型');
    const reason = text(input.reason, 60) || '受伤';
    const t = this.targets(actor, input);
    const saveAb = isAbility(input.save_ability) ? (input.save_ability as Ability) : null;
    const dc = Number.isInteger(input.save_dc) ? (input.save_dc as number) : null;
    const onSave = input.on_save === 'none' ? 'none' : 'half';
    const rolled = rollDice(dice, this.rng).total;
    const results: Record<string, unknown>[] = [];
    for (const x of t.pcs) {
      let factor = 1;
      let save: string | null = null;
      if (saveAb && dc) {
        const r = this.pcSave(x, saveAb, dc, { reason: `${reason}：${ABILITY_NAME[saveAb]}豁免` });
        factor = r.success ? (onSave === 'half' ? 0.5 : 0) : 1;
        save = `${r.total} 对 DC ${dc}，${r.success ? '成功' : '失败'}`;
      }
      const h = factor > 0 ? this.harmPc(x, [{ amount: Math.floor(rolled * factor), type }], reason) : { taken: 0, result: {} };
      results.push({ target: x.c.name, ...(save ? { save } : {}), damage: h.taken, ...h.result });
    }
    for (const m of t.mons) {
      let factor = 1;
      let save: string | null = null;
      if (saveAb && dc) {
        const r = this.monsterSave(m, saveAb, dc, { reason: `${reason}：${ABILITY_NAME[saveAb]}豁免` });
        factor = r.success ? (onSave === 'half' ? 0.5 : 0) : 1;
        save = `${r.total} 对 DC ${dc}，${r.success ? '成功' : '失败'}`;
      }
      const res = this.hitMonster(m, [{ amount: Math.floor(rolled * factor), type }], null);
      results.push({ target: m.name, ...(save ? { save } : {}), damage: res.taken, hp: `${m.hp}/${m.hpMax}` });
    }
    if (!results.length) throw new ToolError('characters 或 enemies 至少写一个');
    return ok({ rolled: `${formatDice(dice)} = ${rolled} ${DAMAGE_NAME[type]}`, results });
  }

  private healTool(input: Input): ToolResult {
    const reason = text(input.reason, 60) || '恢复';
    const list = (Array.isArray(input.characters) ? input.characters : []).map((id) => this.pc(id));
    if (!list.length) throw new ToolError('characters 要写');
    const dice = typeof input.dice === 'string' || typeof input.dice === 'number' ? parseDice(String(input.dice)) : null;
    const results: Record<string, unknown>[] = [];
    for (const x of list) {
      const out: Record<string, unknown> = { target: x.c.name };
      if (input.stabilize === true) {
        if (x.s.hp === 0 && !x.s.stable) {
          x.s.stable = true;
          x.s.death = null;
          this.change(x.c, '稳定下来了（还昏迷着）');
          this.events.push(`${x.c.name}稳定下来了`);
          out.stabilized = true;
        } else out.stabilized = '本来就不用稳定';
      }
      if (dice) {
        const amount = Math.max(0, rollDice(dice, this.rng).total);
        const r = healCharacter(x.s, x.sheet, amount);
        this.change(x.c, `生命值 ${r.before} → ${r.after}（${reason}）`);
        if (r.revived) this.events.push(`${x.c.name}醒了过来`);
        out.healed = r.after - r.before;
        if (r.after - r.before < amount) out.rolled = amount;
        out.hp = `${r.before} → ${r.after}`;
      }
      if (Number.isInteger(input.temp_hp) && (input.temp_hp as number) > 0) {
        const g = grantTempHp(x.s, Math.min(50, input.temp_hp as number));
        this.change(x.c, `临时生命值 ${g.after}（${reason}）`);
        out.temp_hp = g.after;
      }
      this.changed.add(x.c.id);
      results.push(out);
    }
    return ok({ results, reason });
  }

  private conditionTool(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const reason = text(input.reason, 60) || '状态变化';
    const t = this.targets(actor, input);
    const add = (Array.isArray(input.add) ? input.add : []).map((x) => (x && typeof x === 'object' ? (x as Input) : {})).filter((x) => isCondition(x.condition));
    const remove = (Array.isArray(input.remove) ? input.remove : []).filter(isCondition) as Condition5e[];
    const endEffects = (Array.isArray(input.end_effects) ? input.end_effects : []).map((x) => text(x, 20)).filter(Boolean);
    const results: Record<string, unknown>[] = [];
    /**
     * 加上的状态：until 写了的按回合结束（actor_turn_start 到行动角色的下回合开始；own_turn_end 到带着它的人自己下一个回合结束），
     * 没写的一直在，要主持人去掉（重新加一次也去掉之前的回合期限）。
     */
    const made = (a: Input, self: string, selfName: string): ConditionState => {
      const key = a.condition as Condition5e;
      const until = a.until === 'actor_turn_start' ? `到${actor.name}下回合开始` : a.until === 'own_turn_end' ? `到${selfName}下一个回合结束` : '';
      const note = text(a.note, 40) || until;
      return {
        key,
        ...(note ? { note } : {}),
        turnOf: a.until === 'actor_turn_start' ? `c${actor.id}` : a.until === 'own_turn_end' ? self : undefined,
        endOfTurn: a.until === 'own_turn_end' ? true : undefined,
        ending: undefined,
      };
    };
    for (const x of t.pcs) {
      const lines: string[] = [];
      for (const a of add) {
        const cond = made(a, `c${x.c.id}`, x.c.name);
        addCondition(x.s.conditions, cond);
        lines.push(`${CONDITION_NAME[cond.key]}`);
        this.change(x.c, `状态：${CONDITION_NAME[cond.key]}${cond.note ? `（${cond.note}）` : ''}`);
      }
      for (const k of remove) {
        if (removeCondition(x.s.conditions, k)) {
          lines.push(`不再${CONDITION_NAME[k]}`);
          this.change(x.c, `不再${CONDITION_NAME[k]}`);
        }
      }
      if (Number.isInteger(input.exhaustion) && input.exhaustion !== 0) {
        const before = x.s.exhaustion;
        x.s.exhaustion = Math.max(0, Math.min(EXHAUSTION_MAX, before + (input.exhaustion as number)));
        this.change(x.c, `力竭 ${before} → ${x.s.exhaustion} 级`);
        lines.push(`力竭 ${x.s.exhaustion} 级`);
        if (x.s.exhaustion >= EXHAUSTION_MAX && this.allowDeath) {
          x.c.dead = true;
          this.change(x.c, '死亡（力竭 6 级）');
          this.events.push(`${x.c.name}力竭而死`);
        }
      }
      if (typeof input.inspiration === 'boolean') {
        x.s.inspiration = input.inspiration;
        this.change(x.c, input.inspiration ? '得到英雄激励' : '英雄激励没了');
        lines.push(input.inspiration ? '得到英雄激励' : '英雄激励没了');
      }
      if (endEffects.length) {
        const before = x.s.effects.length;
        x.s.effects = x.s.effects.filter((e) => !endEffects.includes(e.name) && !endEffects.includes(e.key));
        if (x.s.effects.length !== before) {
          lines.push(`结束：${endEffects.join('、')}`);
          this.change(x.c, `结束：${endEffects.join('、')}`);
        }
      }
      if (input.end_concentration === true && x.s.concentration) {
        this.endConcentration(x, reason);
        lines.push('专注结束了');
      }
      this.changed.add(x.c.id);
      results.push({ target: x.c.name, changes: lines.length ? lines : ['没有变化'], conditions: conditionNames(x.s.conditions) });
    }
    for (const m of t.mons) {
      for (const a of add) addCondition(m.conditions, made(a, m.id, m.name));
      for (const k of remove) removeCondition(m.conditions, k);
      if (endEffects.length) m.effects = m.effects.filter((e) => !endEffects.includes(e.name) && !endEffects.includes(e.key));
      this.worldChanged = true;
      results.push({ target: m.name, conditions: conditionNames(m.conditions) });
    }
    if (!results.length) throw new ToolError('characters 或 enemies 至少写一个');
    return ok({ results, reason });
  }

  // ==================== 战斗 ====================

  private startCombat(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const location = actor.location;
    if (!location) throw new ToolError('行动的角色不在任何地点，没法开打');
    const spec: { monster: string; count: number; name: string | null }[] = [];
    for (const raw of Array.isArray(input.monsters) ? input.monsters : []) {
      const o = (raw && typeof raw === 'object' ? raw : {}) as Input;
      if (typeof o.monster !== 'string') continue;
      // name（V1.0.0）：剧本里的人物用通用的数据块动手时，照他的名字叫
      const name = typeof o.name === 'string' && o.name.trim() ? [...o.name.trim()].slice(0, 20).join('') : null;
      spec.push({ monster: o.monster, count: Number.isInteger(o.count) ? Math.max(1, Math.min(8, o.count as number)) : 1, name });
    }
    if (!spec.length) throw new ToolError('monsters 要写剧本 monsters 里的 key 和数量');
    const existing = this.fights[location];
    const fight: Fight5e = existing ?? { location, round: 1, order: [], acted: [], monsters: [] };
    const added: Monster5eState[] = [];
    for (const { monster, count, name } of spec) {
      const d = scenarioMonster5e(this.scenario, monster, this.srd);
      if (!d) throw new ToolError(`剧本 monsters 里没有「${monster}」，有的是：${(this.scenario.monsters ?? []).map((x) => `${x.key}=${x.name}`).join('、')}`);
      for (let i = 0; i < count; i++) {
        const n = fight.monsters.filter((x) => x.key === monster).length + added.filter((x) => x.key === monster).length + 1;
        if (!name) {
          added.push(newMonster(d, `${monster}-${n}`, count > 1 || n > 1 ? `${d.label}${n}` : d.label));
          continue;
        }
        // 起了名字的：同一个名字的第二个起加编号
        const named = (x: Monster5eState) => x.name === name || (x.name.startsWith(name) && /^\d+$/.test(x.name.slice(name.length)));
        const same = fight.monsters.filter(named).length + added.filter(named).length;
        added.push(newMonster(d, `${monster}-${n}`, count > 1 || same > 0 ? `${name}${same + 1}` : name));
      }
    }
    if (fight.monsters.length + added.length > 16) throw new ToolError('一场战斗里最多 16 个怪物');
    fight.monsters.push(...added);
    for (const m of added) {
      const d = this.mdata(m);
      const r = d20Test({ label: '先攻', bonus: monsterMods(d).dex, disadvantage: input.enemies_surprised === true }, this.rng);
      fight.order.push({ id: m.id, name: m.name, side: 'enemy', initiative: r.total });
    }
    // 打到一半来的援兵：先攻比这次行动的角色高的，这一轮已经轮过去了（下一轮才动手），免得这一轮迟迟过不完
    const actorAt = existing ? fight.order.find((o) => o.id === `c${actor.id}`)?.initiative : undefined;
    if (actorAt !== undefined) for (const o of fight.order) if (o.side === 'enemy' && added.some((m) => m.id === o.id) && o.initiative > actorAt && !fight.acted.includes(o.id)) fight.acted.push(o.id);
    const lines: string[] = [];
    for (const c of this.characters.values()) {
      if (c.dead || !c.v5 || c.location !== location || fight.order.some((o) => o.id === `c${c.id}`)) continue;
      const sheet = this.sheetFor(c);
      const adv = c.v5.data.subclass === 'champion' && sheet.level >= 3;
      const r = d20Test({ label: '先攻', bonus: sheet.initiative, advantage: adv, disadvantage: input.surprised === true }, this.rng);
      fight.order.push({ id: `c${c.id}`, name: c.name, side: 'ally', initiative: r.total });
      this.cards.push(this.cardOf(c.name, '先攻', { kind: 'initiative', rolls: r.d20.rolls, mode: r.mode, target: null, success: null }, r.parts, r.total, c.id));
      // 武僧的奇异代谢：掷先攻时回满功力点，回一点血（长休一次）
      if (c.v5.data.class === 'monk' && sheet.level >= 2 && (c.v5.used.focus ?? 0) > 0 && resourceLeft(c.v5, sheet, 'uncanny-metabolism') > 0) {
        useResource(c.v5, sheet, 'uncanny-metabolism');
        c.v5.used.focus = 0;
        const heal = this.rng(martialArtsDie(sheet.level)) + sheet.level;
        const h = healCharacter(c.v5, sheet, heal);
        this.change(c, `奇异代谢：功力点回满，生命值 ${h.before} → ${h.after}`);
        lines.push(`${c.name}的奇异代谢：功力点回满，回了 ${heal} 点生命值`);
      }
      this.changed.add(c.id);
    }
    fight.order.sort(byInitiative);
    this.fights[location] = fight;
    this.worldChanged = true;
    const names = added.map((m) => m.name);
    this.events.push(`${existing ? '又来了' : '开打'}：${names.join('、')}`);
    this.events.push(`先攻：${fight.order.map((o) => `${o.name} ${o.initiative}`).join('、')}`);
    return ok({
      note: text(input.note, 60),
      round: fight.round,
      order: fight.order.map((o) => `${o.name}（${o.side === 'ally' ? '角色' : o.id}）${o.initiative}`),
      monsters: fight.monsters.map((m) => {
        const d = this.mdata(m);
        return { id: m.id, name: m.name, hp: `${m.hp}/${m.hpMax}`, ac: m.ac, actions: d.actions.map((a) => a.name), ...(m.defeated ? { defeated: true } : {}) };
      }),
      ...(lines.length ? { notes: lines } : {}),
      this_turn: `这次结算就是${actor.name}这一轮的回合：开打前做的事算在里面，他还可以接着做这一回合的动作（攻击、施法……）。${turnLine(fight, [...this.characters.values()], actor)}`,
      how_to:
        '按先攻顺序叙述：每次结算一个角色的回合；先攻排在这个角色和下一个角色之间的怪物，在这次结算里各行动一次（monster_action）。怪物倒下、逃走或者角色们脱身以后用 end_combat。',
    });
  }

  /** 地点的名字（给主持人看的提示里用）。 */
  private placeName(key: string): string {
    return this.scenario.locations.find((l) => l.key === key)?.name ?? key;
  }

  /**
   * update_enemy、end_combat 要改的那场战斗：默认是行动角色所在地点的；
   * 行动影响到别处的战斗（远处敲钟、放下闸门……）时用 location 指定那个地点。
   */
  private fightFor(actor: Character, input: Input): { location: string; fight: Fight5e } {
    const asked = typeof input.location === 'string' && input.location.trim() ? input.location.trim() : null;
    const location = asked ?? actor.location;
    if (location && this.fights[location]) return { location, fight: this.fights[location] };
    const elsewhere = Object.keys(this.fights)
      .filter((k) => k !== location)
      .map((k) => `${this.placeName(k)}（${k}）`);
    const where = elsewhere.length ? `；现在在打仗的地方：${elsewhere.join('、')}` : '';
    if (asked) throw new ToolError(`「${asked}」没有在打仗${where}`);
    throw new ToolError(elsewhere.length ? `${actor.name}这里没有在打仗${where}。行动影响到那里的战斗时，用 location 填那个地点` : '这里没有在打仗');
  }

  private endCombat(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const { location, fight } = this.fightFor(actor, input);
    const monsterNames = new Set(fight.monsters.map((m) => m.name));
    delete this.fights[location];
    this.worldChanged = true;
    const left: string[] = [];
    for (const c of this.characters.values()) {
      if (!c.v5 || c.dead || c.location !== location) continue;
      const s = c.v5;
      const before = s.effects.length + s.conditions.length;
      // 只在战斗里有效的效果（狂暴、侵扰……）、按回合算的状态结束；醒着的人爬起来，怪物的擒抱、束缚跟着怪物一起没了
      s.effects = s.effects.filter((e) => e.until !== 'combat' && !e.turnOf);
      s.conditions = s.conditions.filter((x) => {
        if (x.turnOf) return false;
        if (x.key === 'prone') return s.hp === 0;
        if ((x.key === 'grappled' || x.key === 'restrained') && x.from && monsterNames.has(x.from)) return false;
        return true;
      });
      s.deathRound = null;
      if (before !== s.effects.length + s.conditions.length) this.change(c, '战斗结束，只在战斗里有效的效果、状态没了');
      if (s.conditions.length) left.push(`${c.name}：${conditionNames(s.conditions).join('、')}`);
    }
    this.events.push(`战斗结束：${text(input.note, 60)}`);
    return ok({ ended: true, note: text(input.note, 60), ...(left.length ? { still: left, tip: '这些状态还在，该结束的用 condition 去掉' } : {}) });
  }

  private updateEnemy(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const m = this.monsterIn(this.fightFor(actor, input).fight, input.enemy);
    const note = text(input.note, 60);
    if (input.gone === true && !m.defeated) {
      m.defeated = true;
      m.fled = true;
      this.events.push(`${m.name}退出了战斗${note ? `：${note}` : ''}`);
    }
    // 逃走的又回来了：接着打（生命值还是走的时候的）
    if (input.gone === false && m.fled) {
      m.defeated = false;
      m.fled = false;
      this.events.push(`${m.name}又回来了${note ? `：${note}` : ''}`);
    }
    if (input.knocked_out === true) {
      addCondition(m.conditions, { key: 'unconscious', note: '被打昏' });
      this.events.push(`${m.name}被打昏了`);
    }
    if (Number.isInteger(input.temp_hp) && (input.temp_hp as number) > 0) grantTempHp(m, Math.min(100, input.temp_hp as number));
    if (typeof input.mark === 'string') {
      const mark = text(input.mark, 80);
      if (mark) m.mark = mark;
      else delete m.mark;
    }
    this.worldChanged = true;
    return ok({ enemy: m.id, name: m.name, hp: `${m.hp}/${m.hpMax}`, defeated: m.defeated, note, ...(m.mark ? { mark: m.mark } : {}) });
  }

  /** 角色走出了打仗的地方：从先攻里拿掉；那里没人了，战斗就结束。 */
  private leaveFight(c: Character, from: string): string[] {
    const fight = this.fights[from];
    if (!fight) return [];
    fight.order = fight.order.filter((o) => o.id !== `c${c.id}`);
    fight.acted = fight.acted.filter((id) => id !== `c${c.id}`);
    this.events.push(`${c.name}离开了战斗`);
    this.worldChanged = true;
    const anyone = [...this.characters.values()].some((x) => !x.dead && x.location === from);
    if (anyone) return [`${c.name}离开了那里的战斗`];
    delete this.fights[from];
    this.events.push('那里没人了，战斗结束');
    return [`${c.name}离开了那里的战斗；那里没人了，战斗结束`];
  }

  /** 角色走进了正在打仗的地方：掷先攻加进去。 */
  private joinFight(c: Character, at: string): string[] {
    const fight = this.fights[at];
    if (!fight || fight.order.some((o) => o.id === `c${c.id}`)) return [];
    const sheet = this.sheetFor(c);
    const adv = c.v5!.data.subclass === 'champion' && sheet.level >= 3;
    const r = d20Test({ label: '先攻', bonus: sheet.initiative, advantage: adv }, this.rng);
    fight.order.push({ id: `c${c.id}`, name: c.name, side: 'ally', initiative: r.total });
    fight.order.sort(byInitiative);
    this.cards.push(this.cardOf(c.name, '先攻', { kind: 'initiative', rolls: r.d20.rolls, mode: r.mode, target: null, success: null }, r.parts, r.total, c.id));
    this.events.push(`${c.name}加入了战斗（先攻 ${r.total}）`);
    this.worldChanged = true;
    return [`${c.name}走进了正在打的仗，先攻 ${r.total}；现在的先攻：${fight.order.map((o) => `${o.name} ${o.initiative}`).join('、')}`];
  }

  // ==================== 休息 ====================

  private rest(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const kind = input.kind === 'long' ? 'long' : 'short';
    const ids = Array.isArray(input.characters) && input.characters.length ? input.characters : [...this.characters.values()].filter((c) => !c.dead && c.v5 && c.location === actor.location).map((c) => c.id);
    if (actor.location && this.fights[actor.location]) throw new ToolError('还在打仗，不能休息');
    const dice = new Map<number, number>();
    for (const raw of Array.isArray(input.hit_dice) ? input.hit_dice : []) {
      const o = (raw && typeof raw === 'object' ? raw : {}) as Input;
      if (Number.isInteger(o.character) && Number.isInteger(o.dice)) dice.set(o.character as number, o.dice as number);
    }
    const results: Record<string, unknown>[] = [];
    const keep = new Set((Array.isArray(input.keep_recovery) ? input.keep_recovery : []).map(Number));
    for (const id of ids) {
      const p = this.pc(id);
      const { c, s, sheet } = p;
      let lines: string[];
      if (kind === 'long') {
        if (s.hp === 0 && !s.stable) {
          results.push({ character: c.name, result: '倒地还没稳定，休息不了' });
          continue;
        }
        if (s.concentration) this.endConcentration(p, '睡着了');
        lines = longRest(s, sheet);
        s.conditions = s.conditions.filter((x) => !(x.key === 'unconscious' && x.note === '生命值到 0'));
      } else {
        // 没说花几颗：生命值不满就按需要花
        const want = dice.get(c.id) ?? (s.hp < hpMaxOf(s, sheet) ? Math.ceil((hpMaxOf(s, sheet) - s.hp) / Math.max(1, sheet.hitDie / 2 + 1 + sheet.mods.con)) : 0);
        lines = shortRest(s, sheet, want, this.rng);
        // 奥术回复（法师）、术法复苏（术士 5 级）：短休时自动用
        if (!keep.has(c.id) && s.data.class === 'wizard' && resourceLeft(s, sheet, 'arcane-recovery') > 0 && s.slotsUsed.some((n) => n > 0)) {
          let budget = Math.ceil(sheet.level / 2);
          const back: string[] = [];
          for (let L = 3; L >= 1; L--) {
            while (budget >= L && s.slotsUsed[L - 1] > 0) {
              s.slotsUsed[L - 1] -= 1;
              budget -= L;
              back.push(`${L} 环`);
            }
          }
          if (back.length) {
            useResource(s, sheet, 'arcane-recovery');
            lines.push(`奥术回复：恢复了 ${back.join('、')}法术位`);
          }
        }
        if (!keep.has(c.id) && s.data.class === 'sorcerer' && sheet.level >= 5 && resourceLeft(s, sheet, 'sorcerous-restoration') > 0 && (s.used['sorcery-points'] ?? 0) > 0) {
          useResource(s, sheet, 'sorcerous-restoration');
          const back = Math.min(Math.floor(sheet.level / 2), s.used['sorcery-points'] ?? 0);
          s.used['sorcery-points'] -= back;
          lines.push(`术法复苏：恢复 ${back} 点术法点`);
        }
      }
      this.change(c, `${kind === 'long' ? '长休' : '短休'}：${lines.join('；') || '没有变化'}`);
      results.push({ character: c.name, changes: lines, hp: `${s.hp}/${hpMaxOf(s, sheet)}` });
    }
    return ok({ rest: kind === 'long' ? '长休' : '短休', results, reason: text(input.reason, 60) });
  }

  // ==================== 物品、宝藏 ====================

  private takeItem(p: PC, key: string, n = 1): boolean {
    const it = p.s.inventory.find((i) => i.key === key);
    if (!it || it.qty < n) return false;
    it.qty -= n;
    if (it.qty <= 0) p.s.inventory = p.s.inventory.filter((i) => i.key !== key);
    this.invalidate(p.c);
    return true;
  }

  private giveItem(p: PC, key: string, n: number, gained = true) {
    const it = p.s.inventory.find((i) => i.key === key);
    if (it) it.qty += n;
    else p.s.inventory.push({ key, qty: n });
    if (gained) {
      const g = p.s.gained.find((i) => i.key === key);
      if (g) g.qty += n;
      else p.s.gained.push({ key, qty: n });
    }
    this.invalidate(p.c);
  }

  private useItem(input: Input): ToolResult {
    const p = this.pc(input.character);
    const { c } = p;
    const key = String(input.item ?? '').trim();
    if (!p.s.inventory.some((i) => i.key === key && i.qty > 0)) {
      throw new ToolError(`${c.name}身上没有「${key}」。他带着：${p.s.inventory.map((i) => `${itemName(this.rules, i.key)}（${i.key}）×${i.qty}`).join('、') || '什么都没有'}`);
    }
    const name = itemName(this.rules, key);
    const target = input.target_character !== undefined ? this.pc(input.target_character, { alive: true }) : p;
    const heal = HEAL_ITEMS[key] ?? this.rules.magicItems.find((m) => m.key === key)?.mech?.heal ?? null;
    let result: string;
    let usedUp = true;
    if (heal) {
      const amount = rollDice(parseDice(heal)!, this.rng).total;
      const r = healCharacter(target.s, target.sheet, amount);
      this.change(target.c, `生命值 ${r.before} → ${r.after}（${name}）`);
      if (r.revived) this.events.push(`${target.c.name}喝下${name}，醒了过来`);
      result = `${target.c.name}${healedText(amount, r)}`;
    } else if (key === 'healers-kit') {
      // 医疗包能用十次：用到第十次才扔掉
      if (target.s.hp > 0 || target.s.stable) throw new ToolError(`${target.c.name}不需要稳定（医疗包只能让倒地的人稳定）`);
      target.s.stable = true;
      target.s.death = null;
      this.change(target.c, '用医疗包稳定下来了');
      const used = (p.s.used['item:healers-kit'] ?? 0) + 1;
      usedUp = used >= KIT_USES;
      p.s.used['item:healers-kit'] = usedUp ? 0 : used;
      result = `${target.c.name}稳定下来了（医疗包${usedUp ? '用完了' : `还能用 ${KIT_USES - used} 次`}）`;
    } else if (key === 'antitoxin') {
      target.s.effects.push({ id: effectId(), key: 'antitoxin', name: '抗毒剂', from: c.name, until: 'long', mods: {}, note: '1 小时内为避免或结束中毒状态的豁免有优势' });
      this.change(target.c, '喝了抗毒剂');
      result = `${target.c.name}喝了抗毒剂：1 小时内为避免或结束中毒的豁免有优势`;
    } else if (THROWN_ITEMS[key]) {
      const how = THROWN_ITEMS[key];
      const m = this.monsterIn(this.fightAt(c.location), input.target_enemy);
      if (m.defeated) throw new ToolError(`${m.name}已经倒下了`);
      const dc = 8 + p.sheet.mods.dex + p.sheet.pb;
      const r = this.monsterSave(m, 'dex', dc, { reason: `${name}：敏捷豁免` });
      if (r.success) result = `${m.name}躲开了（${r.total} 对 DC ${dc}）`;
      else if (how.condition) {
        addCondition(m.conditions, { key: how.condition, note: `${name}（DC 10 力量（运动）检定挣脱）`, from: c.name });
        this.worldChanged = true;
        result = `${m.name}被${name}缠住，束缚了`;
      } else if (how.onlyType && !how.onlyType.test(this.mdata(m).type)) {
        result = `${m.name}没躲开，可它不是邪魔或不死生物，${name}伤不了它`;
      } else if (how.dice) {
        const res = this.hitMonster(m, [{ amount: rollDice(parseDice(how.dice)!, this.rng).total, type: how.type! }], c);
        result = `${m.name}受到 ${res.taken} 点${DAMAGE_NAME[how.type!]}伤害${how.note ? `，${how.note}` : ''}${res.defeated ? '，倒下了' : ''}`;
      } else {
        m.effects.push({ id: effectId(), key, name, from: c.name, until: 'combat', mods: {}, note: how.note ?? '' });
        this.worldChanged = true;
        result = `${m.name}${how.note}`;
      }
    } else {
      result = `用掉了${name}：效果照物品说明叙述`;
    }
    if (usedUp) this.takeItem(p, key);
    this.change(c, usedUp ? `用掉：${name}` : `用了一次${name}`);
    return ok({ character: c.name, item: name, result, reason: text(input.reason, 60) });
  }

  private giveTreasure(input: Input): ToolResult {
    const p = this.pc(input.character);
    const key = String(input.treasure ?? '');
    const t = this.scenario.treasure?.find((x) => x.key === key);
    if (!t) throw new ToolError(`剧本里没有宝藏「${key}」，有的是：${(this.scenario.treasure ?? []).map((x) => x.key).join('、')}`);
    const taken = (this.world.treasureTaken ??= {});
    if (taken[key] !== undefined) throw new ToolError(`这处宝藏已经被拿走了`);
    taken[key] = p.c.id;
    this.worldChanged = true;
    const got: string[] = [];
    for (const it of t.items) {
      this.giveItem(p, it.item, it.count);
      got.push(`${itemName(this.rules, it.item)}${it.count > 1 ? ` ×${it.count}` : ''}`);
    }
    if (t.gold) {
      p.s.money += t.gold * 100;
      p.s.gainedMoney += t.gold * 100;
      got.push(`${t.gold} 金币`);
    }
    this.change(p.c, `找到：${got.join('、')}`);
    this.events.push(`${p.c.name}找到了${got.join('、')}`);
    return ok({ character: p.c.name, got, note: '东西归他了；要分给别人用 update_character（add_gear/remove_gear、gold）' });
  }

  private updateCharacter5e(input: Input): ToolResult {
    const p = this.pc(input.character);
    const { c, s } = p;
    const report: string[] = [];
    for (const raw of Array.isArray(input.add_items) ? input.add_items : []) {
      const item = text(raw, 20);
      if (!item || c.items.length >= 30) continue;
      c.items = [...c.items, item];
      this.change(c, `得到：${item}`);
      report.push(`得到「${item}」`);
    }
    for (const raw of Array.isArray(input.remove_items) ? input.remove_items : []) {
      const item = text(raw, 20);
      const i = c.items.indexOf(item);
      if (i < 0) {
        report.push(`${c.name}身上没有「${item}」`);
        continue;
      }
      c.items = c.items.filter((_, j) => j !== i);
      this.change(c, `失去：${item}`);
      report.push(`失去「${item}」`);
    }
    if (typeof input.gold === 'number' && Number.isFinite(input.gold) && input.gold !== 0) {
      const cp = Math.round((input.gold as number) * 100);
      if (s.money + cp < 0) report.push(`钱不够（只有 ${formatMoney(s.money)}），没有扣`);
      else {
        s.money += cp;
        if (cp > 0) s.gainedMoney += cp;
        this.change(c, `${cp > 0 ? '得到' : '花掉'} ${formatMoney(Math.abs(cp))}`);
        report.push(`钱 ${cp > 0 ? '+' : '−'}${formatMoney(Math.abs(cp))}，现在 ${formatMoney(s.money)}`);
      }
    }
    for (const raw of Array.isArray(input.add_gear) ? input.add_gear : []) {
      const o = (raw && typeof raw === 'object' ? raw : {}) as Input;
      const key = String(o.item ?? '');
      const n = Number.isInteger(o.count) ? Math.max(1, Math.min(50, o.count as number)) : 1;
      const base = splitItemKey(key).base;
      const known = this.rules.weapons.some((w) => w.key === base) || this.rules.armor.some((a) => a.key === base) || this.rules.gear.some((g) => g.key === key) || this.rules.magicItems.some((m) => m.key === key);
      if (!known) {
        report.push(`没有这种物品「${key}」，没加（故事物品用 add_items）`);
        continue;
      }
      this.giveItem(p, key, n);
      this.change(c, `得到：${itemName(this.rules, key)}${n > 1 ? ` ×${n}` : ''}`);
      report.push(`得到${itemName(this.rules, key)} ×${n}`);
    }
    for (const raw of Array.isArray(input.remove_gear) ? input.remove_gear : []) {
      const o = (raw && typeof raw === 'object' ? raw : {}) as Input;
      const key = String(o.item ?? '');
      const n = Number.isInteger(o.count) ? Math.max(1, o.count as number) : 1;
      if (!this.takeItem(p, key, n)) {
        report.push(`${c.name}身上没有那么多「${itemName(this.rules, key)}」`);
        continue;
      }
      this.change(c, `失去：${itemName(this.rules, key)}${n > 1 ? ` ×${n}` : ''}`);
      report.push(`失去${itemName(this.rules, key)} ×${n}`);
    }
    this.changed.add(c.id);
    return ok({ character: c.name, changes: report.length ? report : ['没有变化'], money: formatMoney(s.money), story_items: c.items });
  }
}

/** 回了多少血：实际加上的（到上限为止），掷得比缺的多时说一声满了。 */
function healedText(rolled: number, r: { before: number; after: number }): string {
  const got = r.after - r.before;
  return got < rolled ? `恢复 ${got} 点生命值（掷出 ${rolled}，生命值 ${r.before} → ${r.after}，满了）` : `恢复 ${got} 点生命值（${r.before} → ${r.after}）`;
}

/** 先攻从高到低；同分时角色在怪物前面，同一边的照原来的先后（数组的 sort 是稳定的）。 */
const byInitiative = (x: Fight5e['order'][number], y: Fight5e['order'][number]) => y.initiative - x.initiative || (x.side === y.side ? 0 : x.side === 'ally' ? -1 : 1);

/** 喝了能回血的普通物品（治疗药水在普通装备里）。 */
const HEAL_ITEMS: Record<string, string> = { 'potion-of-healing': '2d4+2' };

/** 医疗包能用几次。 */
const KIT_USES = 10;

/** 投出去、要目标敏捷豁免的东西（DC 8 + 敏捷调整值 + 熟练加值）：没躲开的后果。 */
const THROWN_ITEMS: Record<string, { dice?: string; type?: DamageType; onlyType?: RegExp; condition?: Condition5e; note?: string }> = {
  'alchemists-fire': { dice: '1d4', type: 'fire', note: '身上着了火（每回合开始受 1d4 火焰伤害，用一个动作扑灭）' },
  acid: { dice: '2d6', type: 'acid' },
  'holy-water': { dice: '2d8', type: 'radiant', onlyType: /不死|邪魔|undead|fiend/i },
  net: { condition: 'restrained' },
  oil: { note: '被油浸透了：1 分钟内受到火焰伤害时，额外受到 5 点火焰伤害（你用 damage 加上）' },
};

function hasPactBlade(s: State5e): boolean {
  return (s.data.invocations ?? []).some((i) => i.key === 'pact-of-the-blade');
}

/** 骰子加上几次「每环多的骰子」：8d6 加 1d6 两次是 10d6；面数不一样就写成两段。 */
export function addDice(base: string, per: string, times: number): string {
  const a = parseDice(base);
  const b = parseDice(per);
  if (!a || !b || times <= 0) return base;
  if (b.count === 0) return formatDice({ ...a, bonus: a.bonus + b.bonus * times });
  if (a.sides === b.sides || a.count === 0) return formatDice({ count: a.count + b.count * times, sides: b.sides, bonus: a.bonus + b.bonus * times });
  return `${base}+${b.count * times}d${b.sides}`;
}

export { OUTCOME_LABEL };
export type { Scenario };
