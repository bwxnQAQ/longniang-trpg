// 规则第二版（V0.7.0）的主持工具：七项属性的检定、生命值和精神值、战斗、道具、地下城的宝物。
// 和第一版共用线索、移动、NPC、时间线、私信、结局这几个工具（在 tools.ts 里）。
import { matchSpot, sameSpot, spotFlags, spotName } from '../../shared/spots';
import { randomInt } from 'node:crypto';
import { OUTCOME_LABEL, OUTCOME_MEANING, outcomeFor } from '../../shared/rules';
import {
  ATTRIBUTE2_KEYS,
  ATTRIBUTE2_NAME,
  CONSUMABLE_KEYS,
  GEAR_PART_LABEL,
  MODIFIER2_MAX,
  MODIFIER2_MIN,
  PET_ATTRIBUTE_FOR,
  RARITY_LABEL,
  SEVERITY,
  SEVERITY_KEYS,
  WEAKNESS_BONUS,
  consumableOf,
  enemyStats,
  levelDamageBonus,
  levelPenalty,
  rarityOdds,
  shorthandedPenalty,
  type Attribute2,
  type ConsumableKey,
  type DungeonSize,
  type Rarity,
  type Severity,
} from '../../shared/rules2';
import { GEAR_BASES, gearEffectText, gearView } from '../../shared/gear2';
import type { ToolDefinition } from '../ai/types';
import { LEGENDARY_GEAR } from '../legendary';
import { QIYU, QIYU_CHANCE, QIYU_PER_RUN, QIYU_THRESHOLD, SKILLS, skillOf, type Skill } from '../skills';
import { roll2d6, type CheckResult, type Penalty } from './rules';
import {
  accessoryFor,
  afterArmor,
  applyHp,
  applyMp,
  attackDamage,
  check2,
  defenseOf,
  reductionOf,
  roll2d6Plus,
  rollSeverity,
  weaponOf,
  type Check2Input,
  type LootItem,
  type V2State,
} from './rules2';
import type { DungeonEnemy, Scenario } from './scenario';
import {
  DM_TOOLS,
  describeParts,
  isFailure,
  ok,
  petHelpNote,
  publicParts,
  ResolutionContext,
  text,
  ToolError,
  type Input,
  type ResolutionInput,
  type ToolResult,
} from './tools';
import type { Character, CombatState, EnemyState } from './world';

const characterParam = { type: 'integer', description: '角色编号（角色列表里的“编号”）' };
const attribute2Param = {
  type: 'string',
  enum: ATTRIBUTE2_KEYS,
  description: '用哪个属性：strength 力量、constitution 体质、agility 敏捷、intellect 智识、perception 感知、will 意志、charm 魅力',
};
const severityParam = { type: 'string', enum: SEVERITY_KEYS, description: '轻 light（1～3）、中 medium（4～6）、重 heavy（7～10）；难度高的地下城程序会再加' };

/** 第一版里能直接沿用的工具（线索、移动、NPC、时间线、私信、结局）。 */
const SHARED_TOOLS = new Set(['give_clue', 'move_character', 'reveal_exit', 'noise', 'set_spot', 'update_npc', 'trigger_event', 'private_message', 'end_game']);

const ROLL_CHECK_2: ToolDefinition = {
  name: 'roll_check',
  description:
    '让程序为一个角色掷一次检定：2d6 + 属性 + 专长 + 身上加这一项属性检定最多的那件装备 + 情境修正 + 协助；装备、难度、人手不足、状态的加减程序自动算。返回点数和结果档位。结果不确定时必须用它，不能自己编结果。攻击敌人不用它，用 attack。',
  input_schema: {
    type: 'object',
    properties: {
      character: characterParam,
      attribute: attribute2Param,
      specialty: { type: 'string', description: '行动正好用上的专长名字，必须是这个角色已有的专长；用不上就不填' },
      modifier: { type: 'integer', description: '情境修正，-3 到 +3 的整数；难度普通就是 0' },
      assisted: { type: 'boolean', description: '是否有别的角色在场协助（+1）' },
      hidden: { type: 'boolean', description: '暗骰：角色自己察觉不到的检定，玩家看不到点数' },
      reason: { type: 'string', description: '这次检定判断什么，一句话。明骰的这句话玩家看得到：别写出角色还不知道的东西（埋伏、藏着的敌人、机关），写成「仔细察看四周」这类说法，或者用暗骰' },
    },
    required: ['character', 'attribute', 'modifier', 'reason'],
  },
};

const ROLL_OPPOSED_2: ToolDefinition = {
  name: 'roll_opposed',
  description:
    '对抗检定：角色和 NPC（或另一个玩家角色）正面较量（追逐、角力、说服一个不情愿的人、互相欺骗），双方各掷 2d6 加各自的加值，高的赢，平局维持原状。和敌人动手打用 attack，不用这个。',
  input_schema: {
    type: 'object',
    properties: {
      character: characterParam,
      attribute: attribute2Param,
      specialty: { type: 'string', description: '行动正好用上的专长名字；用不上就不填' },
      modifier: { type: 'integer', description: '情境修正，-3 到 +3' },
      reason: { type: 'string', description: '较量的是什么，一句话' },
      opponent_npc: { type: 'string', description: '对手 NPC 的 key' },
      opponent_bonus: { type: 'integer', description: '对手 NPC 在这方面的总加值，-1 到 +3，难度高的地下城可以再高（最多 +3 再加难度减一）' },
      opponent_label: { type: 'string', description: '骰子卡片上怎么称呼这个 NPC（只写角色们已经知道的叫法）' },
      opponent_character: { type: 'integer', description: '对手是玩家角色时，他的角色编号' },
      opponent_attribute: { ...attribute2Param, description: '对手是玩家角色时，他用哪个属性' },
    },
    required: ['character', 'attribute', 'modifier', 'reason'],
  },
};

