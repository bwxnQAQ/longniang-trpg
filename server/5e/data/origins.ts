// 自动生成的文件（SRD 5.2.1 数据 + 本站的中文译文），不要手改。
import type { BackgroundData, FeatData, FeatureText, SpeciesData } from '../../../shared/5e/types';

export const SPECIES: SpeciesData[] = [
 {
  "key": "dragonborn",
  "name": "龙裔",
  "text": "龙裔的外形就像没有翅膀、用双足行走的龙，周身覆盖鳞片，鳞片的颜色往往显示出他们所继承的龙族祖先。相传他们的先祖诞生于龙的魔法或龙神的祝福，许多龙裔至今仍把荣誉、家族和坚定的信念视为立身之本。",
  "size": "medium",
  "speed": 30,
  "darkvision": 60,
  "traits": [
   "darkvision-60",
   "draconic-flight"
  ],
  "lineages": [
   {
    "key": "draconic-ancestor-black",
    "name": "黑龙祖先",
    "traits": [
     "draconic-breath-weapon-acid",
     "draconic-damage-resistance-acid"
    ],
    "damageType": "acid"
   },
   {
    "key": "draconic-ancestor-blue",
    "name": "蓝龙祖先",
    "traits": [
     "draconic-breath-weapon-lightning",
     "draconic-damage-resistance-lightning"
    ],
    "damageType": "lightning"
   },
   {
    "key": "draconic-ancestor-brass",
    "name": "黄铜龙祖先",
    "traits": [
     "draconic-breath-weapon-fire",
     "draconic-damage-resistance-fire"
    ],
    "damageType": "fire"
   },
   {
    "key": "draconic-ancestor-bronze",
    "name": "青铜龙祖先",
    "traits": [
     "draconic-breath-weapon-lightning",
     "draconic-damage-resistance-lightning"
    ],
    "damageType": "lightning"
   },
   {
    "key": "draconic-ancestor-copper",
    "name": "赤铜龙祖先",
    "traits": [
     "draconic-breath-weapon-acid",
     "draconic-damage-resistance-acid"
    ],
    "damageType": "acid"
   },
   {
    "key": "draconic-ancestor-gold",
    "name": "金龙祖先",
    "traits": [
     "draconic-breath-weapon-fire",
     "draconic-damage-resistance-fire"
    ],
    "damageType": "fire"
   },
   {
    "key": "draconic-ancestor-green",
    "name": "绿龙祖先",
    "traits": [
     "draconic-breath-weapon-poison",
     "draconic-damage-resistance-poison"
    ],
    "damageType": "poison"
   },
   {
    "key": "draconic-ancestor-red",
    "name": "红龙祖先",
    "traits": [
     "draconic-breath-weapon-fire",
     "draconic-damage-resistance-fire"
    ],
    "damageType": "fire"
   },
   {
    "key": "draconic-ancestor-silver",
    "name": "银龙祖先",
    "traits": [
     "draconic-breath-weapon-cold",
     "draconic-damage-resistance-cold"
    ],
    "damageType": "cold"
   },
   {
    "key": "draconic-ancestor-white",
    "name": "白龙祖先",
    "traits": [
     "draconic-breath-weapon-cold",
     "draconic-damage-resistance-cold"
    ],
    "damageType": "cold"
   }
  ],
  "lineageLabel": "龙族祖先"
 },
 {
  "key": "dwarf",
  "name": "矮人",
  "text": "矮人身材敦实、骨骼粗壮，常蓄着浓密的胡须，世代生活在山脉深处和地底的石厅之中。传说他们是锻造之神从大地中锻打出来的，因此天生坚韧耐劳，精于采矿、锻造和石工，极为看重家族与传统。",
  "size": "medium",
  "speed": 30,
  "darkvision": 120,
  "traits": [
   "darkvision-120",
   "dwarven-resilience",
   "dwarven-toughness",
   "stonecunning"
  ],
  "lineages": [],
  "lineageLabel": null
 },
 {
  "key": "elf",
  "name": "精灵",
  "text": "精灵身形修长优雅、耳朵尖细，寿命可达数个世纪，与精类世界有着古老的渊源。他们不需要睡眠，而是以保持清醒的出神冥想来休息；卓尔、高等精灵和木精灵等不同的血统，又赋予了他们各自独特的天赋。",
  "size": "medium",
  "speed": 30,
  "darkvision": 60,
  "traits": [
   "darkvision-60",
   "elven-lineage",
   "fey-ancestry",
   "keen-senses",
   "trance"
  ],
  "lineages": [
   {
    "key": "elven-lineage-drow",
    "name": "卓尔",
    "traits": [
     "darkvision-120",
     "lineage-spell-dancing-lights",
     "lineage-spell-faerie-fire",
     "lineage-spell-darkness"
    ],
    "damageType": null
   },
   {
    "key": "elven-lineage-high-elf",
    "name": "高等精灵",
    "traits": [
     "high-elf-cantrip-versatility",
     "lineage-spell-detect-magic",
     "lineage-spell-misty-step"
    ],
    "damageType": null
   },
   {
    "key": "elven-lineage-wood-elf",
    "name": "木精灵",
    "traits": [
     "wood-elf-speed-increase",
     "lineage-spell-longstrider",
     "lineage-spell-pass-without-trace"
    ],
    "damageType": null
   }
  ],
  "lineageLabel": "精灵血统"
 },
 {
  "key": "gnome",
  "name": "侏儒",
  "text": "侏儒身材矮小、精力充沛，好奇心极强，热爱发明、魔法、恶作剧和各种奇思妙想。森林侏儒擅长幻术，能与林间的小动物交谈；岩石侏儒则以精巧的发条装置和机关闻名。",
  "size": "small",
  "speed": 30,
  "darkvision": 60,
  "traits": [
   "darkvision-60",
   "gnomish-cunning",
   "gnomish-lineage"
  ],
  "lineages": [
   {
    "key": "gnomish-lineage-forest-gnome",
    "name": "森林侏儒",
    "traits": [
     "gnomish-lineage-forest-gnome",
     "lineage-spell-minor-illusion"
    ],
    "damageType": null
   },
   {
    "key": "gnomish-lineage-rock-gnome",
    "name": "岩石侏儒",
    "traits": [
     "gnomish-lineage-rock-gnome",
     "lineage-spell-mending"
    ],
    "damageType": null
   }
  ],
  "lineageLabel": "侏儒血统"
 },
 {
  "key": "goliath",
  "name": "歌利亚",
  "text": "歌利亚是远古巨人的后裔，身材高大魁梧，皮肤上常带有岩石般的纹路。他们崇尚力量和自我超越，体内的巨人血脉让他们能唤起云、火、霜、山丘、石、风暴等巨人祖先的超自然恩赐。",
  "size": "medium",
  "speed": 35,
  "darkvision": 0,
  "traits": [
   "giant-ancestry",
   "large-form",
   "powerful-build"
  ],
  "lineages": [
   {
    "key": "giant-ancestry-clouds-jaunt",
    "name": "云巨人祖先",
    "traits": [
     "giant-ancestry-clouds-jaunt"
    ],
    "damageType": null
   },
   {
    "key": "giant-ancestry-fires-burn",
    "name": "火巨人祖先",
    "traits": [
     "giant-ancestry-fires-burn"
    ],
    "damageType": null
   },
   {
    "key": "giant-ancestry-frosts-chill",
    "name": "霜巨人祖先",
    "traits": [
     "giant-ancestry-frosts-chill"
    ],
    "damageType": null
   },
   {
    "key": "giant-ancestry-hills-tumble",
    "name": "山丘巨人祖先",
    "traits": [
     "giant-ancestry-hills-tumble"
    ],
    "damageType": null
   },
   {
    "key": "giant-ancestry-stones-endurance",
    "name": "石巨人祖先",
    "traits": [
     "giant-ancestry-stones-endurance"
    ],
    "damageType": null
   },
   {
    "key": "giant-ancestry-storms-thunder",
    "name": "风暴巨人祖先",
    "traits": [
     "giant-ancestry-storms-thunder"
    ],
    "damageType": null
   }
  ],
  "lineageLabel": "巨人祖先"
 },
 {
  "key": "halfling",
  "name": "半身人",
  "text": "半身人身材小巧，性情乐观、知足常乐，热爱家园、美食和朋友间的欢聚，但其中也不乏向往远方的冒险者。他们胆大心细、身手灵活，好运气似乎总是站在他们这一边。",
  "size": "small",
  "speed": 30,
  "darkvision": 0,
  "traits": [
   "brave",
   "halfling-nimbleness",
   "luck",
   "naturally-stealthy"
  ],
  "lineages": [],
  "lineageLabel": null
 },
 {
  "key": "human",
  "name": "人类",
  "text": "人类是多元宇宙中分布最广的种族，寿命虽然不长，却怀有远大的抱负和惊人的适应力。他们的外貌、文化和信仰千差万别，常常在短暂的一生中努力成就非凡的事业。",
  "size": "choice",
  "speed": 30,
  "darkvision": 0,
  "traits": [
   "resourceful",
   "skillful",
   "versatile"
  ],
  "lineages": [],
  "lineageLabel": null
 },
 {
  "key": "orc",
  "name": "兽人",
  "text": "兽人身材高大强壮，长着突出的獠牙，相传他们的祖先曾在广袤的荒野上漂泊，为生存而战。他们精力旺盛、坚韧顽强，以永不放弃的毅力和在黑暗中视物的眼力著称。",
  "size": "medium",
  "speed": 30,
  "darkvision": 120,
  "traits": [
   "adrenaline-rush",
   "darkvision-120",
   "relentless-endurance"
  ],
  "lineages": [],
  "lineageLabel": null
 },
 {
  "key": "tiefling",
  "name": "提夫林",
  "text": "提夫林是血脉中带有下层位面印记的类人生物，常长着角、尾巴或异色的眼睛。他们的邪魔遗赠可能来自深渊、冥府或炼狱，赋予他们超自然的力量，但这份遗赠并不决定他们的品性与命运。",
  "size": "choice",
  "speed": 30,
  "darkvision": 60,
  "traits": [
   "darkvision-60",
   "fiendish-legacy",
   "otherworldly-presence"
  ],
  "lineages": [
   {
    "key": "fiendish-legacy-abyssal",
    "name": "深渊遗赠",
    "traits": [
     "lineage-resistance-poison",
     "lineage-spell-poison-spray",
     "lineage-spell-ray-of-sickness",
     "lineage-spell-hold-person"
    ],
    "damageType": null
   },
   {
    "key": "fiendish-legacy-chthonic",
    "name": "冥府遗赠",
    "traits": [
     "lineage-resistance-necrotic",
     "lineage-spell-chill-touch",
     "lineage-spell-false-life",
     "lineage-spell-ray-of-enfeeblement"
    ],
    "damageType": null
   },
   {
    "key": "fiendish-legacy-infernal",
    "name": "炼狱遗赠",
    "traits": [
     "lineage-resistance-fire",
     "lineage-spell-fire-bolt",
     "lineage-spell-hellish-rebuke",
     "lineage-spell-darkness"
    ],
    "damageType": null
   }
  ],
  "lineageLabel": "邪魔遗赠"
 }
];

