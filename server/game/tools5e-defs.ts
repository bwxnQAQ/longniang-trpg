// 5E 规则（V0.9.0）主持 AI 能调用的工具定义。执行在 tools5e.ts。
// 和第一版共用线索、移动、NPC、时间线、私信、结局这几个工具（在 tools.ts 里）。
import { ABILITIES, CONDITIONS, DAMAGE_TYPES, SKILL_KEYS } from '../../shared/5e/core';
import type { ToolDefinition } from '../ai/types';
import { DM_TOOLS } from './tools';
import type { Scenario } from './scenario';

/** 第一版里能直接沿用的工具。 */
export const SHARED_TOOLS_5E = new Set(['give_clue', 'move_character', 'reveal_exit', 'noise', 'set_spot', 'update_npc', 'trigger_event', 'private_message', 'end_game']);

const character = { type: 'integer', description: '角色编号（角色列表里的“编号”）' };
const characters = { type: 'array', items: { type: 'integer' }, description: '角色编号' };
const enemies = { type: 'array', items: { type: 'string' }, description: '敌人在这场战斗里的编号（start_combat 返回的 id，比如 goblin-2）' };
const ability = { type: 'string', enum: ABILITIES, description: 'str 力量、dex 敏捷、con 体质、int 智力、wis 感知、cha 魅力' };
const skill = {
  type: 'string',
  enum: SKILL_KEYS,
  description:
    'athletics 运动、acrobatics 体操、sleight-of-hand 巧手、stealth 隐匿、arcana 奥秘、history 历史、investigation 调查、nature 自然、religion 宗教、animal-handling 驯兽、insight 洞悉、medicine 医药、perception 察觉、survival 求生、deception 欺瞒、intimidation 威吓、performance 表演、persuasion 游说',
};
const damageType = { type: 'string', enum: DAMAGE_TYPES, description: '伤害类型' };
const advantage = { type: 'boolean', description: '这次有优势（协助、偷袭得手、占了地利……；状态带来的程序自动算）' };
const disadvantage = { type: 'boolean', description: '这次有劣势（看不清、姿势别扭、被干扰……；状态带来的程序自动算）' };
const rescue = { type: 'boolean', description: '没成功时让程序用掉角色手里的诗人激励、英雄激励（重掷）、战士的战术思维来补救。玩家说了要全力以赴、用激励时才填 true' };
const reason = { type: 'string', description: '判断什么，一句话。明骰的这句话玩家看得到：别写出角色还不知道的东西（埋伏、藏着的敌人、机关）' };
const cover = {
  type: 'string',
  enum: ['half', 'three-quarters'],
  description: '目标有掩护：一半被挡住（half，AC +2），大半被挡住（three-quarters，AC +5）。目标站在有掩体的站位时程序已经算了半身掩护，挡得更多才填',
};

const CHECK: ToolDefinition = {
  name: 'check',
  description:
    '属性检定：d20 + 技能（或属性）调整值 + 熟练加值（专精翻倍、吟游诗人的万事通加一半）+ 效果（神导术……），状态、力竭、护甲（链甲这类重甲的隐匿劣势）带来的优势劣势和减值程序自动算。结果不确定、失败也有意思时才用；给 dc 程序就判断成败（简单 10、中等 15、困难 20、非常困难 25）。',
  input_schema: {
    type: 'object',
    properties: {
      character,
      skill: { ...skill, description: `${skill.description}。写技能就不用写 ability` },
      ability: { ...ability, description: '不用技能的属性检定（硬抬重物用力量……）；写了 skill 时可以改用别的属性（用力量做威吓）' },
      dc: { type: 'integer', description: '难度等级（5～30）；对抗检定、看总数决定结果的不填' },
      tool: { type: 'boolean', description: '这次用的是工具（盗贼工具开锁、草药工具……），而且角色会用这种工具（加熟练加值）' },
      advantage,
      disadvantage,
      hidden: { type: 'boolean', description: '暗骰：角色自己察觉不到的检定，玩家看不到点数' },
      rescue,
      reason,
    },
    required: ['character', 'reason'],
  },
};

const SAVE: ToolDefinition = {
  name: 'saving_throw',
  description:
    '豁免检定：角色或敌人（可以好几个一起）按属性对 DC 掷豁免。麻痹、震慑、昏迷时力量和敏捷豁免自动失败，抗性、优势（狂暴、危险感知……）程序自动算。end_condition：成功就去掉这个状态（每回合结束时再豁免一次、摆脱定身之类）。',
  input_schema: {
    type: 'object',
    properties: {
      characters,
      enemies,
      ability,
      dc: { type: 'integer', description: '豁免 DC（5～30）' },
      advantage,
      disadvantage,
      end_condition: { type: 'string', enum: CONDITIONS, description: '成功时去掉的状态' },
      rescue,
      reason,
    },
    required: ['ability', 'dc', 'reason'],
  },
};

