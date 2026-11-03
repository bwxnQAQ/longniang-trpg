import type { Condition, RollCard } from '../../shared/game';
import { petHelpBonus } from '../../shared/pets';
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_NAME,
  MODIFIER_MAX,
  MODIFIER_MIN,
  OUTCOME_LABEL,
  OUTCOME_MEANING,
  outcomeFor,
  STRESS_LABEL,
  WOUND_LABEL,
  type AttributeKey,
} from '../../shared/rules';
import type { Attribute2 } from '../../shared/rules2';
import type { ToolDefinition } from '../ai/types';
import { actionBlocker, applyHarm, check, penaltiesFor, resolveCheck, roll2d6, type CheckResult, type Penalty, type Rng } from './rules';
import type { Scenario } from './scenario';
import { stateOf, type Character, type World } from './world';

// 主持AI能调用的工具，以及程序怎么执行它们。
// 执行时只改这里的副本，AI 全部结算成功后才一次性写进数据库；中途出错就整个作废、稍后重来。

const characterParam = { type: 'integer', description: '角色编号（角色列表里的“编号”）' };
const attributeParam = {
  type: 'string',
  enum: ATTRIBUTE_KEYS,
  description: '用哪个属性：body 体魄、agility 敏捷、intellect 智识、perception 感知、charm 魅力',
};

export const DM_TOOLS: ToolDefinition[] = [
  {
    name: 'roll_check',
    description:
      '让程序为一个角色掷一次检定：2d6 + 属性 + 专长 + 情境修正 + 协助，伤势和状态的减值自动算。返回点数和结果档位。结果不确定时必须用它，不能自己编结果。',
    input_schema: {
      type: 'object',
      properties: {
        character: characterParam,
        attribute: attributeParam,
        specialty: { type: 'string', description: '行动正好用上的专长名字，必须是这个角色已有的专长；用不上就不填' },
        modifier: { type: 'integer', description: '情境修正，-2 到 +2 的整数；难度普通就是 0' },
        assisted: { type: 'boolean', description: '是否有别的角色在场协助（+1）' },
        hidden: { type: 'boolean', description: '暗骰：角色自己察觉不到的检定，玩家看不到点数' },
        reason: { type: 'string', description: '这次检定判断什么，一句话，比如“能不能看出伤口的来历”' },
      },
      required: ['character', 'attribute', 'modifier', 'reason'],
    },
  },
  {
    name: 'roll_opposed',
    description:
      '对抗检定：角色和 NPC（或另一个玩家角色）正面较量，双方各掷 2d6 加各自的加值，高的赢，平局维持原状。对手是 NPC 时填 opponent_npc、opponent_bonus 和 opponent_label；对手是玩家角色时填 opponent_character 和 opponent_attribute。',
    input_schema: {
      type: 'object',
      properties: {
        character: characterParam,
        attribute: attributeParam,
        specialty: { type: 'string', description: '行动正好用上的专长名字；用不上就不填' },
        modifier: { type: 'integer', description: '情境修正，-2 到 +2' },
        reason: { type: 'string', description: '较量的是什么，一句话' },
        opponent_npc: { type: 'string', description: '对手 NPC 的 key' },
        opponent_bonus: { type: 'integer', description: '对手 NPC 在这方面的总加值，-1 到 +3' },
        opponent_label: {
          type: 'string',
          description: '骰子卡片上怎么称呼这个 NPC，玩家会看到。只写角色们已经知道的叫法（比如他自称的化名、“穿雨衣的人”），绝不能写出他还没暴露的真实身份',
        },
        opponent_character: { type: 'integer', description: '对手是玩家角色时，他的角色编号' },
        opponent_attribute: { ...attributeParam, description: '对手是玩家角色时，他用哪个属性' },
      },
      required: ['character', 'attribute', 'modifier', 'reason'],
    },
  },
  {
    name: 'give_clue',
    description: '把剧本里的一条线索交给角色。玩家会看到线索卡片（剧本原文）。线索只能通过这个工具交出。',
    input_schema: {
      type: 'object',
      properties: {
        clue: { type: 'string', description: '线索的 key' },
        characters: {
          type: 'array',
          items: { type: 'integer' },
          description: '拿到线索的角色编号，通常就是行动的角色；在场的人一起看到时可以填多个',
        },
      },
      required: ['clue', 'characters'],
    },
  },
  {
    name: 'move_character',
    description: '角色到了另一个地点。路上经过的地方不用一一移动，只移动到最后停下的地点。',
    input_schema: {
      type: 'object',
      properties: {
        character: characterParam,
        location: { type: 'string', description: '目的地的 key' },
      },
      required: ['character', 'location'],
    },
  },
  {
    name: 'update_character',
    description: '修改角色的伤势、心智、状态标签和物品。',
    input_schema: {
      type: 'object',
      properties: {
        character: characterParam,
        wounds: { type: 'integer', description: '伤势变化：+1 往坏走一格（没受伤→轻伤→重伤→濒死→死亡），-1 恢复一格，0 或不填就是不变' },
        stress: { type: 'integer', description: '心智变化（剧本开启心智时才有用）：+1 往坏走一格，-1 恢复一格' },
        add_conditions: {
          type: 'array',
          description: '加上的状态标签，比如中毒、疲惫、被跟踪',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '状态名，几个字' },
              effect: { type: 'string', description: '有什么影响，一句话' },
              penalty: { type: 'integer', description: '对所有检定的减值，0、-1 或 -2' },
            },
            required: ['name', 'effect', 'penalty'],
          },
        },
        remove_conditions: { type: 'array', items: { type: 'string' }, description: '去掉的状态名' },
        add_items: { type: 'array', items: { type: 'string' }, description: '得到的物品：每样一个短名字（最多 20 个字），来历写进叙述' },
        remove_items: { type: 'array', items: { type: 'string' }, description: '失去或用掉的物品' },
        reason: { type: 'string', description: '为什么变化，一句话' },
      },
      required: ['character', 'reason'],
    },
  },
  {
    name: 'update_npc',
    description: '记下 NPC 的变化：位置、态度、受了伤、被制住、死亡，或者其他需要记住的事（他答应了什么、对谁起了疑心）。',
    input_schema: {
      type: 'object',
      properties: {
        npc: { type: 'string', description: 'NPC 的 key' },
        location: { type: 'string', description: '现在所在地点的 key；离开了所有地点就填 none' },
        attitude: { type: 'string', description: '对玩家的态度变成了什么样，一句话' },
        dead: { type: 'boolean', description: '是否死了' },
        note: { type: 'string', description: '需要记住的事，一句话' },
      },
      required: ['npc'],
    },
  },
  {
    name: 'trigger_event',
    description: '处理一条到期的时间线事件：记下它发生了，或者因为玩家的作为没有发生。',
    input_schema: {
      type: 'object',
      properties: {
        event: { type: 'string', description: '时间线事件的 key' },
        happened: { type: 'boolean', description: '是否发生了' },
        note: { type: 'string', description: '实际怎么样，一句话' },
      },
      required: ['event', 'happened', 'note'],
    },
  },
  {
    name: 'private_message',
    description: '只发给某一个角色看的内容，比如暗骰察觉到的细节、只有他听见的耳语。不要把这些写进叙述正文。',
    input_schema: {
      type: 'object',
      properties: {
        character: characterParam,
        text: { type: 'string', description: '要单独告诉他的内容。和叙述一样用第三人称、写他的全名，不用“你”' },
      },
      required: ['character', 'text'],
    },
  },
  {
    name: 'end_game',
    description: '剧本的某个结局条件达成了，结束这一局。所有玩家都会看到结局和真相。',
    input_schema: {
      type: 'object',
      properties: {
        ending: { type: 'string', description: '结局的 key' },
        epilogue: { type: 'string', description: '给所有玩家看的结局收尾，100～300字，写各个角色和这个世界后来怎么样了' },
      },
      required: ['ending', 'epilogue'],
    },
  },
];

