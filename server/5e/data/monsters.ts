// 自动生成的文件（SRD 5.2.1 数据 + 本站的中文译文），不要手改。
import type { MonsterData } from '../../../shared/5e/types';

export const MONSTERS: MonsterData[] = [
 {
  "key": "air-elemental",
  "name": "气元素",
  "size": "大型",
  "type": "元素生物",
  "alignment": "绝对中立",
  "ac": 15,
  "acNote": "",
  "hp": 90,
  "hitDice": "12d10+24",
  "speed": "10 尺，飞行90 尺（悬浮）",
  "abilities": {
   "str": 14,
   "dex": 20,
   "con": 14,
   "int": 6,
   "wis": 10,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [
   "bludgeoning",
   "lightning",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [
   "poison",
   "thunder"
  ],
  "conditionImmune": [
   "exhaustion",
   "grappled",
   "paralyzed",
   "petrified",
   "poisoned",
   "prone",
   "restrained",
   "unconscious"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "原初语（气族语）",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "气态形体",
    "desc": "气元素可以进入其他生物的空间并停留在那里。它可以穿过窄至 1 英寸的空间，且无需为此花费额外的移动力。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "气元素进行两次雷鸣猛击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "雷鸣猛击",
    "desc": "近战攻击检定：+8，触及 10 尺。命中：14（2d8+5）雷鸣伤害。",
    "attack": 8,
    "damage": [
     {
      "dice": "2d8+5",
      "type": "thunder"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "旋风（充能 4～6）",
    "desc": "力量豁免：DC 13，气元素所在空间内的一个中型或更小的生物。失败：24（4d10+2）雷鸣伤害，并且目标被径直推离气元素至多 20 尺，陷入倒地状态。成功：仅受到一半伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "4d10+2",
      "type": "thunder"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "half"
    },
    "recharge": 4,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "prone"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "animated-armor",
  "name": "活化盔甲",
  "size": "中型",
  "type": "构装生物",
  "alignment": "无阵营",
  "ac": 18,
  "acNote": "",
  "hp": 33,
  "hitDice": "6d8+6",
  "speed": "25 尺",
  "abilities": {
   "str": 14,
   "dex": 11,
   "con": 13,
   "int": 1,
   "wis": 3,
   "cha": 1
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison",
   "psychic"
  ],
  "conditionImmune": [
   "charmed",
   "deafened",
   "exhaustion",
   "frightened",
   "paralyzed",
   "petrified",
   "poisoned"
  ],
  "senses": "盲视 60 尺，被动察觉 6",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "活化盔甲进行两次猛击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "猛击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）钝击伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "animated-flying-sword",
  "name": "活化飞剑",
  "size": "小型",
  "type": "构装生物",
  "alignment": "无阵营",
  "ac": 17,
  "acNote": "",
  "hp": 14,
  "hitDice": "4d6",
  "speed": "5 尺，飞行50 尺（悬浮）",
  "abilities": {
   "str": 12,
   "dex": 15,
   "con": 11,
   "int": 1,
   "wis": 5,
   "cha": 1
  },
  "saves": {
   "dex": 4
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison",
   "psychic"
  ],
  "conditionImmune": [
   "charmed",
   "deafened",
   "exhaustion",
   "frightened",
   "paralyzed",
   "petrified",
   "poisoned"
  ],
  "senses": "盲视 60 尺，被动察觉 7",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "劈砍",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：6（1d8+2）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "animated-rug-of-smothering",
  "name": "活化窒息毯",
  "size": "大型",
  "type": "构装生物",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 27,
  "hitDice": "5d10",
  "speed": "10 尺",
  "abilities": {
   "str": 17,
   "dex": 14,
   "con": 10,
   "int": 1,
   "wis": 3,
   "cha": 1
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison",
   "psychic"
  ],
  "conditionImmune": [
   "charmed",
   "deafened",
   "exhaustion",
   "frightened",
   "paralyzed",
   "petrified",
   "poisoned"
  ],
  "senses": "盲视 60 尺，被动察觉 6",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "窒息",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）钝击伤害。如果目标是中型或更小的生物，窒息毯可以不造成伤害，改为使它陷入被擒抱状态（逃脱 DC 13）。在擒抱结束前，目标陷入目盲和束缚状态，处于窒息中，并在其每个回合开始时受到 10（2d6+3）钝击伤害。窒息毯同一时间只能闷住一个生物。擒抱目标期间，窒息毯不能使用这个动作，窒息毯受到的伤害减半（向下取整），并且目标受到同样数值的伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "bludgeoning"
     },
     {
      "dice": "2d6+3",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "ankheg",
  "name": "掘地虫",
  "size": "大型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 45,
  "hitDice": "6d10+12",
  "speed": "30 尺，掘穴10 尺",
  "abilities": {
   "str": 17,
   "dex": 11,
   "con": 14,
   "int": 1,
   "wis": 13,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，震颤感知 60 尺，被动察觉 11",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "隧道挖掘",
    "desc": "掘地虫能以其掘穴速度的一半挖穿坚固的岩石，并在身后留下一条直径 10 尺的隧道。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5（如果目标正被掘地虫擒抱，则具有优势），触及 5 尺。命中：10（2d6+3）挥砍伤害外加 3（1d6）强酸伤害。如果目标是大型或更小的生物，它陷入被擒抱状态（逃脱 DC 13）。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     },
     {
      "dice": "1d6",
      "type": "acid"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "酸液喷射（充能 6）",
    "desc": "敏捷豁免：DC 12，长 30 尺、宽 5 尺的直线内的每个生物。失败：14（4d6）强酸伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "4d6",
      "type": "acid"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 12,
     "onSuccess": "half"
    },
    "recharge": 6,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "awakened-shrub",
  "name": "觉醒灌木",
  "size": "小型",
  "type": "植物",
  "alignment": "绝对中立",
  "ac": 9,
  "acNote": "",
  "hp": 10,
  "hitDice": "3d6",
  "speed": "20 尺",
  "abilities": {
   "str": 3,
   "dex": 8,
   "con": 11,
   "int": 10,
   "wis": 10,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [
   "piercing"
  ],
  "vulnerable": [
   "fire"
  ],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语以及另外一种语言",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+1，触及 5 尺。命中：1 点挥砍伤害。",
    "attack": 1,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "awakened-tree",
  "name": "觉醒树",
  "size": "巨型",
  "type": "植物",
  "alignment": "绝对中立",
  "ac": 13,
  "acNote": "",
  "hp": 59,
  "hitDice": "7d12+14",
  "speed": "20 尺",
  "abilities": {
   "str": 19,
   "dex": 6,
   "con": 15,
   "int": 10,
   "wis": 10,
   "cha": 7
  },
  "saves": {},
  "skills": {},
  "resist": [
   "bludgeoning",
   "piercing"
  ],
  "vulnerable": [
   "fire"
  ],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语以及另外一种语言",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "猛击",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：14（3d6+4）钝击伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "3d6+4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "axe-beak",
  "name": "斧喙鸟",
  "size": "大型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 19,
  "hitDice": "3d10+3",
  "speed": "50 尺",
  "abilities": {
   "str": 14,
   "dex": 12,
   "con": 12,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啄击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：6（1d8+2）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "azer-sentinel",
  "name": "火矮人哨兵",
  "size": "中型",
  "type": "元素生物",
  "alignment": "守序中立",
  "ac": 17,
  "acNote": "",
  "hp": 39,
  "hitDice": "6d8+12",
  "speed": "30 尺",
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 15,
   "int": 12,
   "wis": 13,
   "cha": 10
  },
  "saves": {
   "con": 4
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "fire",
   "poison"
  ],
  "conditionImmune": [
   "poisoned"
  ],
  "senses": "被动察觉 11",
  "languages": "原初语（火族语）",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "火焰灵光",
    "desc": "在火矮人的每个回合结束时，以火矮人为源的 5 尺散发内由它选择的每个生物受到 5（1d10）火焰伤害，除非火矮人处于失能状态。",
    "attack": null,
    "damage": [
     {
      "dice": "1d10",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "照明",
    "desc": "火矮人发出半径 10 尺的明亮光照，并在此范围外再发出 10 尺的微光。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "燃烧之锤",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：8（1d10+3）钝击伤害外加 3（1d6）火焰伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d10+3",
      "type": "bludgeoning"
     },
     {
      "dice": "1d6",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "bandit",
  "name": "强盗",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 12,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "30 尺",
  "abilities": {
   "str": 11,
   "dex": 12,
   "con": 12,
   "int": 10,
   "wis": 10,
   "cha": 10
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语、盗贼黑话",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "弯刀",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：4（1d6+1）挥砍伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d6+1",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "轻弩",
    "desc": "远程攻击检定：+3，射程 80/320 尺。命中：5（1d8+1）穿刺伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d8+1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "bandit-captain",
  "name": "强盗头目",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 15,
  "acNote": "",
  "hp": 52,
  "hitDice": "8d8+16",
  "speed": "30 尺",
  "abilities": {
   "str": 15,
   "dex": 16,
   "con": 14,
   "int": 14,
   "wis": 11,
   "cha": 14
  },
  "saves": {
   "str": 4,
   "dex": 5,
   "wis": 2
  },
  "skills": {
   "athletics": 4,
   "deception": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语、盗贼黑话",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "强盗头目进行两次攻击，可任意组合使用弯刀和手枪。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "弯刀",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "手枪",
    "desc": "远程攻击检定：+5，射程 30/90 尺。命中：8（1d10+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d10+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": [
   {
    "name": "招架",
    "desc": "触发：强盗头目在手持武器时被一次近战攻击检定命中。反应：强盗头目针对这次攻击的 AC 加 2，这可能使这次攻击落空。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ]
 },
 {
  "key": "barbed-devil",
  "name": "棘魔",
  "size": "中型",
  "type": "邪魔",
  "alignment": "守序邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 110,
  "hitDice": "13d8+52",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 16,
   "dex": 17,
   "con": 18,
   "int": 12,
   "wis": 14,
   "cha": 14
  },
  "saves": {
   "str": 6,
   "con": 7,
   "wis": 5,
   "cha": 5
  },
  "skills": {
   "deception": 5,
   "insight": 5,
   "perception": 8
  },
  "resist": [
   "cold"
  ],
  "vulnerable": [],
  "immune": [
   "fire",
   "poison"
  ],
  "conditionImmune": [
   "poisoned"
  ],
  "senses": "黑暗视觉 120 尺，被动察觉 18",
  "languages": "炼狱语；心灵感应 120 尺",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "倒刺外皮",
    "desc": "在它的每个回合开始时，棘魔对它正在擒抱的任何生物以及正在擒抱它的任何生物造成 5（1d10）穿刺伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "1d10",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "魔鬼复生",
    "desc": "如果棘魔在九层地狱之外死亡，它的躯体会在一阵硫磺烟雾中消失，并且它立即获得一具新躯体，以全部生命值在九层地狱的某处复活。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "魔法抗性",
    "desc": "棘魔进行对抗法术和其他魔法效应的豁免检定时具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "棘魔进行一次爪击攻击和一次尾击攻击，或者进行两次投掷火焰攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：10（2d6+3）穿刺伤害。如果目标是大型或更小的生物，它被棘魔的双爪擒抱，陷入被擒抱状态（逃脱 DC 13）。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "尾击",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：14（2d10+3）挥砍伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d10+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "投掷火焰",
    "desc": "远程攻击检定：+5，射程 150 尺。命中：17（5d6）火焰伤害。如果目标是未被穿戴或携带的易燃物体，它开始燃烧。",
    "attack": 5,
    "damage": [
     {
      "dice": "5d6",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "basilisk",
  "name": "石化蜥蜴",
  "size": "中型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 15,
  "acNote": "",
  "hp": 52,
  "hitDice": "8d8+16",
  "speed": "20 尺",
  "abilities": {
   "str": 16,
   "dex": 8,
   "con": 15,
   "int": 2,
   "wis": 8,
   "cha": 7
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 9",
  "languages": "",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）穿刺伤害外加 7（2d6）毒素伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "piercing"
     },
     {
      "dice": "2d6",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "石化凝视（充能 4～6）",
    "desc": "体质豁免：DC 12，30 尺锥形内的每个生物。如果石化蜥蜴在这片锥形区域中看到自己的倒影，它自己也必须进行这次豁免。第一次失败：目标陷入束缚状态；如果它在自己的下个回合结束时仍处于束缚状态，就重复这次豁免，成功则结束自身的这个效应。第二次失败：目标改为陷入石化状态，不再处于束缚状态。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": 4,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "restrained"
   }
  ],
  "reactions": []
 },
 {
  "key": "bearded-devil",
  "name": "须魔",
  "size": "中型",
  "type": "邪魔",
  "alignment": "守序邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 58,
  "hitDice": "9d8+18",
  "speed": "30 尺",
  "abilities": {
   "str": 16,
   "dex": 15,
   "con": 15,
   "int": 9,
   "wis": 11,
   "cha": 14
  },
  "saves": {
   "str": 5,
   "con": 4,
   "cha": 4
  },
  "skills": {},
  "resist": [
   "cold"
  ],
  "vulnerable": [],
  "immune": [
   "fire",
   "poison"
  ],
  "conditionImmune": [
   "frightened",
   "poisoned"
  ],
  "senses": "黑暗视觉 120 尺，被动察觉 10",
  "languages": "炼狱语；心灵感应 120 尺",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "魔法抗性",
    "desc": "须魔进行对抗法术和其他魔法效应的豁免检定时具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "须魔进行一次胡须攻击和一次炼狱长柄刀攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "胡须",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）穿刺伤害，并且目标陷入中毒状态，直到须魔的下个回合开始。在这次中毒结束前，目标无法恢复生命值。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "炼狱长柄刀",
    "desc": "近战攻击检定：+5，触及 10 尺。命中：8（1d10+3）挥砍伤害。如果目标是生物且身上还没有炼狱伤口，它会承受以下效应。体质豁免：DC 12。失败：目标受到一处炼狱伤口。带有伤口期间，目标在其每个回合开始时失去 5（1d10）生命值。伤口会在 1 分钟后、有法术为目标恢复生命值后，或者目标或其 5 尺内的一个生物用一个动作为伤口止血后愈合；止血需要通过一次 DC 12 的感知（医药）检定。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d10+3",
      "type": "slashing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "berserker",
  "name": "狂战士",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 13,
  "acNote": "",
  "hp": 67,
  "hitDice": "9d8+27",
  "speed": "30 尺",
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 17,
   "int": 9,
   "wis": 11,
   "cha": 9
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "浴血狂乱",
    "desc": "处于浴血状态时，狂战士的攻击检定和豁免检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "巨斧",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：9（1d12+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d12+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "black-dragon-wyrmling",
  "name": "黑龙幼龙",
  "size": "中型",
  "type": "龙",
  "alignment": "混乱邪恶",
  "ac": 17,
  "acNote": "",
  "hp": 33,
  "hitDice": "6d8+6",
  "speed": "30 尺，飞行60 尺，游泳30 尺",
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 13,
   "int": 10,
   "wis": 11,
   "cha": 13
  },
  "saves": {
   "dex": 4,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "acid"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 14",
  "languages": "龙语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "幼龙可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "幼龙进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）挥砍伤害外加 2（1d4）强酸伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "slashing"
     },
     {
      "dice": "1d4",
      "type": "acid"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "强酸吐息（充能 5～6）",
    "desc": "敏捷豁免：DC 11，长 15 尺、宽 5 尺的直线内的每个生物。失败：22（5d8）强酸伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "5d8",
      "type": "acid"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 11,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "black-pudding",
  "name": "黑布丁怪",
  "size": "大型",
  "type": "泥怪",
  "alignment": "无阵营",
  "ac": 7,
  "acNote": "",
  "hp": 68,
  "hitDice": "8d10+24",
  "speed": "20 尺，攀爬20 尺",
  "abilities": {
   "str": 16,
   "dex": 5,
   "con": 16,
   "int": 1,
   "wis": 6,
   "cha": 1
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "acid",
   "cold",
   "lightning",
   "slashing"
  ],
  "conditionImmune": [
   "charmed",
   "deafened",
   "exhaustion",
   "frightened",
   "grappled",
   "prone",
   "restrained"
  ],
  "senses": "盲视 60 尺，被动察觉 8",
  "languages": "",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [
   {
    "name": "无定形",
    "desc": "布丁怪可以穿过窄至 1 英寸的空间，且无需为此花费额外的移动力。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "腐蚀形体",
    "desc": "以近战攻击检定命中布丁怪的生物受到 4（1d8）强酸伤害。非魔法弹药在命中布丁怪并造成伤害后立即被摧毁。任何非魔法武器在对布丁怪造成伤害并与之接触后，立即在攻击检定上承受累计 -1 的减值。如果减值达到 -5，该武器被摧毁。对该武器施展《修复术》法术可以移除这个减值。布丁怪可以在 1 分钟内蚀穿 2 尺厚的非魔法木头或金属。",
    "attack": null,
    "damage": [
     {
      "dice": "1d8",
      "type": "acid"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蛛行",
    "desc": "布丁怪可以攀爬困难的表面，包括倒挂在天花板上爬行，且无需进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "溶解伪足",
    "desc": "近战攻击检定：+5，触及 10 尺。命中：17（4d6+3）强酸伤害。目标穿着的非魔法护甲提供的 AC 承受 -1 的减值。如果减值使该护甲的 AC 降到 10，护甲被摧毁。对该护甲施展《修复术》法术可以移除这个减值。",
    "attack": 5,
    "damage": [
     {
      "dice": "4d6+3",
      "type": "acid"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": [
   {
    "name": "分裂",
    "desc": "触发：布丁怪的体型为大型或中型且生命值为 10 或以上时，它进入浴血状态，或者承受闪电或挥砍伤害。反应：布丁怪分裂成两只新的黑布丁怪。每只新布丁怪的体型都比原来的布丁怪小一级，并在原布丁怪的先攻顺序上行动。原布丁怪的生命值在两只新布丁怪之间平分（向下取整）。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ]
 },
 {
  "key": "blink-dog",
  "name": "闪烁犬",
  "size": "中型",
  "type": "精类",
  "alignment": "守序善良",
  "ac": 13,
  "acNote": "",
  "hp": 22,
  "hitDice": "4d8+4",
  "speed": "40 尺",
  "abilities": {
   "str": 12,
   "dex": 17,
   "con": 12,
   "int": 10,
   "wis": 13,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "闪烁犬语；听得懂精灵语和木族语但不会说",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：5（1d4+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "传送（充能 4～6）",
    "desc": "闪烁犬传送至多 40 尺，到达一处它能看见的未被占据的空间。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": 4,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "blue-dragon-wyrmling",
  "name": "蓝龙幼龙",
  "size": "中型",
  "type": "龙",
  "alignment": "守序邪恶",
  "ac": 17,
  "acNote": "",
  "hp": 65,
  "hitDice": "10d8+20",
  "speed": "30 尺，掘穴15 尺，飞行60 尺",
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 15,
   "int": 12,
   "wis": 11,
   "cha": 15
  },
  "saves": {
   "dex": 2,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "stealth": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "lightning"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 14",
  "languages": "龙语",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "幼龙进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：8（1d10+3）挥砍伤害外加 3（1d6）闪电伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d10+3",
      "type": "slashing"
     },
     {
      "dice": "1d6",
      "type": "lightning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "闪电吐息（充能 5～6）",
    "desc": "敏捷豁免：DC 12，长 30 尺、宽 5 尺的直线内的每个生物。失败：21（6d6）闪电伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "6d6",
      "type": "lightning"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 12,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "brass-dragon-wyrmling",
  "name": "黄铜龙幼龙",
  "size": "中型",
  "type": "龙",
  "alignment": "混乱善良",
  "ac": 15,
  "acNote": "",
  "hp": 22,
  "hitDice": "4d8+4",
  "speed": "30 尺，掘穴15 尺，飞行60 尺",
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 13,
   "int": 10,
   "wis": 11,
   "cha": 13
  },
  "saves": {
   "dex": 2,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "stealth": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "fire"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 14",
  "languages": "龙语",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：7（1d10+2）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d10+2",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "火焰吐息（充能 5～6）",
    "desc": "敏捷豁免：DC 11，长 20 尺、宽 5 尺的直线内的每个生物。失败：14（4d6）火焰伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "4d6",
      "type": "fire"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 11,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "睡眠吐息",
    "desc": "体质豁免：DC 11，15 尺锥形内的每个生物。失败：目标陷入失能状态，直到它的下个回合结束，届时它重复这次豁免。第二次失败：目标陷入昏迷状态，持续 1 分钟。如果目标受到伤害，或者其 5 尺内的一个生物用一个动作唤醒它，这个效应对该目标结束。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "con",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "incapacitated"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "bronze-dragon-wyrmling",
  "name": "青铜龙幼龙",
  "size": "中型",
  "type": "龙",
  "alignment": "守序善良",
  "ac": 15,
  "acNote": "",
  "hp": 39,
  "hitDice": "6d8+12",
  "speed": "30 尺，飞行60 尺，游泳30 尺",
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 15,
   "int": 12,
   "wis": 11,
   "cha": 15
  },
  "saves": {
   "dex": 2,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "stealth": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "lightning"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 14",
  "languages": "龙语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "幼龙可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "幼龙进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：8（1d10+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d10+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "闪电吐息（充能 5～6）",
    "desc": "敏捷豁免：DC 12，长 40 尺、宽 5 尺的直线内的每个生物。失败：16（3d10）闪电伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "3d10",
      "type": "lightning"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 12,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "斥退吐息",
    "desc": "力量豁免：DC 12，30 尺锥形内的每个生物。失败：目标被径直推离幼龙至多 30 尺，并陷入倒地状态。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "str",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "prone"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "bugbear-stalker",
  "name": "熊地精潜猎者",
  "size": "中型",
  "type": "精类",
  "alignment": "混乱邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 65,
  "hitDice": "10d8+20",
  "speed": "30 尺",
  "abilities": {
   "str": 17,
   "dex": 14,
   "con": 14,
   "int": 11,
   "wis": 12,
   "cha": 11
  },
  "saves": {
   "con": 4,
   "wis": 3
  },
  "skills": {
   "stealth": 6,
   "survival": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 11",
  "languages": "通用语、地精语",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "掳掠",
    "desc": "熊地精移动它正在擒抱的生物时，无需花费额外的移动力。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "熊地精进行两次标枪或钉头锤攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "标枪",
    "desc": "近战或远程攻击检定：+5，触及 10 尺或射程 30/120 尺。命中：13（3d6+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "3d6+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "钉头锤",
    "desc": "近战攻击检定：+5（如果目标正被熊地精擒抱，则具有优势），触及 10 尺。命中：12（2d8+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d8+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "快速擒抱",
    "desc": "敏捷豁免：DC 13，熊地精 10 尺内一个它能看见的中型或更小的生物。失败：目标陷入被擒抱状态（逃脱 DC 13）。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "dex",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "grappled"
   }
  ],
  "reactions": []
 },
 {
  "key": "bugbear-warrior",
  "name": "熊地精战士",
  "size": "中型",
  "type": "精类",
  "alignment": "混乱邪恶",
  "ac": 14,
  "acNote": "",
  "hp": 33,
  "hitDice": "6d8+6",
  "speed": "30 尺",
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 13,
   "int": 8,
   "wis": 11,
   "cha": 9
  },
  "saves": {},
  "skills": {
   "stealth": 6,
   "survival": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "通用语、地精语",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "掳掠",
    "desc": "熊地精移动它正在擒抱的生物时，无需花费额外的移动力。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "擒拿",
    "desc": "近战攻击检定：+4，触及 10 尺。命中：9（2d6+2）钝击伤害。如果目标是中型或更小的生物，它陷入被擒抱状态（逃脱 DC 12）。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d6+2",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "轻锤",
    "desc": "近战或远程攻击检定：+4（如果目标正被熊地精擒抱，则具有优势），触及 10 尺或射程 20/60 尺。命中：9（3d4+2）钝击伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "3d4+2",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "bulette",
  "name": "土鲨",
  "size": "大型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 17,
  "acNote": "",
  "hp": 94,
  "hitDice": "9d10+45",
  "speed": "40 尺，掘穴40 尺",
  "abilities": {
   "str": 19,
   "dex": 11,
   "con": 21,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 6
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，震颤感知 120 尺，被动察觉 16",
  "languages": "",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "土鲨进行两次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：17（2d12+4）穿刺伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d12+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "致命飞跃",
    "desc": "土鲨花费 5 尺移动力，跳到 15 尺内一处有一个或多个大型或更小生物的空间。敏捷豁免：DC 15，土鲨落点空间内的每个生物。失败：19（3d12）钝击伤害，并且目标陷入倒地状态。成功：伤害减半，并且目标被径直推离土鲨 5 尺。",
    "attack": null,
    "damage": [
     {
      "dice": "3d12",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 15,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "prone"
   }
  ],
  "bonusActions": [
   {
    "name": "跳跃",
    "desc": "土鲨花费 10 尺移动力，跳跃至多 30 尺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "centaur-trooper",
  "name": "半人马士兵",
  "size": "大型",
  "type": "精类",
  "alignment": "中立善良",
  "ac": 16,
  "acNote": "",
  "hp": 45,
  "hitDice": "6d10+12",
  "speed": "50 尺",
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 14,
   "int": 9,
   "wis": 13,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "athletics": 6,
   "perception": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 13",
  "languages": "精灵语、木族语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "半人马进行两次攻击，可任意组合使用长矛或长弓。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "长矛",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：9（1d10+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d10+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "长弓",
    "desc": "远程攻击检定：+4，射程 150/600 尺。命中：6（1d8+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "践踏冲锋（充能 5～6）",
    "desc": "半人马移动至多等同其速度的距离，这次移动不会引发借机攻击，并且它可以穿过中型或更小生物的空间。半人马进入其空间的每个生物各成为以下效应的目标一次。力量豁免：DC 14。失败：7（1d6+4）钝击伤害，并且目标陷入倒地状态。",
    "attack": null,
    "damage": [
     {
      "dice": "1d6+4",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 14,
     "onSuccess": "none"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "prone"
   }
  ],
  "reactions": []
 },
 {
  "key": "chuul",
  "name": "丘尔",
  "size": "大型",
  "type": "异怪",
  "alignment": "混乱邪恶",
  "ac": 16,
  "acNote": "",
  "hp": 76,
  "hitDice": "9d10+27",
  "speed": "30 尺，游泳30 尺",
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 16,
   "int": 5,
   "wis": 11,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "听得懂深潜语但不会说",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "丘尔可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "感知魔法",
    "desc": "丘尔能感知自身 120 尺内的魔法。除此之外，这项特性的运作方式与《侦测魔法》法术相同，但它本身不具有魔法性质。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "丘尔进行两次钳击攻击，并使用麻痹触手。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "钳击",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：9（1d10+4）钝击伤害。如果目标是大型或更小的生物，它被丘尔两只钳子中的一只擒抱，陷入被擒抱状态（逃脱 DC 14）。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d10+4",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 14,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "麻痹触手",
    "desc": "体质豁免：DC 13，一个正被丘尔擒抱的生物。失败：目标陷入中毒状态，并在其每个回合结束时重复这次豁免，成功则结束自身的这个效应。1 分钟后，它自动成功。处于中毒状态期间，目标也陷入麻痹状态。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "con",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "poisoned"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "cockatrice",
  "name": "鸡蛇",
  "size": "小型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 22,
  "hitDice": "5d6+5",
  "speed": "20 尺，飞行40 尺",
  "abilities": {
   "str": 6,
   "dex": 12,
   "con": 12,
   "int": 2,
   "wis": 13,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "petrified"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 11",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "石化啮咬",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：3（1d4+1）穿刺伤害。如果目标是生物，它会承受以下效应。体质豁免：DC 11。第一次失败：目标陷入束缚状态。如果目标在它的下个回合结束时仍处于束缚状态，就重复这次豁免，成功则结束自身的这个效应。第二次失败：目标改为陷入石化状态（不再处于束缚状态），持续 24 小时。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d4+1",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "restrained"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "commoner",
  "name": "平民",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 10,
  "acNote": "",
  "hp": 4,
  "hitDice": "1d8",
  "speed": "30 尺",
  "abilities": {
   "str": 10,
   "dex": 10,
   "con": 10,
   "int": 10,
   "wis": 10,
   "cha": 10
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "训练",
    "desc": "平民熟练一项由 GM 选择的技能，并且每当它使用该技能进行属性检定时都具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "短棒",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：2（1d4）钝击伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "1d4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "copper-dragon-wyrmling",
  "name": "赤铜龙幼龙",
  "size": "中型",
  "type": "龙",
  "alignment": "混乱善良",
  "ac": 16,
  "acNote": "",
  "hp": 22,
  "hitDice": "4d8+4",
  "speed": "30 尺，攀爬30 尺，飞行60 尺",
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 13,
   "int": 14,
   "wis": 11,
   "cha": 13
  },
  "saves": {
   "dex": 3,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "stealth": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "acid"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 14",
  "languages": "龙语",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：7（1d10+2）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d10+2",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "强酸吐息（充能 5～6）",
    "desc": "敏捷豁免：DC 11，长 20 尺、宽 5 尺的直线内的每个生物。失败：18（4d8）强酸伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "4d8",
      "type": "acid"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 11,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "减速吐息",
    "desc": "体质豁免：DC 11，15 尺锥形内的每个生物。失败：目标不能执行反应；它的速度减半；并且它在自己的回合内只能执行一个动作或一个附赠动作，不能两者都执行。这个效应持续到它的下个回合结束。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "con",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "couatl",
  "name": "羽蛇",
  "size": "中型",
  "type": "天界生物",
  "alignment": "守序善良",
  "ac": 19,
  "acNote": "",
  "hp": 60,
  "hitDice": "8d8+24",
  "speed": "30 尺，飞行90 尺",
  "abilities": {
   "str": 16,
   "dex": 20,
   "con": 17,
   "int": 18,
   "wis": 20,
   "cha": 18
  },
  "saves": {
   "con": 5,
   "wis": 7
  },
  "skills": {},
  "resist": [
   "bludgeoning",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [
   "psychic",
   "radiant"
  ],
  "conditionImmune": [],
  "senses": "真实视觉 120 尺，被动察觉 15",
  "languages": "所有语言；心灵感应 120 尺",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [
   {
    "name": "心灵屏障",
    "desc": "任何手段都无法读取羽蛇的思想；其他生物只有在羽蛇允许时，才能与它进行心灵感应交流。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：11（1d12+5）穿刺伤害，并且目标陷入中毒状态，直到羽蛇的下个回合结束。",
    "attack": 7,
    "damage": [
     {
      "dice": "1d12+5",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "绞杀",
    "desc": "力量豁免：DC 15，羽蛇 5 尺内一个它能看见的中型或更小的生物。失败：8（1d6+5）钝击伤害。目标陷入被擒抱状态（逃脱 DC 13），并且在擒抱结束前陷入束缚状态。",
    "attack": null,
    "damage": [
     {
      "dice": "1d6+5",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 15,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "羽蛇施展下列法术之一，无需任何法术成分，以感知为施法属性（法术豁免 DC 15）：随意：《侦测善恶》、《侦测魔法》、《侦测思想》、《形体变化》（只能变为野兽或类人生物形态，不会从这个法术获得临时生命值，并且维持这个法术既不需要专注，也不需要临时生命值）；每日各 1 次：《造粮术》、《托梦术》、《高等复原术》、《探知术》、《睡眠术》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "神圣援助（每日 2 次）",
    "desc": "羽蛇施展《祝福术》、《次级复原术》或《庇护术》，无需任何法术成分，并使用与施法相同的施法属性。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 2,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "swarm-of-crawling-claws",
  "name": "爬行断手群",
  "size": "中型",
  "type": "微型不死生物集群",
  "alignment": "中立邪恶",
  "ac": 12,
  "acNote": "",
  "hp": 49,
  "hitDice": "11d8",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 14,
   "dex": 14,
   "con": 11,
   "int": 5,
   "wis": 10,
   "cha": 4
  },
  "saves": {},
  "skills": {},
  "resist": [
   "bludgeoning",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [
   "necrotic",
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "exhaustion",
   "frightened",
   "grappled",
   "incapacitated",
   "paralyzed",
   "petrified",
   "poisoned",
   "prone",
   "restrained",
   "stunned"
  ],
  "senses": "盲视 30 尺，被动察觉 10",
  "languages": "听得懂通用语但不会说",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "集群",
    "desc": "集群可以占据其他生物的空间，反之亦然；集群可以穿过任何足以让微型生物通过的开口。集群无法恢复生命值，也无法获得临时生命值。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "攫抓群手",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：20（4d8+2）暗蚀伤害；如果集群处于浴血状态，则改为 11（2d8+2）暗蚀伤害。如果目标是中型或更小的生物，它陷入倒地状态。",
    "attack": 4,
    "damage": [
     {
      "dice": "4d8+2",
      "type": "necrotic"
     },
     {
      "dice": "2d8+2",
      "type": "necrotic",
      "when": "or"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "cultist",
  "name": "邪教徒",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 12,
  "acNote": "",
  "hp": 9,
  "hitDice": "2d8",
  "speed": "30 尺",
  "abilities": {
   "str": 11,
   "dex": 12,
   "con": 10,
   "int": 10,
   "wis": 11,
   "cha": 10
  },
  "saves": {
   "wis": 2
  },
  "skills": {
   "deception": 2,
   "religion": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "仪式镰刀",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：3（1d4+1）挥砍伤害外加 1 点暗蚀伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d4+1",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "cultist-fanatic",
  "name": "狂信徒",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 13,
  "acNote": "",
  "hp": 44,
  "hitDice": "8d8+8",
  "speed": "30 尺",
  "abilities": {
   "str": 11,
   "dex": 14,
   "con": 12,
   "int": 10,
   "wis": 14,
   "cha": 13
  },
  "saves": {
   "wis": 4
  },
  "skills": {
   "deception": 3,
   "persuasion": 3,
   "religion": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "通用语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "契约之刃",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：6（1d8+2）挥砍伤害外加 7（2d6）暗蚀伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "slashing"
     },
     {
      "dice": "2d6",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "狂信徒施展下列法术之一，以感知为施法属性（法术豁免 DC 12，法术攻击加值 +4）：随意：《光亮术》、《奇术》；每日 2 次：《命令术》；每日 1 次：《人类定身术》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "灵体武器（每日 2 次）",
    "desc": "狂信徒施展《灵体武器》法术，使用与施法相同的施法属性。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 2,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "darkmantle",
  "name": "暗幕怪",
  "size": "小型",
  "type": "异怪",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 22,
  "hitDice": "5d6+5",
  "speed": "10 尺，飞行30 尺",
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "stealth": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 60 尺，被动察觉 10",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "挤压",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）钝击伤害，并且暗幕怪吸附在目标身上。如果目标是中型或更小的生物，且暗幕怪的这次攻击检定具有优势，暗幕怪会罩住目标；暗幕怪以这种方式吸附期间，目标陷入目盲状态并处于窒息中。吸附在目标身上期间，暗幕怪只能攻击该目标，但它的攻击检定具有优势。它的速度变为 0，无法从任何速度加值中获益，并随目标一同移动。生物可以用一个动作尝试把暗幕怪从自己身上扯下来，这需要通过一次 DC 13 的力量（运动）检定。暗幕怪可以在自己的回合内花费 5 尺移动力脱离目标。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "黑暗灵光（每日 1 次）",
    "desc": "魔法黑暗充满以暗幕怪为源的 15 尺散发。只要暗幕怪对其保持专注，这个效应就会持续，最长 10 分钟。黑暗视觉无法穿透这片区域，任何光都无法照亮它。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 1,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "death-dog",
  "name": "死亡犬",
  "size": "中型",
  "type": "怪兽",
  "alignment": "中立邪恶",
  "ac": 12,
  "acNote": "",
  "hp": 39,
  "hitDice": "6d8+12",
  "speed": "40 尺",
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 14,
   "int": 3,
   "wis": 13,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "blinded",
   "charmed",
   "deafened",
   "frightened",
   "stunned",
   "unconscious"
  ],
  "senses": "黑暗视觉 120 尺，被动察觉 15",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "死亡犬进行两次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）穿刺伤害。如果目标是生物，它会承受以下效应。体质豁免：DC 12。第一次失败：目标陷入中毒状态。处于中毒状态期间，目标的生命值上限不会在完成长休时恢复正常，并且每经过 24 小时，它就重复一次这个豁免，成功则结束自身的这个效应。后续失败：处于中毒状态的目标的生命值上限降低 5（1d10）。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "poisoned"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "doppelganger",
  "name": "变形怪",
  "size": "中型",
  "type": "怪兽",
  "alignment": "绝对中立",
  "ac": 14,
  "acNote": "",
  "hp": 52,
  "hitDice": "8d8+16",
  "speed": "30 尺",
  "abilities": {
   "str": 11,
   "dex": 18,
   "con": 14,
   "int": 11,
   "wis": 12,
   "cha": 14
  },
  "saves": {},
  "skills": {
   "deception": 6,
   "insight": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "charmed"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 11",
  "languages": "通用语以及另外三种语言",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "变形怪进行两次猛击攻击，并在可用时使用诡异面容。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "猛击",
    "desc": "近战攻击检定：+6（在每场战斗的第一轮中具有优势），触及 5 尺。命中：11（2d6+4）钝击伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "读心",
    "desc": "变形怪施展《侦测思想》，无需任何法术成分，以魅力为施法属性（法术豁免 DC 12）。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "诡异面容（充能 6）",
    "desc": "感知豁免：DC 12，以变形怪为源的 15 尺散发内每个能看见变形怪的生物。失败：目标陷入恐慌状态，并在其每个回合结束时重复这次豁免，成功则结束自身的这个效应。1 分钟后，它自动成功。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": 6,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "frightened"
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "变形怪变形为一个中型或小型的类人生物，或者变回它的真实形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备都不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "dretch",
  "name": "劣魔",
  "size": "小型",
  "type": "邪魔",
  "alignment": "混乱邪恶",
  "ac": 11,
  "acNote": "",
  "hp": 18,
  "hitDice": "4d6+4",
  "speed": "20 尺",
  "abilities": {
   "str": 12,
   "dex": 11,
   "con": 12,
   "int": 5,
   "wis": 8,
   "cha": 3
  },
  "saves": {},
  "skills": {},
  "resist": [
   "cold",
   "fire",
   "lightning"
  ],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 9",
  "languages": "深渊语；心灵感应 60 尺（只对听得懂深渊语的生物有效）",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：4（1d6+1）挥砍伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d6+1",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "恶臭之云（每日 1 次）",
    "desc": "体质豁免：DC 11，以劣魔为源的 10 尺散发内的每个生物。失败：目标陷入中毒状态，直到它的下个回合结束。处于中毒状态期间，该生物在自己的回合内只能执行一个动作或一个附赠动作，不能两者都执行，并且不能执行反应。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "con",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": 1,
    "multiattack": false,
    "saveCondition": "poisoned"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "druid",
  "name": "德鲁伊",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 13,
  "acNote": "",
  "hp": 44,
  "hitDice": "8d8+8",
  "speed": "30 尺",
  "abilities": {
   "str": 10,
   "dex": 12,
   "con": 13,
   "int": 12,
   "wis": 16,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "medicine": 5,
   "nature": 3,
   "perception": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 15",
  "languages": "通用语、德鲁伊语、木族语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "德鲁伊进行两次攻击，可任意组合使用藤杖或翠绿微芒。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "藤杖",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）钝击伤害外加 2（1d4）毒素伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "bludgeoning"
     },
     {
      "dice": "1d4",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "翠绿微芒",
    "desc": "远程攻击检定：+5，射程 90 尺。命中：10（3d6）光耀伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "3d6",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "德鲁伊施展下列法术之一，以感知为施法属性（法术豁免 DC 13）：随意：《德鲁伊伎俩》、《动物交谈》；每日各 2 次：《纠缠术》、《雷鸣波》；每日各 1 次：《动物信使》、《大步奔行》、《月华之光》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "dryad",
  "name": "树精",
  "size": "中型",
  "type": "精类",
  "alignment": "绝对中立",
  "ac": 16,
  "acNote": "",
  "hp": 22,
  "hitDice": "5d8",
  "speed": "30 尺",
  "abilities": {
   "str": 10,
   "dex": 12,
   "con": 11,
   "int": 14,
   "wis": 15,
   "cha": 18
  },
  "saves": {},
  "skills": {
   "perception": 4,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "精灵语、木族语",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "魔法抗性",
    "desc": "树精进行对抗法术和其他魔法效应的豁免检定时具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "与野兽和植物交谈",
    "desc": "树精可以与野兽和植物交流，如同彼此共通一种语言。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "树精进行一次藤蔓鞭笞或荆棘爆发攻击，并且可以使用施法来施展《魅惑怪物》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "藤蔓鞭笞",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：8（1d8+4）挥砍伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d8+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "荆棘爆发",
    "desc": "远程攻击检定：+6，射程 60 尺。命中：7（1d6+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "树精施展下列法术之一，无需材料成分，以魅力为施法属性（法术豁免 DC 14）：随意：《动物交友》、《魅惑怪物》（持续 24 小时；如果树精再次施展这个法术则提前结束）、《德鲁伊伎俩》；每日各 1 次：《纠缠术》、《行动无踪》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "树跃",
    "desc": "如果树精位于一棵大型或更大的树 5 尺内，它就传送到另一棵大型或更大的树 5 尺内的一处未被占据的空间，这棵树必须位于前一棵树 60 尺内。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "earth-elemental",
  "name": "土元素",
  "size": "大型",
  "type": "元素生物",
  "alignment": "绝对中立",
  "ac": 17,
  "acNote": "",
  "hp": 147,
  "hitDice": "14d10+70",
  "speed": "30 尺，掘穴30 尺",
  "abilities": {
   "str": 20,
   "dex": 8,
   "con": 20,
   "int": 5,
   "wis": 10,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [
   "thunder"
  ],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "paralyzed",
   "petrified",
   "poisoned",
   "unconscious"
  ],
  "senses": "黑暗视觉 60 尺，震颤感知 60 尺，被动察觉 10",
  "languages": "原初语（土族语）",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "穿地滑行",
    "desc": "土元素可以在非魔法、未经加工的泥土和岩石中掘穴穿行。这样做时，土元素不会扰动它所穿过的物质。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "攻城怪物",
    "desc": "土元素对物体和建筑造成双倍伤害。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "土元素进行两次攻击，可任意组合使用猛击或投射岩石。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "猛击",
    "desc": "近战攻击检定：+8，触及 10 尺。命中：14（2d8+5）钝击伤害。",
    "attack": 8,
    "damage": [
     {
      "dice": "2d8+5",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "投射岩石",
    "desc": "远程攻击检定：+8，射程 60 尺。命中：8（1d6+5）钝击伤害。如果目标是大型或更小的生物，它陷入倒地状态。",
    "attack": 8,
    "damage": [
     {
      "dice": "1d6+5",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "ettercap",
  "name": "蛛化人",
  "size": "中型",
  "type": "怪兽",
  "alignment": "中立邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 44,
  "hitDice": "8d8+8",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 14,
   "dex": 15,
   "con": 13,
   "int": 7,
   "wis": 12,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 3,
   "stealth": 4,
   "survival": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "蛛行",
    "desc": "蛛化人可以攀爬困难的表面，包括倒挂在天花板上爬行，且无需进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蛛网行者",
    "desc": "蛛化人无视蛛网造成的移动限制，并且知道与它接触同一张蛛网的任何其他生物的位置。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "蛛化人进行一次啮咬攻击和一次爪击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）穿刺伤害外加 2（1d4）毒素伤害，并且目标陷入中毒状态，直到蛛化人的下个回合开始。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     },
     {
      "dice": "1d4",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：7（2d4+2）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d4+2",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蛛丝（充能 5～6）",
    "desc": "敏捷豁免：DC 12，蛛化人 30 尺内一个它能看见的大型或更小的生物。失败：目标陷入束缚状态，直到蛛网被摧毁（AC 10；生命值 5；对火焰伤害易伤；免疫钝击、毒素和心灵伤害）。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "dex",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "restrained"
   }
  ],
  "bonusActions": [
   {
    "name": "收线",
    "desc": "蛛化人把自身 30 尺内一个被它的蛛丝束缚的生物径直拉向自己至多 25 尺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "ettin",
  "name": "双头巨人",
  "size": "大型",
  "type": "巨人",
  "alignment": "混乱邪恶",
  "ac": 12,
  "acNote": "",
  "hp": 85,
  "hitDice": "10d10+30",
  "speed": "40 尺",
  "abilities": {
   "str": 21,
   "dex": 8,
   "con": 17,
   "int": 6,
   "wis": 10,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "blinded",
   "charmed",
   "deafened",
   "frightened",
   "stunned",
   "unconscious"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "巨人语",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "双头巨人进行一次战斧攻击和一次钉头锤攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "战斧",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：14（2d8+5）挥砍伤害。如果目标是大型或更小的生物，它陷入倒地状态。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d8+5",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "钉头锤",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：14（2d8+5）穿刺伤害，并且目标在它的下个回合结束前进行的下一次攻击检定具有劣势。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d8+5",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "fire-elemental",
  "name": "火元素",
  "size": "大型",
  "type": "元素生物",
  "alignment": "绝对中立",
  "ac": 13,
  "acNote": "",
  "hp": 93,
  "hitDice": "11d10+33",
  "speed": "50 尺",
  "abilities": {
   "str": 10,
   "dex": 17,
   "con": 16,
   "int": 6,
   "wis": 10,
   "cha": 7
  },
  "saves": {},
  "skills": {},
  "resist": [
   "bludgeoning",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [
   "fire",
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "grappled",
   "paralyzed",
   "petrified",
   "poisoned",
   "prone",
   "restrained",
   "unconscious"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "原初语（火族语）",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "火焰灵光",
    "desc": "在火元素的每个回合结束时，以火元素为源的 10 尺散发内的每个生物受到 5（1d10）火焰伤害。散发内的生物和易燃物体开始燃烧。",
    "attack": null,
    "damage": [
     {
      "dice": "1d10",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "火焰形体",
    "desc": "火元素可以穿过窄至 1 英寸的空间，且无需为此花费额外的移动力；它也可以进入其他生物的空间并停留在那里。它在一个回合内第一次进入某个生物的空间时，该生物受到 5（1d10）火焰伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "1d10",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "照明",
    "desc": "火元素发出半径 30 尺的明亮光照，并在此范围外再发出 30 尺的微光。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "畏水",
    "desc": "火元素在水中每移动 5 尺，或者每有 1 加仑水泼到它身上，它就受到 3（1d6）冷冻伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "1d6",
      "type": "cold"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "火元素进行两次灼烧攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "灼烧",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：10（2d6+3）火焰伤害。如果目标是生物或易燃物体，它开始燃烧。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "flesh-golem",
  "name": "血肉魔像",
  "size": "中型",
  "type": "构装生物",
  "alignment": "绝对中立",
  "ac": 9,
  "acNote": "",
  "hp": 127,
  "hitDice": "15d8+60",
  "speed": "30 尺",
  "abilities": {
   "str": 19,
   "dex": 9,
   "con": 18,
   "int": 6,
   "wis": 10,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "lightning",
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "exhaustion",
   "frightened",
   "paralyzed",
   "petrified",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "听得懂通用语以及另外一种语言但不会说",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "畏火",
    "desc": "如果魔像受到火焰伤害，它的攻击检定和属性检定具有劣势，直到它的下个回合结束。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "发狂",
    "desc": "每当魔像在浴血状态下开始它的回合时，掷 1d6。如果结果为 6，魔像陷入发狂。发狂期间，魔像在它的每个回合中都会攻击它能看见的最近的生物。如果附近没有能够移动过去攻击的生物，魔像就攻击一个物体。魔像一旦发狂，就会保持发狂，直到它被摧毁或不再处于浴血状态。如果魔像的创造者位于发狂魔像 60 尺内，可以用一个动作进行一次 DC 15 的魅力（游说）检定，尝试使它平静下来；魔像必须能听见创造者的声音。如果检定成功，魔像停止发狂，直到它的下个回合开始；届时如果它仍处于浴血状态，就重新开始为发狂特性掷骰。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "cha",
     "dc": 15,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "形体不变",
    "desc": "魔像无法变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "闪电吸收",
    "desc": "每当魔像承受闪电伤害时，它恢复等同于这些闪电伤害数值的生命值。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "魔法抗性",
    "desc": "魔像进行对抗法术和其他魔法效应的豁免检定时具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "魔像进行两次猛击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "猛击",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：13（2d8+4）钝击伤害外加 4（1d8）闪电伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d8+4",
      "type": "bludgeoning"
     },
     {
      "dice": "1d8",
      "type": "lightning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "shrieker-fungus",
  "name": "尖啸蕈",
  "size": "中型",
  "type": "植物",
  "alignment": "无阵营",
  "ac": 5,
  "acNote": "",
  "hp": 13,
  "hitDice": "3d8",
  "speed": "5 尺",
  "abilities": {
   "str": 1,
   "dex": 1,
   "con": 10,
   "int": 1,
   "wis": 3,
   "cha": 1
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "blinded",
   "charmed",
   "deafened",
   "frightened"
  ],
  "senses": "盲视 30 尺，被动察觉 6",
  "languages": "",
  "cr": 0,
  "xp": 0,
  "pb": 2,
  "traits": [],
  "actions": [],
  "bonusActions": [],
  "reactions": [
   {
    "name": "尖啸",
    "desc": "触发：一个生物或一个明亮光照的光源移动到尖啸蕈 30 尺内。反应：尖啸蕈发出一阵尖啸，自身 300 尺内都能听见，持续 1 分钟或直到尖啸蕈死亡。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ]
 },
 {
  "key": "violet-fungus",
  "name": "紫蕈",
  "size": "中型",
  "type": "植物",
  "alignment": "无阵营",
  "ac": 5,
  "acNote": "",
  "hp": 18,
  "hitDice": "4d8",
  "speed": "5 尺",
  "abilities": {
   "str": 3,
   "dex": 1,
   "con": 10,
   "int": 1,
   "wis": 3,
   "cha": 1
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "blinded",
   "charmed",
   "deafened",
   "frightened"
  ],
  "senses": "盲视 30 尺，被动察觉 6",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "紫蕈进行两次腐烂之触攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "腐烂之触",
    "desc": "近战攻击检定：+2，触及 10 尺。命中：4（1d8）暗蚀伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "1d8",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "gargoyle",
  "name": "石像鬼",
  "size": "中型",
  "type": "元素生物",
  "alignment": "混乱邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 67,
  "hitDice": "9d8+27",
  "speed": "30 尺，飞行60 尺",
  "abilities": {
   "str": 15,
   "dex": 11,
   "con": 16,
   "int": 6,
   "wis": 11,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "petrified",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "原初语（土族语）",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "掠飞",
    "desc": "石像鬼飞出敌人的触及范围时不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "石像鬼进行两次爪击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：7（2d4+2）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d4+2",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "gelatinous-cube",
  "name": "凝胶怪",
  "size": "大型",
  "type": "泥怪",
  "alignment": "无阵营",
  "ac": 6,
  "acNote": "",
  "hp": 63,
  "hitDice": "6d10+30",
  "speed": "15 尺",
  "abilities": {
   "str": 14,
   "dex": 3,
   "con": 20,
   "int": 1,
   "wis": 6,
   "cha": 1
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "acid"
  ],
  "conditionImmune": [
   "blinded",
   "charmed",
   "deafened",
   "exhaustion",
   "frightened",
   "prone"
  ],
  "senses": "盲视 60 尺，被动察觉 8",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "泥怪立方体",
    "desc": "凝胶怪充满它的整个空间，并且是透明的。其他生物可以进入这个空间，但这样做的生物会承受凝胶怪的吞没，并且进行这次豁免检定时具有劣势。位于凝胶怪体内的生物具有全身掩护；凝胶怪体内同一时间可以容纳一个大型生物，或至多四个中型或小型生物。凝胶怪 5 尺内的生物可以用一个动作进行一次 DC 12 的力量（运动）检定，成功则把一个生物或物体从凝胶怪体内拉出来，而拉拽者受到 10（3d6）强酸伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "3d6",
      "type": "acid"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "透明",
    "desc": "即使凝胶怪就在明处，如果一个生物没有目睹凝胶怪移动或以其他方式行动，该生物必须通过一次 DC 15 的感知（察觉）检定才能注意到它。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 15,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "伪足",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：12（3d6+2）强酸伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "3d6+2",
      "type": "acid"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "吞没",
    "desc": "凝胶怪移动至多等同其速度的距离，这次移动不会引发借机攻击。如果凝胶怪体内有空间容纳大型或更小的生物，它可以穿过这些生物的空间（见泥怪立方体特性）。敏捷豁免：DC 12，在这次移动中凝胶怪首次进入其空间的每个生物。失败：10（3d6）强酸伤害，并且目标被吞没。被吞没的目标处于窒息中，无法施展需要言语成分的法术，陷入束缚状态，并在凝胶怪的每个回合开始时受到 10（3d6）强酸伤害。凝胶怪移动时，被吞没的目标随之移动。被吞没的目标可以用一个动作进行一次 DC 12 的力量（运动）检定，尝试逃脱；检定成功时，目标逃出并进入最近的未被占据的空间。成功：伤害减半，并且目标移动到凝胶怪 5 尺内的一处未被占据的空间。如果没有未被占据的空间，目标改为豁免失败。",
    "attack": null,
    "damage": [
     {
      "dice": "3d6",
      "type": "acid"
     },
     {
      "dice": "3d6",
      "type": "acid"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 12,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "ghast",
  "name": "妖鬼",
  "size": "中型",
  "type": "不死生物",
  "alignment": "混乱邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 36,
  "hitDice": "8d8",
  "speed": "30 尺",
  "abilities": {
   "str": 16,
   "dex": 17,
   "con": 10,
   "int": 11,
   "wis": 10,
   "cha": 8
  },
  "saves": {
   "wis": 2
  },
  "skills": {},
  "resist": [
   "necrotic"
  ],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "通用语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "恶臭",
    "desc": "体质豁免：DC 10，在以妖鬼为源的 5 尺散发内开始其回合的任何生物。失败：目标陷入中毒状态，直到它的下个回合开始。成功：目标在 24 小时内免疫这只妖鬼的恶臭。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "con",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "poisoned"
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）穿刺伤害外加 9（2d8）暗蚀伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "piercing"
     },
     {
      "dice": "2d8",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害。如果目标是不死生物以外的生物，它会承受以下效应。体质豁免：DC 10。失败：目标陷入麻痹状态，直到它的下个回合结束。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "paralyzed"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "ghost",
  "name": "鬼魂",
  "size": "中型",
  "type": "不死生物",
  "alignment": "绝对中立",
  "ac": 11,
  "acNote": "",
  "hp": 45,
  "hitDice": "10d8",
  "speed": "5 尺，飞行40 尺（悬浮）",
  "abilities": {
   "str": 7,
   "dex": 13,
   "con": 10,
   "int": 10,
   "wis": 12,
   "cha": 17
  },
  "saves": {},
  "skills": {},
  "resist": [
   "acid",
   "bludgeoning",
   "cold",
   "fire",
   "lightning",
   "piercing",
   "slashing",
   "thunder"
  ],
  "vulnerable": [],
  "immune": [
   "necrotic",
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "exhaustion",
   "frightened",
   "grappled",
   "paralyzed",
   "petrified",
   "poisoned",
   "prone",
   "restrained"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 11",
  "languages": "通用语以及另外一种语言",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [
   {
    "name": "以太视觉",
    "desc": "鬼魂位于主物质位面时，可以看到以太位面中 60 尺内的事物。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "虚体移动",
    "desc": "鬼魂可以穿过其他生物和物体，将它们视为困难地形。如果它在物体内部结束回合，它受到 5（1d10）力场伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "1d10",
      "type": "force"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "鬼魂进行两次枯萎之触攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "枯萎之触",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：19（3d10+3）暗蚀伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "3d10+3",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "以太化",
    "desc": "鬼魂施展《以太化》法术，无需任何法术成分，以魅力为施法属性。鬼魂位于以太边境时，在主物质位面上可见，反之亦然；但它无法影响另一个位面上的任何事物，也无法受到另一个位面上任何事物的影响。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "恐怖面容",
    "desc": "感知豁免：DC 13，60 尺锥形内每个能看见鬼魂且不是不死生物的生物。失败：10（2d6+3）心灵伤害，并且目标陷入恐慌状态，直到鬼魂的下个回合开始。成功：目标在 24 小时内免疫这只鬼魂的恐怖面容。",
    "attack": null,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "psychic"
     }
    ],
    "save": {
     "ability": "wis",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "frightened"
   },
   {
    "name": "附身（充能 6）",
    "desc": "魅力豁免：DC 13，鬼魂 5 尺内一个它能看见的类人生物。失败：目标被鬼魂附身；鬼魂消失，目标陷入失能状态并失去对自己身体的控制。鬼魂现在控制这具身体，但目标仍保有意识。除了专门以不死生物为目标的攻击、法术或其他效应外，鬼魂不能成为任何攻击、法术或其他效应的目标。鬼魂的游戏数据保持不变，但它改用被附身目标的速度，以及目标的力量、敏捷和体质调整值。附身会持续到这具身体的生命值降至 0，或者鬼魂用一个附赠动作离开为止。附身结束时，鬼魂出现在目标 5 尺内的一处未被占据的空间，并且目标在 24 小时内免疫这只鬼魂的附身。成功：目标在 24 小时内免疫这只鬼魂的附身。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "cha",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": 6,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "incapacitated"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "ghoul",
  "name": "食尸鬼",
  "size": "中型",
  "type": "不死生物",
  "alignment": "混乱邪恶",
  "ac": 12,
  "acNote": "",
  "hp": 22,
  "hitDice": "5d8",
  "speed": "30 尺",
  "abilities": {
   "str": 13,
   "dex": 15,
   "con": 10,
   "int": 7,
   "wis": 10,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "通用语",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "食尸鬼进行两次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）穿刺伤害外加 3（1d6）暗蚀伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     },
     {
      "dice": "1d6",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）挥砍伤害。如果目标是既非不死生物也非精灵的生物，它会承受以下效应。体质豁免：DC 10。失败：目标陷入麻痹状态，直到它的下个回合结束。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "slashing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "paralyzed"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "gibbering-mouther",
  "name": "呓语口怪",
  "size": "中型",
  "type": "异怪",
  "alignment": "混乱中立",
  "ac": 9,
  "acNote": "",
  "hp": 52,
  "hitDice": "7d8+21",
  "speed": "20 尺，游泳20 尺",
  "abilities": {
   "str": 10,
   "dex": 8,
   "con": 16,
   "int": 3,
   "wis": 10,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "prone"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "异变地面",
    "desc": "以口怪为源的 10 尺散发内的地面是困难地形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "胡言乱语",
    "desc": "只要口怪未处于失能状态，它就会语无伦次地胡言乱语。感知豁免：DC 10，口怪胡言乱语期间，在其 20 尺内开始自己回合的任何生物。失败：目标掷 1d8，决定自己在当前回合中做什么：1～4，目标什么也不做；5～6，目标不执行动作或附赠动作，并用尽全部移动力朝一个随机方向移动；7～8，目标对其触及范围内一个随机决定的生物进行一次近战攻击，如果无法进行这样的攻击，则什么也不做。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：7（2d6）穿刺伤害。如果目标是中型或更小的生物，它陷入倒地状态。如果这次攻击使目标的生命值降到 0，目标死亡，随后其躯体被口怪吸收，只留下装备。",
    "attack": 2,
    "damage": [
     {
      "dice": "2d6",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "致盲唾液（充能 5～6）",
    "desc": "敏捷豁免：DC 10，以 30 尺内一点为中心、半径 10 尺的球形内的每个生物。失败：7（2d6）光耀伤害，并且目标陷入目盲状态，直到口怪的下个回合结束。",
    "attack": null,
    "damage": [
     {
      "dice": "2d6",
      "type": "radiant"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "blinded"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "gladiator",
  "name": "角斗士",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 16,
  "acNote": "",
  "hp": 112,
  "hitDice": "15d8+45",
  "speed": "30 尺",
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 12,
   "cha": 15
  },
  "saves": {
   "str": 7,
   "dex": 5,
   "con": 6,
   "wis": 4
  },
  "skills": {
   "athletics": 10,
   "performance": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 11",
  "languages": "通用语",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "角斗士进行三次矛攻击。它可以用一次盾击代替其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "矛",
    "desc": "近战或远程攻击检定：+7，触及 5 尺或射程 20/60 尺。命中：11（2d6+4）穿刺伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "盾击",
    "desc": "力量豁免：DC 15，角斗士 5 尺内一个它能看见的生物。失败：9（2d4+4）钝击伤害。如果目标是中型或更小的生物，它陷入倒地状态。",
    "attack": null,
    "damage": [
     {
      "dice": "2d4+4",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 15,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": [
   {
    "name": "招架",
    "desc": "触发：角斗士在持握武器时被一次近战攻击检定命中。反应：角斗士对这次攻击的 AC 增加 3，可能因此使这次攻击未命中。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ]
 },
 {
  "key": "gnoll-warrior",
  "name": "豺狼人战士",
  "size": "中型",
  "type": "邪魔",
  "alignment": "混乱邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 27,
  "hitDice": "6d8",
  "speed": "30 尺",
  "abilities": {
   "str": 14,
   "dex": 12,
   "con": 11,
   "int": 6,
   "wis": 10,
   "cha": 7
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "豺狼人语",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "骨弓",
    "desc": "远程攻击检定：+3，射程 150/600 尺。命中：6（1d10+1）穿刺伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d10+1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "横冲直撞（每日 1 次）",
    "desc": "紧接在对一个已经浴血的生物造成伤害之后，豺狼人移动至多其速度一半的距离，并进行一次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 1,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "goblin-minion",
  "name": "地精喽啰",
  "size": "小型",
  "type": "精类",
  "alignment": "混乱中立",
  "ac": 12,
  "acNote": "",
  "hp": 7,
  "hitDice": "2d6",
  "speed": "30 尺",
  "abilities": {
   "str": 8,
   "dex": 15,
   "con": 10,
   "int": 10,
   "wis": 8,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "stealth": 6
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 9",
  "languages": "通用语、地精语",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "匕首",
    "desc": "近战或远程攻击检定：+4，触及 5 尺或射程 20/60 尺。命中：4（1d4+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "灵活脱身",
    "desc": "地精执行撤离或躲藏动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "goblin-warrior",
  "name": "地精战士",
  "size": "小型",
  "type": "精类",
  "alignment": "混乱中立",
  "ac": 15,
  "acNote": "",
  "hp": 10,
  "hitDice": "3d6",
  "speed": "30 尺",
  "abilities": {
   "str": 8,
   "dex": 15,
   "con": 10,
   "int": 10,
   "wis": 8,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "stealth": 6
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 9",
  "languages": "通用语、地精语",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "弯刀",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）挥砍伤害；如果这次攻击检定具有优势，另加 2（1d4）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "slashing"
     },
     {
      "dice": "1d4",
      "type": "slashing",
      "when": "adv"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "短弓",
    "desc": "远程攻击检定：+4，射程 80/320 尺。命中：5（1d6+2）穿刺伤害；如果这次攻击检定具有优势，另加 2（1d4）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     },
     {
      "dice": "1d4",
      "type": "piercing",
      "when": "adv"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "灵活脱身",
    "desc": "地精执行撤离或躲藏动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "goblin-boss",
  "name": "地精首领",
  "size": "小型",
  "type": "精类",
  "alignment": "混乱中立",
  "ac": 17,
  "acNote": "",
  "hp": 21,
  "hitDice": "6d6",
  "speed": "30 尺",
  "abilities": {
   "str": 10,
   "dex": 15,
   "con": 10,
   "int": 10,
   "wis": 8,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "stealth": 6
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 9",
  "languages": "通用语、地精语",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "地精进行两次攻击，可任意组合使用弯刀或短弓。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "弯刀",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）挥砍伤害；如果这次攻击检定具有优势，另加 2（1d4）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "slashing"
     },
     {
      "dice": "1d4",
      "type": "slashing",
      "when": "adv"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "短弓",
    "desc": "远程攻击检定：+4，射程 80/320 尺。命中：5（1d6+2）穿刺伤害；如果这次攻击检定具有优势，另加 2（1d4）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     },
     {
      "dice": "1d4",
      "type": "piercing",
      "when": "adv"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "灵活脱身",
    "desc": "地精执行撤离或躲藏动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": [
   {
    "name": "转移攻击",
    "desc": "触发：一个地精能看见的生物对它进行一次攻击检定。反应：地精选择自身 5 尺内一个小型或中型的盟友。地精与该盟友交换位置，改由该盟友成为这次攻击的目标。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ]
 },
 {
  "key": "gold-dragon-wyrmling",
  "name": "金龙幼龙",
  "size": "中型",
  "type": "龙",
  "alignment": "守序善良",
  "ac": 17,
  "acNote": "",
  "hp": 60,
  "hitDice": "8d8+24",
  "speed": "30 尺，飞行60 尺，游泳30 尺",
  "abilities": {
   "str": 19,
   "dex": 14,
   "con": 17,
   "int": 14,
   "wis": 11,
   "cha": 16
  },
  "saves": {
   "dex": 4,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "fire"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 14",
  "languages": "龙语",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "龙可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "龙进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：9（1d10+4）挥砍伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d10+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "火焰吐息（充能 5～6）",
    "desc": "敏捷豁免：DC 13，15 尺锥形内的每个生物。失败：22（4d10）火焰伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "4d10",
      "type": "fire"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 13,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "衰弱吐息",
    "desc": "力量豁免：DC 13，15 尺锥形内每个当前未受此吐息影响的生物。失败：目标进行基于力量的 d20 检定时具有劣势，并且其伤害掷骰减去 2（1d4）。目标在自己每个回合结束时重复该豁免，成功则结束自身的该效果。1 分钟后，它自动成功。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "gorgon",
  "name": "戈尔贡",
  "size": "大型",
  "type": "构装生物",
  "alignment": "无阵营",
  "ac": 19,
  "acNote": "",
  "hp": 114,
  "hitDice": "12d10+48",
  "speed": "40 尺",
  "abilities": {
   "str": 20,
   "dex": 11,
   "con": 18,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "exhaustion",
   "petrified"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 17",
  "languages": "",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [],
  "actions": [
   {
    "name": "顶撞",
    "desc": "近战攻击检定：+8，触及 5 尺。命中：18（2d12+5）穿刺伤害。如果目标是大型或更小的生物，并且戈尔贡在这次命中之前刚刚朝它直线移动了至少 20 尺，目标陷入倒地状态。",
    "attack": 8,
    "damage": [
     {
      "dice": "2d12+5",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "石化吐息（充能 5～6）",
    "desc": "体质豁免：DC 15，30 尺锥形内的每个生物。第一次失败：目标陷入束缚状态；如果它在自己下个回合结束时仍处于束缚状态，就重复该豁免，成功则结束自身的该效果。第二次失败：目标陷入石化状态，以此取代束缚状态。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "con",
     "dc": 15,
     "onSuccess": "none"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "restrained"
   }
  ],
  "bonusActions": [
   {
    "name": "践踏",
    "desc": "敏捷豁免：DC 16，5 尺内一个处于倒地状态的生物。失败：16（2d10+5）钝击伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "2d10+5",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 16,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "gray-ooze",
  "name": "灰泥怪",
  "size": "中型",
  "type": "泥怪",
  "alignment": "无阵营",
  "ac": 9,
  "acNote": "",
  "hp": 22,
  "hitDice": "3d8+9",
  "speed": "10 尺，攀爬10 尺",
  "abilities": {
   "str": 12,
   "dex": 6,
   "con": 16,
   "int": 1,
   "wis": 6,
   "cha": 2
  },
  "saves": {},
  "skills": {
   "stealth": 2
  },
  "resist": [
   "acid",
   "cold",
   "fire"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "blinded",
   "charmed",
   "deafened",
   "exhaustion",
   "frightened",
   "grappled",
   "prone",
   "restrained"
  ],
  "senses": "盲视 60 尺，被动察觉 8",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "无定形",
    "desc": "泥怪可以穿过窄至 1 寸的空间，且无须为此花费额外的移动力。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "腐蚀形体",
    "desc": "非魔法弹药在命中泥怪并造成任何伤害后立即被摧毁。任何非魔法武器在对泥怪造成伤害并与其接触后，立即在攻击检定上承受一个累积的 −1 减值。如果减值达到 −5，该武器被摧毁。对该武器施展《修复术》可以消除这个减值。泥怪可以在 1 轮内蚀穿 2 寸厚的非魔法金属或木头。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "伪足",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：10（2d8+1）强酸伤害。目标所穿戴的非魔法护甲所提供的 AC 承受 −1 减值。如果减值使该护甲的 AC 降到 10，护甲被摧毁。对该护甲施展《修复术》可以消除这个减值。",
    "attack": 3,
    "damage": [
     {
      "dice": "2d8+1",
      "type": "acid"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "green-dragon-wyrmling",
  "name": "绿龙幼龙",
  "size": "中型",
  "type": "龙",
  "alignment": "守序邪恶",
  "ac": 17,
  "acNote": "",
  "hp": 38,
  "hitDice": "7d8+7",
  "speed": "30 尺，飞行60 尺，游泳30 尺",
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 13,
   "int": 14,
   "wis": 11,
   "cha": 13
  },
  "saves": {
   "dex": 3,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "stealth": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 14",
  "languages": "龙语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "龙可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "龙进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：7（1d10+2）挥砍伤害外加3（1d6）毒素伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d10+2",
      "type": "slashing"
     },
     {
      "dice": "1d6",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "毒素吐息（充能 5～6）",
    "desc": "体质豁免：DC 11，15 尺锥形内的每个生物。失败：21（6d6）毒素伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "6d6",
      "type": "poison"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 11,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "green-hag",
  "name": "绿妖婆",
  "size": "中型",
  "type": "精类",
  "alignment": "中立邪恶",
  "ac": 17,
  "acNote": "",
  "hp": 82,
  "hitDice": "11d8+33",
  "speed": "30 尺，游泳30 尺",
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 16,
   "int": 13,
   "wis": 14,
   "cha": 14
  },
  "saves": {},
  "skills": {
   "arcana": 5,
   "deception": 4,
   "perception": 4,
   "stealth": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "通用语、精灵语、木族语",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "妖婆可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "巫会魔法",
    "desc": "妖婆位于至少两名妖婆盟友的 30 尺内时，可以施展下列法术之一，不需要材料成分，使用该法术的正常施法时间，并以智力作为施法属性（法术豁免 DC 11）：《卜筮术》、《寻获魔宠》、《鉴定术》、《物品定位术》、《探知术》或《隐形仆役》。妖婆必须完成一次长休，才能再次用这项特性施展同一个法术。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "拟声",
    "desc": "妖婆可以模仿动物的叫声和类人生物的嗓音。听到这些声音的生物必须在一次 DC 14 的感知（洞悉）检定中成功，才能分辨出它们是模仿的。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 14,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "妖婆进行两次爪击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：8（1d8+4）挥砍伤害外加3（1d6）毒素伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d8+4",
      "type": "slashing"
     },
     {
      "dice": "1d6",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "妖婆施展下列法术之一，不需要材料成分，并以感知作为施法属性（法术豁免 DC 12，法术攻击加值 +4）。随意：《舞光术》、《易容术》（持续时间 24 小时）、《隐形术》（仅限自身，且妖婆处于隐形状态时不留下踪迹）、《次级幻象》、《致病射线》（3 环版本）。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "grick",
  "name": "触喙虫",
  "size": "中型",
  "type": "异怪",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 54,
  "hitDice": "12d8",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 14,
   "dex": 14,
   "con": 11,
   "int": 3,
   "wis": 14,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 12",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "触喙虫进行一次啄击攻击和一次触手攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啄击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：9（2d6+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d6+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "触手",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：7（1d10+2）挥砍伤害。如果目标是中型或更小的生物，它被全部四条触手擒抱，陷入被擒抱状态（逃脱 DC 12）。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d10+2",
      "type": "slashing"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "griffon",
  "name": "狮鹫",
  "size": "大型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 59,
  "hitDice": "7d10+21",
  "speed": "30 尺，飞行80 尺",
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 2,
   "wis": 13,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "狮鹫进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：8（1d8+4）穿刺伤害。如果目标是中型或更小的生物，它被狮鹫的两只前爪擒抱，陷入被擒抱状态（逃脱 DC 14）。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d8+4",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 14,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "grimlock",
  "name": "盲穴人",
  "size": "中型",
  "type": "异怪",
  "alignment": "中立邪恶",
  "ac": 11,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 16,
   "dex": 12,
   "con": 12,
   "int": 9,
   "wis": 8,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "athletics": 5,
   "perception": 3,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 30 尺，被动察觉 13",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "骨棒",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）钝击伤害外加2（1d4）心灵伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "bludgeoning"
     },
     {
      "dice": "1d4",
      "type": "psychic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "guard",
  "name": "守卫",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 16,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "30 尺",
  "abilities": {
   "str": 13,
   "dex": 12,
   "con": 12,
   "int": 10,
   "wis": 11,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "通用语",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "矛",
    "desc": "近战或远程攻击检定：+3，触及 5 尺或射程 20/60 尺。命中：4（1d6+1）穿刺伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d6+1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "guard-captain",
  "name": "守卫队长",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 18,
  "acNote": "",
  "hp": 75,
  "hitDice": "10d8+30",
  "speed": "30 尺",
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 16,
   "int": 12,
   "wis": 14,
   "cha": 13
  },
  "saves": {},
  "skills": {
   "athletics": 6,
   "perception": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 14",
  "languages": "通用语",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "守卫队长进行两次攻击，可任意组合使用标枪或长剑。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "标枪",
    "desc": "近战或远程攻击检定：+6，触及 5 尺或射程 30/120 尺。命中：14（3d6+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "3d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "长剑",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：15（2d10+4）挥砍伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d10+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "half-dragon",
  "name": "半龙",
  "size": "中型",
  "type": "龙",
  "alignment": "绝对中立",
  "ac": 18,
  "acNote": "",
  "hp": 105,
  "hitDice": "14d8+42",
  "speed": "40 尺",
  "abilities": {
   "str": 19,
   "dex": 14,
   "con": 16,
   "int": 10,
   "wis": 15,
   "cha": 14
  },
  "saves": {
   "dex": 5,
   "wis": 5
  },
  "skills": {
   "athletics": 7,
   "perception": 5,
   "stealth": 5
  },
  "resist": [
   "damage type chosen for the draconic origin trait below"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 15",
  "languages": "通用语、龙语",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "龙族血源",
    "desc": "半龙与某一种龙有亲缘关系，这种龙与下列伤害类型之一相关联（由 GM 选择）：强酸、冷冻、火焰、闪电或毒素。这一选择会影响数据块的其他部分。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "半龙进行两次爪击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+7，触及 10 尺。命中：6（1d4+4）挥砍伤害外加7（2d6）龙族血源特性所选类型的伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "1d4+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "龙息（充能 5～6）",
    "desc": "敏捷豁免：DC 14，30 尺锥形内的每个生物。失败：28（8d6）龙族血源特性所选类型的伤害。成功：伤害减半。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "dex",
     "dc": 14,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "跳跃",
    "desc": "半龙花费 10 尺移动力，跳跃至多 30 尺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "harpy",
  "name": "鹰身女妖",
  "size": "中型",
  "type": "怪兽",
  "alignment": "混乱邪恶",
  "ac": 11,
  "acNote": "",
  "hp": 38,
  "hitDice": "7d8+7",
  "speed": "20 尺，飞行40 尺",
  "abilities": {
   "str": 12,
   "dex": 13,
   "con": 12,
   "int": 7,
   "wis": 10,
   "cha": 13
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "爪击",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：6（2d4+1）挥砍伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "2d4+1",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "诱惑之歌",
    "desc": "鹰身女妖唱起一段魔法旋律，旋律持续到鹰身女妖对它的专注结束为止。感知豁免：DC 11，歌声开始时以鹰身女妖为源的 300 尺散发内的每个类人生物和巨人。失败：目标陷入魅惑状态直到歌声结束，并在自己每个回合结束时重复该豁免。处于魅惑状态期间，目标同时处于失能状态，并且无视其他鹰身女妖的诱惑之歌。如果目标与鹰身女妖相距超过 5 尺，目标在自己的回合中沿最直接的路线朝鹰身女妖移动，试图进入鹰身女妖 5 尺内。它不会避开借机攻击；不过，在移入会造成伤害的地形（例如熔岩或坑洞）之前，以及每当它受到来自鹰身女妖以外的来源的伤害时，目标都会重复该豁免。成功：目标在 24 小时内免疫这只鹰身女妖的诱惑之歌。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "charmed"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "hell-hound",
  "name": "地狱犬",
  "size": "中型",
  "type": "邪魔",
  "alignment": "守序邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 58,
  "hitDice": "9d8+18",
  "speed": "50 尺",
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 14,
   "int": 6,
   "wis": 13,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "perception": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "fire"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "听得懂炼狱语但不会说",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果地狱犬至少有一名盟友位于某生物 5 尺内，且该盟友未处于失能状态，地狱犬对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "地狱犬进行两次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）穿刺伤害外加3（1d6）火焰伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "piercing"
     },
     {
      "dice": "1d6",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "火焰吐息（充能 5～6）",
    "desc": "敏捷豁免：DC 12，15 尺锥形内的每个生物。失败：17（5d6）火焰伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "5d6",
      "type": "fire"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 12,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "hill-giant",
  "name": "山丘巨人",
  "size": "巨型",
  "type": "巨人",
  "alignment": "混乱邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 105,
  "hitDice": "10d12+40",
  "speed": "40 尺",
  "abilities": {
   "str": 21,
   "dex": 8,
   "con": 19,
   "int": 5,
   "wis": 9,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "巨人语",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "巨人进行两次攻击，可任意组合使用树干棒或抛掷垃圾。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "树干棒",
    "desc": "近战攻击检定：+8，触及 10 尺。命中：18（3d8+5）钝击伤害。如果目标是大型或更小的生物，它陷入倒地状态。",
    "attack": 8,
    "damage": [
     {
      "dice": "3d8+5",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "抛掷垃圾",
    "desc": "远程攻击检定：+8，射程 60/240 尺。命中：16（2d10+5）钝击伤害，并且目标陷入中毒状态，直到它的下个回合结束。",
    "attack": 8,
    "damage": [
     {
      "dice": "2d10+5",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "hippogriff",
  "name": "角鹰兽",
  "size": "大型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 26,
  "hitDice": "4d10+4",
  "speed": "40 尺，飞行60 尺",
  "abilities": {
   "str": 17,
   "dex": 13,
   "con": 13,
   "int": 2,
   "wis": 12,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 15",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "掠飞",
    "desc": "角鹰兽飞出敌人的触及范围时不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "角鹰兽进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "hobgoblin-warrior",
  "name": "大地精战士",
  "size": "中型",
  "type": "精类",
  "alignment": "守序邪恶",
  "ac": 18,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "30 尺",
  "abilities": {
   "str": 13,
   "dex": 12,
   "con": 12,
   "int": 10,
   "wis": 10,
   "cha": 9
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "通用语、地精语",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果大地精至少有一名盟友位于某生物 5 尺内，且该盟友未处于失能状态，大地精对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "长剑",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：12（2d10+1）挥砍伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "2d10+1",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "长弓",
    "desc": "远程攻击检定：+3，射程 150/600 尺。命中：5（1d8+1）穿刺伤害外加7（3d4）毒素伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d8+1",
      "type": "piercing"
     },
     {
      "dice": "3d4",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "hobgoblin-captain",
  "name": "大地精队长",
  "size": "中型",
  "type": "精类",
  "alignment": "守序邪恶",
  "ac": 17,
  "acNote": "",
  "hp": 58,
  "hitDice": "9d8+18",
  "speed": "30 尺",
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 14,
   "int": 12,
   "wis": 10,
   "cha": 13
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "通用语、地精语",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "威权灵光",
    "desc": "位于以大地精为源的 10 尺散发内时，大地精及其盟友的攻击检定和豁免检定具有优势，前提是大地精未处于失能状态。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "大地精进行两次攻击，可任意组合使用巨剑或长弓。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "巨剑",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：9（2d6+2）挥砍伤害外加3（1d6）毒素伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d6+2",
      "type": "slashing"
     },
     {
      "dice": "1d6",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "长弓",
    "desc": "远程攻击检定：+4，射程 150/600 尺。命中：6（1d8+2）穿刺伤害外加5（2d4）毒素伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "piercing"
     },
     {
      "dice": "2d4",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "homunculus",
  "name": "侏儒魔像",
  "size": "微型",
  "type": "构装生物",
  "alignment": "绝对中立",
  "ac": 13,
  "acNote": "",
  "hp": 4,
  "hitDice": "1d4+2",
  "speed": "20 尺，飞行40 尺",
  "abilities": {
   "str": 4,
   "dex": 15,
   "con": 14,
   "int": 10,
   "wis": 10,
   "cha": 7
  },
  "saves": {
   "wis": 2,
   "cha": 0
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "听得懂通用语及另外一种语言但不会说",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "心灵感应联结",
    "desc": "侏儒魔像与其主人位于同一个存在位面时，两者可以通过心灵感应相互交流。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：1 点穿刺伤害，并且目标承受下列效应。体质豁免：DC 12。失败：目标陷入中毒状态，直到侏儒魔像的下个回合结束。失败 5 点或以上：目标陷入中毒状态，持续 1 分钟。处于中毒状态期间，目标同时处于昏迷状态，如果目标受到任何伤害，昏迷状态提前结束。",
    "attack": 4,
    "damage": [],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "poisoned"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "imp",
  "name": "小恶魔",
  "size": "微型",
  "type": "邪魔",
  "alignment": "守序邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 21,
  "hitDice": "6d4+6",
  "speed": "20 尺，飞行40 尺",
  "abilities": {
   "str": 6,
   "dex": 17,
   "con": 13,
   "int": 11,
   "wis": 12,
   "cha": 14
  },
  "saves": {},
  "skills": {
   "deception": 4,
   "insight": 3,
   "stealth": 5
  },
  "resist": [
   "cold"
  ],
  "vulnerable": [],
  "immune": [
   "fire",
   "poison"
  ],
  "conditionImmune": [
   "poisoned"
  ],
  "senses": "黑暗视觉 120 尺，被动察觉 11",
  "languages": "通用语、炼狱语",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "魔法抗性",
    "desc": "小恶魔对抗法术和其他魔法效应的豁免检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "蜇刺",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）穿刺伤害外加7（2d6）毒素伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "piercing"
     },
     {
      "dice": "2d6",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "隐形术",
    "desc": "小恶魔对自身施展《隐形术》，不需要任何法术成分，并以魅力作为施法属性。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "变形",
    "desc": "小恶魔变形成老鼠（速度 20 尺）、渡鸦（20 尺，飞行 60 尺）或蜘蛛（20 尺，攀爬 20 尺）的模样，或者变回真身。除速度外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备都不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "incubus",
  "name": "梦魔",
  "size": "中型",
  "type": "邪魔",
  "alignment": "中立邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 66,
  "hitDice": "12d8+12",
  "speed": "30 尺，飞行60 尺",
  "abilities": {
   "str": 8,
   "dex": 17,
   "con": 13,
   "int": 15,
   "wis": 12,
   "cha": 20
  },
  "saves": {},
  "skills": {
   "deception": 9,
   "insight": 5,
   "perception": 5,
   "persuasion": 9,
   "stealth": 7
  },
  "resist": [
   "cold",
   "fire",
   "poison",
   "psychic"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "深渊语、通用语、炼狱语；心灵感应 60 尺",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [
   {
    "name": "魅魔形态",
    "desc": "梦魔完成一次长休时，可以变形为魅魔，改用魅魔的数据块代替这个数据块。它穿戴或携带的任何装备都不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "梦魔进行两次无休之触攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "无休之触",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：15（3d6+5）心灵伤害，并且目标受到诅咒，持续 24 小时或直到梦魔死亡。诅咒结束前，目标完成短休时不会获得任何益处。",
    "attack": 7,
    "damage": [
     {
      "dice": "3d6+5",
      "type": "psychic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "梦魔施展下列法术之一，不需要材料成分，并以魅力作为施法属性（法术豁免 DC 15）。随意：《易容术》、《以太化》；每日各 1 次：《托梦术》、《催眠图纹》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "噩梦（充能 6）",
    "desc": "感知豁免：DC 15，梦魔 60 尺内一个它能看见的生物。失败：如果目标的生命值为 20 或更低，它陷入昏迷状态，持续 1 小时，或直到它受到伤害，或直到它 5 尺内的某个生物花费一个动作将其唤醒。否则，目标受到 18（4d8）心灵伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "4d8",
      "type": "psychic"
     }
    ],
    "save": {
     "ability": "wis",
     "dc": 15,
     "onSuccess": "none"
    },
    "recharge": 6,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "unconscious"
   }
  ],
  "reactions": []
 },
 {
  "key": "knight",
  "name": "骑士",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 18,
  "acNote": "",
  "hp": 52,
  "hitDice": "8d8+16",
  "speed": "30 尺",
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 14,
   "int": 11,
   "wis": 11,
   "cha": 15
  },
  "saves": {
   "con": 4,
   "wis": 2
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "frightened"
  ],
  "senses": "被动察觉 10",
  "languages": "通用语及另外一种语言",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "骑士进行两次攻击，可任意组合使用巨剑或重弩。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "巨剑",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害外加4（1d8）光耀伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     },
     {
      "dice": "1d8",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "重弩",
    "desc": "远程攻击检定：+2，射程 100/400 尺。命中：11（2d10）穿刺伤害外加4（1d8）光耀伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "2d10",
      "type": "piercing"
     },
     {
      "dice": "1d8",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": [
   {
    "name": "招架",
    "desc": "触发：骑士在持握武器时被一次近战攻击检定命中。反应：骑士对这次攻击的 AC 增加 2，可能因此使这次攻击未命中。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ]
 },
 {
  "key": "kobold-warrior",
  "name": "狗头人战士",
  "size": "小型",
  "type": "龙",
  "alignment": "绝对中立",
  "ac": 14,
  "acNote": "",
  "hp": 7,
  "hitDice": "3d6-3",
  "speed": "30 尺",
  "abilities": {
   "str": 7,
   "dex": 15,
   "con": 9,
   "int": 8,
   "wis": 7,
   "cha": 8
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 8",
  "languages": "通用语、龙语",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果狗头人至少有一名盟友位于某生物 5 尺内，且该盟友未处于失能状态，狗头人对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "日光敏感",
    "desc": "处于阳光下时，狗头人的属性检定和攻击检定具有劣势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "匕首",
    "desc": "近战或远程攻击检定：+4，触及 5 尺或射程 20/60 尺。命中：4（1d4+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "lamia",
  "name": "拉弥亚",
  "size": "大型",
  "type": "邪魔",
  "alignment": "混乱邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 97,
  "hitDice": "13d10+26",
  "speed": "40 尺",
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 15,
   "int": 14,
   "wis": 15,
   "cha": 16
  },
  "saves": {},
  "skills": {
   "deception": 7,
   "insight": 4,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 12",
  "languages": "深渊语、通用语",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "拉弥亚进行两次爪击攻击。它可以用一次腐化之触代替其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）挥砍伤害外加7（2d6）心灵伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "slashing"
     },
     {
      "dice": "2d6",
      "type": "psychic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "腐化之触",
    "desc": "感知豁免：DC 13，拉弥亚 5 尺内一个它能看见的生物。失败：13（3d8）心灵伤害，并且目标受到诅咒，持续 1 小时。诅咒结束前，目标处于魅惑状态和中毒状态。",
    "attack": null,
    "damage": [
     {
      "dice": "3d8",
      "type": "psychic"
     }
    ],
    "save": {
     "ability": "wis",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "拉弥亚施展下列法术之一，不需要材料成分，并以魅力作为施法属性（法术豁免 DC 13）。随意：《易容术》（可以变成大型或中型双足生物的模样）、《次级幻象》；每日各 1 次：《指使术》、《高等幻影》、《探知术》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "跳跃",
    "desc": "拉弥亚花费 10 尺移动力，跳跃至多 30 尺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "lemure",
  "name": "劣魔",
  "size": "中型",
  "type": "邪魔",
  "alignment": "守序邪恶",
  "ac": 9,
  "acNote": "",
  "hp": 9,
  "hitDice": "2d8",
  "speed": "20 尺",
  "abilities": {
   "str": 10,
   "dex": 5,
   "con": 11,
   "int": 1,
   "wis": 11,
   "cha": 3
  },
  "saves": {},
  "skills": {},
  "resist": [
   "cold"
  ],
  "vulnerable": [],
  "immune": [
   "fire",
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "frightened",
   "poisoned"
  ],
  "senses": "黑暗视觉 120 尺，被动察觉 10",
  "languages": "听得懂炼狱语但不会说",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "地狱复生",
    "desc": "如果劣魔在九层地狱中死亡，它会在 1d10 天后以全部生命值复活，除非杀死它的生物当时正受到《祝福术》的效应影响，或者它的遗骸被洒上了圣水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "污秽黏液",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：2（1d4）毒素伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "1d4",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "magmin",
  "name": "岩浆人",
  "size": "小型",
  "type": "元素生物",
  "alignment": "混乱中立",
  "ac": 14,
  "acNote": "",
  "hp": 13,
  "hitDice": "3d6+3",
  "speed": "30 尺",
  "abilities": {
   "str": 7,
   "dex": 15,
   "con": 12,
   "int": 8,
   "wis": 11,
   "cha": 10
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "fire"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "原初语（火族语）",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "死亡爆裂",
    "desc": "岩浆人死亡时会爆炸。敏捷豁免：DC 11，以岩浆人为源的 10 尺散发内的每个生物。失败：7（2d6）火焰伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "2d6",
      "type": "fire"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 11,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "触碰",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：7（2d4+2）火焰伤害。如果目标是生物，或是未被穿戴或携带的易燃物体，它开始燃烧。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d4+2",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "燃焰照明",
    "desc": "岩浆人让自身燃起火焰，或熄灭自身的火焰。燃烧期间，岩浆人发出半径 10 尺的明亮光照，并在此范围外再发出 10 尺的微光。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "manticore",
  "name": "蝎尾狮",
  "size": "大型",
  "type": "怪兽",
  "alignment": "守序邪恶",
  "ac": 14,
  "acNote": "",
  "hp": 68,
  "hitDice": "8d10+24",
  "speed": "30 尺，飞行50 尺",
  "abilities": {
   "str": 17,
   "dex": 16,
   "con": 17,
   "int": 7,
   "wis": 12,
   "cha": 8
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 11",
  "languages": "通用语",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "蝎尾狮进行三次攻击，可任意组合使用撕裂或尾刺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "尾刺",
    "desc": "远程攻击检定：+5，射程 100/200 尺。命中：7（1d8+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "dust-mephit",
  "name": "尘小魔怪",
  "size": "小型",
  "type": "元素生物",
  "alignment": "中立邪恶",
  "ac": 12,
  "acNote": "",
  "hp": 17,
  "hitDice": "5d6",
  "speed": "30 尺，飞行30 尺",
  "abilities": {
   "str": 5,
   "dex": 14,
   "con": 10,
   "int": 9,
   "wis": 11,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "perception": 2,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [
   "fire"
  ],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 12",
  "languages": "原初语（风族语、土族语）",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "死亡爆裂",
    "desc": "小魔怪死亡时会爆炸。敏捷豁免：DC 10，以小魔怪为源的 5 尺散发内的每个生物。失败：5（2d4）钝击伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "2d4",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 10,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "爪击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "致盲吐息（充能 6）",
    "desc": "敏捷豁免：DC 10，15 尺锥形内的每个生物。失败：目标陷入目盲状态，直到小魔怪的下个回合结束。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "dex",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": 6,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "blinded"
   },
   {
    "name": "睡眠术（每日 1 次）",
    "desc": "小魔怪施展《睡眠术》，不需要任何法术成分，并以魅力作为施法属性（法术豁免 DC 10）。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 1,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "ice-mephit",
  "name": "冰小魔怪",
  "size": "小型",
  "type": "元素生物",
  "alignment": "中立邪恶",
  "ac": 11,
  "acNote": "",
  "hp": 21,
  "hitDice": "6d6",
  "speed": "30 尺，飞行30 尺",
  "abilities": {
   "str": 7,
   "dex": 13,
   "con": 10,
   "int": 9,
   "wis": 11,
   "cha": 12
  },
  "saves": {},
  "skills": {
   "perception": 2,
   "stealth": 3
  },
  "resist": [],
  "vulnerable": [
   "fire"
  ],
  "immune": [
   "cold",
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 12",
  "languages": "原初语（水族语、风族语）",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "死亡爆裂",
    "desc": "小魔怪死亡时会爆炸。体质豁免：DC 10，以小魔怪为源的 5 尺散发内的每个生物。失败：5（2d4）冷冻伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "2d4",
      "type": "cold"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 10,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "爪击",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：3（1d4+1）挥砍伤害外加2（1d4）冷冻伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d4+1",
      "type": "slashing"
     },
     {
      "dice": "1d4",
      "type": "cold"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "云雾术（每日 1 次）",
    "desc": "小魔怪施展《云雾术》，不需要任何法术成分，并以魅力作为施法属性。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 1,
    "multiattack": false
   },
   {
    "name": "冰霜吐息（充能 6）",
    "desc": "体质豁免：DC 10，15 尺锥形内的每个生物。失败：7（3d4）冷冻伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "3d4",
      "type": "cold"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 10,
     "onSuccess": "half"
    },
    "recharge": 6,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "magma-mephit",
  "name": "岩浆小魔怪",
  "size": "小型",
  "type": "元素生物",
  "alignment": "中立邪恶",
  "ac": 11,
  "acNote": "",
  "hp": 18,
  "hitDice": "4d6+4",
  "speed": "30 尺，飞行30 尺",
  "abilities": {
   "str": 8,
   "dex": 12,
   "con": 12,
   "int": 7,
   "wis": 10,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "stealth": 3
  },
  "resist": [],
  "vulnerable": [
   "cold"
  ],
  "immune": [
   "fire",
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "原初语（火族语、土族语）",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "死亡爆裂",
    "desc": "小魔怪死亡时会爆炸。敏捷豁免：DC 11，以小魔怪为源的 5 尺散发内的每个生物。失败：7（2d6）火焰伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "2d6",
      "type": "fire"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 11,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "爪击",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：3（1d4+1）挥砍伤害外加3（1d6）火焰伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d4+1",
      "type": "slashing"
     },
     {
      "dice": "1d6",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "火焰吐息（充能 6）",
    "desc": "敏捷豁免：DC 11，15 尺锥形内的每个生物。失败：7（2d6）火焰伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "2d6",
      "type": "fire"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 11,
     "onSuccess": "half"
    },
    "recharge": 6,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "steam-mephit",
  "name": "蒸汽小魔怪",
  "size": "小型",
  "type": "元素生物",
  "alignment": "中立邪恶",
  "ac": 10,
  "acNote": "",
  "hp": 17,
  "hitDice": "5d6",
  "speed": "30 尺，飞行30 尺",
  "abilities": {
   "str": 5,
   "dex": 11,
   "con": 10,
   "int": 11,
   "wis": 10,
   "cha": 12
  },
  "saves": {},
  "skills": {
   "stealth": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "fire",
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "原初语（水族语、火族语）",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "模糊形体",
    "desc": "针对小魔怪的攻击检定具有劣势，除非小魔怪处于失能状态。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "死亡爆裂",
    "desc": "小魔怪死亡时会爆炸。敏捷豁免：DC 10，以小魔怪为源的 5 尺散发内的每个生物。失败：5（2d4）火焰伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "2d4",
      "type": "fire"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 10,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "爪击",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：2（1d4）挥砍伤害外加2（1d4）火焰伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "1d4",
      "type": "slashing"
     },
     {
      "dice": "1d4",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蒸汽吐息（充能 6）",
    "desc": "体质豁免：DC 10，15 尺锥形内的每个生物。失败：5（2d4）火焰伤害，并且目标的速度降低 10 尺，直到小魔怪的下个回合结束。成功：仅伤害减半。失败或成功：身处水下并不会使目标获得对此火焰伤害的抗性。",
    "attack": null,
    "damage": [
     {
      "dice": "2d4",
      "type": "fire"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 10,
     "onSuccess": "half"
    },
    "recharge": 6,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "merfolk-skirmisher",
  "name": "人鱼散兵",
  "size": "中型",
  "type": "元素生物",
  "alignment": "绝对中立",
  "ac": 11,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "10 尺，游泳40 尺",
  "abilities": {
   "str": 10,
   "dex": 13,
   "con": 12,
   "int": 11,
   "wis": 14,
   "cha": 12
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "通用语、原初语（水族语）",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "人鱼可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "海洋之矛",
    "desc": "近战或远程攻击检定：+2，触及 5 尺或射程 20/60 尺。命中：3（1d6）穿刺伤害外加2（1d4）冷冻伤害。如果目标是生物，它的速度降低 10 尺，直到它的下个回合结束。命中或未命中：进行远程攻击后，这支矛立即以魔法方式回到人鱼手中。",
    "attack": 2,
    "damage": [
     {
      "dice": "1d6",
      "type": "piercing"
     },
     {
      "dice": "1d4",
      "type": "cold"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "merrow",
  "name": "魔化人鱼",
  "size": "大型",
  "type": "怪兽",
  "alignment": "混乱邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 45,
  "hitDice": "6d10+12",
  "speed": "10 尺，游泳40 尺",
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 15,
   "int": 8,
   "wis": 10,
   "cha": 9
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "深渊语、原初语（水族语）",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "魔化人鱼可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "魔化人鱼进行两次攻击，可任意组合使用啮咬、爪击或鱼叉。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：6（1d4+4）穿刺伤害，并且目标陷入中毒状态，直到魔化人鱼的下个回合结束。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d4+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：9（2d4+4）挥砍伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d4+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "鱼叉",
    "desc": "近战或远程攻击检定：+6，触及 5 尺或射程 20/60 尺。命中：11（2d6+4）穿刺伤害。如果目标是大型或更小的生物，魔化人鱼将目标朝自己直线拉近至多 15 尺。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "mimic",
  "name": "拟形怪",
  "size": "中型",
  "type": "怪兽",
  "alignment": "绝对中立",
  "ac": 12,
  "acNote": "",
  "hp": 58,
  "hitDice": "9d8+18",
  "speed": "20 尺",
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 15,
   "int": 5,
   "wis": 13,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "acid"
  ],
  "conditionImmune": [
   "prone"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 11",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "黏附（仅限物体形态）",
    "desc": "拟形怪会黏住任何触碰它的东西。被拟形怪黏住的巨型或更小的生物陷入被擒抱状态（逃脱 DC 13）。为挣脱这次擒抱而进行的属性检定具有劣势。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5（如果目标正被拟形怪擒抱，则具有优势），触及 5 尺。命中：7（1d8+3）穿刺伤害——如果目标正被拟形怪擒抱，则改为 12（2d8+3）穿刺伤害——外加 4（1d8）强酸伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "piercing"
     },
     {
      "dice": "2d8+3",
      "type": "piercing",
      "when": "if"
     },
     {
      "dice": "1d8",
      "type": "acid",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "伪足",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）钝击伤害外加4（1d8）强酸伤害。如果目标是大型或更小的生物，它陷入被擒抱状态（逃脱 DC 13）。为挣脱这次擒抱而进行的属性检定具有劣势。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "bludgeoning"
     },
     {
      "dice": "1d8",
      "type": "acid"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "拟形怪变形成一个中型或小型物体的模样，同时保持其游戏数据不变；或者变回其真正的团块形态。它穿戴或携带的任何装备都不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "minotaur-of-baphomet",
  "name": "巴弗灭牛头人",
  "size": "大型",
  "type": "怪兽",
  "alignment": "混乱邪恶",
  "ac": 14,
  "acNote": "",
  "hp": 85,
  "hitDice": "10d10+30",
  "speed": "40 尺",
  "abilities": {
   "str": 18,
   "dex": 11,
   "con": 16,
   "int": 6,
   "wis": 16,
   "cha": 9
  },
  "saves": {},
  "skills": {
   "perception": 7,
   "survival": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 17",
  "languages": "深渊语",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "深渊长柄刀",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：10（1d12+4）挥砍伤害外加10（3d6）暗蚀伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d12+4",
      "type": "slashing"
     },
     {
      "dice": "3d6",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "顶撞（充能 5～6）",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：18（4d6+4）穿刺伤害。如果目标是大型或更小的生物，并且牛头人在这次命中之前刚刚朝它直线移动了至少 10 尺，目标额外受到 10（3d6）穿刺伤害，并陷入倒地状态。",
    "attack": 6,
    "damage": [
     {
      "dice": "4d6+4",
      "type": "piercing"
     },
     {
      "dice": "3d6",
      "type": "piercing",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "mummy",
  "name": "木乃伊",
  "size": "Medium or small",
  "type": "不死生物",
  "alignment": "守序邪恶",
  "ac": 11,
  "acNote": "",
  "hp": 58,
  "hitDice": "9d8+18",
  "speed": "20 尺",
  "abilities": {
   "str": 16,
   "dex": 8,
   "con": 15,
   "int": 6,
   "wis": 12,
   "cha": 12
  },
  "saves": {
   "wis": 3
  },
  "skills": {},
  "resist": [],
  "vulnerable": [
   "fire"
  ],
  "immune": [
   "necrotic",
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "exhaustion",
   "frightened",
   "paralyzed",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 11",
  "languages": "通用语及另外两种语言",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "木乃伊进行两次腐朽之拳攻击，并使用恐怖凝视。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "腐朽之拳",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：8（1d10+3）钝击伤害外加10（3d6）暗蚀伤害。如果目标是生物，它会受到诅咒。受诅咒期间，目标无法恢复生命值，完成长休时其生命值上限不会恢复正常，并且每经过 24 小时，其生命值上限降低 10（3d6）。被这次攻击降到 0 生命值的生物会死亡并化为尘土。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d10+3",
      "type": "bludgeoning"
     },
     {
      "dice": "3d6",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "恐怖凝视",
    "desc": "感知豁免：DC 11，木乃伊 60 尺内一个它能看见的生物。失败：目标陷入恐慌状态，直到木乃伊的下个回合结束。成功：目标在 24 小时内免疫这具木乃伊的恐怖凝视。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "frightened"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "night-hag",
  "name": "夜妖婆",
  "size": "中型",
  "type": "邪魔",
  "alignment": "中立邪恶",
  "ac": 17,
  "acNote": "",
  "hp": 112,
  "hitDice": "15d8+45",
  "speed": "30 尺",
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 16,
   "wis": 14,
   "cha": 16
  },
  "saves": {},
  "skills": {
   "deception": 6,
   "insight": 5,
   "perception": 5,
   "stealth": 5
  },
  "resist": [
   "cold",
   "fire"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "charmed"
  ],
  "senses": "黑暗视觉 120 尺，被动察觉 15",
  "languages": "深渊语、通用语、炼狱语、原初语",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "巫会魔法",
    "desc": "妖婆位于至少两名妖婆盟友的 30 尺内时，可以施展下列法术之一，不需要材料成分，使用该法术的正常施法时间，并以智力作为施法属性（法术豁免 DC 14）：《卜筮术》、《寻获魔宠》、《鉴定术》、《物品定位术》、《探知术》或《隐形仆役》。妖婆必须完成一次长休，才能再次用这项特性施展同一个法术。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "魔法抗性",
    "desc": "妖婆对抗法术和其他魔法效应的豁免检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "灵魂袋",
    "desc": "妖婆拥有一只灵魂袋。持握或携带这只袋子时，妖婆可以使用其噩梦缠身动作。袋子的 AC 为 15，生命值为 20，并具有对所有伤害的抗性。袋子的生命值降到 0 时会化为尘土。如果袋子被摧毁，其中装着的所有灵魂都会被释放。妖婆可以在 7 天后制作一只新的袋子。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "妖婆进行两次爪击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：13（2d8+4）挥砍伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d8+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "噩梦缠身（每日 1 次）",
    "desc": "妖婆身处以太位面时施展《托梦术》，所用施法属性与其施法动作相同。只有妖婆自己能充当该法术的信使，且目标必须是妖婆能看见的、位于物质位面上的一个生物。如果目标正受到《防护善恶》的效应影响，或位于《魔法法阵》之内，该法术失败并被浪费。如果目标受到《托梦术》造成的伤害，其生命值上限降低与该伤害相等的数值。如果该法术杀死了目标，目标的灵魂会被困在妖婆的灵魂袋中，在其灵魂被释放之前，目标无法被复活。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 1,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "妖婆施展下列法术之一，不需要材料成分，并以智力作为施法属性（法术豁免 DC 14）。随意：《侦测魔法》、《以太化》、《魔法飞弹》（4 环版本）；每日各 2 次：《魅影杀手》、《异界传送》（仅限自身）。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "妖婆变形为一个小型或中型的类人生物，或者变回真身。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备都不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "nightmare",
  "name": "梦魇",
  "size": "大型",
  "type": "邪魔",
  "alignment": "中立邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 68,
  "hitDice": "8d10+24",
  "speed": "60 尺，飞行90 尺（悬浮）",
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 13,
   "cha": 15
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "fire"
  ],
  "conditionImmune": [],
  "senses": "被动察觉 11",
  "languages": "听得懂深渊语、通用语和炼狱语但不会说",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "赋予火焰抗性",
    "desc": "梦魇可以让骑在它身上的骑手在骑乘期间获得对火焰伤害的抗性。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "照明",
    "desc": "梦魇发出半径 10 尺的明亮光照，并在此范围外再发出 10 尺的微光。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "蹄击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：13（2d8+4）钝击伤害外加10（3d6）火焰伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d8+4",
      "type": "bludgeoning"
     },
     {
      "dice": "3d6",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "以太穿行",
    "desc": "梦魇与其 5 尺内至多三个自愿的生物从物质位面传送到以太位面，或从以太位面传送到物质位面。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "noble",
  "name": "贵族",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 15,
  "acNote": "",
  "hp": 9,
  "hitDice": "2d8",
  "speed": "30 尺",
  "abilities": {
   "str": 11,
   "dex": 12,
   "con": 11,
   "int": 12,
   "wis": 14,
   "cha": 16
  },
  "saves": {},
  "skills": {
   "deception": 5,
   "insight": 4,
   "persuasion": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "通用语及另外两种语言",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "刺剑",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：5（1d8+1）穿刺伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d8+1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": [
   {
    "name": "招架",
    "desc": "触发：贵族在持握武器时被一次近战攻击检定命中。反应：贵族对这次攻击的 AC 增加 2，可能因此使这次攻击未命中。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ]
 },
 {
  "key": "ochre-jelly",
  "name": "赭色软泥怪",
  "size": "大型",
  "type": "泥怪",
  "alignment": "无阵营",
  "ac": 8,
  "acNote": "",
  "hp": 52,
  "hitDice": "7d10+14",
  "speed": "20 尺，攀爬20 尺",
  "abilities": {
   "str": 15,
   "dex": 6,
   "con": 14,
   "int": 2,
   "wis": 6,
   "cha": 1
  },
  "saves": {},
  "skills": {},
  "resist": [
   "acid"
  ],
  "vulnerable": [],
  "immune": [
   "lightning",
   "slashing"
  ],
  "conditionImmune": [
   "charmed",
   "deafened",
   "exhaustion",
   "frightened",
   "grappled",
   "prone",
   "restrained"
  ],
  "senses": "盲视 60 尺，被动察觉 8",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "无定形",
    "desc": "软泥怪可以穿过窄至 1 寸的空间，且无须为此花费额外的移动力。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蛛行",
    "desc": "软泥怪可以攀爬困难的表面，包括沿天花板倒爬，而无须进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "伪足",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：12（3d6+2）强酸伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "3d6+2",
      "type": "acid"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": [
   {
    "name": "分裂",
    "desc": "触发：软泥怪的体型为大型或中型且生命值至少为 10 时，它进入浴血状态，或受到闪电或挥砍伤害。反应：软泥怪分裂成两只新的赭色软泥怪。每只新软泥怪的体型比原软泥怪小一级，并按原软泥怪的先攻行动。原软泥怪的生命值在两只新软泥怪之间平分（向下取整）。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ]
 },
 {
  "key": "ogre",
  "name": "食人魔",
  "size": "大型",
  "type": "巨人",
  "alignment": "混乱邪恶",
  "ac": 11,
  "acNote": "",
  "hp": 68,
  "hitDice": "8d10+24",
  "speed": "40 尺",
  "abilities": {
   "str": 19,
   "dex": 8,
   "con": 16,
   "int": 5,
   "wis": 7,
   "cha": 7
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 8",
  "languages": "通用语、巨人语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "巨棒",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：13（2d8+4）钝击伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d8+4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "标枪",
    "desc": "近战或远程攻击检定：+6，触及 5 尺或射程 30/120 尺。命中：11（2d6+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "otyugh",
  "name": "腐食兽",
  "size": "大型",
  "type": "异怪",
  "alignment": "绝对中立",
  "ac": 14,
  "acNote": "",
  "hp": 104,
  "hitDice": "11d10+44",
  "speed": "30 尺",
  "abilities": {
   "str": 16,
   "dex": 11,
   "con": 19,
   "int": 6,
   "wis": 13,
   "cha": 6
  },
  "saves": {
   "con": 7
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 120 尺，被动察觉 11",
  "languages": "腐食兽语；心灵感应 120 尺（接收方无法以心灵感应回应）",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "腐食兽进行一次啮咬攻击和两次触手攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：12（2d8+3）穿刺伤害，并且目标陷入中毒状态。每当处于中毒状态的目标完成一次长休，它都要承受下列效应。体质豁免：DC 15。失败：目标的生命值上限降低 5（1d10），并且在目标的中毒状态结束之前不会恢复正常。成功：中毒状态结束。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d8+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 15,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "poisoned"
   },
   {
    "name": "触手",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：12（2d8+3）穿刺伤害。如果目标是中型或更小的生物，它被两条触手之一擒抱，陷入被擒抱状态（逃脱 DC 13）。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d8+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "触手猛击",
    "desc": "体质豁免：DC 14，每个被腐食兽擒抱的生物。失败：16（3d8+3）钝击伤害，并且目标陷入震慑状态，直到腐食兽的下个回合开始。成功：仅伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "3d8+3",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 14,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "stunned"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "owlbear",
  "name": "枭熊",
  "size": "大型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 59,
  "hitDice": "7d10+21",
  "speed": "40 尺，攀爬40 尺",
  "abilities": {
   "str": 20,
   "dex": 12,
   "con": 17,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "枭熊进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：14（2d8+5）挥砍伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d8+5",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "pegasus",
  "name": "天马",
  "size": "大型",
  "type": "天界生物",
  "alignment": "混乱善良",
  "ac": 12,
  "acNote": "",
  "hp": 59,
  "hitDice": "7d10+21",
  "speed": "60 尺，飞行90 尺",
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 15,
   "cha": 13
  },
  "saves": {
   "dex": 4,
   "con": 5,
   "wis": 4,
   "cha": 3
  },
  "skills": {
   "perception": 6
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 16",
  "languages": "听得懂天界语、通用语、精灵语和木族语但不会说",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "蹄击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：7（1d6+4）钝击伤害外加5（2d4）光耀伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d6+4",
      "type": "bludgeoning"
     },
     {
      "dice": "2d4",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "phase-spider",
  "name": "相位蜘蛛",
  "size": "大型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 45,
  "hitDice": "7d10+7",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 15,
   "dex": 16,
   "con": 12,
   "int": 6,
   "wis": 10,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "stealth": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "以太视觉",
    "desc": "蜘蛛身处物质位面时，可以看见以太位面中 60 尺内的事物，反之亦然。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蛛行",
    "desc": "蜘蛛可以攀爬困难的表面，包括沿天花板倒爬，而无须进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蛛网行者",
    "desc": "蜘蛛无视蛛网造成的移动限制，并且知道与同一张蛛网接触的任何其他生物的位置。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "蜘蛛进行两次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：8（1d10+3）穿刺伤害外加9（2d8）毒素伤害。如果这些伤害使目标的生命值降到 0，目标变为稳定，并陷入中毒状态，持续 1 小时。处于中毒状态期间，目标同时处于麻痹状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d10+3",
      "type": "piercing"
     },
     {
      "dice": "2d8",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "以太跃迁",
    "desc": "蜘蛛从物质位面传送到以太位面，或从以太位面传送到物质位面。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "pirate",
  "name": "海盗",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 14,
  "acNote": "",
  "hp": 33,
  "hitDice": "6d8+6",
  "speed": "30 尺",
  "abilities": {
   "str": 10,
   "dex": 16,
   "con": 12,
   "int": 8,
   "wis": 12,
   "cha": 14
  },
  "saves": {
   "dex": 5,
   "cha": 4
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 11",
  "languages": "通用语及另外一种语言",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "海盗进行两次匕首攻击。它可以用一次迷人风采代替其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "匕首",
    "desc": "近战或远程攻击检定：+5，触及 5 尺或射程 20/60 尺。命中：5（1d4+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "迷人风采",
    "desc": "感知豁免：DC 12，海盗 30 尺内一个它能看见的生物。失败：目标陷入魅惑状态，直到海盗的下个回合开始。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "charmed"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "priest-acolyte",
  "name": "祭司侍僧",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 13,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "30 尺",
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 12,
   "int": 10,
   "wis": 14,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "medicine": 4,
   "religion": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "通用语",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "硬头锤",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）钝击伤害外加 2（1d4）光耀伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "bludgeoning"
     },
     {
      "dice": "1d4",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "光耀火焰",
    "desc": "远程攻击检定：+4，射程 60 尺。命中：7（2d6）光耀伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d6",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "祭司施展下列法术之一，以感知为施法属性：随意：《光亮术》、《奇术》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "神圣援助（每日 1 次）",
    "desc": "祭司施展《祝福术》、《治疗真言》或《庇护术》，使用与「施法」相同的施法属性。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 1,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "priest",
  "name": "祭司",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 13,
  "acNote": "",
  "hp": 38,
  "hitDice": "7d8+7",
  "speed": "30 尺",
  "abilities": {
   "str": 16,
   "dex": 10,
   "con": 12,
   "int": 13,
   "wis": 16,
   "cha": 13
  },
  "saves": {},
  "skills": {
   "medicine": 7,
   "perception": 5,
   "religion": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 15",
  "languages": "通用语及另外一种语言",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "祭司进行两次攻击，任意组合使用硬头锤或光耀火焰。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "硬头锤",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）钝击伤害外加 5（2d4）光耀伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "bludgeoning"
     },
     {
      "dice": "2d4",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "光耀火焰",
    "desc": "远程攻击检定：+5，射程 60 尺。命中：11（2d10）光耀伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d10",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "祭司施展下列法术之一，以感知为施法属性（法术豁免 DC 13）：随意：《光亮术》、《奇术》；每日 1 次：《灵体卫士》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "神圣援助（每日 3 次）",
    "desc": "祭司施展《祝福术》、《解除魔法》、《治疗真言》或《次级复原术》，使用与「施法」相同的施法属性。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 3,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "pseudodragon",
  "name": "伪龙",
  "size": "微型",
  "type": "龙",
  "alignment": "中立善良",
  "ac": 14,
  "acNote": "",
  "hp": 10,
  "hitDice": "3d4+3",
  "speed": "15 尺，飞行60 尺",
  "abilities": {
   "str": 6,
   "dex": 15,
   "con": 13,
   "int": 10,
   "wis": 12,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 15",
  "languages": "听得懂通用语和龙语但不会说",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "魔法抗性",
    "desc": "伪龙进行对抗法术和其他魔法效应的豁免检定时具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "伪龙进行两次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蜇刺",
    "desc": "体质豁免：DC 12，伪龙 5 尺内一个它能看见的生物。失败：5（2d4）毒素伤害，且目标陷入中毒状态，持续 1 小时。失败 5 点或以上：处于中毒状态期间，目标同时陷入昏迷状态；如果目标受到伤害，或其 5 尺内的一个生物花费一个动作将其唤醒，该昏迷状态提前结束。",
    "attack": null,
    "damage": [
     {
      "dice": "2d4",
      "type": "poison"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "poisoned"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "quasit",
  "name": "夸塞魔",
  "size": "微型",
  "type": "邪魔",
  "alignment": "混乱邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 25,
  "hitDice": "10d4",
  "speed": "40 尺",
  "abilities": {
   "str": 5,
   "dex": 17,
   "con": 10,
   "int": 7,
   "wis": 10,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "stealth": 5
  },
  "resist": [
   "cold",
   "fire",
   "lightning"
  ],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "poisoned"
  ],
  "senses": "黑暗视觉 120 尺，被动察觉 10",
  "languages": "深渊语、通用语",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "魔法抗性",
    "desc": "夸塞魔进行对抗法术和其他魔法效应的豁免检定时具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：5（1d4+3）挥砍伤害，且目标陷入中毒状态，直到夸塞魔的下个回合开始。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "隐形",
    "desc": "夸塞魔对自身施展《隐形术》，无需法术成分，以魅力为施法属性。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "惊吓（每日 1 次）",
    "desc": "感知豁免：DC 10，20 尺内的一个生物。失败：目标陷入恐慌状态。目标在其每个回合结束时重复进行该豁免，成功则结束自身的该效应。1 分钟后，目标自动成功。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": 1,
    "multiattack": false,
    "saveCondition": "frightened"
   },
   {
    "name": "变形",
    "desc": "夸塞魔变形成蝙蝠（速度 10 尺，飞行 40 尺）、蜈蚣（40 尺，攀爬 40 尺）或蟾蜍（40 尺，游泳 40 尺）的模样，或者变回其真实形态。除速度外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "red-dragon-wyrmling",
  "name": "红龙幼龙",
  "size": "中型",
  "type": "龙",
  "alignment": "混乱邪恶",
  "ac": 17,
  "acNote": "",
  "hp": 75,
  "hitDice": "10d8+30",
  "speed": "30 尺，攀爬30 尺，飞行60 尺",
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 12,
   "wis": 11,
   "cha": 15
  },
  "saves": {
   "dex": 2,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "stealth": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "fire"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 14",
  "languages": "龙语",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "龙进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：9（1d10+4）挥砍伤害外加 3（1d6）火焰伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d10+4",
      "type": "slashing"
     },
     {
      "dice": "1d6",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "火焰吐息（充能 5～6）",
    "desc": "敏捷豁免：DC 13，15 尺锥形内的每个生物。失败：24（7d6）火焰伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "7d6",
      "type": "fire"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 13,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "roper",
  "name": "绳鞭怪",
  "size": "大型",
  "type": "异怪",
  "alignment": "中立邪恶",
  "ac": 20,
  "acNote": "",
  "hp": 93,
  "hitDice": "11d10+33",
  "speed": "10 尺，攀爬20 尺",
  "abilities": {
   "str": 18,
   "dex": 8,
   "con": 17,
   "int": 7,
   "wis": 16,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "perception": 6,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 16",
  "languages": "",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "蛛行",
    "desc": "绳鞭怪能攀爬困难的表面，包括沿天花板爬行，且无需进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "绳鞭怪进行两次触手攻击，使用一次收卷，并进行两次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：17（3d8+4）穿刺伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "3d8+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "触手",
    "desc": "近战攻击检定：+7，触及 60 尺。命中：目标陷入被擒抱状态（逃脱 DC 14），擒抱它的是六条触手之一；直到该擒抱结束前，目标处于中毒状态。触手可以被伤害（AC 20，生命值 10，免疫毒素和心灵伤害），触手被摧毁时会释放被它擒抱的生物。伤害触手不会对绳鞭怪造成伤害，被摧毁的触手会在绳鞭怪的下个回合开始时重新长出。",
    "attack": 7,
    "damage": [],
    "save": {
     "ability": "str",
     "dc": 14,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "收卷",
    "desc": "绳鞭怪将每个被它擒抱的生物朝自身直线拉近至多 30 尺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "rust-monster",
  "name": "锈怪",
  "size": "中型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 33,
  "hitDice": "6d8+6",
  "speed": "40 尺",
  "abilities": {
   "str": 13,
   "dex": 12,
   "con": 13,
   "int": 2,
   "wis": 13,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 11",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "嗅铁",
    "desc": "锈怪能精确定位自身 30 尺内含铁金属的位置。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "锈怪进行一次啮咬攻击，并使用两次触角。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：5（1d8+1）穿刺伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d8+1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "触角",
    "desc": "锈怪以自身 5 尺内一个生物穿戴或携带的一件非魔法金属物品（护甲或武器）为目标。敏捷豁免：DC 11，持有该物品的生物。失败：该物品提供的 AC（护甲）或该物品的攻击检定（武器）承受 -1 减值。如果减值使护甲的 AC 降至 10，护甲被摧毁；如果武器的减值达到 -5，武器被摧毁。对该护甲或武器施展《修复术》可以移除减值。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "dex",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "摧毁金属",
    "desc": "锈怪触碰自身 5 尺内一件未被穿戴或携带的非魔法金属物品。这次触碰会摧毁该物品中 1 尺立方的部分。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": [
   {
    "name": "反射触角",
    "desc": "触发：一次攻击检定命中锈怪。反应：锈怪使用触角。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ]
 },
 {
  "key": "sahuagin-warrior",
  "name": "鱼魔人战士",
  "size": "中型",
  "type": "邪魔",
  "alignment": "守序邪恶",
  "ac": 12,
  "acNote": "",
  "hp": 22,
  "hitDice": "4d8+4",
  "speed": "30 尺，游泳40 尺",
  "abilities": {
   "str": 13,
   "dex": 11,
   "con": 12,
   "int": 12,
   "wis": 13,
   "cha": 9
  },
  "saves": {},
  "skills": {
   "perception": 5
  },
  "resist": [
   "acid",
   "cold"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 120 尺，被动察觉 15",
  "languages": "鱼魔人语",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "血之狂乱",
    "desc": "鱼魔人对任何生命值未满的生物进行攻击检定时具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "有限两栖",
    "desc": "鱼魔人能呼吸空气和水，但它必须每 4 小时至少完全浸入水中一次，以免在水外窒息。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "鲨鱼心灵感应",
    "desc": "鱼魔人能通过一种特殊的心灵感应，以魔法控制自身 120 尺内的鲨鱼。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "鱼魔人进行两次爪击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：4（1d6+1）挥砍伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d6+1",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "水中冲锋",
    "desc": "鱼魔人朝一个它能看见的敌人直线游动，距离至多等于其游泳速度。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "salamander",
  "name": "火蜥蜴",
  "size": "大型",
  "type": "元素生物",
  "alignment": "中立邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 90,
  "hitDice": "12d10+24",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 15,
   "int": 11,
   "wis": 10,
   "cha": 12
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [
   "cold"
  ],
  "immune": [
   "fire"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "原初语（火族语）",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "火焰灵光",
    "desc": "在火蜥蜴的每个回合结束时，以火蜥蜴为源点的 5 尺散发内，由火蜥蜴选择的每个生物受到 7（2d6）火焰伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "2d6",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "火蜥蜴进行两次烈焰矛攻击。它可以用一次绞杀替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "烈焰矛",
    "desc": "近战或远程攻击检定：+7，触及 5 尺或射程 20/60 尺。命中：13（2d8+4）穿刺伤害外加 7（2d6）火焰伤害。命中或未命中：进行远程攻击后，矛立即以魔法方式回到火蜥蜴手中。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d8+4",
      "type": "piercing"
     },
     {
      "dice": "2d6",
      "type": "fire"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "绞杀",
    "desc": "力量豁免：DC 15，火蜥蜴 10 尺内一个它能看见的大型或更小的生物。失败：11（2d6+4）钝击伤害外加 7（2d6）火焰伤害。目标陷入被擒抱状态（逃脱 DC 14），并且直到该擒抱结束前处于束缚状态。",
    "attack": null,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "bludgeoning"
     },
     {
      "dice": "2d6",
      "type": "fire"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 15,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "satyr",
  "name": "萨提尔",
  "size": "中型",
  "type": "精类",
  "alignment": "混乱中立",
  "ac": 13,
  "acNote": "",
  "hp": 31,
  "hitDice": "7d8",
  "speed": "40 尺",
  "abilities": {
   "str": 12,
   "dex": 16,
   "con": 11,
   "int": 12,
   "wis": 10,
   "cha": 14
  },
  "saves": {},
  "skills": {
   "perception": 2,
   "performance": 6,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "通用语、精灵语、木族语",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "魔法抗性",
    "desc": "萨提尔进行对抗法术和其他魔法效应的豁免检定时具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "蹄击",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：5（1d4+3）钝击伤害。如果目标是中型或更小的生物，萨提尔将目标从自身处直线推开至多 10 尺。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "嘲弄",
    "desc": "感知豁免：DC 12，萨提尔 90 尺内一个它能看见的生物。失败：5（1d6+2）心灵伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "psychic"
     }
    ],
    "save": {
     "ability": "wis",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "scout",
  "name": "斥候",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 13,
  "acNote": "",
  "hp": 16,
  "hitDice": "3d8+3",
  "speed": "30 尺",
  "abilities": {
   "str": 11,
   "dex": 14,
   "con": 12,
   "int": 11,
   "wis": 13,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "nature": 4,
   "perception": 5,
   "stealth": 6,
   "survival": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 15",
  "languages": "通用语及另外一种语言",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "斥候进行两次攻击，任意组合使用短剑和长弓。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "短剑",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "长弓",
    "desc": "远程攻击检定：+4，射程 150/600 尺。命中：6（1d8+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "sea-hag",
  "name": "海妖婆",
  "size": "中型",
  "type": "精类",
  "alignment": "混乱邪恶",
  "ac": 14,
  "acNote": "",
  "hp": 52,
  "hitDice": "7d8+21",
  "speed": "30 尺，游泳40 尺",
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 16,
   "int": 12,
   "wis": 12,
   "cha": 13
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 11",
  "languages": "通用语、巨人语、原初语（水族语）",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "妖婆能呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "巫会魔法",
    "desc": "当妖婆位于至少两名妖婆盟友 30 尺内时，它可以施展下列法术之一，无需材料成分，使用该法术的正常施法时间，并以智力为施法属性（法术豁免 DC 11）：《卜筮术》、《寻获魔宠》、《鉴定术》、《物品定位术》、《探知术》或《隐形仆役》。妖婆必须完成一次长休，才能再次使用此特性施展同一个法术。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "丑恶外貌",
    "desc": "感知豁免：DC 11，任何在妖婆 30 尺内开始其回合、且能看见妖婆真实形态的野兽或类人生物。失败：目标陷入恐慌状态，直到其下个回合开始。成功：目标在 24 小时内免疫该妖婆的丑恶外貌。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "frightened"
   }
  ],
  "actions": [
   {
    "name": "爪击",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "死亡凝视（充能 5～6）",
    "desc": "感知豁免：DC 11，妖婆 30 尺内一个它能看见的、处于恐慌状态的生物。失败：如果目标的生命值不超过 20，其生命值降至 0。否则，目标受到 13（3d8）心灵伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "3d8",
      "type": "psychic"
     }
    ],
    "save": {
     "ability": "wis",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "幻象外貌",
    "desc": "妖婆施展《易容术》，以体质为施法属性（法术豁免 DC 13）。该法术的持续时间为 24 小时。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "shadow",
  "name": "阴影",
  "size": "中型",
  "type": "不死生物",
  "alignment": "混乱邪恶",
  "ac": 12,
  "acNote": "",
  "hp": 27,
  "hitDice": "5d8+5",
  "speed": "40 尺",
  "abilities": {
   "str": 6,
   "dex": 14,
   "con": 13,
   "int": 6,
   "wis": 10,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "stealth": 6
  },
  "resist": [
   "acid",
   "cold",
   "fire",
   "lightning",
   "thunder"
  ],
  "vulnerable": [
   "radiant"
  ],
  "immune": [
   "necrotic",
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "frightened",
   "grappled",
   "paralyzed",
   "petrified",
   "poisoned",
   "prone",
   "restrained",
   "unconscious"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "无定形",
    "desc": "阴影能穿过窄至 1 英寸的空间，且无需为此消耗额外移动力。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "日光虚弱",
    "desc": "处于日光下时，阴影进行 d20 检定具有劣势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "汲取挥击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）暗蚀伤害，且目标的力量值降低 1d4。如果这使该属性值降至 0，目标死亡。如果一个类人生物被此攻击杀死，1d4 小时后会有一个阴影从其尸体中升起。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "暗影潜行",
    "desc": "处于微光或黑暗中时，阴影执行躲藏动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "shambling-mound",
  "name": "蹒跚土丘",
  "size": "大型",
  "type": "植物",
  "alignment": "无阵营",
  "ac": 15,
  "acNote": "",
  "hp": 110,
  "hitDice": "13d10+39",
  "speed": "30 尺，游泳20 尺",
  "abilities": {
   "str": 18,
   "dex": 8,
   "con": 16,
   "int": 5,
   "wis": 10,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "stealth": 3
  },
  "resist": [
   "cold",
   "fire"
  ],
  "vulnerable": [],
  "immune": [
   "lightning"
  ],
  "conditionImmune": [
   "deafened",
   "exhaustion"
  ],
  "senses": "盲视 60 尺，被动察觉 10",
  "languages": "",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "闪电吸收",
    "desc": "每当蹒跚土丘遭受闪电伤害时，它恢复与所造成闪电伤害等量的生命值。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "蹒跚土丘进行三次带电卷须攻击。它可以用一次吞没替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "带电卷须",
    "desc": "近战攻击检定：+7，触及 10 尺。命中：7（1d6+4）钝击伤害外加 5（2d4）闪电伤害。如果目标是中型或更小的生物，蹒跚土丘将目标朝自身直线拉近 5 尺。",
    "attack": 7,
    "damage": [
     {
      "dice": "1d6+4",
      "type": "bludgeoning"
     },
     {
      "dice": "2d4",
      "type": "lightning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "吞没",
    "desc": "力量豁免：DC 15，5 尺内一个中型或更小的生物。失败：目标被拉入蹒跚土丘所在的空间，并陷入被擒抱状态（逃脱 DC 14）。直到该擒抱结束前，目标处于目盲和束缚状态，并在其每个回合开始时受到 10（3d6）闪电伤害。蹒跚土丘移动时，被擒抱的目标随之移动，这不会使蹒跚土丘消耗额外移动力。蹒跚土丘同一时间只能通过此动作擒抱一个生物。",
    "attack": null,
    "damage": [
     {
      "dice": "3d6",
      "type": "lightning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 15,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "grappled"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "silver-dragon-wyrmling",
  "name": "银龙幼龙",
  "size": "中型",
  "type": "龙",
  "alignment": "守序善良",
  "ac": 17,
  "acNote": "",
  "hp": 45,
  "hitDice": "6d8+18",
  "speed": "30 尺，飞行60 尺",
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 12,
   "wis": 11,
   "cha": 15
  },
  "saves": {
   "dex": 2,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "stealth": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "cold"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 14",
  "languages": "龙语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "龙进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：9（1d10+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d10+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "寒冰吐息（充能 5～6）",
    "desc": "体质豁免：DC 13，15 尺锥形内的每个生物。失败：18（4d8）冷冻伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "4d8",
      "type": "cold"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 13,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "麻痹吐息",
    "desc": "体质豁免：DC 13，15 尺锥形内的每个生物。第一次失败：目标陷入失能状态，直到其下个回合结束，届时它重复进行该豁免。第二次失败：目标陷入麻痹状态，并在其每个回合结束时重复进行该豁免，成功则结束自身的该效应。1 分钟后，目标自动成功。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "con",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "incapacitated"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "skeleton",
  "name": "骷髅",
  "size": "中型",
  "type": "不死生物",
  "alignment": "守序邪恶",
  "ac": 14,
  "acNote": "",
  "hp": 13,
  "hitDice": "2d8+4",
  "speed": "30 尺",
  "abilities": {
   "str": 10,
   "dex": 16,
   "con": 15,
   "int": 6,
   "wis": 8,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [
   "bludgeoning"
  ],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 9",
  "languages": "听得懂通用语及另外一种语言但不会说",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "短剑",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "短弓",
    "desc": "远程攻击检定：+5，射程 80/320 尺。命中：6（1d6+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "warhorse-skeleton",
  "name": "战马骷髅",
  "size": "大型",
  "type": "不死生物",
  "alignment": "守序邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 22,
  "hitDice": "3d10+6",
  "speed": "60 尺",
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 15,
   "int": 2,
   "wis": 8,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [
   "bludgeoning"
  ],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 9",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "蹄击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：7（1d6+4）钝击伤害。如果目标是大型或更小的生物，且骷髅在这次命中之前刚刚朝目标直线移动了至少 20 尺，目标陷入倒地状态。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d6+4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "minotaur-skeleton",
  "name": "牛头人骷髅",
  "size": "大型",
  "type": "不死生物",
  "alignment": "守序邪恶",
  "ac": 12,
  "acNote": "",
  "hp": 45,
  "hitDice": "6d10+12",
  "speed": "40 尺",
  "abilities": {
   "str": 18,
   "dex": 11,
   "con": 15,
   "int": 6,
   "wis": 8,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [
   "bludgeoning"
  ],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 9",
  "languages": "听得懂深渊语但不会说",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "顶撞",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：11（2d6+4）穿刺伤害。如果目标是大型或更小的生物，且骷髅在这次命中之前刚刚朝目标直线移动了至少 20 尺，目标额外受到 9（2d8）穿刺伤害，并陷入倒地状态。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "piercing"
     },
     {
      "dice": "2d8",
      "type": "piercing",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "猛击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：15（2d10+4）钝击伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d10+4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "specter",
  "name": "幽灵",
  "size": "中型",
  "type": "不死生物",
  "alignment": "混乱邪恶",
  "ac": 12,
  "acNote": "",
  "hp": 22,
  "hitDice": "5d8",
  "speed": "30 尺，飞行50 尺（悬浮）",
  "abilities": {
   "str": 1,
   "dex": 14,
   "con": 11,
   "int": 10,
   "wis": 10,
   "cha": 11
  },
  "saves": {},
  "skills": {},
  "resist": [
   "acid",
   "bludgeoning",
   "cold",
   "fire",
   "lightning",
   "piercing",
   "slashing",
   "thunder"
  ],
  "vulnerable": [],
  "immune": [
   "necrotic",
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "exhaustion",
   "grappled",
   "paralyzed",
   "petrified",
   "poisoned",
   "prone",
   "restrained",
   "unconscious"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "听得懂通用语及另外一种语言但不会说",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "虚体移动",
    "desc": "幽灵能穿过其他生物和物体，视同穿过困难地形。如果它在物体内部结束其回合，它受到 5（1d10）力场伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "1d10",
      "type": "force"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "日光敏感",
    "desc": "处于日光下时，幽灵进行属性检定和攻击检定具有劣势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "生命吸取",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：7（2d6）暗蚀伤害。如果目标是生物，其生命值上限减少，减少量等于其受到的伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d6",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "sphinx-of-wonder",
  "name": "奇迹斯芬克斯",
  "size": "微型",
  "type": "天界生物",
  "alignment": "守序善良",
  "ac": 13,
  "acNote": "",
  "hp": 24,
  "hitDice": "7d4+7",
  "speed": "20 尺，飞行40 尺",
  "abilities": {
   "str": 6,
   "dex": 17,
   "con": 13,
   "int": 15,
   "wis": 12,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "arcana": 4,
   "religion": 4,
   "stealth": 5
  },
  "resist": [
   "necrotic",
   "psychic",
   "radiant"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 11",
  "languages": "天界语、通用语",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "魔法抗性",
    "desc": "斯芬克斯进行对抗法术和其他魔法效应的豁免检定时具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：5（1d4+3）挥砍伤害外加 7（2d6）光耀伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "slashing"
     },
     {
      "dice": "2d6",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": [
   {
    "name": "灵光乍现（每日 2 次）",
    "desc": "触发：斯芬克斯或其 30 尺内的另一个生物进行一次属性检定或豁免检定。反应：斯芬克斯为该次掷骰加 2。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 2,
    "multiattack": false
   }
  ]
 },
 {
  "key": "sprite",
  "name": "小妖精",
  "size": "微型",
  "type": "精类",
  "alignment": "中立善良",
  "ac": 15,
  "acNote": "",
  "hp": 10,
  "hitDice": "4d4",
  "speed": "10 尺，飞行40 尺",
  "abilities": {
   "str": 3,
   "dex": 18,
   "con": 10,
   "int": 14,
   "wis": 13,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "perception": 3,
   "stealth": 8
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 13",
  "languages": "通用语、精灵语、木族语",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "针剑",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：6（1d4+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d4+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "魅惑之弓",
    "desc": "远程攻击检定：+6，射程 40/160 尺。命中：1 点穿刺伤害，且目标陷入魅惑状态，直到小妖精的下个回合开始。",
    "attack": 6,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "观心",
    "desc": "魅力豁免：DC 10，小妖精 5 尺内一个它能看见的生物（天界生物、邪魔和不死生物自动豁免失败）。失败：小妖精得知目标的情绪和阵营。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "cha",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "隐形",
    "desc": "小妖精对自身施展《隐形术》，无需法术成分，以魅力为施法属性。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "spy",
  "name": "间谍",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 12,
  "acNote": "",
  "hp": 27,
  "hitDice": "6d8",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 10,
   "dex": 15,
   "con": 10,
   "int": 12,
   "wis": 14,
   "cha": 16
  },
  "saves": {},
  "skills": {
   "deception": 5,
   "insight": 4,
   "investigation": 5,
   "perception": 6,
   "sleight-of-hand": 4,
   "stealth": 6
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 16",
  "languages": "通用语及另外一种语言",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "短剑",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）穿刺伤害外加 7（2d6）毒素伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     },
     {
      "dice": "2d6",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "手弩",
    "desc": "远程攻击检定：+4，射程 30/120 尺。命中：5（1d6+2）穿刺伤害外加 7（2d6）毒素伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     },
     {
      "dice": "2d6",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "灵巧动作",
    "desc": "间谍执行疾走、撤离或躲藏动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "stirge",
  "name": "吸血蝠",
  "size": "微型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 5,
  "hitDice": "2d4",
  "speed": "10 尺，飞行40 尺",
  "abilities": {
   "str": 4,
   "dex": 16,
   "con": 11,
   "int": 2,
   "wis": 8,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 9",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "口器",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）穿刺伤害，且吸血蝠附着在目标身上。附着期间，吸血蝠无法进行口器攻击，目标在吸血蝠的每个回合开始时受到 5（2d4）暗蚀伤害。吸血蝠可以花费 5 尺移动力使自身脱离。目标或其 5 尺内的一个生物可以用一个动作使吸血蝠脱离。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "piercing"
     },
     {
      "dice": "2d4",
      "type": "necrotic",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "succubus",
  "name": "魅魔",
  "size": "中型",
  "type": "邪魔",
  "alignment": "中立邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 71,
  "hitDice": "13d8+13",
  "speed": "30 尺，飞行60 尺",
  "abilities": {
   "str": 8,
   "dex": 17,
   "con": 13,
   "int": 15,
   "wis": 12,
   "cha": 20
  },
  "saves": {},
  "skills": {
   "deception": 9,
   "insight": 5,
   "perception": 5,
   "persuasion": 9,
   "stealth": 7
  },
  "resist": [
   "cold",
   "fire",
   "poison",
   "psychic"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "深渊语、通用语、炼狱语；心灵感应 60 尺",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [
   {
    "name": "梦魔形态",
    "desc": "魅魔完成一次长休时，可以变形为梦魔，改用梦魔的数据块代替本数据块。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "魅魔进行一次邪魔之触攻击，并使用魅惑或汲取之吻。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "邪魔之触",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：16（2d10+5）心灵伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d10+5",
      "type": "psychic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "魅惑",
    "desc": "魅魔施展《支配人类》（8 环版本），无需法术成分，以魅力为施法属性（法术豁免 DC 15）。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "汲取之吻",
    "desc": "体质豁免：DC 15，魅魔 5 尺内一个被它魅惑的生物。失败：13（3d8）心灵伤害。成功：伤害减半。失败或成功：目标的生命值上限减少，减少量等于其受到的伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "3d8",
      "type": "psychic"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 15,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "魅魔变形为一个中型或小型的类人生物，或者变回其真实形态。它在每种形态下的游戏数据都相同，只是其飞行速度仅在真实形态下可用。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "tough",
  "name": "恶棍",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 12,
  "acNote": "",
  "hp": 32,
  "hitDice": "5d8+10",
  "speed": "30 尺",
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 14,
   "int": 10,
   "wis": 10,
   "cha": 11
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果恶棍至少有一个盟友位于某生物 5 尺内，且该盟友未处于失能状态，则恶棍对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "硬头锤",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）钝击伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "重弩",
    "desc": "远程攻击检定：+3，射程 100/400 尺。命中：6（1d10+1）穿刺伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d10+1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "tough-boss",
  "name": "恶棍头目",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 16,
  "acNote": "",
  "hp": 82,
  "hitDice": "11d8+33",
  "speed": "30 尺",
  "abilities": {
   "str": 17,
   "dex": 14,
   "con": 16,
   "int": 11,
   "wis": 10,
   "cha": 11
  },
  "saves": {
   "str": 5,
   "con": 5,
   "cha": 2
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语及另外一种语言",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果恶棍至少有一个盟友位于某生物 5 尺内，且该盟友未处于失能状态，则恶棍对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "恶棍进行两次攻击，任意组合使用战锤或重弩。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "战锤",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：12（2d8+3）钝击伤害。如果目标是大型或更小的生物，恶棍将目标从自身处直线推开至多 10 尺。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d8+3",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "重弩",
    "desc": "远程攻击检定：+4，射程 100/400 尺。命中：13（2d10+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d10+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "troll",
  "name": "巨魔",
  "size": "大型",
  "type": "巨人",
  "alignment": "混乱邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 94,
  "hitDice": "9d10+45",
  "speed": "30 尺",
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 20,
   "int": 7,
   "wis": 9,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "巨人语",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "可憎断肢（每日 4 次）",
    "desc": "如果巨魔在任意回合结束时处于浴血状态，且在该回合内受到了至少 15 点挥砍伤害，巨魔的一条肢体会被斩断，掉落在巨魔所在的空间中，并成为一个巨魔断肢。该断肢在巨魔的回合结束后立即行动。巨魔每缺失一条肢体就承受 1 级力竭，它会在下次恢复生命值时长出替代的肢体。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 4,
    "multiattack": false
   },
   {
    "name": "再生",
    "desc": "巨魔在其每个回合开始时恢复 15 点生命值。如果巨魔受到强酸或火焰伤害，此特性在巨魔的下个回合不起作用。只有当巨魔在生命值为 0 的情况下开始其回合且没有再生时，它才会死亡。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "巨魔进行三次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+7，触及 10 尺。命中：11（2d6+4）挥砍伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "冲锋",
    "desc": "巨魔朝一个它能看见的敌人直线移动，距离至多为其速度的一半。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "troll-limb",
  "name": "巨魔断肢",
  "size": "小型",
  "type": "巨人",
  "alignment": "混乱邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 14,
  "hitDice": "4d6",
  "speed": "20 尺",
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 10,
   "int": 1,
   "wis": 9,
   "cha": 1
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 9",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "再生",
    "desc": "断肢在其每个回合开始时恢复 5 点生命值。如果断肢受到强酸或火焰伤害，此特性在断肢的下个回合不起作用。只有当断肢在生命值为 0 的情况下开始其回合且没有再生时，它才会死亡。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "巨魔衍生",
    "desc": "断肢不可思议地拥有与完整巨魔相同的感官。如果断肢在 24 小时内没有被摧毁，掷 1d12。如果掷出 12，断肢变成一个巨魔；否则，断肢枯萎消亡。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：9（2d4+4）挥砍伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d4+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "unicorn",
  "name": "独角兽",
  "size": "大型",
  "type": "天界生物",
  "alignment": "守序善良",
  "ac": 12,
  "acNote": "",
  "hp": 97,
  "hitDice": "13d10+26",
  "speed": "50 尺",
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 15,
   "int": 11,
   "wis": 17,
   "cha": 16
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "paralyzed",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "天界语、精灵语、木族语；心灵感应 120 尺",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "传奇抗性（每日 3 次）",
    "desc": "如果独角兽豁免检定失败，它可以选择改为成功。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 3,
    "multiattack": false
   },
   {
    "name": "魔法抗性",
    "desc": "独角兽进行对抗法术和其他魔法效应的豁免检定时具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "独角兽进行一次蹄击攻击和一次光耀之角攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "蹄击",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：11（2d6+4）钝击伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "光耀之角",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：9（1d10+4）光耀伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "1d10+4",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "独角兽施展下列法术之一，无需法术成分，以魅力为施法属性（法术豁免 DC 14）：随意：《侦测善恶》、《德鲁伊伎俩》；每日各 1 次：《安定心神》、《驱散善恶》、《纠缠术》、《行动无踪》、《回返真言》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "vampire-familiar",
  "name": "吸血鬼眷属",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "中立邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 65,
  "hitDice": "10d8+20",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 17,
   "dex": 16,
   "con": 15,
   "int": 10,
   "wis": 10,
   "cha": 14
  },
  "saves": {
   "dex": 5,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "persuasion": 4,
   "stealth": 7
  },
  "resist": [
   "necrotic"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "charmed"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "通用语及另外一种语言",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "吸血鬼联结",
    "desc": "当眷属与其吸血鬼主人位于同一个存在位面时，吸血鬼能通过心灵感应与眷属交流，并能通过眷属的感官进行感知。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "眷属进行两次暗影匕首攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "暗影匕首",
    "desc": "近战或远程攻击检定：+5，触及 5 尺或射程 20/60 尺。命中：5（1d4+3）穿刺伤害外加 7（3d4）暗蚀伤害。如果此攻击使目标的生命值降至 0，目标变为稳定，但陷入中毒状态，持续 1 小时。处于中毒状态期间，目标同时处于麻痹状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "piercing"
     },
     {
      "dice": "3d4",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "不死敏捷",
    "desc": "眷属执行疾走或撤离动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "vampire-spawn",
  "name": "衍体吸血鬼",
  "size": "Medium or small",
  "type": "不死生物",
  "alignment": "中立邪恶",
  "ac": 16,
  "acNote": "",
  "hp": 90,
  "hitDice": "12d8+36",
  "speed": "30 尺",
  "abilities": {
   "str": 16,
   "dex": 16,
   "con": 16,
   "int": 11,
   "wis": 10,
   "cha": 12
  },
  "saves": {
   "dex": 6,
   "wis": 3
  },
  "skills": {
   "perception": 3,
   "stealth": 6
  },
  "resist": [
   "necrotic"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "通用语及另外一种语言",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "蛛行",
    "desc": "吸血鬼能攀爬困难的表面，包括沿天花板爬行，且无需进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "吸血鬼弱点",
    "desc": "吸血鬼具有下列弱点：",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "禁入",
    "desc": "未经住户邀请，吸血鬼无法进入住所。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "流水",
    "desc": "如果吸血鬼在流水中结束其回合，它受到 20 点强酸伤害。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "木桩穿心",
    "desc": "如果在吸血鬼处于失能状态时，一把造成穿刺伤害的武器被刺入吸血鬼的心脏，吸血鬼会被摧毁。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "日光",
    "desc": "如果吸血鬼在日光下开始其回合，它受到 20 点光耀伤害。处于日光下时，它进行攻击检定和属性检定具有劣势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "吸血鬼进行两次爪击攻击，并使用啮咬。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：8（2d4+3）挥砍伤害。如果目标是中型或更小的生物，它陷入被擒抱状态（逃脱 DC 13），擒抱它的是两只爪子之一。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d4+3",
      "type": "slashing"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "啮咬",
    "desc": "体质豁免：DC 14，5 尺内一个自愿的生物，或者一个处于被擒抱、失能或束缚状态的生物。失败：5（1d4+3）穿刺伤害外加 10（3d6）暗蚀伤害。目标的生命值上限减少，减少量等于其受到的暗蚀伤害，且吸血鬼恢复等量的生命值。",
    "attack": null,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "piercing"
     },
     {
      "dice": "3d6",
      "type": "necrotic"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 14,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "不死敏捷",
    "desc": "吸血鬼执行疾走或撤离动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "warrior-infantry",
  "name": "步兵战士",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 13,
  "acNote": "",
  "hp": 9,
  "hitDice": "2d8",
  "speed": "30 尺",
  "abilities": {
   "str": 13,
   "dex": 11,
   "con": 11,
   "int": 8,
   "wis": 11,
   "cha": 8
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "通用语",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果战士至少有一个盟友位于某生物 5 尺内，且该盟友未处于失能状态，则战士对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "矛",
    "desc": "近战或远程攻击检定：+3，触及 5 尺或射程 20/60 尺。命中：4（1d6+1）穿刺伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d6+1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "warrior-veteran",
  "name": "老兵战士",
  "size": "Medium or small",
  "type": "类人生物",
  "alignment": "绝对中立",
  "ac": 17,
  "acNote": "",
  "hp": 65,
  "hitDice": "10d8+20",
  "speed": "30 尺",
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 14,
   "int": 10,
   "wis": 11,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "athletics": 5,
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "通用语及另外一种语言",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "战士进行两次巨剑或重弩攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "巨剑",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "重弩",
    "desc": "远程攻击检定：+3，射程 100/400 尺。命中：12（2d10+1）穿刺伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "2d10+1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": [
   {
    "name": "招架",
    "desc": "触发：战士在持握武器时被一次近战攻击检定命中。反应：战士的 AC 对该次攻击加 2，可能使该攻击未命中。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ]
 },
 {
  "key": "water-elemental",
  "name": "水元素",
  "size": "大型",
  "type": "元素生物",
  "alignment": "绝对中立",
  "ac": 14,
  "acNote": "",
  "hp": 114,
  "hitDice": "12d10+48",
  "speed": "30 尺，游泳90 尺",
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 18,
   "int": 5,
   "wis": 10,
   "cha": 8
  },
  "saves": {},
  "skills": {},
  "resist": [
   "acid",
   "fire"
  ],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "grappled",
   "paralyzed",
   "petrified",
   "poisoned",
   "prone",
   "restrained",
   "unconscious"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "原初语（水族语）",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "冻结",
    "desc": "如果水元素受到冷冻伤害，其速度降低 20 尺，直到其下个回合结束。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "水之形态",
    "desc": "水元素可以进入敌人的空间并停留在那里。它能穿过窄至 1 英寸的空间，且无需为此消耗额外移动力。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "水元素进行两次猛击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "猛击",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：13（2d8+4）钝击伤害。如果目标是中型或更小的生物，它陷入倒地状态。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d8+4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "淹没（充能 4～6）",
    "desc": "力量豁免：DC 15，水元素所在空间内的每个生物。失败：22（4d8+4）钝击伤害。如果目标是大型或更小的生物，它陷入被擒抱状态（逃脱 DC 14）。直到该擒抱结束前，目标处于束缚状态，并且除非它能呼吸水，否则会窒息；目标还会在水元素的每个回合开始时受到 9（2d8）钝击伤害。水元素同一时间可以用淹没擒抱一个大型生物，或者至多两个中型或更小的生物。水元素 5 尺内的一个生物可以用一个动作进行一次 DC 14 的力量（运动）检定，成功即可将一个生物从水元素中拉出。成功：仅受一半伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "4d8+4",
      "type": "bludgeoning"
     },
     {
      "dice": "2d8",
      "type": "bludgeoning",
      "when": "if"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 15,
     "onSuccess": "half"
    },
    "recharge": 4,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "werebear-human",
  "name": "熊人（人形态）",
  "size": "中型",
  "type": "怪兽",
  "alignment": "中立善良",
  "ac": 15,
  "acNote": "",
  "hp": 135,
  "hitDice": "18d8+54",
  "speed": "30 尺",
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 11,
   "wis": 12,
   "cha": 12
  },
  "saves": {},
  "skills": {
   "perception": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 17",
  "languages": "通用语（熊形态下不能说话）",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "熊人进行两次攻击，任意组合使用手斧或撕裂。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "手斧",
    "desc": "近战或远程攻击检定：+7，触及 5 尺或射程 20/60 尺。命中：14（3d6+4）挥砍伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "3d6+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "熊人变形为大型的熊类人混合形态或一头大型熊，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "werebear-hybrid",
  "name": "熊人（混合形态）",
  "size": "大型",
  "type": "怪兽",
  "alignment": "中立善良",
  "ac": 15,
  "acNote": "",
  "hp": 135,
  "hitDice": "18d8+54",
  "speed": "30 尺",
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 11,
   "wis": 12,
   "cha": 12
  },
  "saves": {},
  "skills": {
   "perception": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 17",
  "languages": "通用语（熊形态下不能说话）",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "熊人进行两次攻击，任意组合使用手斧或撕裂。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：17（2d12+4）穿刺伤害。如果目标是类人生物，它会受到下列效应影响。体质豁免：DC 14。失败：目标受到诅咒。如果受诅咒的目标生命值降至 0，它改为变成一个受 GM 控制的熊人，并拥有 10 点生命值。成功：目标在 24 小时内免疫该熊人的诅咒。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d12+4",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 14,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "手斧",
    "desc": "近战或远程攻击检定：+7，触及 5 尺或射程 20/60 尺。命中：14（3d6+4）挥砍伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "3d6+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：13（2d8+4）挥砍伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d8+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "熊人变形为大型的熊类人混合形态或一头大型熊，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "werebear-bear",
  "name": "熊人（熊形态）",
  "size": "大型",
  "type": "怪兽",
  "alignment": "中立善良",
  "ac": 15,
  "acNote": "",
  "hp": 135,
  "hitDice": "18d8+54",
  "speed": "40 尺，攀爬30 尺",
  "abilities": {
   "str": 19,
   "dex": 10,
   "con": 17,
   "int": 11,
   "wis": 12,
   "cha": 12
  },
  "saves": {},
  "skills": {
   "perception": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 17",
  "languages": "通用语（熊形态下不能说话）",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "熊人进行两次攻击，任意组合使用手斧或撕裂。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：17（2d12+4）穿刺伤害。如果目标是类人生物，它会受到下列效应影响。体质豁免：DC 14。失败：目标受到诅咒。如果受诅咒的目标生命值降至 0，它改为变成一个受 GM 控制的熊人，并拥有 10 点生命值。成功：目标在 24 小时内免疫该熊人的诅咒。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d12+4",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 14,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：13（2d8+4）挥砍伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d8+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "熊人变形为大型的熊类人混合形态或一头大型熊，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "wereboar-human",
  "name": "野猪人（人形态）",
  "size": "中型",
  "type": "怪兽",
  "alignment": "中立邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 97,
  "hitDice": "15d8+30",
  "speed": "30 尺",
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 15,
   "int": 10,
   "wis": 11,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "通用语（野猪形态下不能说话）",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "野猪人进行两次攻击，任意组合使用标枪或獠牙。它可以用一次顶撞攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "标枪",
    "desc": "近战或远程攻击检定：+5，触及 5 尺或射程 30/120 尺。命中：13（3d6+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "3d6+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "野猪人变形为中型的野猪类人混合体或一头小型野猪，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "wereboar-hybrid",
  "name": "野猪人（混合形态）",
  "size": "中型",
  "type": "怪兽",
  "alignment": "中立邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 97,
  "hitDice": "15d8+30",
  "speed": "30 尺",
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 15,
   "int": 10,
   "wis": 11,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "通用语（野猪形态下不能说话）",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "野猪人进行两次攻击，任意组合使用标枪或獠牙。它可以用一次顶撞攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "顶撞",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：12（2d8+3）穿刺伤害。如果目标是类人生物，它会受到下列效应影响。体质豁免：DC 12。失败：目标受到诅咒。如果受诅咒的目标生命值降至 0，它改为变成一个受 GM 控制的野猪人，并拥有 10 点生命值。成功：目标在 24 小时内免疫该野猪人的诅咒。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d8+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "标枪",
    "desc": "近战或远程攻击检定：+5，触及 5 尺或射程 30/120 尺。命中：13（3d6+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "3d6+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "獠牙",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）穿刺伤害。如果目标是中型或更小的生物，且野猪人在这次命中之前刚刚朝目标直线移动了至少 20 尺，目标额外受到 7（2d6）穿刺伤害，并陷入倒地状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "piercing"
     },
     {
      "dice": "2d6",
      "type": "piercing",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "野猪人变形为中型的野猪类人混合体或一头小型野猪，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "wereboar-boar",
  "name": "野猪人（野猪形态）",
  "size": "小型",
  "type": "怪兽",
  "alignment": "中立邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 97,
  "hitDice": "15d8+30",
  "speed": "40 尺",
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 15,
   "int": 10,
   "wis": 11,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "通用语（野猪形态下不能说话）",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "野猪人进行两次攻击，任意组合使用标枪或獠牙。它可以用一次顶撞攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "顶撞",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：12（2d8+3）穿刺伤害。如果目标是类人生物，它会受到下列效应影响。体质豁免：DC 12。失败：目标受到诅咒。如果受诅咒的目标生命值降至 0，它改为变成一个受 GM 控制的野猪人，并拥有 10 点生命值。成功：目标在 24 小时内免疫该野猪人的诅咒。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d8+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "獠牙",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）穿刺伤害。如果目标是中型或更小的生物，且野猪人在这次命中之前刚刚朝目标直线移动了至少 20 尺，目标额外受到 7（2d6）穿刺伤害，并陷入倒地状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "piercing"
     },
     {
      "dice": "2d6",
      "type": "piercing",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "野猪人变形为中型的野猪类人混合体或一头小型野猪，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "wererat-human",
  "name": "鼠人（人形态）",
  "size": "中型",
  "type": "怪兽",
  "alignment": "守序邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 60,
  "hitDice": "11d8+11",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 10,
   "dex": 16,
   "con": 12,
   "int": 11,
   "wis": 10,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 4,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "通用语（鼠形态下不能说话）",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "鼠人进行两次攻击，任意组合使用抓挠或手弩。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "手弩",
    "desc": "远程攻击检定：+5，射程 30/120 尺。命中：6（1d6+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "鼠人变形为中型的鼠类人混合体或一只小型鼠，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "wererat-hybrid",
  "name": "鼠人（混合形态）",
  "size": "中型",
  "type": "怪兽",
  "alignment": "守序邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 60,
  "hitDice": "11d8+11",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 10,
   "dex": 16,
   "con": 12,
   "int": 11,
   "wis": 10,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 4,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "通用语（鼠形态下不能说话）",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "鼠人进行两次攻击，任意组合使用抓挠或手弩。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：8（2d4+3）穿刺伤害。如果目标是类人生物，它会受到下列效应影响。体质豁免：DC 11。失败：目标受到诅咒。如果受诅咒的目标生命值降至 0，它改为变成一个受 GM 控制的鼠人，并拥有 10 点生命值。成功：目标在 24 小时内免疫该鼠人的诅咒。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d4+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "手弩",
    "desc": "远程攻击检定：+5，射程 30/120 尺。命中：6（1d6+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "鼠人变形为中型的鼠类人混合体或一只小型鼠，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "wererat-rat",
  "name": "鼠人（鼠形态）",
  "size": "小型",
  "type": "怪兽",
  "alignment": "守序邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 60,
  "hitDice": "11d8+11",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 10,
   "dex": 16,
   "con": 12,
   "int": 11,
   "wis": 10,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 4,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "通用语（鼠形态下不能说话）",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "鼠人进行两次攻击，任意组合使用抓挠或手弩。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：8（2d4+3）穿刺伤害。如果目标是类人生物，它会受到下列效应影响。体质豁免：DC 11。失败：目标受到诅咒。如果受诅咒的目标生命值降至 0，它改为变成一个受 GM 控制的鼠人，并拥有 10 点生命值。成功：目标在 24 小时内免疫该鼠人的诅咒。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d4+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "鼠人变形为中型的鼠类人混合体或一只小型鼠，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "weretiger-human",
  "name": "虎人（人形态）",
  "size": "中型",
  "type": "怪兽",
  "alignment": "绝对中立",
  "ac": 12,
  "acNote": "",
  "hp": 120,
  "hitDice": "16d8+48",
  "speed": "30 尺",
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 13,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "通用语（虎形态下不能说话）",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "虎人进行两次攻击，任意组合使用抓挠或长弓。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "长弓",
    "desc": "远程攻击检定：+4，射程 150/600 尺。命中：11（2d8+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d8+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "虎人变形为大型的虎类人混合体或一头大型虎，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "weretiger-hybrid",
  "name": "虎人（混合形态）",
  "size": "大型",
  "type": "怪兽",
  "alignment": "绝对中立",
  "ac": 12,
  "acNote": "",
  "hp": 120,
  "hitDice": "16d8+48",
  "speed": "30 尺",
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 13,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "通用语（虎形态下不能说话）",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "虎人进行两次攻击，任意组合使用抓挠或长弓。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：12（2d8+3）穿刺伤害。如果目标是类人生物，它会受到下列效应影响。体质豁免：DC 13。失败：目标受到诅咒。如果受诅咒的目标生命值降至 0，它改为变成一个受 GM 控制的虎人，并拥有 10 点生命值。成功：目标在 24 小时内免疫该虎人的诅咒。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d8+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "长弓",
    "desc": "远程攻击检定：+4，射程 150/600 尺。命中：11（2d8+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d8+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "潜猎",
    "desc": "虎人移动至多等于其速度的距离，且不会引发借机攻击。在此移动结束时，虎人可以执行躲藏动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "变形",
    "desc": "虎人变形为大型的虎类人混合体或一头大型虎，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "weretiger-tiger",
  "name": "虎人（虎形态）",
  "size": "大型",
  "type": "怪兽",
  "alignment": "绝对中立",
  "ac": 12,
  "acNote": "",
  "hp": 120,
  "hitDice": "16d8+48",
  "speed": "40 尺",
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 16,
   "int": 10,
   "wis": 13,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "通用语（虎形态下不能说话）",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "虎人进行两次攻击，任意组合使用抓挠或长弓。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：12（2d8+3）穿刺伤害。如果目标是类人生物，它会受到下列效应影响。体质豁免：DC 13。失败：目标受到诅咒。如果受诅咒的目标生命值降至 0，它改为变成一个受 GM 控制的虎人，并拥有 10 点生命值。成功：目标在 24 小时内免疫该虎人的诅咒。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d8+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "潜猎",
    "desc": "虎人移动至多等于其速度的距离，且不会引发借机攻击。在此移动结束时，虎人可以执行躲藏动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "变形",
    "desc": "虎人变形为大型的虎类人混合体或一头大型虎，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "werewolf-human",
  "name": "狼人（人形态）",
  "size": "中型",
  "type": "怪兽",
  "alignment": "混乱邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 71,
  "hitDice": "11d8+22",
  "speed": "30 尺",
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 14,
   "int": 10,
   "wis": 11,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "perception": 4,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "通用语（狼形态下不能说话）",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果狼人至少有一个盟友位于某生物 5 尺内，且该盟友未处于失能状态，则狼人对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "狼人进行两次攻击，任意组合使用抓挠或长弓。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "长弓",
    "desc": "远程攻击检定：+4，射程 150/600 尺。命中：11（2d8+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d8+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "狼人变形为大型的狼类人混合体或一头中型狼，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "werewolf-hybrid",
  "name": "狼人（混合形态）",
  "size": "大型",
  "type": "怪兽",
  "alignment": "混乱邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 71,
  "hitDice": "11d8+22",
  "speed": "30 尺",
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 14,
   "int": 10,
   "wis": 11,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "perception": 4,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "通用语（狼形态下不能说话）",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果狼人至少有一个盟友位于某生物 5 尺内，且该盟友未处于失能状态，则狼人对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "狼人进行两次攻击，任意组合使用抓挠或长弓。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：12（2d8+3）穿刺伤害。如果目标是类人生物，它会受到下列效应影响。体质豁免：DC 12。失败：目标受到诅咒。如果受诅咒的目标生命值降至 0，它改为变成一个受 GM 控制的狼人，并拥有 10 点生命值。成功：目标在 24 小时内免疫该狼人的诅咒。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d8+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "长弓",
    "desc": "远程攻击检定：+4，射程 150/600 尺。命中：11（2d8+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d8+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "狼人变形为大型的狼类人混合体或一头中型狼，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "werewolf-wolf",
  "name": "狼人（狼形态）",
  "size": "中型",
  "type": "怪兽",
  "alignment": "混乱邪恶",
  "ac": 15,
  "acNote": "",
  "hp": 71,
  "hitDice": "11d8+22",
  "speed": "40 尺",
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 14,
   "int": 10,
   "wis": 11,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "perception": 4,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "通用语（狼形态下不能说话）",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果狼人至少有一个盟友位于某生物 5 尺内，且该盟友未处于失能状态，则狼人对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "狼人进行两次攻击，任意组合使用抓挠或长弓。它可以用一次啮咬攻击替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：12（2d8+3）穿刺伤害。如果目标是类人生物，它会受到下列效应影响。体质豁免：DC 12。失败：目标受到诅咒。如果受诅咒的目标生命值降至 0，它改为变成一个受 GM 控制的狼人，并拥有 10 点生命值。成功：目标在 24 小时内免疫该狼人的诅咒。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d8+3",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "变形",
    "desc": "狼人变形为大型的狼类人混合体或一头中型狼，或者变回其真实的类人形态。除体型外，它在每种形态下的游戏数据都相同。它穿戴或携带的任何装备不会随之变形。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "white-dragon-wyrmling",
  "name": "白龙幼龙",
  "size": "中型",
  "type": "龙",
  "alignment": "混乱邪恶",
  "ac": 16,
  "acNote": "",
  "hp": 32,
  "hitDice": "5d8+10",
  "speed": "30 尺，掘穴15 尺，飞行60 尺，游泳30 尺",
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 14,
   "int": 5,
   "wis": 10,
   "cha": 11
  },
  "saves": {
   "dex": 2,
   "wis": 2
  },
  "skills": {
   "perception": 4,
   "stealth": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "cold"
  ],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 14",
  "languages": "龙语",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "冰上行走",
    "desc": "龙能在结冰的表面上移动和攀爬，且无需进行属性检定。此外，由冰或雪构成的困难地形不会使它消耗额外移动力。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "龙进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：6（1d8+2）挥砍伤害外加 2（1d4）冷冻伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "slashing"
     },
     {
      "dice": "1d4",
      "type": "cold"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "寒冰吐息（充能 5～6）",
    "desc": "体质豁免：DC 12，15 尺锥形内的每个生物。失败：22（5d8）冷冻伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "5d8",
      "type": "cold"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "wight",
  "name": "尸妖",
  "size": "中型",
  "type": "不死生物",
  "alignment": "中立邪恶",
  "ac": 14,
  "acNote": "",
  "hp": 82,
  "hitDice": "11d8+33",
  "speed": "30 尺",
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 16,
   "int": 10,
   "wis": 13,
   "cha": 15
  },
  "saves": {},
  "skills": {
   "perception": 3,
   "stealth": 4
  },
  "resist": [
   "necrotic"
  ],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "通用语及另外一种语言",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "日光敏感",
    "desc": "处于日光下时，尸妖进行属性检定和攻击检定具有劣势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "尸妖进行两次攻击，任意组合使用暗蚀之剑或暗蚀之弓。它可以用一次生命吸取替换其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "暗蚀之剑",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：6（1d8+2）挥砍伤害外加 4（1d8）暗蚀伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "slashing"
     },
     {
      "dice": "1d8",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "暗蚀之弓",
    "desc": "远程攻击检定：+4，射程 150/600 尺。命中：6（1d8+2）穿刺伤害外加 4（1d8）暗蚀伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "piercing"
     },
     {
      "dice": "1d8",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "生命吸取",
    "desc": "体质豁免：DC 13，5 尺内的一个生物。失败：6（1d8+2）暗蚀伤害，且目标的生命值上限减少，减少量等于其受到的伤害。被此攻击杀死的类人生物会在 24 小时后化为一只受尸妖控制的僵尸再度起身，除非该类人生物被复活或其尸体被摧毁。尸妖同一时间至多控制十二只僵尸。",
    "attack": null,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "necrotic"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "will-o-wisp",
  "name": "鬼火",
  "size": "微型",
  "type": "不死生物",
  "alignment": "混乱邪恶",
  "ac": 19,
  "acNote": "",
  "hp": 27,
  "hitDice": "11d4",
  "speed": "5 尺，飞行50 尺（悬浮）",
  "abilities": {
   "str": 1,
   "dex": 28,
   "con": 10,
   "int": 13,
   "wis": 14,
   "cha": 11
  },
  "saves": {},
  "skills": {},
  "resist": [
   "acid",
   "bludgeoning",
   "cold",
   "fire",
   "necrotic",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [
   "lightning",
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "grappled",
   "paralyzed",
   "petrified",
   "poisoned",
   "prone",
   "restrained",
   "unconscious"
  ],
  "senses": "黑暗视觉 120 尺，被动察觉 12",
  "languages": "通用语及另外一种语言",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "缥缈",
    "desc": "鬼火无法穿戴或携带任何物品。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "发光",
    "desc": "鬼火发出半径 20 尺的明亮光照，并在此范围之外再发出 20 尺的微光。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "虚体移动",
    "desc": "鬼火可以穿过其他生物和物体，将其视为困难地形。如果鬼火在物体内部结束其回合，它受到 5（1d10）力场伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "1d10",
      "type": "force"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "电击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：11（2d8+2）闪电伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d8+2",
      "type": "lightning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "吞噬生命",
    "desc": "体质豁免：DC 10，鬼火 5 尺内一个它能看见、生命值为 0 的活着的生物。失败：目标死亡，鬼火恢复 10（3d6）生命值。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "con",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "消隐",
    "desc": "鬼火及其光芒处于隐形状态，直到鬼火对此效果的专注结束；鬼火进行攻击检定或使用吞噬生命后，该专注立即提前结束。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "winter-wolf",
  "name": "冬狼",
  "size": "大型",
  "type": "怪兽",
  "alignment": "中立邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 75,
  "hitDice": "10d10+20",
  "speed": "50 尺",
  "abilities": {
   "str": 18,
   "dex": 13,
   "con": 14,
   "int": 7,
   "wis": 12,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "cold"
  ],
  "conditionImmune": [],
  "senses": "被动察觉 15",
  "languages": "通用语、巨人语",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果某生物 5 尺内至少有一名冬狼的盟友，且该盟友未处于失能状态，则冬狼对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：11（2d6+4）穿刺伤害。如果目标是大型或更小的生物，则目标陷入倒地状态。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "寒冰吐息（充能 5～6）",
    "desc": "体质豁免：DC 12，15 尺锥形内的每个生物。失败：18（4d8）冷冻伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "4d8",
      "type": "cold"
     }
    ],
    "save": {
     "ability": "con",
     "dc": 12,
     "onSuccess": "half"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "worg",
  "name": "座狼",
  "size": "大型",
  "type": "精类",
  "alignment": "中立邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 26,
  "hitDice": "4d10+4",
  "speed": "50 尺",
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 13,
   "int": 7,
   "wis": 11,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "地精语、座狼语",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）穿刺伤害，并且在座狼的下个回合开始之前，下一次对该目标进行的攻击检定具有优势。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "wraith",
  "name": "怨灵",
  "size": "Medium or small",
  "type": "不死生物",
  "alignment": "中立邪恶",
  "ac": 13,
  "acNote": "",
  "hp": 67,
  "hitDice": "9d8+27",
  "speed": "5 尺，飞行60 尺（悬浮）",
  "abilities": {
   "str": 6,
   "dex": 16,
   "con": 16,
   "int": 12,
   "wis": 14,
   "cha": 15
  },
  "saves": {},
  "skills": {},
  "resist": [
   "acid",
   "bludgeoning",
   "cold",
   "fire",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [
   "necrotic",
   "poison"
  ],
  "conditionImmune": [
   "charmed",
   "exhaustion",
   "grappled",
   "paralyzed",
   "petrified",
   "poisoned",
   "prone",
   "restrained",
   "unconscious"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 12",
  "languages": "通用语及另外两种语言",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "虚体移动",
    "desc": "怨灵可以穿过其他生物和物体，将其视为困难地形。如果怨灵在物体内部结束其回合，它受到 5（1d10）力场伤害。",
    "attack": null,
    "damage": [
     {
      "dice": "1d10",
      "type": "force"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "日光敏感",
    "desc": "处于阳光下时，怨灵进行的属性检定和攻击检定具有劣势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "生命吸取",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：21（4d8+3）暗蚀伤害。如果目标是生物，其生命值上限降低，降低量等于它所受的伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "4d8+3",
      "type": "necrotic"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "制造幽灵",
    "desc": "怨灵以自身 10 尺内一具死亡不超过 1 分钟的类人生物尸体为目标。目标的灵魂在其尸体所在的空间或最近的未被占据的空间中化为一只幽灵升起。该幽灵受怨灵控制。怨灵同一时间最多只能控制七只幽灵。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "xorn",
  "name": "索尔石怪",
  "size": "中型",
  "type": "元素生物",
  "alignment": "绝对中立",
  "ac": 19,
  "acNote": "",
  "hp": 84,
  "hitDice": "8d8+48",
  "speed": "20 尺，掘穴20 尺",
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 22,
   "int": 11,
   "wis": 10,
   "cha": 11
  },
  "saves": {},
  "skills": {
   "perception": 6,
   "stealth": 6
  },
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "paralyzed",
   "petrified",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，震颤感知 60 尺，被动察觉 16",
  "languages": "原初语（土族语）",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "穿地滑行",
    "desc": "索尔石怪可以在非魔法、未经加工的泥土和岩石中掘穴穿行。这样做时，索尔石怪不会扰动它所穿过的物质。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "宝物感知",
    "desc": "索尔石怪能精确定位自身 60 尺内贵金属和宝石的位置。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "索尔石怪进行一次啮咬攻击和三次爪击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：17（4d6+3）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "4d6+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：8（1d10+3）挥砍伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d10+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "冲锋",
    "desc": "索尔石怪朝一个它能感知到的敌人直线移动，距离至多为其速度或掘穴速度。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "zombie",
  "name": "僵尸",
  "size": "中型",
  "type": "不死生物",
  "alignment": "中立邪恶",
  "ac": 8,
  "acNote": "",
  "hp": 15,
  "hitDice": "2d8+6",
  "speed": "20 尺",
  "abilities": {
   "str": 13,
   "dex": 6,
   "con": 16,
   "int": 3,
   "wis": 6,
   "cha": 5
  },
  "saves": {
   "wis": 0
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 8",
  "languages": "听得懂通用语及另外一种语言但不会说",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "不死坚韧",
    "desc": "如果伤害使僵尸的生命值降为 0，僵尸进行一次体质豁免（DC 5 加上所受的伤害），除非该伤害是光耀伤害或来自重击。豁免成功时，僵尸的生命值改为降至 1。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "猛击",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：5（1d8+1）钝击伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d8+1",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "ogre-zombie",
  "name": "食人魔僵尸",
  "size": "大型",
  "type": "不死生物",
  "alignment": "中立邪恶",
  "ac": 8,
  "acNote": "",
  "hp": 85,
  "hitDice": "9d10+36",
  "speed": "30 尺",
  "abilities": {
   "str": 19,
   "dex": 6,
   "con": 18,
   "int": 3,
   "wis": 6,
   "cha": 5
  },
  "saves": {
   "wis": 0
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [
   "poison"
  ],
  "conditionImmune": [
   "exhaustion",
   "poisoned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 8",
  "languages": "听得懂通用语和巨人语但不会说",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "不死坚韧",
    "desc": "如果伤害使僵尸的生命值降为 0，僵尸进行一次体质豁免（DC 5 加上所受的伤害），除非该伤害是光耀伤害或来自重击。豁免成功时，僵尸的生命值改为降至 1。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "猛击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：13（2d8+4）钝击伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d8+4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "allosaurus",
  "name": "异特龙",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 51,
  "hitDice": "6d10+18",
  "speed": "60 尺",
  "abilities": {
   "str": 19,
   "dex": 13,
   "con": 17,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 15",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：15（2d10+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d10+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：8（1d8+4）挥砍伤害。如果目标是大型或更小的生物，且异特龙在这次命中之前刚刚朝它直线移动了至少 30 尺，则目标陷入倒地状态，并且异特龙可以对它进行一次啮咬攻击。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d8+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "ankylosaurus",
  "name": "甲龙",
  "size": "巨型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 15,
  "acNote": "",
  "hp": 68,
  "hitDice": "8d12+16",
  "speed": "30 尺",
  "abilities": {
   "str": 19,
   "dex": 11,
   "con": 15,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "saves": {
   "str": 6
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 11",
  "languages": "",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "甲龙进行两次尾击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "尾击",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：9（1d10+4）钝击伤害。如果目标是巨型或更小的生物，则目标陷入倒地状态。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d10+4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "ape",
  "name": "猿",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 19,
  "hitDice": "3d8+6",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 14,
   "int": 6,
   "wis": 12,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "athletics": 5,
   "perception": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 13",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "猿进行两次拳击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "拳击",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：5（1d4+3）钝击伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "掷石（充能 6）",
    "desc": "远程攻击检定：+5，射程 25/50 尺。命中：10（2d6+3）钝击伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": 6,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "archelon",
  "name": "古巨龟",
  "size": "巨型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 17,
  "acNote": "",
  "hp": 90,
  "hitDice": "12d12+12",
  "speed": "20 尺，游泳80 尺",
  "abilities": {
   "str": 18,
   "dex": 16,
   "con": 13,
   "int": 4,
   "wis": 14,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "古巨龟可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "古巨龟进行两次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：14（3d6+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "3d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "baboon",
  "name": "狒狒",
  "size": "小型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 3,
  "hitDice": "1d6",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 8,
   "dex": 14,
   "con": 11,
   "int": 4,
   "wis": 12,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 11",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果某生物 5 尺内至少有一名狒狒的盟友，且该盟友未处于失能状态，则狒狒对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+1，触及 5 尺。命中：1（1d4-1）穿刺伤害。",
    "attack": 1,
    "damage": [
     {
      "dice": "1d4-1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "badger",
  "name": "獾",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 5,
  "hitDice": "1d4+3",
  "speed": "20 尺，掘穴5 尺",
  "abilities": {
   "str": 10,
   "dex": 11,
   "con": 16,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 3
  },
  "resist": [
   "poison"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 30 尺，被动察觉 13",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：1 点穿刺伤害。",
    "attack": 2,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "bat",
  "name": "蝙蝠",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 1,
  "hitDice": "1d4-1",
  "speed": "5 尺，飞行30 尺",
  "abilities": {
   "str": 2,
   "dex": 15,
   "con": 8,
   "int": 2,
   "wis": 12,
   "cha": 4
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 60 尺，被动察觉 11",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：1 点穿刺伤害。",
    "attack": 4,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "black-bear",
  "name": "黑熊",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 19,
  "hitDice": "3d8+6",
  "speed": "30 尺，攀爬30 尺，游泳30 尺",
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 14,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "黑熊进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "blood-hawk",
  "name": "血鹰",
  "size": "小型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 7,
  "hitDice": "2d6",
  "speed": "10 尺，飞行60 尺",
  "abilities": {
   "str": 6,
   "dex": 14,
   "con": 10,
   "int": 3,
   "wis": 14,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 6
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 16",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果某生物 5 尺内至少有一名血鹰的盟友，且该盟友未处于失能状态，则血鹰对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啄击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）穿刺伤害；如果目标已浴血，则改为 6（1d8+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "piercing"
     },
     {
      "dice": "1d8+2",
      "type": "piercing",
      "when": "or"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "boar",
  "name": "野猪",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 13,
  "hitDice": "2d8+4",
  "speed": "40 尺",
  "abilities": {
   "str": 13,
   "dex": 11,
   "con": 14,
   "int": 2,
   "wis": 9,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 9",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "浴血狂怒",
    "desc": "野猪浴血时，其攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "顶撞",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：4（1d6+1）穿刺伤害。如果目标是中型或更小的生物，且野猪在这次命中之前刚刚朝它直线移动了至少 20 尺，则目标额外受到 3（1d6）穿刺伤害并陷入倒地状态。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d6+1",
      "type": "piercing"
     },
     {
      "dice": "1d6",
      "type": "piercing",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "brown-bear",
  "name": "棕熊",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 22,
  "hitDice": "3d10+6",
  "speed": "40 尺，攀爬30 尺",
  "abilities": {
   "str": 17,
   "dex": 12,
   "con": 15,
   "int": 2,
   "wis": 13,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "棕熊进行一次啮咬攻击和一次爪击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：5（1d4+3）挥砍伤害。如果目标是大型或更小的生物，则目标陷入倒地状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "camel",
  "name": "骆驼",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 10,
  "acNote": "",
  "hp": 17,
  "hitDice": "2d10+6",
  "speed": "50 尺",
  "abilities": {
   "str": 15,
   "dex": 8,
   "con": 17,
   "int": 2,
   "wis": 11,
   "cha": 5
  },
  "saves": {
   "con": 5
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）钝击伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "cat",
  "name": "猫",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 2,
  "hitDice": "1d4",
  "speed": "40 尺，攀爬40 尺",
  "abilities": {
   "str": 3,
   "dex": 15,
   "con": 10,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "saves": {
   "dex": 4
  },
  "skills": {
   "perception": 3,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "善跳",
    "desc": "猫的跳跃距离由其敏捷而非力量决定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "抓挠",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：1 点挥砍伤害。",
    "attack": 4,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "constrictor-snake",
  "name": "蟒蛇",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 13,
  "hitDice": "2d10+2",
  "speed": "30 尺，游泳30 尺",
  "abilities": {
   "str": 15,
   "dex": 14,
   "con": 12,
   "int": 1,
   "wis": 10,
   "cha": 3
  },
  "saves": {},
  "skills": {
   "perception": 2,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 10 尺，被动察觉 12",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：6（1d8+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "绞杀",
    "desc": "力量豁免：DC 12，蟒蛇 5 尺内一个它能看见的中型或更小的生物。失败：7（3d4）钝击伤害，并且目标陷入被擒抱状态（逃脱 DC 12）。",
    "attack": null,
    "damage": [
     {
      "dice": "3d4",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "grappled"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "crab",
  "name": "螃蟹",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 3,
  "hitDice": "1d4+1",
  "speed": "20 尺，游泳20 尺",
  "abilities": {
   "str": 6,
   "dex": 11,
   "con": 12,
   "int": 1,
   "wis": 8,
   "cha": 2
  },
  "saves": {},
  "skills": {
   "stealth": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 30 尺，被动察觉 9",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "螃蟹可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "爪击",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：1 点钝击伤害。",
    "attack": 2,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "crocodile",
  "name": "鳄鱼",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 13,
  "hitDice": "2d10+2",
  "speed": "20 尺，游泳30 尺",
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "saves": {
   "con": 3
  },
  "skills": {
   "stealth": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "屏息",
    "desc": "鳄鱼可以屏住呼吸 1 小时。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：6（1d8+2）穿刺伤害。如果目标是中型或更小的生物，则目标陷入被擒抱状态（逃脱 DC 12）。被擒抱期间，目标也处于束缚状态。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "deer",
  "name": "鹿",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 4,
  "hitDice": "1d8",
  "speed": "50 尺",
  "abilities": {
   "str": 11,
   "dex": 16,
   "con": 11,
   "int": 2,
   "wis": 14,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "矫健",
    "desc": "鹿移出敌人的触及范围时不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "冲撞",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：2（1d4）钝击伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "1d4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "dire-wolf",
  "name": "恐狼",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 22,
  "hitDice": "3d10+6",
  "speed": "50 尺",
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 15,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果某生物 5 尺内至少有一名恐狼的盟友，且该盟友未处于失能状态，则恐狼对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：8（1d10+3）穿刺伤害。如果目标是大型或更小的生物，则目标陷入倒地状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d10+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "draft-horse",
  "name": "挽马",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 10,
  "acNote": "",
  "hp": 15,
  "hitDice": "2d10+4",
  "speed": "40 尺",
  "abilities": {
   "str": 18,
   "dex": 10,
   "con": 15,
   "int": 2,
   "wis": 11,
   "cha": 7
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "蹄击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：6（1d4+4）钝击伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d4+4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "eagle",
  "name": "雕",
  "size": "小型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 4,
  "hitDice": "1d6+1",
  "speed": "10 尺，飞行60 尺",
  "abilities": {
   "str": 6,
   "dex": 15,
   "con": 12,
   "int": 2,
   "wis": 14,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 6
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 16",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "爪抓",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "elephant",
  "name": "大象",
  "size": "巨型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 76,
  "hitDice": "8d12+24",
  "speed": "40 尺",
  "abilities": {
   "str": 22,
   "dex": 9,
   "con": 17,
   "int": 3,
   "wis": 11,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "大象进行两次顶撞攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "顶撞",
    "desc": "近战攻击检定：+8，触及 5 尺。命中：15（2d8+6）穿刺伤害。如果目标是巨型或更小的生物，且大象在这次命中之前刚刚朝它直线移动了至少 20 尺，则目标陷入倒地状态。",
    "attack": 8,
    "damage": [
     {
      "dice": "2d8+6",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "践踏",
    "desc": "敏捷豁免：DC 16，大象 5 尺内一个处于倒地状态的生物。失败：17（2d10+6）钝击伤害。成功：伤害减半。",
    "attack": null,
    "damage": [
     {
      "dice": "2d10+6",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "dex",
     "dc": 16,
     "onSuccess": "half"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "elk",
  "name": "麋鹿",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 10,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d10",
  "speed": "50 尺",
  "abilities": {
   "str": 16,
   "dex": 10,
   "con": 11,
   "int": 2,
   "wis": 10,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 12",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "冲撞",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）钝击伤害。如果目标是大型或更小的生物，且麋鹿在这次命中之前刚刚朝它直线移动了至少 20 尺，则目标额外受到 3（1d6）钝击伤害并陷入倒地状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "bludgeoning"
     },
     {
      "dice": "1d6",
      "type": "bludgeoning",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "flying-snake",
  "name": "飞蛇",
  "size": "微型",
  "type": "怪兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 5,
  "hitDice": "2d4",
  "speed": "30 尺，飞行60 尺，游泳30 尺",
  "abilities": {
   "str": 4,
   "dex": 15,
   "con": 11,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 10 尺，被动察觉 11",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [
   {
    "name": "掠飞",
    "desc": "飞蛇飞出敌人的触及范围时不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：1 点穿刺伤害外加 5（2d4）毒素伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d4",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "frog",
  "name": "青蛙",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 1,
  "hitDice": "1d4-1",
  "speed": "20 尺，游泳20 尺",
  "abilities": {
   "str": 1,
   "dex": 13,
   "con": 8,
   "int": 1,
   "wis": 8,
   "cha": 3
  },
  "saves": {},
  "skills": {
   "perception": 1,
   "stealth": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 30 尺，被动察觉 11",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "青蛙可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "立定跳跃",
    "desc": "无论是否助跑，青蛙的跳远距离最多为 10 尺，跳高高度最多为 5 尺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：1 点穿刺伤害。",
    "attack": 3,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-badger",
  "name": "巨獾",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 15,
  "hitDice": "2d8+6",
  "speed": "30 尺，掘穴10 尺",
  "abilities": {
   "str": 13,
   "dex": 10,
   "con": 17,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 3
  },
  "resist": [
   "poison"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：6（2d4+1）穿刺伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "2d4+1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-bat",
  "name": "巨蝙蝠",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 22,
  "hitDice": "4d10",
  "speed": "10 尺，飞行60 尺",
  "abilities": {
   "str": 15,
   "dex": 16,
   "con": 11,
   "int": 2,
   "wis": 12,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 120 尺，被动察觉 11",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-boar",
  "name": "巨野猪",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 42,
  "hitDice": "5d10+15",
  "speed": "40 尺",
  "abilities": {
   "str": 17,
   "dex": 10,
   "con": 16,
   "int": 2,
   "wis": 7,
   "cha": 5
  },
  "saves": {
   "str": 5
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 8",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "浴血狂怒",
    "desc": "巨野猪浴血时，其近战攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "顶撞",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）穿刺伤害。如果目标是大型或更小的生物，且巨野猪在这次命中之前刚刚朝它直线移动了至少 20 尺，则目标额外受到 7（2d6）穿刺伤害并陷入倒地状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "piercing"
     },
     {
      "dice": "2d6",
      "type": "piercing",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-centipede",
  "name": "巨蜈蚣",
  "size": "小型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 9,
  "hitDice": "2d6+2",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 5,
   "dex": 14,
   "con": 12,
   "int": 1,
   "wis": 7,
   "cha": 3
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 30 尺，被动察觉 8",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）穿刺伤害，并且目标陷入中毒状态，直到巨蜈蚣的下个回合开始。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-constrictor-snake",
  "name": "巨蟒",
  "size": "巨型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 60,
  "hitDice": "8d12+8",
  "speed": "30 尺，游泳30 尺",
  "abilities": {
   "str": 19,
   "dex": 14,
   "con": 12,
   "int": 1,
   "wis": 10,
   "cha": 3
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 10 尺，被动察觉 12",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "巨蟒进行一次啮咬攻击，并使用绞杀。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：11（2d6+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "绞杀",
    "desc": "力量豁免：DC 14，巨蟒 10 尺内一个它能看见的大型或更小的生物。失败：13（2d8+4）钝击伤害，并且目标陷入被擒抱状态（逃脱 DC 14）。",
    "attack": null,
    "damage": [
     {
      "dice": "2d8+4",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 14,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "grappled"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-crab",
  "name": "巨蟹",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 15,
  "acNote": "",
  "hp": 13,
  "hitDice": "3d8",
  "speed": "30 尺，游泳30 尺",
  "abilities": {
   "str": 13,
   "dex": 13,
   "con": 11,
   "int": 1,
   "wis": 9,
   "cha": 3
  },
  "saves": {},
  "skills": {
   "stealth": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 30 尺，被动察觉 9",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "巨蟹可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "爪击",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：4（1d6+1）钝击伤害。如果目标是中型或更小的生物，则巨蟹用两只钳子之一擒住它，使其陷入被擒抱状态（逃脱 DC 11）。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d6+1",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-crocodile",
  "name": "巨鳄",
  "size": "巨型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 85,
  "hitDice": "9d12+27",
  "speed": "30 尺，游泳50 尺",
  "abilities": {
   "str": 21,
   "dex": 9,
   "con": 17,
   "int": 2,
   "wis": 10,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "屏息",
    "desc": "巨鳄可以屏住呼吸 1 小时。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "巨鳄进行一次啮咬攻击和一次尾击攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+8，触及 5 尺。命中：21（3d10+5）穿刺伤害。如果目标是大型或更小的生物，则目标陷入被擒抱状态（逃脱 DC 15）。被擒抱期间，目标也处于束缚状态，并且不能成为巨鳄尾击的目标。",
    "attack": 8,
    "damage": [
     {
      "dice": "3d10+5",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 15,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "尾击",
    "desc": "近战攻击检定：+8，触及 10 尺。命中：18（3d8+5）钝击伤害。如果目标是大型或更小的生物，则目标陷入倒地状态。",
    "attack": 8,
    "damage": [
     {
      "dice": "3d8+5",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-eagle",
  "name": "巨鹰",
  "size": "大型",
  "type": "天界生物",
  "alignment": "中立善良",
  "ac": 13,
  "acNote": "",
  "hp": 26,
  "hitDice": "4d10+4",
  "speed": "10 尺，飞行80 尺",
  "abilities": {
   "str": 16,
   "dex": 17,
   "con": 13,
   "int": 8,
   "wis": 14,
   "cha": 10
  },
  "saves": {},
  "skills": {
   "perception": 6
  },
  "resist": [
   "necrotic",
   "radiant"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 16",
  "languages": "天界语；听得懂通用语和原初语（气族语）但不会说",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "巨鹰进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：5（1d4+3）挥砍伤害外加 3（1d6）光耀伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "slashing"
     },
     {
      "dice": "1d6",
      "type": "radiant"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-elk",
  "name": "巨麋鹿",
  "size": "巨型",
  "type": "天界生物",
  "alignment": "中立善良",
  "ac": 14,
  "acNote": "",
  "hp": 42,
  "hitDice": "5d12+10",
  "speed": "60 尺",
  "abilities": {
   "str": 19,
   "dex": 18,
   "con": 14,
   "int": 7,
   "wis": 14,
   "cha": 10
  },
  "saves": {
   "str": 6,
   "dex": 6
  },
  "skills": {
   "perception": 4
  },
  "resist": [
   "necrotic",
   "radiant"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 90 尺，被动察觉 14",
  "languages": "天界语；听得懂通用语、精灵语和木族语但不会说",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "冲撞",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：11（2d6+4）钝击伤害外加 5（2d4）光耀伤害。如果目标是巨型或更小的生物，且巨麋鹿在这次命中之前刚刚朝它直线移动了至少 20 尺，则目标额外受到 5（2d4）钝击伤害并陷入倒地状态。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "bludgeoning"
     },
     {
      "dice": "2d4",
      "type": "radiant"
     },
     {
      "dice": "2d4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-fire-beetle",
  "name": "巨火甲虫",
  "size": "小型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 4,
  "hitDice": "1d6+1",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 8,
   "dex": 10,
   "con": 12,
   "int": 1,
   "wis": 7,
   "cha": 3
  },
  "saves": {},
  "skills": {},
  "resist": [
   "fire"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 30 尺，被动察觉 8",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "发光",
    "desc": "巨火甲虫发出半径 10 尺的明亮光照，并在此范围之外再发出 10 尺的微光。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+1，触及 5 尺。命中：1 点火焰伤害。",
    "attack": 1,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-frog",
  "name": "巨蛙",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 18,
  "hitDice": "4d8",
  "speed": "30 尺，游泳30 尺",
  "abilities": {
   "str": 12,
   "dex": 13,
   "con": 11,
   "int": 2,
   "wis": 10,
   "cha": 3
  },
  "saves": {},
  "skills": {
   "perception": 2,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 30 尺，被动察觉 12",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "巨蛙可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "立定跳跃",
    "desc": "无论是否助跑，巨蛙的跳远距离最多为 20 尺，跳高高度最多为 10 尺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：5（1d6+2）穿刺伤害。如果目标是中型或更小的生物，则目标陷入被擒抱状态（逃脱 DC 11）。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "吞咽",
    "desc": "巨蛙吞下一个正被它擒抱的小型或更小的目标。被吞下期间，目标不再处于被擒抱状态，但处于目盲和束缚状态，并且对来自巨蛙体外的攻击和其他效果具有全身掩护。巨蛙吞着目标时不能使用啮咬；如果巨蛙死亡，被吞下的目标不再处于束缚状态，并可以花费 5 尺移动力从尸体中脱出，脱出时陷入倒地状态。在巨蛙的下个回合结束时，被吞下的目标受到 5（2d4）强酸伤害。如果这些伤害没有杀死它，巨蛙就会把它吐出来，使其脱出并陷入倒地状态。",
    "attack": null,
    "damage": [
     {
      "dice": "2d4",
      "type": "acid"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-goat",
  "name": "巨山羊",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 19,
  "hitDice": "3d10+3",
  "speed": "40 尺，攀爬30 尺",
  "abilities": {
   "str": 17,
   "dex": 13,
   "con": 12,
   "int": 3,
   "wis": 12,
   "cha": 6
  },
  "saves": {
   "str": 5
  },
  "skills": {
   "perception": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "冲撞",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）钝击伤害。如果目标是大型或更小的生物，且巨山羊在这次命中之前刚刚朝它直线移动了至少 20 尺，则目标额外受到 5（2d4）钝击伤害并陷入倒地状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "bludgeoning"
     },
     {
      "dice": "2d4",
      "type": "bludgeoning",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-hyena",
  "name": "巨鬣狗",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 45,
  "hitDice": "6d10+12",
  "speed": "50 尺",
  "abilities": {
   "str": 16,
   "dex": 14,
   "con": 14,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "横冲直撞（每日 1 次）",
    "desc": "在对一个已经浴血的生物造成伤害后，巨鬣狗可以立即移动至多其速度的一半，并进行一次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 1,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "giant-lizard",
  "name": "巨蜥",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 19,
  "hitDice": "3d10+3",
  "speed": "40 尺，攀爬40 尺",
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "saves": {
   "dex": 3
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "蛛行",
    "desc": "巨蜥可以攀爬困难的表面，包括沿着天花板爬行，无需进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：6（1d8+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-octopus",
  "name": "巨章鱼",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 45,
  "hitDice": "7d10+7",
  "speed": "10 尺，游泳60 尺",
  "abilities": {
   "str": 17,
   "dex": 13,
   "con": 13,
   "int": 5,
   "wis": 10,
   "cha": 4
  },
  "saves": {},
  "skills": {
   "perception": 4,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "水下呼吸",
    "desc": "巨章鱼只能在水下呼吸。在水外时，它可以屏住呼吸 1 小时。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "触手",
    "desc": "近战攻击检定：+5，触及 10 尺。命中：10（2d6+3）钝击伤害。如果目标是中型或更小的生物，则巨章鱼用全部八条触手擒住它，使其陷入被擒抱状态（逃脱 DC 13）。被擒抱期间，目标也处于束缚状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": [
   {
    "name": "墨云（每日 1 次）",
    "desc": "触发：巨章鱼在水下受到伤害。反应：巨章鱼释放墨汁，填满以自身为中心的 10 尺立方，然后移动至多其游泳速度。该立方区域重度遮蔽，持续 1 分钟，或直到强劲的水流或类似效果驱散墨汁为止。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": 1,
    "multiattack": false
   }
  ]
 },
 {
  "key": "giant-owl",
  "name": "巨枭",
  "size": "大型",
  "type": "天界生物",
  "alignment": "绝对中立",
  "ac": 12,
  "acNote": "",
  "hp": 19,
  "hitDice": "3d10+3",
  "speed": "5 尺，飞行60 尺",
  "abilities": {
   "str": 13,
   "dex": 15,
   "con": 12,
   "int": 10,
   "wis": 14,
   "cha": 10
  },
  "saves": {
   "wis": 4
  },
  "skills": {
   "perception": 6,
   "stealth": 6
  },
  "resist": [
   "necrotic",
   "radiant"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 120 尺，被动察觉 16",
  "languages": "天界语；听得懂通用语、精灵语和木族语但不会说",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "掠飞",
    "desc": "巨枭飞出敌人的触及范围时不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "爪抓",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：7（1d10+2）挥砍伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d10+2",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "施法",
    "desc": "巨枭施展下列法术之一，无需任何法术成分，以感知为施法属性：随意：《侦测善恶》、《侦测魔法》；每日 1 次：《千里眼》。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-rat",
  "name": "巨鼠",
  "size": "小型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 7,
  "hitDice": "2d6",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 7,
   "dex": 16,
   "con": 11,
   "int": 2,
   "wis": 10,
   "cha": 4
  },
  "saves": {
   "dex": 5
  },
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 12",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果某生物 5 尺内至少有一名巨鼠的盟友，且该盟友未处于失能状态，则巨鼠对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：5（1d4+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-scorpion",
  "name": "巨蝎",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 15,
  "acNote": "",
  "hp": 52,
  "hitDice": "7d10+14",
  "speed": "40 尺",
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 15,
   "int": 1,
   "wis": 9,
   "cha": 3
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 60 尺，被动察觉 9",
  "languages": "",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "巨蝎进行两次爪击攻击和一次蜇刺攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "爪击",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）钝击伤害。如果目标是大型或更小的生物，则巨蝎用两只钳子之一擒住它，使其陷入被擒抱状态（逃脱 DC 13）。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "bludgeoning"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蜇刺",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）穿刺伤害外加 11（2d10）毒素伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "piercing"
     },
     {
      "dice": "2d10",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-seahorse",
  "name": "巨海马",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 16,
  "hitDice": "3d10",
  "speed": "5 尺，游泳40 尺",
  "abilities": {
   "str": 15,
   "dex": 12,
   "con": 11,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 11",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "水下呼吸",
    "desc": "巨海马只能在水下呼吸。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "冲撞",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：9（2d6+2）钝击伤害；如果巨海马在这次命中之前刚刚朝目标直线移动了至少 20 尺，则改为 11（2d8+2）钝击伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d6+2",
      "type": "bludgeoning"
     },
     {
      "dice": "2d8+2",
      "type": "bludgeoning",
      "when": "or"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "气泡冲刺",
    "desc": "在水下时，巨海马移动至多其游泳速度的一半，且不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "giant-shark",
  "name": "巨鲨",
  "size": "巨型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 92,
  "hitDice": "8d12+40",
  "speed": "5 尺，游泳60 尺",
  "abilities": {
   "str": 23,
   "dex": 11,
   "con": 21,
   "int": 1,
   "wis": 10,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 60 尺，被动察觉 13",
  "languages": "",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [
   {
    "name": "水下呼吸",
    "desc": "巨鲨只能在水下呼吸。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "巨鲨进行两次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+9（如果目标的生命值未满，则具有优势），触及 5 尺。命中：22（3d10+6）穿刺伤害。",
    "attack": 9,
    "damage": [
     {
      "dice": "3d10+6",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-spider",
  "name": "巨蜘蛛",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 26,
  "hitDice": "4d10+4",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 14,
   "dex": 16,
   "con": 12,
   "int": 2,
   "wis": 11,
   "cha": 4
  },
  "saves": {},
  "skills": {
   "perception": 4,
   "stealth": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "蛛行",
    "desc": "蜘蛛可以在难以攀爬的表面上攀爬（包括沿着天花板爬行），无需进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蛛网行者",
    "desc": "蜘蛛无视蛛网造成的移动限制，并且知道与同一张蛛网接触的任何其他生物的位置。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）穿刺伤害外加 7（2d6）毒素伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "piercing"
     },
     {
      "dice": "2d6",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蛛网（充能 5～6）",
    "desc": "敏捷豁免：DC 13，蜘蛛能看见的 60 尺内的一个生物。失败：目标陷入束缚状态，直到蛛网被摧毁为止（蛛网的 AC 10；生命值 5；对火焰伤害具有易伤；对毒素和心灵伤害具有免疫）。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "dex",
     "dc": 13,
     "onSuccess": "none"
    },
    "recharge": 5,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "restrained"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-toad",
  "name": "巨蟾蜍",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 39,
  "hitDice": "6d10+6",
  "speed": "30 尺，游泳30 尺",
  "abilities": {
   "str": 15,
   "dex": 13,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 3
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 10",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "两栖",
    "desc": "蟾蜍可以呼吸空气和水。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "立定跳跃",
    "desc": "无论有没有助跑，蟾蜍的跳远距离最多为 20 尺，跳高高度最多为 10 尺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）穿刺伤害外加 5（2d4）毒素伤害。如果目标是中型或更小的生物，它陷入被擒抱状态（逃脱 DC 12）。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     },
     {
      "dice": "2d4",
      "type": "poison"
     }
    ],
    "save": {
     "ability": "str",
     "dc": 12,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "吞咽",
    "desc": "蟾蜍吞下一个被它擒抱的中型或更小的目标。被吞下期间，目标不处于被擒抱状态，但处于目盲和束缚状态，并且对来自蟾蜍体外的攻击和其他效应具有全身掩护。此外，目标在蟾蜍的每个回合结束时受到 10（3d6）强酸伤害。蟾蜍同一时间只能吞下一个目标，并且在体内有被吞下的目标时不能使用啮咬。如果蟾蜍死亡，被吞下的生物不再处于束缚状态，并且可以花费 5 尺移动力从尸体中逃出，出来时处于倒地状态。",
    "attack": null,
    "damage": [
     {
      "dice": "3d6",
      "type": "acid"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-venomous-snake",
  "name": "巨毒蛇",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "40 尺，游泳40 尺",
  "abilities": {
   "str": 10,
   "dex": 18,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 3
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 10 尺，被动察觉 12",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：6（1d4+4）穿刺伤害外加 4（1d8）毒素伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d4+4",
      "type": "piercing"
     },
     {
      "dice": "1d8",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-vulture",
  "name": "巨秃鹫",
  "size": "大型",
  "type": "怪兽",
  "alignment": "中立邪恶",
  "ac": 10,
  "acNote": "",
  "hp": 25,
  "hitDice": "3d10+9",
  "speed": "10 尺，飞行60 尺",
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 16,
   "int": 6,
   "wis": 12,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 3
  },
  "resist": [
   "necrotic"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "听得懂通用语但不会说",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果秃鹫至少有一个盟友位于某个生物 5 尺内，且该盟友没有陷入失能状态，则秃鹫对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "剜啄",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：9（2d6+2）穿刺伤害，并且目标陷入中毒状态，直到其下个回合结束。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d6+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-wasp",
  "name": "巨黄蜂",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 22,
  "hitDice": "5d8",
  "speed": "10 尺，飞行50 尺",
  "abilities": {
   "str": 10,
   "dex": 14,
   "con": 10,
   "int": 1,
   "wis": 10,
   "cha": 3
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "掠飞",
    "desc": "黄蜂飞出敌人的触及范围时不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "蜇刺",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）穿刺伤害外加 5（2d4）毒素伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     },
     {
      "dice": "2d4",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-weasel",
  "name": "巨鼬鼠",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 9,
  "hitDice": "2d8",
  "speed": "40 尺，攀爬30 尺",
  "abilities": {
   "str": 11,
   "dex": 17,
   "con": 10,
   "int": 4,
   "wis": 12,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "acrobatics": 5,
   "perception": 3,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：5（1d4+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "giant-wolf-spider",
  "name": "巨狼蛛",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "40 尺，攀爬40 尺",
  "abilities": {
   "str": 12,
   "dex": 16,
   "con": 13,
   "int": 3,
   "wis": 12,
   "cha": 4
  },
  "saves": {},
  "skills": {
   "perception": 3,
   "stealth": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，盲视 10 尺，被动察觉 13",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "蛛行",
    "desc": "蜘蛛可以在难以攀爬的表面上攀爬（包括沿着天花板爬行），无需进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：5（1d4+3）穿刺伤害外加 5（2d4）毒素伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d4+3",
      "type": "piercing"
     },
     {
      "dice": "2d4",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "goat",
  "name": "山羊",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 10,
  "acNote": "",
  "hp": 4,
  "hitDice": "1d8",
  "speed": "40 尺，攀爬30 尺",
  "abilities": {
   "str": 11,
   "dex": 10,
   "con": 11,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "saves": {
   "str": 2
  },
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 12",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "冲撞",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：1 点钝击伤害；如果山羊在这次命中之前刚刚朝目标直线移动了至少 20 尺，则改为 2（1d4）钝击伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "1d4",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "hawk",
  "name": "鹰",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 1,
  "hitDice": "1d4-1",
  "speed": "10 尺，飞行60 尺",
  "abilities": {
   "str": 5,
   "dex": 16,
   "con": 8,
   "int": 2,
   "wis": 14,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "perception": 6
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 16",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "爪抓",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：1 点挥砍伤害。",
    "attack": 5,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "hippopotamus",
  "name": "河马",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 82,
  "hitDice": "11d10+22",
  "speed": "30 尺，游泳30 尺",
  "abilities": {
   "str": 21,
   "dex": 7,
   "con": 15,
   "int": 2,
   "wis": 12,
   "cha": 4
  },
  "saves": {
   "str": 7
  },
  "skills": {
   "perception": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 13",
  "languages": "",
  "cr": 4,
  "xp": 1100,
  "pb": 2,
  "traits": [
   {
    "name": "屏息",
    "desc": "河马可以屏住呼吸 10 分钟。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "河马进行两次啮咬攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：16（2d10+5）穿刺伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d10+5",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "hunter-shark",
  "name": "猎鲨",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 45,
  "hitDice": "6d10+12",
  "speed": "5 尺，游泳40 尺",
  "abilities": {
   "str": 18,
   "dex": 14,
   "con": 15,
   "int": 1,
   "wis": 10,
   "cha": 4
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 60 尺，被动察觉 12",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "水下呼吸",
    "desc": "鲨鱼只能在水下呼吸。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6（如果目标的生命值不满，则这次攻击检定具有优势），触及 5 尺。命中：14（3d6+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "3d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "hyena",
  "name": "鬣狗",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 5,
  "hitDice": "1d8+1",
  "speed": "50 尺",
  "abilities": {
   "str": 11,
   "dex": 13,
   "con": 12,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果鬣狗至少有一个盟友位于某个生物 5 尺内，且该盟友没有陷入失能状态，则鬣狗对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：3（1d6）穿刺伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "1d6",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "jackal",
  "name": "胡狼",
  "size": "小型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 3,
  "hitDice": "1d6",
  "speed": "40 尺",
  "abilities": {
   "str": 8,
   "dex": 15,
   "con": 11,
   "int": 3,
   "wis": 12,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 90 尺，被动察觉 15",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+1，触及 5 尺。命中：1（1d4-1）穿刺伤害。",
    "attack": 1,
    "damage": [
     {
      "dice": "1d4-1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "killer-whale",
  "name": "虎鲸",
  "size": "巨型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 90,
  "hitDice": "12d12+12",
  "speed": "5 尺，游泳60 尺",
  "abilities": {
   "str": 19,
   "dex": 14,
   "con": 13,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 3,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 120 尺，被动察觉 13",
  "languages": "",
  "cr": 3,
  "xp": 700,
  "pb": 2,
  "traits": [
   {
    "name": "屏息",
    "desc": "虎鲸可以屏住呼吸 30 分钟。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：21（5d6+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "5d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "lion",
  "name": "狮子",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 22,
  "hitDice": "4d10",
  "speed": "50 尺",
  "abilities": {
   "str": 17,
   "dex": 15,
   "con": 11,
   "int": 3,
   "wis": 12,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 3,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果狮子至少有一个盟友位于某个生物 5 尺内，且该盟友没有陷入失能状态，则狮子对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "助跑跳跃",
    "desc": "经过 10 尺助跑后，狮子的跳远距离最多可达 25 尺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "狮子进行两次撕裂攻击。它可以用一次咆哮代替其中一次攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "咆哮",
    "desc": "感知豁免：DC 11，15 尺内的一个生物。失败：目标陷入恐慌状态，直到狮子的下个回合开始。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 11,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "frightened"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "lizard",
  "name": "蜥蜴",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 10,
  "acNote": "",
  "hp": 2,
  "hitDice": "1d4",
  "speed": "20 尺，攀爬20 尺",
  "abilities": {
   "str": 2,
   "dex": 11,
   "con": 10,
   "int": 1,
   "wis": 8,
   "cha": 3
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 30 尺，被动察觉 9",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "蛛行",
    "desc": "蜥蜴可以在难以攀爬的表面上攀爬（包括沿着天花板爬行），无需进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：1 点穿刺伤害。",
    "attack": 2,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "mastiff",
  "name": "獒犬",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 5,
  "hitDice": "1d8+1",
  "speed": "40 尺",
  "abilities": {
   "str": 13,
   "dex": 14,
   "con": 12,
   "int": 3,
   "wis": 12,
   "cha": 7
  },
  "saves": {
   "wis": 3
  },
  "skills": {
   "perception": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：4（1d6+1）穿刺伤害。如果目标是中型或更小的生物，它陷入倒地状态。",
    "attack": 3,
    "damage": [
     {
      "dice": "1d6+1",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "mule",
  "name": "骡子",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 10,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "40 尺",
  "abilities": {
   "str": 14,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 10,
   "cha": 5
  },
  "saves": {
   "str": 4
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [
   {
    "name": "驮兽",
    "desc": "计算负重能力时，骡子视为大一号的体型。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "蹄击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）钝击伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "owl",
  "name": "猫头鹰",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 1,
  "hitDice": "1d4-1",
  "speed": "5 尺，飞行60 尺",
  "abilities": {
   "str": 3,
   "dex": 13,
   "con": 8,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 120 尺，被动察觉 15",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "掠飞",
    "desc": "猫头鹰飞出敌人的触及范围时不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "爪抓",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：1 点挥砍伤害。",
    "attack": 3,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "panther",
  "name": "黑豹",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 13,
  "hitDice": "3d8",
  "speed": "50 尺，攀爬40 尺",
  "abilities": {
   "str": 14,
   "dex": 16,
   "con": 10,
   "int": 3,
   "wis": 14,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 4,
   "stealth": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 14",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：6（1d6+3）挥砍伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "灵活脱身",
    "desc": "黑豹执行撤离或躲藏动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "piranha",
  "name": "食人鱼",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 1,
  "hitDice": "1d4-1",
  "speed": "5 尺，游泳40 尺",
  "abilities": {
   "str": 2,
   "dex": 16,
   "con": 9,
   "int": 1,
   "wis": 7,
   "cha": 2
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 8",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "水下呼吸",
    "desc": "食人鱼只能在水下呼吸。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5（如果目标的生命值不满，则这次攻击检定具有优势），触及 5 尺。命中：1 点穿刺伤害。",
    "attack": 5,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "plesiosaurus",
  "name": "蛇颈龙",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 68,
  "hitDice": "8d10+24",
  "speed": "20 尺，游泳40 尺",
  "abilities": {
   "str": 18,
   "dex": 15,
   "con": 16,
   "int": 2,
   "wis": 12,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 3,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 13",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "屏息",
    "desc": "蛇颈龙可以屏住呼吸 1 小时。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 10 尺。命中：11（2d6+4）穿刺伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "polar-bear",
  "name": "北极熊",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 42,
  "hitDice": "5d10+15",
  "speed": "40 尺，游泳40 尺",
  "abilities": {
   "str": 20,
   "dex": 14,
   "con": 16,
   "int": 2,
   "wis": 13,
   "cha": 7
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 4
  },
  "resist": [
   "cold"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "北极熊进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：9（1d8+5）挥砍伤害。",
    "attack": 7,
    "damage": [
     {
      "dice": "1d8+5",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "pony",
  "name": "小马",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 10,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "40 尺",
  "abilities": {
   "str": 15,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 11,
   "cha": 7
  },
  "saves": {
   "str": 4
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "蹄击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）钝击伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "pteranodon",
  "name": "无齿翼龙",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 13,
  "hitDice": "3d8",
  "speed": "10 尺，飞行60 尺",
  "abilities": {
   "str": 12,
   "dex": 15,
   "con": 10,
   "int": 2,
   "wis": 9,
   "cha": 5
  },
  "saves": {},
  "skills": {
   "perception": 1
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 11",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "掠飞",
    "desc": "无齿翼龙飞出敌人的触及范围时不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：6（1d8+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d8+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "rat",
  "name": "老鼠",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 10,
  "acNote": "",
  "hp": 1,
  "hitDice": "1d4-1",
  "speed": "20 尺，攀爬20 尺",
  "abilities": {
   "str": 2,
   "dex": 11,
   "con": 9,
   "int": 2,
   "wis": 10,
   "cha": 4
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 30 尺，被动察觉 12",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "灵动",
    "desc": "老鼠移出敌人的触及范围时不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：1 点穿刺伤害。",
    "attack": 2,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "raven",
  "name": "渡鸦",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 2,
  "hitDice": "1d4",
  "speed": "10 尺，飞行50 尺",
  "abilities": {
   "str": 2,
   "dex": 14,
   "con": 10,
   "int": 5,
   "wis": 13,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "perception": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 13",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "拟声",
    "desc": "渡鸦能模仿它听过的简单声音，例如低语声或吱喳声。听者如果在一次 DC 10 的感知（洞悉）检定中成功，就能分辨出这些声音是模仿出来的。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啄击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：1 点穿刺伤害。",
    "attack": 4,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "reef-shark",
  "name": "礁鲨",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 22,
  "hitDice": "4d8+4",
  "speed": "5 尺，游泳30 尺",
  "abilities": {
   "str": 14,
   "dex": 15,
   "con": 13,
   "int": 1,
   "wis": 10,
   "cha": 4
  },
  "saves": {},
  "skills": {
   "perception": 2
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 30 尺，被动察觉 12",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果鲨鱼至少有一个盟友位于某个生物 5 尺内，且该盟友没有陷入失能状态，则鲨鱼对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "水下呼吸",
    "desc": "鲨鱼只能在水下呼吸。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：7（2d4+2）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d4+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "rhinoceros",
  "name": "犀牛",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 45,
  "hitDice": "6d10+12",
  "speed": "40 尺",
  "abilities": {
   "str": 21,
   "dex": 8,
   "con": 15,
   "int": 2,
   "wis": 12,
   "cha": 6
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 11",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "顶撞",
    "desc": "近战攻击检定：+7，触及 5 尺。命中：14（2d8+5）穿刺伤害。如果目标是大型或更小的生物，并且犀牛在这次命中之前刚刚朝它直线移动了至少 20 尺，则目标额外受到 9（2d8）穿刺伤害，并陷入倒地状态。",
    "attack": 7,
    "damage": [
     {
      "dice": "2d8+5",
      "type": "piercing"
     },
     {
      "dice": "2d8",
      "type": "piercing",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "riding-horse",
  "name": "乘用马",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 13,
  "hitDice": "2d10+2",
  "speed": "60 尺",
  "abilities": {
   "str": 16,
   "dex": 13,
   "con": 12,
   "int": 2,
   "wis": 11,
   "cha": 7
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "蹄击",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：7（1d8+3）钝击伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "1d8+3",
      "type": "bludgeoning"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "saber-toothed-tiger",
  "name": "剑齿虎",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 52,
  "hitDice": "7d10+14",
  "speed": "40 尺",
  "abilities": {
   "str": 18,
   "dex": 17,
   "con": 15,
   "int": 3,
   "wis": 12,
   "cha": 8
  },
  "saves": {
   "str": 6,
   "dex": 5
  },
  "skills": {
   "perception": 5,
   "stealth": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "助跑跳跃",
    "desc": "经过 10 尺助跑后，剑齿虎的跳远距离最多可达 25 尺。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "剑齿虎进行两次撕裂攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：11（2d6+4）挥砍伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d6+4",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "灵活脱身",
    "desc": "剑齿虎执行撤离或躲藏动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "scorpion",
  "name": "蝎子",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 1,
  "hitDice": "1d4-1",
  "speed": "10 尺",
  "abilities": {
   "str": 2,
   "dex": 11,
   "con": 8,
   "int": 1,
   "wis": 8,
   "cha": 2
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 10 尺，被动察觉 9",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "蜇刺",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：1 点穿刺伤害外加 3（1d6）毒素伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "1d6",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "seahorse",
  "name": "海马",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 1,
  "hitDice": "1d4-1",
  "speed": "5 尺，游泳20 尺",
  "abilities": {
   "str": 1,
   "dex": 12,
   "con": 8,
   "int": 1,
   "wis": 10,
   "cha": 2
  },
  "saves": {},
  "skills": {
   "perception": 2,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 12",
  "languages": "",
  "cr": 0,
  "xp": 0,
  "pb": 2,
  "traits": [
   {
    "name": "水下呼吸",
    "desc": "海马只能在水下呼吸。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "气泡冲刺",
    "desc": "在水下时，海马移动至多等同于其游泳速度的距离，且不会引发借机攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "spider",
  "name": "蜘蛛",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 1,
  "hitDice": "1d4-1",
  "speed": "20 尺，攀爬20 尺",
  "abilities": {
   "str": 2,
   "dex": 14,
   "con": 8,
   "int": 1,
   "wis": 10,
   "cha": 2
  },
  "saves": {},
  "skills": {
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 30 尺，被动察觉 10",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "蛛行",
    "desc": "蜘蛛可以在难以攀爬的表面上攀爬（包括沿着天花板爬行），无需进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "蛛网行者",
    "desc": "蜘蛛无视蛛网造成的移动限制，并且知道与同一张蛛网接触的任何其他生物的位置。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：1 点穿刺伤害外加 2（1d4）毒素伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "swarm-of-bats",
  "name": "蝙蝠群",
  "size": "大型",
  "type": "微型野兽集群",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d10",
  "speed": "5 尺，飞行30 尺",
  "abilities": {
   "str": 5,
   "dex": 15,
   "con": 10,
   "int": 2,
   "wis": 12,
   "cha": 4
  },
  "saves": {},
  "skills": {},
  "resist": [
   "bludgeoning",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "charmed",
   "frightened",
   "grappled",
   "paralyzed",
   "petrified",
   "prone",
   "restrained",
   "stunned"
  ],
  "senses": "盲视 60 尺，被动察觉 11",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "集群",
    "desc": "集群可以占据其他生物的空间，反之亦然；集群可以穿过任何足以容纳一只微型蝙蝠的开口。集群无法恢复生命值，也无法获得临时生命值。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（2d4）穿刺伤害；如果集群已浴血，则改为 2（1d4）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "2d4",
      "type": "piercing"
     },
     {
      "dice": "1d4",
      "type": "piercing",
      "when": "or"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "swarm-of-insects",
  "name": "虫群",
  "size": "中型",
  "type": "微型野兽集群",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 19,
  "hitDice": "3d8+6",
  "speed": "20 尺",
  "abilities": {
   "str": 3,
   "dex": 13,
   "con": 14,
   "int": 1,
   "wis": 7,
   "cha": 1
  },
  "saves": {},
  "skills": {},
  "resist": [
   "bludgeoning",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "charmed",
   "frightened",
   "grappled",
   "paralyzed",
   "petrified",
   "prone",
   "restrained",
   "stunned"
  ],
  "senses": "盲视 30 尺，被动察觉 8",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [
   {
    "name": "蛛行",
    "desc": "如果集群拥有攀爬速度，它可以在难以攀爬的表面上攀爬（包括沿着天花板爬行），无需进行属性检定。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "集群",
    "desc": "集群可以占据其他生物的空间，反之亦然；集群可以穿过任何足以容纳一只微型昆虫的开口。集群无法恢复生命值，也无法获得临时生命值。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+3，触及 5 尺。命中：6（2d4+1）毒素伤害；如果集群已浴血，则改为 3（1d4+1）毒素伤害。",
    "attack": 3,
    "damage": [
     {
      "dice": "2d4+1",
      "type": "poison"
     },
     {
      "dice": "1d4+1",
      "type": "poison",
      "when": "or"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "swarm-of-piranhas",
  "name": "食人鱼群",
  "size": "中型",
  "type": "微型野兽集群",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 28,
  "hitDice": "8d8-8",
  "speed": "5 尺，游泳40 尺",
  "abilities": {
   "str": 13,
   "dex": 16,
   "con": 9,
   "int": 1,
   "wis": 7,
   "cha": 2
  },
  "saves": {},
  "skills": {},
  "resist": [
   "bludgeoning",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "charmed",
   "frightened",
   "grappled",
   "paralyzed",
   "petrified",
   "prone",
   "restrained",
   "stunned"
  ],
  "senses": "黑暗视觉 60 尺，被动察觉 8",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [
   {
    "name": "集群",
    "desc": "集群可以占据其他生物的空间，反之亦然；集群可以穿过任何足以容纳一条微型食人鱼的开口。集群无法恢复生命值，也无法获得临时生命值。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "水下呼吸",
    "desc": "集群只能在水下呼吸。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5（如果目标的生命值不满，则这次攻击检定具有优势），触及 5 尺。命中：8（2d4+3）穿刺伤害；如果集群已浴血，则改为 5（1d4+3）穿刺伤害。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d4+3",
      "type": "piercing"
     },
     {
      "dice": "1d4+3",
      "type": "piercing",
      "when": "or"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "swarm-of-rats",
  "name": "鼠群",
  "size": "中型",
  "type": "微型野兽集群",
  "alignment": "无阵营",
  "ac": 10,
  "acNote": "",
  "hp": 14,
  "hitDice": "4d8-4",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 9,
   "dex": 11,
   "con": 9,
   "int": 2,
   "wis": 10,
   "cha": 3
  },
  "saves": {
   "dex": 2
  },
  "skills": {},
  "resist": [
   "bludgeoning",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "charmed",
   "frightened",
   "grappled",
   "paralyzed",
   "petrified",
   "prone",
   "restrained",
   "stunned"
  ],
  "senses": "黑暗视觉 30 尺，被动察觉 10",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "集群",
    "desc": "集群可以占据其他生物的空间，反之亦然；集群可以穿过任何足以容纳一只微型老鼠的开口。集群无法恢复生命值，也无法获得临时生命值。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：5（2d4）穿刺伤害；如果集群已浴血，则改为 2（1d4）穿刺伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "2d4",
      "type": "piercing"
     },
     {
      "dice": "1d4",
      "type": "piercing",
      "when": "or"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "swarm-of-ravens",
  "name": "渡鸦群",
  "size": "中型",
  "type": "微型野兽集群",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "10 尺，飞行50 尺",
  "abilities": {
   "str": 6,
   "dex": 14,
   "con": 12,
   "int": 5,
   "wis": 12,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "perception": 5
  },
  "resist": [
   "bludgeoning",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "charmed",
   "frightened",
   "grappled",
   "paralyzed",
   "petrified",
   "prone",
   "restrained",
   "stunned"
  ],
  "senses": "被动察觉 15",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "集群",
    "desc": "集群可以占据其他生物的空间，反之亦然；集群可以穿过任何足以容纳一只微型渡鸦的开口。集群无法恢复生命值，也无法获得临时生命值。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啄击",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）穿刺伤害；如果集群已浴血，则改为 2（1d4）穿刺伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     },
     {
      "dice": "1d4",
      "type": "piercing",
      "when": "or"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   },
   {
    "name": "聒噪（充能 6）",
    "desc": "感知豁免：DC 10，集群所在空间内的一个生物。失败：目标陷入耳聋状态，直到集群的下个回合开始。处于耳聋状态期间，目标的属性检定和攻击检定也具有劣势。",
    "attack": null,
    "damage": [],
    "save": {
     "ability": "wis",
     "dc": 10,
     "onSuccess": "none"
    },
    "recharge": 6,
    "perDay": null,
    "multiattack": false,
    "saveCondition": "deafened"
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "swarm-of-venomous-snakes",
  "name": "毒蛇群",
  "size": "中型",
  "type": "微型野兽集群",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 36,
  "hitDice": "8d8",
  "speed": "30 尺，游泳30 尺",
  "abilities": {
   "str": 8,
   "dex": 18,
   "con": 11,
   "int": 1,
   "wis": 10,
   "cha": 3
  },
  "saves": {},
  "skills": {},
  "resist": [
   "bludgeoning",
   "piercing",
   "slashing"
  ],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [
   "charmed",
   "frightened",
   "grappled",
   "paralyzed",
   "petrified",
   "prone",
   "restrained",
   "stunned"
  ],
  "senses": "盲视 10 尺，被动察觉 10",
  "languages": "",
  "cr": 2,
  "xp": 450,
  "pb": 2,
  "traits": [
   {
    "name": "集群",
    "desc": "集群可以占据其他生物的空间，反之亦然；集群可以穿过任何足以容纳一条微型蛇的开口。集群无法恢复生命值，也无法获得临时生命值。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：8（1d8+4）穿刺伤害——如果集群已浴血，则改为 6（1d4+4）穿刺伤害——外加 10（3d6）毒素伤害。",
    "attack": 6,
    "damage": [
     {
      "dice": "1d8+4",
      "type": "piercing"
     },
     {
      "dice": "1d4+4",
      "type": "piercing",
      "when": "if"
     },
     {
      "dice": "3d6",
      "type": "poison",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "tiger",
  "name": "老虎",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 30,
  "hitDice": "4d10+8",
  "speed": "40 尺",
  "abilities": {
   "str": 17,
   "dex": 16,
   "con": 14,
   "int": 3,
   "wis": 12,
   "cha": 8
  },
  "saves": {},
  "skills": {
   "perception": 3,
   "stealth": 7
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 1,
  "xp": 200,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "撕裂",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：10（2d6+3）挥砍伤害。如果目标是大型或更小的生物，它陷入倒地状态。",
    "attack": 5,
    "damage": [
     {
      "dice": "2d6+3",
      "type": "slashing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [
   {
    "name": "灵活脱身",
    "desc": "老虎执行撤离或躲藏动作。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "reactions": []
 },
 {
  "key": "triceratops",
  "name": "三角龙",
  "size": "巨型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 14,
  "acNote": "",
  "hp": 114,
  "hitDice": "12d12+36",
  "speed": "50 尺",
  "abilities": {
   "str": 22,
   "dex": 9,
   "con": 17,
   "int": 2,
   "wis": 11,
   "cha": 5
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 10",
  "languages": "",
  "cr": 5,
  "xp": 1800,
  "pb": 3,
  "traits": [],
  "actions": [
   {
    "name": "多重攻击",
    "desc": "三角龙进行两次顶撞攻击。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": true
   },
   {
    "name": "顶撞",
    "desc": "近战攻击检定：+9，触及 5 尺。命中：19（2d12+6）穿刺伤害。如果目标是巨型或更小，并且三角龙在这次命中之前刚刚朝它直线移动了至少 20 尺，则目标额外受到 9（2d8）穿刺伤害，并陷入倒地状态。",
    "attack": 9,
    "damage": [
     {
      "dice": "2d12+6",
      "type": "piercing"
     },
     {
      "dice": "2d8",
      "type": "piercing",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "venomous-snake",
  "name": "毒蛇",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 5,
  "hitDice": "2d4",
  "speed": "30 尺，游泳30 尺",
  "abilities": {
   "str": 2,
   "dex": 15,
   "con": 11,
   "int": 1,
   "wis": 10,
   "cha": 3
  },
  "saves": {},
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "盲视 10 尺，被动察觉 10",
  "languages": "",
  "cr": 0.125,
  "xp": 25,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：4（1d4+2）穿刺伤害外加 3（1d6）毒素伤害。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d4+2",
      "type": "piercing"
     },
     {
      "dice": "1d6",
      "type": "poison"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "vulture",
  "name": "秃鹫",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 10,
  "acNote": "",
  "hp": 5,
  "hitDice": "1d8+1",
  "speed": "10 尺，飞行50 尺",
  "abilities": {
   "str": 7,
   "dex": 10,
   "con": 13,
   "int": 2,
   "wis": 12,
   "cha": 4
  },
  "saves": {},
  "skills": {
   "perception": 3
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 13",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果秃鹫至少有一个盟友位于某个生物 5 尺内，且该盟友没有陷入失能状态，则秃鹫对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啄击",
    "desc": "近战攻击检定：+2，触及 5 尺。命中：2（1d4）穿刺伤害。",
    "attack": 2,
    "damage": [
     {
      "dice": "1d4",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "warhorse",
  "name": "战马",
  "size": "大型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 11,
  "acNote": "",
  "hp": 19,
  "hitDice": "3d10+3",
  "speed": "60 尺",
  "abilities": {
   "str": 18,
   "dex": 12,
   "con": 13,
   "int": 2,
   "wis": 12,
   "cha": 7
  },
  "saves": {
   "wis": 3
  },
  "skills": {},
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "被动察觉 11",
  "languages": "",
  "cr": 0.5,
  "xp": 100,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "蹄击",
    "desc": "近战攻击检定：+6，触及 5 尺。命中：9（2d4+4）钝击伤害。如果目标是大型或更小的生物，并且战马在这次命中之前刚刚朝它直线移动了至少 20 尺，则目标额外受到 5（2d4）钝击伤害，并陷入倒地状态。",
    "attack": 6,
    "damage": [
     {
      "dice": "2d4+4",
      "type": "bludgeoning"
     },
     {
      "dice": "2d4",
      "type": "bludgeoning",
      "when": "if"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "weasel",
  "name": "鼬鼠",
  "size": "微型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 13,
  "acNote": "",
  "hp": 1,
  "hitDice": "1d4-1",
  "speed": "30 尺，攀爬30 尺",
  "abilities": {
   "str": 3,
   "dex": 16,
   "con": 8,
   "int": 2,
   "wis": 12,
   "cha": 3
  },
  "saves": {},
  "skills": {
   "acrobatics": 5,
   "perception": 3,
   "stealth": 5
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 13",
  "languages": "",
  "cr": 0,
  "xp": 10,
  "pb": 2,
  "traits": [],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+5，触及 5 尺。命中：1 点穿刺伤害。",
    "attack": 5,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 },
 {
  "key": "wolf",
  "name": "狼",
  "size": "中型",
  "type": "野兽",
  "alignment": "无阵营",
  "ac": 12,
  "acNote": "",
  "hp": 11,
  "hitDice": "2d8+2",
  "speed": "40 尺",
  "abilities": {
   "str": 14,
   "dex": 15,
   "con": 12,
   "int": 3,
   "wis": 12,
   "cha": 6
  },
  "saves": {},
  "skills": {
   "perception": 5,
   "stealth": 4
  },
  "resist": [],
  "vulnerable": [],
  "immune": [],
  "conditionImmune": [],
  "senses": "黑暗视觉 60 尺，被动察觉 15",
  "languages": "",
  "cr": 0.25,
  "xp": 50,
  "pb": 2,
  "traits": [
   {
    "name": "群体战术",
    "desc": "如果狼至少有一个盟友位于某个生物 5 尺内，且该盟友没有陷入失能状态，则狼对该生物进行的攻击检定具有优势。",
    "attack": null,
    "damage": [],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "actions": [
   {
    "name": "啮咬",
    "desc": "近战攻击检定：+4，触及 5 尺。命中：5（1d6+2）穿刺伤害。如果目标是中型或更小的生物，它陷入倒地状态。",
    "attack": 4,
    "damage": [
     {
      "dice": "1d6+2",
      "type": "piercing"
     }
    ],
    "save": null,
    "recharge": null,
    "perDay": null,
    "multiattack": false
   }
  ],
  "bonusActions": [],
  "reactions": []
 }
];
