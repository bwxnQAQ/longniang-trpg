// 自动生成的文件（SRD 5.2.1 数据 + 本站的中文译文），不要手改。
import type { ArmorData, FeatureText, GearData, MagicItemData, WeaponData } from '../../../shared/5e/types';

export const WEAPONS: WeaponData[] = [
 {
  "key": "battleaxe",
  "name": "战斧",
  "category": "martial",
  "ranged": false,
  "damage": "1d8",
  "damageType": "slashing",
  "versatile": "1d10",
  "properties": [
   "versatile"
  ],
  "range": null,
  "mastery": "topple",
  "cost": 1000,
  "weight": 4
 },
 {
  "key": "blowgun",
  "name": "吹箭筒",
  "category": "martial",
  "ranged": true,
  "damage": "1",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "ammunition",
   "loading"
  ],
  "range": [
   25,
   100
  ],
  "mastery": "vex",
  "cost": 1000,
  "weight": 1
 },
 {
  "key": "club",
  "name": "短棒",
  "category": "simple",
  "ranged": false,
  "damage": "1d4",
  "damageType": "bludgeoning",
  "versatile": null,
  "properties": [
   "light"
  ],
  "range": null,
  "mastery": "slow",
  "cost": 10,
  "weight": 2
 },
 {
  "key": "dagger",
  "name": "匕首",
  "category": "simple",
  "ranged": false,
  "damage": "1d4",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "finesse",
   "light",
   "thrown"
  ],
  "range": [
   20,
   60
  ],
  "mastery": "nick",
  "cost": 200,
  "weight": 1
 },
 {
  "key": "dart",
  "name": "飞镖",
  "category": "simple",
  "ranged": true,
  "damage": "1d4",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "finesse",
   "thrown"
  ],
  "range": [
   20,
   60
  ],
  "mastery": "vex",
  "cost": 5,
  "weight": 0.25
 },
 {
  "key": "flail",
  "name": "链枷",
  "category": "martial",
  "ranged": false,
  "damage": "1d8",
  "damageType": "bludgeoning",
  "versatile": null,
  "properties": [],
  "range": null,
  "mastery": "sap",
  "cost": 1000,
  "weight": 2
 },
 {
  "key": "glaive",
  "name": "长柄刀",
  "category": "martial",
  "ranged": false,
  "damage": "1d10",
  "damageType": "slashing",
  "versatile": null,
  "properties": [
   "heavy",
   "reach",
   "two-handed"
  ],
  "range": null,
  "mastery": "graze",
  "cost": 2000,
  "weight": 6
 },
 {
  "key": "greataxe",
  "name": "巨斧",
  "category": "martial",
  "ranged": false,
  "damage": "1d12",
  "damageType": "slashing",
  "versatile": null,
  "properties": [
   "heavy",
   "two-handed"
  ],
  "range": null,
  "mastery": "cleave",
  "cost": 3000,
  "weight": 7
 },
 {
  "key": "greatclub",
  "name": "巨棒",
  "category": "simple",
  "ranged": false,
  "damage": "1d8",
  "damageType": "bludgeoning",
  "versatile": null,
  "properties": [
   "two-handed"
  ],
  "range": null,
  "mastery": "push",
  "cost": 20,
  "weight": 10
 },
 {
  "key": "greatsword",
  "name": "巨剑",
  "category": "martial",
  "ranged": false,
  "damage": "2d6",
  "damageType": "slashing",
  "versatile": null,
  "properties": [
   "heavy",
   "two-handed"
  ],
  "range": null,
  "mastery": "graze",
  "cost": 5000,
  "weight": 6
 },
 {
  "key": "halberd",
  "name": "长戟",
  "category": "martial",
  "ranged": false,
  "damage": "1d10",
  "damageType": "slashing",
  "versatile": null,
  "properties": [
   "heavy",
   "reach",
   "two-handed"
  ],
  "range": null,
  "mastery": "cleave",
  "cost": 2000,
  "weight": 6
 },
 {
  "key": "hand-crossbow",
  "name": "手弩",
  "category": "martial",
  "ranged": true,
  "damage": "1d6",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "ammunition",
   "light",
   "loading"
  ],
  "range": [
   30,
   120
  ],
  "mastery": "vex",
  "cost": 7500,
  "weight": 3
 },
 {
  "key": "handaxe",
  "name": "手斧",
  "category": "simple",
  "ranged": false,
  "damage": "1d6",
  "damageType": "slashing",
  "versatile": null,
  "properties": [
   "light",
   "thrown"
  ],
  "range": [
   20,
   60
  ],
  "mastery": "vex",
  "cost": 500,
  "weight": 2
 },
 {
  "key": "heavy-crossbow",
  "name": "重弩",
  "category": "martial",
  "ranged": true,
  "damage": "1d10",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "ammunition",
   "heavy",
   "loading",
   "two-handed"
  ],
  "range": [
   100,
   400
  ],
  "mastery": "push",
  "cost": 5000,
  "weight": 18
 },
 {
  "key": "javelin",
  "name": "标枪",
  "category": "simple",
  "ranged": false,
  "damage": "1d6",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "thrown"
  ],
  "range": [
   30,
   120
  ],
  "mastery": "slow",
  "cost": 50,
  "weight": 2
 },
 {
  "key": "lance",
  "name": "骑枪",
  "category": "martial",
  "ranged": false,
  "damage": "1d10",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "heavy",
   "reach",
   "two-handed"
  ],
  "range": null,
  "mastery": "topple",
  "cost": 1000,
  "weight": 6
 },
 {
  "key": "light-crossbow",
  "name": "轻弩",
  "category": "simple",
  "ranged": true,
  "damage": "1d8",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "ammunition",
   "loading",
   "two-handed"
  ],
  "range": [
   80,
   320
  ],
  "mastery": "slow",
  "cost": 2500,
  "weight": 5
 },
 {
  "key": "light-hammer",
  "name": "轻锤",
  "category": "simple",
  "ranged": false,
  "damage": "1d4",
  "damageType": "bludgeoning",
  "versatile": null,
  "properties": [
   "light",
   "thrown"
  ],
  "range": [
   20,
   60
  ],
  "mastery": "nick",
  "cost": 200,
  "weight": 2
 },
 {
  "key": "longbow",
  "name": "长弓",
  "category": "martial",
  "ranged": true,
  "damage": "1d8",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "ammunition",
   "heavy",
   "two-handed"
  ],
  "range": [
   150,
   600
  ],
  "mastery": "slow",
  "cost": 5000,
  "weight": 2
 },
 {
  "key": "longsword",
  "name": "长剑",
  "category": "martial",
  "ranged": false,
  "damage": "1d8",
  "damageType": "slashing",
  "versatile": "1d10",
  "properties": [
   "versatile"
  ],
  "range": null,
  "mastery": "sap",
  "cost": 1500,
  "weight": 3
 },
 {
  "key": "mace",
  "name": "硬头锤",
  "category": "simple",
  "ranged": false,
  "damage": "1d6",
  "damageType": "bludgeoning",
  "versatile": null,
  "properties": [],
  "range": null,
  "mastery": "sap",
  "cost": 500,
  "weight": 4
 },
 {
  "key": "maul",
  "name": "巨锤",
  "category": "martial",
  "ranged": false,
  "damage": "2d6",
  "damageType": "bludgeoning",
  "versatile": null,
  "properties": [
   "heavy",
   "two-handed"
  ],
  "range": null,
  "mastery": "topple",
  "cost": 1000,
  "weight": 10
 },
 {
  "key": "morningstar",
  "name": "钉头锤",
  "category": "martial",
  "ranged": false,
  "damage": "1d8",
  "damageType": "piercing",
  "versatile": null,
  "properties": [],
  "range": null,
  "mastery": "sap",
  "cost": 1500,
  "weight": 4
 },
 {
  "key": "musket",
  "name": "火枪",
  "category": "martial",
  "ranged": true,
  "damage": "1d12",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "ammunition",
   "loading",
   "two-handed"
  ],
  "range": [
   40,
   120
  ],
  "mastery": "slow",
  "cost": 50000,
  "weight": 10
 },
 {
  "key": "pike",
  "name": "长矛",
  "category": "martial",
  "ranged": false,
  "damage": "1d10",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "heavy",
   "reach",
   "two-handed"
  ],
  "range": null,
  "mastery": "push",
  "cost": 500,
  "weight": 18
 },
 {
  "key": "pistol",
  "name": "手枪",
  "category": "martial",
  "ranged": true,
  "damage": "1d10",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "ammunition",
   "loading"
  ],
  "range": [
   30,
   90
  ],
  "mastery": "vex",
  "cost": 25000,
  "weight": 3
 },
 {
  "key": "quarterstaff",
  "name": "长棍",
  "category": "simple",
  "ranged": false,
  "damage": "1d6",
  "damageType": "bludgeoning",
  "versatile": "1d8",
  "properties": [
   "versatile"
  ],
  "range": null,
  "mastery": "topple",
  "cost": 20,
  "weight": 4
 },
 {
  "key": "rapier",
  "name": "刺剑",
  "category": "martial",
  "ranged": false,
  "damage": "1d8",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "finesse"
  ],
  "range": null,
  "mastery": "vex",
  "cost": 2500,
  "weight": 2
 },
 {
  "key": "scimitar",
  "name": "弯刀",
  "category": "martial",
  "ranged": false,
  "damage": "1d6",
  "damageType": "slashing",
  "versatile": null,
  "properties": [
   "finesse",
   "light"
  ],
  "range": null,
  "mastery": "nick",
  "cost": 2500,
  "weight": 3
 },
 {
  "key": "shortbow",
  "name": "短弓",
  "category": "simple",
  "ranged": true,
  "damage": "1d6",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "ammunition",
   "two-handed"
  ],
  "range": [
   80,
   320
  ],
  "mastery": "vex",
  "cost": 2500,
  "weight": 2
 },
 {
  "key": "shortsword",
  "name": "短剑",
  "category": "martial",
  "ranged": false,
  "damage": "1d6",
  "damageType": "piercing",
  "versatile": null,
  "properties": [
   "finesse",
   "light"
  ],
  "range": null,
  "mastery": "vex",
  "cost": 1000,
  "weight": 2
 },
 {
  "key": "sickle",
  "name": "镰刀",
  "category": "simple",
  "ranged": false,
  "damage": "1d4",
  "damageType": "slashing",
  "versatile": null,
  "properties": [
   "light"
  ],
  "range": null,
  "mastery": "nick",
  "cost": 100,
  "weight": 2
 },
 {
  "key": "sling",
  "name": "投石索",
  "category": "simple",
  "ranged": true,
  "damage": "1d4",
  "damageType": "bludgeoning",
  "versatile": null,
  "properties": [
   "ammunition"
  ],
  "range": [
   30,
   120
  ],
  "mastery": "slow",
  "cost": 10,
  "weight": 0
 },
 {
  "key": "spear",
  "name": "矛",
  "category": "simple",
  "ranged": false,
  "damage": "1d6",
  "damageType": "piercing",
  "versatile": "1d8",
  "properties": [
   "thrown",
   "versatile"
  ],
  "range": [
   20,
   60
  ],
  "mastery": "sap",
  "cost": 100,
  "weight": 3
 },
 {
  "key": "trident",
  "name": "三叉戟",
  "category": "martial",
  "ranged": false,
  "damage": "1d8",
  "damageType": "piercing",
  "versatile": "1d10",
  "properties": [
   "thrown",
   "versatile"
  ],
  "range": [
   20,
   60
  ],
  "mastery": "topple",
  "cost": 500,
  "weight": 4
 },
 {
  "key": "warhammer",
  "name": "战锤",
  "category": "martial",
  "ranged": false,
  "damage": "1d8",
  "damageType": "bludgeoning",
  "versatile": "1d10",
  "properties": [
   "versatile"
  ],
  "range": null,
  "mastery": "push",
  "cost": 1500,
  "weight": 5
 },
 {
  "key": "war-pick",
  "name": "战镐",
  "category": "martial",
  "ranged": false,
  "damage": "1d8",
  "damageType": "piercing",
  "versatile": "1d10",
  "properties": [
   "versatile"
  ],
  "range": null,
  "mastery": "sap",
  "cost": 500,
  "weight": 2
 },
 {
  "key": "whip",
  "name": "鞭子",
  "category": "martial",
  "ranged": false,
  "damage": "1d4",
  "damageType": "slashing",
  "versatile": null,
  "properties": [
   "finesse",
   "reach"
  ],
  "range": null,
  "mastery": "slow",
  "cost": 200,
  "weight": 3
 }
];