// ---------- 执行工具 ----------

export type StagedRoll = {
  characterId: number;
  /** 第一版、第二版是属性；5E（V0.9.0）是技能、属性（str……）或者 attack、death 这类。 */
  attribute: AttributeKey | Attribute2 | string;
  modifier: number;
  result: CheckResult;
  hidden: boolean;
  detail: Record<string, unknown>;
  /** 宠物出手重掷的那一次（V0.6.0）；petSaved：重掷以后成了（对抗时是赢了）。 */
  petHelp?: boolean;
  petSaved?: boolean;
};

/** 这次结算里能出手的宠物（V0.6.0）：交行动时勾了「让宠物帮一把」、这一局还没帮过。attributes 是宠物的属性。 */
export type PetHelper = { characterId: number; pet: string; attributes: Record<AttributeKey, number> };

export type ToolResult = { content: string; isError: boolean };

export type Input = Record<string, unknown>;

export type ResolutionInput = {
  scenario: Scenario;
  world: World;
  characters: Character[];
  /** 已经被发现的线索：key → 知道的角色编号。 */
  clueHolders: Map<string, Set<number>>;
  actorId: number;
  /** 这个行动结束的游戏时间。 */
  gameEnd: number;
  rng: Rng;
  /** 角色会不会死（房主选的，V0.6.0；不写就是会）。 */
  allowDeath?: boolean;
  /** 能出手的宠物（V0.6.0）。 */
  petHelp?: PetHelper | null;
  /** 每个角色的主人用的骰子皮肤：角色编号 → 皮肤（V0.6.0）。 */
  skins?: Map<number, string | null>;
};