const CONTEST: ToolDefinition = {
  name: 'contest',
  description:
    '对抗检定：角色和另一个角色、敌人或 NPC 较量（擒抱、推撞、追逐、骗人对识破），各掷 d20 加自己的调整值，高的赢，平局维持原状。对手是 NPC 时填 npc 和 npc_bonus（按他的本事给 +0～+8）、npc_label（骰子卡片上的叫法，只写角色们知道的）。',
  input_schema: {
    type: 'object',
    properties: {
      character,
      skill,
      ability: { ...ability, description: '不用技能时用的属性' },
      opponent_character: { type: 'integer', description: '对手是玩家角色时，他的编号' },
      opponent_enemy: { type: 'string', description: '对手是战斗里的敌人时，他的编号' },
      opponent_skill: { ...skill, description: '对手用哪个技能（角色、敌人）' },
      opponent_ability: { ...ability, description: '对手不用技能时用的属性' },
      npc: { type: 'string', description: '对手 NPC 的 key' },
      npc_bonus: { type: 'integer', description: '对手 NPC 的加值（−2～+10）' },
      npc_label: { type: 'string', description: '骰子卡片上怎么称呼这个 NPC' },
      advantage,
      disadvantage,
      reason,
    },
    required: ['character', 'reason'],
  },
};

const ATTACK: ToolDefinition = {
  name: 'attack',
  description:
    '角色用武器或徒手打击攻击一个敌人：程序掷 d20 + 攻击加值（属性、熟练、魔法武器、箭术……）对敌人的 AC，命中掷伤害（属性调整值、狂暴、猎人印记、神恩……自动加；重击骰子翻倍），算抗性、扣血，会用的武器精通自动生效（擦伤、削弱、侵扰、击倒……）。额外攻击、多次攻击就调用几次。偷袭、至圣斩、震慑拳这类要玩家写了或者合适时才填。',
  input_schema: {
    type: 'object',
    properties: {
      character,
      target: { type: 'string', description: '敌人在这场战斗里的编号' },
      weapon: { type: 'string', description: '用哪件武器（角色列表里攻击的 key，比如 longsword、shortbow、longsword+1）；徒手打击写 unarmed' },
      two_handed: { type: 'boolean', description: '多用武器双手挥（用双手伤害骰）' },
      offhand: { type: 'boolean', description: '双持时副手的附赠攻击（伤害不加属性调整值，除非有双武器战斗风格）' },
      advantage,
      disadvantage,
      sneak_attack: { type: 'boolean', description: '游荡者想偷袭（程序检查条件：灵巧或远程武器、有优势或者目标 5 尺内有没失能的盟友、这回合还没用过）' },
      ally_adjacent: { type: 'boolean', description: '目标 5 尺内有角色的盟友（偷袭用）' },
      thrown: { type: 'boolean', description: '把投掷武器扔出去（匕首、手斧、标枪……），算远程攻击；近战只打得到同一个站位上的敌人' },
      cover,
      reckless: { type: 'boolean', description: '野蛮人鲁莽攻击：这回合力量攻击有优势，到他下回合开始前别人打他也有优势' },
      smite: { type: 'string', enum: ['divine-smite', 'searing-smite', 'shining-smite', 'ensnaring-strike'], description: '命中以后立刻施放的斩击法术（圣武士、游侠），程序先用免费次数再用法术位' },
      smite_slot: { type: 'integer', description: '斩击用几环法术位（不填用最低的）' },
      stunning_strike: { type: 'boolean', description: '武僧命中以后花 1 点功力点用震慑拳' },
      cunning_strike: { type: 'string', enum: ['poison', 'trip', 'withdraw'], description: '游荡者 5 级的诡诈打击（少掷一颗偷袭骰）' },
      open_hand: { type: 'string', enum: ['addle', 'push', 'topple'], description: '散打武者疾风连击命中时的效果' },
      damage_type: { type: 'string', enum: ['necrotic', 'psychic', 'radiant'], description: '契约之刃的近战武器改成造成哪种伤害（不填是武器本来的）' },
      reason,
    },
    required: ['character', 'target', 'weapon', 'reason'],
  },
};