export const ARMOR: ArmorData[] = [
 {
  "key": "breastplate",
  "name": "胸甲",
  "kind": "medium",
  "ac": 14,
  "dexMax": 2,
  "strMin": null,
  "stealthDisadvantage": false,
  "cost": 40000,
  "weight": 20
 },
 {
  "key": "chain-mail",
  "name": "链甲",
  "kind": "heavy",
  "ac": 16,
  "dexMax": 0,
  "strMin": 13,
  "stealthDisadvantage": true,
  "cost": 7500,
  "weight": 55
 },
 {
  "key": "chain-shirt",
  "name": "链甲衫",
  "kind": "medium",
  "ac": 13,
  "dexMax": 2,
  "strMin": null,
  "stealthDisadvantage": false,
  "cost": 5000,
  "weight": 20
 },
 {
  "key": "half-plate-armor",
  "name": "半身板甲",
  "kind": "medium",
  "ac": 15,
  "dexMax": 2,
  "strMin": null,
  "stealthDisadvantage": true,
  "cost": 75000,
  "weight": 40
 },
 {
  "key": "hide-armor",
  "name": "兽皮甲",
  "kind": "medium",
  "ac": 12,
  "dexMax": 2,
  "strMin": null,
  "stealthDisadvantage": false,
  "cost": 1000,
  "weight": 12
 },
 {
  "key": "leather-armor",
  "name": "皮甲",
  "kind": "light",
  "ac": 11,
  "dexMax": null,
  "strMin": null,
  "stealthDisadvantage": false,
  "cost": 1000,
  "weight": 10
 },
 {
  "key": "padded-armor",
  "name": "布甲",
  "kind": "light",
  "ac": 11,
  "dexMax": null,
  "strMin": null,
  "stealthDisadvantage": true,
  "cost": 500,
  "weight": 8
 },
 {
  "key": "plate-armor",
  "name": "全身板甲",
  "kind": "heavy",
  "ac": 18,
  "dexMax": 0,
  "strMin": 15,
  "stealthDisadvantage": true,
  "cost": 150000,
  "weight": 65
 },
 {
  "key": "ring-mail",
  "name": "环甲",
  "kind": "heavy",
  "ac": 14,
  "dexMax": 0,
  "strMin": null,
  "stealthDisadvantage": true,
  "cost": 3000,
  "weight": 40
 },
 {
  "key": "scale-mail",
  "name": "鳞甲",
  "kind": "medium",
  "ac": 14,
  "dexMax": 2,
  "strMin": null,
  "stealthDisadvantage": true,
  "cost": 5000,
  "weight": 45
 },
 {
  "key": "shield",
  "name": "盾牌",
  "kind": "shield",
  "ac": 2,
  "dexMax": 0,
  "strMin": null,
  "stealthDisadvantage": false,
  "cost": 1000,
  "weight": 6
 },
 {
  "key": "splint-armor",
  "name": "板条甲",
  "kind": "heavy",
  "ac": 17,
  "dexMax": 0,
  "strMin": 15,
  "stealthDisadvantage": true,
  "cost": 20000,
  "weight": 60
 },
 {
  "key": "studded-leather-armor",
  "name": "镶钉皮甲",
  "kind": "light",
  "ac": 12,
  "dexMax": null,
  "strMin": null,
  "stealthDisadvantage": false,
  "cost": 4500,
  "weight": 13
 }
];