export class ResolutionContext {
  readonly scenario: Scenario;
  readonly world: World;
  readonly characters = new Map<number, Character>();
  readonly actorId: number;
  readonly gameEnd: number;
  protected readonly rng: Rng;
  protected readonly clueHolders: Map<string, Set<number>>;
  protected readonly startLocations = new Map<number, string | null>();
  protected readonly allowDeath: boolean;
  protected readonly skins: Map<number, string | null>;
  /** 宠物出手：还没用（这次结算里只出手一次）。 */
  protected petHelper: PetHelper | null;

  readonly rolls: StagedRoll[] = [];
  readonly cards: RollCard[] = [];
  /** 新交出的线索：key → 新知道它的角色。 */
  readonly clueGrants = new Map<string, Set<number>>();
  readonly privateMessages: { characterId: number; text: string }[] = [];
  readonly changes: { characterId: number; text: string }[] = [];
  readonly changed = new Set<number>();
  ending: { key: string; title: string; epilogue: string } | null = null;
  worldChanged = false;
  /** 工具调用的记录，存进行动的结算结果里，方便以后排查。 */
  readonly trace: { tool: string; input: unknown; result: string; error: boolean }[] = [];
  /** 结算过程里值得记一笔的事（V0.9.1：工具调用到了上限、最后单独让主持 AI 写的叙述），存进结算结果里。 */
  readonly dmNotes: string[] = [];

  constructor(input: ResolutionInput) {
    this.scenario = input.scenario;
    this.world = structuredClone(input.world);
    for (const c of input.characters) {
      this.characters.set(c.id, structuredClone(c));
      this.startLocations.set(c.id, c.location);
    }
    this.actorId = input.actorId;
    this.gameEnd = input.gameEnd;
    this.rng = input.rng;
    this.clueHolders = new Map([...input.clueHolders].map(([k, v]) => [k, new Set(v)]));
    this.allowDeath = input.allowDeath ?? true;
    this.skins = input.skins ?? new Map();
    this.petHelper = input.petHelp ?? null;
  }

  /** 宠物出手：这个角色的宠物还能帮忙的话，用掉这次机会，返回宠物和加值。 */
  protected takePetHelp(characterId: number, attribute: AttributeKey): { pet: string; bonus: number } | null {
    const h = this.petHelper;
    if (!h || h.characterId !== characterId) return null;
    this.petHelper = null;
    return { pet: h.pet, bonus: petHelpBonus(h.attributes[attribute] ?? 0) };
  }

  /** 宠物帮着重掷一次：同样的加减值，再加上宠物的加值（放在减值前面：卡片上的减值要排在最后）。 */
  private reroll(input: ReturnType<ResolutionContext['checkInput']>, help: { pet: string; bonus: number }): CheckResult {
    const r = check(input, this.rng);
    if (!help.bonus) return r;
    const total = r.total + help.bonus;
    const cut = r.parts.length - input.penalties.length;
    const parts = [...r.parts.slice(0, cut), { label: `${help.pet}帮忙`, value: help.bonus }, ...r.parts.slice(cut)];
    return { ...r, total, outcome: outcomeFor(r.dice[0], r.dice[1], total), parts };
  }

  execute(name: string, rawInput: unknown): ToolResult {
    const input = (rawInput && typeof rawInput === 'object' ? rawInput : {}) as Input;
    let result: ToolResult;
    try {
      result = this.run(name, input);
    } catch (err) {
      result = { content: err instanceof ToolError ? err.message : `执行出错：${String(err)}`, isError: true };
      if (!(err instanceof ToolError)) console.error(`工具 ${name} 出错：`, err);
    }
    this.trace.push({ tool: name, input: rawInput, result: result.content, error: result.isError });
    return result;
  }

  /**
   * 叙述要发给谁：行动的角色，加上他行动结束时所在地点的活着的角色（包括这次结算开始时在那里的）。
   * 这次走到了别处的：原来那个地点没跟着走的人看不到叙述（到了那边发现的东西他们不该知道），只收到「他走了」的提示（leftBehind）。
   */
  audience(): number[] {
    const actor = this.characters.get(this.actorId);
    const where = actor?.location ?? this.startLocations.get(this.actorId) ?? null;
    const ids = new Set([this.actorId]);
    if (!where) return [...ids];
    for (const c of this.characters.values()) {
      if (c.dead || c.id === this.actorId) continue;
      if (c.location === where || this.startLocations.get(c.id) === where) ids.add(c.id);
    }
    return [...ids];
  }