const MONSTER_ACTION: ToolDefinition = {
  name: 'monster_action',
  description:
    '敌人行动：用它数据块里的一个动作（攻击、要豁免的本事）对付角色。程序掷攻击对角色的 AC（或者让目标豁免）、掷伤害、算抗性和临时生命值、扣血，豁免失败自动加上数据块写的状态。多重攻击就把里面的攻击各调用一次。充能、每日几次的程序会管。reactions 是被打的角色当场用的反应（护盾术、直觉闪避、拨挡攻击），玩家写过、或者合情合理时才填。',
  input_schema: {
    type: 'object',
    properties: {
      enemy: { type: 'string', description: '敌人在这场战斗里的编号' },
      action: { type: 'string', description: '动作的名字（照数据块写的，比如「弯刀」），或者第几个动作（从 1 数）' },
      targets: { type: 'array', items: { type: 'integer' }, description: '目标角色编号：攻击一般一个；范围的本事填所有在范围里的' },
      advantage,
      disadvantage,
      cover,
      extra: { type: 'boolean', description: '数据块里有条件才有的额外伤害（冲锋了一段距离、已经附着在目标身上……）这次满足了' },
      opportunity: { type: 'boolean', description: '借机攻击：角色从它身边走开时打的一下（用它的一种攻击），算它的反应，不占它这一轮的回合' },
      alternative: { type: 'boolean', description: '用数据块里「或者」的另一种伤害（集群浴血以后伤害变小之类）' },
      reactions: {
        type: 'array',
        items: {
          type: 'object',
          properties: { character, reaction: { type: 'string', enum: ['shield', 'uncanny-dodge', 'deflect-attacks', 'stones-endurance'] } },
          required: ['character', 'reaction'],
        },
        description: '被打的角色用的反应',
      },
      reason,
    },
    required: ['enemy', 'action', 'reason'],
  },
};

const CAST: ToolDefinition = {
  name: 'cast_spell',
  description:
    '角色施法：程序检查他会不会这个法术、扣法术位（或免费次数、契约魔法）、处理专注（新的专注会结束旧的），照法术的机制掷攻击、让目标豁免、掷伤害或治疗、加状态和效果，没写机制的法术只扣法术位，效果照法术说明由你叙述。持续造成伤害的法术（月华之光、灵体卫士、灵体武器之后的攻击……）后面的回合用 spell_effect。',
  input_schema: {
    type: 'object',
    properties: {
      character,
      spell: { type: 'string', description: '法术的 key（角色列表里法术后面括号里的）' },
      slot: { type: 'integer', description: '用几环的法术位（1～3）；不填用法术本身的环级。戏法、免费施放、仪式不用填' },
      use: { type: 'string', enum: ['slot', 'free', 'ritual'], description: 'slot 用法术位（邪术师自动用契约魔法），free 用免费次数（猎人印记、血统法术、魔能祈唤……），ritual 仪式施法（多花 10 分钟，不用法术位）' },
      characters: { ...characters, description: '目标角色（治疗、增益、范围里的队友）' },
      enemies: { ...enemies, description: '目标敌人；几道射线、几枚飞弹打同一个敌人就把他写几次' },
      npcs: { type: 'array', items: { type: 'string' }, description: '目标 NPC 的 key（不在战斗里的人）：程序不记他们的生命值，结果你照着写，需要的话用 update_npc' },
      npc_save_bonus: { type: 'integer', description: 'NPC 豁免的加值（按他的本事给 −1～+6）' },
      damage_type: { ...damageType, description: '能选伤害类型的法术选哪一种' },
      cover: { ...cover, description: `${cover.description}（法术攻击用）` },
      metamagic: { type: 'string', description: '术士用的超魔 key（careful-spell、heightened-spell……），扣术法点' },
      reason,
    },
    required: ['character', 'spell', 'reason'],
  },
};

const SPELL_EFFECT: ToolDefinition = {
  name: 'spell_effect',
  description:
    '已经施放、还在持续的法术再生效一次（不扣法术位）：月华之光、灵体卫士、炽焰法球、召雷术、灼热金属、灵体武器的又一次攻击、龙息术的吐息、尖刺丛生的伤害、蛛网和雨夹雪的豁免……要施法者还在专注这个法术（不用专注的持续法术也行）。',
  input_schema: {
    type: 'object',
    properties: {
      character: { ...character, description: '施法者的编号' },
      spell: { type: 'string', description: '法术的 key' },
      characters: { ...characters, description: '这次受影响的角色' },
      enemies: { ...enemies, description: '这次受影响的敌人' },
      reason,
    },
    required: ['character', 'spell', 'reason'],
  },
};