export const GEAR: GearData[] = [
 {
  "key": "acid",
  "name": "酸液",
  "kind": "gear",
  "cost": 2500,
  "weight": 1,
  "text": "当你执行攻击动作时，你可以把其中一次攻击替换为投掷一瓶酸液。以你 20 尺范围内一个你能看见的生物或物体为目标。目标必须在一次敏捷豁免（DC 8 + 你的敏捷调整值 + 你的熟练加值）中成功，否则受到 2d6 强酸伤害。",
  "contents": []
 },
 {
  "key": "alchemists-fire",
  "name": "炼金火",
  "kind": "gear",
  "cost": 5000,
  "weight": 1,
  "text": "当你执行攻击动作时，你可以把其中一次攻击替换为投掷一瓶炼金火。以你 20 尺范围内一个你能看见的生物或物体为目标。目标必须在一次敏捷豁免（DC 8 + 你的敏捷调整值 + 你的熟练加值）中成功，否则受到 1d4 火焰伤害并开始燃烧（见「规则词汇表」）。",
  "contents": []
 },
 {
  "key": "alchemists-supplies",
  "name": "炼金用具",
  "kind": "tool",
  "cost": 5000,
  "weight": 8,
  "text": "",
  "contents": []
 },
 {
  "key": "amulet",
  "name": "护符",
  "kind": "focus",
  "cost": 500,
  "weight": 1,
  "text": "圣徽采用「圣徽」表中的某种形制，镶有宝石或绘有图案，用来引导神圣魔法。牧师或圣武士可以把圣徽当作施法法器使用。\n该表注明了每种圣徽需要手持、佩戴，还是饰于布料（比如罩袍或旗帜）或盾牌上。",
  "contents": []
 },
 {
  "key": "antitoxin",
  "name": "抗毒剂",
  "kind": "gear",
  "cost": 5000,
  "weight": 0,
  "text": "你可以用一个附赠动作喝下一瓶抗毒剂，在 1 小时内，你为避免或结束中毒状态而进行的豁免检定具有优势。",
  "contents": []
 },
 {
  "key": "arrows",
  "name": "箭",
  "kind": "ammunition",
  "cost": 100,
  "weight": 1,
  "text": "",
  "contents": []
 },
 {
  "key": "backpack",
  "name": "背包",
  "kind": "gear",
  "cost": 200,
  "weight": 5,
  "text": "背包最多可以在 1 立方尺的空间内装下 30 磅的东西。它也可以当作鞍囊使用。",
  "contents": []
 },
 {
  "key": "bagpipes",
  "name": "风笛",
  "kind": "tool",
  "cost": 3000,
  "weight": 6,
  "text": "",
  "contents": []
 },
 {
  "key": "ball-bearings",
  "name": "滚珠",
  "kind": "gear",
  "cost": 100,
  "weight": 2,
  "text": "你可以用一个使用动作把滚珠从袋子里撒出来。滚珠会散开，覆盖你 10 尺范围内一块平坦的 10 尺见方区域。一个生物在一个回合中第一次进入该区域时，必须在一次 DC 10 的敏捷豁免中成功，否则陷入倒地状态。回收滚珠需要 10 分钟。",
  "contents": []
 },
 {
  "key": "barrel",
  "name": "木桶",
  "kind": "gear",
  "cost": 200,
  "weight": 70,
  "text": "木桶最多可以装 40 加仑的液体，或 4 立方尺的干货。",
  "contents": []
 },
 {
  "key": "basket",
  "name": "篮子",
  "kind": "gear",
  "cost": 40,
  "weight": 2,
  "text": "篮子最多可以在 2 立方尺的空间内装下 40 磅的东西。",
  "contents": []
 },
 {
  "key": "bedroll",
  "name": "铺盖",
  "kind": "gear",
  "cost": 100,
  "weight": 7,
  "text": "一副铺盖可供一个小型或中型生物睡觉。睡在铺盖里时，你对抗极寒的豁免检定自动成功（见「游戏工具箱」）。",
  "contents": []
 },
 {
  "key": "bell",
  "name": "铃铛",
  "kind": "gear",
  "cost": 100,
  "weight": 0,
  "text": "以一个使用动作摇响铃铛时，它发出的声音在 60 尺外都能听到。",
  "contents": []
 },
 {
  "key": "blanket",
  "name": "毯子",
  "kind": "gear",
  "cost": 50,
  "weight": 3,
  "text": "裹着毯子时，你对抗极寒的豁免检定具有优势（见「游戏工具箱」）。",
  "contents": []
 },
 {
  "key": "block-and-tackle",
  "name": "滑轮组",
  "kind": "gear",
  "cost": 100,
  "weight": 5,
  "text": "滑轮组能让你吊起相当于你平常能举起重量四倍的重物。",
  "contents": []
 },
 {
  "key": "book",
  "name": "书",
  "kind": "gear",
  "cost": 2500,
  "weight": 5,
  "text": "书的内容可能是虚构的，也可能是纪实的。如果你查阅一本内容准确的纪实书籍来了解它所写的主题，你就该主题进行的智力（奥秘、历史、自然或宗教）检定获得 +5 加值。",
  "contents": []
 },
 {
  "key": "bolts",
  "name": "弩矢",
  "kind": "ammunition",
  "cost": 100,
  "weight": 1.5,
  "text": "",
  "contents": []
 },
 {
  "key": "bottle-glass",
  "name": "玻璃瓶",
  "kind": "gear",
  "cost": 200,
  "weight": 2,
  "text": "玻璃瓶最多可以装 1.5 品脱。",
  "contents": []
 },
 {
  "key": "brewers-supplies",
  "name": "酿酒用具",
  "kind": "tool",
  "cost": 2000,
  "weight": 9,
  "text": "",
  "contents": []
 },
 {
  "key": "bucket",
  "name": "水桶",
  "kind": "gear",
  "cost": 5,
  "weight": 2,
  "text": "水桶最多可以装半立方尺的东西。",
  "contents": []
 },
 {
  "key": "bullets-firearm",
  "name": "铅弹（火器）",
  "kind": "ammunition",
  "cost": 300,
  "weight": 2,
  "text": "",
  "contents": []
 },
 {
  "key": "bullets-sling",
  "name": "弹丸（投石索）",
  "kind": "ammunition",
  "cost": 4,
  "weight": 1.5,
  "text": "",
  "contents": []
 },
 {
  "key": "burglars-pack",
  "name": "窃贼套组",
  "kind": "pack",
  "cost": 1600,
  "weight": 42,
  "text": "窃贼套组包含以下物品：背包、滚珠、铃铛、10 根蜡烛、撬棍、带罩提灯、7 瓶油、5 天份口粮、绳子、火绒盒和水袋。",
  "contents": [
   {
    "key": "backpack",
    "qty": 1
   },
   {
    "key": "ball-bearings",
    "qty": 1
   },
   {
    "key": "bell",
    "qty": 1
   },
   {
    "key": "candle",
    "qty": 10
   },
   {
    "key": "crowbar",
    "qty": 1
   },
   {
    "key": "lantern-hooded",
    "qty": 1
   },
   {
    "key": "oil",
    "qty": 7
   },
   {
    "key": "rations",
    "qty": 5
   },
   {
    "key": "rope",
    "qty": 1
   },
   {
    "key": "tinderbox",
    "qty": 1
   },
   {
    "key": "waterskin",
    "qty": 1
   }
  ]
 },
 {
  "key": "calligraphers-supplies",
  "name": "书法用具",
  "kind": "tool",
  "cost": 1000,
  "weight": 5,
  "text": "",
  "contents": []
 },
 {
  "key": "caltrops",
  "name": "铁蒺藜",
  "kind": "gear",
  "cost": 100,
  "weight": 2,
  "text": "你可以用一个使用动作把铁蒺藜从袋子里撒出来，覆盖你 5 尺范围内一块 5 尺见方的区域。一个生物在一个回合中第一次进入该区域时，必须在一次 DC 15 的敏捷豁免中成功，否则受到 1 点穿刺伤害，并且速度降为 0，直到它的下个回合开始。回收铁蒺藜需要 10 分钟。",
  "contents": []
 },
 {
  "key": "candle",
  "name": "蜡烛",
  "kind": "gear",
  "cost": 1,
  "weight": 0,
  "text": "点燃的蜡烛在 1 小时内发出半径 5 尺的明亮光照，并在此之外再发出 5 尺的微光。",
  "contents": []
 },
 {
  "key": "carpenters-tools",
  "name": "木匠工具",
  "kind": "tool",
  "cost": 800,
  "weight": 6,
  "text": "",
  "contents": []
 },
 {
  "key": "cartographer-tools",
  "name": "制图工具",
  "kind": "tool",
  "cost": 1500,
  "weight": 6,
  "text": "",
  "contents": []
 },
 {
  "key": "case-crossbow-bolt",
  "name": "弩矢盒",
  "kind": "gear",
  "cost": 100,
  "weight": 1,
  "text": "弩矢盒最多可以装 20 支弩矢。",
  "contents": []
 },
 {
  "key": "case-map-or-scroll",
  "name": "地图或卷轴筒",
  "kind": "gear",
  "cost": 100,
  "weight": 1,
  "text": "地图或卷轴筒最多可以装 10 张纸或 5 张羊皮纸。",
  "contents": []
 },
 {
  "key": "chain",
  "name": "链条",
  "kind": "gear",
  "cost": 500,
  "weight": 10,
  "text": "如果你在一次 DC 13 的力量（运动）检定中成功，你可以用一个使用动作，把链条缠在你 5 尺范围内一个处于被擒抱、失能或束缚状态的非自愿生物身上。如果该生物的双腿被缠住，它就处于束缚状态，直到它挣脱为止。要挣脱链条，该生物必须用一个动作进行一次 DC 18 的敏捷（体操）检定并成功。要崩断链条，需要用一个动作进行一次 DC 20 的力量（运动）检定并成功。",
  "contents": []
 },
 {
  "key": "chest",
  "name": "箱子",
  "kind": "gear",
  "cost": 500,
  "weight": 25,
  "text": "箱子最多可以装 12 立方尺的东西。",
  "contents": []
 },
 {
  "key": "climbers-kit",
  "name": "攀爬工具",
  "kind": "gear",
  "cost": 2500,
  "weight": 12,
  "text": "攀爬工具包括靴尖钉、手套、岩钉和安全吊带。你可以用一个使用动作，用攀爬工具把自己固定住；这样做之后，你从固定点坠落的距离不会超过 25 尺，并且除非用一个附赠动作解除固定，否则你不能离开该点超过 25 尺。",
  "contents": []
 },
 {
  "key": "clothes-fine",
  "name": "精致服装",
  "kind": "gear",
  "cost": 1500,
  "weight": 6,
  "text": "精致服装用昂贵的面料制成，并饰有做工精湛的细节。有些活动和场所只允许穿着这种服装的人进入。",
  "contents": []
 },
 {
  "key": "clothes-travelers",
  "name": "旅行者服装",
  "kind": "gear",
  "cost": 200,
  "weight": 4,
  "text": "旅行者服装是结实耐穿的衣物，专为在各种环境中旅行而设计。",
  "contents": []
 },
 {
  "key": "cobblers-tools",
  "name": "鞋匠工具",
  "kind": "tool",
  "cost": 500,
  "weight": 5,
  "text": "",
  "contents": []
 },
 {
  "key": "component-pouch",
  "name": "法术材料包",
  "kind": "gear",
  "cost": 2500,
  "weight": 2,
  "text": "法术材料包防水，里面有许多隔层，可以装下你的法术所需的所有免费的材料成分。",
  "contents": []
 },
 {
  "key": "cooks-utensils",
  "name": "厨师用具",
  "kind": "tool",
  "cost": 100,
  "weight": 8,
  "text": "",
  "contents": []
 },
 {
  "key": "costume",
  "name": "戏服",
  "kind": "gear",
  "cost": 500,
  "weight": 4,
  "text": "穿着戏服时，你为假扮它所代表的人或那一类人而进行的任何属性检定都具有优势。",
  "contents": []
 },
 {
  "key": "crowbar",
  "name": "撬棍",
  "kind": "gear",
  "cost": 200,
  "weight": 5,
  "text": "在撬棍的杠杆作用能派上用场的场合，使用撬棍能让你的力量检定具有优势。",
  "contents": []
 },
 {
  "key": "crystal",
  "name": "水晶",
  "kind": "focus",
  "cost": 1000,
  "weight": 1,
  "text": "",
  "contents": []
 },
 {
  "key": "dice",
  "name": "骰子",
  "kind": "tool",
  "cost": 10,
  "weight": 0,
  "text": "",
  "contents": []
 },
 {
  "key": "diplomat-pack",
  "name": "外交官套组",
  "kind": "pack",
  "cost": 3900,
  "weight": 39,
  "text": "外交官套组包含以下物品：箱子、精致服装、墨水、5 支墨水笔、油灯、2 个地图或卷轴筒、4 瓶油、5 张纸、5 张羊皮纸、香水和火绒盒。",
  "contents": [
   {
    "key": "chest",
    "qty": 1
   },
   {
    "key": "clothes-fine",
    "qty": 1
   },
   {
    "key": "ink",
    "qty": 1
   },
   {
    "key": "ink-pen",
    "qty": 5
   },
   {
    "key": "lamp",
    "qty": 1
   },
   {
    "key": "case-map-or-scroll",
    "qty": 2
   },
   {
    "key": "oil",
    "qty": 4
   },
   {
    "key": "paper",
    "qty": 5
   },
   {
    "key": "parchment",
    "qty": 5
   },
   {
    "key": "perfume",
    "qty": 1
   },
   {
    "key": "tinderbox",
    "qty": 1
   }
  ]
 },
 {
  "key": "disguise-kit",
  "name": "易容工具",
  "kind": "tool",
  "cost": 2500,
  "weight": 3,
  "text": "",
  "contents": []
 },
 {
  "key": "dragonchess",
  "name": "龙棋",
  "kind": "tool",
  "cost": 100,
  "weight": 0,
  "text": "",
  "contents": []
 },
 {
  "key": "drum",
  "name": "鼓",
  "kind": "tool",
  "cost": 600,
  "weight": 3,
  "text": "",
  "contents": []
 },
 {
  "key": "dulcimer",
  "name": "扬琴",
  "kind": "tool",
  "cost": 2500,
  "weight": 10,
  "text": "",
  "contents": []
 },
 {
  "key": "dungeoneer-pack",
  "name": "地城探索套组",
  "kind": "pack",
  "cost": 1200,
  "weight": 55,
  "text": "地城探索套组包含以下物品：背包、铁蒺藜、撬棍、2 瓶油、10 天份口粮、绳子、火绒盒、10 支火把和水袋。",
  "contents": [
   {
    "key": "backpack",
    "qty": 1
   },
   {
    "key": "caltrops",
    "qty": 10
   },
   {
    "key": "crowbar",
    "qty": 1
   },
   {
    "key": "oil",
    "qty": 2
   },
   {
    "key": "rations",
    "qty": 10
   },
   {
    "key": "rope",
    "qty": 1
   },
   {
    "key": "tinderbox",
    "qty": 1
   },
   {
    "key": "torch",
    "qty": 10
   },
   {
    "key": "waterskin",
    "qty": 1
   }
  ]
 },
 {
  "key": "emblem",
  "name": "徽记",
  "kind": "focus",
  "cost": 500,
  "weight": 0,
  "text": "圣徽采用「圣徽」表中的某种形制，镶有宝石或绘有图案，用来引导神圣魔法。牧师或圣武士可以把圣徽当作施法法器使用。\n该表注明了每种圣徽需要手持、佩戴，还是饰于布料（比如罩袍或旗帜）或盾牌上。",
  "contents": []
 },
 {
  "key": "entertainers-pack",
  "name": "艺人套组",
  "kind": "pack",
  "cost": 4000,
  "weight": 58.5,
  "text": "艺人套组包含以下物品：背包、铺盖、铃铛、牛眼提灯、3 套戏服、镜子、8 瓶油、9 天份口粮、火绒盒和水袋。",
  "contents": [
   {
    "key": "backpack",
    "qty": 1
   },
   {
    "key": "bedroll",
    "qty": 1
   },
   {
    "key": "bell",
    "qty": 1
   },
   {
    "key": "lantern-bullseye",
    "qty": 1
   },
   {
    "key": "costume",
    "qty": 3
   },
   {
    "key": "mirror",
    "qty": 1
   },
   {
    "key": "oil",
    "qty": 8
   },
   {
    "key": "rations",
    "qty": 9
   },
   {
    "key": "tinderbox",
    "qty": 1
   },
   {
    "key": "waterskin",
    "qty": 1
   }
  ]
 },
 {
  "key": "explorers-pack",
  "name": "探险家套组",
  "kind": "pack",
  "cost": 1000,
  "weight": 55,
  "text": "探险家套组包含以下物品：背包、铺盖、2 瓶油、10 天份口粮、绳子、火绒盒、10 支火把和水袋。",
  "contents": [
   {
    "key": "backpack",
    "qty": 1
   },
   {
    "key": "bedroll",
    "qty": 1
   },
   {
    "key": "oil",
    "qty": 2
   },
   {
    "key": "rations",
    "qty": 10
   },
   {
    "key": "rope",
    "qty": 1
   },
   {
    "key": "tinderbox",
    "qty": 1
   },
   {
    "key": "torch",
    "qty": 10
   },
   {
    "key": "waterskin",
    "qty": 1
   }
  ]
 },
 {
  "key": "flask",
  "name": "长颈瓶",
  "kind": "gear",
  "cost": 2,
  "weight": 1,
  "text": "长颈瓶最多可以装 1 品脱。",
  "contents": []
 },
 {
  "key": "flute",
  "name": "长笛",
  "kind": "tool",
  "cost": 200,
  "weight": 1,
  "text": "",
  "contents": []
 },
 {
  "key": "forgery-kit",
  "name": "伪造工具",
  "kind": "tool",
  "cost": 1500,
  "weight": 5,
  "text": "",
  "contents": []
 },
 {
  "key": "glassblowers-tools",
  "name": "玻璃吹制工具",
  "kind": "tool",
  "cost": 3000,
  "weight": 5,
  "text": "",
  "contents": []
 },
 {
  "key": "grappling-hook",
  "name": "抓钩",
  "kind": "gear",
  "cost": 200,
  "weight": 4,
  "text": "你可以用一个使用动作，把抓钩扔向你 50 尺范围内的栏杆、岩架或其他可以钩住的地方；如果你在一次 DC 13 的敏捷（体操）检定中成功，钩子就会钩住。如果你在钩子上系了绳子，之后就可以顺着绳子攀爬。",
  "contents": []
 },
 {
  "key": "healers-kit",
  "name": "医疗包",
  "kind": "gear",
  "cost": 500,
  "weight": 3,
  "text": "医疗包可以使用十次。你可以用一个使用动作消耗一次使用次数，稳定一个生命值为 0 的昏迷生物，而不需要进行感知（医药）检定。",
  "contents": []
 },
 {
  "key": "herbalism-kit",
  "name": "草药工具",
  "kind": "tool",
  "cost": 500,
  "weight": 3,
  "text": "",
  "contents": []
 },
 {
  "key": "holy-water",
  "name": "圣水",
  "kind": "gear",
  "cost": 2500,
  "weight": 1,
  "text": "当你执行攻击动作时，你可以把其中一次攻击替换为投掷一瓶圣水。以你 20 尺范围内一个你能看见的生物为目标。目标必须在一次敏捷豁免（DC 8 + 你的敏捷调整值 + 你的熟练加值）中成功，否则如果它是邪魔或不死生物，就会受到 2d8 光耀伤害。",
  "contents": []
 },
 {
  "key": "horn",
  "name": "号角",
  "kind": "tool",
  "cost": 300,
  "weight": 2,
  "text": "",
  "contents": []
 },
 {
  "key": "hunting-trap",
  "name": "捕兽夹",
  "kind": "gear",
  "cost": 500,
  "weight": 25,
  "text": "你可以用一个使用动作布置捕兽夹。捕兽夹是一个锯齿状的钢圈，当有生物踩到中央的踏板时就会猛然合上。捕兽夹用一条沉重的链子固定在不可移动的物体上，比如树木或打进地里的铁桩。踩到踏板的生物必须在一次 DC 13 的敏捷豁免中成功，否则受到 1d4 穿刺伤害，并且速度降为 0，直到它的下个回合开始。此后，直到该生物从捕兽夹中挣脱为止，它的移动范围受链子长度限制（通常为 3 尺）。一个生物可以用它的动作进行一次 DC 13 的力量（运动）检定，成功时可以让自己或它触及范围内的另一个生物挣脱。每次检定失败，被夹住的生物都会受到 1 点穿刺伤害。",
  "contents": []
 },
 {
  "key": "ink",
  "name": "墨水",
  "kind": "gear",
  "cost": 1000,
  "weight": 0,
  "text": "墨水装在一个 1 盎司的瓶子里，足够写大约 500 页。",
  "contents": []
 },
 {
  "key": "ink-pen",
  "name": "墨水笔",
  "kind": "gear",
  "cost": 2,
  "weight": 0,
  "text": "墨水笔蘸上墨水，可以用来书写或绘画。",
  "contents": []
 },
 {
  "key": "jewelers-tools",
  "name": "珠宝匠工具",
  "kind": "tool",
  "cost": 2500,
  "weight": 2,
  "text": "",
  "contents": []
 },
 {
  "key": "jug",
  "name": "水罐",
  "kind": "gear",
  "cost": 2,
  "weight": 4,
  "text": "水罐最多可以装 1 加仑。",
  "contents": []
 },
 {
  "key": "ladder",
  "name": "梯子",
  "kind": "gear",
  "cost": 10,
  "weight": 25,
  "text": "梯子高 10 尺。你必须攀爬才能沿梯子上下移动。",
  "contents": []
 },
 {
  "key": "lamp",
  "name": "油灯",
  "kind": "gear",
  "cost": 50,
  "weight": 1,
  "text": "油灯以油为燃料，发出半径 15 尺的明亮光照，并在此之外再发出 30 尺的微光。",
  "contents": []
 },
 {
  "key": "lantern-bullseye",
  "name": "牛眼提灯",
  "kind": "gear",
  "cost": 1000,
  "weight": 2,
  "text": "牛眼提灯以油为燃料，在 60 尺锥形内发出明亮光照，并在此之外再发出 60 尺的微光。",
  "contents": []
 },
 {
  "key": "lantern-hooded",
  "name": "带罩提灯",
  "kind": "gear",
  "cost": 500,
  "weight": 2,
  "text": "带罩提灯以油为燃料，发出半径 30 尺的明亮光照，并在此之外再发出 30 尺的微光。你可以用一个附赠动作放下灯罩，把光照减弱为半径 5 尺的微光，或者再把灯罩掀起来。",
  "contents": []
 },
 {
  "key": "leatherworkers-tools",
  "name": "皮匠工具",
  "kind": "tool",
  "cost": 500,
  "weight": 5,
  "text": "",
  "contents": []
 },
 {
  "key": "lock",
  "name": "锁",
  "kind": "gear",
  "cost": 1000,
  "weight": 1,
  "text": "锁附带一把钥匙。没有钥匙的话，生物可以使用盗贼工具，通过一次成功的 DC 15 敏捷（巧手）检定撬开这把锁。",
  "contents": []
 },
 {
  "key": "lute",
  "name": "鲁特琴",
  "kind": "tool",
  "cost": 3500,
  "weight": 2,
  "text": "",
  "contents": []
 },
 {
  "key": "lyre",
  "name": "里拉琴",
  "kind": "tool",
  "cost": 3000,
  "weight": 2,
  "text": "",
  "contents": []
 },
 {
  "key": "magnifying-glass",
  "name": "放大镜",
  "kind": "gear",
  "cost": 10000,
  "weight": 0,
  "text": "放大镜让你为估价或检查一件细节繁复的物品而进行的任何属性检定具有优势。用放大镜生火需要像阳光一样明亮的光线来聚焦、需要火绒来引燃，并且大约需要 5 分钟才能点着。",
  "contents": []
 },
 {
  "key": "manacles",
  "name": "镣铐",
  "kind": "gear",
  "cost": 200,
  "weight": 6,
  "text": "如果你在一次 DC 13 的敏捷（巧手）检定中成功，你可以用一个使用动作，用镣铐铐住你 5 尺范围内一个处于被擒抱、失能或束缚状态的小型或中型非自愿生物。被铐住时，该生物的攻击检定具有劣势；如果镣铐连在固定的链条或钩子上，该生物就处于束缚状态。要挣脱镣铐，需要用一个动作进行一次 DC 20 的敏捷（巧手）检定并成功。要崩断镣铐，需要用一个动作进行一次 DC 25 的力量（运动）检定并成功。\n每副镣铐都附带一把钥匙。没有钥匙的话，生物可以使用盗贼工具，通过一次成功的 DC 15 敏捷（巧手）检定撬开镣铐的锁。",
  "contents": []
 },
 {
  "key": "masons-tools",
  "name": "石匠工具",
  "kind": "tool",
  "cost": 1000,
  "weight": 8,
  "text": "",
  "contents": []
 },
 {
  "key": "map",
  "name": "地图",
  "kind": "gear",
  "cost": 100,
  "weight": 0,
  "text": "如果你查阅一份准确的地图，你在地图所描绘的地方为认路而进行的感知（求生）检定获得 +5 加值。",
  "contents": []
 },
 {
  "key": "mirror",
  "name": "镜子",
  "kind": "gear",
  "cost": 500,
  "weight": 0.5,
  "text": "手持的钢镜既可以用来梳妆打扮，也可以用来窥探拐角另一侧的情况，或者反射光线作为信号。",
  "contents": []
 },
 {
  "key": "navigators-tools",
  "name": "领航工具",
  "kind": "tool",
  "cost": 2500,
  "weight": 2,
  "text": "",
  "contents": []
 },
 {
  "key": "needles",
  "name": "吹针",
  "kind": "ammunition",
  "cost": 100,
  "weight": 1,
  "text": "",
  "contents": []
 },
 {
  "key": "net",
  "name": "网",
  "kind": "gear",
  "cost": 100,
  "weight": 3,
  "text": "当你执行攻击动作时，你可以把其中一次攻击替换为投掷一张网。以你 15 尺范围内一个你能看见的生物为目标。目标必须在一次敏捷豁免（DC 8 + 你的敏捷调整值 + 你的熟练加值）中成功，否则陷入束缚状态，直到它挣脱为止。如果目标是巨型或更大的生物，它会自动成功。\n要挣脱，目标或它 5 尺范围内的一个生物必须用一个动作进行一次 DC 10 的力量（运动）检定，成功时就能让被束缚的生物脱身。摧毁这张网（AC 10；5 点生命值；免疫钝击、毒素和心灵伤害）也能让目标脱身，结束该效果。",
  "contents": []
 },
 {
  "key": "oil",
  "name": "油",
  "kind": "gear",
  "cost": 10,
  "weight": 1,
  "text": "你可以用油泼洒一个生物、物体或一片空间，或者把它当作燃料，详见下文。\n泼洒生物或物体。当你执行攻击动作时，你可以把其中一次攻击替换为投掷一瓶油。以你 20 尺范围内一个生物或物体为目标。目标必须在一次敏捷豁免（DC 8 + 你的敏捷调整值 + 你的熟练加值）中成功，否则会被油浸透。如果目标在油干掉之前（1 分钟后油会干掉）受到火焰伤害，它会因燃烧的油而额外受到 5 点火焰伤害。\n泼洒空间。你可以执行使用动作，把一瓶油倒在你 5 尺范围内的平地上，覆盖一块 5 尺见方的区域。如果被点燃，油会一直燃烧，直到点燃后第 2 轮的同一回合结束为止（即 12 秒），并对任何进入该区域或在该区域内结束回合的生物造成 5 点火焰伤害。一个生物每回合只能受到一次这种伤害。\n燃料。油可以作为油灯和提灯的燃料。一瓶油一旦点燃，在油灯或提灯里可以燃烧 6 小时。这段时间不必连续；你可以熄灭燃烧的油（以一个使用动作），之后再重新点燃，直到它总共燃烧满 6 小时为止。",
  "contents": []
 },
 {
  "key": "orb",
  "name": "法球",
  "kind": "focus",
  "cost": 2000,
  "weight": 3,
  "text": "",
  "contents": []
 },
 {
  "key": "painters-supplies",
  "name": "画家用具",
  "kind": "tool",
  "cost": 1000,
  "weight": 5,
  "text": "",
  "contents": []
 },
 {
  "key": "pan-flute",
  "name": "排箫",
  "kind": "tool",
  "cost": 1200,
  "weight": 2,
  "text": "",
  "contents": []
 },
 {
  "key": "paper",
  "name": "纸",
  "kind": "gear",
  "cost": 20,
  "weight": 0,
  "text": "一张纸大约能手写 250 个词。",
  "contents": []
 },
 {
  "key": "parchment",
  "name": "羊皮纸",
  "kind": "gear",
  "cost": 10,
  "weight": 0,
  "text": "一张羊皮纸大约能手写 250 个词。",
  "contents": []
 },
 {
  "key": "perfume",
  "name": "香水",
  "kind": "gear",
  "cost": 500,
  "weight": 0,
  "text": "香水装在一个 4 盎司的小瓶里。在你给自己涂抹香水后的 1 小时内，你为影响你 5 尺范围内一个态度冷淡的类人生物而进行的魅力（游说）检定具有优势。",
  "contents": []
 },
 {
  "key": "poisoners-kit",
  "name": "制毒工具",
  "kind": "tool",
  "cost": 5000,
  "weight": 2,
  "text": "",
  "contents": []
 },
 {
  "key": "playing-cards",
  "name": "纸牌",
  "kind": "tool",
  "cost": 50,
  "weight": 0,
  "text": "",
  "contents": []
 },
 {
  "key": "poison-basic",
  "name": "基础毒药",
  "kind": "gear",
  "cost": 10000,
  "weight": 0,
  "text": "你可以用一个附赠动作，用一瓶基础毒药涂抹一把武器或至多三件弹药。受到涂毒武器或弹药造成的穿刺或挥砍伤害的生物，会额外受到 1d4 毒素伤害。毒药涂上后可以保持药效 1 分钟，或者直到它造成了伤害为止，以先发生者为准。",
  "contents": []
 },
 {
  "key": "pole",
  "name": "长杆",
  "kind": "gear",
  "cost": 5,
  "weight": 7,
  "text": "长杆长 10 尺。你可以用它触碰 10 尺以内的东西。如果你在跳高或跳远时需要进行力量（运动）检定，你可以用长杆撑跳，使这次检定具有优势。",
  "contents": []
 },
 {
  "key": "pot-iron",
  "name": "铁锅",
  "kind": "gear",
  "cost": 200,
  "weight": 10,
  "text": "铁锅最多可以装 1 加仑。",
  "contents": []
 },
 {
  "key": "potion-of-healing",
  "name": "治疗药水",
  "kind": "gear",
  "cost": 5000,
  "weight": 0.5,
  "text": "这瓶药水是魔法物品。你可以用一个附赠动作喝下它，或者给你 5 尺范围内的另一个生物服用。喝下瓶中这种魔法红色液体的生物恢复 2d4+2 生命值。",
  "contents": []
 },
 {
  "key": "potters-tools",
  "name": "陶匠工具",
  "kind": "tool",
  "cost": 1000,
  "weight": 3,
  "text": "",
  "contents": []
 },
 {
  "key": "pouch",
  "name": "小袋",
  "kind": "gear",
  "cost": 50,
  "weight": 1,
  "text": "小袋最多可以在五分之一立方尺的空间内装下 6 磅的东西。",
  "contents": []
 },
 {
  "key": "priests-pack",
  "name": "祭司套组",
  "kind": "pack",
  "cost": 3300,
  "weight": 29,
  "text": "祭司套组包含以下物品：背包、毯子、圣水、油灯、7 天份口粮、长袍和火绒盒。",
  "contents": [
   {
    "key": "backpack",
    "qty": 1
   },
   {
    "key": "blanket",
    "qty": 1
   },
   {
    "key": "holy-water",
    "qty": 1
   },
   {
    "key": "lamp",
    "qty": 1
   },
   {
    "key": "rations",
    "qty": 7
   },
   {
    "key": "robe",
    "qty": 1
   },
   {
    "key": "tinderbox",
    "qty": 1
   }
  ]
 },
 {
  "key": "quiver",
  "name": "箭袋",
  "kind": "gear",
  "cost": 100,
  "weight": 1,
  "text": "箭袋最多可以装 20 支箭。",
  "contents": []
 },
 {
  "key": "ram-portable",
  "name": "便携攻城锤",
  "kind": "gear",
  "cost": 400,
  "weight": 35,
  "text": "你可以用便携攻城锤撞开门。这样做时，你的力量检定获得 +4 加值。另一名角色可以协助你使用攻城锤，使你这次检定具有优势。",
  "contents": []
 },
 {
  "key": "rations",
  "name": "口粮",
  "kind": "gear",
  "cost": 50,
  "weight": 2,
  "text": "口粮是便于旅行携带的食物，包括肉干、果干、硬饼干和坚果。不进食的风险见「规则词汇表」中的「营养不良」。",
  "contents": []
 },
 {
  "key": "reliquary",
  "name": "圣物匣",
  "kind": "focus",
  "cost": 500,
  "weight": 2,
  "text": "圣徽采用「圣徽」表中的某种形制，镶有宝石或绘有图案，用来引导神圣魔法。牧师或圣武士可以把圣徽当作施法法器使用。\n该表注明了每种圣徽需要手持、佩戴，还是饰于布料（比如罩袍或旗帜）或盾牌上。",
  "contents": []
 },
 {
  "key": "robe",
  "name": "长袍",
  "kind": "gear",
  "cost": 100,
  "weight": 4,
  "text": "长袍具有职业或仪式上的意义。有些活动和场所只允许穿着带有特定颜色或标志的长袍的人进入。",
  "contents": []
 },
 {
  "key": "rod",
  "name": "权杖",
  "kind": "focus",
  "cost": 1000,
  "weight": 2,
  "text": "",
  "contents": []
 },
 {
  "key": "rope",
  "name": "绳子",
  "kind": "gear",
  "cost": 100,
  "weight": 5,
  "text": "如果你在一次 DC 10 的敏捷（巧手）检定中成功，你可以用一个使用动作用绳子打一个结。绳子可以通过一次成功的 DC 20 力量（运动）检定崩断。\n只有当一个非自愿生物处于被擒抱、失能或束缚状态时，你才能用绳子把它绑起来。如果该生物的双腿被绑住，它就处于束缚状态，直到它挣脱为止。要挣脱绳子，该生物必须用一个动作进行一次 DC 15 的敏捷（体操）检定并成功。",
  "contents": []
 },
 {
  "key": "sack",
  "name": "麻袋",
  "kind": "gear",
  "cost": 1,
  "weight": 0.5,
  "text": "麻袋最多可以在 1 立方尺的空间内装下 30 磅的东西。",
  "contents": []
 },
 {
  "key": "scholars-pack",
  "name": "学者套组",
  "kind": "pack",
  "cost": 4000,
  "weight": 22,
  "text": "学者套组包含以下物品：背包、毯子、书、墨水、墨水笔、油灯、10 瓶油、10 张羊皮纸和火绒盒。",
  "contents": [
   {
    "key": "backpack",
    "qty": 1
   },
   {
    "key": "blanket",
    "qty": 1
   },
   {
    "key": "book",
    "qty": 1
   },
   {
    "key": "ink",
    "qty": 1
   },
   {
    "key": "ink-pen",
    "qty": 1
   },
   {
    "key": "lamp",
    "qty": 1
   },
   {
    "key": "oil",
    "qty": 10
   },
   {
    "key": "parchment",
    "qty": 10
   },
   {
    "key": "tinderbox",
    "qty": 1
   }
  ]
 },
 {
  "key": "shawm",
  "name": "肖姆管",
  "kind": "tool",
  "cost": 200,
  "weight": 1,
  "text": "",
  "contents": []
 },
 {
  "key": "shovel",
  "name": "铲子",
  "kind": "gear",
  "cost": 200,
  "weight": 5,
  "text": "用铲子工作 1 小时，你可以在泥土或类似的材料中挖出一个长、宽、深各 5 尺的坑。",
  "contents": []
 },
 {
  "key": "signal-whistle",
  "name": "信号哨",
  "kind": "gear",
  "cost": 5,
  "weight": 0,
  "text": "以一个使用动作吹响信号哨时，它发出的声音在 600 尺外都能听到。",
  "contents": []
 },
 {
  "key": "smiths-tools",
  "name": "铁匠工具",
  "kind": "tool",
  "cost": 2000,
  "weight": 8,
  "text": "",
  "contents": []
 },
 {
  "key": "spellbook",
  "name": "法术书",
  "kind": "gear",
  "cost": 5000,
  "weight": 3,
  "text": "法术书是法师必不可少的东西，它是一本皮革封面的厚书，有 100 页空白的犊皮纸，适合用来记录法术。",
  "contents": []
 },
 {
  "key": "spell-scroll-cantrip",
  "name": "法术卷轴（戏法）",
  "kind": "gear",
  "cost": 3000,
  "weight": 0,
  "text": "法术卷轴（戏法）或法术卷轴（1 环）是一种魔法物品，上面分别写着一个戏法或一道 1 环法术的咒文，具体是哪个法术由卷轴的制作者决定。如果该法术在你职业的法术列表上，你就可以阅读这张卷轴并施放该法术，施法时间与平常相同，并且不需要提供任何材料成分。\n如果该法术需要进行豁免检定或攻击检定，法术豁免 DC 为 13，攻击加值为 +5。施法完成后，卷轴就会碎裂消散。",
  "contents": []
 },
 {
  "key": "spell-scroll-level-1",
  "name": "法术卷轴（1 环）",
  "kind": "gear",
  "cost": 5000,
  "weight": 0,
  "text": "法术卷轴（戏法）或法术卷轴（1 环）是一种魔法物品，上面分别写着一个戏法或一道 1 环法术的咒文，具体是哪个法术由卷轴的制作者决定。如果该法术在你职业的法术列表上，你就可以阅读这张卷轴并施放该法术，施法时间与平常相同，并且不需要提供任何材料成分。\n如果该法术需要进行豁免检定或攻击检定，法术豁免 DC 为 13，攻击加值为 +5。施法完成后，卷轴就会碎裂消散。",
  "contents": []
 },
 {
  "key": "spikes-iron",
  "name": "铁钉",
  "kind": "gear",
  "cost": 100,
  "weight": 5,
  "text": "铁钉以十根为一捆。你可以用一个使用动作，用钝器（比如轻锤）把一根铁钉钉进木头、泥土或类似的材料中。你可以这样把门卡住，或者在铁钉上系上绳子或链条。",
  "contents": []
 },
 {
  "key": "sprig-of-mistletoe",
  "name": "槲寄生枝",
  "kind": "focus",
  "cost": 100,
  "weight": 0,
  "text": "",
  "contents": []
 },
 {
  "key": "spyglass",
  "name": "望远镜",
  "kind": "gear",
  "cost": 100000,
  "weight": 1,
  "text": "通过望远镜观察的物体会被放大到两倍大小。",
  "contents": []
 },
 {
  "key": "staff",
  "name": "法杖",
  "kind": "focus",
  "cost": 500,
  "weight": 4,
  "text": "",
  "contents": []
 },
 {
  "key": "string",
  "name": "细绳",
  "kind": "gear",
  "cost": 10,
  "weight": 0,
  "text": "细绳长 10 尺。你可以用一个使用动作在上面打一个结。",
  "contents": []
 },
 {
  "key": "tent",
  "name": "帐篷",
  "kind": "gear",
  "cost": 200,
  "weight": 20,
  "text": "一顶帐篷最多可供两个小型或中型生物睡觉。",
  "contents": []
 },
 {
  "key": "thieves-tools",
  "name": "盗贼工具",
  "kind": "tool",
  "cost": 2500,
  "weight": 1,
  "text": "",
  "contents": []
 },
 {
  "key": "three-dragon-ante",
  "name": "三龙牌",
  "kind": "tool",
  "cost": 100,
  "weight": 0,
  "text": "",
  "contents": []
 },
 {
  "key": "tinderbox",
  "name": "火绒盒",
  "kind": "gear",
  "cost": 50,
  "weight": 1,
  "text": "火绒盒是一个小容器，里面装着用来生火的燧石、火镰和火绒（通常是浸过轻油的干布）。用它点燃蜡烛、油灯、提灯或火把——或者任何燃料暴露在外的东西——需要一个附赠动作。点燃其他任何火需要 1 分钟。",
  "contents": []
 },
 {
  "key": "tinkers-tools",
  "name": "修补匠工具",
  "kind": "tool",
  "cost": 5000,
  "weight": 10,
  "text": "",
  "contents": []
 },
 {
  "key": "torch",
  "name": "火把",
  "kind": "gear",
  "cost": 1,
  "weight": 1,
  "text": "火把可以燃烧 1 小时，发出半径 20 尺的明亮光照，并在此之外再发出 20 尺的微光。当你执行攻击动作时，你可以用火把进行攻击，把它当作简易近战武器使用。命中时，目标受到 1 点火焰伤害。",
  "contents": []
 },
 {
  "key": "vial",
  "name": "小瓶",
  "kind": "gear",
  "cost": 100,
  "weight": 0,
  "text": "小瓶最多可以装 4 盎司。",
  "contents": []
 },
 {
  "key": "viol",
  "name": "维奥尔琴",
  "kind": "tool",
  "cost": 3000,
  "weight": 1,
  "text": "",
  "contents": []
 },
 {
  "key": "wand",
  "name": "魔杖",
  "kind": "focus",
  "cost": 1000,
  "weight": 1,
  "text": "",
  "contents": []
 },
 {
  "key": "waterskin",
  "name": "水袋",
  "kind": "gear",
  "cost": 20,
  "weight": 5,
  "text": "水袋最多可以装 4 品脱。如果你没有喝足够的水，就有脱水的风险（见「规则词汇表」）。",
  "contents": []
 },
 {
  "key": "weavers-tools",
  "name": "织工工具",
  "kind": "tool",
  "cost": 100,
  "weight": 5,
  "text": "",
  "contents": []
 },
 {
  "key": "woodcarvers-tools",
  "name": "木雕工具",
  "kind": "tool",
  "cost": 100,
  "weight": 5,
  "text": "",
  "contents": []
 },
 {
  "key": "yew-wand",
  "name": "紫杉魔杖",
  "kind": "focus",
  "cost": 1000,
  "weight": 1,
  "text": "",
  "contents": []
 }
];