  /**
   * 行动的人这次走到了别处：原来那个地点、没跟着走的活着的角色。只告诉他们他往哪去了。
   * 留在原地的人只看得见他从哪个出口走的（V0.7.1 审查）：去的地方就是这里的出口，to 是它的名字；隔着几个地方的，
   * to 是路上的第一站、far=true（「往「后厨」那边去了」）；从这里的出口走不到的（暗道这类），to 是 null，只说他走了。
   */
  leftBehind(): { ids: number[]; from: string; to: string | null; far: boolean } | null {
    const actor = this.characters.get(this.actorId);
    const from = this.startLocations.get(this.actorId) ?? null;
    const to = actor?.location ?? null;
    if (!actor || !from || !to || from === to) return null;
    const shown = new Set(this.audience());
    const ids = [...this.characters.values()].filter((c) => !c.dead && !shown.has(c.id) && c.location === from).map((c) => c.id);
    if (!ids.length) return null;
    const place = (key: string) => this.scenario.locations.find((l) => l.key === key);
    // 按出口找最近的路，记下第一站
    const firstStep = new Map<string, string>();
    const queue: string[] = [];
    for (const e of place(from)?.exits ?? []) {
      if (!firstStep.has(e.to)) {
        firstStep.set(e.to, e.to);
        queue.push(e.to);
      }
    }
    while (queue.length && !firstStep.has(to)) {
      const k = queue.shift()!;
      for (const e of place(k)?.exits ?? []) {
        if (e.to !== from && !firstStep.has(e.to)) {
          firstStep.set(e.to, firstStep.get(k)!);
          queue.push(e.to);
        }
      }
    }
    const step = firstStep.get(to) ?? null;
    return { ids, from: place(from)?.name ?? from, to: step ? (place(step)?.name ?? step) : null, far: step !== null && step !== to };
  }

  protected run(name: string, input: Input): ToolResult {
    switch (name) {
      case 'roll_check':
        return this.rollCheck(input);
      case 'roll_opposed':
        return this.rollOpposed(input);
      case 'give_clue':
        return this.giveClue(input);
      case 'move_character':
        return this.moveCharacter(input);
      case 'update_character':
        return this.updateCharacter(input);
      case 'update_npc':
        return this.updateNpc(input);
      case 'trigger_event':
        return this.triggerEvent(input);
      case 'private_message':
        return this.privateMessage(input);
      case 'end_game':
        return this.endGame(input);
      default:
        throw new ToolError(`没有这个工具：${name}`);
    }
  }

  // ----- 检定 -----

  private checkInput(c: Character, input: Input, notes: string[]) {
    const attribute = input.attribute as AttributeKey;
    if (!ATTRIBUTE_KEYS.includes(attribute)) throw new ToolError(`没有这个属性：${String(input.attribute)}，只能是 ${ATTRIBUTE_KEYS.join('、')}`);
    let modifier = Number.isInteger(input.modifier) ? (input.modifier as number) : 0;
    if (modifier < MODIFIER_MIN || modifier > MODIFIER_MAX) {
      modifier = Math.max(MODIFIER_MIN, Math.min(MODIFIER_MAX, modifier));
      notes.push(`情境修正超出范围，按 ${modifier > 0 ? '+' : ''}${modifier} 算`);
    }
    let specialty: string | null = null;
    if (typeof input.specialty === 'string' && input.specialty.trim()) {
      const wanted = input.specialty.trim();
      specialty = c.specialties.find((s) => s === wanted) ?? null;
      if (!specialty) notes.push(`${c.name}没有专长「${wanted}」，没有加专长`);
    }
    // 装备（V0.6.0）：自带角色带进来的、还在身上的才算
    let gear: string | null = null;
    if (typeof input.gear === 'string' && input.gear.trim()) {
      const wanted = input.gear.trim().replace(/^[「『]|[」』]$/g, '');
      const found = c.gear.find((g) => g.name === wanted);
      if (!found) notes.push(`${c.name}没有装备「${wanted}」，没有加装备`);
      else if (!c.items.includes(found.name)) notes.push(`${c.name}的「${found.name}」已经不在身上了，没有加装备`);
      else gear = found.name;
    }
    return {
      attribute,
      ...this.attributeOf(c, attribute),
      specialty,
      gear,
      modifier,
      assisted: input.assisted === true,
      penalties: penaltiesFor(stateOf(c), this.scenario.stress),
    };
  }