const FEATURE: ToolDefinition = {
  name: 'use_feature',
  description:
    '角色用职业、种族的能力：程序扣次数（狂暴、回气、引导神力、功力点、术法点、圣疗池……），执行能自动算的效果，返回结果。角色列表里写着他有哪些能力、还剩几次。feature 写能力的 key（见角色列表），option、target、amount 按能力的需要填。',
  input_schema: {
    type: 'object',
    properties: {
      character,
      feature: {
        type: 'string',
        description:
          '能力的 key：rage、end-rage、second-wind、action-surge、bardic-inspiration、cutting-words、channel-divinity、lay-on-hands、wild-shape、wild-shape-attack（变形以后用野兽的攻击：option 写动作名，enemies 写目标）、lands-aid、flurry-of-blows、patient-defense、step-of-the-wind、dodge（闪避动作，谁都能用）、help（协助动作，谁都能用：target_character 写被协助的同伴；enemies 写身边的一个敌人，是同伴下一次攻击它有优势；不写敌人，是同伴下一次属性检定有优势；到协助的人下回合开始失效）、steady-aim、innate-sorcery、font-of-magic、magical-cunning、breath-weapon、giant-ancestry、large-form、adrenaline-rush、draconic-flight、stonecunning',
      },
      option: {
        type: 'string',
        description:
          '能力的选项：引导神力写 divine-spark（神圣火花：治疗填 target_character，伤害填 enemies）、turn-undead、preserve-life、sacred-weapon、divine-sense；荒野变形写野兽 key（变回来写 end）；圣疗解毒写 cure-poison；术法之源写 to-points（法术位换术法点，amount 写几环）或 to-slot（术法点造法术位，amount 写几环）；巨人祖先按他自己的祖先来，不用写',
      },
      target_character: { type: 'integer', description: '用在哪个角色身上（诗人激励、圣疗、神圣火花、协助……）' },
      enemies: { ...enemies, description: '用在哪些敌人身上（驱散不死、吐息武器、大地援助、神圣火花、协助攻击牵制的那个……）' },
      characters: { ...characters, description: '范围里的角色（保存生命分给谁、吐息范围里的队友……）' },
      amount: { type: 'integer', description: '数量：圣疗用几点、术法之源换几环、保存生命每人分几点' },
      damage_type: { type: 'string', enum: ['radiant', 'necrotic'], description: '神圣火花造成光耀还是暗蚀伤害' },
      reason,
    },
    required: ['character', 'feature', 'reason'],
  },
};

const DAMAGE: ToolDefinition = {
  name: 'damage',
  description:
    '剧情造成的伤害（陷阱、坠落、毒气、着火、NPC 的偷袭）：对角色或敌人掷伤害，可以先让目标豁免（成功减半或者没事）。程序算抗性、临时生命值、倒地、专注。战斗里敌人用自己的动作打人用 monster_action，不用这个。',
  input_schema: {
    type: 'object',
    properties: {
      characters,
      enemies,
      dice: { type: 'string', description: '伤害骰，比如 2d6、3d10+3（坠落每 10 尺 1d6，最多 20d6）' },
      type: damageType,
      save_ability: { ...ability, description: '要先豁免的话，用哪个属性' },
      save_dc: { type: 'integer', description: '豁免 DC' },
      on_save: { type: 'string', enum: ['half', 'none'], description: '豁免成功：伤害减半（half）或者没事（none）' },
      reason,
    },
    required: ['dice', 'type', 'reason'],
  },
};

const HEAL: ToolDefinition = {
  name: 'heal',
  description:
    '不靠法术、能力的恢复：NPC 的治疗（神殿的牧师……）、剧本写了的回血的东西、剧情。包扎、医药检定只能让倒地的角色稳定下来（stabilize：医药检定 DC 10 成功，或者用了医疗包），不回生命值；平时回血靠休息（rest）、药水（use_item）、法术（cast_spell）。',
  input_schema: {
    type: 'object',
    properties: {
      characters,
      dice: { type: 'string', description: '恢复的生命值，骰子或者固定数（2d4+2、5）' },
      temp_hp: { type: 'integer', description: '给的临时生命值' },
      stabilize: { type: 'boolean', description: '让倒地的角色稳定下来（不用再掷死亡豁免，生命值还是 0）' },
      reason,
    },
    required: ['characters', 'reason'],
  },
};