export const TRAITS: Record<string, FeatureText> = {
 "adrenaline-rush": {
  "key": "adrenaline-rush",
  "name": "肾上腺素激增",
  "text": "你可以用附赠动作执行疾走动作。当你这样做时，你获得等同于你熟练加值的临时生命值。\n你可以使用这项特质的次数等于你的熟练加值，完成短休或长休时恢复所有已消耗的次数。"
 },
 "brave": {
  "key": "brave",
  "name": "勇敢",
  "text": "你为避免或结束恐慌状态而进行的豁免检定具有优势。"
 },
 "draconic-breath-weapon-acid": {
  "key": "draconic-breath-weapon-acid",
  "name": "吐息武器：强酸",
  "text": "当你在自己的回合执行攻击动作时，你可以把其中一次攻击替换为呼出一股魔法能量，形状为 15 尺锥形或长 30 尺、宽 5 尺的直线（每次使用时自选形状）。该区域内的每个生物都必须进行一次敏捷豁免（DC 8 + 你的体质调整值 + 你的熟练加值）。豁免失败的生物受到 1d10 强酸伤害；豁免成功的生物伤害减半。当你达到角色等级 5 级（2d10）、11 级（3d10）和 17 级（4d10）时，这项伤害各增加 1d10。\n你可以使用这项吐息武器的次数等于你的熟练加值，完成长休时恢复所有已消耗的次数。"
 },
 "draconic-breath-weapon-cold": {
  "key": "draconic-breath-weapon-cold",
  "name": "吐息武器：冷冻",
  "text": "当你在自己的回合执行攻击动作时，你可以把其中一次攻击替换为呼出一股魔法能量，形状为 15 尺锥形或长 30 尺、宽 5 尺的直线（每次使用时自选形状）。该区域内的每个生物都必须进行一次敏捷豁免（DC 8 + 你的体质调整值 + 你的熟练加值）。豁免失败的生物受到 1d10 冷冻伤害；豁免成功的生物伤害减半。当你达到角色等级 5 级（2d10）、11 级（3d10）和 17 级（4d10）时，这项伤害各增加 1d10。\n你可以使用这项吐息武器的次数等于你的熟练加值，完成长休时恢复所有已消耗的次数。"
 },
 "draconic-breath-weapon-fire": {
  "key": "draconic-breath-weapon-fire",
  "name": "吐息武器：火焰",
  "text": "当你在自己的回合执行攻击动作时，你可以把其中一次攻击替换为呼出一股魔法能量，形状为 15 尺锥形或长 30 尺、宽 5 尺的直线（每次使用时自选形状）。该区域内的每个生物都必须进行一次敏捷豁免（DC 8 + 你的体质调整值 + 你的熟练加值）。豁免失败的生物受到 1d10 火焰伤害；豁免成功的生物伤害减半。当你达到角色等级 5 级（2d10）、11 级（3d10）和 17 级（4d10）时，这项伤害各增加 1d10。\n你可以使用这项吐息武器的次数等于你的熟练加值，完成长休时恢复所有已消耗的次数。"
 },
 "draconic-breath-weapon-lightning": {
  "key": "draconic-breath-weapon-lightning",
  "name": "吐息武器：闪电",
  "text": "当你在自己的回合执行攻击动作时，你可以把其中一次攻击替换为呼出一股魔法能量，形状为 15 尺锥形或长 30 尺、宽 5 尺的直线（每次使用时自选形状）。该区域内的每个生物都必须进行一次敏捷豁免（DC 8 + 你的体质调整值 + 你的熟练加值）。豁免失败的生物受到 1d10 闪电伤害；豁免成功的生物伤害减半。当你达到角色等级 5 级（2d10）、11 级（3d10）和 17 级（4d10）时，这项伤害各增加 1d10。\n你可以使用这项吐息武器的次数等于你的熟练加值，完成长休时恢复所有已消耗的次数。"
 },
 "draconic-breath-weapon-poison": {
  "key": "draconic-breath-weapon-poison",
  "name": "吐息武器：毒素",
  "text": "当你在自己的回合执行攻击动作时，你可以把其中一次攻击替换为呼出一股魔法能量，形状为 15 尺锥形或长 30 尺、宽 5 尺的直线（每次使用时自选形状）。该区域内的每个生物都必须进行一次敏捷豁免（DC 8 + 你的体质调整值 + 你的熟练加值）。豁免失败的生物受到 1d10 毒素伤害；豁免成功的生物伤害减半。当你达到角色等级 5 级（2d10）、11 级（3d10）和 17 级（4d10）时，这项伤害各增加 1d10。\n你可以使用这项吐息武器的次数等于你的熟练加值，完成长休时恢复所有已消耗的次数。"
 },
 "draconic-damage-resistance-acid": {
  "key": "draconic-damage-resistance-acid",
  "name": "伤害抗性：强酸",
  "text": "你对强酸伤害具有抗性，抗性类型由你的龙族祖先特质决定。"
 },
 "draconic-damage-resistance-cold": {
  "key": "draconic-damage-resistance-cold",
  "name": "伤害抗性：冷冻",
  "text": "你对冷冻伤害具有抗性，抗性类型由你的龙族祖先特质决定。"
 },
 "draconic-damage-resistance-fire": {
  "key": "draconic-damage-resistance-fire",
  "name": "伤害抗性：火焰",
  "text": "你对火焰伤害具有抗性，抗性类型由你的龙族祖先特质决定。"
 },
 "draconic-damage-resistance-lightning": {
  "key": "draconic-damage-resistance-lightning",
  "name": "伤害抗性：闪电",
  "text": "你对闪电伤害具有抗性，抗性类型由你的龙族祖先特质决定。"
 },
 "draconic-damage-resistance-poison": {
  "key": "draconic-damage-resistance-poison",
  "name": "伤害抗性：毒素",
  "text": "你对毒素伤害具有抗性，抗性类型由你的龙族祖先特质决定。"
 },
 "darkvision-60": {
  "key": "darkvision-60",
  "name": "黑暗视觉（60 尺）",
  "text": "你拥有范围 60 尺的黑暗视觉。"
 },
 "darkvision-120": {
  "key": "darkvision-120",
  "name": "黑暗视觉（120 尺）",
  "text": "你拥有范围 120 尺的黑暗视觉。"
 },
 "draconic-ancestry": {
  "key": "draconic-ancestry",
  "name": "龙族祖先",
  "text": "你的血脉源自一位龙族始祖。从「龙族祖先」表中选择一种龙。你的选择会影响你的吐息武器和伤害抗性特质，也会影响你的外貌。\n龙族祖先表（龙：伤害类型）\n黑龙：强酸\n蓝龙：闪电\n黄铜龙：火焰\n青铜龙：闪电\n赤铜龙：强酸\n绿龙：毒素\n金龙：火焰\n红龙：火焰\n银龙：冷冻\n白龙：冷冻"
 },
 "draconic-flight": {
  "key": "draconic-flight",
  "name": "龙族飞行",
  "text": "当你达到角色等级 5 级时，你可以引导龙族魔法，让自己暂时获得飞行能力。你可以用一个附赠动作在背后长出一对幽灵般的翅膀，翅膀持续 10 分钟，或者直到你收起翅膀（不需要动作）或陷入失能状态为止。在此期间，你拥有等同于你速度的飞行速度。你的翅膀看起来由与你的吐息武器相同的能量构成。一旦你使用了这项特质，在完成长休之前不能再次使用。"
 },
 "dwarven-resilience": {
  "key": "dwarven-resilience",
  "name": "矮人韧性",
  "text": "你对毒素伤害具有抗性。你为避免或结束中毒状态而进行的豁免检定也具有优势。"
 },
 "dwarven-toughness": {
  "key": "dwarven-toughness",
  "name": "矮人坚韧",
  "text": "你的生命值上限增加 1，并且你每提升一级，生命值上限都会再增加 1。"
 },
 "elven-lineage": {
  "key": "elven-lineage",
  "name": "精灵血统",
  "text": "你属于一个赋予你超自然能力的血统。从「精灵血统」表中选择一个血统，你获得该血统的 1 级效益。\n当你达到角色等级 3 级和 5 级时，你会学会一道更高环阶的法术，如表中所示。\n你始终准备着该法术。你可以不消耗法术位施放它一次，并在完成长休时恢复以这种方式施放它的能力。你也可以使用你拥有的、环阶合适的任何法术位来施放该法术。\n精灵血统表\n卓尔\n1 级：你的黑暗视觉范围增加到 120 尺。你还知晓《舞光术》戏法。\n3 级：《妖火》\n5 级：《黑暗术》\n高等精灵\n1 级：你知晓《魔法伎俩》戏法。每当你完成长休时，你可以把这个戏法替换为法师法术列表中的另一个戏法。\n3 级：《侦测魔法》\n5 级：《迷踪步》\n木精灵\n1 级：你的速度增加到 35 尺。你还知晓《德鲁伊伎俩》戏法。\n3 级：《大步奔行》\n5 级：《行动无踪》\n你通过这项特质施放的法术，以智力、感知或魅力为施法属性（在选择血统时决定）。"
 },
 "fey-ancestry": {
  "key": "fey-ancestry",
  "name": "精类祖先",
  "text": "你为避免或结束魅惑状态而进行的豁免检定具有优势。"
 },
 "fiendish-legacy": {
  "key": "fiendish-legacy",
  "name": "邪魔遗赠",
  "text": "你是一份遗赠的承受者，这份遗赠赋予你超自然能力。从「邪魔遗赠」表中选择一种遗赠，你获得所选遗赠的 1 级效益。\n当你达到角色等级 3 级和 5 级时，你会学会一道更高环阶的法术，如表中所示。\n你始终准备着该法术。你可以不消耗法术位施放它一次，并在完成长休时恢复以这种方式施放它的能力。你也可以使用你拥有的、环阶合适的任何法术位来施放该法术。\n你通过这项特质施放的法术，以智力、感知或魅力为施法属性（在选择遗赠时决定）。\n邪魔遗赠表\n深渊\n1 级：你对毒素伤害具有抗性。你还知晓《毒气喷溅》戏法。\n3 级：《致病射线》\n5 级：《人类定身术》\n冥府\n1 级：你对暗蚀伤害具有抗性。你还知晓《颤栗之触》戏法。\n3 级：《虚假生命》\n5 级：《衰弱射线》\n炼狱\n1 级：你对火焰伤害具有抗性。你还知晓《火焰箭》戏法。\n3 级：《炼狱叱喝》\n5 级：《黑暗术》"
 },
 "giant-ancestry": {
  "key": "giant-ancestry",
  "name": "巨人祖先",
  "text": "你是巨人的后裔。从下列效益中选择一项——这是来自你祖先的一份超自然恩赐；你可以使用所选效益的次数等于你的熟练加值，完成长休时恢复所有已消耗的次数：\n云之跃迁（云巨人）。你以一个附赠动作，魔法般地传送至多 30 尺，到达一处你能看见的未被占据的空间。\n火之灼烧（火巨人）。当你以攻击检定命中一个目标并对它造成伤害时，你还可以对该目标造成 1d10 火焰伤害。\n霜之寒意（霜巨人）。当你以攻击检定命中一个目标并对它造成伤害时，你还可以对该目标造成 1d6 冷冻伤害，并使它的速度降低 10 尺，直到你的下个回合开始。\n丘之颠仆（山丘巨人）。当你以攻击检定命中一个大型或更小的生物并对它造成伤害时，你可以使该目标陷入倒地状态。\n石之坚忍（石巨人）。当你受到伤害时，你可以用一个反应掷 1d12，把掷出的数字加上你的体质调整值，并把所受的伤害减少这个总数。\n风暴之雷（风暴巨人）。当你受到你 60 尺范围内某个生物造成的伤害时，你可以用一个反应对该生物造成 1d8 雷鸣伤害。"
 },
 "giant-ancestry-clouds-jaunt": {
  "key": "giant-ancestry-clouds-jaunt",
  "name": "巨人祖先：云之跃迁",
  "text": "你以一个附赠动作，魔法般地传送至多 30 尺，到达一处你能看见的未被占据的空间。"
 },
 "giant-ancestry-fires-burn": {
  "key": "giant-ancestry-fires-burn",
  "name": "巨人祖先：火之灼烧",
  "text": "当你以攻击检定命中一个目标并对它造成伤害时，你还可以对该目标造成 1d10 火焰伤害。"
 },
 "giant-ancestry-frosts-chill": {
  "key": "giant-ancestry-frosts-chill",
  "name": "巨人祖先：霜之寒意",
  "text": "当你以攻击检定命中一个目标并对它造成伤害时，你还可以对该目标造成 1d6 冷冻伤害，并使它的速度降低 10 尺，直到你的下个回合开始。"
 },
 "giant-ancestry-hills-tumble": {
  "key": "giant-ancestry-hills-tumble",
  "name": "巨人祖先：丘之颠仆",
  "text": "当你以攻击检定命中一个大型或更小的生物并对它造成伤害时，你可以使该目标陷入倒地状态。"
 },
 "giant-ancestry-stones-endurance": {
  "key": "giant-ancestry-stones-endurance",
  "name": "巨人祖先：石之坚忍",
  "text": "当你受到伤害时，你可以用一个反应掷 1d12，把掷出的数字加上你的体质调整值，并把所受的伤害减少这个总数。"
 },
 "giant-ancestry-storms-thunder": {
  "key": "giant-ancestry-storms-thunder",
  "name": "巨人祖先：风暴之雷",
  "text": "当你受到你 60 尺范围内某个生物造成的伤害时，你可以用一个反应对该生物造成 1d8 雷鸣伤害。"
 },
 "gnomish-cunning": {
  "key": "gnomish-cunning",
  "name": "侏儒狡黠",
  "text": "你的智力、感知和魅力豁免检定具有优势。"
 },
 "gnomish-lineage": {
  "key": "gnomish-lineage",
  "name": "侏儒血统",
  "text": "你属于一个赋予你超自然能力的血统。从下列选项中选择一项；无论选择哪一项，你通过这项特质施放的法术都以智力、感知或魅力为施法属性（在选择血统时决定）：\n森林侏儒。你知晓《次级幻象》戏法。你还始终准备着《动物交谈》法术。你可以不消耗法术位施放它，次数等于你的熟练加值，完成长休时恢复所有已消耗的次数。你也可以使用你拥有的任何法术位来施放该法术。\n岩石侏儒。你知晓《修复术》和《魔法伎俩》戏法。此外，你可以花 10 分钟施放《魔法伎俩》，制造一个微型发条装置（AC 5，生命值 1），比如玩具、打火器或音乐盒。制造装置时，你从《魔法伎俩》的效果中选择一项来决定它的功能；每当你或其他生物用一个附赠动作触碰启动该装置时，它就产生那个效果。如果所选效果本身包含几种选项，你在制造装置时为它选定其中一种。\n例如，如果你选择了该法术的点燃或熄灭效果，你要决定这个装置是点火还是灭火；装置不能两者都做。你同时最多可以拥有三个这样的装置，每个装置在制造 8 小时后瓦解，或者在你以一个使用动作触碰拆解它时瓦解。"
 },
 "gnomish-lineage-forest-gnome": {
  "key": "gnomish-lineage-forest-gnome",
  "name": "侏儒血统：森林侏儒",
  "text": "你始终准备着《动物交谈》法术。你可以不消耗法术位施放它，次数等于你的熟练加值，完成长休时恢复所有已消耗的次数。你也可以使用你拥有的任何法术位来施放该法术。"
 },
 "gnomish-lineage-rock-gnome": {
  "key": "gnomish-lineage-rock-gnome",
  "name": "侏儒血统：岩石侏儒",
  "text": "你知晓《魔法伎俩》戏法。此外，你可以花 10 分钟施放《魔法伎俩》，制造一个微型发条装置（AC 5，生命值 1），比如玩具、打火器或音乐盒。制造装置时，你从《魔法伎俩》的效果中选择一项来决定它的功能；每当你或其他生物用一个附赠动作触碰启动该装置时，它就产生那个效果。如果所选效果本身包含几种选项，你在制造装置时为它选定其中一种。例如，如果你选择了该法术的点燃或熄灭效果，你要决定这个装置是点火还是灭火；装置不能两者都做。你同时最多可以拥有三个这样的装置，每个装置在制造 8 小时后瓦解，或者在你以一个使用动作触碰拆解它时瓦解。"
 },
 "halfling-nimbleness": {
  "key": "halfling-nimbleness",
  "name": "半身人灵活",
  "text": "你可以穿过体型比你大的任何生物所在的空间，但不能停留在同一空间中。"
 },
 "high-elf-cantrip-versatility": {
  "key": "high-elf-cantrip-versatility",
  "name": "高等精灵：戏法变通",
  "text": "你知晓《魔法伎俩》戏法。每当你完成长休时，你可以把这个戏法替换为法师法术列表中的另一个戏法。"
 },
 "keen-senses": {
  "key": "keen-senses",
  "name": "敏锐感官",
  "text": "你获得洞悉、察觉或求生技能中一项的熟练。"
 },
 "large-form": {
  "key": "large-form",
  "name": "大型形态",
  "text": "从角色等级 5 级开始，如果你所在的空间足够大，你可以用一个附赠动作把自己的体型变为大型。这种变化持续 10 分钟，或者直到你结束它（不需要动作）为止。在此期间，你的力量检定具有优势，并且你的速度增加 10 尺。一旦你使用了这项特质，在完成长休之前不能再次使用。"
 },
 "lineage-resistance-fire": {
  "key": "lineage-resistance-fire",
  "name": "伤害抗性：火焰",
  "text": "你对火焰伤害具有抗性。"
 },
 "lineage-resistance-necrotic": {
  "key": "lineage-resistance-necrotic",
  "name": "伤害抗性：暗蚀",
  "text": "你对暗蚀伤害具有抗性。"
 },
 "lineage-resistance-poison": {
  "key": "lineage-resistance-poison",
  "name": "伤害抗性：毒素",
  "text": "你对毒素伤害具有抗性。"
 },
 "lineage-spell-chill-touch": {
  "key": "lineage-spell-chill-touch",
  "name": "颤栗之触",
  "text": "你知晓《颤栗之触》法术。"
 },
 "lineage-spell-dancing-lights": {
  "key": "lineage-spell-dancing-lights",
  "name": "舞光术",
  "text": "你知晓《舞光术》法术。"
 },
 "lineage-spell-darkness": {
  "key": "lineage-spell-darkness",
  "name": "黑暗术",
  "text": "你知晓《黑暗术》法术。"
 },
 "lineage-spell-detect-magic": {
  "key": "lineage-spell-detect-magic",
  "name": "侦测魔法",
  "text": "你知晓《侦测魔法》法术。"
 },
 "lineage-spell-faerie-fire": {
  "key": "lineage-spell-faerie-fire",
  "name": "妖火",
  "text": "你知晓《妖火》法术。"
 },
 "lineage-spell-false-life": {
  "key": "lineage-spell-false-life",
  "name": "虚假生命",
  "text": "你知晓《虚假生命》法术。"
 },
 "lineage-spell-fire-bolt": {
  "key": "lineage-spell-fire-bolt",
  "name": "火焰箭",
  "text": "你知晓《火焰箭》法术。"
 },
 "lineage-spell-hellish-rebuke": {
  "key": "lineage-spell-hellish-rebuke",
  "name": "炼狱叱喝",
  "text": "你知晓《炼狱叱喝》法术。"
 },
 "lineage-spell-hold-person": {
  "key": "lineage-spell-hold-person",
  "name": "人类定身术",
  "text": "你知晓《人类定身术》法术。"
 },
 "lineage-spell-longstrider": {
  "key": "lineage-spell-longstrider",
  "name": "大步奔行",
  "text": "你学会《大步奔行》法术。"
 },
 "lineage-spell-mending": {
  "key": "lineage-spell-mending",
  "name": "修复术",
  "text": "你知晓《修复术》戏法。"
 },
 "lineage-spell-minor-illusion": {
  "key": "lineage-spell-minor-illusion",
  "name": "次级幻象",
  "text": "你知晓《次级幻象》法术。"
 },
 "lineage-spell-misty-step": {
  "key": "lineage-spell-misty-step",
  "name": "迷踪步",
  "text": "你知晓《迷踪步》法术。"
 },
 "lineage-spell-pass-without-trace": {
  "key": "lineage-spell-pass-without-trace",
  "name": "行动无踪",
  "text": "你学会《行动无踪》法术。"
 },
 "lineage-spell-poison-spray": {
  "key": "lineage-spell-poison-spray",
  "name": "毒气喷溅",
  "text": "你知晓《毒气喷溅》法术。"
 },
 "lineage-spell-ray-of-enfeeblement": {
  "key": "lineage-spell-ray-of-enfeeblement",
  "name": "衰弱射线",
  "text": "你知晓《衰弱射线》法术。"
 },
 "lineage-spell-ray-of-sickness": {
  "key": "lineage-spell-ray-of-sickness",
  "name": "致病射线",
  "text": "你知晓《致病射线》法术。"
 },
 "luck": {
  "key": "luck",
  "name": "幸运",
  "text": "当你在 d20 检定的 d20 上掷出 1 时，你可以重掷这颗骰子，并且必须使用新的掷骰结果。"
 },
 "naturally-stealthy": {
  "key": "naturally-stealthy",
  "name": "天生隐匿",
  "text": "即使只有一个体型至少比你大一级的生物遮蔽着你，你也可以执行躲藏动作。"
 },
 "otherworldly-presence": {
  "key": "otherworldly-presence",
  "name": "异界存在",
  "text": "你知晓《奇术》戏法。当你通过这项特质施放它时，该法术使用与你的邪魔遗赠特质相同的施法属性。"
 },
 "powerful-build": {
  "key": "powerful-build",
  "name": "强健体格",
  "text": "你为结束被擒抱状态而进行的任何属性检定都具有优势。在计算你的负重能力时，你也被视为大一级体型。"
 },
 "relentless-endurance": {
  "key": "relentless-endurance",
  "name": "坚韧不屈",
  "text": "当你的生命值降到 0 但没有被直接杀死时，你可以改为降到 1 点生命值。一旦你使用了这项特质，在完成长休之前不能再次这样做。"
 },
 "resourceful": {
  "key": "resourceful",
  "name": "足智多谋",
  "text": "每当你完成长休时，你获得英雄激励。"
 },
 "skillful": {
  "key": "skillful",
  "name": "技艺娴熟",
  "text": "你获得一项你选择的技能的熟练。"
 },
 "stonecunning": {
  "key": "stonecunning",
  "name": "石工知识",
  "text": "你可以用一个附赠动作获得范围 60 尺的震颤感知，持续 10 分钟。你必须站在石质表面上或触碰着石质表面，才能使用这种震颤感知。石头可以是天然的，也可以是加工过的。\n你可以使用这个附赠动作的次数等于你的熟练加值，完成长休时恢复所有已消耗的次数。"
 },
 "trance": {
  "key": "trance",
  "name": "出神",
  "text": "你不需要睡眠，魔法也无法让你入睡。如果你把 4 小时用于一种出神般的冥想，并在此期间保持清醒的意识，你就可以用这 4 小时完成一次长休。"
 },
 "versatile": {
  "key": "versatile",
  "name": "多面手",
  "text": "你获得一项你选择的起源专长（见「专长」）。推荐选择「多才多艺」。"
 },
 "wood-elf-speed-increase": {
  "key": "wood-elf-speed-increase",
  "name": "木精灵：移动速度提升",
  "text": "你的移动速度增加到 35 尺。"
 }
};