  /**
   * 检定用的属性值：自带角色的属性可以带小数（V0.6.0，比如 1.4），按比例随机进位（四成机会按 2 算），
   * 卡片上写成「敏捷（1.4）」。整数的照旧。
   */
  private attributeOf(c: Character, attribute: AttributeKey): { attributeValue: number; attributeLabel?: string } {
    const raw = c.attributes[attribute];
    if (Number.isInteger(raw)) return { attributeValue: raw };
    const base = Math.floor(raw);
    const tenths = Math.round((raw - base) * 10);
    const up = tenths > 0 && this.rng(10) <= tenths;
    return { attributeValue: base + (up ? 1 : 0), attributeLabel: `${ATTRIBUTE_NAME[attribute]}（${raw.toFixed(1)}）` };
  }

  private rollCheck(input: Input): ToolResult {
    const c = this.character(input.character);
    if (c.dead) throw new ToolError(`${c.name}已经死了`);
    const notes: string[] = [];
    const checkInput = this.checkInput(c, input, notes);
    const first = check(checkInput, this.rng);
    const hidden = input.hidden === true;
    const reason = text(input.reason, 60) || '检定';
    // 宠物出手（V0.6.0）：没成（失败、大失败）时宠物帮着重掷一次；暗骰不算
    const help = !hidden && isFailure(first.outcome) ? this.takePetHelp(c.id, checkInput.attribute) : null;
    const result = help ? this.reroll(checkInput, help) : first;
    const firstView = { dice: first.dice, total: first.total, outcome: first.outcome };
    this.rolls.push({
      characterId: c.id,
      attribute: checkInput.attribute,
      modifier: checkInput.modifier,
      result,
      hidden,
      detail: { reason, parts: result.parts, ...(help ? { petHelp: { pet: help.pet, first: firstView } } : {}) },
      petHelp: !!help,
      petSaved: !!help && !isFailure(result.outcome),
    });
    if (!hidden) {
      this.cards.push({
        who: c.name,
        reason,
        attribute: ATTRIBUTE_NAME[checkInput.attribute],
        dice: result.dice,
        parts: publicParts(result, checkInput.penalties),
        total: result.total,
        outcome: result.outcome,
        skin: this.skins.get(c.id) ?? null,
        ...(help ? { petHelp: { pet: help.pet, first: firstView } } : {}),
      });
    }
    return ok({
      character: c.name,
      dice: result.dice,
      total: result.total,
      breakdown: describeParts(result),
      outcome: result.outcome,
      outcome_label: OUTCOME_LABEL[result.outcome],
      meaning: OUTCOME_MEANING[result.outcome],
      hidden,
      ...(help ? { pet_help: petHelpNote(help.pet, `第一次${OUTCOME_LABEL[first.outcome]}（${first.total}），重掷以后${OUTCOME_LABEL[result.outcome]}（${result.total}）`) } : {}),
      notes,
    });
  }