const CONDITION: ToolDefinition = {
  name: 'condition',
  description:
    '改角色、敌人身上的状态和效果：加上或去掉状态（倒地、擒抱、恐慌、中毒、隐形……）、力竭加减、给或用掉英雄激励、结束某个效果或专注。法术、能力带来的状态程序已经加过了，不用再加。',
  input_schema: {
    type: 'object',
    properties: {
      characters,
      enemies,
      add: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            condition: { type: 'string', enum: CONDITIONS },
            note: { type: 'string', description: '原因或持续多久，一句话' },
            until: {
              type: 'string',
              enum: ['actor_turn_start', 'own_turn_end'],
              description: '按回合结束的，程序到时候自动去掉：actor_turn_start 到行动角色的下回合开始；own_turn_end 到带着这个状态的人（或敌人）自己的下一个回合结束。不写就一直在，要用 remove 去掉',
            },
          },
          required: ['condition'],
        },
        description: '加上的状态',
      },
      remove: { type: 'array', items: { type: 'string', enum: CONDITIONS }, description: '去掉的状态' },
      exhaustion: { type: 'integer', description: '力竭变化：+1 加一级、−1 减一级（6 级死亡）' },
      inspiration: { type: 'boolean', description: 'true 给英雄激励（角色做了特别出彩的事），false 去掉' },
      end_effects: { type: 'array', items: { type: 'string' }, description: '结束的效果名字（照角色列表里写的）' },
      end_concentration: { type: 'boolean', description: '角色的专注断了（被打昏、主动放弃……）' },
      reason,
    },
    required: ['reason'],
  },
};

const START_COMBAT: ToolDefinition = {
  name: 'start_combat',
  description:
    '在行动的角色所在的地点开打：放出剧本 monsters 里的怪物（key 和数量），程序按数据块记生命值、AC，并给在场的角色和怪物掷先攻（d20 + 敏捷调整值……）。这里已经在打的话，新来的怪物加进去。',
  input_schema: {
    type: 'object',
    properties: {
      monsters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            monster: { type: 'string', description: '剧本 monsters 里的 key' },
            count: { type: 'integer' },
            name: { type: 'string', description: '在故事里叫什么（剧本里的人物用通用的数据块动手时填他的名字；不填就用 monsters 里的叫法）' },
          },
          required: ['monster', 'count'],
        },
        description: '放出的怪物',
      },
      surprised: { type: 'boolean', description: '角色们被偷袭了（他们的先攻有劣势）' },
      enemies_surprised: { type: 'boolean', description: '角色们偷袭了敌人，敌人没防备（敌人的先攻有劣势）' },
      note: { type: 'string', description: '怎么打起来的，一句话' },
      spot: { type: 'string', description: '这些怪物出现在哪个站位（剧本里这个地点的站位名）；不写就在大家中间' },
    },
    required: ['monsters', 'note'],
  },
};

const END_COMBAT: ToolDefinition = {
  name: 'end_combat',
  description: '这个地点的战斗结束了（敌人都倒下、逃走、投降，或者角色们脱身了）。只在这场战斗里有效的效果（狂暴……）一起结束。',
  input_schema: {
    type: 'object',
    properties: {
      note: { type: 'string', description: '怎么结束的，一句话' },
      location: { type: 'string', description: '战斗在别的地点时填那个地点的 key（行动的效果传到了那里）；不填就是行动角色所在的地点' },
    },
    required: ['note'],
  },
};

const UPDATE_ENEMY: ToolDefinition = {
  name: 'update_enemy',
  description: '改敌人的情况：逃走或投降（gone，不再参战；逃走的又回来了填 false）、被打昏而不是杀死（knocked_out）、给它临时生命值、备注。投降、讲和的敌人在剧本 npcs 里也有一份的（同一个名字），之后照 NPC 演：对话、交易、跟着走。',
  input_schema: {
    type: 'object',
    properties: {
      enemy: { type: 'string', description: '敌人在这场战斗里的编号' },
      gone: { type: 'boolean', description: '逃走了、投降了（true）；逃走的又回来接着打（false）' },
      knocked_out: { type: 'boolean', description: '生命值到 0 时只是昏过去（近战攻击打倒时角色选择不杀）' },
      temp_hp: { type: 'integer', description: '给它的临时生命值' },
      note: { type: 'string', description: '为什么，一句话（进记录：「某某退出了战斗：……」「某某又回来了：……」）' },
      mark: { type: 'string', description: '记在它身上的事，之后一直写在「正在打的仗」里（剧本里的计数、机关进度：钟已经敲了两声）；写空字符串去掉' },
      location: { type: 'string', description: '敌人在别的地点的战斗里时填那个地点的 key（远处敲钟、放下闸门影响到那里的敌人）；不填就是行动角色所在的地点' },
    },
    required: ['enemy', 'note'],
  },
};