export const BACKGROUNDS: BackgroundData[] = [
 {
  "key": "acolyte",
  "name": "侍僧",
  "text": "你曾在神殿中侍奉神祇或万神殿，跟随祭司学习教义、抄写经文、主持祭典。长年的虔诚修行，让你在祈祷中触碰到了些许神圣的力量。",
  "abilities": [
   "int",
   "wis",
   "cha"
  ],
  "feat": "magic-initiate",
  "featList": "cleric",
  "skills": [
   "insight",
   "religion"
  ],
  "tool": "calligraphers-supplies",
  "equipment": [
   {
    "label": "A",
    "items": [
     {
      "key": "calligraphers-supplies",
      "qty": 1
     },
     {
      "key": "book",
      "qty": 1
     },
     {
      "key": "amulet",
      "qty": 1
     },
     {
      "key": "parchment",
      "qty": 10
     },
     {
      "key": "robe",
      "qty": 1
     }
    ],
    "money": 800
   },
   {
    "label": "B",
    "items": [],
    "money": 5000
   }
  ],
  "equipmentText": "从下面两套里选一套：（A）书法用具、书（祷文）、圣徽、羊皮纸（10 张）、长袍和 8 金币；或（B）50 金币。"
 },
 {
  "key": "criminal",
  "name": "罪犯",
  "text": "你曾在城市的阴影里讨生活：扒窃钱包、撬开门锁，或是替地下帮派跑腿送信。你熟悉街巷间的门道，知道怎样避开巡逻的守卫，也认识不少游走在法律边缘的人。",
  "abilities": [
   "dex",
   "con",
   "int"
  ],
  "feat": "alert",
  "featList": null,
  "skills": [
   "sleight-of-hand",
   "stealth"
  ],
  "tool": "thieves-tools",
  "equipment": [
   {
    "label": "A",
    "items": [
     {
      "key": "dagger",
      "qty": 2
     },
     {
      "key": "thieves-tools",
      "qty": 1
     },
     {
      "key": "crowbar",
      "qty": 1
     },
     {
      "key": "pouch",
      "qty": 2
     },
     {
      "key": "clothes-travelers",
      "qty": 1
     }
    ],
    "money": 1600
   },
   {
    "label": "B",
    "items": [],
    "money": 5000
   }
  ],
  "equipmentText": "从下面两套里选一套：（A）2 把匕首、盗贼工具、撬棍、2 个小袋、旅行者服装和 16 金币；或（B）50 金币。"
 },
 {
  "key": "sage",
  "name": "贤者",
  "text": "你多年埋首于图书馆、学院和藏书楼之间，抄写典籍、整理古卷，追寻关于历史与魔法的知识。书页中的学问让你见多识广，也让你渴望走出书斋，亲眼验证那些记载。",
  "abilities": [
   "con",
   "int",
   "wis"
  ],
  "feat": "magic-initiate",
  "featList": "wizard",
  "skills": [
   "arcana",
   "history"
  ],
  "tool": "calligraphers-supplies",
  "equipment": [
   {
    "label": "A",
    "items": [
     {
      "key": "quarterstaff",
      "qty": 1
     },
     {
      "key": "calligraphers-supplies",
      "qty": 1
     },
     {
      "key": "book",
      "qty": 1
     },
     {
      "key": "parchment",
      "qty": 8
     },
     {
      "key": "robe",
      "qty": 1
     }
    ],
    "money": 800
   },
   {
    "label": "B",
    "items": [],
    "money": 5000
   }
  ],
  "equipmentText": "从下面两套里选一套：（A）长棍、书法用具、书（历史）、羊皮纸（8 张）、长袍和 8 金币；或（B）50 金币。"
 },
 {
  "key": "soldier",
  "name": "士兵",
  "text": "你很早就投身行伍，学会了操练兵器、列阵行军，以及如何在战场上活下来。你见识过战争的残酷，也懂得同袍之间以性命相托的情谊。",
  "abilities": [
   "str",
   "dex",
   "con"
  ],
  "feat": "savage-attacker",
  "featList": null,
  "skills": [
   "athletics",
   "intimidation"
  ],
  "tool": "dice",
  "equipment": [
   {
    "label": "A",
    "items": [
     {
      "key": "spear",
      "qty": 1
     },
     {
      "key": "shortbow",
      "qty": 1
     },
     {
      "key": "arrows",
      "qty": 20
     },
     {
      "key": "dice",
      "qty": 1
     },
     {
      "key": "healers-kit",
      "qty": 1
     },
     {
      "key": "quiver",
      "qty": 1
     },
     {
      "key": "clothes-travelers",
      "qty": 1
     }
    ],
    "money": 1400
   },
   {
    "label": "B",
    "items": [],
    "money": 5000
   }
  ],
  "equipmentText": "从下面两套里选一套：（A）矛、短弓、20 支箭、游戏套组（与熟练所选的是同一种）、医疗包、箭袋、旅行者服装和 14 金币；或（B）50 金币。"
 }
];