const UPDATE_CHARACTER_2: ToolDefinition = {
  name: 'update_character',
  description: '修改角色的状态标签和故事里的物品。生命值、精神值不用它改：受伤用 hurt，恢复用 heal。',
  input_schema: {
    type: 'object',
    properties: {
      character: characterParam,
      add_conditions: {
        type: 'array',
        description: '加上的状态标签，比如中毒、疲惫、被缠住',
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
      add_items: { type: 'array', items: { type: 'string' }, description: '得到的故事里的物品（钥匙、信、地图……）：每样一个短名字（最多 20 个字），来历写进叙述。地下城的宝物用 give_loot' },
      remove_items: { type: 'array', items: { type: 'string' }, description: '失去或用掉的故事里的物品' },
      reason: { type: 'string', description: '为什么变化，一句话' },
    },
    required: ['character', 'reason'],
  },
};

const HURT: ToolDefinition = {
  name: 'hurt',
  description:
    '让角色受伤（扣生命值）或受到惊吓、迷惑（扣精神值）。程序按轻重掷具体扣多少，扣生命值时护甲减伤（中毒、坠落这类护甲挡不住的写 armor=false）。生命值到 0 倒地濒死，精神值到 0 下一次行动失控。敌人打人用 enemy_attack，不用这个。',
  input_schema: {
    type: 'object',
    properties: {
      character: characterParam,
      severity: severityParam,
      target: { type: 'string', enum: ['hp', 'mp'], description: 'hp 生命值（受伤），mp 精神值（惊吓、迷惑、恐惧）；不填是 hp' },
      armor: { type: 'boolean', description: '护甲能不能挡（扣生命值时默认能挡）' },
      reason: { type: 'string', description: '为什么受伤，一句话' },
    },
    required: ['character', 'severity', 'reason'],
  },
};

const HEAL: ToolDefinition = {
  name: 'heal',
  description: '恢复生命值或精神值：休息、包扎（通常要检定）、安抚。濒死的人生命值回到 1 以上就救回来了。喝药水用 use_item。',
  input_schema: {
    type: 'object',
    properties: {
      character: characterParam,
      hp: { type: 'integer', description: '恢复几点生命值（1～20）；包扎一般 2～4，好好休息一阵 4～8' },
      mp: { type: 'integer', description: '恢复几点精神值（1～20）；歇口气、被人安抚一般 1～3，踏踏实实睡一觉 4～8' },
      reason: { type: 'string', description: '怎么恢复的，一句话' },
    },
    required: ['character', 'reason'],
  },
};

const START_COMBAT: ToolDefinition = {
  name: 'start_combat',
  description:
    '在行动的角色所在的地点开打：按剧本里的敌人（敌人 key）放出敌人，程序按难度算好它们的生命值、防御、攻击，并给在场的所有人和敌人掷先后手（2d6 + 敏捷）。遇上剧本写好的遇敌（encounter）时填 encounter。这里已经在打的话，新来的敌人会加进去。',
  input_schema: {
    type: 'object',
    properties: {
      encounter: { type: 'string', description: '剧本里遇敌的 key（地下城的 dungeon.encounters）；填了就按它放敌人' },
      enemies: {
        type: 'array',
        description: '不按遇敌、直接放的敌人：剧本里敌人的 key 和数量',
        items: { type: 'object', properties: { enemy: { type: 'string' }, count: { type: 'integer' } }, required: ['enemy', 'count'] },
      },
      note: { type: 'string', description: '怎么打起来的，一句话' },
      spot: { type: 'string', description: '这些敌人出现在哪个站位（剧本里这个地点的站位名）；不写就在大家中间' },
    },
    required: ['note'],
  },
};

const ATTACK: ToolDefinition = {
  name: 'attack',
  description:
    '角色攻击一个敌人：2d6 + 力量（近战）或敏捷（远程、快刺）+ 主手武器（同一项属性的才加）+ 修正，掷到敌人的防御就打中，伤害 1d6 + 武器加值，大成功翻倍。用上了首领这一局的弱点就填 weakness=true（+3，伤害再翻倍）。首领的护盾还在时打不动。',
  input_schema: {
    type: 'object',
    properties: {
      character: characterParam,
      enemy: { type: 'string', description: '敌人在这场战斗里的编号（start_combat 返回的 id，比如 rat-2）' },
      attribute: { type: 'string', enum: ['strength', 'agility'], description: 'strength 近战用力量，agility 远程或快刺用敏捷' },
      specialty: { type: 'string', description: '正好用上的专长；用不上就不填' },
      modifier: { type: 'integer', description: '情境修正，-3 到 +3（偷袭、占了地利 +1～+2；被缠住、看不清 -1～-2）' },
      assisted: { type: 'boolean', description: '有同伴在场协助（+1）' },
      weakness: { type: 'boolean', description: '这一下正好用上了首领这一局的弱点' },
      ranged: { type: 'boolean', description: '远程：弓弩、投掷、火铳、暗器（近战不填）。近战只能打同一个站位上的敌人' },
      reason: { type: 'string', description: '怎么攻击的，一句话' },
    },
    required: ['character', 'enemy', 'attribute', 'modifier', 'reason'],
  },
};

const ENEMY_ATTACK: ToolDefinition = {
  name: 'enemy_attack',
  description:
    '敌人攻击一个角色：程序掷 2d6 + 敌人的攻击，掷到角色的防御（7 + 敏捷）就打中，按轻重扣生命值，护甲减伤。每次结算角色的行动后，和他交手的敌人通常各还手一次。severity 不能超过这个敌人的上限（小怪轻、精英中、首领重）。',
  input_schema: {
    type: 'object',
    properties: {
      enemy: { type: 'string', description: '敌人在这场战斗里的编号' },
      character: characterParam,
      severity: severityParam,
      ability: { type: 'string', description: '用了剧本里写的哪个本事（不是普通攻击才填）' },
      modifier: { type: 'integer', description: '情境修正，-3 到 +3（角色倒地 +2；站位的掩体程序会算，不用再减）' },
      ranged: { type: 'boolean', description: '远程的本事：射箭、吐毒、扔东西（近战不填）。近战只能打同一个站位上的角色' },
    },
    required: ['enemy', 'character', 'severity'],
  },
};

const UPDATE_ENEMY: ToolDefinition = {
  name: 'update_enemy',
  description: '改敌人的状态：首领的护盾被大家配合破开了（shielded=false）、敌人逃走或投降（gone=true）。',
  input_schema: {
    type: 'object',
    properties: {
      enemy: { type: 'string', description: '敌人在这场战斗里的编号' },
      shielded: { type: 'boolean', description: '护盾还在不在' },
      gone: { type: 'boolean', description: '逃走了、投降了，不再参战' },
      note: { type: 'string', description: '发生了什么，一句话' },
    },
    required: ['enemy', 'note'],
  },
};

const END_COMBAT: ToolDefinition = {
  name: 'end_combat',
  description: '这个地点的战斗结束了（敌人都倒下、逃走，或者角色们脱身了）。',
  input_schema: {
    type: 'object',
    properties: { note: { type: 'string', description: '怎么结束的，一句话' } },
    required: ['note'],
  },
};

const USE_ITEM: ToolDefinition = {
  name: 'use_item',
  description:
    '角色用掉一个道具：potion 治疗药水（回 2d6+2 生命值，能给身边的同伴用）、clear-pill 清心丸（回 2d6+2 精神值）、antidote 解毒剂、smoke 烟雾弹（这个地点的同伴一起脱离战斗）、fire-oil 火油（扔向一个敌人，2d6 伤害不看防御）。带进来的、这一局捡到的道具都能用（先用带进来的）。药水、清心丸、解毒剂也能给身边的 NPC 用（填 target_npc）：NPC 没有生命值记账，效果照剧本写，需要的话用 update_npc 记下。',
  input_schema: {
    type: 'object',
    properties: {
      character: characterParam,
      item: { type: 'string', enum: CONSUMABLE_KEYS, description: '道具' },
      target_character: { type: 'integer', description: '用在哪个角色身上（药水、清心丸、解毒剂；不填是自己）' },
      target_npc: { type: 'string', description: '用在哪个 NPC 身上（药水、清心丸、解毒剂；填 NPC 的 key）' },
      target_enemy: { type: 'string', description: '火油扔向哪个敌人（这场战斗里的编号）' },
      weakness: { type: 'boolean', description: '火油正好用上了首领这一局的弱点（伤害翻倍）' },
    },
    required: ['character', 'item'],
  },
};

const GIVE_LOOT: ToolDefinition = {
  name: 'give_loot',
  description:
    '角色找到了剧本里放的一处宝物（dungeon.loot 的 key，这一局放在哪写在 at）。具体是什么装备、几个道具由程序按难度定，返回给你用来叙述。捡到的道具这一局就能用（use_item）；装备要带出去以后才能穿上；所有东西都要活着走出去才能带走。宝物是秘籍、又没写是哪一门时，可以填 skill 挑一门和剧本描写对得上的。',
  input_schema: {
    type: 'object',
    properties: {
      character: characterParam,
      loot: { type: 'string', description: '宝物的 key' },
      skill: { type: 'string', description: '秘籍是哪一门技能（只在宝物是没写明的秘籍时用，填技能编号）' },
    },
    required: ['character', 'loot'],
  },
};

const USE_SKILL: ToolDefinition = {
  name: 'use_skill',
  description:
    '角色用一门学会的技能（角色列表里写着他会的技能、花几点精神值、效果）。程序扣精神值、执行效果（攻击类的会掷骰），返回结果；只在故事里起作用的技能，照效果写，相关检定再给修正。精神值不够用不了。',
  input_schema: {
    type: 'object',
    properties: {
      character: characterParam,
      skill: { type: 'string', description: '技能的编号（角色列表里技能后面括号里的）' },
      target_enemy: { type: 'string', description: '攻击类技能打哪个敌人（这场战斗里的编号）' },
      target_character: { type: 'integer', description: '治疗、回精神、护身、加成类技能用在谁身上（不填是自己）' },
      modifier: { type: 'integer', description: '攻击类技能的情境修正，-3 到 +3' },
      weakness: { type: 'boolean', description: '攻击类技能打首领时正好用上了这一局的弱点（和 attack 的 weakness 一样）' },
      ranged: { type: 'boolean', description: '攻击类技能是远程打的（弓弩、投掷、暗器），和 attack 的 ranged 一样；破军一击只能近战' },
      reason: { type: 'string', description: '怎么用的，一句话' },
    },
    required: ['character', 'skill', 'reason'],
  },
};

/** 规则第二版这一局能用的工具：有敌人才有战斗的工具，地下城才有道具和宝物，有人会技能才有技能。 */
export function dmTools2(scenario: Scenario, opts: { skills?: boolean } = {}): ToolDefinition[] {
  const shared = DM_TOOLS.filter((t) => SHARED_TOOLS.has(t.name));
  const tools = [ROLL_CHECK_2, ROLL_OPPOSED_2, UPDATE_CHARACTER_2, HURT, HEAL, ...shared];
  if (enemiesOf(scenario).length) tools.push(START_COMBAT, ATTACK, ENEMY_ATTACK, UPDATE_ENEMY, END_COMBAT);
  if (scenario.dungeon) tools.push(USE_ITEM, GIVE_LOOT);
  if (opts.skills) tools.push(USE_SKILL);
  return tools;
}

export function enemiesOf(scenario: Scenario): DungeonEnemy[] {
  return scenario.dungeon?.enemies ?? scenario.enemies ?? [];
}

const SEVERITY_ORDER: Record<Severity, number> = { light: 0, medium: 1, heavy: 2 };

export type Rules2Input = ResolutionInput & {
  /** 这一局里有角色的人数（大型地下城少人要减）。 */
  players: number;
  /** 0～n-1 的随机整数（挑宝物用；测试可以换掉）。 */
  pick?: (n: number) => number;
  /** 每个角色的主人已经有的传奇装备（编号）：不会再掉。 */
  ownedLegendary?: Map<number, Set<string>>;
};

/** 结算里用掉的道具：写进数据库时从账号的背包里扣掉。 */
export type ItemUse = { characterId: number; item: ConsumableKey };

/**
 * 规则第二版的一次结算：在第一版的基础上换掉检定、伤势，加上战斗、道具、宝物。
 * 地下城以外的第二版剧本难度按 1 算（不减），没有道具和宝物。
 */
export class Rules2Context extends ResolutionContext {
  readonly level: number;
  readonly size: DungeonSize;
  readonly players: number;
  /** 大家都看得到的战况（开打、先后手、敌人倒下、用了道具、捡到东西）。 */
  readonly events: string[] = [];
  readonly itemUses: ItemUse[] = [];
  private readonly pick: (n: number) => number;
  private readonly ownedLegendary: Map<number, Set<string>>;
  /** 这次结算里倒下的角色（濒死的倒数从下一次开始算）、被救起来的角色。 */
  private readonly downed = new Set<number>();
  private readonly lostControlAtStart: boolean;

  constructor(input: Rules2Input) {
    super(input);
    this.level = input.scenario.dungeon?.level ?? 1;
    this.size = input.scenario.dungeon?.size ?? 'small';
    this.players = input.players;
    this.pick = input.pick ?? ((n) => randomInt(n));
    this.ownedLegendary = input.ownedLegendary ?? new Map();
    this.lostControlAtStart = this.characters.get(this.actorId)?.v2?.lostControl === true;
  }

  protected run(name: string, input: Input): ToolResult {
    switch (name) {
      case 'roll_check':
        return this.rollCheck2(input);
      case 'roll_opposed':
        return this.rollOpposed2(input);
      case 'update_character':
        return this.updateCharacter2(input);
      case 'hurt':
        return this.hurt(input);
      case 'heal':
        return this.heal(input);
      case 'start_combat':
        return this.startCombat(input);
      case 'attack':
        return this.attack(input);
      case 'enemy_attack':
        return this.enemyAttack(input);
      case 'update_enemy':
        return this.updateEnemy(input);
      case 'end_combat':
        return this.endCombat(input);
      case 'use_item':
        return this.useItem(input);
      case 'give_loot':
        return this.giveLoot(input);
      case 'use_skill':
        return this.useSkill(input);
      case 'move_character': {
        const mover = this.character(input.character);
        const from = mover.location;
        const visitedBefore = new Set(mover.visited);
        let result = super.run(name, input);
        if (result.isError || mover.location === from) return result;
        // 奇遇只在走到这一局还没去过的地方时碰得上（来回走、原地「移动」不算；时间不够只走到半路的，看停下的地方）
        const fresh = !!mover.location && !visitedBefore.has(mover.location);
        if (from) result = this.leftFight(mover, from, result);
        return this.dungeon && fresh ? this.maybeQiyu(input, result) : result;
      }
      default:
        if (SHARED_TOOLS.has(name)) return super.run(name, input);
        throw new ToolError(`没有这个工具：${name}`);
    }
  }

  // ----- 共用的小工具 -----

  private state(c: Character): V2State {
    if (!c.v2) throw new ToolError(`${c.name}不是按规则第二版建的角色`);
    return c.v2;
  }

  private alive(raw: unknown): { c: Character; s: V2State } {
    const c = this.character(raw);
    if (c.dead) throw new ToolError(`${c.name}已经死了`);
    return { c, s: this.state(c) };
  }

  private get dungeon() {
    return this.scenario.dungeon ?? null;
  }

  /** 同伴给的加成（「激励」之类）：用在这一次检定或攻击上，用完就没了。 */
  private takeBoost(c: Character, s: V2State): number {
    if (!s.boost) return 0;
    const value = s.boost;
    s.boost = 0;
    this.changed.add(c.id);
    return value;
  }

  /** 减伤：身上的护甲合起来减的，加上这场战斗里的护身（「金钟罩」之类）。 */
  private armorValue(s: V2State): number {
    return reductionOf(s) + s.ward;
  }

  /** 所有检定都要算的减值：难度、大型少人、状态。 */
  private penalties2(c: Character): Penalty[] {
    const out: Penalty[] = [];
    const level = levelPenalty(this.level);
    if (level) out.push({ reason: '难度', value: level });
    const short = shorthandedPenalty(this.size, this.players);
    if (short) out.push({ reason: '人手不足', value: short });
    for (const x of c.conditions) if (x.penalty) out.push({ reason: x.name, value: x.penalty, kind: 'condition' });
    return out;
  }

  private modifierOf(input: Input, notes: string[]): number {
    let modifier = Number.isInteger(input.modifier) ? (input.modifier as number) : 0;
    if (modifier < MODIFIER2_MIN || modifier > MODIFIER2_MAX) {
      modifier = Math.max(MODIFIER2_MIN, Math.min(MODIFIER2_MAX, modifier));
      notes.push(`情境修正超出范围，按 ${modifier > 0 ? '+' : ''}${modifier} 算`);
    }
    return modifier;
  }

  private specialtyOf(c: Character, input: Input, notes: string[]): string | null {
    if (typeof input.specialty !== 'string' || !input.specialty.trim()) return null;
    const wanted = input.specialty.trim();
    const found = c.specialties.find((s) => s === wanted) ?? null;
    if (!found) notes.push(`${c.name}没有专长「${wanted}」，没有加专长`);
    return found;
  }

  private attributeOf2(raw: unknown): Attribute2 {
    const attribute = raw as Attribute2;
    if (!ATTRIBUTE2_KEYS.includes(attribute)) throw new ToolError(`没有这个属性：${String(raw)}，只能是 ${ATTRIBUTE2_KEYS.join('、')}`);
    return attribute;
  }

  private change(c: Character, textLine: string) {
    this.changes.push({ characterId: c.id, text: textLine });
    this.changed.add(c.id);
  }

  private combatAt(location: string | null): CombatState | null {
    return location ? (this.world.combats[location] ?? null) : null;
  }

  /** 近战够不够得着（V1.0.x 站位）：要和敌人站在同一个站位。 */
  private meleeReach(c: Character, enemy: EnemyState) {
    if (sameSpot(c.spot, enemy.spot)) return;
    throw new ToolError(
      `${enemy.name}（${enemy.id}）站在${spotName(enemy.spot)}，${c.name}在${spotName(c.spot)}：近战够不着。先用 set_spot 让${c.name}走过去（走开时身边的敌人通常趁机打一下）；用的是远程就填 ranged=true`,
    );
  }

  protected override foesBeside(c: Character): { id: string; name: string }[] {
    return (this.combatAt(c.location)?.enemies ?? []).filter((e) => !e.defeated && sameSpot(e.spot, c.spot)).map((e) => ({ id: e.id, name: e.name }));
  }

  protected override freeHitHow(): string {
    return '用 enemy_attack 结算，这一下近战照样打得到。';
  }

  /** 敌人换站位（V1.0.x）：在这一局正在打的仗里找这个敌人（先找行动的人所在的地方）。 */
  protected override setEnemySpot(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId);
    const fights = [this.combatAt(actor?.location ?? null), ...Object.values(this.world.combats)].filter((f): f is CombatState => !!f);
    const enemy = fights.flatMap((f) => f.enemies).find((e) => e.id === input.enemy);
    if (!enemy) {
      const all = fights.flatMap((f) => f.enemies.map((e) => `${e.id}=${e.name}`));
      throw new ToolError(`没有这个敌人：${String(input.enemy)}${all.length ? `，现在的敌人：${[...new Set(all)].join('、')}` : '（这里没有在打仗）'}`);
    }
    const fight = fights.find((f) => f.enemies.includes(enemy))!;
    const spot = matchSpot(this.scenario.locations.find((l) => l.key === fight.location), input.spot);
    enemy.spot = spot;
    this.worldChanged = true;
    const beside = [...this.characters.values()].filter((x) => !x.dead && x.location === fight.location && sameSpot(x.spot, spot)).map((x) => x.name);
    return ok({ enemy: `${enemy.id}=${enemy.name}`, spot: spotName(spot), beside });
  }

  private enemyIn(fight: CombatState | null, raw: unknown): EnemyState {
    if (!fight) throw new ToolError('这里没有在打仗：先用 start_combat 开打');
    const enemy = fight.enemies.find((e) => e.id === raw);
    if (!enemy) throw new ToolError(`这场战斗里没有「${String(raw)}」，现在的敌人：${fight.enemies.map((e) => `${e.id}=${e.name}${e.defeated ? '（倒下了）' : ''}`).join('、')}`);
    return enemy;
  }

  /** 宠物帮着重掷（检定、攻击没成时）：和第一版一样，这次结算只出手一次。 */
  private petReroll(c: Character, attribute: Attribute2, input: Check2Input, first: CheckResult, failed: (r: CheckResult) => boolean) {
    if (!failed(first)) return { result: first, help: null };
    const help = this.takePetHelp(c.id, PET_ATTRIBUTE_FOR[attribute]);
    if (!help) return { result: first, help: null };
    const r = check2(input, this.rng);
    if (!help.bonus) return { result: r, help };
    const total = r.total + help.bonus;
    const cut = r.parts.length - input.penalties.filter((p) => p.value).length;
    const parts = [...r.parts.slice(0, cut), { label: `${help.pet}帮忙`, value: help.bonus }, ...r.parts.slice(cut)];
    return { result: { ...r, total, outcome: outcomeFor(r.dice[0], r.dice[1], total), parts }, help };
  }

  // ----- 检定 -----

  private rollCheck2(input: Input): ToolResult {
    const { c, s } = this.alive(input.character);
    const notes: string[] = [];
    const attribute = this.attributeOf2(input.attribute);
    const accessory = accessoryFor(s, attribute);
    const checkInput: Check2Input = {
      attribute,
      value: s.attributes[attribute],
      specialty: this.specialtyOf(c, input, notes),
      gear: accessory ? { name: accessory.name, bonus: accessory.bonus } : null,
      modifier: this.modifierOf(input, notes),
      assisted: input.assisted === true,
      penalties: this.penalties2(c),
      boost: input.hidden === true ? 0 : this.takeBoost(c, s),
    };
    const hidden = input.hidden === true;
    const reason = text(input.reason, 60) || '检定';
    const first = check2(checkInput, this.rng);
    const { result, help } = hidden ? { result: first, help: null } : this.petReroll(c, attribute, checkInput, first, (r) => isFailure(r.outcome));
    const firstView = { dice: first.dice, total: first.total, outcome: first.outcome };
    this.rolls.push({
      characterId: c.id,
      attribute,
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
        attribute: ATTRIBUTE2_NAME[attribute],
        dice: result.dice,
        parts: publicParts(result, checkInput.penalties.filter((p) => p.value)),
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

  private rollOpposed2(input: Input): ToolResult {
    const { c, s } = this.alive(input.character);
    const notes: string[] = [];
    const attribute = this.attributeOf2(input.attribute);
    const accessory = accessoryFor(s, attribute);
    const mine: Check2Input = {
      attribute,
      value: s.attributes[attribute],
      specialty: this.specialtyOf(c, input, notes),
      gear: accessory ? { name: accessory.name, bonus: accessory.bonus } : null,
      modifier: this.modifierOf(input, notes),
      assisted: false,
      penalties: this.penalties2(c),
      boost: this.takeBoost(c, s),
    };
    const reason = text(input.reason, 60) || '对抗';
    let otherName: string;
    let shownName: string;
    let other: CheckResult;
    let otherCharacter: Character | null = null;
    if (input.opponent_character !== undefined && input.opponent_character !== null) {
      otherCharacter = this.character(input.opponent_character);
      if (otherCharacter.id === c.id) throw new ToolError('不能和自己对抗');
      if (otherCharacter.dead) throw new ToolError(`${otherCharacter.name}已经死了`);
      const os = this.state(otherCharacter);
      const attr = this.attributeOf2(input.opponent_attribute);
      const acc = accessoryFor(os, attr);
      otherName = otherCharacter.name;
      shownName = otherCharacter.name;
      other = check2(
        { attribute: attr, value: os.attributes[attr], specialty: null, gear: acc ? { name: acc.name, bonus: acc.bonus } : null, modifier: 0, assisted: false, penalties: this.penalties2(otherCharacter) },
        this.rng,
      );
    } else {
      const npc = this.scenario.npcs.find((n) => n.key === input.opponent_npc);
      if (!npc) throw new ToolError(`没有这个 NPC：${String(input.opponent_npc)}。对手是 NPC 时填 opponent_npc（NPC 的 key）和 opponent_bonus`);
      const max = 3 + (this.level - 1);
      let bonus = Number.isInteger(input.opponent_bonus) ? (input.opponent_bonus as number) : 0;
      if (bonus < -1 || bonus > max) {
        bonus = Math.max(-1, Math.min(max, bonus));
        notes.push(`对手加值超出范围，按 ${bonus} 算`);
      }
      otherName = npc.name;
      shownName = text(input.opponent_label, 12) || '对手';
      const dice = roll2d6(this.rng);
      const parts = [{ label: '骰子', value: dice[0] + dice[1] }, ...(bonus ? [{ label: '本事', value: bonus }] : [])];
      const total = parts.reduce((sum, p) => sum + p.value, 0);
      other = { dice, total, outcome: outcomeFor(dice[0], dice[1], total), parts };
    }
    const winnerOf = (r: CheckResult): 'a' | 'b' | 'tie' => (r.total > other.total ? 'a' : other.total > r.total ? 'b' : 'tie');
    const first = check2(mine, this.rng);
    const firstWinner = winnerOf(first);
    const { result, help } = this.petReroll(c, attribute, mine, first, (r) => winnerOf(r) === 'b');
    const winner = winnerOf(result);
    const firstView = { dice: first.dice, total: first.total, outcome: first.outcome, winner: firstWinner };
    this.rolls.push({
      characterId: c.id,
      attribute,
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
      attribute: ATTRIBUTE2_NAME[attribute],
      dice: result.dice,
      parts: publicParts(result, mine.penalties.filter((p) => p.value)),
      total: result.total,
      outcome: result.outcome,
      skin: this.skins.get(c.id) ?? null,
      versus: {
        who: shownName,
        dice: other.dice,
        parts: other.parts,
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

  // ----- 状态、生命值、精神值 -----

  private updateCharacter2(input: Input): ToolResult {
    const { c } = this.alive(input.character);
    const report: string[] = [];
    for (const raw of Array.isArray(input.add_conditions) ? input.add_conditions : []) {
      const o = (raw && typeof raw === 'object' ? raw : {}) as Input;
      const name = text(o.name, 10);
      if (!name) continue;
      const penalty = Number.isInteger(o.penalty) ? Math.max(-2, Math.min(0, o.penalty as number)) : 0;
      c.conditions = [...c.conditions.filter((x) => x.name !== name), { name, effect: text(o.effect, 60), penalty }];
      this.change(c, `状态：${name}${text(o.effect, 60) ? `（${text(o.effect, 60)}）` : ''}`);
      report.push(`加上状态「${name}」`);
    }
    for (const raw of Array.isArray(input.remove_conditions) ? input.remove_conditions : []) {
      const name = text(raw, 10);
      if (!c.conditions.some((x) => x.name === name)) continue;
      c.conditions = c.conditions.filter((x) => x.name !== name);
      this.change(c, `不再：${name}`);
      report.push(`去掉状态「${name}」`);
    }
    for (const raw of Array.isArray(input.add_items) ? input.add_items : []) {
      const item = text(raw, 20);
      if (!item || c.items.length >= 30) continue;
      if (typeof raw === 'string' && [...raw.trim()].length > 20) report.push(`「${raw.trim()}」太长，只记下了前 20 个字「${item}」：物品名写短一点，来历写进叙述`);
      c.items = [...c.items, item];
      this.change(c, `得到：${item}`);
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
      this.change(c, `失去：${item}`);
      report.push(`失去「${item}」`);
    }
    this.changed.add(c.id);
    return ok({ character: c.name, changes: report.length ? report : ['没有变化'], now: this.view(c) });
  }

  /** 给主持 AI 看的角色现状。 */
  private view(c: Character) {
    const s = this.state(c);
    return {
      hp: `${s.hp}/${s.hpMax}`,
      mp: `${s.mp}/${s.mpMax}`,
      ...(s.dying !== null ? { dying: `倒地濒死，再结算 ${s.dying} 次这里的行动还没人救就会死` } : {}),
      ...(s.lostControl ? { lost_control: '精神值到了 0，下一次行动失控' } : {}),
      conditions: c.conditions.map((x) => x.name),
      items: c.items,
      dead: c.dead,
    };
  }

  /** 扣生命值：处理倒地、死亡（房主选了不会死的停在濒死）。 */
  private damage(c: Character, s: V2State, amount: number, why: string): string {
    const r = applyHp(s, -amount, this.allowDeath);
    this.changed.add(c.id);
    if (r.died) {
      c.dead = true;
      s.dying = null;
      this.change(c, '死亡');
      this.events.push(`${c.name}倒下了，再也没有起来`);
      return `${c.name}死了`;
    }
    this.change(c, `生命值 ${r.before} → ${r.after}（${why}）`);
    if (r.dying) {
      this.downed.add(c.id);
      this.events.push(`${c.name}倒地了`);
      return `${c.name}倒地濒死`;
    }
    return `${c.name}生命值 ${r.before} → ${r.after}`;
  }

  private mind(c: Character, s: V2State, amount: number, why: string): string {
    const r = applyMp(s, -amount);
    this.change(c, `精神值 ${r.before} → ${r.after}（${why}）`);
    if (r.lostControl) {
      this.events.push(`${c.name}的心神崩溃了`);
      return `${c.name}精神值到了 0，下一次行动失控`;
    }
    return `${c.name}精神值 ${r.before} → ${r.after}`;
  }

  private hurt(input: Input): ToolResult {
    const { c, s } = this.alive(input.character);
    const severity = SEVERITY_KEYS.includes(input.severity as Severity) ? (input.severity as Severity) : null;
    if (!severity) throw new ToolError('severity 只能是 light、medium、heavy');
    const why = text(input.reason, 30) || '受伤';
    const raw = rollSeverity(severity, levelDamageBonus(this.level), this.rng);
    if (input.target === 'mp') {
      const result = this.mind(c, s, raw, why);
      return ok({ character: c.name, lost_mp: raw, result, now: this.view(c) });
    }
    const armor = input.armor === false ? 0 : this.armorValue(s);
    const amount = armor ? afterArmor(raw, armor) : raw;
    const result = this.damage(c, s, amount, why);
    return ok({ character: c.name, rolled: raw, armor_blocked: raw - amount, lost_hp: amount, result, now: this.view(c) });
  }

  private heal(input: Input): ToolResult {
    const { c, s } = this.alive(input.character);
    const why = text(input.reason, 30) || '恢复';
    const hp = Number.isInteger(input.hp) ? Math.max(0, Math.min(20, input.hp as number)) : 0;
    const mp = Number.isInteger(input.mp) ? Math.max(0, Math.min(20, input.mp as number)) : 0;
    if (!hp && !mp) throw new ToolError('hp 和 mp 至少填一个（1～20）');
    const report: string[] = [];
    if (hp) {
      const wasDying = s.dying !== null;
      const r = applyHp(s, hp, this.allowDeath);
      this.change(c, `生命值 ${r.before} → ${r.after}（${why}）`);
      report.push(`生命值 ${r.before} → ${r.after}`);
      if (wasDying && s.dying === null) {
        this.events.push(`${c.name}被救了回来`);
        report.push('从濒死被救回来了');
      }
    }
    if (mp) {
      const before = s.mp;
      s.mp = Math.min(s.mpMax, s.mp + mp);
      if (s.mp > 0) s.lostControl = false;
      this.change(c, `精神值 ${before} → ${s.mp}（${why}）`);
      report.push(`精神值 ${before} → ${s.mp}`);
    }
    return ok({ character: c.name, changes: report, now: this.view(c) });
  }

  // ----- 战斗 -----

  private enemyFrom(key: string, n: number): EnemyState {
    const def = enemiesOf(this.scenario).find((e) => e.key === key);
    if (!def) throw new ToolError(`剧本里没有敌人「${key}」，有的是：${enemiesOf(this.scenario).map((e) => `${e.key}=${e.name}`).join('、')}`);
    const stats = enemyStats(def.tier, this.level, this.size, def.tweak);
    const boss = this.scenario.dungeon?.boss;
    return {
      id: `${key}-${n}`,
      key,
      name: def.name,
      tier: def.tier,
      hp: stats.hp,
      hpMax: stats.hp,
      defense: stats.defense,
      attack: stats.attack,
      maxSeverity: stats.maxSeverity,
      damageBonus: stats.damageBonus,
      abilities: def.abilities,
      defeated: false,
      shielded: !!boss && boss.enemy === key && !!boss.shield,
    };
  }

  private startCombat(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const location = actor.location;
    if (!location) throw new ToolError('行动的角色不在任何地点，没法开打');
    let spec: { enemy: string; count: number }[] = [];
    let encounterKey: string | null = null;
    if (typeof input.encounter === 'string' && input.encounter) {
      const enc = this.scenario.dungeon?.encounters.find((e) => e.key === input.encounter);
      if (!enc) throw new ToolError(`没有这个遇敌：${input.encounter}`);
      encounterKey = enc.key;
      spec = enc.enemies;
    }
    for (const raw of Array.isArray(input.enemies) ? input.enemies : []) {
      const o = (raw && typeof raw === 'object' ? raw : {}) as Input;
      const count = Number.isInteger(o.count) ? Math.max(1, Math.min(6, o.count as number)) : 1;
      if (typeof o.enemy === 'string') spec.push({ enemy: o.enemy, count });
    }
    if (!spec.length) throw new ToolError('要么填 encounter（遇敌的 key），要么填 enemies（敌人的 key 和数量）');
    const existing = this.combatAt(location);
    const fight: CombatState = existing ?? { location, round: 1, order: [], enemies: [] };
    const added: EnemyState[] = [];
    // 站位（V1.0.x）：敌人出现在哪
    const spot = matchSpot(this.scenario.locations.find((l) => l.key === location), input.spot);
    for (const { enemy, count } of spec) {
      for (let i = 0; i < count; i++) {
        const n = fight.enemies.filter((e) => e.key === enemy).length + added.filter((e) => e.key === enemy).length + 1;
        added.push({ ...this.enemyFrom(enemy, n), ...(spot ? { spot } : {}) });
      }
    }
    if (fight.enemies.length + added.length > 12) throw new ToolError('一场战斗里最多 12 个敌人');
    fight.enemies.push(...added);
    // 先后手：新来的敌人掷；第一次开打时，在场的角色也掷
    const order = [...fight.order];
    for (const e of added) {
      const [a, b] = roll2d6(this.rng);
      order.push({ id: e.id, name: e.name, side: 'enemy', initiative: a + b + enemyStats(e.tier, this.level, this.size).initiative });
    }
    for (const c of this.characters.values()) {
      if (c.dead || !c.v2 || c.location !== location || order.some((o) => o.id === `c${c.id}`)) continue;
      const [a, b] = roll2d6(this.rng);
      order.push({ id: `c${c.id}`, name: c.name, side: 'ally', initiative: a + b + c.v2.attributes.agility });
    }
    order.sort((x, y) => y.initiative - x.initiative || (x.side === 'ally' ? -1 : 1));
    fight.order = order;
    this.world.combats[location] = fight;
    // 打过几场（没写遇敌的记在「*」下）：结算「逃出来」时看这一局是不是真的闯过
    const tally = encounterKey ?? '*';
    this.world.encountered[tally] = (this.world.encountered[tally] ?? 0) + 1;
    this.worldChanged = true;
    const names = added.map((e) => e.name);
    this.events.push(`${existing ? '又来了' : '开打'}：${[...new Set(names)].map((n) => `${n}${names.filter((x) => x === n).length > 1 ? ` ×${names.filter((x) => x === n).length}` : ''}`).join('、')}`);
    this.events.push(`先后手：${order.map((o) => `${o.name} ${o.initiative}`).join('、')}`);
    return ok({
      note: text(input.note, 60),
      enemies: fight.enemies.map((e) => ({
        id: e.id,
        name: e.name,
        tier: e.tier,
        hp: `${e.hp}/${e.hpMax}`,
        defense: e.defense,
        attack: e.attack,
        max_severity: e.maxSeverity,
        abilities: e.abilities,
        spot: spotName(e.spot),
        ...(e.shielded ? { shielded: `护盾还在，打不动：${this.scenario.dungeon?.boss.shield ?? ''}` } : {}),
        ...(e.defeated ? { defeated: true } : {}),
      })),
      order: order.map((o) => `${o.name}（${o.side === 'ally' ? '角色' : o.id}）${o.initiative}`),
      how_to: '按先后手叙述：比角色先的敌人先动手（用 enemy_attack）；之后每次结算一个角色的行动，和他交手的敌人通常各还手一次。敌人倒下、逃走或角色脱身后用 end_combat。',
    });
  }

  private attack(input: Input): ToolResult {
    const { c, s } = this.alive(input.character);
    if (s.dying !== null) throw new ToolError(`${c.name}倒地濒死了，不能攻击`);
    const fight = this.combatAt(c.location);
    const enemy = this.enemyIn(fight, input.enemy);
    if (enemy.defeated) throw new ToolError(`${enemy.name}（${enemy.id}）已经倒下了`);
    const notes: string[] = [];
    // 意志攻击只有技能（镇魂咒）用：不加武器
    const attribute: Attribute2 = input.attribute === 'agility' ? 'agility' : input.attribute === 'will' ? 'will' : 'strength';
    const weapon = weaponOf(s);
    const weaponBonus = weapon && weapon.attribute === attribute ? weapon.bonus : 0;
    if (weapon && !weaponBonus && attribute !== 'will') notes.push(`${weapon.name}加的是${weapon.attribute ? ATTRIBUTE2_NAME[weapon.attribute] : '别的'}攻击，这一下没加武器`);
    // 技能（use_skill）带来的：命中加值、多的伤害、无视几点防御、伤害减半（横扫）
    const skillHit = Number(input.skillHit) || 0;
    const skillDamage = Number(input.skillDamage) || 0;
    const pierce = Number(input.pierce) || 0;
    const halfDamage = input.halfDamage === true;
    // 站位（V1.0.x）：近战够得着的才打得了；意志（法术）在这个地点哪里都打得到；
    // 弓弩这类远程打站在掩体里的防御 +1，身边有敌人时 -1
    const ranged = input.ranged === true || attribute === 'will';
    if (!ranged) this.meleeReach(c, enemy);
    const physicalRanged = ranged && attribute !== 'will';
    const place = this.scenario.locations.find((l) => l.key === c.location);
    const cover = physicalRanged && spotFlags(place, enemy.spot).cover ? 1 : 0;
    if (cover) notes.push(`${enemy.name}站在${spotName(enemy.spot)}，有掩体：防御 +1`);
    const crowded = physicalRanged && fight!.enemies.some((e) => !e.defeated && sameSpot(e.spot, c.spot));
    const defense = Math.max(0, enemy.defense - pierce) + cover;
    const boss = this.scenario.dungeon?.boss;
    const weakness = input.weakness === true && !!boss && enemy.key === boss.enemy;
    if (input.weakness === true && !weakness) notes.push('弱点只对首领有用，没有算');
    const checkInput: Check2Input = {
      attribute,
      value: s.attributes[attribute],
      specialty: this.specialtyOf(c, input, notes),
      gear: weapon && weaponBonus ? { name: weapon.name, bonus: weaponBonus } : null,
      modifier: this.modifierOf(input, notes),
      assisted: input.assisted === true,
      penalties: this.penalties2(c),
      weakness: weakness ? WEAKNESS_BONUS : 0,
      boost: this.takeBoost(c, s),
      extra: [...(skillHit ? [{ label: '技能', value: skillHit }] : []), ...(crowded ? [{ label: '身边有敌人', value: -1 }] : [])],
    };
    const hits = (r: CheckResult) => r.outcome === 'critical' || (r.outcome !== 'fumble' && r.total >= defense);
    const first = check2(checkInput, this.rng);
    const { result, help } = this.petReroll(c, attribute, checkInput, first, (r) => !hits(r));
    const hit = hits(result);
    let damage: number | null = null;
    const report: string[] = [];
    if (hit) {
      damage = attackDamage(weaponBonus, result.outcome === 'critical', weakness, this.rng) + skillDamage;
      if (halfDamage) damage = Math.max(1, Math.ceil(damage / 2));
      if (enemy.shielded) {
        report.push(`打中了，但${enemy.name}的护盾挡住了，一点伤都没有`);
        damage = 0;
      } else {
        const before = enemy.hp;
        enemy.hp = Math.max(0, enemy.hp - damage);
        report.push(`${enemy.name}生命值 ${before} → ${enemy.hp}`);
        if (enemy.hp === 0) {
          enemy.defeated = true;
          this.events.push(`${enemy.name}倒下了`);
          report.push(`${enemy.name}倒下了`);
        }
      }
      this.worldChanged = true;
    } else {
      report.push('没打中');
    }
    const reason = text(input.reason, 60) || '攻击';
    const firstView = { dice: first.dice, total: first.total, outcome: first.outcome };
    this.rolls.push({
      characterId: c.id,
      attribute,
      modifier: checkInput.modifier,
      result,
      hidden: false,
      detail: { reason, attack: { enemy: enemy.id, defense, hit, damage }, ...(help ? { petHelp: { pet: help.pet, first: firstView } } : {}) },
      petHelp: !!help,
      petSaved: !!help && hit,
    });
    this.cards.push({
      who: c.name,
      reason,
      attribute: ATTRIBUTE2_NAME[attribute],
      dice: result.dice,
      parts: publicParts(result, checkInput.penalties.filter((p) => p.value)),
      total: result.total,
      outcome: result.outcome,
      skin: this.skins.get(c.id) ?? null,
      combat: { kind: 'attack', target: enemy.name, defense, hit, damage, ...(weakness ? { weakness: true } : {}) },
      ...(help ? { petHelp: { pet: help.pet, first: firstView } } : {}),
    });
    const left = fight!.enemies.filter((e) => !e.defeated);
    return ok({
      character: c.name,
      total: result.total,
      breakdown: describeParts(result),
      defense,
      hit,
      damage,
      result: report,
      enemy: { id: enemy.id, hp: `${enemy.hp}/${enemy.hpMax}`, defeated: enemy.defeated, shielded: enemy.shielded },
      enemies_left: left.map((e) => `${e.id}=${e.name}（${e.hp}/${e.hpMax}）`),
      ...(left.length === 0 ? { tip: '敌人都倒下了：叙述完用 end_combat 结束战斗' } : {}),
      ...(help ? { pet_help: petHelpNote(help.pet, `第一次${first.total}，${hits(first) ? '打中' : '没打中'}；重掷以后${result.total}，${hit ? '打中' : '没打中'}`) } : {}),
      notes,
    });
  }

  private enemyAttack(input: Input): ToolResult {
    const { c, s } = this.alive(input.character);
    const fight = this.combatAt(c.location);
    const enemy = this.enemyIn(fight, input.enemy);
    if (enemy.defeated) throw new ToolError(`${enemy.name}（${enemy.id}）已经倒下了`);
    const notes: string[] = [];
    let severity = SEVERITY_KEYS.includes(input.severity as Severity) ? (input.severity as Severity) : 'light';
    if (SEVERITY_ORDER[severity] > SEVERITY_ORDER[enemy.maxSeverity]) {
      notes.push(`${enemy.name}最多造成${SEVERITY[enemy.maxSeverity].name}伤，按${SEVERITY[enemy.maxSeverity].name}算`);
      severity = enemy.maxSeverity;
    }
    if (severity === 'heavy' && !text(input.ability, 40)) notes.push('重伤一般是首领用本事时才有，下次写上用的哪个本事');
    // 站位（V1.0.x）：近战要站在一起；远程打站在掩体里的角色，防御 +1；身边站着角色时远程 -1
    const ranged = input.ranged === true;
    if (!ranged && !sameSpot(enemy.spot, c.spot)) {
      // 刚从它身边走开的：趁机打的这一下照样打得到
      if (this.takeFreeHit(c.id, enemy.id)) notes.push(`${c.name}刚从${enemy.name}身边走开：这一下是趁机打的`);
      else throw new ToolError(`${enemy.name}（${enemy.id}）站在${spotName(enemy.spot)}，${c.name}在${spotName(c.spot)}：近战够不着。先用 set_spot（enemy）让它走过去；用的是远程的本事就填 ranged=true`);
    }
    const cover = ranged && spotFlags(this.scenario.locations.find((l) => l.key === c.location), c.spot).cover ? 1 : 0;
    if (cover) notes.push(`${c.name}站在${spotName(c.spot)}，有掩体：防御 +1`);
    const crowded = ranged && [...this.characters.values()].some((x) => !x.dead && (x.v2?.dying ?? null) === null && x.location === fight!.location && sameSpot(x.spot, enemy.spot));
    const modifier = this.modifierOf(input, notes);
    const dice = roll2d6(this.rng);
    const parts = [
      { label: '骰子', value: dice[0] + dice[1] },
      ...(enemy.attack ? [{ label: '攻击', value: enemy.attack }] : []),
      ...(modifier ? [{ label: '情境修正', value: modifier }] : []),
      ...(crowded ? [{ label: '身边有敌人', value: -1 }] : []),
    ];
    const total = parts.reduce((sum, p) => sum + p.value, 0);
    const outcome = outcomeFor(dice[0], dice[1], total);
    const defense = defenseOf(s) + cover;
    // 倒地的人躲不开
    const hit = outcome === 'critical' || (outcome !== 'fumble' && (s.dying !== null || total >= defense));
    let damage: number | null = null;
    let armorBlocked = 0;
    let result = `${enemy.name}没打中${c.name}`;
    if (hit) {
      const raw = rollSeverity(severity, enemy.damageBonus, this.rng);
      const armor = outcome === 'critical' ? 0 : this.armorValue(s);
      damage = armor ? afterArmor(raw, armor) : raw;
      armorBlocked = raw - damage;
      result = this.damage(c, s, damage, `${enemy.name}${text(input.ability, 20) ? `的${text(input.ability, 20)}` : ''}`);
    }
    const ability = text(input.ability, 40);
    this.cards.push({
      who: enemy.name,
      reason: ability || '攻击',
      attribute: '攻击',
      dice,
      parts,
      total,
      outcome,
      skin: null,
      combat: { kind: 'enemy', target: c.name, defense, hit, damage, ...(armorBlocked ? { armor: armorBlocked } : {}) },
    });
    return ok({
      enemy: enemy.name,
      total,
      defense,
      hit,
      damage,
      armor_blocked: armorBlocked,
      result,
      character: this.view(c),
      notes,
    });
  }

  private updateEnemy(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const fight = this.combatAt(actor.location);
    const enemy = this.enemyIn(fight, input.enemy);
    const note = text(input.note, 60);
    const report: string[] = [];
    if (typeof input.shielded === 'boolean' && input.shielded !== enemy.shielded) {
      enemy.shielded = input.shielded;
      report.push(input.shielded ? '护盾又起来了' : '护盾破了');
      this.events.push(`${enemy.name}的护盾${input.shielded ? '又起来了' : '破了'}`);
    }
    if (input.gone === true && !enemy.defeated) {
      enemy.defeated = true;
      enemy.fled = true;
      report.push('逃走了，不再参战（没有打倒）');
      this.events.push(`${enemy.name}退出了战斗${note ? `（${note}）` : ''}`);
    }
    this.worldChanged = true;
    return ok({
      enemy: enemy.id,
      changes: report.length ? report : ['没有变化'],
      now: { hp: `${enemy.hp}/${enemy.hpMax}`, shielded: enemy.shielded, in_fight: !enemy.defeated, ...(enemy.fled ? { fled: true } : {}) },
    });
  }

  private endCombat(input: Input): ToolResult {
    const actor = this.characters.get(this.actorId)!;
    const location = actor.location;
    if (!location || !this.world.combats[location]) throw new ToolError('这里没有在打仗');
    delete this.world.combats[location];
    this.worldChanged = true;
    this.clearWards(location);
    this.events.push(`战斗结束${text(input.note, 40) ? `：${text(input.note, 40)}` : ''}`);
    return ok({ ended: true });
  }

  /**
   * 打着仗离开了那个地点：从那场战斗的先后手里拿掉，身上的护身散了。
   * 那里一个同伴都不剩了，那场战斗就结束（敌人留在原地，没倒下的以后还会遇上）。
   */
  private leftFight(c: Character, from: string, result: ToolResult): ToolResult {
    const fight = this.combatAt(from);
    const at = fight ? fight.order.findIndex((o) => o.id === `c${c.id}`) : -1;
    if (!fight || at < 0) return result;
    fight.order.splice(at, 1);
    this.worldChanged = true;
    if (c.v2?.ward) {
      c.v2.ward = 0;
      this.changed.add(c.id);
    }
    const anyoneLeft = [...this.characters.values()].some((x) => !x.dead && x.location === from);
    const place = this.scenario.locations.find((l) => l.key === from)?.name ?? from;
    let combat = `${c.name}离开了「${place}」的战斗`;
    if (anyoneLeft) {
      this.events.push(`${c.name}离开了战斗`);
    } else {
      delete this.world.combats[from];
      this.clearWards(from);
      this.events.push(`大家都离开了「${place}」，那里的战斗结束了`);
      combat += '；那里没有同伴了，那场战斗结束（敌人留在原地，没倒下的以后还会遇上）';
    }
    return ok({ ...(JSON.parse(result.content) as Record<string, unknown>), combat });
  }

  /** 战斗结束：这里的人身上的护身（「金钟罩」之类）散了。 */
  private clearWards(location: string) {
    for (const x of this.characters.values()) {
      if (x.v2?.ward && x.location === location) {
        x.v2.ward = 0;
        this.changed.add(x.id);
      }
    }
  }

  // ----- 道具、宝物 -----

  private useItem(input: Input): ToolResult {
    const { c, s } = this.alive(input.character);
    const item = consumableOf(typeof input.item === 'string' ? input.item : '');
    if (!item) throw new ToolError(`没有这种道具：${String(input.item)}，只有 ${CONSUMABLE_KEYS.join('、')}`);
    // 先用带进来的；没有就用这一局捡到的（捡到的用掉了就带不出去了）
    const fromBag = (s.bag[item.key] ?? 0) > 0;
    const lootIndex = fromBag ? -1 : s.loot.findIndex((l) => l.kind === 'item' && l.item === item.key && l.count > 0);
    if (!fromBag && lootIndex < 0) {
      throw new ToolError(`${c.name}没有${item.name}（带进来的：${this.bagText(s)}；这一局捡到的道具：${this.lootItemsText(s)}）`);
    }
    if (s.dying !== null) throw new ToolError(`${c.name}倒地濒死了，自己用不了道具；同伴可以喂他喝药水`);
    const report: string[] = [];
    let usedEventPushed = false;
    const npcKey = typeof input.target_npc === 'string' && input.target_npc ? input.target_npc : null;
    if (npcKey && (item.key === 'potion' || item.key === 'clear-pill' || item.key === 'antidote')) {
      const npc = this.scenario.npcs.find((n) => n.key === npcKey);
      if (!npc) throw new ToolError(`没有这个 NPC：${npcKey}`);
      report.push(`给${npc.name}用了${item.name}：NPC 没有生命值记账，效果照剧本和情形写进叙述；状态变了用 update_npc 记下`);
      this.events.push(`${c.name}给${npc.name}用了${item.name}`);
      this.spendItem(c, s, item.key, item.name, fromBag, lootIndex);
      return ok({ character: c.name, item: item.name, target: npc.name, result: report, bag_left: this.bagText(s), loot_items: this.lootItemsText(s) });
    }
    if (item.key === 'potion' || item.key === 'clear-pill' || item.key === 'antidote') {
      const target = input.target_character === undefined || input.target_character === null ? c : this.character(input.target_character);
      if (target.dead) throw new ToolError(`${target.name}已经死了`);
      if (target.id !== c.id && target.location !== c.location) throw new ToolError(`${target.name}不在${c.name}身边`);
      const ts = this.state(target);
      if (item.key === 'potion') {
        const amount = roll2d6Plus(2, this.rng);
        const wasDying = ts.dying !== null;
        const r = applyHp(ts, amount, this.allowDeath);
        this.change(target, `生命值 ${r.before} → ${r.after}（${item.name}）`);
        report.push(`${target.name}生命值 ${r.before} → ${r.after}`);
        if (wasDying) {
          this.events.push(`${target.name}喝下药水醒了过来`);
          report.push('从濒死被救回来了');
        }
      } else if (item.key === 'clear-pill') {
        const amount = roll2d6Plus(2, this.rng);
        const before = ts.mp;
        ts.mp = Math.min(ts.mpMax, ts.mp + amount);
        ts.lostControl = false;
        this.change(target, `精神值 ${before} → ${ts.mp}（${item.name}）`);
        report.push(`${target.name}精神值 ${before} → ${ts.mp}`);
      } else {
        const poisons = target.conditions.filter((x) => x.name.includes('毒'));
        target.conditions = target.conditions.filter((x) => !x.name.includes('毒'));
        if (poisons.length) this.change(target, `不再：${poisons.map((x) => x.name).join('、')}`);
        report.push(poisons.length ? `${target.name}解了${poisons.map((x) => x.name).join('、')}` : `${target.name}身上没有中毒，药白喝了`);
      }
    } else if (item.key === 'smoke') {
      const location = c.location;
      if (!location || !this.world.combats[location]) throw new ToolError('这里没在打仗，烟雾弹用不上');
      delete this.world.combats[location];
      this.worldChanged = true;
      this.clearWards(location);
      this.events.push(`${c.name}扔出烟雾弹，大家脱离了战斗`);
      report.push('脱离了战斗（敌人还在这里，没倒下的以后还会遇上）');
    } else {
      const fight = this.combatAt(c.location);
      const enemy = this.enemyIn(fight, input.target_enemy);
      if (enemy.defeated) throw new ToolError(`${enemy.name}已经倒下了`);
      const boss = this.scenario.dungeon?.boss;
      const weakness = input.weakness === true && !!boss && enemy.key === boss.enemy;
      // 战况按发生的先后写：先扔火油，再写它倒没倒下
      this.events.push(`${c.name}用了${item.name}`);
      usedEventPushed = true;
      let amount = roll2d6Plus(0, this.rng) * (weakness ? 2 : 1);
      if (enemy.shielded) {
        amount = 0;
        report.push(`火油泼在护盾上烧着了，${enemy.name}毫发无伤`);
      } else {
        const before = enemy.hp;
        enemy.hp = Math.max(0, enemy.hp - amount);
        report.push(`${enemy.name}生命值 ${before} → ${enemy.hp}${weakness ? '（用上了弱点）' : ''}`);
        if (enemy.hp === 0) {
          enemy.defeated = true;
          this.events.push(`${enemy.name}倒下了`);
        }
      }
      this.worldChanged = true;
    }
    if (!usedEventPushed) this.events.push(`${c.name}用了${item.name}`);
    this.spendItem(c, s, item.key, item.name, fromBag, lootIndex);
    return ok({ character: c.name, item: item.name, result: report, bag_left: this.bagText(s), loot_items: this.lootItemsText(s) });
  }

  /** 用掉一个道具：带进来的从背包里扣（这一局结束时从账号里扣掉），捡到的从这一局捡到的东西里扣。 */
  private spendItem(c: Character, s: V2State, key: ConsumableKey, name: string, fromBag: boolean, lootIndex: number) {
    if (fromBag) {
      s.bag[key] = (s.bag[key] ?? 0) - 1;
      if (!s.bag[key]) delete s.bag[key];
      this.itemUses.push({ characterId: c.id, item: key });
      this.change(c, `用掉：${name}`);
    } else {
      const entry = s.loot[lootIndex];
      if (entry && entry.kind === 'item') {
        entry.count -= 1;
        if (entry.count <= 0) s.loot.splice(lootIndex, 1);
      }
      this.change(c, `用掉：${name}（这一局捡到的）`);
    }
    this.changed.add(c.id);
  }

  /** 这一局捡到的道具（能当场用的）。 */
  private lootItemsText(s: V2State): string {
    const list = s.loot.flatMap((l) => (l.kind === 'item' && l.count > 0 ? [`${consumableOf(l.item)?.name ?? l.item}×${l.count}`] : []));
    return list.join('、') || '没有';
  }

  private bagText(s: V2State): string {
    const list = Object.entries(s.bag)
      .filter(([, n]) => (n ?? 0) > 0)
      .map(([k, n]) => `${consumableOf(k)?.name ?? k}×${n}`);
    return list.join('、') || '什么都没带';
  }

  private giveLoot(input: Input): ToolResult {
    const { c, s } = this.alive(input.character);
    const d = this.scenario.dungeon;
    if (!d) throw new ToolError('这一局不是地下城，没有宝物');
    const entry = d.loot.find((l) => l.key === input.loot);
    if (!entry) throw new ToolError(`没有这处宝物：${String(input.loot)}`);
    const taken = this.world.lootTaken[entry.key];
    if (taken !== undefined) throw new ToolError(`这处宝物已经被${this.characters.get(taken)?.name ?? '别人'}拿走了`);
    if (entry.at && c.location !== entry.at) {
      const place = this.scenario.locations.find((l) => l.key === entry.at)?.name ?? entry.at;
      throw new ToolError(`这一局这处宝物藏在「${place}」，${c.name}不在那里`);
    }
    // 没写明是哪一门的秘籍：主持人可以挑一门和剧本描写对得上的（这个角色还没学会的）
    let wanted: string | null = null;
    if (entry.reward.kind === 'manual' && typeof input.skill === 'string' && input.skill) {
      const skill = skillOf(input.skill);
      if (!skill) throw new ToolError(`没有这门技能：${input.skill}，只有 ${SKILLS.map((k) => `${k.key}（${k.name}）`).join('、')}`);
      wanted = skill.key;
    }
    const item = wanted ? this.manualOf(wanted) : this.rollLoot(entry.reward, c);
    s.loot.push(item.loot);
    this.world.lootTaken[entry.key] = c.id;
    this.worldChanged = true;
    this.change(c, `捡到：${item.label}`);
    this.events.push(`${c.name}找到了${item.label}`);
    return ok({
      character: c.name,
      found: item.label,
      detail: item.detail,
      note:
        item.loot.kind === 'item'
          ? '道具这一局就能用（use_item）；没用掉的活着走出去才能带走'
          : '活着走出去才能把它带走；装备这一局不能马上穿上，带出去以后在角色卡上换',
    });
  }

  /** 按宝物写的种类和难度定具体是什么。 */
  private rollLoot(reward: NonNullable<Scenario['dungeon']>['loot'][number]['reward'], c: Character): { loot: LootItem; label: string; detail: string } {
    if (reward.kind === 'item') {
      const name = consumableOf(reward.item)?.name ?? reward.item;
      return { loot: { kind: 'item', item: reward.item, count: reward.count }, label: `${name}×${reward.count}`, detail: consumableOf(reward.item)?.effect ?? '' };
    }
    if (reward.kind === 'crystals') {
      return { loot: { kind: 'crystals', amount: reward.amount }, label: `${reward.amount} 颗龙晶`, detail: '一把能换钱的晶石（叙述里照剧本写成找到的财物）' };
    }
    if (reward.kind === 'manual') return this.rollManual(c, null);
    if (reward.kind === 'legendary') {
      const owned = this.ownedLegendary.get(c.userId) ?? new Set<string>();
      const dropped = new Set(
        [...this.characters.values()].flatMap((x) => (x.v2?.loot ?? []).filter((l) => l.kind === 'gear' && l.rarity === 'legendary').map((l) => (l as { base: string }).base)),
      );
      const choices = LEGENDARY_GEAR.filter((g) => !owned.has(g.key) && !dropped.has(g.key));
      if (choices.length) {
        const g = choices[this.pick(choices.length)];
        return {
          loot: { kind: 'gear', base: g.key, rarity: 'legendary' },
          label: `传奇装备「${g.name}」`,
          detail: `${g.use}；特别的本事：${g.ability}`,
        };
      }
      // 传奇的都有了：换成一件史诗装备
      return this.rollGear(undefined, 'epic');
    }
    return this.rollGear(reward.slot, reward.rarity);
  }

  /** 一本秘籍：这个角色还没学会、这一局也还没捡到的技能（attribute 给了就挑这一项的）。 */
  private manualOf(key: string): { loot: LootItem; label: string; detail: string } {
    const skill = skillOf(key)!;
    return { loot: { kind: 'manual', skill: skill.key }, label: `秘籍《${skill.name}》`, detail: skill.text };
  }

  private rollManual(c: Character, attribute: Attribute2 | null): { loot: LootItem; label: string; detail: string } {
    const s = this.state(c);
    const have = new Set([...s.skills, ...s.loot.filter((l) => l.kind === 'manual').map((l) => (l as { skill: string }).skill)]);
    let choices = SKILLS.filter((k) => !have.has(k.key) && (!attribute || k.attribute === attribute));
    if (!choices.length) choices = SKILLS.filter((k) => !have.has(k.key));
    if (!choices.length) return this.rollGear(undefined, 'epic');
    const skill = choices[this.pick(choices.length)];
    return { loot: { kind: 'manual', skill: skill.key }, label: `秘籍《${skill.name}》`, detail: skill.text };
  }

  /** 一件装备：slot 是剧本写的大类（weapon 主手武器、armor 护甲和盾牌、accessory 加检定的），不写是哪一种都行。 */
  private rollGear(slot: string | undefined, rarity: Rarity | undefined): { loot: LootItem; label: string; detail: string } {
    const bases = GEAR_BASES.filter((b) => !slot || b.slot === slot);
    const base = bases[this.pick(bases.length)];
    let r: Rarity = rarity ?? 'common';
    if (!rarity) {
      const odds = rarityOdds(this.level);
      let roll = this.pick(100);
      for (const k of ['common', 'fine', 'rare', 'epic'] as const) {
        if (roll < odds[k]) {
          r = k;
          break;
        }
        roll -= odds[k];
      }
    }
    const view = gearView(0, base.key, r)!;
    return {
      loot: { kind: 'gear', base: base.key, rarity: r },
      label: `${view.name}（${RARITY_LABEL[r]}）`,
      detail: `${base.use}；${GEAR_PART_LABEL[view.part]}，${gearEffectText(view)}`,
    };
  }

  // ----- 技能、奇遇 -----

  private useSkill(input: Input): ToolResult {
    const { c, s } = this.alive(input.character);
    const skill = skillOf(typeof input.skill === 'string' ? input.skill.trim() : '');
    if (!skill || !s.skills.includes(skill.key)) {
      const known = s.skills.map((k) => skillOf(k)).filter((k): k is Skill => !!k);
      throw new ToolError(`${c.name}不会这门技能。他会的：${known.map((k) => `${k.key}=${k.name}`).join('、') || '没有'}`);
    }
    if (s.dying !== null) throw new ToolError(`${c.name}倒地濒死了，用不了技能`);
    if (s.mp < skill.cost) throw new ToolError(`${c.name}的精神值只有 ${s.mp}，用「${skill.name}」要 ${skill.cost}`);
    const e = skill.effect;
    const report: string[] = [];
    const target = (() => {
      const t = input.target_character === undefined || input.target_character === null ? c : this.character(input.target_character);
      if (t.dead) throw new ToolError(`${t.name}已经死了`);
      if (t.id !== c.id && t.location !== c.location) throw new ToolError(`${t.name}不在${c.name}身边`);
      return t;
    })();
    const ally = () => target;
    // 先检查用得了，再扣精神值（用不了的不扣）
    if (e.type === 'strike') {
      const enemy = this.enemyIn(this.combatAt(c.location), input.target_enemy);
      if (enemy.defeated) throw new ToolError(`${enemy.name}（${enemy.id}）已经倒下了`);
      if (e.melee || input.ranged !== true) this.meleeReach(c, enemy);
    }
    if ((e.type === 'sweep' || e.type === 'scare') && !this.combatAt(c.location)) throw new ToolError('这里没有在打仗');
    const before = s.mp;
    s.mp -= skill.cost;
    this.change(c, `精神值 ${before} → ${s.mp}（${skill.name}）`);
    this.events.push(`${c.name}使出「${skill.name}」`);
    let extra: Record<string, unknown> = {};
    if (e.type === 'strike') {
      const r = this.attack({
        ...input,
        attribute: e.attribute,
        enemy: input.target_enemy,
        // 用技能打首领时一样能用上这一局的弱点（和 attack 一样由主持人判断）
        weakness: input.weakness === true,
        ranged: !e.melee && input.ranged === true,
        skillHit: e.hit,
        skillDamage: e.damage,
        pierce: e.pierce,
        reason: `${skill.name}：${text(input.reason, 40)}`,
      });
      extra = JSON.parse(r.content) as Record<string, unknown>;
    } else if (e.type === 'sweep') {
      const fight = this.combatAt(c.location)!;
      const targets = fight.enemies.filter((x) => !x.defeated);
      const hits: string[] = [];
      for (const enemy of targets) {
        const r = this.attack({ character: c.id, enemy: enemy.id, attribute: e.attribute === 'will' ? 'will' : e.attribute, modifier: 0, halfDamage: true, ranged: true, reason: skill.name });
        const d = JSON.parse(r.content) as { hit: boolean; damage: number | null };
        hits.push(`${enemy.name}${d.hit ? `中了（${d.damage ?? 0}）` : '躲开了'}`);
      }
      report.push(hits.join('、'));
    } else if (e.type === 'heal') {
      const t = ally();
      const ts = this.state(t);
      const amount = roll2d6Plus(e.bonus, this.rng);
      const wasDying = ts.dying !== null;
      const r = applyHp(ts, amount, this.allowDeath);
      this.change(t, `生命值 ${r.before} → ${r.after}（${skill.name}）`);
      report.push(`${t.name}生命值 ${r.before} → ${r.after}${wasDying ? '，从濒死被救回来了' : ''}`);
      if (wasDying) this.events.push(`${t.name}被救了回来`);
    } else if (e.type === 'restore') {
      const t = ally();
      const ts = this.state(t);
      const amount = roll2d6Plus(e.bonus, this.rng);
      const was = ts.mp;
      ts.mp = Math.min(ts.mpMax, ts.mp + amount);
      ts.lostControl = false;
      this.change(t, `精神值 ${was} → ${ts.mp}（${skill.name}）`);
      report.push(`${t.name}精神值 ${was} → ${ts.mp}`);
    } else if (e.type === 'boost') {
      const targets = e.all ? [...this.characters.values()].filter((x) => !x.dead && x.v2 && x.location === c.location && x.id !== c.id) : [ally()];
      for (const t of targets) {
        t.v2!.boost = Math.max(t.v2!.boost, e.value);
        this.change(t, `下一次检定或攻击 +${e.value}（${skill.name}）`);
      }
      report.push(`${targets.map((t) => t.name).join('、') || '没有同伴在场'}下一次检定或攻击 +${e.value}`);
    } else if (e.type === 'ward') {
      const t = ally();
      t.v2!.ward = Math.max(t.v2!.ward, e.value);
      this.change(t, `这场战斗护甲 +${e.value}（${skill.name}）`);
      report.push(`${t.name}这场战斗护甲 +${e.value}`);
    } else if (e.type === 'scare') {
      const fight = this.combatAt(c.location)!;
      const minions = fight.enemies.filter((x) => !x.defeated && x.tier === 'minion').slice(0, e.count);
      for (const m of minions) {
        m.defeated = true;
        this.events.push(`${m.name}吓得逃走了`);
      }
      this.worldChanged = true;
      report.push(minions.length ? `${minions.map((m) => m.name).join('、')}逃走了` : '这里没有小怪可吓');
    } else if (e.type === 'insight') {
      const w = this.dungeon?.boss.weaknesses[0];
      report.push(w ? `首领这一局的弱点：${w.text}（用叙述的方式让${c.name}看出来，不要写成规则术语）` : '这一局没有首领');
    } else {
      report.push(`照效果写：${skill.text}。相关的检定给 +${e.bonus} 情境修正（可以超过平时的上限）`);
    }
    return ok({ character: c.name, skill: skill.name, mp: `${s.mp}/${s.mpMax}`, result: report, ...extra });
  }

  /** 走到新地方：这个角色某一项属性够高，有机会碰上奇遇（条件玩家看不到）。 */
  private maybeQiyu(input: Input, result: ToolResult): ToolResult {
    if (result.isError) return result;
    const c = this.characters.get(Number(input.character));
    const s = c?.v2;
    if (!c || !s || c.dead || s.qiyu >= QIYU_PER_RUN) return result;
    const need = this.level + QIYU_THRESHOLD;
    const met = QIYU.filter((q) => s.attributes[q.attribute] >= need);
    if (!met.length || this.pick(100) >= QIYU_CHANCE) return result;
    const q = met[this.pick(met.length)];
    const reward = q.reward.kind === 'manual' ? this.rollManual(c, q.attribute) : this.rollGear(q.reward.slot, q.reward.rarity);
    s.loot.push(reward.loot);
    s.qiyu += 1;
    this.change(c, `奇遇：${q.title}，得到${reward.label}`);
    this.events.push(`〔奇遇〕${c.name}：${q.title}`);
    const data = JSON.parse(result.content) as Record<string, unknown>;
    return ok({
      ...data,
      qiyu: {
        title: q.title,
        scene: q.scene,
        reward: reward.label,
        detail: reward.detail,
        note: `${c.name}${ATTRIBUTE2_NAME[q.attribute]}出众，碰上了奇遇。把这一幕融进这个地点和剧本的气氛写进叙述（别写成规则术语，也别说是因为属性）；东西程序已经给了，活着出去才能带走`,
      },
    });
  }

  // ----- 结算完以后 -----

  /**
   * 这次结算做完以后：倒地的人倒数一次（这一次刚倒下的不算），到了就死（不会死的风格停在濒死）；
   * 失控的人（这次是他自己的行动）恢复过来，精神值回到 1；这里在打的仗过了一轮。
   */
  finish() {
    const actor = this.characters.get(this.actorId);
    if (!actor) return;
    const places = new Set([this.startLocations.get(this.actorId), actor.location].filter((x): x is string => !!x));
    for (const c of this.characters.values()) {
      const s = c.v2;
      if (!s || c.dead || s.dying === null || this.downed.has(c.id)) continue;
      if (!c.location || !places.has(c.location)) continue;
      if (s.dying > 1) {
        s.dying -= 1;
        this.changed.add(c.id);
      } else if (this.allowDeath) {
        s.dying = null;
        c.dead = true;
        this.change(c, '死亡');
        this.events.push(`${c.name}没能撑到有人来救`);
      } else {
        s.dying = 1;
      }
    }
    if (this.lostControlAtStart && actor.v2 && actor.v2.lostControl) {
      actor.v2.lostControl = false;
      actor.v2.mp = Math.max(1, actor.v2.mp);
      this.change(actor, `回过神来，精神值 ${actor.v2.mp}`);
    }
    for (const place of places) {
      const fight = this.world.combats[place];
      if (fight) {
        fight.round += 1;
        this.worldChanged = true;
      }
    }
  }
}