const REST: ToolDefinition = {
  name: 'rest',
  description:
    '休息：short 短休（至少 1 小时，可以花生命骰回血，部分能力恢复；法师的奥术回复、术士的术法复苏有用得上的就自动用），long 长休（8 小时，生命值、法术位、能力回满，力竭减一级；一天只能一次，倒地的不能长休）。危险的地方休息可能被打断，你按剧本判断。',
  input_schema: {
    type: 'object',
    properties: {
      kind: { type: 'string', enum: ['short', 'long'] },
      characters: { ...characters, description: '一起休息的角色（不填是行动的角色所在地点的所有人）' },
      hit_dice: {
        type: 'array',
        items: { type: 'object', properties: { character, dice: { type: 'integer' } }, required: ['character', 'dice'] },
        description: '短休时每人花几颗生命骰（玩家没说就按需要花，生命值满的不花）',
      },
      keep_recovery: { ...characters, description: '这次短休不用奥术回复、术法复苏的角色（玩家说先留着）' },
      reason,
    },
    required: ['kind', 'reason'],
  },
};

const USE_ITEM: ToolDefinition = {
  name: 'use_item',
  description: '角色用掉身上的一件消耗品：治疗药水（附赠动作，能喂给 5 尺内的人）、医疗包（让倒地的人稳定）、解毒剂、火瓶……程序从物品里扣掉，执行能自动算的效果。',
  input_schema: {
    type: 'object',
    properties: {
      character,
      item: { type: 'string', description: '物品的 key（角色列表里物品后面括号里的）' },
      target_character: { type: 'integer', description: '用在谁身上（不填是自己）' },
      target_enemy: { type: 'string', description: '扔向哪个敌人（火瓶、酸液……）' },
      reason,
    },
    required: ['character', 'item', 'reason'],
  },
};

const TREASURE: ToolDefinition = {
  name: 'give_treasure',
  description: '角色找到了剧本 treasure 里的一处宝藏（物品和金币归他，之后可以用 update_character 分给别人）。每处宝藏只能拿一次。宝藏只用剧本里写的，不发明新的。',
  input_schema: {
    type: 'object',
    properties: { character, treasure: { type: 'string', description: '宝藏的 key' }, reason },
    required: ['character', 'treasure', 'reason'],
  },
};

const UPDATE_CHARACTER: ToolDefinition = {
  name: 'update_character',
  description:
    '改角色身上的东西：故事里的物品（钥匙、信、地图……写短名字）、花钱或得到钱（金币，可以带小数：0.5 是 5 银币）、买卖剧本世界里的普通装备（SRD 物品 key）。生命值、状态不用它改。',
  input_schema: {
    type: 'object',
    properties: {
      character,
      add_items: { type: 'array', items: { type: 'string' }, description: '得到的故事物品（每样一个短名字，最多 20 个字）' },
      remove_items: { type: 'array', items: { type: 'string' }, description: '失去或用掉的故事物品' },
      gold: { type: 'number', description: '金币变化：花钱写负数' },
      add_gear: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, count: { type: 'integer' } }, required: ['item', 'count'] }, description: '得到的装备（SRD 物品 key）' },
      remove_gear: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, count: { type: 'integer' } }, required: ['item', 'count'] }, description: '失去、卖掉、用掉的装备' },
      reason,
    },
    required: ['character', 'reason'],
  },
};

/** 5E 模组这一局能用的工具：有怪物才有战斗的工具，有宝藏才有宝藏工具。 */
export function dmTools5e(scenario: Scenario): ToolDefinition[] {
  const shared = DM_TOOLS.filter((t) => SHARED_TOOLS_5E.has(t.name));
  const tools = [CHECK, SAVE, CONTEST, CAST, SPELL_EFFECT, FEATURE, DAMAGE, HEAL, CONDITION, REST, USE_ITEM, UPDATE_CHARACTER, ...shared];
  if (scenario.monsters?.length) tools.push(START_COMBAT, ATTACK, MONSTER_ACTION, UPDATE_ENEMY, END_COMBAT);
  if (scenario.treasure?.length) tools.push(TREASURE);
  return tools;
}