export const FEATS: FeatData[] = [
 {
  "key": "alert",
  "name": "警觉",
  "text": "你获得以下效益。\n先攻熟练。投先攻时，你可以把你的熟练加值加到这次掷骰上。\n先攻交换。你投完先攻后，可以立即与同一场战斗中一位自愿的盟友交换先攻。如果你或该盟友处于失能状态，就不能进行这种交换。",
  "type": "origin"
 },
 {
  "key": "magic-initiate",
  "name": "魔法学徒",
  "text": "你获得以下效益。\n两个戏法。你从牧师、德鲁伊或法师法术列表中学会两个你选择的戏法。你施放这个专长的法术时，以智力、感知或魅力为施法属性（在选择这个专长时决定）。\n1 环法术。从你为这个专长的戏法所选的同一份法术列表中，选择一道 1 环法术。你始终准备着该法术。你可以不消耗法术位施放它一次，并在完成长休时恢复以这种方式施放它的能力。你也可以使用你拥有的任何法术位来施放该法术。\n更换法术。每当你提升一级时，你可以把你为这个专长选择的一道法术，替换为所选法术列表中另一道同环阶的法术。\n可重复选取。你可以多次选取这个专长，但每次都必须选择不同的法术列表。",
  "type": "origin"
 },
 {
  "key": "savage-attacker",
  "name": "凶蛮攻击者",
  "text": "你经过训练，能打出格外凶狠的攻击。每回合一次，当你用武器命中一个目标时，你可以掷两次该武器的伤害骰，并选用其中任意一次的结果对目标结算。",
  "type": "origin"
 },
 {
  "key": "skilled",
  "name": "多才多艺",
  "text": "你获得三项熟练，可以是你选择的技能或工具的任意组合。\n可重复选取。你可以多次选取这个专长。",
  "type": "origin"
 },
 {
  "key": "ability-score-improvement",
  "name": "属性值提升",
  "text": "前提：4 级以上\n将你选择的一项属性值提高 2，或将你选择的两项属性值各提高 1。这个专长不能使属性值超过 20。\n可重复选取。你可以多次选取这个专长。",
  "type": "general"
 },
 {
  "key": "grappler",
  "name": "擒抱者",
  "text": "前提：4 级以上，力量或敏捷 13 以上\n你获得以下效益。\n属性值增加。你的力量或敏捷值提高 1，最高为 20。\n出拳擒拿。当你在自己的回合中作为攻击动作的一部分，用徒手打击命中一个生物时，你可以同时使用伤害和擒抱两种选项。每回合你只能使用这项效益一次。\n攻击优势。你对被你擒抱的生物进行的攻击检定具有优势。\n迅捷摔跤手。如果被你擒抱的生物体型与你相同或比你小，你移动它时不需要花费额外的移动力。",
  "type": "general"
 },
 {
  "key": "archery",
  "name": "箭术",
  "text": "前提：拥有战斗风格特性\n你用远程武器进行的攻击检定获得 +2 加值。",
  "type": "fighting-style"
 },
 {
  "key": "defense",
  "name": "防御",
  "text": "前提：拥有战斗风格特性\n当你穿着轻甲、中甲或重甲时，你的护甲等级获得 +1 加值。",
  "type": "fighting-style"
 },
 {
  "key": "great-weapon-fighting",
  "name": "巨武器战斗",
  "text": "前提：拥有战斗风格特性\n当你用双手持握的近战武器进行攻击并掷伤害时，你可以把伤害骰上掷出的任何 1 或 2 当作 3。该武器必须具有双手或多用属性，你才能获得这项效益。",
  "type": "fighting-style"
 },
 {
  "key": "two-weapon-fighting",
  "name": "双武器战斗",
  "text": "前提：拥有战斗风格特性\n当你因使用具有轻型属性的武器而进行一次额外攻击时，如果你还没有把属性调整值加到这次攻击的伤害上，你可以把它加上。",
  "type": "fighting-style"
 },
 {
  "key": "boon-of-combat-prowess",
  "name": "战斗威能恩赐",
  "text": "前提：19 级以上\n你获得以下效益。\n属性值增加。你选择的一项属性值提高 1，最高为 30。\n无双准度。当你的攻击检定未命中时，你可以改为命中。一旦你使用了这项效益，在你的下个回合开始之前不能再次使用。",
  "type": "epic"
 },
 {
  "key": "boon-of-dimensional-travel",
  "name": "次元旅行恩赐",
  "text": "前提：19 级以上\n你获得以下效益。\n属性值增加。你选择的一项属性值提高 1，最高为 30。\n闪烁步伐。在你执行攻击动作或魔法动作之后，你可以立即传送至多 30 尺，到达一处你能看见的未被占据的空间。",
  "type": "epic"
 },
 {
  "key": "boon-of-fate",
  "name": "命运恩赐",
  "text": "前提：19 级以上\n你获得以下效益。\n属性值增加。你选择的一项属性值提高 1，最高为 30。\n改善命运。当你或你 60 尺范围内的另一个生物在 d20 检定中成功或失败时，你可以掷 2d4，并把掷出的总数作为加值或减值作用于那次 d20 掷骰。一旦你使用了这项效益，在你投先攻或完成短休或长休之前，不能再次使用。",
  "type": "epic"
 },
 {
  "key": "boon-of-irresistible-offense",
  "name": "无可抵御恩赐",
  "text": "前提：19 级以上\n你获得以下效益。\n属性值增加。你选择的一项属性值提高 1，最高为 30。\n突破防御。你造成的钝击、穿刺和挥砍伤害总是无视抗性。\n压倒性打击。当你在攻击检定的 d20 上掷出 20 时，你可以对目标造成额外伤害，数值等于被这个专长提高的那项属性值。这项额外伤害的类型与该攻击的伤害类型相同。",
  "type": "epic"
 },
 {
  "key": "boon-of-spell-recall",
  "name": "法术回想恩赐",
  "text": "前提：19 级以上，拥有施法特性\n你获得以下效益。\n属性值增加。你选择的一项属性值提高 1，最高为 30。\n免费施法。每当你用 1～4 环的法术位施放法术时，掷 1d4。如果掷出的数字与该法术位的环阶相同，该法术位就不会被消耗。",
  "type": "epic"
 },
 {
  "key": "boon-of-the-night-spirit",
  "name": "夜之灵恩赐",
  "text": "前提：19 级以上\n你获得以下效益。\n属性值增加。你选择的一项属性值提高 1，最高为 30。\n融入暗影。当你身处微光或黑暗中时，你可以用一个附赠动作让自己陷入隐形状态。在你执行一个动作、附赠动作或反应之后，这个状态会立即在你身上结束。\n暗影之躯。当你身处微光或黑暗中时，你对除心灵和光耀以外的所有伤害具有抗性。",
  "type": "epic"
 },
 {
  "key": "boon-of-truesight",
  "name": "真实视觉恩赐",
  "text": "前提：19 级以上\n你获得以下效益。\n属性值增加。你选择的一项属性值提高 1，最高为 30。\n真实视觉。你拥有范围 60 尺的真实视觉。",
  "type": "epic"
 }
];

