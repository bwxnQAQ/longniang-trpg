// 自动生成的文件（SRD 5.2.1 数据 + 本站的中文译文），不要手改。
import type { SpellData } from '../../../shared/5e/types';

export const SPELLS: SpellData[] = [
 {
  "key": "acid-arrow",
  "name": "强酸箭",
  "level": 2,
  "school": "evocation",
  "classes": [
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "90 尺",
  "components": "V、S、M（大黄叶粉末）",
  "duration": "立即",
  "concentration": false,
  "text": "一支闪着微光的绿色箭矢飞向射程内的一个目标，并炸开成一片酸液。对该目标进行一次远程法术攻击。命中时，目标受到 4d4 强酸伤害，并在它的下个回合结束时再受到 2d4 强酸伤害。未命中时，箭矢溅出的酸液只对目标造成初始伤害的一半。",
  "higher": "升环施法：法术位每比 2 环高一环，伤害（初始伤害和后续伤害）各增加 1d4。",
  "mech": {
   "attack": "ranged",
   "damage": "4d4",
   "damageType": "acid",
   "damagePerSlot": "1d4"
  }
 },
 {
  "key": "acid-splash",
  "name": "酸液飞溅",
  "level": 0,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你在射程内的一点创造一个酸液泡，它在那里炸开，形成一个半径 5 尺的球形区域。该球形区域内的每个生物都必须成功通过一次敏捷豁免，否则受到 1d6 强酸伤害。",
  "higher": "戏法强化：当你达到 5 级（2d6）、11 级（3d6）和 17 级（4d6）时，伤害各增加 1d6。",
  "mech": {
   "save": "dex",
   "onSave": "none",
   "damage": "1d6",
   "damageType": "acid",
   "cantripDice": "2d6"
  }
 },
 {
  "key": "aid",
  "name": "援助术",
  "level": 2,
  "school": "abjuration",
  "classes": [
   "bard",
   "cleric",
   "druid",
   "paladin",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S、M（一条白布）",
  "duration": "8 小时",
  "concentration": false,
  "text": "选择射程内至多三个生物。在持续时间内，每个目标的生命值上限和当前生命值都增加 5 点。",
  "higher": "升环施法：法术位每比 2 环高一环，每个目标的生命值再多增加 5 点。",
  "mech": {
   "effect": {
    "target": "targets",
    "hpMax": 5,
    "hpMaxPerSlot": 5,
    "note": "生命值上限和当前生命值 +5（法术位每高一环再 +5）"
   }
  }
 },
 {
  "key": "alarm",
  "name": "警报术",
  "level": 1,
  "school": "abjuration",
  "classes": [
   "ranger",
   "wizard"
  ],
  "castingTime": "1 分钟，可仪式施放",
  "timing": "long",
  "ritual": true,
  "range": "30 尺",
  "components": "V、S、M（一个铃铛和一段银丝）",
  "duration": "8 小时",
  "concentration": false,
  "text": "你设下一道防范入侵的警报。选择射程内的一扇门、一扇窗，或一个不大于 20 尺立方的区域。在法术结束前，每当有生物触碰或进入受守护的区域时，警报都会提醒你。施放此法术时，你可以指定一些不会触发警报的生物。你还要选择警报是声响警报还是心灵警报：\n声响警报：警报在受守护区域周围 60 尺内发出手摇铃的声音，持续 10 秒。\n心灵警报：如果你位于受守护区域 1 英里内，你会收到一次心灵提示。如果你正在睡觉，这次提示会把你唤醒。",
  "higher": null,
  "mech": null
 },
 {
  "key": "alter-self",
  "name": "变身术",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "你改变自己的身体形态。从下列选项中选择一项。其效果在持续时间内有效，期间你可以执行一次魔法动作，把已选的选项换成另一项。\n水生适应：你长出鳃，手指间长出蹼。你可以在水下呼吸，并获得等同于你速度的游泳速度。\n改变外貌：你改变自己的外貌。你决定自己的样子，包括身高、体重、面部特征、嗓音、头发长度、体色以及其他显著特征。你可以让自己看起来像另一个种族的成员，但你的各项数据都不会改变。你不能显现为不同体型的生物，并且你的基本形态保持不变；例如，如果你是两足生物，你就不能用此法术变成四足的样子。在持续时间内，你可以执行一次魔法动作，再次以这种方式改变外貌。\n天生武器：你长出爪子（挥砍）、尖牙（穿刺）、角（穿刺）或蹄子（钝击）。当你用徒手打击以这种新长出的部位造成伤害时，它造成 1d6 括号中所示类型的伤害，而不是你徒手打击的正常伤害，并且这次攻击检定和伤害掷骰使用你的施法属性调整值，而不是力量。",
  "higher": null,
  "mech": null
 },
 {
  "key": "animal-friendship",
  "name": "动物交友",
  "level": 1,
  "school": "enchantment",
  "classes": [
   "bard",
   "druid",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S、M（一小口食物）",
  "duration": "24 小时",
  "concentration": false,
  "text": "以射程内一只你能看见的野兽为目标。目标必须成功通过一次感知豁免，否则在持续时间内陷入魅惑状态。如果你或你的某个盟友对目标造成伤害，法术结束。",
  "higher": "升环施法：法术位每比 1 环高一环，你可以多选择一只野兽作为目标。",
  "mech": {
   "save": "wis",
   "onSave": "none",
   "condition": "charmed"
  }
 },
 {
  "key": "animal-messenger",
  "name": "动物信使",
  "level": 2,
  "school": "enchantment",
  "classes": [
   "bard",
   "druid",
   "ranger"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "30 尺",
  "components": "V、S、M（一小口食物）",
  "duration": "24 小时",
  "concentration": false,
  "text": "射程内一只由你选择、你能看见的微型野兽必须成功通过一次魅力豁免，否则它会尝试替你传递一条消息（如果目标的挑战等级不为 0，它自动豁免成功）。你指定一个你去过的地点，以及一个符合大致描述的收信者，例如“一个穿着城镇守卫制服的人”或“一个戴着尖帽子的红发矮人”。你还要传达一条至多二十五个词的消息。在持续时间内，这只野兽朝指定地点前进，每 24 小时大约行进 25 英里，如果它能飞行则约 50 英里。\n野兽到达后，会模仿你的表达方式，把你的消息传达给你所描述的生物。如果野兽在法术结束前没有到达目的地，消息就会丢失，野兽会返回你施放此法术的地方。",
  "higher": "升环施法：法术位每比 2 环高一环，法术的持续时间增加 48 小时。",
  "mech": null
 },
 {
  "key": "animate-dead",
  "name": "操纵死尸",
  "level": 3,
  "school": "necromancy",
  "classes": [
   "cleric",
   "wizard"
  ],
  "castingTime": "1 分钟",
  "timing": "long",
  "ritual": false,
  "range": "10 尺",
  "components": "V、S、M（一滴血、一块肉和一撮骨粉）",
  "duration": "立即",
  "concentration": false,
  "text": "选择射程内的一堆骨头，或一具中型或小型类人生物的尸体。目标变成一个不死生物：如果你选的是骨头，它变成骷髅；如果你选的是尸体，它变成僵尸（数据卡见“怪物”章节）。\n在你的每个回合，你都可以执行一次附赠动作，在心中命令任何一个由此法术创造、并且位于你 60 尺内的生物（如果你控制着多个生物，你可以同时命令其中任意数量的生物，给每个生物下达同样的命令）。你决定该生物在它的下个回合执行什么动作、移动到哪里，或者你也可以下达一条笼统的命令，例如守卫某个房间或走廊。如果你没有下达任何命令，该生物就执行闪避动作，并且只为躲避伤害而移动。一旦接到命令，该生物会一直执行，直到任务完成。\n该生物受你控制 24 小时，之后它不再服从你下达过的任何命令。要将对该生物的控制再维持 24 小时，你必须在当前这 24 小时结束之前再次对该生物施放此法术。这样施放此法术会重新确立你对至多四个由此法术活化的生物的控制，而不会活化新的生物。",
  "higher": "升环施法：法术位每比 3 环高一环，你多活化或重新控制两个不死生物。每个生物都必须来自不同的尸体或骨堆。",
  "mech": null
 },
 {
  "key": "arcane-lock",
  "name": "秘法锁",
  "level": 2,
  "school": "abjuration",
  "classes": [
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（价值至少 25 金币的金粉，法术会消耗它）",
  "duration": "直到被解除",
  "concentration": false,
  "text": "你触碰一扇关闭的门、窗、大门、容器或舱门，在持续时间内用魔法把它锁上。这道锁无法用任何非魔法手段打开。你以及你在施放此法术时指定的任何生物都可以无视这道锁，打开或关闭该物体。你还可以设置一个口令，在该物体 5 尺内说出口令时，它会解锁 1 分钟。",
  "higher": null,
  "mech": null
 },
 {
  "key": "arcanists-magic-aura",
  "name": "秘法师灵光",
  "level": 2,
  "school": "illusion",
  "classes": [
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一小块方形丝绸）",
  "duration": "24 小时",
  "concentration": false,
  "text": "你通过触碰，在一个自愿生物或一个没有被穿戴或携带的物体上施加一道幻术。生物获得下方的“伪装”效果，物体获得下方的“虚假灵光”效果。效果在持续时间内有效。如果你连续 30 天每天都对同一个目标施放此法术，这道幻术会一直持续到被解除。\n伪装（生物）：选择一种不同于目标实际类型的生物类型。法术和其他魔法效应会把目标当作所选类型的生物。\n虚假灵光（物体）：你改变目标在侦测魔法灵光的法术和魔法效应（例如《侦测魔法》）面前所呈现的样子。你可以让一个非魔法物体显得带有魔法，让一件魔法物品显得不带魔法，或者改变该物体的灵光，使它看起来属于你所选择的某个魔法学派。",
  "higher": null,
  "mech": null
 },
 {
  "key": "augury",
  "name": "卜筮术",
  "level": 2,
  "school": "divination",
  "classes": [
   "cleric",
   "druid",
   "wizard"
  ],
  "castingTime": "1 分钟，可仪式施放",
  "timing": "long",
  "ritual": true,
  "range": "自身",
  "components": "V、S、M（价值至少 25 金币、带有特殊标记的签棒、骨头、卡牌或其他占卜用具）",
  "duration": "立即",
  "concentration": false,
  "text": "你从一个异界存在那里得到一个预兆，得知你打算在接下来 30 分钟内采取的某个行动会有什么结果。主持人从“预兆”表中选择预兆。\n预兆表（预兆：对应的结果）\n吉：好\n凶：坏\n吉凶参半：有好有坏\n漠然：不好也不坏\n此法术不会考虑可能改变结果的情况，例如其他法术。\n如果你在完成一次长休之前施放此法术不止一次，那么第一次之后的每次施放，都有累计 25% 的几率让你得不到任何回答。",
  "higher": null,
  "mech": null
 },
 {
  "key": "bane",
  "name": "灾祸术",
  "level": 1,
  "school": "enchantment",
  "classes": [
   "bard",
   "cleric",
   "warlock"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S、M（一滴血）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "射程内至多三个由你选择、你能看见的生物各自进行一次魅力豁免。在法术结束前，每当豁免失败的目标进行攻击检定或豁免检定时，它都必须从这次攻击检定或豁免检定中减去 1d4。",
  "higher": "升环施法：法术位每比 1 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "save": "cha",
   "onSave": "none",
   "effect": {
    "target": "targets",
    "attackDice": "-1d4",
    "saveDice": "-1d4",
    "note": "攻击检定和豁免检定 -1d4"
   }
  }
 },
 {
  "key": "barkskin",
  "name": "树肤术",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "druid",
   "ranger"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一把树皮）",
  "duration": "1 小时",
  "concentration": false,
  "text": "你触碰一个自愿生物。在法术结束前，目标的皮肤呈现出树皮般的外观，并且如果目标的护甲等级低于 17，它的护甲等级变为 17。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "acMin": 17,
    "note": "AC 至少为 17"
   }
  }
 },
 {
  "key": "beacon-of-hope",
  "name": "希望信标",
  "level": 3,
  "school": "abjuration",
  "classes": [
   "cleric"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "选择射程内任意数量的生物。在持续时间内，每个目标的感知豁免和死亡豁免都具有优势，并且它从任何治疗中都恢复该治疗所能提供的最大生命值。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "note": "感知豁免和死亡豁免具有优势；受到治疗时恢复可能的最大生命值"
   }
  }
 },
 {
  "key": "bestow-curse",
  "name": "降咒",
  "level": 3,
  "school": "necromancy",
  "classes": [
   "bard",
   "cleric",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你触碰一个生物，它必须成功通过一次感知豁免，否则在持续时间内受到诅咒。在诅咒结束前，目标承受下列效果中由你选择的一项：\n• 选择一项属性。目标使用该属性进行的属性检定和豁免检定具有劣势。\n• 目标对你进行的攻击检定具有劣势。\n• 在战斗中，目标必须在它的每个回合开始时成功通过一次感知豁免，否则在该回合被迫执行闪避动作。\n• 如果你用攻击检定或法术对目标造成伤害，目标额外受到 1d8 暗蚀伤害。",
  "higher": "升环施法：如果你用 4 环法术位施放此法术，你可以维持对它的专注至多 10 分钟。如果你使用 5 环或更高的法术位，此法术不需要专注，持续时间变为 8 小时（5～6 环法术位）或 24 小时（7～8 环法术位）。如果你使用 9 环法术位，此法术持续到被解除为止。",
  "mech": {
   "save": "wis",
   "onSave": "none",
   "effect": {
    "target": "targets",
    "note": "受到诅咒，四种效果选一种：某项属性的检定和豁免劣势／对你的攻击检定劣势／每回合开始时感知豁免失败就只能闪避／你对它造成伤害时额外 1d8 暗蚀伤害"
   }
  }
 },
 {
  "key": "bless",
  "name": "祝福术",
  "level": 1,
  "school": "enchantment",
  "classes": [
   "cleric",
   "paladin"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S、M（一个价值至少 5 金币的圣徽）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你祝福射程内至多三个生物。在法术结束前，每当一个目标进行攻击检定或豁免检定时，它都在这次攻击检定或豁免检定上加 1d4。",
  "higher": "升环施法：法术位每比 1 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "effect": {
    "target": "targets",
    "attackDice": "1d4",
    "saveDice": "1d4",
    "note": "攻击检定和豁免检定 +1d4"
   }
  }
 },
 {
  "key": "blindness-deafness",
  "name": "目盲／耳聋术",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "bard",
   "cleric",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V",
  "duration": "1 分钟",
  "concentration": false,
  "text": "射程内一个你能看见的生物必须成功通过一次体质豁免，否则在持续时间内陷入目盲或耳聋状态（由你选择）。在它的每个回合结束时，目标重复这次豁免，成功则法术对它的效果结束。",
  "higher": "升环施法：法术位每比 2 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "save": "con",
   "onSave": "none",
   "condition": "blinded"
  }
 },
 {
  "key": "blink",
  "name": "闪现术",
  "level": 3,
  "school": "transmutation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S",
  "duration": "1 分钟",
  "concentration": false,
  "text": "在持续时间内，你在每个回合结束时掷 1d6。掷出 4-6 时，你从当前所在的存在位面消失，出现在以太位面（如果你已经身处以太位面，法术立即结束）。在以太位面期间，你能感知你所离开的位面，那里呈现为深浅不一的灰色，但你看不见那里 60 尺以外的任何东西。你只能影响以太位面上的其他生物，也只会受到它们的影响；另一个位面上的生物无法感知你，除非它们拥有能感知以太位面事物的特殊能力。\n如果你在以太位面，你会在你的下个回合开始时以及法术结束时返回另一个位面。你会回到你离开的空间 10 尺内一个由你选择、你能看见的未被占据的空间。如果该范围内没有未被占据的空间，你会出现在最近的未被占据的空间。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "self",
    "note": "每个回合结束时掷 1d6，掷出 4-6 就进入以太位面，下个回合开始时返回"
   }
  }
 },
 {
  "key": "blur",
  "name": "朦胧术",
  "level": 2,
  "school": "illusion",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你的身体变得模糊不清。在持续时间内，任何生物对你进行的攻击检定都具有劣势。如果攻击者通过盲视或真实视觉感知你，它对此效果免疫。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "self",
    "note": "对你进行的攻击检定具有劣势（用盲视或真实视觉感知你的攻击者除外）"
   }
  }
 },
 {
  "key": "burning-hands",
  "name": "燃烧之手",
  "level": 1,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身（15 尺锥形）",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "一片薄薄的火焰从你身上喷射而出。15 尺锥形区域内的每个生物都要进行一次敏捷豁免，失败受到 3d6 火焰伤害，成功则伤害减半。\n锥形区域内没有被穿戴或携带的易燃物会开始燃烧。",
  "higher": "升环施法：法术位每比 1 环高一环，伤害增加 1d6。",
  "mech": {
   "save": "dex",
   "onSave": "half",
   "damage": "3d6",
   "damageType": "fire",
   "damagePerSlot": "1d6"
  }
 },
 {
  "key": "call-lightning",
  "name": "召雷术",
  "level": 3,
  "school": "conjuration",
  "classes": [
   "druid"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "一团暴风云出现在射程内、你上方一个你能看见的点。它呈圆柱形，高 10 尺，半径 60 尺。\n施放此法术时，选择云下方一个你能看见的点。一道闪电从云中劈向该点。该点 5 尺内的每个生物都要进行一次敏捷豁免，失败受到 3d10 闪电伤害，成功则伤害减半。\n在法术结束前，你可以执行一次魔法动作，以同样的方式再次召下闪电，目标可以是同一个点，也可以是另一个点。\n如果施放此法术时你正身处户外的风暴之中，此法术会让你控制那场风暴，而不是制造一场新的风暴。在这种情况下，此法术的伤害增加 1d10。",
  "higher": "升环施法：法术位每比 3 环高一环，伤害增加 1d10。",
  "mech": {
   "save": "dex",
   "onSave": "half",
   "damage": "3d10",
   "damageType": "lightning",
   "damagePerSlot": "1d10"
  }
 },
 {
  "key": "calm-emotions",
  "name": "安定心神",
  "level": 2,
  "school": "enchantment",
  "classes": [
   "bard",
   "cleric"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "以射程内你选择的一点为中心、半径 20 尺的球形区域内的每个类人生物都必须成功通过一次魅力豁免，否则受到下列效果之一的影响（为每个生物分别选择）：\n• 在法术结束前，该生物对魅惑和恐慌状态免疫。如果该生物已经处于魅惑或恐慌状态，这些状态在持续时间内被压制。\n• 该生物对由你选择的、它所敌对的生物变得冷漠。如果目标受到伤害，或目睹它的盟友受到伤害，这种冷漠就会结束。法术结束时，该生物的态度恢复正常。",
  "higher": null,
  "mech": {
   "save": "cha",
   "onSave": "none",
   "effect": {
    "target": "targets",
    "note": "对每个生物二选一：免疫魅惑和恐慌（已有的被压制），或对你指定的敌对生物变得冷漠"
   }
  }
 },
 {
  "key": "charm-person",
  "name": "魅惑人类",
  "level": 1,
  "school": "enchantment",
  "classes": [
   "bard",
   "druid",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S",
  "duration": "1 小时",
  "concentration": false,
  "text": "射程内一个你能看见的类人生物进行一次感知豁免。如果你或你的盟友正在与它战斗，它这次豁免具有优势。豁免失败时，目标陷入魅惑状态，直到法术结束或你或你的盟友对它造成伤害为止。处于魅惑状态的目标对你友善。法术结束时，目标知道自己曾被你魅惑。",
  "higher": "升环施法：法术位每比 1 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "save": "wis",
   "onSave": "none",
   "condition": "charmed"
  }
 },
 {
  "key": "chill-touch",
  "name": "颤栗之触",
  "level": 0,
  "school": "necromancy",
  "classes": [
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你引导坟墓的寒意，对触及范围内的一个目标进行一次近战法术攻击。命中时，目标受到 1d10 暗蚀伤害，并且在你的下个回合结束前无法恢复生命值。",
  "higher": "戏法强化：当你达到 5 级（2d10）、11 级（3d10）和 17 级（4d10）时，伤害各增加 1d10。",
  "mech": {
   "attack": "melee",
   "damage": "1d10",
   "damageType": "necrotic",
   "cantripDice": "2d10"
  }
 },
 {
  "key": "chromatic-orb",
  "name": "繁彩球",
  "level": 1,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "90 尺",
  "components": "V、S、M（一颗价值至少 50 金币的钻石）",
  "duration": "立即",
  "concentration": false,
  "text": "你向射程内的一个目标掷出一颗能量球。从强酸、冷冻、火焰、闪电、毒素或雷鸣中选择你所创造的能量球的类型，然后对该目标进行一次远程法术攻击。命中时，目标受到 3d8 所选类型的伤害。\n如果你掷的 d8 中有两颗或更多颗点数相同，能量球会跳到该目标 30 尺内另一个由你选择的目标身上。对新目标进行一次攻击检定，并重新进行一次伤害掷骰。除非你用 2 环或更高的法术位施放此法术，否则能量球不能再次跳跃。",
  "higher": "升环施法：法术位每比 1 环高一环，伤害增加 1d8。能量球最多可以跳跃的次数等于所消耗法术位的环级，并且每次施放此法术，一个生物只能被选为目标一次。",
  "mech": {
   "attack": "ranged",
   "damage": "3d8",
   "damageType": "fire",
   "damageChoices": [
    "acid",
    "cold",
    "fire",
    "lightning",
    "poison",
    "thunder"
   ],
   "damagePerSlot": "1d8"
  }
 },
 {
  "key": "clairvoyance",
  "name": "千里眼",
  "level": 3,
  "school": "divination",
  "classes": [
   "bard",
   "cleric",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "10 分钟",
  "timing": "long",
  "ritual": false,
  "range": "1 英里",
  "components": "V、S、M（一件价值至少 100 金币的法器，可以是用于聆听的镶宝石号角，或用于观看的玻璃眼珠）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "你在射程内创造一个隐形的感应器，位置可以是你熟悉的地点（你去过或见过的地方），也可以是你不熟悉但显而易见的地点（例如门后、拐角处或一片树林中）。这个无形且无法被伤害的感应器在持续时间内停留在原地。\n施放此法术时，选择视觉或听觉。你可以通过感应器使用所选的感官，如同你身处它所在的空间。你可以用一次附赠动作在视觉和听觉之间切换。\n能看见感应器的生物（例如受到《识破隐形》效果影响或拥有真实视觉的生物）会看到一个大约你拳头大小的发光球体。",
  "higher": null,
  "mech": null
 },
 {
  "key": "color-spray",
  "name": "七彩喷射",
  "level": 1,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身（15 尺锥形）",
  "components": "V、S、M（一撮彩色沙子）",
  "duration": "立即",
  "concentration": false,
  "text": "你射出一片令人目眩、闪烁不定的彩色光芒。从你身上发出的 15 尺锥形区域内的每个生物都必须成功通过一次体质豁免，否则陷入目盲状态，直到你的下个回合结束。",
  "higher": null,
  "mech": {
   "save": "con",
   "onSave": "none",
   "condition": "blinded"
  }
 },
 {
  "key": "command",
  "name": "命令术",
  "level": 1,
  "school": "enchantment",
  "classes": [
   "bard",
   "cleric",
   "paladin"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V",
  "duration": "立即",
  "concentration": false,
  "text": "你对射程内一个你能看见的生物说出一个单词的命令。目标必须成功通过一次感知豁免，否则在它的下个回合执行该命令。从下列选项中选择命令：\n过来：目标沿最短、最直接的路线向你移动，如果它移动到你 5 尺之内，就结束它的回合。\n放下：目标放下它所持的任何东西，然后结束它的回合。\n逃跑：目标在它的回合中用它能用的最快方式远离你。\n趴下：目标陷入倒地状态，然后结束它的回合。\n停下：在它的回合中，目标不移动，也不执行任何动作或附赠动作。",
  "higher": "升环施法：法术位每比 1 环高一环，你可以多影响一个生物。",
  "mech": {
   "save": "wis",
   "onSave": "none"
  }
 },
 {
  "key": "comprehend-languages",
  "name": "通晓语言",
  "level": 1,
  "school": "divination",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "自身",
  "components": "V、S、M（一撮煤灰和盐）",
  "duration": "1 小时",
  "concentration": false,
  "text": "在持续时间内，你能理解你听到的任何语言，以及你看到的以手语表达的任何语言的字面意思。你也能理解你看到的任何书面语言，但你必须触摸写有文字的表面。阅读一页文字大约需要 1 分钟。此法术无法解读符号或密文。",
  "higher": null,
  "mech": null
 },
 {
  "key": "conjure-animals",
  "name": "召唤动物",
  "level": 3,
  "school": "conjuration",
  "classes": [
   "druid",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "你召唤出自然精魂，它们在射程内一个你能看见的未被占据的空间中显现为一个大型兽群，由幽灵般的无形动物组成。兽群在持续时间内存在，由你选择这些精魂的动物形态，例如狼、蛇或鸟。\n当你位于兽群 5 尺内时，你的力量豁免具有优势；并且当你在自己的回合中移动时，你还可以让兽群移动至多 30 尺，到达一个你能看见的未被占据的空间。\n每当兽群移动到一个你能看见的生物 10 尺内时，以及每当一个你能看见的生物进入距兽群 10 尺内的空间或在那里结束它的回合时，你可以迫使该生物进行一次敏捷豁免。豁免失败时，该生物受到 3d10 挥砍伤害。一个生物每回合只进行一次这种豁免。",
  "higher": "升环施法：法术位每比 3 环高一环，伤害增加 1d10。",
  "mech": {
   "save": "dex",
   "onSave": "none",
   "damage": "3d10",
   "damageType": "slashing",
   "damagePerSlot": "1d10"
  }
 },
 {
  "key": "continual-flame",
  "name": "不灭明焰",
  "level": 2,
  "school": "evocation",
  "classes": [
   "cleric",
   "druid",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（价值至少 50 金币的红宝石粉，法术会消耗它）",
  "duration": "直到被解除",
  "concentration": false,
  "text": "一团火焰从你触碰的一个物体上燃起。这个效果发出半径 20 尺的明亮光照，并在其外再发出 20 尺的微光。它看起来就像普通的火焰，但不产生热量，也不消耗燃料。这团火焰可以被遮盖或藏起，但不能被闷熄或浇灭。",
  "higher": null,
  "mech": null
 },
 {
  "key": "counterspell",
  "name": "法术反制",
  "level": 3,
  "school": "abjuration",
  "classes": [
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "反应（你看到你 60 尺内的一个生物施放带有言语、姿势或材料成分的法术时）",
  "timing": "reaction",
  "ritual": false,
  "range": "60 尺",
  "components": "S",
  "duration": "立即",
  "concentration": false,
  "text": "你试图打断一个正在施法的生物。该生物进行一次体质豁免。豁免失败时，该法术消散且没有效果，用来施放它的动作、附赠动作或反应也被浪费。如果该法术是用法术位施放的，该法术位不会被消耗。",
  "higher": null,
  "mech": {
   "save": "con",
   "onSave": "none"
  }
 },
 {
  "key": "create-food-and-water",
  "name": "造粮术",
  "level": 3,
  "school": "conjuration",
  "classes": [
   "cleric",
   "paladin"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你在射程内的地面上或容器中创造 45 磅食物和 30 加仑淡水，两者都能用来抵御营养不良和脱水的危害。食物平淡无味但富有营养，外观是你选择的某种食物；水则干净清洁。食物如果没被吃掉，会在 24 小时后腐坏。",
  "higher": null,
  "mech": null
 },
 {
  "key": "create-or-destroy-water",
  "name": "造水术／枯水术",
  "level": 1,
  "school": "transmutation",
  "classes": [
   "cleric",
   "druid"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S、M（水和沙子的混合物）",
  "duration": "立即",
  "concentration": false,
  "text": "你执行下列其中一项：\n造水：你在射程内一个敞口容器中创造至多 10 加仑的清水。或者，你也可以让这些水化作雨水，落在射程内一个 30 尺立方区域中，浇灭那里暴露在外的火焰。\n枯水：你消灭射程内一个敞口容器中至多 10 加仑的水。或者，你也可以消除射程内一个 30 尺立方区域中的雾气。",
  "higher": "升环施法：法术位每比 1 环高一环，你多创造或消灭 10 加仑水，或者立方区域的边长增加 5 尺。",
  "mech": null
 },
 {
  "key": "cure-wounds",
  "name": "疗伤术",
  "level": 1,
  "school": "abjuration",
  "classes": [
   "bard",
   "cleric",
   "druid",
   "paladin",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你触碰的一个生物恢复生命值，数值等于 2d8 加上你的施法属性调整值。",
  "higher": "升环施法：法术位每比 1 环高一环，治疗量增加 2d8。",
  "mech": {
   "heal": "2d8",
   "addMod": true,
   "healPerSlot": "2d8"
  }
 },
 {
  "key": "dancing-lights",
  "name": "舞光术",
  "level": 0,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S、M（一点磷）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你在射程内创造至多四个火炬大小的光源，让它们看起来像火炬、提灯或发光的球体，在持续时间内悬浮在空中。或者，你也可以把四个光源合成一个隐约呈人形的中型发光形体。无论你选择哪种形态，每个光源都发出半径 10 尺的微光。\n你可以用一次附赠动作，让这些光源移动至多 60 尺，到达射程内的一个空间。每个光源都必须位于此法术创造的另一个光源 20 尺之内，并且光源超出法术射程时会消失。",
  "higher": null,
  "mech": null
 },
 {
  "key": "darkness",
  "name": "黑暗术",
  "level": 2,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、M（蝙蝠毛和一块煤）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "在持续时间内，魔法黑暗从射程内的一点扩散开来，充满一个半径 15 尺的球形区域。黑暗视觉无法看穿它，非魔法光源也无法照亮它。\n或者，你也可以对一个没有被穿戴或携带的物体施放此法术，让黑暗充满从该物体发出的 15 尺散发区域。用不透光的东西（例如碗或头盔）盖住该物体，就能挡住黑暗。\n如果此法术的区域与 2 环或更低环级法术所创造的明亮光照或微光区域有任何重叠，那个法术就会被解除。",
  "higher": null,
  "mech": null
 },
 {
  "key": "darkvision",
  "name": "黑暗视觉术",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "druid",
   "ranger",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一根胡萝卜干）",
  "duration": "8 小时",
  "concentration": false,
  "text": "在持续时间内，你触碰的一个自愿生物获得范围 150 尺的黑暗视觉。",
  "higher": null,
  "mech": null
 },
 {
  "key": "daylight",
  "name": "昼明术",
  "level": 3,
  "school": "evocation",
  "classes": [
   "cleric",
   "druid",
   "paladin",
   "ranger",
   "sorcerer"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "1 小时",
  "concentration": false,
  "text": "在持续时间内，阳光从射程内的一点扩散开来，充满一个半径 60 尺的球形区域。阳光区域内是明亮光照，并在其外再发出 60 尺的微光。\n或者，你也可以对一个没有被穿戴或携带的物体施放此法术，让阳光充满从该物体发出的 60 尺散发区域。用不透光的东西（例如碗或头盔）盖住该物体，就能挡住阳光。\n如果此法术的区域与 3 环或更低环级法术所创造的黑暗区域有任何重叠，那个法术就会被解除。",
  "higher": null,
  "mech": null
 },
 {
  "key": "detect-evil-and-good",
  "name": "侦测善恶",
  "level": 1,
  "school": "divination",
  "classes": [
   "cleric",
   "paladin"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "在持续时间内，你能感知你 30 尺内任何异怪、天界生物、元素生物、精类、邪魔或不死生物的位置。你还能感知那里是否有《圣居》法术在生效，如果有，在何处生效。\n此法术会被 1 尺厚的石头、泥土或木头，1 英寸厚的金属，或一层薄铅板阻挡。",
  "higher": null,
  "mech": null
 },
 {
  "key": "detect-magic",
  "name": "侦测魔法",
  "level": 1,
  "school": "divination",
  "classes": [
   "bard",
   "cleric",
   "druid",
   "paladin",
   "ranger",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "自身",
  "components": "V、S",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "在持续时间内，你能感知你 30 尺内魔法效应的存在。如果你感知到这类效应，你可以执行魔法动作，看到该区域内任何带有魔法的可见生物或物体周围的一圈微弱灵光；如果某个效应是由法术创造的，你还会得知该法术的学派。\n此法术会被 1 尺厚的石头、泥土或木头，1 英寸厚的金属，或一层薄铅板阻挡。",
  "higher": null,
  "mech": null
 },
 {
  "key": "detect-poison-and-disease",
  "name": "侦测毒性和疾病",
  "level": 1,
  "school": "divination",
  "classes": [
   "cleric",
   "druid",
   "paladin",
   "ranger"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "自身",
  "components": "V、S、M（一片紫杉叶）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "在持续时间内，你能感知你 30 尺内毒药、有毒或带毒液的生物以及魔法传染病的位置。在每种情况下，你都能感知毒药、生物或传染病的种类。\n此法术会被 1 尺厚的石头、泥土或木头，1 英寸厚的金属，或一层薄铅板阻挡。",
  "higher": null,
  "mech": null
 },
 {
  "key": "detect-thoughts",
  "name": "侦测思想",
  "level": 2,
  "school": "divination",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S、M（1 枚铜币）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你启动下列效果之一。在法术结束前，你可以在之后的回合中，用一次魔法动作启动其中任意一种效果。\n感知思想：你能感知你 30 尺内的思想，这些思想属于懂得语言或具有心灵感应能力的生物。你不会读取这些思想，但你知道那里有一个会思考的生物。\n此法术会被 1 尺厚的石头、泥土或木头，1 英寸厚的金属，或一层薄铅板阻挡。\n读取思想：以你 30 尺内一个你能看见的生物，或你通过“感知思想”选项侦测到的你 30 尺内的一个生物为目标。你得知目标此刻心里最在想的事情。如果目标不懂任何语言，也没有心灵感应能力，你什么也得不到。\n在你的下个回合，你可以执行一次魔法动作，尝试更深入地探查目标的心灵。如果你深入探查，目标进行一次感知豁免。豁免失败时，你能洞察目标的思路、情绪，以及在它心中占据重要位置的某件事（例如一份担忧、爱或恨）。豁免成功时，法术结束。无论成功与否，目标都知道你正在探查它的心灵；并且在你把注意力从目标的心灵上移开之前，目标可以在它的回合中执行一个动作，进行一次对抗你法术豁免 DC 的智力（奥秘）检定，成功则法术结束。",
  "higher": null,
  "mech": null
 },
 {
  "key": "disguise-self",
  "name": "易容术",
  "level": 1,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S",
  "duration": "1 小时",
  "concentration": false,
  "text": "你让自己——包括你的衣物、护甲、武器和你身上的其他随身物品——看起来与原来不同，直到法术结束。你可以让自己显得矮 1 尺或高 1 尺，也可以显得更重或更轻。你必须采用一个与你的肢体基本构造相同的形态。除此之外，幻象的程度由你决定。\n此法术造成的变化经不起实际的触碰检验。例如，如果你用此法术给自己的装束添上一顶帽子，物体会从帽子中穿过，任何触摸它的人都摸不到任何东西。\n生物要识破你的伪装，必须执行研究动作检查你的外貌，并在一次对抗你法术豁免 DC 的智力（调查）检定中成功。",
  "higher": null,
  "mech": null
 },
 {
  "key": "dispel-magic",
  "name": "解除魔法",
  "level": 3,
  "school": "abjuration",
  "classes": [
   "bard",
   "cleric",
   "druid",
   "paladin",
   "ranger",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "选择射程内的一个生物、物体或魔法效应。目标身上任何 3 环或更低环级的持续生效法术都会结束。对于目标身上每个 4 环或更高环级的持续生效法术，你用你的施法属性进行一次属性检定（DC 10 + 该法术的环级）。检定成功时，该法术结束。",
  "higher": "升环施法：如果目标身上某个法术的环级等于或低于你所用法术位的环级，你会自动结束该法术。",
  "mech": null
 },
 {
  "key": "dissonant-whispers",
  "name": "不谐低语",
  "level": 1,
  "school": "enchantment",
  "classes": [
   "bard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V",
  "duration": "立即",
  "concentration": false,
  "text": "射程内一个由你选择、你能看见的生物在心中听到一段不和谐的旋律。目标进行一次感知豁免。豁免失败时，它受到 3d6 心灵伤害，并且如果它的反应可用，它必须立即使用反应，沿最安全的路线尽可能远离你。豁免成功时，目标只受到一半伤害。",
  "higher": "升环施法：法术位每比 1 环高一环，伤害增加 1d6。",
  "mech": {
   "save": "wis",
   "onSave": "half",
   "damage": "3d6",
   "damageType": "psychic",
   "damagePerSlot": "1d6"
  }
 },
 {
  "key": "divine-favor",
  "name": "神恩",
  "level": 1,
  "school": "transmutation",
  "classes": [
   "paladin"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "自身",
  "components": "V、S",
  "duration": "1 分钟",
  "concentration": false,
  "text": "在法术结束前，你的武器攻击命中时额外造成 1d4 光耀伤害。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "self",
    "damageDice": "1d4",
    "damageType": "radiant",
    "note": "武器攻击命中时额外造成 1d4 光耀伤害"
   }
  }
 },
 {
  "key": "divine-smite",
  "name": "至圣斩",
  "level": 1,
  "school": "evocation",
  "classes": [
   "paladin"
  ],
  "castingTime": "附赠动作（你用近战武器或徒手打击命中目标后立即执行）",
  "timing": "bonus",
  "ritual": false,
  "range": "自身",
  "components": "V",
  "duration": "立即",
  "concentration": false,
  "text": "目标因这次攻击额外受到 2d8 光耀伤害。如果目标是邪魔或不死生物，这份伤害增加 1d8。",
  "higher": "升环施法：法术位每比 1 环高一环，伤害增加 1d8。",
  "mech": {
   "auto": true,
   "damage": "2d8",
   "damageType": "radiant",
   "damagePerSlot": "1d8"
  }
 },
 {
  "key": "dragons-breath",
  "name": "龙息术",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一个辣椒）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你触碰一个自愿生物，并从强酸、冷冻、火焰、闪电或毒素中选择一种。在法术结束前，目标可以执行一次魔法动作，呼出一道 15 尺锥形的吐息。该区域内的每个生物都要进行一次敏捷豁免，失败受到 3d6 所选类型的伤害，成功则伤害减半。",
  "higher": "升环施法：法术位每比 2 环高一环，伤害增加 1d6。",
  "mech": {
   "save": "dex",
   "onSave": "half",
   "damage": "3d6",
   "damageType": "fire",
   "damageChoices": [
    "acid",
    "cold",
    "fire",
    "lightning",
    "poison"
   ],
   "damagePerSlot": "1d6"
  }
 },
 {
  "key": "druidcraft",
  "name": "德鲁伊伎俩",
  "level": 0,
  "school": "transmutation",
  "classes": [
   "druid"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你向自然之灵低语，在射程内创造下列效果之一。\n天气感知：你创造一个微型的无害感官效果，预测你所在位置接下来 24 小时的天气。这个效果可能显现为代表晴天的金色球体、代表下雨的云朵、代表下雪的飘落雪花等等。此效果持续 1 轮。\n绽放：你立即让一朵花开放、一个种荚裂开，或一个叶芽舒展。\n感官效果：你创造一个无害的感官效果，例如飘落的树叶、幽灵般起舞的小仙子、一阵轻柔的微风、动物的叫声，或淡淡的臭鼬气味。此效果必须能容纳在一个 5 尺立方之内。\n玩火：你点燃或熄灭一根蜡烛、一支火炬或一堆营火。",
  "higher": null,
  "mech": null
 },
 {
  "key": "eldritch-blast",
  "name": "魔能爆",
  "level": 0,
  "school": "evocation",
  "classes": [
   "warlock"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你掷出一道噼啪作响的能量光束。对射程内的一个生物或物体进行一次远程法术攻击。命中时，目标受到 1d10 力场伤害。",
  "higher": "戏法强化：此法术在你 5 级时产生两道光束，11 级时三道，17 级时四道。你可以让这些光束射向同一个目标，也可以射向不同的目标。每道光束分别进行一次攻击检定。",
  "mech": {
   "attack": "ranged",
   "damage": "1d10",
   "damageType": "force",
   "countAtLevel5": 2
  }
 },
 {
  "key": "elementalism",
  "name": "元素操控术",
  "level": 0,
  "school": "transmutation",
  "classes": [
   "druid",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你操控元素之力，在射程内创造下列效果之一。\n唤风：你制造一阵微风，强度足以让布料飘动、扬起尘土、吹得树叶沙沙作响，并关上敞开的门和百叶窗，这一切都发生在一个 5 尺立方之内。被人或物撑住而敞开的门和百叶窗不受影响。\n唤土：你制造一层薄薄的尘土或沙子，覆盖一块 5 尺见方区域的表面；或者，你让一个单词以你的笔迹出现在一片泥土或沙子上。\n唤火：你在一个 5 尺立方内制造一团薄薄的云，由无害的余烬和带颜色、带气味的烟雾组成。你选择颜色和气味，余烬可以点燃该区域内的蜡烛、火炬或灯。烟雾的气味会残留 1 分钟。\n唤水：你制造一阵清凉的水雾，轻轻沾湿一个 5 尺立方内的生物和物体。或者，你也可以在一个敞口容器中或一个表面上创造 1 杯清水，这些水会在 1 分钟后蒸发。\n塑形元素：你让能容纳在一个 1 尺立方内的泥土、沙子、火、烟、雾或水呈现一个粗略的形状（例如某种生物的形状），持续 1 小时。",
  "higher": null,
  "mech": null
 },
 {
  "key": "enhance-ability",
  "name": "强化属性",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "bard",
   "cleric",
   "druid",
   "ranger",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（毛皮或一根羽毛）",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "你触碰一个生物，并从力量、敏捷、智力、感知或魅力中选择一项。在持续时间内，目标使用所选属性进行的属性检定具有优势。",
  "higher": "升环施法：法术位每比 2 环高一环，你可以多选择一个生物作为目标。你可以为每个目标选择不同的属性。",
  "mech": {
   "effect": {
    "target": "targets",
    "note": "所选属性的属性检定具有优势"
   }
  }
 },
 {
  "key": "enlarge-reduce",
  "name": "变巨／缩小术",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "bard",
   "druid",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S、M（一撮铁粉）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "在持续时间内，此法术让射程内一个你能看见的生物或物体变大或缩小（效果见下方你所选的选项）。作为目标的物体必须既没有被穿戴，也没有被携带。如果目标是不自愿的生物，它可以进行一次体质豁免。豁免成功时，此法术没有效果。\n作为目标的生物所穿戴和携带的一切物品都会随它一起改变尺寸。它丢下的任何物品会立即恢复正常尺寸。投掷武器或弹药在命中或未命中目标后会立即恢复正常尺寸。\n变巨：目标的体型增大一级，例如从中型变为大型。目标的力量检定和力量豁免还具有优势。目标用变大的武器或徒手打击进行的攻击命中时，额外造成 1d4 伤害。\n缩小：目标的体型缩小一级，例如从中型变为小型。目标的力量检定和力量豁免还具有劣势。目标用缩小的武器或徒手打击进行的攻击命中时，少造成 1d4 伤害（伤害不会因此降到 1 以下）。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "note": "变巨：体型大一级，力量检定和力量豁免优势，武器和徒手打击伤害 +1d4；缩小：体型小一级，力量检定和力量豁免劣势，伤害 -1d4（最低 1）"
   }
  }
 },
 {
  "key": "ensnaring-strike",
  "name": "诱捕打击",
  "level": 1,
  "school": "conjuration",
  "classes": [
   "ranger"
  ],
  "castingTime": "附赠动作（你用武器命中一个生物后立即执行）",
  "timing": "bonus",
  "ritual": false,
  "range": "自身",
  "components": "V",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "在你命中目标的同时，抓攫的藤蔓出现在它身上，它进行一次力量豁免。大型或更大的生物这次豁免具有优势。豁免失败时，目标陷入束缚状态，直到法术结束。豁免成功时，藤蔓枯萎消失，法术结束。\n处于束缚状态期间，目标在它的每个回合开始时受到 1d6 穿刺伤害。目标或位于其触及范围内的一个生物可以执行一个动作，进行一次对抗你法术豁免 DC 的力量（运动）检定。成功则法术结束。",
  "higher": "升环施法：法术位每比 1 环高一环，伤害增加 1d6。",
  "mech": {
   "save": "str",
   "onSave": "none",
   "condition": "restrained",
   "effect": {
    "target": "targets",
    "note": "束缚期间，每个回合开始时受到 1d6 穿刺伤害（法术位每高一环 +1d6）"
   }
  }
 },
 {
  "key": "entangle",
  "name": "纠缠术",
  "level": 1,
  "school": "conjuration",
  "classes": [
   "druid",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "90 尺",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "抓攫的植物从射程内一块 20 尺见方的地面上冒出。在持续时间内，这些植物让该区域的地面成为困难地形。法术结束时，它们会消失。\n施放此法术时位于该区域内的每个生物（你除外）都必须成功通过一次力量豁免，否则陷入束缚状态，直到法术结束。处于束缚状态的生物可以执行一个动作，进行一次对抗你法术豁免 DC 的力量（运动）检定。成功时，它从抓攫的植物中挣脱，不再因它们而处于束缚状态。",
  "higher": null,
  "mech": {
   "save": "str",
   "onSave": "none",
   "condition": "restrained"
  }
 },
 {
  "key": "enthrall",
  "name": "迷惑术",
  "level": 2,
  "school": "enchantment",
  "classes": [
   "bard",
   "warlock"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你编织出一串令人分心的话语，让射程内由你选择、你能看见的生物进行一次感知豁免。任何正在与你或你的同伴战斗的生物自动通过这次豁免。豁免失败时，目标的感知（察觉）检定和被动察觉受到 -10 的减值，直到法术结束。",
  "higher": null,
  "mech": {
   "save": "wis",
   "onSave": "none",
   "effect": {
    "target": "targets",
    "note": "感知（察觉）检定和被动察觉 -10"
   }
  }
 },
 {
  "key": "expeditious-retreat",
  "name": "脚底抹油",
  "level": 1,
  "school": "transmutation",
  "classes": [
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "自身",
  "components": "V、S",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "你执行疾走动作，并且在法术结束前，你可以用附赠动作再次执行该动作。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "self",
    "note": "可以用附赠动作执行疾走"
   }
  }
 },
 {
  "key": "faerie-fire",
  "name": "妖火",
  "level": 1,
  "school": "evocation",
  "classes": [
   "bard",
   "druid"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "射程内一个 20 尺立方区域中的物体被蓝色、绿色或紫色的光芒（由你选择）勾勒出轮廓。该立方区域内的每个生物如果敏捷豁免失败，也会被勾勒出轮廓。在持续时间内，这些物体和受影响的生物发出半径 10 尺的微光，并且无法从隐形状态中获益。\n如果攻击者能看见受影响的生物或物体，对其进行的攻击检定具有优势。",
  "higher": null,
  "mech": {
   "save": "dex",
   "onSave": "none",
   "effect": {
    "target": "targets",
    "note": "发出半径 10 尺的微光，不能从隐形状态中获益；能看见它的攻击者对它的攻击检定具有优势"
   }
  }
 },
 {
  "key": "false-life",
  "name": "虚假生命",
  "level": 1,
  "school": "necromancy",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S、M（一滴酒精）",
  "duration": "立即",
  "concentration": false,
  "text": "你获得 2d4+4 点临时生命值。",
  "higher": "升环施法：法术位每比 1 环高一环，你额外获得 5 点临时生命值。",
  "mech": {
   "tempHp": "2d4+4",
   "tempHpPerSlot": "5"
  }
 },
 {
  "key": "fear",
  "name": "恐惧术",
  "level": 3,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身（30 尺锥形）",
  "components": "V、S、M（一根白色羽毛）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "30 尺锥形区域内的每个生物都必须成功通过一次感知豁免，否则丢下它手中所持的任何东西，并在持续时间内陷入恐慌状态。\n处于恐慌状态的生物在它的每个回合都会执行疾走动作，并沿最安全的路线远离你，除非它无处可去。如果该生物在一个与你之间没有视线的空间结束它的回合，它进行一次感知豁免。豁免成功时，法术对该生物的效果结束。",
  "higher": null,
  "mech": {
   "save": "wis",
   "onSave": "none",
   "condition": "frightened"
  }
 },
 {
  "key": "feather-fall",
  "name": "羽落术",
  "level": 1,
  "school": "transmutation",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "反应（你或你 60 尺内一个你能看见的生物坠落时）",
  "timing": "reaction",
  "ritual": false,
  "range": "60 尺",
  "components": "V、M（一根小羽毛或一片绒羽）",
  "duration": "1 分钟",
  "concentration": false,
  "text": "选择射程内至多五个正在坠落的生物。直到法术结束，坠落生物的下降速率减缓为每轮 60 尺。如果生物在法术结束前着地，它不会因坠落受到任何伤害，并且法术对该生物结束。",
  "higher": null,
  "mech": null
 },
 {
  "key": "find-familiar",
  "name": "寻获魔宠",
  "level": 1,
  "school": "conjuration",
  "classes": [
   "wizard"
  ],
  "castingTime": "1 小时，可仪式施放",
  "timing": "long",
  "ritual": true,
  "range": "10 尺",
  "components": "V、S、M（价值至少 10 金币的燃香，法术会将其消耗）",
  "duration": "立即",
  "concentration": false,
  "text": "你获得一只魔宠的效劳。魔宠是一个精魂，会化作你所选的一种动物形态：蝙蝠、猫、青蛙、鹰、蜥蜴、章鱼、猫头鹰、老鼠、渡鸦、蜘蛛、鼬鼠，或其他挑战等级为 0 的野兽。魔宠出现在射程内一处未被占据的空间，具有所选形态的数据（见「怪物」），但它的生物类型是天界生物、精类或邪魔（由你选择），而不是野兽。你的魔宠独立于你行动，但会服从你的命令。\n心灵感应联系。当你的魔宠位于你 100 尺内时，你可以与它进行心灵感应交流。此外，你可以执行一个附赠动作，透过魔宠的眼睛去看、听它所听到的声音，直到你的下个回合开始，并获得它所具有的任何特殊感官的益处。\n最后，当你施放射程为触及的法术时，可以由你的魔宠来传递这次触碰。你的魔宠必须位于你 100 尺内，并且必须在你施放该法术时用它的反应来传递触碰。\n战斗。魔宠是你和你的盟友的友方。它自行掷先攻，并在自己的回合行动。魔宠不能攻击，但可以照常执行其他动作。\n魔宠的消失。魔宠的生命值降到 0 时会消失，在你再次施放本法术后重新出现。你可以执行魔法动作，把魔宠暂时遣散到一个口袋次元中；你也可以将它永久遣散。魔宠被暂时遣散期间，你可以执行魔法动作，让它重新出现在你 30 尺内一处未被占据的空间。每当魔宠的生命值降到 0 或消失进口袋次元时，它都会把身上穿戴或携带的所有东西留在它所在的空间。\n仅限一只魔宠。你同一时间不能拥有超过一只魔宠。如果你在已有魔宠时施放本法术，改为让它变成另一种符合条件的形态。",
  "higher": null,
  "mech": null
 },
 {
  "key": "find-steed",
  "name": "寻获坐骑",
  "level": 2,
  "school": "conjuration",
  "classes": [
   "paladin"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你召唤一个异界存在，它以一匹忠诚坐骑的样子出现在射程内你选择的一处未被占据的空间。这个生物使用下方的「异界坐骑」数据卡。如果你已经有一匹通过本法术获得的坐骑，它会被新的坐骑取代。\n坐骑的外形是一种由你选择、可供骑乘的大型动物，例如马、骆驼、恐狼或麋鹿。每次施放本法术时，你都要为坐骑选择生物类型——天界生物、精类或邪魔，这决定了数据卡中的某些特性。\n战斗。坐骑是你和你的盟友的友方。战斗中，它与你共用同一个先攻顺位；你骑乘它时，它作为受控坐骑行动（见骑乘战斗的规则）。如果你陷入失能状态，坐骑会紧接在你的回合之后进行它的回合，并独立行动，专注于保护你。\n坐骑的消失。坐骑的生命值降到 0 或你死亡时，坐骑会消失。坐骑消失时，会留下它穿戴或携带的所有东西。你再次施放本法术时，可以决定召唤那匹消失的坐骑还是另一匹。\n异界坐骑（数据卡）\n大型天界生物、精类或邪魔（由你选择），中立\nAC：10 + 法术环级\n生命值：5 + 10 × 法术环级（坐骑的生命骰为 d10，数量等于法术环级）\n速度：60 尺，飞行 60 尺（法术环级须为 4 或更高）\n力量 18（调整值 +4，豁免 +4）；敏捷 12（调整值 +1，豁免 +1）；体质 14（调整值 +2，豁免 +2）；智力 6（调整值 -2，豁免 -2）；感知 12（调整值 +1，豁免 +1）；魅力 8（调整值 -1，豁免 -1）\n感官：被动察觉 11\n语言：心灵感应 1 英里（只对你有效）\n挑战等级：无（经验值 0；熟练加值等于你的熟练加值）\n特性\n生命联结。当你通过 1 环或更高的法术恢复生命值时，如果你在坐骑 5 尺内，坐骑也恢复相同数量的生命值。\n动作\n异界猛击。近战攻击检定：加值等于你的法术攻击调整值，触及 5 尺。命中：1d8 + 法术环级的光耀（天界生物）、心灵（精类）或暗蚀（邪魔）伤害。\n附赠动作\n凶光怒视（仅限邪魔；长休后充能）。感知豁免：DC 等于你的法术豁免 DC，坐骑 60 尺内一个它能看见的生物。失败：目标陷入恐慌状态，直到你的下个回合结束。\n精类步伐（仅限精类；长休后充能）。坐骑连同它的骑手一起传送到距离它至多 60 尺、由你选择的一处未被占据的空间。\n治疗之触（仅限天界生物；长休后充能）。坐骑 5 尺内的一个生物恢复生命值，数值等于 2d8 + 法术环级。",
  "higher": "升环施法：数据卡中提到的法术环级，按你施放本法术所用法术位的环级计算。",
  "mech": null
 },
 {
  "key": "find-traps",
  "name": "寻找陷阱",
  "level": 2,
  "school": "divination",
  "classes": [
   "cleric",
   "druid",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你能感知到射程内、处在你视线范围内的任何陷阱。就本法术而言，陷阱包括任何为造成伤害或其他危险而制造的物体或机关。因此，本法术能感知到《警报术》或《守卫刻文》法术，或机械式的陷坑，但不会揭示地板天然的薄弱处、不稳固的天花板或隐蔽的天坑。\n本法术只揭示有陷阱存在，而不揭示它的位置。不过，你确实会得知你所感知到的陷阱会带来何种危险的大致性质。",
  "higher": null,
  "mech": null
 },
 {
  "key": "fireball",
  "name": "火球术",
  "level": 3,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "150 尺",
  "components": "V、S、M（一小团蝙蝠粪和硫磺）",
  "duration": "立即",
  "concentration": false,
  "text": "一道明亮的光从你身上射向射程内你选择的一点，随后伴着一声低沉的轰鸣绽开成一团火焰爆炸。以该点为中心、半径 20 尺的球形区域内的每个生物都要进行一次敏捷豁免，失败受到 8d6 火焰伤害，成功则伤害减半。\n区域内没有被穿戴或携带的易燃物会开始燃烧。",
  "higher": "升环施法：法术位每比 3 环高一环，伤害增加 1d6。",
  "mech": {
   "save": "dex",
   "onSave": "half",
   "damage": "8d6",
   "damageType": "fire",
   "damagePerSlot": "1d6"
  }
 },
 {
  "key": "fire-bolt",
  "name": "火焰箭",
  "level": 0,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你向射程内的一个生物或物体掷出一簇火焰。对目标进行一次远程法术攻击。命中时，目标受到 1d10 火焰伤害。被本法术命中的易燃物体如果没有被穿戴或携带，就会开始燃烧。",
  "higher": "戏法强化：你达到 5 级（2d10）、11 级（3d10）和 17 级（4d10）时，伤害各增加 1d10。",
  "mech": {
   "attack": "ranged",
   "damage": "1d10",
   "damageType": "fire",
   "cantripDice": "2d10"
  }
 },
 {
  "key": "flame-blade",
  "name": "炽焰刀",
  "level": 2,
  "school": "evocation",
  "classes": [
   "druid",
   "sorcerer"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "自身",
  "components": "V、S、M（一片漆树叶）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "你在空着的手中唤出一把火焰之刃。刀刃的大小和形状与弯刀相仿，持续到法术结束。如果你松开这把刀，它就会消失，但你可以用附赠动作再次唤出它。\n你可以执行魔法动作，用火焰之刃进行一次近战法术攻击。命中时，目标受到 3d6 + 你的施法属性调整值的火焰伤害。\n这把燃烧的刀刃在 10 尺半径内发出明亮光照，并在此外 10 尺内发出微光。",
  "higher": "升环施法：法术位每比 2 环高一环，伤害增加 1d6。",
  "mech": {
   "attack": "melee",
   "damage": "3d6",
   "damageType": "fire",
   "addMod": true,
   "damagePerSlot": "1d6"
  }
 },
 {
  "key": "flaming-sphere",
  "name": "炽焰法球",
  "level": 2,
  "school": "conjuration",
  "classes": [
   "druid",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一团蜡）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你在射程内地面上一处未被占据的空间造出一颗直径 5 尺的火焰球体，它持续到法术结束。任何在球体 5 尺内结束自己回合的生物都要进行一次敏捷豁免，失败受到 2d6 火焰伤害，成功则伤害减半。\n你可以用附赠动作让球体沿着地面滚动，移动至多 30 尺。如果你把球体移进一个生物的空间，该生物要对球体进行这次豁免，并且球体在本回合停止移动。\n移动球体时，你可以引导它越过至多 5 尺高的障碍，也可以让它跳过至多 10 尺宽的坑洞。没有被穿戴或携带的易燃物体被球体碰到就会开始燃烧。球体在 20 尺半径内发出明亮光照，并在此外 20 尺内发出微光。",
  "higher": "升环施法：法术位每比 2 环高一环，伤害增加 1d6。",
  "mech": {
   "save": "dex",
   "onSave": "half",
   "damage": "2d6",
   "damageType": "fire",
   "damagePerSlot": "1d6"
  }
 },
 {
  "key": "floating-disk",
  "name": "漂浮圆盘",
  "level": 1,
  "school": "conjuration",
  "classes": [
   "wizard"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "30 尺",
  "components": "V、S、M（一滴水银）",
  "duration": "1 小时",
  "concentration": false,
  "text": "本法术造出一块直径 3 尺、厚 1 寸的圆形水平力场平面，它漂浮在射程内一处你能看见、由你选择的未被占据的空间中，离地 3 尺。圆盘在持续时间内一直存在，最多能承载 500 磅。如果放在上面的重量超过这个数，法术结束，圆盘上的所有东西都会掉到地上。\n你在圆盘 20 尺内时，圆盘保持不动。如果你离开它超过 20 尺，圆盘会跟随你，让自己保持在你 20 尺内。它能越过不平的地面、上下楼梯、斜坡之类的地形，但无法越过 10 尺或更大的高度落差。例如，圆盘无法越过 10 尺深的坑；如果它是在这样的坑底被造出来的，也离不开这个坑。\n如果你离开圆盘超过 100 尺（通常是因为它无法绕过障碍物跟上你），法术结束。",
  "higher": null,
  "mech": null
 },
 {
  "key": "fly",
  "name": "飞行术",
  "level": 3,
  "school": "transmutation",
  "classes": [
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一根羽毛）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "你触碰一个自愿的生物。在持续时间内，目标获得 60 尺的飞行速度，并且能够悬浮。法术结束时，如果目标仍在空中，它会坠落，除非它有办法阻止坠落。",
  "higher": "升环施法：法术位每比 3 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "effect": {
    "target": "targets",
    "note": "飞行速度 60 尺，可以悬浮；法术结束时若仍在空中会坠落"
   }
  }
 },
 {
  "key": "fog-cloud",
  "name": "云雾术",
  "level": 1,
  "school": "conjuration",
  "classes": [
   "druid",
   "ranger",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "你以射程内的一点为中心，造出一片半径 20 尺的球形雾气。该球形区域为重度遮蔽。雾气持续到法术结束，或直到被强风（例如《造风术》造出的风）吹散为止。",
  "higher": "升环施法：法术位每比 1 环高一环，雾的半径增加 20 尺。",
  "mech": null
 },
 {
  "key": "gaseous-form",
  "name": "气化形体",
  "level": 3,
  "school": "transmutation",
  "classes": [
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一小块薄纱）",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "你触碰的一个自愿生物连同它穿戴和携带的一切，在持续时间内变形为一团雾气。如果目标的生命值降到 0，或它执行魔法动作结束自身上的这个法术，法术对它结束。\n处于这种形态时，目标唯一的移动方式是 10 尺的飞行速度，并且能够悬浮。目标可以进入并占据其他生物的空间。目标对钝击、穿刺和挥砍伤害具有抗性，免疫倒地状态，并且在力量、敏捷和体质豁免上具有优势。目标可以穿过狭窄的开口，但会把液体当作固体表面对待。\n目标不能说话或操纵物体，它携带或手持的任何物体都不能被丢下、使用或以其他方式互动。最后，目标不能攻击或施放法术。",
  "higher": "升环施法：法术位每比 3 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "effect": {
    "target": "targets",
    "resist": [
     "bludgeoning",
     "piercing",
     "slashing"
    ],
    "note": "化为雾气：只能以 10 尺飞行速度移动、可悬浮；免疫倒地；力量、敏捷、体质豁免具有优势；不能说话、操纵物体、攻击或施法"
   }
  }
 },
 {
  "key": "gentle-repose",
  "name": "防腐术",
  "level": 2,
  "school": "necromancy",
  "classes": [
   "cleric",
   "paladin",
   "wizard"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "触及",
  "components": "V、S、M（2 铜币，法术会将其消耗）",
  "duration": "10 天",
  "concentration": false,
  "text": "你触碰一具尸体或其他遗骸。在持续时间内，目标不会腐烂，也不会变成不死生物。\n本法术还能实际上延长将目标起死回生的时限，因为处于本法术影响下的天数不计入《死者复活》等法术的时限。",
  "higher": null,
  "mech": null
 },
 {
  "key": "glyph-of-warding",
  "name": "守卫刻文",
  "level": 3,
  "school": "abjuration",
  "classes": [
   "bard",
   "cleric",
   "wizard"
  ],
  "castingTime": "1 小时",
  "timing": "long",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（价值至少 200 金币的钻石粉，法术会将其消耗）",
  "duration": "直到被解除或触发",
  "concentration": false,
  "text": "你刻下一道日后会释放魔法效应的刻文。你可以把它刻在某个表面上（例如桌面或一段地板），也可以刻在一个能合上的物体里面（例如书本或箱子）以藏起刻文。刻文覆盖的区域直径不能超过 10 尺。如果该表面或物体被移到离你施放本法术之处超过 10 尺的地方，刻文就会被破坏，法术结束且不会被触发。\n刻文几乎无法察觉，要在一次对抗你法术豁免 DC 的感知（察觉）检定中成功才能注意到。\n刻下刻文时，你要设定它的触发条件，并选择它是爆炸符文还是法术刻文，具体说明如下。\n设定触发条件。你在施法时决定什么会触发刻文。对刻在表面上的刻文，常见的触发条件包括触碰或踩到刻文、移开盖住它的其他物体，或接近到它一定距离以内。对刻在物体里的刻文，常见的触发条件包括打开该物体或看到刻文。刻文一经触发，本法术即结束。\n你可以细化触发条件，让只有特定类型的生物才能触发它（例如可以把刻文设定为对异怪生效）。你也可以为不会触发刻文的生物设定条件，例如说出某个口令的生物。\n爆炸符文。被触发时，刻文在以它为中心、半径 20 尺的球形区域内爆发出魔法能量。区域内的每个生物都要进行一次敏捷豁免，失败受到 5d8 强酸、冷冻、火焰、闪电或雷鸣伤害（由你在制作刻文时选择），成功则伤害减半。\n法术刻文。你可以在制作刻文的过程中施放一道你已准备的 3 环或更低环级的法术，把它储存在刻文中。该法术必须以单个生物或一片区域为目标。以这种方式施放时，被储存的法术不会立即生效。\n刻文被触发时，储存的法术生效。如果该法术有目标，就以触发刻文的生物为目标。如果该法术影响一片区域，该区域以那个生物为中心。如果该法术会召唤敌对生物，或造出有害的物体或陷阱，它们会出现在尽可能靠近入侵者的地方并攻击它。如果该法术需要专注，它会一直持续到完整的持续时间结束。",
  "higher": "升环施法：法术位每比 3 环高一环，爆炸符文的伤害增加 1d8。如果你制作的是法术刻文，你可以储存环级不超过这次施放《守卫刻文》所用法术位环级的任何法术。",
  "mech": {
   "save": "dex",
   "onSave": "half",
   "damage": "5d8",
   "damageType": "fire",
   "damageChoices": [
    "acid",
    "cold",
    "fire",
    "lightning",
    "thunder"
   ],
   "damagePerSlot": "1d8"
  }
 },
 {
  "key": "goodberry",
  "name": "神莓术",
  "level": 1,
  "school": "conjuration",
  "classes": [
   "druid",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S、M（一枝槲寄生）",
  "duration": "24 小时",
  "concentration": false,
  "text": "十颗莓果出现在你手中，并在持续时间内蕴含魔力。一个生物可以执行一次附赠动作吃下一颗莓果。吃下一颗莓果能恢复 1 点生命值，而且一颗莓果提供的营养足以维持一个生物一天所需。法术结束时，没有被吃掉的莓果会消失。",
  "higher": null,
  "mech": null
 },
 {
  "key": "grease",
  "name": "油腻术",
  "level": 1,
  "school": "conjuration",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一点猪皮或黄油）",
  "duration": "1 分钟",
  "concentration": false,
  "text": "不可燃的油脂覆盖以射程内一点为中心、边长 10 尺的正方形地面，使其在持续时间内成为困难地形。\n油脂出现时，站在区域内的每个生物都必须成功通过一次敏捷豁免，否则陷入倒地状态。进入该区域或在其中结束回合的生物也必须成功通过这项豁免，否则倒地。",
  "higher": null,
  "mech": {
   "save": "dex",
   "onSave": "none",
   "condition": "prone"
  }
 },
 {
  "key": "guidance",
  "name": "神导术",
  "level": 0,
  "school": "divination",
  "classes": [
   "cleric",
   "druid"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你触碰一个自愿的生物并选择一项技能。直到法术结束，该生物进行任何使用所选技能的属性检定时，都可以加上 1d4。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "note": "使用所选技能的属性检定 +1d4"
   }
  }
 },
 {
  "key": "guiding-bolt",
  "name": "光导箭",
  "level": 1,
  "school": "evocation",
  "classes": [
   "cleric"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S",
  "duration": "1 轮",
  "concentration": false,
  "text": "你向射程内的一个生物射出一道光箭。对目标进行一次远程法术攻击。命中时，目标受到 4d6 光耀伤害，并且在你的下个回合结束前，下一次对它进行的攻击检定具有优势。",
  "higher": "升环施法：法术位每比 1 环高一环，伤害增加 1d6。",
  "mech": {
   "attack": "ranged",
   "damage": "4d6",
   "damageType": "radiant",
   "damagePerSlot": "1d6",
   "effect": {
    "target": "targets",
    "note": "在施法者的下个回合结束前，下一次对它进行的攻击检定具有优势"
   }
  }
 },
 {
  "key": "gust-of-wind",
  "name": "造风术",
  "level": 2,
  "school": "evocation",
  "classes": [
   "druid",
   "ranger",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身（60 尺直线）",
  "components": "V、S、M（一粒豆类种子）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "在持续时间内，一道长 60 尺、宽 10 尺的直线强风从你身上朝你选择的方向吹出。直线内的每个生物都必须成功通过一次力量豁免，否则会被顺着直线的方向推离你 15 尺。在直线内结束自己回合的生物也必须进行同样的豁免。\n直线内的任何生物朝你靠近时，每移动 1 尺都必须花费 2 尺移动力。\n这阵强风会吹散气体或蒸汽，并吹灭区域内的蜡烛和类似的无遮护火焰。它会让有遮护的火焰（例如提灯的火焰）剧烈摇曳，并有 50% 的几率将其吹灭。\n在你之后的回合中，你可以用附赠动作改变直线从你身上吹出的方向。",
  "higher": null,
  "mech": {
   "save": "str",
   "onSave": "none"
  }
 },
 {
  "key": "haste",
  "name": "加速术",
  "level": 3,
  "school": "transmutation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S、M（一小片甘草根）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "选择射程内一个你能看见的自愿生物。直到法术结束，目标的速度翻倍，护甲等级获得 +2 加值，敏捷豁免具有优势，并且在它的每个回合都获得一个额外动作。这个额外动作只能用来执行攻击（仅限一次攻击）、疾走、撤离、躲藏或使用动作。\n法术结束时，一阵倦怠感席卷目标，使它陷入失能状态且速度为 0，直到它的下个回合结束。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "ac": 2,
    "note": "速度翻倍；AC +2；敏捷豁免具有优势；每回合多一个动作（只能攻击一次、疾走、撤离、躲藏或使用）；法术结束时目标失能且速度为 0，直到它的下个回合结束"
   }
  }
 },
 {
  "key": "healing-word",
  "name": "治疗真言",
  "level": 1,
  "school": "abjuration",
  "classes": [
   "bard",
   "cleric",
   "druid"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "60 尺",
  "components": "V",
  "duration": "立即",
  "concentration": false,
  "text": "射程内一个你能看见、由你选择的生物恢复生命值，数值等于 2d4 + 你的施法属性调整值。",
  "higher": "升环施法：法术位每比 1 环高一环，治疗量增加 2d4。",
  "mech": {
   "heal": "2d4",
   "addMod": true,
   "healPerSlot": "2d4"
  }
 },
 {
  "key": "heat-metal",
  "name": "灼热金属",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "bard",
   "druid"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一块铁和一团火焰）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "选择射程内一个你能看见的人造金属物体，例如一把金属武器，或一套金属材质的重甲或中甲。你让该物体烧得通红。你施放本法术时，任何与该物体有身体接触的生物都会受到 2d8 火焰伤害。直到法术结束，只要该物体在射程内，你就可以在之后的每个回合执行一次附赠动作，再次造成这份伤害。\n如果一个手持或穿戴该物体的生物受到了它造成的伤害，该生物必须成功通过一次体质豁免，否则只要做得到就必须丢下该物体。如果它没有丢下该物体，它在攻击检定和属性检定上具有劣势，直到你的下个回合开始。",
  "higher": "升环施法：法术位每比 2 环高一环，伤害增加 1d8。",
  "mech": {
   "auto": true,
   "damage": "2d8",
   "damageType": "fire",
   "damagePerSlot": "1d8"
  }
 },
 {
  "key": "hellish-rebuke",
  "name": "炼狱叱喝",
  "level": 1,
  "school": "evocation",
  "classes": [
   "warlock"
  ],
  "castingTime": "反应（你受到你 60 尺内一个你能看见的生物造成的伤害时）",
  "timing": "reaction",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "对你造成伤害的生物瞬间被绿色火焰包围。它要进行一次敏捷豁免，失败受到 2d10 火焰伤害，成功则伤害减半。",
  "higher": "升环施法：法术位每比 1 环高一环，伤害增加 1d10。",
  "mech": {
   "save": "dex",
   "onSave": "half",
   "damage": "2d10",
   "damageType": "fire",
   "damagePerSlot": "1d10"
  }
 },
 {
  "key": "heroism",
  "name": "英雄气概",
  "level": 1,
  "school": "enchantment",
  "classes": [
   "bard",
   "paladin"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你触碰的一个自愿生物被注入勇气。直到法术结束，该生物免疫恐慌状态，并在它的每个回合开始时获得等同于你施法属性调整值的临时生命值。",
  "higher": "升环施法：法术位每比 1 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "effect": {
    "target": "targets",
    "note": "免疫恐慌；每个回合开始时获得等于施法者施法属性调整值的临时生命值"
   }
  }
 },
 {
  "key": "hex",
  "name": "脆弱诅咒",
  "level": 1,
  "school": "enchantment",
  "classes": [
   "warlock"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "90 尺",
  "components": "V、S、M（一只石化的蝾螈眼睛）",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "你对射程内一个你能看见的生物施加诅咒。直到法术结束，每当你以攻击检定命中目标时，都会对它额外造成 1d6 暗蚀伤害。此外，你在施法时选择一项属性，目标用所选属性进行的属性检定具有劣势。\n如果目标在本法术结束前生命值降到 0，你可以在之后的回合执行一次附赠动作，诅咒一个新的生物。",
  "higher": "升环施法：用更高环级的法术位施放时，你的专注可以持续更久：2 环法术位至多 4 小时，3～4 环至多 8 小时，5 环或更高为 24 小时。",
  "mech": {
   "effect": {
    "target": "self",
    "damageDice": "1d6",
    "damageType": "necrotic",
    "vsTarget": true,
    "note": "以攻击检定命中被诅咒的目标时额外造成 1d6 暗蚀伤害；目标用所选属性进行的属性检定具有劣势"
   }
  }
 },
 {
  "key": "hideous-laughter",
  "name": "狂笑术",
  "level": 1,
  "school": "enchantment",
  "classes": [
   "bard",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S、M（一个果馅饼和一根羽毛）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "射程内一个你能看见、由你选择的生物进行一次感知豁免。豁免失败时，它在持续时间内陷入倒地和失能状态。在此期间，如果它能够发笑，它会控制不住地大笑，并且无法自行结束倒地状态。\n在它的每个回合结束时，以及每次它受到伤害时，它都要再进行一次感知豁免。如果这次豁免是因受到伤害而触发的，目标在豁免上具有优势。豁免成功时，法术结束。",
  "higher": "升环施法：法术位每比 1 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "save": "wis",
   "onSave": "none",
   "condition": "incapacitated",
   "effect": {
    "target": "targets",
    "note": "倒地且失能，不能自行结束倒地；每个回合结束时和每次受到伤害时重新进行感知豁免（因伤害触发的具有优势），成功则法术结束"
   }
  }
 },
 {
  "key": "hold-person",
  "name": "人类定身术",
  "level": 2,
  "school": "enchantment",
  "classes": [
   "bard",
   "cleric",
   "druid",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一根笔直的铁条）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "选择射程内一个你能看见的类人生物。目标必须成功通过一次感知豁免，否则在持续时间内陷入麻痹状态。在它的每个回合结束时，目标重复这项豁免，成功则结束法术对它的效果。",
  "higher": "升环施法：法术位每比 2 环高一环，你可以多选择一个类人生物作为目标。",
  "mech": {
   "save": "wis",
   "onSave": "none",
   "condition": "paralyzed"
  }
 },
 {
  "key": "hunters-mark",
  "name": "猎人印记",
  "level": 1,
  "school": "divination",
  "classes": [
   "ranger"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "90 尺",
  "components": "V",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "你用魔法将射程内一个你能看见的生物标记为你的猎物。直到法术结束，每当你以攻击检定命中目标时，都会对它额外造成 1d6 力场伤害。你为寻找它而进行的感知（察觉或求生）检定也具有优势。\n如果目标在本法术结束前生命值降到 0，你可以执行一次附赠动作，把印记转移到射程内一个你能看见的新生物身上。",
  "higher": "升环施法：用更高环级的法术位施放时，你的专注可以持续更久：3～4 环法术位至多 8 小时，5 环或更高至多 24 小时。",
  "mech": {
   "effect": {
    "target": "self",
    "damageDice": "1d6",
    "damageType": "force",
    "vsTarget": true,
    "note": "以攻击检定命中被标记的目标时额外造成 1d6 力场伤害；寻找它的感知（察觉或求生）检定具有优势"
   }
  }
 },
 {
  "key": "hypnotic-pattern",
  "name": "催眠图纹",
  "level": 3,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "S、M（一撮彩色纸屑）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你在射程内一个边长 30 尺的立方区域中造出一道扭曲盘旋的彩色图纹。图纹出现片刻便消失。区域内每个能看见图纹的生物都必须成功通过一次感知豁免，否则在持续时间内陷入魅惑状态。处于魅惑状态期间，该生物陷入失能状态，且速度为 0。\n受影响的生物如果受到任何伤害，或者有其他人用一个动作把它从恍惚中摇醒，法术对它结束。",
  "higher": null,
  "mech": {
   "save": "wis",
   "onSave": "none",
   "condition": "charmed",
   "effect": {
    "target": "targets",
    "note": "魅惑期间失能且速度为 0；受到任何伤害或被他人用一个动作摇醒时结束"
   }
  }
 },
 {
  "key": "ice-knife",
  "name": "冰刃",
  "level": 1,
  "school": "conjuration",
  "classes": [
   "druid",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "S、M（一滴水或一块冰）",
  "duration": "立即",
  "concentration": false,
  "text": "你造出一块冰晶碎片，并把它掷向射程内的一个生物。对目标进行一次远程法术攻击。命中时，目标受到 1d10 穿刺伤害。无论是否命中，碎片随后都会爆开。目标及其 5 尺内的每个生物都必须成功通过一次敏捷豁免，否则受到 2d6 冷冻伤害。",
  "higher": "升环施法：法术位每比 1 环高一环，冷冻伤害增加 1d6。",
  "mech": {
   "attack": "ranged",
   "damage": "1d10",
   "damageType": "piercing"
  }
 },
 {
  "key": "identify",
  "name": "鉴定术",
  "level": 1,
  "school": "divination",
  "classes": [
   "bard",
   "wizard"
  ],
  "castingTime": "1 分钟，可仪式施放",
  "timing": "long",
  "ritual": true,
  "range": "触及",
  "components": "V、S、M（一颗价值至少 100 金币的珍珠）",
  "duration": "立即",
  "concentration": false,
  "text": "你在施法的整个过程中触碰一个物体。如果该物体是魔法物品或其他带有魔法的物体，你会得知它的特性和使用方法、它是否需要同调，以及它有多少充能（如果有的话）。你会得知是否有正在持续的法术影响着该物品，以及是哪些法术。如果该物品是由法术创造的，你会得知那个法术的名字。\n如果你在施法的整个过程中触碰的是一个生物，你会改为得知当前有哪些正在持续的法术影响着它（如果有的话）。",
  "higher": null,
  "mech": null
 },
 {
  "key": "illusory-script",
  "name": "幻象手稿",
  "level": 1,
  "school": "illusion",
  "classes": [
   "bard",
   "warlock",
   "wizard"
  ],
  "castingTime": "1 分钟，可仪式施放",
  "timing": "long",
  "ritual": true,
  "range": "触及",
  "components": "S、M（价值至少 10 金币的墨水，法术会将其消耗）",
  "duration": "10 天",
  "concentration": false,
  "text": "你在羊皮纸、纸张或其他合适的材料上书写，并给它注入一道持续到法术结束的幻象。对你和你施法时指定的任何生物来说，这段文字看起来很正常，像是出自你的手笔，并且传达你书写时想表达的任何意思。对其他所有人来说，这段文字看起来像是用某种未知的或魔法的文字写成，无法理解。或者，幻象也可以改变这段文字的含义、笔迹和语言，但所用的语言必须是你会的。\n如果本法术被解除，原本的文字和幻象都会消失。\n具有真实视觉的生物能读出其中隐藏的信息。",
  "higher": null,
  "mech": null
 },
 {
  "key": "inflict-wounds",
  "name": "致伤术",
  "level": 1,
  "school": "necromancy",
  "classes": [
   "cleric"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你触碰的一个生物进行一次体质豁免，失败受到 2d10 暗蚀伤害，成功则伤害减半。",
  "higher": "升环施法：法术位每比 1 环高一环，伤害增加 1d10。",
  "mech": {
   "save": "con",
   "onSave": "half",
   "damage": "2d10",
   "damageType": "necrotic",
   "damagePerSlot": "1d10"
  }
 },
 {
  "key": "invisibility",
  "name": "隐形术",
  "level": 2,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一根裹在阿拉伯树胶里的睫毛）",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "你触碰的一个生物处于隐形状态，直到法术结束。目标进行攻击检定、造成伤害或施放法术后，法术立即提前结束。",
  "higher": "升环施法：法术位每比 2 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "effect": {
    "target": "targets",
    "note": "处于隐形状态；进行攻击检定、造成伤害或施放法术后法术立即结束"
   }
  }
 },
 {
  "key": "jump",
  "name": "跳跃术",
  "level": 1,
  "school": "transmutation",
  "classes": [
   "druid",
   "ranger",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一条蚱蜢后腿）",
  "duration": "1 分钟",
  "concentration": false,
  "text": "你触碰一个自愿的生物。直到法术结束，该生物在它的每个回合中可以有一次：花费 10 尺移动力，跳跃至多 30 尺。",
  "higher": "升环施法：法术位每比 1 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "effect": {
    "target": "targets",
    "note": "每个回合一次，可以花费 10 尺移动力跳跃至多 30 尺"
   }
  }
 },
 {
  "key": "knock",
  "name": "敲击术",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V",
  "duration": "立即",
  "concentration": false,
  "text": "选择射程内一个你能看见的物体。该物体可以是门、盒子、箱子、一副镣铐、挂锁，或其他以普通或魔法手段阻止开启的物体。\n由普通锁具锁住、被卡住或被闩上的目标会被解锁、松脱或解闩。如果该物体有多道锁，只有其中一道会被打开。\n如果目标被《秘法锁》锁住，该法术会被压制 10 分钟，在此期间目标可以被打开和关上。\n你施放本法术时，目标会发出一声响亮的敲击声，300 尺外都能听见。",
  "higher": null,
  "mech": null
 },
 {
  "key": "lesser-restoration",
  "name": "次级复原术",
  "level": 2,
  "school": "abjuration",
  "classes": [
   "bard",
   "cleric",
   "druid",
   "paladin",
   "ranger"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你触碰一个生物，结束它身上的一种状态：目盲、耳聋、麻痹或中毒。",
  "higher": null,
  "mech": null
 },
 {
  "key": "levitate",
  "name": "浮空术",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一根金属弹簧）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "射程内一个你能看见、由你选择的生物或未固定的物体垂直升起至多 20 尺，并在持续时间内悬停在那里。本法术能让重量至多 500 磅的物体浮空。不自愿的生物如果成功通过一次体质豁免，则不受影响。\n目标只能通过推或拉触及范围内的固定物体或表面（例如墙壁或天花板）来移动，这让它能像攀爬一样移动。你可以在你的回合中让目标的高度上升或下降至多 20 尺。如果你自己就是目标，你可以在移动中顺带上升或下降。否则，你可以执行魔法动作来移动目标，目标必须保持在法术射程内。\n法术结束时，如果目标仍在空中，它会缓缓飘落到地面。",
  "higher": null,
  "mech": null
 },
 {
  "key": "light",
  "name": "光亮术",
  "level": 0,
  "school": "evocation",
  "classes": [
   "bard",
   "cleric",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、M（一只萤火虫或一些磷光苔藓）",
  "duration": "1 小时",
  "concentration": false,
  "text": "你触碰一个没有被他人穿戴或携带的大型或更小的物体。直到法术结束，该物体在 20 尺半径内发出明亮光照，并在此外 20 尺内发出微光。光的颜色可以随你喜欢。\n用不透明的东西盖住该物体就能挡住光线。如果你再次施放本法术，先前的这道法术结束。",
  "higher": null,
  "mech": null
 },
 {
  "key": "lightning-bolt",
  "name": "闪电束",
  "level": 3,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身（100 尺直线）",
  "components": "V、S、M（一小撮毛皮和一根水晶棒）",
  "duration": "立即",
  "concentration": false,
  "text": "一道闪电从你身上朝你选择的方向迸射而出，形成一条长 100 尺、宽 5 尺的直线。直线内的每个生物都要进行一次敏捷豁免，失败受到 8d6 闪电伤害，成功则伤害减半。",
  "higher": "升环施法：法术位每比 3 环高一环，伤害增加 1d6。",
  "mech": {
   "save": "dex",
   "onSave": "half",
   "damage": "8d6",
   "damageType": "lightning",
   "damagePerSlot": "1d6"
  }
 },
 {
  "key": "locate-animals-or-plants",
  "name": "定位动植物",
  "level": 2,
  "school": "divination",
  "classes": [
   "bard",
   "druid",
   "ranger"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "自身",
  "components": "V、S、M（一撮寻血猎犬的毛）",
  "duration": "立即",
  "concentration": false,
  "text": "描述或说出某种特定的野兽、植物生物或非魔法植物。如果 5 英里内存在这种生物或植物，你会得知离你最近的那一个的方向和距离。",
  "higher": null,
  "mech": null
 },
 {
  "key": "locate-object",
  "name": "物品定位术",
  "level": 2,
  "school": "divination",
  "classes": [
   "bard",
   "cleric",
   "druid",
   "paladin",
   "ranger",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S、M（一根分叉的细枝）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "描述或说出一件你熟悉的物体。如果该物体在你 1000 尺内，你能感知到它所在位置的方向。如果该物体正在移动，你还会知道它移动的方向。\n如果你至少曾在近处（30 尺内）见过某件特定的物体一次，本法术就能定位这件你所知道的物体。你也可以让本法术定位某一类物体中离你最近的一件，例如某种衣物、首饰、家具、工具或武器。\n如果你与该物体之间的直线路径被任何厚度的铅挡住，本法术就无法定位该物体。",
  "higher": null,
  "mech": null
 },
 {
  "key": "longstrider",
  "name": "大步奔行",
  "level": 1,
  "school": "transmutation",
  "classes": [
   "bard",
   "druid",
   "ranger",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一撮泥土）",
  "duration": "1 小时",
  "concentration": false,
  "text": "你触碰一个生物。直到法术结束，目标的速度增加 10 尺。",
  "higher": "升环施法：法术位每比 1 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "effect": {
    "target": "targets",
    "note": "速度增加 10 尺"
   }
  }
 },
 {
  "key": "mage-armor",
  "name": "法师护甲",
  "level": 1,
  "school": "abjuration",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一块鞣制过的皮革）",
  "duration": "8 小时",
  "concentration": false,
  "text": "你触碰一个没有穿着护甲的自愿生物。直到法术结束，目标的基础 AC 变为 13 + 它的敏捷调整值。如果目标穿上护甲，法术提前结束。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "acBase": 13,
    "note": "基础 AC 变为 13 + 敏捷调整值；穿上护甲则法术结束"
   }
  }
 },
 {
  "key": "mage-hand",
  "name": "法师之手",
  "level": 0,
  "school": "conjuration",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S",
  "duration": "1 分钟",
  "concentration": false,
  "text": "一只幽灵般的漂浮手掌出现在射程内你选择的一点。这只手持续到法术结束。如果它离你超过 30 尺，或者你再次施放本法术，这只手就会消失。\n施放本法术时，你可以用这只手操纵一个物体、打开没上锁的门或容器、把物品放进打开的容器或从中取出，或者倒出小瓶里的东西。\n在你之后的回合中，你可以执行魔法动作，再次这样操控这只手。作为该动作的一部分，你可以让这只手移动至多 30 尺。\n这只手不能攻击、不能启动魔法物品，也不能携带超过 10 磅的东西。",
  "higher": null,
  "mech": null
 },
 {
  "key": "magic-circle",
  "name": "魔法法阵",
  "level": 3,
  "school": "abjuration",
  "classes": [
   "cleric",
   "paladin",
   "warlock",
   "wizard"
  ],
  "castingTime": "1 分钟",
  "timing": "long",
  "ritual": false,
  "range": "10 尺",
  "components": "V、S、M（价值至少 100 金币的盐和银粉，法术会将其消耗）",
  "duration": "1 小时",
  "concentration": false,
  "text": "你以射程内地面上一个你能看见的点为中心，造出一个半径 10 尺、高 20 尺的魔法能量圆柱。圆柱与地板或其他表面相交之处都会出现发光的符文。\n选择以下一种或多种生物类型：天界生物、元素生物、精类、邪魔或不死生物。法阵会以下列方式影响所选类型的生物：\n• 该生物无法通过非魔法手段自愿进入圆柱。如果该生物试图通过传送或跨位面旅行进入，它必须先成功通过一次魅力豁免。\n• 该生物对圆柱内的目标进行的攻击检定具有劣势。\n• 圆柱内的目标不会被该生物附身，也不会因该生物而陷入魅惑或恐慌状态。\n每次施放本法术时，你都可以让它的魔法反向运作：阻止指定类型的生物离开圆柱，并保护圆柱外的目标。",
  "higher": "升环施法：法术位每比 3 环高一环，持续时间增加 1 小时。",
  "mech": null
 },
 {
  "key": "magic-missile",
  "name": "魔法飞弹",
  "level": 1,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你造出三支发光的魔法力场飞镖。每支飞镖都会击中射程内一个你能看见、由你选择的生物。每支飞镖对其目标造成 1d4+1 力场伤害。所有飞镖同时命中，你可以让它们都击中同一个生物，也可以分别击中几个生物。",
  "higher": "升环施法：法术位每比 1 环高一环，本法术多造出一支飞镖。",
  "mech": {
   "auto": true,
   "count": 3,
   "countPerSlot": 1,
   "damage": "1d4+1",
   "damageType": "force"
  }
 },
 {
  "key": "magic-mouth",
  "name": "魔嘴术",
  "level": 2,
  "school": "illusion",
  "classes": [
   "bard",
   "wizard"
  ],
  "castingTime": "1 分钟，可仪式施放",
  "timing": "long",
  "ritual": true,
  "range": "30 尺",
  "components": "V、S、M（价值至少 10 金币的玉粉，法术会将其消耗）",
  "duration": "直到被解除",
  "concentration": false,
  "text": "你在射程内的一个物体中植入一段信息，这段信息会在满足触发条件时被说出来。选择一个你能看见、没有被其他生物穿戴或携带的物体，然后说出这段信息。信息不能超过 25 个词，但可以在长达 10 分钟的时间里说完。最后，决定触发法术传达信息的情境。\n触发条件发生时，物体上会出现一张魔法嘴巴，用你的声音、以你说话时的音量复述这段信息。如果你选择的物体有嘴或看起来像嘴的部分（例如雕像的嘴），魔法嘴巴就会出现在那里，让话语看起来是从物体的嘴里说出来的。施放本法术时，你可以让法术在传达信息后结束，也可以让它保留下来，每当触发条件发生时都重复这段信息。\n触发条件可以随你设定得笼统或详细，但必须基于在该物体 30 尺内发生的视觉或听觉条件。例如，你可以指示这张嘴在任何生物移动到物体 30 尺内时说话，或在物体 30 尺内有银铃响起时说话。",
  "higher": null,
  "mech": null
 },
 {
  "key": "magic-weapon",
  "name": "魔化武器",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "paladin",
   "ranger",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "1 小时",
  "concentration": false,
  "text": "你触碰一把非魔法武器。直到法术结束，该武器成为一把魔法武器，用它进行的攻击检定和伤害掷骰获得 +1 加值。如果你再次施放本法术，先前的这道法术提前结束。",
  "higher": "升环施法：使用 3～5 环法术位时，加值提高到 +2；使用 6 环或更高的法术位时，加值提高到 +3。",
  "mech": {
   "effect": {
    "target": "targets",
    "note": "所触碰的武器成为魔法武器，攻击检定和伤害掷骰 +1（3～5 环法术位为 +2，6 环或更高为 +3）"
   }
  }
 },
 {
  "key": "major-image",
  "name": "高等幻影",
  "level": 3,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S、M（一小撮羊毛）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "你造出一个物体、生物或其他可见现象的影像，大小不超过边长 20 尺的立方。影像出现在射程内一个你能看见的地点，持续到法术结束。它看起来十分真实，包括与所描绘事物相称的声音、气味和温度，但它无法造成伤害，也无法施加状态。\n如果你位于幻象的射程内，你可以执行魔法动作，让影像移动到射程内的任何其他地点。影像改变位置时，你可以改变它的外观，让它的移动看起来自然。例如，如果你造出一个生物的影像并移动它，你可以改变影像，让它看起来像是在行走。同样，你可以让幻象在不同时间发出不同的声音，例如甚至能让它与人交谈。\n与影像发生物理接触就会发现它是幻象，因为东西能穿过它。执行研究动作检查影像的生物，如果在一次对抗你法术豁免 DC 的智力（调查）检定中成功，就能判断出它是幻象。如果一个生物看穿了幻象，它就能透过影像看到后面的东西，影像的其他感官特征对它来说也会变得微弱。",
  "higher": "升环施法：用 4 环或更高的法术位施放时，本法术会持续到被解除为止，并且不需要专注。",
  "mech": null
 },
 {
  "key": "mass-healing-word",
  "name": "群体治疗真言",
  "level": 3,
  "school": "abjuration",
  "classes": [
   "bard",
   "cleric"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "60 尺",
  "components": "V",
  "duration": "立即",
  "concentration": false,
  "text": "射程内至多六个你能看见、由你选择的生物恢复生命值，数值等于 2d4 + 你的施法属性调整值。",
  "higher": "升环施法：法术位每比 3 环高一环，治疗量增加 1d4。",
  "mech": {
   "heal": "2d4",
   "addMod": true,
   "healPerSlot": "1d4"
  }
 },
 {
  "key": "meld-into-stone",
  "name": "融身入石",
  "level": 3,
  "school": "transmutation",
  "classes": [
   "cleric",
   "druid",
   "ranger"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "触及",
  "components": "V、S",
  "duration": "8 小时",
  "concentration": false,
  "text": "你走进一个大得足以完全容纳你身体的石质物体或表面，在持续时间内让自己和你的装备与石头融为一体。你必须触碰这块石头才能这样做。你的存在不会留下任何可见的、或能被非魔法感官察觉的痕迹。\n与石头融为一体时，你看不见外面发生的事，你为听见外面的声音而进行的感知（察觉）检定都具有劣势。融在石头里时，你仍能察觉时间的流逝，并且可以对自己施放法术。你可以花费 5 尺移动力从进入处离开石头，这会结束本法术。除此之外你无法移动。\n石头受到轻微的物理损伤不会伤到你，但石头部分被毁或形状改变（以至于你无法再容身其中）时，你会被逐出，并受到 6d6 力场伤害。石头被完全摧毁（或被转化为另一种物质）时，你会被逐出，并受到 50 点力场伤害。被逐出时，你会移动到最接近你最初进入处的一个未被占据的空间，并陷入倒地状态。",
  "higher": null,
  "mech": null
 },
 {
  "key": "mending",
  "name": "修复术",
  "level": 0,
  "school": "transmutation",
  "classes": [
   "bard",
   "cleric",
   "druid",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "1 分钟",
  "timing": "long",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（两块天然磁石）",
  "duration": "立即",
  "concentration": false,
  "text": "本法术能修复你触碰的物体上的一处破损或裂口，例如断掉的链环、断成两截的钥匙、撕破的斗篷或漏水的酒囊。只要破损或裂口在任何方向上都不超过 1 尺，你就能把它修好，不留下任何先前损坏的痕迹。\n本法术能从物理上修复魔法物品，但无法恢复这类物体的魔力。",
  "higher": null,
  "mech": null
 },
 {
  "key": "message",
  "name": "传讯术",
  "level": 0,
  "school": "transmutation",
  "classes": [
   "bard",
   "druid",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "S、M（一根铜线）",
  "duration": "1 轮",
  "concentration": false,
  "text": "你指向射程内的一个生物，低声说出一段信息。目标（也只有目标）能听到这段信息，并且能以只有你能听到的耳语回复。\n如果你熟悉目标，并且知道它在障碍物的另一边，你可以隔着固体物体施放本法术。魔法造成的寂静、1 尺厚的石头、金属或木头，或者一层薄铅板，都会阻挡本法术。",
  "higher": null,
  "mech": null
 },
 {
  "key": "mind-spike",
  "name": "心灵尖刺",
  "level": 2,
  "school": "divination",
  "classes": [
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "S",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "你把一根灵能尖刺刺入射程内一个你能看见的生物的心灵。目标进行一次感知豁免，失败受到 3d8 心灵伤害，成功则伤害减半。豁免失败时，直到法术结束，你还始终知道目标的位置，但仅限于你们两个处在同一个存在位面时。在你掌握这一信息期间，目标无法对你隐藏；如果它处于隐形状态，它也无法对你获得该状态的任何益处。",
  "higher": "升环施法：法术位每比 2 环高一环，伤害增加 1d8。",
  "mech": {
   "save": "wis",
   "onSave": "half",
   "damage": "3d8",
   "damageType": "psychic",
   "damagePerSlot": "1d8"
  }
 },
 {
  "key": "minor-illusion",
  "name": "次级幻象",
  "level": 0,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "S、M（一小撮羊毛）",
  "duration": "1 分钟",
  "concentration": false,
  "text": "你在射程内造出一个声音或一个物体的影像，持续到法术结束。两者各自的效果见下文。如果你再次施放本法术，先前的幻象结束。\n如果一个生物执行研究动作检查该声音或影像，它可以进行一次对抗你法术豁免 DC 的智力（调查）检定，成功就能判断出那是幻象。如果一个生物看穿了幻象，幻象对它来说会变得微弱。\n声音。如果你造出的是声音，其音量可以从耳语到尖叫不等。它可以是你的声音、别人的声音、狮子的咆哮、击鼓声，或你选择的任何其他声音。声音可以在整个持续时间内不停地响，你也可以在法术结束前的不同时间发出断续的声音。\n影像。如果你造出的是一个物体的影像（例如一把椅子、泥泞的脚印或一个小箱子），它不能大于边长 5 尺的立方。影像无法产生声音、光、气味或任何其他感官效果。与影像发生物理接触就会发现它是幻象，因为东西能穿过它。",
  "higher": null,
  "mech": null
 },
 {
  "key": "mirror-image",
  "name": "镜影术",
  "level": 2,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S",
  "duration": "1 分钟",
  "concentration": false,
  "text": "你的三个幻象分身出现在你的空间中。直到法术结束，这些分身会随你移动、模仿你的动作，并不断变换位置，让人无法分辨哪个才是真身。\n在法术持续期间，每当有生物以攻击检定命中你时，你为每个剩余的分身各掷一个 d6。只要其中任何一个 d6 掷出 3 或更高，就改为由一个分身被命中，该分身被摧毁。除此之外，分身无视其他所有伤害和效应。三个分身全部被摧毁时，法术结束。如果一个生物处于目盲状态，或者具有盲视或真实视觉，它不受本法术影响。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "self",
    "note": "三个幻象分身：每次被攻击检定命中时，为每个剩余分身各掷 d6，任一个掷出 3 或更高就改为命中并摧毁一个分身；分身全灭时法术结束"
   }
  }
 },
 {
  "key": "misty-step",
  "name": "迷踪步",
  "level": 2,
  "school": "conjuration",
  "classes": [
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "自身",
  "components": "V",
  "duration": "立即",
  "concentration": false,
  "text": "银色的薄雾短暂地笼罩着你，你传送至多 30 尺，到达一处你能看见的未被占据的空间。",
  "higher": null,
  "mech": null
 },
 {
  "key": "moonbeam",
  "name": "月华之光",
  "level": 2,
  "school": "evocation",
  "classes": [
   "druid"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S、M（一片月籽藤叶）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "一道银白色的淡淡光柱照射下来，形成以射程内一点为中心、半径 5 尺、高 40 尺的圆柱。直到法术结束，圆柱内充满微光，并且你可以在之后的回合执行魔法动作，让圆柱移动至多 60 尺。\n圆柱出现时，其中的每个生物都要进行一次体质豁免。豁免失败的生物受到 2d10 光耀伤害；如果该生物正处于变形后的形态（例如受《变形术》影响），它会恢复原形，并且在离开圆柱之前无法再变形。豁免成功的生物只受到一半伤害。当法术区域移入一个生物的空间、该生物进入法术区域或在其中结束回合时，它也要进行这项豁免。每个生物每回合只进行一次这项豁免。",
  "higher": "升环施法：法术位每比 2 环高一环，伤害增加 1d10。",
  "mech": {
   "save": "con",
   "onSave": "half",
   "damage": "2d10",
   "damageType": "radiant",
   "damagePerSlot": "1d10"
  }
 },
 {
  "key": "nondetection",
  "name": "回避侦测",
  "level": 3,
  "school": "abjuration",
  "classes": [
   "bard",
   "ranger",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一撮价值至少 25 金币的钻石粉，法术会将其消耗）",
  "duration": "8 小时",
  "concentration": false,
  "text": "在持续时间内，你让你触碰的一个目标避开预言系法术。目标可以是一个自愿的生物，也可以是一处在任何方向上都不超过 10 尺的地点或物体。目标无法成为任何预言系法术的目标，也无法通过魔法探知的感应器被感知到。",
  "higher": null,
  "mech": null
 },
 {
  "key": "pass-without-trace",
  "name": "行动无踪",
  "level": 2,
  "school": "abjuration",
  "classes": [
   "druid",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身（30 尺散发）",
  "components": "V、S、M（焚烧槲寄生得到的灰烬）",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "在持续时间内，你放出一圈 30 尺散发的隐匿灵光。处于灵光中时，你和你选择的每个生物进行敏捷（隐匿）检定获得 +10 加值，并且不会留下踪迹。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "note": "处于施法者 30 尺散发的灵光中时，敏捷（隐匿）检定 +10，不留踪迹"
   }
  }
 },
 {
  "key": "phantasmal-force",
  "name": "魅影之力",
  "level": 2,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一小撮羊毛）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你试图在射程内一个你能看见的生物心中编织一个幻象。目标进行一次智力豁免。豁免失败时，你创造出一个幻影物体、生物或其他现象，其大小不超过一个 10 尺立方，并且在持续时间内只有目标能感知到它。幻影包含声音、温度和其他刺激。\n目标可以执行研究动作来检视这个幻影，进行一次对抗你法术豁免 DC 的智力（调查）检定。如果检定成功，目标就会意识到幻影是幻象，法术随即结束。\n受此法术影响期间，目标会把幻影当作真实存在的事物，并为与之互动产生的任何不合逻辑的结果找到合理的解释。例如，如果目标走上一座幻影桥梁并在坠落后幸存，它会相信桥梁确实存在，是别的什么东西让它掉了下去。\n如果幻影表现的是危险的生物或险境，受影响的目标甚至会受到来自幻象的伤害。在你的每个回合，如果目标位于这种幻影的区域内或距离幻影 5 尺以内，幻影可以对目标造成 2d8 心灵伤害。目标会把这些伤害感知为与幻象相符的类型。",
  "higher": null,
  "mech": {
   "save": "int",
   "onSave": "none",
   "effect": {
    "target": "targets",
    "note": "把只有它能感知到的幻影当真；幻影若表现危险事物，在你的每个回合可对它造成 2d8 心灵伤害（条件见正文）"
   }
  }
 },
 {
  "key": "phantom-steed",
  "name": "魅影驹",
  "level": 3,
  "school": "illusion",
  "classes": [
   "wizard"
  ],
  "castingTime": "1 分钟，可仪式施放",
  "timing": "long",
  "ritual": true,
  "range": "30 尺",
  "components": "V、S",
  "duration": "1 小时",
  "concentration": false,
  "text": "一匹大型、半真半幻的类马生物出现在射程内你选择的一处地面上未被占据的空间中。它的外观由你决定，并配有鞍、嚼子和缰绳。此法术创造的任何装备一旦被带到距离坐骑超过 10 尺的地方，就会化作一缕青烟消失。\n在持续时间内，你或你选择的一个生物可以骑乘这匹坐骑。坐骑使用乘用马的数据卡（见「怪物」），但它的速度为 100 尺，每小时能行进 13 英里。法术结束时，坐骑会逐渐消散，骑手有 1 分钟时间下马。如果坐骑受到任何伤害，法术提前结束。",
  "higher": null,
  "mech": null
 },
 {
  "key": "plant-growth",
  "name": "植物滋长",
  "level": 3,
  "school": "transmutation",
  "classes": [
   "bard",
   "druid",
   "ranger"
  ],
  "castingTime": "动作（疯长）或 8 小时（丰饶）",
  "timing": "action",
  "ritual": false,
  "range": "150 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "此法术把生命力导入植物。你采用的施法时间决定此法术产生下面的疯长效果还是丰饶效果。\n疯长：选择射程内一点。以该点为中心、半径 100 尺的球形区域内的所有普通植物都会变得茂密丛生。在该区域中移动的生物每移动 1 尺，就必须花费 4 尺的移动距离。你可以把法术区域内任意大小的一处或多处区域排除在效果之外。\n丰饶：以射程内一点为中心、半径半英里范围内的所有植物都会变得肥沃丰饶，持续 365 天。这些植物收获时的产量是平常的两倍。它们每年只能受益于一次《植物滋长》。",
  "higher": null,
  "mech": null
 },
 {
  "key": "poison-spray",
  "name": "毒气喷溅",
  "level": 0,
  "school": "necromancy",
  "classes": [
   "druid",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你向射程内的一个生物喷出一股毒雾。对目标进行一次远程法术攻击。命中时，目标受到 1d12 毒素伤害。",
  "higher": "戏法强化：当你达到 5 级（2d12）、11 级（3d12）和 17 级（4d12）时，伤害各增加 1d12。",
  "mech": {
   "attack": "ranged",
   "damage": "1d12",
   "damageType": "poison",
   "cantripDice": "2d12"
  }
 },
 {
  "key": "prayer-of-healing",
  "name": "治疗祷言",
  "level": 2,
  "school": "abjuration",
  "classes": [
   "cleric",
   "paladin"
  ],
  "castingTime": "10 分钟",
  "timing": "long",
  "ritual": false,
  "range": "30 尺",
  "components": "V",
  "duration": "立即",
  "concentration": false,
  "text": "在整个施法过程中一直留在射程内的、由你选择的至多五个生物获得短休的效益，并且还会恢复 2d8 生命值。一个生物在完成一次长休之前，不能再次受到此法术的影响。",
  "higher": "升环施法：法术位每比 2 环高一环，治疗量增加 1d8。",
  "mech": {
   "heal": "2d8",
   "healPerSlot": "1d8"
  }
 },
 {
  "key": "prestidigitation",
  "name": "魔法伎俩",
  "level": 0,
  "school": "transmutation",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "10 尺",
  "components": "V、S",
  "duration": "至多 1 小时",
  "concentration": false,
  "text": "你在射程内创造一个魔法效果，从下列选项中选择效果。如果你多次施放此法术，你最多可以同时维持它的三个非立即效果。\n感官效果：你创造一个立即生效、无害的感官效果，例如一阵火花、一股微风、隐约的乐音或一股怪味。\n火焰把戏：你立即点燃或熄灭一根蜡烛、一支火把或一小堆营火。\n清洁或弄脏：你立即清洁或弄脏一个体积不超过 1 立方尺的物体。\n细微感觉：你让至多 1 立方尺的无生命物质变凉、变暖或带上某种味道，持续 1 小时。\n魔法标记：你让一个物体或一个表面上出现一种颜色、一个小记号或一个符号，持续 1 小时。\n次级造物：你创造一个能放在你手中的非魔法小玩意儿或幻象影像。它持续到你下个回合结束。小玩意儿不能造成伤害，也没有任何金钱价值。",
  "higher": null,
  "mech": null
 },
 {
  "key": "produce-flame",
  "name": "燃火术",
  "level": 0,
  "school": "conjuration",
  "classes": [
   "druid"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "自身",
  "components": "V、S",
  "duration": "10 分钟",
  "concentration": false,
  "text": "一团摇曳的火焰出现在你手中，并在持续时间内留在那里。火焰在你手中时不散发热量，也不会点燃任何东西，它发出半径 20 尺的明亮光照，并在此之外再发出 20 尺的微光。如果你再次施放此法术，此法术结束。\n在法术结束之前，你可以执行一个魔法动作，向你 60 尺内的一个生物或物体投掷火焰。进行一次远程法术攻击。命中时，目标受到 1d8 火焰伤害。",
  "higher": "戏法强化：当你达到 5 级（2d8）、11 级（3d8）和 17 级（4d8）时，伤害各增加 1d8。",
  "mech": {
   "attack": "ranged",
   "damage": "1d8",
   "damageType": "fire",
   "cantripDice": "2d8"
  }
 },
 {
  "key": "protection-from-energy",
  "name": "防护能量",
  "level": 3,
  "school": "abjuration",
  "classes": [
   "cleric",
   "druid",
   "ranger",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "在持续时间内，你触碰的一个自愿生物对你选择的一种伤害类型具有抗性：强酸、冷冻、火焰、闪电或雷鸣。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "resist": [
     "acid",
     "cold",
     "fire",
     "lightning",
     "thunder"
    ],
    "note": "对施法时所选的一种伤害类型（强酸、冷冻、火焰、闪电或雷鸣）具有抗性"
   }
  }
 },
 {
  "key": "protection-from-evil-and-good",
  "name": "防护善恶",
  "level": 1,
  "school": "abjuration",
  "classes": [
   "cleric",
   "druid",
   "paladin",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一瓶价值至少 25 金币的圣水，法术会消耗它）",
  "duration": "专注，至多 10 分钟",
  "concentration": false,
  "text": "在法术结束之前，你触碰的一个自愿生物会受到保护，免受异怪、天界生物、元素生物、精类、邪魔或不死生物的侵害。这种保护带来以下几项效益：这些类型的生物对目标进行的攻击检定具有劣势；目标也不会被它们附身，不会因它们而陷入魅惑或恐慌状态。如果目标已经被这样的生物附身，或已经因这样的生物而处于魅惑或恐慌状态，目标针对相关效应进行的任何新的豁免检定都具有优势。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "note": "异怪、天界生物、元素生物、精类、邪魔和不死生物对它的攻击检定具有劣势，它也不会被这些生物附身、魅惑或恐慌"
   }
  }
 },
 {
  "key": "protection-from-poison",
  "name": "防护毒素",
  "level": 2,
  "school": "abjuration",
  "classes": [
   "cleric",
   "druid",
   "paladin",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "1 小时",
  "concentration": false,
  "text": "你触碰一个生物，结束它身上的中毒状态。在持续时间内，目标为避免或结束中毒状态而进行的豁免检定具有优势，并且它对毒素伤害具有抗性。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "resist": [
     "poison"
    ],
    "note": "对毒素伤害具有抗性；为避免或结束中毒状态进行的豁免检定具有优势"
   }
  }
 },
 {
  "key": "purify-food-and-drink",
  "name": "净化饮食",
  "level": 1,
  "school": "transmutation",
  "classes": [
   "cleric",
   "druid",
   "paladin"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "10 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你清除以射程内一点为中心、半径 5 尺的球形区域内非魔法食物和饮料中的毒素与腐坏。",
  "higher": null,
  "mech": null
 },
 {
  "key": "ray-of-enfeeblement",
  "name": "衰弱射线",
  "level": 2,
  "school": "necromancy",
  "classes": [
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "一道令人虚弱的能量光束从你身上射向射程内的一个生物。目标必须进行一次体质豁免。豁免成功时，目标在你下个回合开始之前进行的下一次攻击检定具有劣势。\n豁免失败时，目标在持续时间内进行的基于力量的 d20 检定具有劣势。在此期间，它的所有伤害掷骰还要减去 1d8。目标在它的每个回合结束时重复这次豁免，成功则法术结束。",
  "higher": null,
  "mech": {
   "save": "con",
   "onSave": "none",
   "effect": {
    "target": "targets",
    "note": "基于力量的 d20 检定具有劣势，所有伤害掷骰减去 1d8；每个回合结束时重复体质豁免，成功则法术结束"
   }
  }
 },
 {
  "key": "ray-of-frost",
  "name": "冷冻射线",
  "level": 0,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "一道冰冷的蓝白色光束射向射程内的一个生物。对目标进行一次远程法术攻击。命中时，目标受到 1d8 冷冻伤害，并且它的速度减少 10 尺，直到你下个回合开始。",
  "higher": "戏法强化：当你达到 5 级（2d8）、11 级（3d8）和 17 级（4d8）时，伤害各增加 1d8。",
  "mech": {
   "attack": "ranged",
   "damage": "1d8",
   "damageType": "cold",
   "cantripDice": "2d8"
  }
 },
 {
  "key": "ray-of-sickness",
  "name": "致病射线",
  "level": 1,
  "school": "necromancy",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你向射程内的一个生物射出一道泛绿的射线。对目标进行一次远程法术攻击。命中时，目标受到 2d8 毒素伤害，并陷入中毒状态，直到你下个回合结束。",
  "higher": "升环施法：法术位每比 1 环高一环，伤害增加 1d8。",
  "mech": {
   "attack": "ranged",
   "damage": "2d8",
   "damageType": "poison",
   "damagePerSlot": "1d8",
   "condition": "poisoned"
  }
 },
 {
  "key": "remove-curse",
  "name": "移除诅咒",
  "level": 3,
  "school": "abjuration",
  "classes": [
   "cleric",
   "paladin",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "随着你的触碰，影响一个生物或一个物体的所有诅咒都会结束。如果该物体是一件被诅咒的魔法物品，它的诅咒依然存在，但此法术会打断其拥有者与该物品的同调，使这件物品可以被取下或丢弃。",
  "higher": null,
  "mech": null
 },
 {
  "key": "resistance",
  "name": "抗性术",
  "level": 0,
  "school": "abjuration",
  "classes": [
   "cleric",
   "druid"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你触碰一个自愿生物，并选择一种伤害类型：强酸、钝击、冷冻、火焰、闪电、暗蚀、穿刺、毒素、光耀、挥砍或雷鸣。在法术结束之前，当该生物受到所选类型的伤害时，它受到的伤害总量减少 1d4。一个生物每回合只能从此法术中获益一次。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "note": "受到所选类型的伤害时，伤害总量减少 1d4（每回合只能获益一次）"
   }
  }
 },
 {
  "key": "revivify",
  "name": "复生术",
  "level": 3,
  "school": "necromancy",
  "classes": [
   "cleric",
   "druid",
   "paladin",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一颗价值至少 300 金币的钻石，法术会消耗它）",
  "duration": "立即",
  "concentration": false,
  "text": "你触碰一个在过去 1 分钟内死亡的生物。该生物复活，并具有 1 点生命值。此法术不能复活因衰老而死的生物，也不能恢复任何缺失的身体部位。",
  "higher": null,
  "mech": null
 },
 {
  "key": "rope-trick",
  "name": "魔绳术",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一段绳子）",
  "duration": "1 小时",
  "concentration": false,
  "text": "你触碰一段绳子。绳子的一端向上飘起，直到绳子垂直于地面悬挂，或绳子碰到天花板为止。在绳子的上端，一扇隐形的 3 尺 × 5 尺传送门打开，通往一个异次元空间，该空间持续到法术结束。顺着绳子攀爬就能进入该空间，绳子可以被拉进空间里，也可以从空间里放下来。\n该空间最多能容纳八个中型或更小的生物。攻击、法术和其他效应都无法进入或离开该空间，但空间里的生物可以透过传送门看到外面。法术结束时，空间里的一切都会掉出来。",
  "higher": null,
  "mech": null
 },
 {
  "key": "sacred-flame",
  "name": "圣火术",
  "level": 0,
  "school": "evocation",
  "classes": [
   "cleric"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "火焰般的光辉降临在射程内一个你能看见的生物身上。目标必须通过一次敏捷豁免，否则受到 1d8 光耀伤害。目标进行这次豁免时，不能从半身掩护或四分之三掩护中获益。",
  "higher": "戏法强化：当你达到 5 级（2d8）、11 级（3d8）和 17 级（4d8）时，伤害各增加 1d8。",
  "mech": {
   "save": "dex",
   "onSave": "none",
   "damage": "1d8",
   "damageType": "radiant",
   "cantripDice": "2d8"
  }
 },
 {
  "key": "sanctuary",
  "name": "庇护术",
  "level": 1,
  "school": "abjuration",
  "classes": [
   "cleric"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "30 尺",
  "components": "V、S、M（一片镜子的玻璃碎片）",
  "duration": "1 分钟",
  "concentration": false,
  "text": "你守护射程内的一个生物。在法术结束之前，任何以受守护生物为目标进行攻击检定或施放伤害性法术的生物，都必须通过一次感知豁免，否则就必须另选目标，或者失去这次攻击或这个法术。此法术不能保护受守护生物免受范围效应的影响。如果受守护生物进行攻击检定、施放法术或造成伤害，法术结束。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "note": "以它为目标进行攻击检定或施放伤害性法术的生物须通过感知豁免，否则须另选目标或失去该攻击或法术；它攻击、施法或造成伤害时法术结束"
   }
  }
 },
 {
  "key": "scorching-ray",
  "name": "灼热射线",
  "level": 2,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你掷出三道炽热的射线。你可以把它们全部射向射程内的一个目标，也可以射向多个目标。为每道射线各进行一次远程法术攻击。命中时，目标受到 2d6 火焰伤害。",
  "higher": "升环施法：法术位每比 2 环高一环，你就多创造一道射线。",
  "mech": {
   "attack": "ranged",
   "count": 3,
   "countPerSlot": 1,
   "damage": "2d6",
   "damageType": "fire"
  }
 },
 {
  "key": "searing-smite",
  "name": "灼热斩",
  "level": 1,
  "school": "evocation",
  "classes": [
   "paladin"
  ],
  "castingTime": "附赠动作（你用近战武器或徒手打击命中目标后立即执行）",
  "timing": "bonus",
  "ritual": false,
  "range": "自身",
  "components": "V",
  "duration": "1 分钟",
  "concentration": false,
  "text": "你命中目标时，目标受到这次攻击额外造成的 1d6 火焰伤害。在法术结束之前，目标在它的每个回合开始时受到 1d6 火焰伤害，然后进行一次体质豁免。豁免失败，法术继续生效；豁免成功，法术结束。",
  "higher": "升环施法：法术位每比 1 环高一环，此法术的所有伤害都增加 1d6。",
  "mech": {
   "auto": true,
   "damage": "1d6",
   "damageType": "fire",
   "damagePerSlot": "1d6",
   "effect": {
    "target": "targets",
    "note": "每个回合开始时受到 1d6 火焰伤害（升环时同样增加），然后进行体质豁免，成功则法术结束"
   }
  }
 },
 {
  "key": "see-invisibility",
  "name": "识破隐形",
  "level": 2,
  "school": "divination",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S、M（一撮滑石粉）",
  "duration": "1 小时",
  "concentration": false,
  "text": "在持续时间内，你能看见处于隐形状态的生物和物体，就如同它们可见一样，并且你能看进以太位面。那里的生物和物体在你看来如同幽灵一般。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "self",
    "note": "能看见处于隐形状态的生物和物体，并能看进以太位面"
   }
  }
 },
 {
  "key": "sending",
  "name": "送讯术",
  "level": 3,
  "school": "divination",
  "classes": [
   "bard",
   "cleric",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "无限",
  "components": "V、S、M（一根铜丝）",
  "duration": "立即",
  "concentration": false,
  "text": "你向一个你见过的生物，或者某个见过它的人向你描述过的生物，发送一条不超过 25 个词的简短讯息。目标在脑海中听到这条讯息，如果它认识你，就能认出你是发送者，并且可以立即以同样的方式回复。此法术能让目标理解你讯息的含义。\n你可以跨越任何距离发送讯息，甚至可以发送到其他存在位面，但如果目标与你不在同一个位面，讯息有 5% 的几率无法送达。如果送达失败，你会知道。\n收到你的讯息后，一个生物可以在 8 小时内阻止你再用此法术联系它。如果你在这段时间内尝试发送另一条讯息，你会得知自己被阻止了，法术失败。",
  "higher": null,
  "mech": null
 },
 {
  "key": "shatter",
  "name": "粉碎音波",
  "level": 2,
  "school": "evocation",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一片云母）",
  "duration": "立即",
  "concentration": false,
  "text": "一声巨响从射程内你选择的一点爆发出来。以该点为中心、半径 10 尺的球形区域内的每个生物都要进行一次体质豁免，失败受到 3d8 雷鸣伤害，成功则伤害减半。构装生物进行这次豁免具有劣势。\n位于法术区域内、没有被穿戴或携带的非魔法物体也会受到这些伤害。",
  "higher": "升环施法：法术位每比 2 环高一环，伤害增加 1d8。",
  "mech": {
   "save": "con",
   "onSave": "half",
   "damage": "3d8",
   "damageType": "thunder",
   "damagePerSlot": "1d8"
  }
 },
 {
  "key": "shield",
  "name": "护盾术",
  "level": 1,
  "school": "abjuration",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "反应（你被攻击检定命中或成为《魔法飞弹》的目标时）",
  "timing": "reaction",
  "ritual": false,
  "range": "自身",
  "components": "V、S",
  "duration": "1 轮",
  "concentration": false,
  "text": "一道无法察觉的魔法力场屏障保护着你。直到你下个回合开始，你的 AC 获得 +5 加值，对触发此法术的那次攻击也同样有效，并且你不会受到《魔法飞弹》的伤害。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "self",
    "ac": 5,
    "note": "AC 获得 +5 加值（对触发的那次攻击也有效），不受《魔法飞弹》伤害，直到你下个回合开始"
   }
  }
 },
 {
  "key": "shield-of-faith",
  "name": "虔诚护盾",
  "level": 1,
  "school": "abjuration",
  "classes": [
   "cleric",
   "paladin"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一卷祷文卷轴）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "一层闪烁的力场环绕着射程内你选择的一个生物，使它在持续时间内 AC 获得 +2 加值。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "ac": 2,
    "note": "AC 获得 +2 加值"
   }
  }
 },
 {
  "key": "shillelagh",
  "name": "橡棍术",
  "level": 0,
  "school": "transmutation",
  "classes": [
   "druid"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "自身",
  "components": "V、S、M（槲寄生）",
  "duration": "1 分钟",
  "concentration": false,
  "text": "你手持的一根短棒或长棍被灌注了自然之力。在持续时间内，你用这把武器进行近战攻击时，攻击检定和伤害掷骰可以使用你的施法属性代替力量，并且这把武器的伤害骰变为 d8。如果攻击造成伤害，伤害可以是力场伤害，也可以是武器的正常伤害类型（由你选择）。\n如果你再次施放此法术，或者你放开了这把武器，法术提前结束。",
  "higher": "戏法强化：当你达到 5 级（d10）、11 级（d12）和 17 级（2d6）时，伤害骰随之改变。",
  "mech": {
   "effect": {
    "target": "self",
    "note": "用所持短棒或长棍进行近战攻击时，攻击和伤害可用施法属性代替力量，伤害骰变为 d8（5 级 d10、11 级 d12、17 级 2d6），伤害可改为力场"
   }
  }
 },
 {
  "key": "shining-smite",
  "name": "耀光斩",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "paladin"
  ],
  "castingTime": "附赠动作（你用近战武器或徒手打击命中一个生物后立即执行）",
  "timing": "bonus",
  "ritual": false,
  "range": "自身",
  "components": "V",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "被这次打击命中的目标受到这次攻击额外造成的 2d6 光耀伤害。在法术结束之前，目标发出半径 5 尺的明亮光照，对它进行的攻击检定具有优势，并且它无法从隐形状态中获益。",
  "higher": "升环施法：法术位每比 2 环高一环，伤害增加 1d6。",
  "mech": {
   "auto": true,
   "damage": "2d6",
   "damageType": "radiant",
   "damagePerSlot": "1d6",
   "effect": {
    "target": "targets",
    "note": "发出半径 5 尺的明亮光照，对它进行的攻击检定具有优势，并且它无法从隐形状态中获益"
   }
  }
 },
 {
  "key": "shocking-grasp",
  "name": "电爪",
  "level": 0,
  "school": "evocation",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "闪电从你身上窜向一个你试图触碰的生物。对目标进行一次近战法术攻击。命中时，目标受到 1d8 闪电伤害，并且直到它下个回合开始之前，它都不能进行借机攻击。",
  "higher": "戏法强化：当你达到 5 级（2d8）、11 级（3d8）和 17 级（4d8）时，伤害各增加 1d8。",
  "mech": {
   "attack": "melee",
   "damage": "1d8",
   "damageType": "lightning",
   "cantripDice": "2d8"
  }
 },
 {
  "key": "silence",
  "name": "沉默术",
  "level": 2,
  "school": "illusion",
  "classes": [
   "bard",
   "cleric",
   "ranger"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "120 尺",
  "components": "V、S",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "在持续时间内，以射程内你选择的一点为中心、半径 20 尺的球形区域内不会产生任何声音，声音也无法穿过这片区域。完全位于球形区域内的任何生物或物体对雷鸣伤害具有免疫，并且生物完全位于其中时处于耳聋状态。在该区域内无法施放包含言语成分的法术。",
  "higher": null,
  "mech": null
 },
 {
  "key": "silent-image",
  "name": "无声幻影",
  "level": 1,
  "school": "illusion",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一小撮羊毛）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "你创造一个物体、一个生物或其他某种可见现象的影像，其大小不超过一个 15 尺立方。影像出现在射程内的某处，并持续到法术结束。影像纯粹是视觉上的，不伴有声音、气味或其他感官效果。\n你可以执行一个魔法动作，让影像移动到射程内的任意位置。影像改变位置时，你可以改变它的外观，让它的移动看起来很自然。例如，如果你创造了一个生物的影像并移动它，你可以改变影像，让它看起来像在走路。\n与影像发生物理接触就会发现它是幻象，因为东西能从它中间穿过。执行研究动作检视影像的生物，如果在一次对抗你法术豁免 DC 的智力（调查）检定中成功，就能确定它是幻象。如果一个生物识破了幻象的本质，它就能看穿这个影像。",
  "higher": null,
  "mech": null
 },
 {
  "key": "sleep",
  "name": "睡眠术",
  "level": 1,
  "school": "enchantment",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一撮沙子或玫瑰花瓣）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "以射程内一点为中心、半径 5 尺的球形区域内，每个由你选择的生物都必须通过一次感知豁免，否则陷入失能状态，直到它下个回合结束，届时它必须重复这次豁免。如果目标第二次豁免也失败，它在持续时间内陷入昏迷状态。如果目标受到伤害，或者它 5 尺内有人执行一个动作把它从法术效果中摇醒，此法术对该目标的效果结束。\n不睡觉的生物（例如精灵），或对力竭状态具有免疫的生物，对此法术进行的豁免自动成功。",
  "higher": null,
  "mech": {
   "save": "wis",
   "onSave": "none",
   "condition": "incapacitated"
  }
 },
 {
  "key": "sleet-storm",
  "name": "雨夹雪",
  "level": 3,
  "school": "conjuration",
  "classes": [
   "druid",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "150 尺",
  "components": "V、S、M（一把微型雨伞）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "在法术结束之前，雨夹雪落在以射程内你选择的一点为中心、高 40 尺、半径 20 尺的圆柱区域内。该区域为重度遮蔽，区域内暴露在外的火焰都会被浇灭。\n圆柱区域内的地面为困难地形。当一个生物在一个回合中第一次进入圆柱区域，或在其中开始它的回合时，它必须通过一次敏捷豁免，否则陷入倒地状态并失去专注。",
  "higher": null,
  "mech": {
   "save": "dex",
   "onSave": "none",
   "condition": "prone"
  }
 },
 {
  "key": "slow",
  "name": "缓慢术",
  "level": 3,
  "school": "transmutation",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S、M（一滴糖蜜）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你改变射程内一个 40 尺立方中至多六个由你选择的生物周围的时间。每个目标都必须通过一次感知豁免，否则在持续时间内受此法术影响。\n受影响的目标速度减半，AC 和敏捷豁免检定受到 -2 减值，并且不能执行反应。在它的回合中，它只能执行一个动作或一个附赠动作，不能两者都执行；如果它执行攻击动作，它只能进行一次攻击。如果它施放一个具有姿势成分的法术，有 25% 的几率因为目标做法术手势太慢而导致法术失败。\n受影响的目标在它的每个回合结束时重复这次豁免，成功则此法术对它的效果结束。",
  "higher": null,
  "mech": {
   "save": "wis",
   "onSave": "none",
   "effect": {
    "target": "targets",
    "ac": -2,
    "note": "速度减半，AC 和敏捷豁免检定 -2，不能执行反应，每回合只能执行动作或附赠动作之一，攻击动作只能攻击一次；每个回合结束时重复感知豁免"
   }
  }
 },
 {
  "key": "sorcerous-burst",
  "name": "术法爆发",
  "level": 0,
  "school": "evocation",
  "classes": [
   "sorcerer"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你向射程内的一个生物或物体投出术法能量。对目标进行一次远程法术攻击。命中时，目标受到 1d8 你所选类型的伤害：强酸、冷冻、火焰、闪电、毒素、心灵或雷鸣。\n如果你为此法术掷出的某个 d8 结果为 8，你可以再掷一个 d8，并把它加到伤害上。你施放此法术时，以这种方式加到法术伤害上的 d8 数量最多等于你的施法属性调整值。",
  "higher": "戏法强化：当你达到 5 级（2d8）、11 级（3d8）和 17 级（4d8）时，伤害各增加 1d8。",
  "mech": {
   "attack": "ranged",
   "damage": "1d8",
   "damageType": "fire",
   "damageChoices": [
    "acid",
    "cold",
    "fire",
    "lightning",
    "poison",
    "psychic",
    "thunder"
   ],
   "cantripDice": "2d8"
  }
 },
 {
  "key": "spare-the-dying",
  "name": "维生术",
  "level": 0,
  "school": "necromancy",
  "classes": [
   "cleric",
   "druid"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "15 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "选择射程内一个生命值为 0 且没有死亡的生物。该生物进入稳定状态。",
  "higher": "戏法强化：当你达到 5 级（30 尺）、11 级（60 尺）和 17 级（120 尺）时，射程各翻一倍。",
  "mech": null
 },
 {
  "key": "speak-with-animals",
  "name": "动物交谈",
  "level": 1,
  "school": "divination",
  "classes": [
   "bard",
   "druid",
   "ranger",
   "warlock"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "自身",
  "components": "V、S",
  "duration": "10 分钟",
  "concentration": false,
  "text": "在持续时间内，你能理解野兽并与它们进行言语交流，并且你能对它们使用影响动作的任何技能选项。\n大多数野兽对与生存或陪伴无关的话题没什么可说的，但野兽至少能向你提供附近地点和怪物的信息，包括它在过去一天内察觉到的任何事物。",
  "higher": null,
  "mech": null
 },
 {
  "key": "speak-with-dead",
  "name": "死者交谈",
  "level": 3,
  "school": "necromancy",
  "classes": [
   "bard",
   "cleric",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "10 尺",
  "components": "V、S、M（燃烧的熏香）",
  "duration": "10 分钟",
  "concentration": false,
  "text": "你赋予射程内一具由你选择的尸体以生命的假象，让它能回答你提出的问题。这具尸体必须有嘴，并且如果这个已死生物死亡时是不死生物，此法术会失败。如果这具尸体在过去 10 天内曾是此法术的目标，此法术也会失败。\n在法术结束之前，你最多可以向尸体提出五个问题。尸体只知道它生前知道的东西，包括它生前懂得的语言。回答通常简短、隐晦或重复，而且如果你对它怀有敌意，或者它认出你是敌人，它没有义务如实回答。此法术不会让该生物的灵魂回到身体中，只会唤回驱动这具尸体的残灵。因此，尸体无法得知新的信息，不理解它死后发生的任何事情，也无法推测未来的事件。",
  "higher": null,
  "mech": null
 },
 {
  "key": "speak-with-plants",
  "name": "植物交谈",
  "level": 3,
  "school": "transmutation",
  "classes": [
   "bard",
   "druid",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身（30 尺散发）",
  "components": "V、S",
  "duration": "10 分钟",
  "concentration": false,
  "text": "你让一片不会随你移动的 30 尺散发范围内的植物获得有限的感知能力和活动能力，使它们能与你交流，并遵从你的简单命令。你可以询问植物在过去一天内法术区域中发生的事件，获得关于经过的生物、天气和其他情况的信息。\n你也可以把由植物生长造成的困难地形（例如灌木丛和下层植被）变为普通地形，持续到法术结束。或者，你可以把有植物存在的普通地形变为困难地形，持续到法术结束。\n此法术不能让植物把自己连根拔起并四处移动，但它们可以为你移动枝条、卷须和茎秆。\n如果区域内有植物生物，你可以与它交流，就如同你们有共通的语言。",
  "higher": null,
  "mech": null
 },
 {
  "key": "spider-climb",
  "name": "蛛行术",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一滴沥青和一只蜘蛛）",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "在法术结束之前，你触碰的一个自愿生物获得在垂直表面上上下下、横向移动以及沿着天花板移动的能力，同时双手保持空闲。目标还获得等于其速度的攀爬速度。",
  "higher": "升环施法：法术位每比 2 环高一环，你可以多选择一个生物作为目标。",
  "mech": {
   "effect": {
    "target": "targets",
    "note": "能在垂直表面和天花板上移动且双手保持空闲，获得等于其速度的攀爬速度"
   }
  }
 },
 {
  "key": "spike-growth",
  "name": "尖刺丛生",
  "level": 2,
  "school": "transmutation",
  "classes": [
   "druid",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "150 尺",
  "components": "V、S、M（七根荆棘刺）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "以射程内一点为中心、半径 20 尺的球形区域内，地面长出坚硬的尖刺和荆棘。在持续时间内，该区域成为困难地形。当一个生物移动进入该区域或在区域内移动时，它每移动 5 尺就受到 2d4 穿刺伤害。\n地面的这种变化经过伪装，看起来很自然。施放此法术时看不到该区域的任何生物，必须执行搜索动作，并在一次对抗你法术豁免 DC 的感知（察觉或求生）检定中成功，才能在进入之前认出这片地形是危险的。",
  "higher": null,
  "mech": {
   "auto": true,
   "damage": "2d4",
   "damageType": "piercing"
  }
 },
 {
  "key": "spirit-guardians",
  "name": "灵体卫士",
  "level": 3,
  "school": "conjuration",
  "classes": [
   "cleric"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身（15 尺散发）",
  "components": "V、S、M（一卷祷文卷轴）",
  "duration": "专注，至多 10 分钟",
  "concentration": true,
  "text": "在持续时间内，守护之灵在你周围 15 尺的散发范围内飞掠。如果你是善良或中立的，它们的灵体形态看上去像天使或精类（由你选择）。如果你是邪恶的，它们看上去像邪魔。\n施放此法术时，你可以指定一些生物不受它的影响。其他任何生物在散发范围内的速度减半，并且每当散发范围进入一个生物所在的空间，以及每当一个生物进入散发范围或在其中结束它的回合时，该生物都必须进行一次感知豁免。豁免失败时，该生物受到 3d8 光耀伤害（如果你是善良或中立的）或 3d8 暗蚀伤害（如果你是邪恶的）；豁免成功时，伤害减半。一个生物每回合只进行一次这种豁免。",
  "higher": "升环施法：法术位每比 3 环高一环，伤害增加 1d8。",
  "mech": {
   "save": "wis",
   "onSave": "half",
   "damage": "3d8",
   "damageType": "radiant",
   "damageChoices": [
    "radiant",
    "necrotic"
   ],
   "damagePerSlot": "1d8"
  }
 },
 {
  "key": "spiritual-weapon",
  "name": "灵体武器",
  "level": 2,
  "school": "evocation",
  "classes": [
   "cleric"
  ],
  "castingTime": "附赠动作",
  "timing": "bonus",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你创造出一股漂浮的灵体力场，它的外形像一把由你选择的武器，并持续到法术结束。这股力场出现在射程内你选择的一个空间中，你可以立即对力场 5 尺内的一个生物进行一次近战法术攻击。命中时，目标受到等于 1d8 + 你的施法属性调整值的力场伤害。\n在你之后的回合中，你可以用一个附赠动作让力场移动至多 20 尺，并对它 5 尺内的一个生物重复这次攻击。",
  "higher": "升环施法：法术位每比 2 环高一环，伤害增加 1d8。",
  "mech": {
   "attack": "melee",
   "damage": "1d8",
   "damageType": "force",
   "addMod": true,
   "damagePerSlot": "1d8"
  }
 },
 {
  "key": "starry-wisp",
  "name": "星光微芒",
  "level": 0,
  "school": "evocation",
  "classes": [
   "bard",
   "druid"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你向射程内的一个生物或物体射出一粒光点。对目标进行一次远程法术攻击。命中时，目标受到 1d8 光耀伤害，并且直到你下个回合结束，它发出半径 10 尺的微光，并且无法从隐形状态中获益。",
  "higher": "戏法强化：当你达到 5 级（2d8）、11 级（3d8）和 17 级（4d8）时，伤害各增加 1d8。",
  "mech": {
   "attack": "ranged",
   "damage": "1d8",
   "damageType": "radiant",
   "cantripDice": "2d8"
  }
 },
 {
  "key": "stinking-cloud",
  "name": "臭云术",
  "level": 3,
  "school": "conjuration",
  "classes": [
   "bard",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "90 尺",
  "components": "V、S、M（一枚臭鸡蛋）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你创造一团以射程内一点为中心、半径 20 尺的球形黄色恶心气体。云雾区域为重度遮蔽。云雾会在空中停留到持续时间结束，或直到一阵强风（例如《造风术》产生的风）将它吹散。\n每个在球形区域内开始它的回合的生物都必须通过一次体质豁免，否则陷入中毒状态，直到当前回合结束。以这种方式中毒期间，该生物不能执行动作或附赠动作。",
  "higher": null,
  "mech": {
   "save": "con",
   "onSave": "none",
   "condition": "poisoned"
  }
 },
 {
  "key": "suggestion",
  "name": "暗示术",
  "level": 2,
  "school": "enchantment",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V、M（一滴蜂蜜）",
  "duration": "专注，至多 8 小时",
  "concentration": true,
  "text": "你向射程内一个你能看见、并且能听见和理解你说话的生物暗示一项行动（用不超过 25 个词描述）。暗示的内容必须听起来能够做到，并且不能涉及任何明显会对目标或其盟友造成伤害的事情。例如，你可以说：「去把邪教宝库的钥匙拿来，交给我。」或者你可以说：「别打了，安安静静地离开这座图书馆，不要再回来。」\n目标必须通过一次感知豁免，否则陷入魅惑状态，持续到法术结束，或直到你或你的盟友对目标造成伤害为止。被魅惑的目标会尽其所能执行暗示。暗示的行动可以持续整个持续时间，但如果暗示的行动能在更短的时间内完成，目标完成后此法术对它的效果即结束。",
  "higher": null,
  "mech": {
   "save": "wis",
   "onSave": "none",
   "condition": "charmed"
  }
 },
 {
  "key": "thaumaturgy",
  "name": "奇术",
  "level": 0,
  "school": "transmutation",
  "classes": [
   "cleric"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "30 尺",
  "components": "V",
  "duration": "至多 1 分钟",
  "concentration": false,
  "text": "你在射程内展现一个小小的奇迹。你在射程内创造下列效果之一。如果你多次施放此法术，你最多可以同时维持它的三个持续 1 分钟的效果。\n异变之眼：你改变自己双眼的外观，持续 1 分钟。\n洪亮嗓音：你的声音变得比平时响亮至多三倍，持续 1 分钟。在此期间，你进行的魅力（威吓）检定具有优势。\n火焰把戏：你让火焰闪烁、变亮、变暗或改变颜色，持续 1 分钟。\n隐形之手：你立即让一扇未上锁的门或窗猛地打开或砰地关上。\n幻影之声：你创造一个立即生效的声音，它从射程内你选择的一点发出，例如一阵雷鸣、一声渡鸦啼叫或不祥的低语。\n震颤：你让地面产生无害的震颤，持续 1 分钟。",
  "higher": null,
  "mech": null
 },
 {
  "key": "thunderwave",
  "name": "雷鸣波",
  "level": 1,
  "school": "evocation",
  "classes": [
   "bard",
   "druid",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身（15 尺立方）",
  "components": "V、S",
  "duration": "立即",
  "concentration": false,
  "text": "你释放出一股雷鸣能量波。从你身上延伸出的 15 尺立方内的每个生物都要进行一次体质豁免。豁免失败时，生物受到 2d8 雷鸣伤害，并被推离你 10 尺。豁免成功时，生物仅受到一半伤害，而不会被推开。\n此外，完全位于立方区域内的未固定物体会被推离你 10 尺，并且 300 尺内都能听到一声雷鸣般的轰响。",
  "higher": "升环施法：法术位每比 1 环高一环，伤害增加 1d8。",
  "mech": {
   "save": "con",
   "onSave": "half",
   "damage": "2d8",
   "damageType": "thunder",
   "damagePerSlot": "1d8"
  }
 },
 {
  "key": "tiny-hut",
  "name": "小屋术",
  "level": 3,
  "school": "evocation",
  "classes": [
   "bard",
   "wizard"
  ],
  "castingTime": "1 分钟，可仪式施放",
  "timing": "long",
  "ritual": true,
  "range": "自身（10 尺散发）",
  "components": "V、S、M（一颗水晶珠）",
  "duration": "8 小时",
  "concentration": false,
  "text": "一个 10 尺散发在你周围出现，并在持续时间内保持静止。如果施法时这个散发不够大，无法完全容纳其区域内的所有生物，此法术失败。\n施放此法术时位于散发范围内的生物和物体可以自由穿过它。所有其他生物和物体都无法穿过它。3 环或更低环阶的法术不能穿过它施放，这些法术的效果也无法延伸到它的内部。\n无论外面天气如何，散发范围内的环境都舒适而干燥。在法术结束之前，你可以命令内部变为微光或黑暗（不需要动作）。从外面看，散发是不透明的，颜色由你选择，但从里面看则是透明的。\n如果你离开散发范围，或者再次施放此法术，法术提前结束。",
  "higher": null,
  "mech": null
 },
 {
  "key": "tongues",
  "name": "巧言术",
  "level": 3,
  "school": "divination",
  "classes": [
   "bard",
   "cleric",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、M（一座微型金字形神塔）",
  "duration": "1 小时",
  "concentration": false,
  "text": "此法术让你触碰的生物能够理解它听到或看到的任何口头语言或手语。此外，当目标以说话或手语交流时，任何至少懂一种语言的生物，只要能听到这番话或看到这些手势，就能理解它的意思。",
  "higher": null,
  "mech": null
 },
 {
  "key": "true-strike",
  "name": "克敌机先",
  "level": 0,
  "school": "divination",
  "classes": [
   "bard",
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "S、M（一把你熟练且价值至少 1 铜币的武器）",
  "duration": "立即",
  "concentration": false,
  "text": "在魔法灵光一闪的指引下，你用施放此法术时所用的武器进行一次攻击。这次攻击的攻击检定和伤害掷骰使用你的施法属性，而不是力量或敏捷。如果攻击造成伤害，伤害可以是光耀伤害，也可以是武器的正常伤害类型（由你选择）。",
  "higher": "戏法强化：无论你造成的是光耀伤害还是武器的正常伤害类型，当你达到 5 级（1d6）、11 级（2d6）和 17 级（3d6）时，这次攻击都会额外造成光耀伤害。",
  "mech": null
 },
 {
  "key": "unseen-servant",
  "name": "隐形仆役",
  "level": 1,
  "school": "conjuration",
  "classes": [
   "bard",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "60 尺",
  "components": "V、S、M（一小段绳子和一小块木头）",
  "duration": "1 小时",
  "concentration": false,
  "text": "此法术创造一个隐形、无心智、没有固定形状的中型力场，它会按你的命令完成简单的工作，直到法术结束。仆役出现在射程内地面上一个未被占据的空间中。它的 AC 为 10，有 1 点生命值，力量为 2，并且不能攻击。如果它的生命值降至 0，法术结束。\n在你的每个回合中，你可以执行一次附赠动作，在心中命令仆役移动至多 15 尺，并与一个物体互动。仆役能完成人类能做的简单工作，例如取东西、打扫、缝补、叠衣服、生火、上菜和倒饮料。你下达命令后，仆役会尽其所能去完成这项工作，直到完成为止，然后等待你的下一个命令。\n如果你命令仆役去做的工作会让它移动到距离你超过 60 尺的地方，法术结束。",
  "higher": null,
  "mech": null
 },
 {
  "key": "vampiric-touch",
  "name": "吸血鬼之触",
  "level": 3,
  "school": "necromancy",
  "classes": [
   "sorcerer",
   "warlock",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "自身",
  "components": "V、S",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "你那缠绕着阴影的手一经触碰，就能汲取他人的生命力来治愈你的伤势。对你触及范围内的一个生物进行一次近战法术攻击。命中时，目标受到 3d6 暗蚀伤害，你恢复等于所造成暗蚀伤害一半的生命值。\n在法术结束之前，你可以在你的每个回合中执行一个魔法动作再次进行这次攻击，目标可以是同一个生物，也可以是另一个生物。",
  "higher": "升环施法：法术位每比 3 环高一环，伤害增加 1d6。",
  "mech": {
   "attack": "melee",
   "damage": "3d6",
   "damageType": "necrotic",
   "damagePerSlot": "1d6"
  }
 },
 {
  "key": "vicious-mockery",
  "name": "恶言相加",
  "level": 0,
  "school": "enchantment",
  "classes": [
   "bard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V",
  "duration": "立即",
  "concentration": false,
  "text": "你向射程内一个你能看见或听见的生物发出一连串暗含微妙惑控魔法的辱骂。目标必须通过一次感知豁免，否则受到 1d6 心灵伤害，并且它在自己下个回合结束之前进行的下一次攻击检定具有劣势。",
  "higher": "戏法强化：当你达到 5 级（2d6）、11 级（3d6）和 17 级（4d6）时，伤害各增加 1d6。",
  "mech": {
   "save": "wis",
   "onSave": "none",
   "damage": "1d6",
   "damageType": "psychic",
   "cantripDice": "2d6"
  }
 },
 {
  "key": "warding-bond",
  "name": "守护联结",
  "level": 2,
  "school": "abjuration",
  "classes": [
   "cleric",
   "paladin"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "触及",
  "components": "V、S、M（一对每枚价值至少 50 金币的铂金戒指，你和目标在持续时间内必须佩戴它们）",
  "duration": "1 小时",
  "concentration": false,
  "text": "你触碰另一个自愿生物，在你和目标之间建立一道神秘联结，持续到法术结束。当目标位于你 60 尺内时，它的 AC 和豁免检定获得 +1 加值，并且它对所有伤害具有抗性。此外，它每受到一次伤害，你都会受到同样数值的伤害。\n如果你的生命值降至 0，或者你和目标相距超过 60 尺，法术结束。如果对两个联结生物中的任何一个再次施放此法术，法术也会结束。",
  "higher": null,
  "mech": {
   "effect": {
    "target": "targets",
    "ac": 1,
    "resist": [
     "acid",
     "bludgeoning",
     "cold",
     "fire",
     "force",
     "lightning",
     "necrotic",
     "piercing",
     "poison",
     "psychic",
     "radiant",
     "slashing",
     "thunder"
    ],
    "note": "在你 60 尺内时 AC 和豁免检定获得 +1 加值，对所有伤害具有抗性；它每受到一次伤害，你受到同样数值的伤害"
   }
  }
 },
 {
  "key": "water-breathing",
  "name": "水下呼吸",
  "level": 3,
  "school": "transmutation",
  "classes": [
   "druid",
   "ranger",
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "30 尺",
  "components": "V、S、M（一根短芦苇）",
  "duration": "24 小时",
  "concentration": false,
  "text": "此法术让射程内至多十个由你选择的自愿生物获得在水下呼吸的能力，直到法术结束。受影响的生物仍保留它们正常的呼吸方式。",
  "higher": null,
  "mech": null
 },
 {
  "key": "water-walk",
  "name": "水上行走",
  "level": 3,
  "school": "transmutation",
  "classes": [
   "cleric",
   "druid",
   "ranger",
   "sorcerer"
  ],
  "castingTime": "动作，可仪式施放",
  "timing": "action",
  "ritual": true,
  "range": "30 尺",
  "components": "V、S、M（一块软木）",
  "duration": "1 小时",
  "concentration": false,
  "text": "此法术赋予在任何液体表面上移动的能力，例如水、强酸、泥浆、雪、流沙或熔岩，就如同在无害的坚实地面上移动一样（穿越熔岩的生物仍可能因高温而受到伤害）。射程内至多十个由你选择的自愿生物在持续时间内获得这种能力。\n受影响的目标必须执行一个附赠动作，才能从液体表面进入液体之中，反之亦然；但如果目标坠入液体，它会穿过表面落入下方的液体中。",
  "higher": null,
  "mech": null
 },
 {
  "key": "web",
  "name": "蛛网术",
  "level": 2,
  "school": "conjuration",
  "classes": [
   "sorcerer",
   "wizard"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S、M（一点蜘蛛网）",
  "duration": "专注，至多 1 小时",
  "concentration": true,
  "text": "你在射程内一点召唤出一大团黏稠的蛛网。在持续时间内，蛛网填满该处一个 20 尺立方的区域。蛛网是困难地形，蛛网内的区域为轻度遮蔽。\n如果蛛网没有固定在两个坚实的物体（例如墙壁或树木）之间，也没有铺在地板、墙壁或天花板上，蛛网就会自行坍塌，法术在你下个回合开始时结束。铺在平坦表面上的蛛网厚 5 尺。\n一个生物在一个回合中第一次进入蛛网，或在蛛网中开始它的回合时，必须通过一次敏捷豁免，否则陷入束缚状态，持续到它离开蛛网或挣脱为止。\n被蛛网束缚的生物可以执行一个动作，进行一次对抗你法术豁免 DC 的力量（运动）检定。如果检定成功，它就不再处于束缚状态。\n蛛网是易燃的。任何一个 5 尺立方的蛛网接触到火焰后，会在 1 轮内烧尽，对在火中开始其回合的任何生物造成 2d4 火焰伤害。",
  "higher": null,
  "mech": {
   "save": "dex",
   "onSave": "none",
   "condition": "restrained"
  }
 },
 {
  "key": "wind-wall",
  "name": "风墙术",
  "level": 3,
  "school": "evocation",
  "classes": [
   "druid",
   "ranger"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "120 尺",
  "components": "V、S、M（一把扇子和一根羽毛）",
  "duration": "专注，至多 1 分钟",
  "concentration": true,
  "text": "一道强风之墙从射程内你选择的一点拔地而起。你可以让这道墙最长 50 尺、高 15 尺、厚 1 尺。只要墙沿着地面形成一条连续的路径，你可以把它塑造成任何形状。墙持续到法术结束。\n墙出现时，其区域内的每个生物都要进行一次力量豁免，失败受到 4d8 钝击伤害，成功则伤害减半。\n强风会把雾气、烟雾和其他气体挡在外面。小型或更小的飞行生物或物体无法穿过这道墙。被带进墙内的松散轻质物体会向上飞起。射向墙后目标的箭矢、弩矢和其他普通投射物会被向上吹偏，自动未命中。巨人或攻城器械投掷的巨石以及类似的投射物不受影响。处于气体形态的生物无法穿过这道墙。",
  "higher": null,
  "mech": {
   "save": "str",
   "onSave": "half",
   "damage": "4d8",
   "damageType": "bludgeoning"
  }
 },
 {
  "key": "zone-of-truth",
  "name": "诚实之域",
  "level": 2,
  "school": "enchantment",
  "classes": [
   "bard",
   "cleric",
   "paladin"
  ],
  "castingTime": "动作",
  "timing": "action",
  "ritual": false,
  "range": "60 尺",
  "components": "V、S",
  "duration": "10 分钟",
  "concentration": false,
  "text": "你在以射程内一点为中心、半径 15 尺的球形区域内创造一个防范欺骗的魔法领域。在法术结束之前，一个生物在一个回合中第一次进入法术区域，或在其中开始它的回合时，要进行一次魅力豁免。豁免失败时，该生物在该范围内无法故意说谎。你知道每个生物这次豁免是成功还是失败。\n受影响的生物知道此法术的存在，并且可以避免回答那些它通常会用谎言来回应的问题。这样的生物可以含糊其辞，但所说的必须是真话。",
  "higher": null,
  "mech": {
   "save": "cha",
   "onSave": "none",
   "effect": {
    "target": "targets",
    "note": "在法术区域内无法故意说谎"
   }
  }
 }
];