export const MAGIC_ITEMS: MagicItemData[] = [
 {
  "key": "ammunition-1",
  "name": "+1 弹药",
  "rarity": "非普通",
  "attunement": false,
  "text": "武器（非普通）\n你用这件魔法弹药进行的攻击检定和伤害掷骰获得加值，加值的大小由弹药的稀有度决定。弹药一旦命中目标，就不再具有魔法。\n这种弹药通常以十件或二十件为一组被发现或出售。十件这种弹药的价值相当于一瓶相同稀有度的药水。",
  "mech": {
   "attack": 1,
   "damage": 1
  }
 },
 {
  "key": "amulet-of-health",
  "name": "健康护符",
  "rarity": "珍稀",
  "attunement": true,
  "text": "奇物\n佩戴这个护符时，你的体质为 19。如果你不戴它时体质就已经是 19 或更高，它对你没有效果。",
  "mech": null
 },
 {
  "key": "armor-1",
  "name": "+1 护甲",
  "rarity": "珍稀",
  "attunement": false,
  "text": "护甲（任意轻甲、中甲或重甲）\n穿着这件护甲时，你的护甲等级获得 +1 加值。",
  "mech": {
   "ac": 1
  }
 },
 {
  "key": "bag-of-holding",
  "name": "次元袋",
  "rarity": "非普通",
  "attunement": false,
  "text": "奇物\n这个袋子的内部空间比它的外部尺寸大得多——内部大约 2 尺见方、4 尺深。袋子最多可以装 500 磅的东西，体积不超过 64 立方尺。无论里面装了什么，袋子都重 5 磅。从袋子里取出一件物品需要一个使用动作。\n如果袋子装得过满、被刺穿或被撕破，它就会被摧毁，里面的东西会散落到星界中。如果袋子被里外翻转过来，里面的东西会完好无损地倒出来，但必须先把袋子翻回原样才能再次使用。袋子里的空气足够呼吸 10 分钟，这个时间要除以袋中正在呼吸的生物数量。\n把次元袋放进便利背包、便携洞或类似物品所创造的异次元空间中，会立刻摧毁这两件物品，并打开一道通往星界的传送门。传送门出现在一件物品被放进另一件物品的位置。以传送门为中心、半径 10 尺的球形区域内的任何生物都会被吸进传送门，到达星界中的一个随机地点。之后传送门关闭。这道传送门是单向的，并且无法重新开启。",
  "mech": null
 },
 {
  "key": "boots-of-elvenkind",
  "name": "精灵靴",
  "rarity": "非普通",
  "attunement": false,
  "text": "奇物\n穿着这双靴子时，无论你在什么表面上移动，你的脚步都不会发出声音。你的敏捷（隐匿）检定也具有优势。",
  "mech": null
 },
 {
  "key": "boots-of-striding-and-springing",
  "name": "健步跳跃靴",
  "rarity": "非普通",
  "attunement": true,
  "text": "奇物\n穿着这双靴子时，你的速度变为 30 尺，除非你的速度本来就更高；并且你的速度不会因为你携带的重量超过负重能力或穿着重甲而降低。\n在你的每个回合中，你可以有一次只花费 10 尺移动力就跳跃至多 30 尺。",
  "mech": null
 },
 {
  "key": "cloak-of-elvenkind",
  "name": "精灵斗篷",
  "rarity": "非普通",
  "attunement": true,
  "text": "奇物\n穿着这件斗篷时，为察觉你而进行的感知（察觉）检定具有劣势，并且你的敏捷（隐匿）检定具有优势。",
  "mech": null
 },
 {
  "key": "cloak-of-protection",
  "name": "防护斗篷",
  "rarity": "非普通",
  "attunement": true,
  "text": "奇物\n穿着这件斗篷时，你的护甲等级和豁免检定获得 +1 加值。",
  "mech": {
   "ac": 1,
   "saves": 1
  }
 },
 {
  "key": "gauntlets-of-ogre-power",
  "name": "食人魔力量手套",
  "rarity": "非普通",
  "attunement": true,
  "text": "奇物\n戴着这副手套时，你的力量为 19。如果你不戴它们时力量就已经是 19 或更高，它们对你没有效果。",
  "mech": null
 },
 {
  "key": "gloves-of-swimming-and-climbing",
  "name": "游泳攀爬手套",
  "rarity": "非普通",
  "attunement": true,
  "text": "奇物\n戴着这副手套时，你拥有等同于你速度的攀爬速度和游泳速度，并且你为攀爬或游泳而进行的力量（运动）检定获得 +5 加值。",
  "mech": null
 },
 {
  "key": "goggles-of-night",
  "name": "夜视护目镜",
  "rarity": "非普通",
  "attunement": false,
  "text": "奇物\n戴着这副深色镜片时，你拥有范围 60 尺的黑暗视觉。如果你本来就拥有黑暗视觉，戴上护目镜会使它的范围增加 60 尺。",
  "mech": null
 },
 {
  "key": "headband-of-intellect",
  "name": "智力头带",
  "rarity": "非普通",
  "attunement": true,
  "text": "奇物\n戴着这条头带时，你的智力为 19。如果你不戴它时智力就已经是 19 或更高，它对你没有效果。",
  "mech": null
 },
 {
  "key": "immovable-rod",
  "name": "定身杖",
  "rarity": "非普通",
  "attunement": false,
  "text": "权杖\n这根铁杖的一端有一个按钮。你可以执行一个使用动作按下按钮，使铁杖魔法般地固定在原处。直到你或另一个生物执行一个使用动作再次按下按钮之前，铁杖都不会移动，即使这违背重力也一样。铁杖最多可以承受 8,000 磅的重量。重量再多，铁杖就会失效并掉落。一个生物可以执行一个使用动作进行一次 DC 30 的力量（运动）检定，成功时可以把固定住的铁杖移动至多 10 尺。",
  "mech": null
 },
 {
  "key": "pearl-of-power",
  "name": "力量珍珠",
  "rarity": "非普通",
  "attunement": true,
  "text": "奇物\n当这颗珍珠在你身上时，你可以执行一个魔法动作，恢复一个已消耗的 3 环或更低环阶的法术位。一旦你使用了这颗珍珠，在下一次黎明到来之前不能再次使用。",
  "mech": {
   "charges": 1
  }
 },
 {
  "key": "periapt-of-wound-closure",
  "name": "伤口愈合护符",
  "rarity": "非普通",
  "attunement": true,
  "text": "奇物\n佩戴这个坠饰时，你获得以下效益。\n保全性命。每当你进行死亡豁免时，你可以把 9 或更低的掷骰结果改为 10，使一次失败的豁免变为成功。\n强化自然愈合。每当你掷生命骰来恢复生命值时，这颗骰子恢复的生命值翻倍。",
  "mech": null
 },
 {
  "key": "potion-of-animal-friendship",
  "name": "动物交友药水",
  "rarity": "非普通",
  "attunement": false,
  "text": "药水\n当你喝下这瓶药水时，你可以施放 3 环版本的《动物交友》法术（豁免 DC 13）。摇晃这瓶药水浑浊的液体，会看到里面浮现出一些小东西：一片鱼鳞、一根蜂鸟羽毛、一只猫爪或一根松鼠毛。",
  "mech": null
 },
 {
  "key": "potion-of-climbing",
  "name": "攀爬药水",
  "rarity": "普通",
  "attunement": false,
  "text": "药水\n当你喝下这瓶药水时，你获得等同于你速度的攀爬速度，持续 1 小时。在此期间，你为攀爬而进行的力量（运动）检定具有优势。\n这瓶药水分成棕色、银色和灰色几层，看起来就像一条条岩层。摇晃瓶子也无法让这些颜色混在一起。",
  "mech": null
 },
 {
  "key": "potion-of-growth",
  "name": "变巨药水",
  "rarity": "非普通",
  "attunement": false,
  "text": "药水\n当你喝下这瓶药水时，你获得《变巨／缩小术》法术的「变巨」效果，持续 10 分钟（不需要专注）。\n药水液体中的红色会不断地从一颗小珠扩散开来，把周围透明的液体染红，然后又收缩回去。摇晃瓶子也无法打断这个过程。",
  "mech": null
 },
 {
  "key": "potions-of-healing",
  "name": "治疗药水",
  "rarity": "稀有度不定",
  "attunement": false,
  "text": "药水\n当你喝下这瓶药水时，你恢复生命值。恢复的生命值取决于药水的稀有度，如下表所示。\n无论效力如何，这种药水的红色液体在被摇晃时都会闪闪发光。\n治疗药水表（药水：恢复的生命值，稀有度）\n治疗药水：2d4+2，普通\n高等治疗药水：4d4+4，非普通\n强效治疗药水：8d4+8，珍稀\n极效治疗药水：10d4+20，极珍稀",
  "mech": {
   "heal": "2d4+2"
  }
 },
 {
  "key": "potion-of-heroism",
  "name": "英雄药水",
  "rarity": "珍稀",
  "attunement": false,
  "text": "药水\n当你喝下这瓶药水时，你获得 10 点临时生命值，持续 1 小时。在同一时段内，你处于《祝福术》法术的效果之下（不需要专注）。\n这瓶药水的蓝色液体冒着泡、蒸腾着热气，就像在沸腾一样。",
  "mech": null
 },
 {
  "key": "potion-of-invisibility",
  "name": "隐形药水",
  "rarity": "珍稀",
  "attunement": false,
  "text": "药水\n这瓶药水的容器看起来是空的，摸起来却好像装着液体。当你喝下这瓶药水时，你陷入隐形状态，持续 1 小时。如果你进行攻击检定、造成伤害或施放法术，这个效果会提前结束。",
  "mech": null
 },
 {
  "key": "potion-of-resistance",
  "name": "抗性药水",
  "rarity": "非普通",
  "attunement": false,
  "text": "药水\n当你喝下这瓶药水时，你对一种伤害类型具有抗性，持续 1 小时。由主持人选择伤害类型，或者在下表中掷骰随机决定。\n抗性药水表（1d10：伤害类型）\n1：强酸\n2：冷冻\n3：火焰\n4：力场\n5：闪电\n6：暗蚀\n7：毒素\n8：心灵\n9：光耀\n10：雷鸣",
  "mech": null
 },
 {
  "key": "potion-of-water-breathing",
  "name": "水下呼吸药水",
  "rarity": "非普通",
  "attunement": false,
  "text": "药水\n喝下这瓶药水后的 24 小时内，你可以在水下呼吸。\n这瓶药水浑浊的绿色液体散发着大海的气味，里面漂浮着一个像水母一样的气泡。",
  "mech": null
 },
 {
  "key": "ring-of-protection",
  "name": "防护戒指",
  "rarity": "珍稀",
  "attunement": true,
  "text": "戒指\n戴着这枚戒指时，你的护甲等级和豁免检定获得 +1 加值。",
  "mech": {
   "ac": 1,
   "saves": 1
  }
 },
 {
  "key": "rope-of-climbing",
  "name": "攀爬绳",
  "rarity": "非普通",
  "attunement": false,
  "text": "奇物\n这条 60 尺长的绳子最多可以承受 3,000 磅的重量。握住绳子的一端时，你可以执行一个魔法动作，命令绳子的另一端活动起来，朝你选择的目的地移动，距离最多为绳长。在你第一次下令的那个回合，绳端移动 10 尺，之后在你的每个回合开始时再移动 10 尺，直到抵达目的地或你命令它停下为止。你也可以命令绳子把自己牢牢系在某个物体上或从物体上解开、给自己打结或解结，或者盘绕起来以便携带。\n如果你命令绳子打结，绳子上每隔 1 尺就会出现一个大绳结。打结后，绳子缩短为 50 尺长，并使借助这条绳子攀爬时进行的属性检定具有优势。这条绳子的 AC 为 20，拥有 20 点生命值，并且免疫毒素和心灵伤害。只要它至少还有 1 点生命值，它每 5 分钟就恢复 1 点生命值。如果绳子的生命值降到 0，它就会被摧毁。",
  "mech": null
 },
 {
  "key": "shield-1",
  "name": "+1 盾牌",
  "rarity": "非普通",
  "attunement": false,
  "text": "护甲（盾牌）\n持握这面盾牌时，除了盾牌本身正常的护甲等级加值以外，你的护甲等级还获得 +1 加值。",
  "mech": {
   "ac": 1
  }
 },
 {
  "key": "spell-scroll",
  "name": "法术卷轴",
  "rarity": "稀有度不定",
  "attunement": false,
  "text": "卷轴\n法术卷轴上用神秘的密文写着一道法术的咒文。如果该法术在你的法术列表上，你就可以阅读这张卷轴并施放其中的法术，不需要材料成分。否则，这张卷轴对你来说无法理解。通过阅读卷轴施放法术需要该法术正常的施法时间。法术施放之后，卷轴就会化为尘土。如果施法被打断，卷轴不会损失。\n如果该法术在你的法术列表上，但环阶比你平常能施放的更高，你需要用你的施法属性进行一次属性检定，来决定你能否施放该法术。DC 等于 10 + 该法术的环阶。检定失败时，法术从卷轴上消失，没有其他效果。\n卷轴上法术的环阶决定了该法术的豁免 DC 和攻击加值，以及卷轴的稀有度，如下表所示。\n法术卷轴表（法术环阶：稀有度，豁免 DC，攻击加值）\n戏法：普通，13，+5\n1 环：普通，13，+5\n2 环：非普通，13，+5\n3 环：非普通，15，+7\n4 环：珍稀，15，+7\n5 环：珍稀，17，+9\n6 环：极珍稀，17，+9\n7 环：极珍稀，18，+10\n8 环：极珍稀，18，+10\n9 环：传说，19，+11\n把卷轴抄进法术书。法术卷轴上的法师法术可以被抄进法术书。以这种方式抄写法术时，抄写者必须在一次智力（奥秘）检定中成功，DC 等于 10 + 该法术的环阶。检定成功时，法术被抄下。无论检定成功还是失败，这张法术卷轴都会被摧毁。",
  "mech": null
 },
 {
  "key": "wand-of-magic-missiles",
  "name": "魔法飞弹魔杖",
  "rarity": "非普通",
  "attunement": false,
  "text": "魔杖\n这根魔杖有 7 发充能。持握它时，你可以消耗至多 3 发充能，用它施放《魔法飞弹》。消耗 1 发充能时，你施放该法术的 1 环版本。每多消耗 1 发充能，法术的环阶就提高 1 环。\n恢复充能。这根魔杖每天黎明时恢复 1d6+1 发已消耗的充能。如果你消耗了魔杖的最后 1 发充能，掷 1d20。如果掷出 1，魔杖就会化为灰烬并被摧毁。",
  "mech": {
   "charges": 7
  }
 },
 {
  "key": "wand-of-the-war-mage-1",
  "name": "+1 战争法师魔杖",
  "rarity": "非普通",
  "attunement": true,
  "text": "魔杖\n非普通（+1）\n持握这根魔杖时，你的法术攻击检定获得 +1 加值。此外，你进行法术攻击检定时无视半身掩护。",
  "mech": {
   "attack": 1
  }
 },
 {
  "key": "wand-of-web",
  "name": "蛛网魔杖",
  "rarity": "非普通",
  "attunement": true,
  "text": "魔杖\n这根魔杖有 7 发充能。持握它时，你可以消耗 1 发充能，用它施放《蛛网术》（豁免 DC 13）。\n恢复充能。这根魔杖每天黎明时恢复 1d6+1 发已消耗的充能。如果你消耗了魔杖的最后 1 发充能，掷 1d20。如果掷出 1，魔杖就会化为灰烬并被摧毁。",
  "mech": {
   "charges": 7
  }
 },
 {
  "key": "weapon-1",
  "name": "+1 武器",
  "rarity": "非普通",
  "attunement": false,
  "text": "武器（任意简易或军用武器）\n非普通（+1）\n你用这把魔法武器进行的攻击检定和伤害掷骰获得 +1 加值。",
  "mech": {
   "attack": 1,
   "damage": 1
  }
 },
 {
  "key": "potion-of-greater-healing",
  "name": "高等治疗药水",
  "rarity": "非普通",
  "attunement": false,
  "text": "喝下这瓶药水（附赠动作，也可以喂给 5 尺内的另一个生物）恢复 4d4+4 生命值。",
  "mech": {
   "heal": "4d4+4"
  }
 },
 {
  "key": "potion-of-superior-healing",
  "name": "强效治疗药水",
  "rarity": "珍稀",
  "attunement": false,
  "text": "喝下这瓶药水（附赠动作，也可以喂给 5 尺内的另一个生物）恢复 8d4+8 生命值。",
  "mech": {
   "heal": "8d4+8"
  }
 },
 {
  "key": "potion-of-supreme-healing",
  "name": "极效治疗药水",
  "rarity": "极珍稀",
  "attunement": false,
  "text": "喝下这瓶药水（附赠动作，也可以喂给 5 尺内的另一个生物）恢复 10d4+20 生命值。",
  "mech": {
   "heal": "10d4+20"
  }
 }
];