  private rollOpposed(input: Input): ToolResult {
    const c = this.character(input.character);
    if (c.dead) throw new ToolError(`${c.name}已经死了`);
    const notes: string[] = [];
    const mine = this.checkInput(c, input, notes);
    const reason = text(input.reason, 60) || '对抗';

    // otherName 只回给主持AI；卡片上给玩家看的是 shownName（NPC 的真名可能是秘密）
    let otherName: string;
    let shownName: string;
    let other: CheckResult;
    let otherParts: CheckResult['parts'];
    let otherCharacter: Character | null = null;
    if (input.opponent_character !== undefined && input.opponent_character !== null) {
      otherCharacter = this.character(input.opponent_character);
      if (otherCharacter.id === c.id) throw new ToolError('不能和自己对抗');
      if (otherCharacter.dead) throw new ToolError(`${otherCharacter.name}已经死了`);
      const attr = input.opponent_attribute as AttributeKey;
      if (!ATTRIBUTE_KEYS.includes(attr)) throw new ToolError('对手是玩家角色时，要填 opponent_attribute');
      otherName = otherCharacter.name;
      shownName = otherCharacter.name;
      const penalties = penaltiesFor(stateOf(otherCharacter), this.scenario.stress);
      other = resolveCheck(roll2d6(this.rng), {
        attribute: attr,
        ...this.attributeOf(otherCharacter, attr),
        specialty: null,
        modifier: 0,
        assisted: false,
        penalties,
      });
      otherParts = publicParts(other, penalties);
    } else {
      const npc = this.scenario.npcs.find((n) => n.key === input.opponent_npc);
      if (!npc) throw new ToolError(`没有这个 NPC：${String(input.opponent_npc)}。对手是 NPC 时填 opponent_npc（NPC 的 key）和 opponent_bonus`);
      let bonus = Number.isInteger(input.opponent_bonus) ? (input.opponent_bonus as number) : 0;
      if (bonus < -1 || bonus > 3) {
        bonus = Math.max(-1, Math.min(3, bonus));
        notes.push(`对手加值超出范围，按 ${bonus} 算`);
      }
      otherName = npc.name;
      shownName = text(input.opponent_label, 12) || '对手';
      const dice = roll2d6(this.rng);
      const parts = [{ label: '骰子', value: dice[0] + dice[1] }, ...(bonus ? [{ label: '本事', value: bonus }] : [])];
      const total = parts.reduce((s, p) => s + p.value, 0);
      other = { dice, total, outcome: outcomeFor(dice[0], dice[1], total), parts };
      otherParts = parts;
    }

    const winnerOf = (r: CheckResult): 'a' | 'b' | 'tie' => (r.total > other.total ? 'a' : other.total > r.total ? 'b' : 'tie');
    const first = check(mine, this.rng);
    const firstWinner = winnerOf(first);
    // 宠物出手（V0.6.0）：输了的话宠物帮着重掷自己这一边
    const help = firstWinner === 'b' ? this.takePetHelp(c.id, mine.attribute) : null;
    const result = help ? this.reroll(mine, help) : first;
    const winner = winnerOf(result);
    const firstView = { dice: first.dice, total: first.total, outcome: first.outcome, winner: firstWinner };
    this.rolls.push({
      characterId: c.id,
      attribute: mine.attribute,
      modifier: mine.modifier,
      result,
      hidden: false,
      detail: {
        reason,
        opposed: { name: otherName, dice: other.dice, total: other.total, characterId: otherCharacter?.id ?? null },
        winner,
        ...(help ? { petHelp: { pet: help.pet, first: firstView } } : {}),
      },
      petHelp: !!help,
      petSaved: !!help && winner === 'a',
    });
    this.cards.push({
      who: c.name,
      reason,
      attribute: ATTRIBUTE_NAME[mine.attribute],
      dice: result.dice,
      parts: publicParts(result, mine.penalties),
      total: result.total,
      outcome: result.outcome,
      skin: this.skins.get(c.id) ?? null,
      versus: {
        who: shownName,
        dice: other.dice,
        parts: otherParts,
        total: other.total,
        outcome: other.outcome,
        skin: otherCharacter ? (this.skins.get(otherCharacter.id) ?? null) : null,
      },
      winner,
      ...(help ? { petHelp: { pet: help.pet, first: firstView } } : {}),
    });
    const name = (w: 'a' | 'b' | 'tie') => (w === 'a' ? c.name : w === 'b' ? otherName : '平局');
    return ok({
      character: c.name,
      total: result.total,
      breakdown: describeParts(result),
      opponent: otherName,
      opponent_total: other.total,
      opponent_breakdown: describeParts(other),
      winner: winner === 'a' ? c.name : winner === 'b' ? otherName : '平局，维持原状',
      ...(help ? { pet_help: petHelpNote(help.pet, `第一次${first.total}，${name(firstWinner)}赢；重掷以后${result.total}，${name(winner)}${winner === 'tie' ? '' : '赢'}`) } : {}),
      notes,
    });
  }

  // ----- 线索、移动、角色状态 -----

  private giveClue(input: Input): ToolResult {
    const clue = this.scenario.clues.find((c) => c.key === input.clue);
    if (!clue) throw new ToolError(`没有这条线索：${String(input.clue)}`);
    const ids = Array.isArray(input.characters) && input.characters.length ? input.characters : [this.actorId];
    // 先把所有人都检查一遍，有一个不对就整个不交，免得“报了错却交出去了一半”
    const targets = ids.map((raw) => this.character(raw));
    const deadOne = targets.find((c) => c.dead);
    if (deadOne) throw new ToolError(`${deadOne.name}已经死了，不能拿线索`);
    const given: string[] = [];
    const already: string[] = [];
    for (const c of targets) {
      const holders = this.clueHolders.get(clue.key) ?? new Set<number>();
      if (holders.has(c.id)) {
        already.push(c.name);
        continue;
      }
      holders.add(c.id);
      this.clueHolders.set(clue.key, holders);
      const grant = this.clueGrants.get(clue.key) ?? new Set<number>();
      grant.add(c.id);
      this.clueGrants.set(clue.key, grant);
      given.push(c.name);
    }
    return ok({
      clue: clue.title,
      given_to: given,
      already_had: already,
      note: given.length ? '玩家会看到线索卡片，叙述里写怎么发现的就行，不用抄原文' : '他们已经有这条线索了',
    });
  }