export const CONDITION_TEXT: FeatureText[] = [
 {
  "key": "blinded",
  "name": "目盲",
  "text": "处于目盲状态时，你会受到以下效果影响。\n无法视物。你无法看见东西，并且任何需要视觉的属性检定都自动失败。\n攻击受影响。对你的攻击检定具有优势，你的攻击检定具有劣势。"
 },
 {
  "key": "charmed",
  "name": "魅惑",
  "text": "处于魅惑状态时，你会受到以下效果影响。\n不能伤害魅惑者。你不能攻击魅惑者，也不能以具有伤害性的能力或魔法效果指定魅惑者为目标。\n社交优势。魅惑者为与你进行社交互动而进行的属性检定具有优势。"
 },
 {
  "key": "deafened",
  "name": "耳聋",
  "text": "处于耳聋状态时，你会受到以下效果影响。\n无法听见。你无法听见声音，并且任何需要听觉的属性检定都自动失败。"
 },
 {
  "key": "exhaustion",
  "name": "力竭",
  "text": "处于力竭状态时，你会受到以下效果影响。\n力竭等级。这个状态可以累积。你每获得一次这个状态，就获得 1 级力竭。如果你的力竭等级达到 6，你就会死亡。\nd20 检定受影响。你进行 d20 检定时，掷骰结果减去你力竭等级的 2 倍。\n速度降低。你的速度降低，降低的尺数等于你力竭等级的 5 倍。\n移除力竭等级。完成一次长休可以移除你的 1 级力竭。当你的力竭等级降到 0 时，这个状态结束。"
 },
 {
  "key": "frightened",
  "name": "恐慌",
  "text": "处于恐慌状态时，你会受到以下效果影响。\n属性检定和攻击受影响。只要恐惧来源在你的视线范围内，你的属性检定和攻击检定就具有劣势。\n无法接近。你不能自愿向恐惧来源移动得更近。"
 },
 {
  "key": "grappled",
  "name": "被擒抱",
  "text": "处于被擒抱状态时，你会受到以下效果影响。\n速度为 0。你的速度为 0，且无法增加。\n攻击受影响。你对擒抱者以外的任何目标进行的攻击检定具有劣势。\n可被拖动。擒抱者移动时可以拖着或带着你走，但每移动 1 尺都要额外花费 1 尺移动力，除非你是微型生物，或者体型比擒抱者小两级或更多。"
 },
 {
  "key": "incapacitated",
  "name": "失能",
  "text": "处于失能状态时，你会受到以下效果影响。\n无法行动。你不能执行任何动作、附赠动作或反应。\n专注中断。你的专注被打断。\n无法说话。你不能说话。\n猝不及防。如果你在投先攻时处于失能状态，你的先攻掷骰具有劣势。"
 },
 {
  "key": "invisible",
  "name": "隐形",
  "text": "处于隐形状态时，你会受到以下效果影响。\n出其不意。如果你在投先攻时处于隐形状态，你的先攻掷骰具有优势。\n隐蔽。你不受任何需要看见目标的效果影响，除非该效果的创造者能以某种方式看见你。你穿戴或携带的任何装备也同样被隐蔽。\n攻击受影响。对你的攻击检定具有劣势，你的攻击检定具有优势。如果某个生物能以某种方式看见你，你对该生物就得不到这项好处。"
 },
 {
  "key": "paralyzed",
  "name": "麻痹",
  "text": "处于麻痹状态时，你会受到以下效果影响。\n失能。你处于失能状态。\n速度为 0。你的速度为 0，且无法增加。\n豁免受影响。你的力量豁免和敏捷豁免自动失败。\n攻击受影响。对你的攻击检定具有优势。\n自动重击。如果攻击者在你 5 尺范围内，命中你的任何攻击检定都是重击。"
 },
 {
  "key": "petrified",
  "name": "石化",
  "text": "处于石化状态时，你会受到以下效果影响。\n化为无生命物质。你连同你穿戴和携带的所有非魔法物品一起，变成一种坚固的无生命物质（通常是石头）。你的重量变为原来的十倍，并且你停止衰老。\n失能。你处于失能状态。\n速度为 0。你的速度为 0，且无法增加。\n攻击受影响。对你的攻击检定具有优势。\n豁免受影响。你的力量豁免和敏捷豁免自动失败。\n抵抗伤害。你对所有伤害具有抗性。\n免疫中毒。你免疫中毒状态。"
 },
 {
  "key": "poisoned",
  "name": "中毒",
  "text": "处于中毒状态时，你会受到以下效果影响。\n属性检定和攻击受影响。你的攻击检定和属性检定具有劣势。"
 },
 {
  "key": "prone",
  "name": "倒地",
  "text": "处于倒地状态时，你会受到以下效果影响。\n移动受限。你唯一的移动方式是爬行，或是花费等于你速度一半（向下取整）的移动力站起身来，从而结束这个状态。如果你的速度为 0，你就无法站起来。\n攻击受影响。你的攻击检定具有劣势。如果攻击者在你 5 尺范围内，对你的攻击检定具有优势；否则，该攻击检定具有劣势。"
 },
 {
  "key": "restrained",
  "name": "束缚",
  "text": "处于束缚状态时，你会受到以下效果影响。\n速度为 0。你的速度为 0，且无法增加。\n攻击受影响。对你的攻击检定具有优势，你的攻击检定具有劣势。\n豁免受影响。你的敏捷豁免具有劣势。"
 },
 {
  "key": "stunned",
  "name": "震慑",
  "text": "处于震慑状态时，你会受到以下效果影响。\n失能。你处于失能状态。\n豁免受影响。你的力量豁免和敏捷豁免自动失败。\n攻击受影响。对你的攻击检定具有优势。"
 },
 {
  "key": "unconscious",
  "name": "昏迷",
  "text": "处于昏迷状态时，你会受到以下效果影响。\n不省人事。你处于失能状态和倒地状态，并且掉落你手中拿着的任何东西。这个状态结束时，你仍然处于倒地状态。\n速度为 0。你的速度为 0，且无法增加。\n攻击受影响。对你的攻击检定具有优势。\n豁免受影响。你的力量豁免和敏捷豁免自动失败。\n自动重击。如果攻击者在你 5 尺范围内，命中你的任何攻击检定都是重击。\n浑然不觉。你察觉不到周围的情况。"
 }
];