export const MASTERIES: FeatureText[] = [
 {
  "key": "cleave",
  "name": "顺劈",
  "text": "如果你用这把武器的近战攻击检定命中一个生物，你可以用这把武器对另一个生物进行一次近战攻击检定，该生物须在第一个生物 5 尺范围内，并且也在你的触及范围内。命中时，第二个生物受到该武器的伤害，但不要把你的属性调整值加到这次伤害上，除非该调整值为负数。每回合你只能进行一次这种额外攻击。"
 },
 {
  "key": "graze",
  "name": "擦伤",
  "text": "如果你用这把武器进行的攻击检定没有命中一个生物，你可以对该生物造成伤害，数值等于你进行这次攻击检定时所用的属性调整值。这项伤害的类型与该武器造成的伤害类型相同，并且只能通过提高该属性调整值来增加。"
 },
 {
  "key": "nick",
  "name": "迅击",
  "text": "当你进行轻型属性的额外攻击时，你可以把它作为攻击动作的一部分进行，而不必用附赠动作进行。每回合你只能进行一次这种额外攻击。"
 },
 {
  "key": "push",
  "name": "推离",
  "text": "如果你用这把武器命中一个大型或更小的生物，你可以把它沿直线向远离你的方向推开至多 10 尺。"
 },
 {
  "key": "sap",
  "name": "削弱",
  "text": "如果你用这把武器命中一个生物，该生物在你的下个回合开始前进行的下一次攻击检定具有劣势。"
 },
 {
  "key": "slow",
  "name": "迟缓",
  "text": "如果你用这把武器命中一个生物并对它造成伤害，你可以使它的速度降低 10 尺，直到你的下个回合开始。如果该生物被具有这项精通属性的武器命中不止一次，速度降低的总量也不会超过 10 尺。"
 },
 {
  "key": "topple",
  "name": "击倒",
  "text": "如果你用这把武器命中一个生物，你可以迫使该生物进行一次体质豁免（DC 8 + 你进行这次攻击检定时所用的属性调整值 + 你的熟练加值）。豁免失败时，该生物陷入倒地状态。"
 },
 {
  "key": "vex",
  "name": "侵扰",
  "text": "如果你用这把武器命中一个生物并对它造成伤害，在你的下个回合结束前，你对该生物进行的下一次攻击检定具有优势。"
 }
];