  private moveCharacter(input: Input): ToolResult {
    const c = this.character(input.character);
    if (c.dead) throw new ToolError(`${c.name}已经死了`);
    const loc = this.scenario.locations.find((l) => l.key === input.location);
    if (!loc) throw new ToolError(`没有这个地点：${String(input.location)}，可用的有：${this.scenario.locations.map((l) => l.key).join('、')}`);
    if (c.location === loc.key) return ok({ character: c.name, location: loc.name, note: '本来就在这里' });
    c.location = loc.key;
    if (!c.visited.includes(loc.key)) c.visited.push(loc.key);
    this.changed.add(c.id);
    this.changes.push({ characterId: c.id, text: `来到：${loc.name}` });
    const here = [...this.characters.values()].filter((x) => x.id !== c.id && !x.dead && x.location === loc.key).map((x) => x.name);
    return ok({ character: c.name, location: loc.name, other_characters_here: here });
  }

  private updateCharacter(input: Input): ToolResult {
    const c = this.character(input.character);
    if (c.dead) throw new ToolError(`${c.name}已经死了`);
    const report: string[] = [];

    const wounds = Number.isInteger(input.wounds) ? Math.max(-3, Math.min(3, input.wounds as number)) : 0;
    if (wounds) {
      const before = c.wounds;
      const { state, died } = applyHarm(stateOf(c), 'wounds', wounds, this.allowDeath);
      c.wounds = state.wounds;
      c.dead = state.dead;
      if (died) {
        this.changes.push({ characterId: c.id, text: '死亡' });
        report.push(`${c.name}死了`);
      } else if (before !== c.wounds) {
        this.changes.push({ characterId: c.id, text: `伤势：${WOUND_LABEL[before]} → ${WOUND_LABEL[c.wounds]}` });
        report.push(`伤势 ${WOUND_LABEL[before]} → ${WOUND_LABEL[c.wounds]}`);
      }
      if (!this.allowDeath && wounds > 0 && before + wounds > WOUND_LABEL.length - 1) {
        report.push(`这一局房主设了角色不会死：${c.name}停在濒死，不会死`);
      }
    }

    const stress = Number.isInteger(input.stress) ? Math.max(-3, Math.min(3, input.stress as number)) : 0;
    if (stress && !c.dead) {
      if (!this.scenario.stress) {
        report.push('这个剧本没有开启心智规则，心智变化没有记录');
      } else {
        const before = c.stress;
        const { state } = applyHarm(stateOf(c), 'stress', stress);
        c.stress = state.stress;
        if (before !== c.stress) {
          this.changes.push({ characterId: c.id, text: `心智：${STRESS_LABEL[before]} → ${STRESS_LABEL[c.stress]}` });
          report.push(`心智 ${STRESS_LABEL[before]} → ${STRESS_LABEL[c.stress]}`);
        }
      }
    }

    for (const raw of Array.isArray(input.add_conditions) ? input.add_conditions : []) {
      const o = (raw && typeof raw === 'object' ? raw : {}) as Input;
      const name = text(o.name, 10);
      if (!name) continue;
      const penalty = Number.isInteger(o.penalty) ? Math.max(-2, Math.min(0, o.penalty as number)) : 0;
      const condition: Condition = { name, effect: text(o.effect, 60), penalty };
      c.conditions = [...c.conditions.filter((x) => x.name !== name), condition];
      this.changes.push({ characterId: c.id, text: `状态：${name}${condition.effect ? `（${condition.effect}）` : ''}` });
      report.push(`加上状态「${name}」`);
    }
    for (const raw of Array.isArray(input.remove_conditions) ? input.remove_conditions : []) {
      const name = text(raw, 10);
      if (!c.conditions.some((x) => x.name === name)) continue;
      c.conditions = c.conditions.filter((x) => x.name !== name);
      this.changes.push({ characterId: c.id, text: `不再：${name}` });
      report.push(`去掉状态「${name}」`);
    }
    for (const raw of Array.isArray(input.add_items) ? input.add_items : []) {
      const item = text(raw, 20);
      if (!item || c.items.length >= 30) continue;
      if (typeof raw === 'string' && [...raw.trim()].length > 20) report.push(`「${raw.trim()}」太长，只记下了前 20 个字「${item}」：物品名写短一点，来历写进叙述`);
      c.items = [...c.items, item];
      this.changes.push({ characterId: c.id, text: `得到：${item}` });
      report.push(`得到「${item}」`);
    }
    for (const raw of Array.isArray(input.remove_items) ? input.remove_items : []) {
      const item = text(raw, 20);
      const index = c.items.indexOf(item);
      if (index < 0) {
        report.push(`${c.name}身上没有「${item}」`);
        continue;
      }
      c.items = c.items.filter((_, i) => i !== index);
      this.changes.push({ characterId: c.id, text: `失去：${item}` });
      report.push(`失去「${item}」`);
    }

    this.changed.add(c.id);
    const blocker = actionBlocker(stateOf(c), this.scenario.stress);
    return ok({
      character: c.name,
      changes: report.length ? report : ['没有变化'],
      now: {
        wounds: WOUND_LABEL[c.wounds],
        ...(this.scenario.stress ? { stress: STRESS_LABEL[c.stress] } : {}),
        conditions: c.conditions.map((x) => x.name),
        items: c.items,
        dead: c.dead,
      },
      ...(blocker ? { cannot_act: blocker } : {}),
    });
  }