export const SKILL_TEXT: FeatureText[] = [
 {
  "key": "acrobatics",
  "name": "体操",
  "text": "在棘手的情况下保持站稳，或是完成杂技动作。"
 },
 {
  "key": "animal-handling",
  "name": "驯兽",
  "text": "安抚或训练动物，或是让动物按某种方式行事。"
 },
 {
  "key": "arcana",
  "name": "奥秘",
  "text": "回忆有关法术、魔法物品和存在位面的知识。"
 },
 {
  "key": "athletics",
  "name": "运动",
  "text": "跳得比平常更远、在湍急的水中保持漂浮，或是破坏某样东西。"
 },
 {
  "key": "deception",
  "name": "欺瞒",
  "text": "说出令人信服的谎言，或是让伪装显得令人信服。"
 },
 {
  "key": "history",
  "name": "历史",
  "text": "回忆有关历史事件、人物、国家和文化的知识。"
 },
 {
  "key": "insight",
  "name": "洞悉",
  "text": "看出一个人的情绪和意图。"
 },
 {
  "key": "intimidation",
  "name": "威吓",
  "text": "震慑或威胁某人，让对方照你的意思做。"
 },
 {
  "key": "investigation",
  "name": "调查",
  "text": "在书籍中找出冷僻的信息，或是推断出某样东西的运作原理。"
 },
 {
  "key": "medicine",
  "name": "医药",
  "text": "诊断疾病，或是判断刚死去的人的死因。"
 },
 {
  "key": "nature",
  "name": "自然",
  "text": "回忆有关地形、植物、动物和天气的知识。"
 },
 {
  "key": "perception",
  "name": "察觉",
  "text": "综合运用各种感官，注意到容易被忽略的事物。"
 },
 {
  "key": "performance",
  "name": "表演",
  "text": "演戏、讲故事、演奏音乐或跳舞。"
 },
 {
  "key": "persuasion",
  "name": "游说",
  "text": "以诚恳而得体的方式说服某人相信某事。"
 },
 {
  "key": "religion",
  "name": "宗教",
  "text": "回忆有关神祇、宗教仪式和圣徽的知识。"
 },
 {
  "key": "sleight-of-hand",
  "name": "巧手",
  "text": "扒窃钱包、藏起拿在手上的物品，或是表演手上把戏。"
 },
 {
  "key": "stealth",
  "name": "隐匿",
  "text": "悄悄移动、藏身于物体之后，避开别人的注意。"
 },
 {
  "key": "survival",
  "name": "求生",
  "text": "追踪足迹、搜寻食物、找到路径，或是避开自然危险。"
 }
];
