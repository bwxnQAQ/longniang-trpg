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
import { anyExit, bothWays, hurried, hurriedPlaces, openExits, pathKey, routeBetween, routesFrom, travelText, walkRoute } from '../../shared/map';
import type { ToolDefinition } from '../ai/types';
import { actionBlocker, applyHarm, check, penaltiesFor, resolveCheck, roll2d6, type CheckResult, type Penalty, type Rng } from './rules';
import type { Scenario } from './scenario';
import { exitsFoundBy, exitsKnownTo, stateOf, type Character, type World } from './world';
import { cleanSpot, flagText, matchSpot, sameSpot, spotFlags, spotName } from '../../shared/spots';

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
    description:
      '角色到了另一个地点。程序按地图（地点的出口和路上的分钟）找最快的路线，路上经过的地方不用一一移动，只移动到目的地。这一次行动的时间不够走到的，只走到半路：结果里写着停在哪、还差多久，叙述照结果写。地图上没有路的（剧本没写出口：被人带走、坐船、翻墙抄近路）在 via 里写清楚怎么去的。',
    input_schema: {
      type: 'object',
      properties: {
        character: characterParam,
        location: { type: 'string', description: '目的地的 key' },
        hurry: { type: 'boolean', description: '赶路（跑、骑马、坐车）：路上的时间按一半算' },
        via: { type: 'string', description: '地图上没有路时，是怎么去的（一句话）；地图上有路就不填' },
      },
      required: ['character', 'location'],
    },
  },
  {
    name: 'reveal_exit',
    description: '角色发现了一条暗门、暗道（剧本里 hidden 的出口）：从这以后它画在这些角色的地图上，也走得通。角色直接从暗道走过去时，程序会自动记下，不用再调用。',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: '暗道一头的地点 key' },
        to: { type: 'string', description: '另一头的地点 key' },
        characters: { type: 'array', items: { type: 'integer' }, description: '发现它的角色编号（在场一起看到的可以填多个）' },
      },
      required: ['from', 'to', 'characters'],
    },
  },
  {
    name: 'set_spot',
    description:
      '在这个地点里换了站的地方（站位）：走到窗边、退到门口、凑到某人身边、冲到敌人跟前。spot 写剧本里这个地点的站位名（locations 的 spots）；剧本没写合适的，按描述起一个短名字（12 个字以内）；空字符串是回到大家中间。凑到某个人身边，就写他的站位（他在大家中间就写空字符串）。换了地点程序会清空站位，不用调用。打仗时敌人走动也用它（填 enemy，不填 character）。',
    input_schema: {
      type: 'object',
      properties: {
        character: characterParam,
        enemy: { type: 'string', description: '敌人在这场战斗里的编号（敌人走动时填）' },
        spot: { type: 'string', description: '站位名；空字符串是回到大家中间' },
      },
      required: ['spot'],
    },
  },
  {
    name: 'noise',
    description:
      '附近也听得到的动静（喊叫、枪响、打斗、钟声、爆炸）：程序按地图找到路程在 reach_minutes 分钟以内、不在现场的角色，把 text 单独发给他们。在场的人从叙述里就知道了，不用发。',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '离得远的人听到了什么、大概从哪个方向，一句话，只写听得到的，第三人称' },
        reach_minutes: { type: 'integer', description: '走路几分钟以内的地方听得到：喊叫、争吵 2～5，枪响、打斗 5～15，钟声、爆炸 15～60' },
        location: { type: 'string', description: '动静在哪个地点的 key；不填就是行动的角色现在所在的地点' },
      },
      required: ['text', 'reach_minutes'],
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
  /** 这个行动在游戏里花的分钟数（V1.0.x 地图）：路上的时间不能超过它，不够就只走到半路；不写不限。 */
  minutes?: number;
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
  /** 这次结算里每个角色能花在路上的时间（V1.0.x 地图）。 */
  readonly travelBudget: number;
  /** 每个角色这次结算里已经花在路上的时间。 */
  protected readonly travelUsed = new Map<number, number>();
  /** 这次结算里的动静：结算做完再定谁听得到（settleNoise）。 */
  protected readonly noises: { text: string; reach: number; origin: string }[] = [];
  /** 行动的人从开始时的地方走出去的第一站（走暗道、按 via 走的是 null）；没走过是 undefined。留在原地的人看见他往哪走了。 */
  protected firstLeg: string | null | undefined = undefined;
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
  /** 站位（V1.0.x）：这次结算里谁刚从哪些敌人身边走开（角色编号 → 敌人编号）：它们趁机打的那一下，近战照样打得到。 */
  protected readonly leftFoes = new Map<number, Set<string>>();
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
    this.travelBudget = typeof input.minutes === 'number' && input.minutes >= 0 ? input.minutes : Infinity;
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
    // 程序按地图走的（V1.0.x）：他真走的第一段；走暗道、按 via 走的，看不出往哪去了
    if (this.firstLeg !== undefined) {
      const step = this.firstLeg;
      return { ids, from: place(from)?.name ?? from, to: step ? (place(step)?.name ?? step) : null, far: step !== null && step !== to };
    }
    // 按出口找最近的路，记下第一站（暗道不算：留在原地的人看不出他是从暗门走的）
    const firstStep = new Map<string, string>();
    const queue: string[] = [];
    for (const e of place(from)?.exits ?? []) {
      if (!e.hidden && !firstStep.has(e.to)) {
        firstStep.set(e.to, e.to);
        queue.push(e.to);
      }
    }
    while (queue.length && !firstStep.has(to)) {
      const k = queue.shift()!;
      for (const e of place(k)?.exits ?? []) {
        if (!e.hidden && e.to !== from && !firstStep.has(e.to)) {
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
      case 'reveal_exit':
        return this.revealExit(input);
      case 'noise':
        return this.noise(input);
      case 'set_spot':
        return input.enemy !== undefined && input.enemy !== null && input.enemy !== '' ? this.setEnemySpot(input) : this.setSpot(input);
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

  /** 地点的名字。 */
  protected locName(key: string | null): string {
    return (key && this.scenario.locations.find((l) => l.key === key)?.name) || key || '不明';
  }

  /** 在某个地点、活着的其他角色的名字。 */
  private peopleAt(key: string, except: number): string[] {
    return [...this.characters.values()].filter((x) => x.id !== except && !x.dead && x.location === key).map((x) => x.name);
  }

  /** 记下一个角色发现了暗道（pathKey）；新发现的返回 true。 */
  private findExit(c: Character, key: string): boolean {
    const found = exitsFoundBy(this.world, c.id);
    if (found.has(key)) return false;
    found.add(key);
    this.world.exitsFound = { ...this.world.exitsFound, [String(c.id)]: [...found].sort() };
    this.worldChanged = true;
    return true;
  }

  /**
   * 移动（V1.0.x 起按地图走）：找最快的路线（暗道要发现了才走得通；发现了的路走不到、算上暗道走得到的，走过去就是发现了）；
   * 这次结算的时间不够的，走到来得及到的最后一个地点为止。地图上没有路的，要写 via（怎么去的），不算路上的时间。
   * 路过的地点也算去过；路过的地方有人的，告诉主持人。
   */
  private moveCharacter(input: Input): ToolResult {
    const c = this.character(input.character);
    if (c.dead) throw new ToolError(`${c.name}已经死了`);
    const loc = this.scenario.locations.find((l) => l.key === input.location);
    if (!loc) throw new ToolError(`没有这个地点：${String(input.location)}，可用的有：${this.scenario.locations.map((l) => l.key).join('、')}`);
    if (c.location === loc.key) return ok({ character: c.name, location: loc.name, note: '本来就在这里' });
    const from = c.location;
    const hurry = input.hurry === true;
    const via = text(input.via, 60);
    const places = this.scenario.locations;
    // 赶路按赶路的时间找路线（一段段都是短路的，赶路也快不了多少）
    const graph = hurry ? hurriedPlaces(places) : places;
    const known = exitsKnownTo(this.world, this.scenario, this.characters.values(), c.id);
    let route = from ? routeBetween(graph, from, loc.key, openExits(known)) : null;
    // 明路走不到：写了 via 的照 via 的去法过去；没写的，算上暗道走得到就走暗道（走过去就是发现了）
    if (from && !route && !via) route = routeBetween(graph, from, loc.key, anyExit);

    // 地图上没有路：写了怎么去的才能过去（不算路上的时间，也不算发现了暗道）
    if (!from || !route) {
      if (from && !via) {
        throw new ToolError(
          `从「${this.locName(from)}」到「${loc.name}」地图上没有路（剧本没写这样的出口）。有别的去法（被人带走、坐船、抄小路）的，在 via 里写清楚怎么去的；不然换一个走得到的地点`,
        );
      }
      if (c.id === this.actorId && from === this.startLocations.get(c.id)) this.firstLeg ??= null;
      this.arrive(c, loc.key, []);
      return ok({ character: c.name, location: loc.name, ...(via ? { via, note: '地图上没有这条路，按 via 写的去法到的' } : {}), other_characters_here: this.peopleAt(loc.key, c.id) });
    }

    const used = this.travelUsed.get(c.id) ?? 0;
    const walked = walkRoute(route, Math.max(0, this.travelBudget - used));
    this.travelUsed.set(c.id, used + walked.used);
    // 走过的暗道：走过去就是发现了。从明的那一面穿过一道门（对面那一面是暗门），也就知道了这条路
    const secret: string[] = [];
    const reachedAt = route.path.indexOf(walked.stop);
    for (let i = 0; i < reachedAt; i++) {
      const a = route.path[i];
      const b = route.path[i + 1];
      const exits = places.find((l) => l.key === a)?.exits.filter((e) => e.to === b) ?? [];
      const same = exits.filter((e) => (hurry ? hurried(e.minutes) : e.minutes) === route.steps[i]);
      const exit = same.find((e) => !e.hidden) ?? same[0] ?? exits[0];
      const key = pathKey(a, b);
      const back = places.find((l) => l.key === b)?.exits.some((e) => e.to === a && e.hidden);
      if (exit?.hidden) {
        this.findExit(c, key);
        if (!known.has(key)) secret.push(`${this.locName(a)} → ${this.locName(b)}`);
      } else if (back) this.findExit(c, key);
      // 行动的人从这次结算开始时的地方走出去的第一段：留在原地的人看见他往哪走了（走暗道的看不出来）
      if (i === 0 && c.id === this.actorId && a === this.startLocations.get(c.id)) this.firstLeg ??= exit?.hidden ? null : b;
    }
    for (const k of walked.passed) if (!c.visited.includes(k)) c.visited.push(k);
    const passed = walked.passed.map((k) => ({ place: this.locName(k), people: this.peopleAt(k, c.id) }));
    const routeText = route.path.map((k) => this.locName(k)).join(' → ');
    const time = { minutes: walked.used, ...(hurry ? { hurry: true } : {}) };
    if (walked.stop === from) {
      return ok({
        character: c.name,
        arrived: false,
        location: this.locName(from),
        route: routeText,
        still_need_minutes: walked.left,
        note: `这一次行动的时间不够走到下一个地方：${c.name}还在「${this.locName(from)}」。叙述写他刚动身、走在路上，下次行动接着走`,
      });
    }
    this.arrive(c, walked.stop, passed.map((p) => p.place));
    const arrived = walked.stop === loc.key;
    return ok({
      character: c.name,
      ...(arrived ? { location: loc.name } : { arrived: false, stopped_at: this.locName(walked.stop), destination: loc.name, still_need_minutes: walked.left }),
      route: routeText,
      travel: time,
      ...(passed.length ? { passed_by: passed } : {}),
      ...(secret.length ? { secret_passage: secret, secret_note: '走的是暗道：他发现了这条路，以后地图上画着' } : {}),
      other_characters_here: this.peopleAt(walked.stop, c.id),
      ...(arrived
        ? {}
        : { note: `这一次行动的时间只够走到「${this.locName(walked.stop)}」，到「${loc.name}」还要 ${travelText(walked.left)}：叙述写他走到这里为止，下次行动接着走` }),
    });
  }

  /** 站位（V1.0.x）：角色在这个地点里换了站的地方。 */
  private setSpot(input: Input): ToolResult {
    const c = this.character(input.character);
    if (c.dead) throw new ToolError(`${c.name}已经死了`);
    if (!c.location) throw new ToolError(`${c.name}不在任何地点`);
    const loc = this.scenario.locations.find((l) => l.key === c.location);
    // 照抄了提示里的「壁炉边（嘈杂）」、写了「大家中间」的，对上剧本里的站位
    const spot = matchSpot(loc, input.spot);
    if ((c.spot ?? null) === spot) return ok({ character: c.name, spot: spotName(spot), note: '本来就站在这里' });
    // 从有敌人的站位走开：身边的敌人通常趁机打一下。记下是哪几个，这次结算里它们照样打得到他（近战）
    const leftFoes = this.foesBeside(c);
    if (leftFoes.length) {
      const set = this.leftFoes.get(c.id) ?? new Set<string>();
      for (const f of leftFoes) set.add(f.id);
      this.leftFoes.set(c.id, set);
    }
    c.spot = spot;
    this.changed.add(c.id);
    this.changes.push({ characterId: c.id, text: `站位：${spotName(spot)}` });
    const flags = flagText(spotFlags(loc, spot));
    const beside = [...this.characters.values()].filter((x) => x.id !== c.id && !x.dead && x.location === c.location && sameSpot(x.spot, spot)).map((x) => x.name);
    const invented = spot && !loc?.spots?.some((x) => x.name === spot);
    return ok({
      character: c.name,
      spot: spotName(spot),
      ...(flags ? { flags } : {}),
      beside,
      ...(leftFoes.length
        ? { left_enemies: `${c.name}从${leftFoes.map((f) => `${f.name}（${f.id}）`).join('、')}身边走开了：他们通常趁机打一下（叙述里写上）。${this.freeHitHow()}` }
        : {}),
      ...(invented && loc?.spots?.length ? { note: `剧本里这个地点的站位是：${loc.spots.map((x) => x.name).join('、')}；你起的这个名字照记下（没有属性）` } : {}),
    });
  }

  /** 敌人换站位：第二版、5E 的战斗里才有敌人（各自的结算里改写这个）。 */
  protected setEnemySpot(_input: Input): ToolResult {
    throw new ToolError('这一局没有在打的敌人');
  }

  /** 和这个角色站在一起、还能动手的敌人：第二版、5E 的战斗里才有。 */
  protected foesBeside(_c: Character): { id: string; name: string }[] {
    return [];
  }

  /** 走开时敌人趁机打的那一下用哪个工具（第二版、5E 各自写）。 */
  protected freeHitHow(): string {
    return '';
  }

  /** 这个敌人是不是刚被这个角色从身边甩开（这次结算里）：是的话这一下近战照样打得到，用一次就没了。 */
  protected takeFreeHit(characterId: number, enemyId: string): boolean {
    const set = this.leftFoes.get(characterId);
    if (!set?.has(enemyId)) return false;
    set.delete(enemyId);
    return true;
  }

  /** 角色到了一个地点（记下去过、变化）。换了地点，站位清空。 */
  private arrive(c: Character, key: string, passed: string[]) {
    c.location = key;
    c.spot = null;
    if (!c.visited.includes(key)) c.visited.push(key);
    this.changed.add(c.id);
    this.changes.push({ characterId: c.id, text: passed.length ? `来到：${this.locName(key)}（路过${passed.join('、')}）` : `来到：${this.locName(key)}` });
  }

  /** 发现暗道（V1.0.x）：剧本里这两个地点之间要有 hidden 的出口。 */
  private revealExit(input: Input): ToolResult {
    const from = String(input.from ?? '');
    const to = String(input.to ?? '');
    const places = this.scenario.locations;
    const exists = places.some((l) => (l.key === from && l.exits.some((e) => e.to === to && e.hidden)) || (l.key === to && l.exits.some((e) => e.to === from && e.hidden)));
    if (!exists) {
      const all = places.flatMap((l) => l.exits.filter((e) => e.hidden).map((e) => `${l.key} → ${e.to}`));
      throw new ToolError(`「${from}」和「${to}」之间没有暗道（剧本里 hidden 的出口）。${all.length ? `剧本里的暗道：${all.join('、')}` : '这个剧本没有暗道'}`);
    }
    const ids = Array.isArray(input.characters) ? input.characters : [];
    if (!ids.length) throw new ToolError('characters 至少写一个角色');
    const who = ids.map((raw) => this.character(raw));
    const key = pathKey(from, to);
    const fresh = who.filter((c) => this.findExit(c, key));
    for (const c of fresh) {
      this.changed.add(c.id);
      this.changes.push({ characterId: c.id, text: `发现了暗道：${this.locName(from)} ↔ ${this.locName(to)}` });
    }
    return ok({ passage: `${this.locName(from)} ↔ ${this.locName(to)}`, found_by: fresh.map((c) => c.name), ...(fresh.length < who.length ? { already_known: who.filter((c) => !fresh.includes(c)).map((c) => c.name) } : {}) });
  }

  /**
   * 动静（V1.0.x）：路程在 reach_minutes 以内的人听得到。声音两头都传、穿得过暗门（按不分方向的完整地形算）。
   * 谁收到等这次结算做完再定（settleNoise）：看得到这次叙述的人从叙述里就知道了，不另外发；主持人这里先告诉他现在听得到的人。
   */
  private noise(input: Input): ToolResult {
    const message = text(input.text, 300);
    if (!message) throw new ToolError('text 不能为空');
    const reach = Number.isInteger(input.reach_minutes) ? Math.max(1, Math.min(60, input.reach_minutes as number)) : null;
    if (reach === null) throw new ToolError('reach_minutes 要写整数分钟（1～60）');
    const actor = this.characters.get(this.actorId);
    const origin = typeof input.location === 'string' && input.location ? input.location : (actor?.location ?? null);
    if (!origin || !this.scenario.locations.some((l) => l.key === origin)) {
      throw new ToolError(`没有这个地点：${String(input.location ?? '')}，可用的有：${this.scenario.locations.map((l) => l.key).join('、')}`);
    }
    this.noises.push({ text: message, reach, origin });
    const heard = this.hearers({ reach, origin }, actor?.location ? [...this.characters.values()].filter((c) => c.location === actor.location).map((c) => c.id) : [])
      .map((c) => `${c.name}（在${this.locName(c.location)}）`);
    return ok({ heard_by: heard, ...(heard.length ? {} : { note: '附近没有别的角色听得到' }) });
  }

  /** 听得到一处动静的人：活着、不是行动的人、不在 except 里、路程在范围内。 */
  private hearers(n: { reach: number; origin: string }, except: number[]): Character[] {
    const routes = routesFrom(bothWays(this.scenario.locations), n.origin, anyExit);
    const skip = new Set([this.actorId, ...except]);
    return [...this.characters.values()].filter((c) => {
      if (c.dead || skip.has(c.id) || !c.location) return false;
      const minutes = c.location === n.origin ? 0 : routes.get(c.location)?.minutes;
      return minutes !== undefined && minutes <= n.reach;
    });
  }

  /** 结算做完、定了叙述给谁看以后：动静单独告诉听得到、又看不到这次叙述的人（每人每处动静一句）。 */
  settleNoise(audience: number[]) {
    for (const n of this.noises.splice(0)) for (const c of this.hearers(n, audience)) this.privateMessages.push({ characterId: c.id, text: n.text });
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