  // ----- NPC、事件、私密信息、结局 -----

  private updateNpc(input: Input): ToolResult {
    const npc = this.scenario.npcs.find((n) => n.key === input.npc);
    if (!npc) throw new ToolError(`没有这个 NPC：${String(input.npc)}`);
    const state = { ...(this.world.npcs[npc.key] ?? {}) };
    if (typeof input.location === 'string' && input.location) {
      if (input.location === 'none') state.location = null;
      else if (this.scenario.locations.some((l) => l.key === input.location)) state.location = input.location;
      else throw new ToolError(`没有这个地点：${input.location}`);
    }
    if (typeof input.attitude === 'string' && input.attitude.trim()) state.attitude = text(input.attitude, 100);
    if (typeof input.dead === 'boolean') state.dead = input.dead;
    if (typeof input.note === 'string' && input.note.trim()) state.notes = [...(state.notes ?? []), text(input.note, 150)].slice(-6);
    this.world.npcs[npc.key] = state;
    this.worldChanged = true;
    return ok({ npc: npc.name, now: state });
  }

  private triggerEvent(input: Input): ToolResult {
    const event = this.scenario.timeline.find((e) => e.key === input.event);
    if (!event) throw new ToolError(`没有这个时间线事件：${String(input.event)}`);
    const happened = input.happened !== false;
    this.world.events[event.key] = { happened, note: text(input.note, 150), at: Math.floor(this.gameEnd) };
    this.worldChanged = true;
    return ok({ event: event.key, happened });
  }

  private privateMessage(input: Input): ToolResult {
    const c = this.character(input.character);
    const message = text(input.text, 800);
    if (!message) throw new ToolError('text 不能为空');
    this.privateMessages.push({ characterId: c.id, text: message });
    return ok({ sent_to: c.name });
  }

  private endGame(input: Input): ToolResult {
    const ending = this.scenario.endings.find((e) => e.key === input.ending);
    if (!ending) throw new ToolError(`没有这个结局：${String(input.ending)}，可用的有：${this.scenario.endings.map((e) => e.key).join('、')}`);
    const epilogue = text(input.epilogue, 1200);
    if (!epilogue) throw new ToolError('epilogue 不能为空');
    this.ending = { key: ending.key, title: ending.title, epilogue };
    this.world.ending = { key: ending.key, title: ending.title, epilogue, at: Math.floor(this.gameEnd) };
    this.worldChanged = true;
    return ok({ ending: ending.title, note: '这一局会在这次叙述之后结束，记得在叙述里写好收尾' });
  }

  protected character(raw: unknown): Character {
    const id = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw;
    const c = typeof id === 'number' ? this.characters.get(id) : undefined;
    if (!c) {
      const list = [...this.characters.values()].map((x) => `${x.id}=${x.name}`).join('、');
      throw new ToolError(`没有编号为 ${String(raw)} 的角色。角色编号：${list}`);
    }
    return c;
  }
}

export class ToolError extends Error {}

export function ok(data: unknown): ToolResult {
  return { content: JSON.stringify(data), isError: false };
}

export function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  const chars = [...value.trim()];
  return chars.length > max ? chars.slice(0, max).join('') : chars.join('');
}

/** 卡片上给在场的人看的加减值：具体的状态和心智不写出来，只写“状态”“心智”。 */
/** 没成：失败、大失败。 */
export function isFailure(outcome: CheckResult['outcome']): boolean {
  return outcome === 'failure' || outcome === 'fumble';
}

/** 告诉主持 AI 宠物出手了（叙述里要写上，结果以重掷的为准）。 */
export function petHelpNote(pet: string, what: string): string {
  return `${pet}（这个角色带着的宠物）扑上去帮了一把，重掷了一次：${what}。叙述里写上${pet}怎么帮的忙，结果以重掷的为准`;
}

export function publicParts(result: CheckResult, penalties: Penalty[]): CheckResult['parts'] {
  const base = result.parts.slice(0, result.parts.length - penalties.length);
  return [
    ...base,
    ...penalties.map((p) => ({ label: p.kind === 'condition' ? '状态' : p.kind === 'stress' ? '心智' : p.reason, value: p.value })),
  ];
}

export function describeParts(result: CheckResult): string {
  return `${result.parts.map((p, i) => (i === 0 ? `${p.label}${p.value}` : `${p.label}${p.value >= 0 ? '+' : ''}${p.value}`)).join(' ')} = ${result.total}`;
}