export const PROPERTIES: FeatureText[] = [
 {
  "key": "ammunition",
  "name": "弹药",
  "text": "只有当你拥有可供发射的弹药时，你才能用具有弹药属性的武器进行远程攻击。所需弹药的种类写在该武器的射程旁边。每次攻击消耗一件弹药。取出弹药是攻击的一部分（装填单手武器时你需要一只空着的手）。战斗结束后，你可以花 1 分钟回收你在这场战斗中所用弹药的一半（向下取整），其余的都会损失。"
 },
 {
  "key": "finesse",
  "name": "灵巧",
  "text": "用灵巧武器进行攻击时，你可以自选用力量或敏捷调整值进行攻击检定和伤害掷骰。这两次掷骰必须使用同一个调整值。"
 },
 {
  "key": "heavy",
  "name": "重型",
  "text": "如果重型武器是近战武器而你的力量值不到 13，或者它是远程武器而你的敏捷值不到 13，你用它进行的攻击检定就具有劣势。"
 },
 {
  "key": "light",
  "name": "轻型",
  "text": "当你在自己的回合执行攻击动作并用轻型武器进行攻击时，你可以在同一回合稍后用一个附赠动作进行一次额外攻击。这次额外攻击必须用另一把轻型武器进行，并且不要把你的属性调整值加到这次额外攻击的伤害上，除非该调整值为负数。例如，你可以一手持短剑、一手持匕首，用攻击动作和一个附赠动作分别进行攻击，但除非你的力量或敏捷调整值为负数，否则不要把它加到附赠动作那次攻击的伤害掷骰上。"
 },
 {
  "key": "loading",
  "name": "装填",
  "text": "当你用一个动作、附赠动作或反应来发射装填武器时，无论你通常能进行几次攻击，你都只能用它发射一件弹药。"
 },
 {
  "key": "range",
  "name": "射程",
  "text": "具有射程的武器，会在弹药或投掷属性后面的括号里注明射程。射程列出两个数字：第一个是武器的正常射程（单位为尺），第二个是武器的远射程。攻击正常射程以外的目标时，你的攻击检定具有劣势。你无法攻击远射程以外的目标。"
 },
 {
  "key": "reach",
  "name": "触及",
  "text": "用触及武器进行攻击时，以及在判定你用它进行借机攻击的触及范围时，你的触及范围增加 5 尺。"
 },
 {
  "key": "thrown",
  "name": "投掷",
  "text": "如果一把武器具有投掷属性，你可以投掷这把武器来进行远程攻击，并且可以把拔出这把武器作为攻击的一部分。如果该武器是近战武器，进行攻击检定和伤害掷骰时，使用与你用它进行近战攻击时相同的属性调整值。"
 },
 {
  "key": "two-handed",
  "name": "双手",
  "text": "用双手武器进行攻击时，需要用双手持握。"
 },
 {
  "key": "versatile",
  "name": "多用",
  "text": "多用武器可以单手或双手使用。该属性旁边的括号里会注明一个伤害值。用双手持握该武器进行近战攻击时，它造成这个伤害值的伤害。"
 }
];
