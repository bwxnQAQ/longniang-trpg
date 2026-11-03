// 5E mod（V1.0.0）：普通剧本（龙娘规则第一版、第二版，不是地下城）换成 5E 规则玩。
// 每个身份按属性、专长、介绍转成一个 3 级的 5E 角色（预设好的，不是玩家自己的 5E 卡）；线索的检定换成技能和 DC；
// 规则第二版写的敌人换成 SRD 的怪物（名字、介绍照剧本的）。转好的剧本照 5E 模组跑，原来的那份另外存着（投稿、换回去用）。
// 全是程序按规则转的（不调用 AI）：同一个剧本每次转出来都一样。
import { ABILITIES, MOD5E_LEVEL, SKILL_ABILITY, SKILL_NAME, STANDARD_ARRAY, type Abilities, type Ability, type Skill } from '../../shared/5e/core';
import { PRIORITY, quickCard } from '../../shared/5e/quick';
import { computeSheet } from '../../shared/5e/sheet';
import type { Card5eData, ClassKey, RulesData } from '../../shared/5e/types';
import type { Pregen5eView } from '../../shared/game';
import { monsterData, rules5e } from '../5e/rules-data';
import type { Check5e, Clue, DungeonEnemy, Role, Scenario, ScenarioMonster5e } from './scenario';

/** 转出来的角色几级（「模组」里的 5E 模组按剧本写的建议等级；普通剧本的人物都是有本事的大人，用 3 级）。规则页也要用，写在 shared 里。 */
export { MOD5E_LEVEL };

/** 转好的剧本上记着的：从哪一版规则转来的、角色几级。 */
export type Mod5eInfo = { from: 1 | 2; level: number };

/** 身份转成的 5E 角色：卡上的选择（照它建这一局的角色）和给选身份的人看的样子。 */
export type Pregen5e = { data: Card5eData; view: Pregen5eView };

export type Scenario5eMod = Scenario & { mod5e: Mod5eInfo };

/** 能不能用 5E 规则玩：普通剧本能，地下城（带自己的角色卡、装备和掉落）和本来就是 5E 的模组不用转。 */
export function canPlayAs5e(s: Pick<Scenario, 'rules' | 'dungeon'>): boolean {
  return s.rules !== '5e' && !s.dungeon;
}

/** 这一份是不是转好的（对局里存的剧本）。 */
export function modOf(s: Scenario): Mod5eInfo | null {
  const m = (s as Partial<Scenario5eMod>).mod5e;
  return m && typeof m === 'object' && (m.from === 1 || m.from === 2) ? m : null;
}

/** 身份上存着的预设角色（转好的剧本才有）。 */
export function pregenOf(role: Role): Pregen5e | null {
  const p = (role as Role & { pregen5e?: Pregen5e }).pregen5e;
  return p && typeof p === 'object' && p.data && p.view ? p : null;
}

// ---------- 世界观里有没有法术 ----------

/** 志怪、奇幻、恐怖这些世界观里才给施法的职业；民国、武侠、商帮这些照现实来，只用战士、游荡者、武僧、野蛮人。 */
const MAGIC_WORLD = /志怪|奇幻|魔幻|玄幻|神话|仙侠|修仙|修真|神怪|灵异|妖|鬼|法术|巫|恐怖|魔法/;

export function magicWorld(s: Pick<Scenario, 'genre' | 'tone'>): boolean {
  return MAGIC_WORLD.test(`${s.genre} ${s.tone}`);
}

// ---------- 关键字对到 5E 的技能 ----------

/** 专长、身份介绍里的说法对到哪个技能（先对上的算；越具体的写在越前面）。 */
const SKILL_WORDS: [RegExp, Skill][] = [
  [/掌故|古文|典故|历史|洋文|洋务|行当|读书|学问|旧事|文献/, 'history'],
  [/药材|认药|草药|采药|山林|草木|天气|节令|兽性/, 'nature'],
  [/医|急救|验伤|验尸|伤口|病|毒|脉/, 'medicine'],
  [/察言观色|看穿|识人|洞悉|采访|问话|江湖规矩|人情世故/, 'insight'],
  [/审讯|盘问|威吓|恐吓|逼问|号令|镇场/, 'intimidation'],
  [/切口|骗|乔装|冒充|伪装|装扮|演技|诈/, 'deception'],
  [/戏|唱|曲|说书|乐|琴|笛|表演|舞|绘画|画/, 'performance'],
  [/能说会道|打听|人脉|讨价还价|游说|说服|交涉|应酬|口才|生意/, 'persuasion'],
  [/民俗|宗教|佛|道观|寺|庙|祭|风水|纸扎|扎纸|丧葬|香火/, 'religion'],
  [/符箓|阵法|咒|法术|妖|鬼怪|术数|奇门/, 'arcana'],
  [/查案|机关|鉴别|账|速记|仪器|修理|修车|无线电|合同|推理|誊抄|文书|算/, 'investigation'],
  [/潜行|轻手轻脚|躲藏|藏身|夜行/, 'stealth'],
  [/暗器|绳结|开锁|撬锁|偷|妙手|手艺|戏法/, 'sleight-of-hand'],
  [/轻功|走梁|攀高|翻墙|跳|杂技|身法|跟头/, 'acrobatics'],
  [/追踪|认踪|探路|找水|认路|熟门熟路|野外|打猎|求生|向导|辨认方向/, 'survival'],
  [/放哨|站岗|眼尖|耳尖|警觉|瞭望|望风/, 'perception'],
  [/驯|骆驼|马|兽|牲口|赶车/, 'animal-handling'],
  [/攀|爬|泅水|水性|游泳|撑船|擒拿|拳|刀|剑|枪|棍|力气|搬|摔|扛/, 'athletics'],
];

function skillsIn(text: string): Skill[] {
  const out: Skill[] = [];
  for (const [re, skill] of SKILL_WORDS) if (re.test(text) && !out.includes(skill)) out.push(skill);
  return out;
}

/** 一个身份擅长的技能：先看两个专长（专长里先对上的在前），再看身份的名字和介绍。 */
function preferredSkills(role: Role): Skill[] {
  const out: Skill[] = [];
  const add = (list: Skill[]) => {
    for (const s of list) if (!out.includes(s)) out.push(s);
  };
  for (const sp of role.specialties ?? []) add(skillsIn(sp));
  add(skillsIn(`${role.name} ${role.public}`));
  return out;
}

// ---------- 职业 ----------

/** 身份的属性折成六项（第二版的感知、意志合成感知；第一版的体魄同时算力量和体质）。 */
function aptitudes(role: Role): Abilities {
  const a = role.attributes as Record<string, number>;
  const n = (k: string) => (typeof a[k] === 'number' ? a[k] : 0);
  if ('strength' in a) {
    return { str: n('strength'), dex: n('agility'), con: n('constitution'), int: n('intellect'), wis: Math.max(n('perception'), n('will')), cha: n('charm') };
  }
  return { str: n('body'), dex: n('agility'), con: n('body') - 0.5, int: n('intellect'), wis: n('perception'), cha: n('charm') };
}

const has = (re: RegExp, text: string) => re.test(text);

/** 擅长用兵器、上阵打仗的说法：战士。 */
const WEAPON_WORDS = /刀|剑|枪|戟|盾|弓|箭|射|兵|将|镖|护院|武师|捕|巡官|衙役|军|守城|杀手|侠|警/;
/** 拳脚、轻功、内功：武僧。 */
const MARTIAL_ARTS = /拳|掌法|铁掌|腿法|轻功|功夫|内功|点穴|武僧|少林|武生/;
/** 力气大、莽撞的说法：野蛮人。 */
const BRUTE_WORDS = /力气|蛮|莽|屠|大汉|猛汉|脚夫|扛/;

/** 看职业、背景时只看身份的名字和专长（介绍里提到的事太杂）。 */
const roleWords = (role: Role) => `${role.name} ${(role.specialties ?? []).join(' ')}`;

/** 施法的职业：世界观里有法术、身份本身就是会这一套的人，才转成这些职业。 */
const CASTER_WORDS: [RegExp, ClassKey][] = [
  [/道士|道长|和尚|僧|尼|方丈|祭司|神婆|巫|修行|佛/, 'cleric'],
  [/术士|法师|方士|阵法|符箓|咒|修士|道术|仙/, 'wizard'],
  [/萨满|巫医|山神|狐/, 'druid'],
  [/契约|附身|鬼上身|邪术/, 'warlock'],
  [/戏|唱|曲|说书|琴|乐师/, 'bard'],
  [/猎户|猎人|斥候|游侠/, 'ranger'],
];

/** 按身份挑职业：分数最高的那个（分数一样按这个顺序）。 */
export function classFor(role: Role, magic: boolean): ClassKey {
  const a = aptitudes(role);
  const text = roleWords(role);
  if (magic) {
    for (const [re, cls] of CASTER_WORDS) if (has(re, text)) return cls;
  }
  const scores: [ClassKey, number][] = [
    ['fighter', 2 * Math.max(a.str, a.dex) + a.con + (has(WEAPON_WORDS, text) ? 4 : 0) - 0.5],
    // 武僧、野蛮人要身份本来就是练拳脚的、卖力气的，光是属性像不算
    ['monk', 2 * a.dex + 2 * a.wis - 3 + (has(MARTIAL_ARTS, text) ? 6 : 0)],
    ['barbarian', 2 * a.str + 2 * a.con - 4 + (has(BRUTE_WORDS, text) ? 4 : 0)],
    // 游荡者：会的技能最多（专精），不靠打架过日子的身份多半是它
    ['rogue', 2 * a.dex + Math.max(a.int, a.wis, a.cha) + 1 + (has(WEAPON_WORDS, text) || has(MARTIAL_ARTS, text) ? 0 : 2)],
  ];
  return scores.reduce((best, s) => (s[1] > best[1] ? s : best))[0];
}

/** 会施法的职业。 */
const CASTERS: ClassKey[] = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];

/** 按身份挑背景（SRD 的四种）。 */
function backgroundFor(role: Role, cls: ClassKey): string {
  const text = roleWords(role);
  if (/僧|和尚|尼|道士|道长|庙|寺|祭|香火/.test(text)) return 'acolyte';
  if (/书|学者|先生|掌眼|账|古|医|大夫|郎中|记者|文书|教|技术员|调查员/.test(text)) return 'sage';
  if (/兵|将|守|镖|武师|捕|巡|衙|护|军|警/.test(text)) return 'soldier';
  if (cls === 'fighter' || cls === 'barbarian' || cls === 'paladin') return 'soldier';
  if (cls === 'cleric') return 'acolyte';
  if (cls === 'wizard') return 'sage';
  return 'criminal';
}

/** 技能按身份擅长的程度排（那项属性高的在前；一样高的按常用的先）。 */
const USEFUL: Skill[] = ['perception', 'insight', 'investigation', 'persuasion', 'athletics', 'stealth', 'survival', 'medicine', 'history', 'acrobatics', 'deception', 'intimidation', 'nature', 'sleight-of-hand', 'religion', 'performance', 'animal-handling', 'arcana'];

function skillsByAptitude(role: Role): Skill[] {
  const a = aptitudes(role);
  return [...USEFUL].sort((x, y) => a[SKILL_ABILITY[y]] - a[SKILL_ABILITY[x]] || USEFUL.indexOf(x) - USEFUL.indexOf(y));
}

// ---------- 转一个身份 ----------

/** 身份的属性排先后，照标准数组（15、14、13、12、10、8）给六项属性；一样高的按职业看重的先。 */
function abilityScores(role: Role, cls: ClassKey): Abilities {
  const a = aptitudes(role);
  const order = [...ABILITIES].sort((x, y) => a[y] - a[x] || PRIORITY[cls].indexOf(x) - PRIORITY[cls].indexOf(y));
  const out = {} as Abilities;
  order.forEach((ab, i) => (out[ab] = STANDARD_ARRAY[i]));
  return out;
}

/** 身份转成的 5E 角色卡（3 级、人类）：职业、背景、属性、技能照身份来，装备、法术、职业特性照推荐的配。 */
export function pregenData(role: Role, opts: { magic: boolean; level?: number; rules?: RulesData }): Card5eData {
  const rules = opts.rules ?? rules5e();
  const cls = classFor(role, opts.magic);
  const background = backgroundFor(role, cls);
  const card = quickCard(rules, cls, { level: opts.level ?? MOD5E_LEVEL, species: 'human', background });
  const bg = rules.backgrounds.find((b) => b.key === background)!;
  const cl = rules.classes.find((c) => c.key === cls)!;

  // 属性：照身份排先后；背景的加值给背景三项里身份最擅长的两项
  card.base = abilityScores(role, cls);
  const rank = (x: Ability) => -card.base[x];
  const ranked = [...bg.abilities].sort((x, y) => rank(x) - rank(y));
  card.bgBonus = { [ranked[0]]: 2, [ranked[1]]: 1 };

  // 技能：身份擅长的先学（职业能学的放进职业技能，别的用人类的「熟练」和「多才多艺」补上）；
  // 剩下的照身份属性高的那几项挑
  const prefs = preferredSkills(role);
  const byAptitude = skillsByAptitude(role);
  const taken = new Set<Skill>(bg.skills);
  const classPicks: Skill[] = [];
  for (const s of [...prefs, ...byAptitude, ...cl.skillOptions]) {
    if (classPicks.length >= cl.skillCount) break;
    if (cl.skillOptions.includes(s) && !taken.has(s) && !classPicks.includes(s)) classPicks.push(s);
  }
  card.classSkills = classPicks;
  for (const s of classPicks) taken.add(s);
  const next = (fallback: Skill[]) => [...prefs, ...fallback].find((s) => !taken.has(s));
  card.bonusSkills = card.bonusSkills.map((b) => {
    if (b.source !== 'skillful') return b;
    const skill = next(byAptitude) ?? b.skill;
    taken.add(skill);
    return { ...b, skill };
  });
  for (const b of card.bonusSkills) taken.add(b.skill);
  const threeMore = (): Skill[] => {
    const out: Skill[] = [];
    for (const s of [...prefs, ...byAptitude]) {
      if (out.length >= 3) break;
      if (!taken.has(s)) {
        out.push(s);
        taken.add(s);
      }
    }
    return out;
  };
  // 背景的魔法学徒：只给会施法的职业（不施法的身份换成多才多艺，再学三个技能）；
  // 人类的「多面手」起源专长：背景已经是多才多艺的换成警觉，别的换成多才多艺
  const caster = CASTERS.includes(cls);
  card.originFeats = card.originFeats.map((f) => (f.key === 'magic-initiate' && !caster ? { key: 'skilled', source: 'background', skills: threeMore() } : f));
  const skilledAlready = card.originFeats.some((f) => f.key === 'skilled');
  card.originFeats = card.originFeats.map((f) =>
    f.source !== 'species' ? f : skilledAlready ? { key: 'alert', source: 'species' } : { key: 'skilled', source: 'species', skills: threeMore() },
  );
  // 专精（游荡者）：身份最擅长的、已经熟练的技能
  if (card.expertise.length) {
    const prof = new Set<Skill>([...taken]);
    const want = [...prefs.filter((s) => prof.has(s)), ...card.expertise, ...prof].filter((s, i, list) => list.indexOf(s) === i && prof.has(s));
    card.expertise = want.slice(0, card.expertise.length);
  }
  return card;
}

/** 给选身份的人看的样子。 */
export function pregenView(data: Card5eData, rules: RulesData = rules5e()): Pregen5eView {
  const sheet = computeSheet(data, rules);
  const spellName = (k: string) => rules.spells.find((s) => s.key === k)?.name ?? k;
  return {
    className: sheet.className,
    subclassName: sheet.subclassName,
    speciesName: sheet.speciesName,
    backgroundName: sheet.backgroundName,
    level: sheet.level,
    hpMax: sheet.hpMax,
    ac: sheet.ac,
    abilities: sheet.abilities,
    skills: (Object.keys(sheet.skills) as Skill[]).filter((s) => sheet.skills[s].prof >= 1).map((s) => SKILL_NAME[s]),
    attacks: sheet.attacks.slice(0, 3).map((a) => a.name),
    spells: sheet.spell ? [...sheet.spell.cantrips, ...sheet.spell.prepared].map(spellName) : [],
  };
}

// ---------- 线索的检定 ----------

/** 第二版、第一版的情境修正折成 DC：0 是 12，难一级加 2（最低 8，最高 20）。 */
export function dcFor(modifier: number): number {
  return Math.max(8, Math.min(20, 12 - 2 * modifier));
}

/** 原来的属性对到哪项 5E 属性、默认用哪个技能，再按「怎么找到」的说法换成更贴切的技能。 */
export function check5eFor(clue: Pick<Clue, 'how' | 'title'>, attribute: string, modifier: number): Check5e {
  const text = `${clue.title} ${clue.how}`;
  const pick = (options: [RegExp, Skill][], fallback: Skill | null, ability: Ability): Check5e => {
    for (const [re, skill] of options) if (re.test(text)) return { skill, ability: SKILL_ABILITY[skill], dc: dcFor(modifier) };
    return { skill: fallback, ability: fallback ? SKILL_ABILITY[fallback] : ability, dc: dcFor(modifier) };
  };
  switch (attribute) {
    case 'perception':
      return pick(
        [
          [/看穿|神色|心思|真假|撒谎|谎话|脸色|试探/, 'insight'],
          [/尸|伤口|伤痕|病|毒|药渣|血迹/, 'medicine'],
          [/脚印|足迹|踪|痕迹|车辙|蹄印/, 'survival'],
        ],
        'perception',
        'wis',
      );
    case 'intellect':
      return pick(
        [
          [/掌故|古|旧|历史|典故|戏文|记载|字画|题字/, 'history'],
          [/药|草|山|林|兽|天气|水源|植物/, 'nature'],
          [/庙|神|佛|道|祭|符|民俗|纸扎|风水|香/, 'religion'],
          [/法术|妖|阵|咒|符箓/, 'arcana'],
        ],
        'investigation',
        'int',
      );
    case 'charm':
      return pick(
        [
          [/骗|诈|冒充|假装|哄|唬|瞒/, 'deception'],
          [/威吓|吓|逼|恐吓|威胁|镇住|喝问/, 'intimidation'],
          [/唱|演|戏|曲/, 'performance'],
        ],
        'persuasion',
        'cha',
      );
    case 'agility':
      return pick(
        [
          [/偷|摸走|顺手|撬|锁|解开|掏|取出/, 'sleight-of-hand'],
          [/潜|偷偷|躲|悄悄|溜|摸进|避开/, 'stealth'],
        ],
        'acrobatics',
        'dex',
      );
    case 'strength':
    case 'body':
      return pick([], 'athletics', 'str');
    case 'constitution':
      return { skill: null, ability: 'con', dc: dcFor(modifier) };
    case 'will':
      return { skill: null, ability: 'wis', dc: dcFor(modifier) };
    default:
      return pick([], 'perception', 'wis');
  }
}

// ---------- 敌人 ----------

/** 规则第二版的敌人对到 SRD 的怪物：先看是不是野兽，再看说法，最后按小怪、精英、首领。 */
export function monsterFor(e: Pick<DungeonEnemy, 'name' | 'description' | 'tier'>): string {
  const text = `${e.name} ${e.description}`;
  const beast: [RegExp, Record<DungeonEnemy['tier'], string>][] = [
    [/野猪/, { minion: 'boar', elite: 'giant-boar', boss: 'giant-boar' }],
    [/狼/, { minion: 'wolf', elite: 'dire-wolf', boss: 'dire-wolf' }],
    [/熊/, { minion: 'black-bear', elite: 'brown-bear', boss: 'brown-bear' }],
    [/虎/, { minion: 'panther', elite: 'tiger', boss: 'tiger' }],
    [/蛇/, { minion: 'venomous-snake', elite: 'giant-venomous-snake', boss: 'giant-constrictor-snake' }],
    [/犬|狗|獒/, { minion: 'mastiff', elite: 'mastiff', boss: 'mastiff' }],
  ];
  for (const [re, map] of beast) if (re.test(text)) return map[e.tier];
  if (e.tier === 'boss') {
    if (/大将|将军|统领|骑/.test(text)) return 'knight';
    if (/当家|帮|寨|头目|龙头|舵主/.test(text)) return 'tough-boss';
    return 'warrior-veteran';
  }
  if (e.tier === 'elite') {
    if (/力气大|蛮力|狂|莽/.test(text)) return 'berserker';
    if (/军|兵|先锋|队正|校尉/.test(text)) return 'warrior-veteran';
    return 'bandit-captain';
  }
  // 小怪：名字是弓手、射手的才用斥候（两次远程攻击，成群上场太凶）
  if (/弓手|射手|猎手|神射/.test(e.name)) return 'scout';
  if (/打手|恶棍|脚夫|扁担|杠棒|膀大腰圆|地痞/.test(text)) return 'tough';
  if (/衙役|捕快|巡警|守卫|亲兵|铁甲/.test(text)) return 'guard';
  if (/兵|卒|营|刀手/.test(text)) return 'warrior-infantry';
  return 'bandit';
}

/**
 * 剧本里没写成敌人的人物（NPC）动起手来时用的几个通用数据块：开打时 name 填他的名字。
 * 普通剧本里谁都可能动手（凶手被揭穿、争执升级），5E 的战斗要有数据块才能记账。
 */
export const NPC_MONSTERS: ScenarioMonster5e[] = [
  { key: 'npc-commoner', name: '普通人', description: '不会打架的普通人：掌柜、伙计、书生、老人、孩子。', monster: 'commoner', stats: null },
  { key: 'npc-tough', name: '会打架的人', description: '打手、地痞、壮汉、走江湖的：身上有把子力气，下手狠。', monster: 'tough', stats: null },
  { key: 'npc-guard', name: '官差兵丁', description: '衙役、巡警、兵丁、护院：有兵器、穿着号衣或甲。', monster: 'guard', stats: null },
  { key: 'npc-veteran', name: '练家子', description: '真正练过的高手、老兵、江湖好手：一个顶几个。', monster: 'warrior-veteran', stats: null },
];

function monstersFrom(enemies: DungeonEnemy[]): ScenarioMonster5e[] {
  const list: ScenarioMonster5e[] = enemies.map((e) => {
    const key = monsterFor(e);
    return {
      key: e.key,
      name: e.name,
      description: [e.description, ...(e.abilities ?? [])].join(' ').slice(0, 600),
      monster: monsterData(key) ? key : 'bandit',
      stats: null,
    };
  });
  for (const m of NPC_MONSTERS) if (!list.some((x) => x.key === m.key)) list.push({ ...m });
  return list;
}

// ---------- 整个剧本 ----------

/**
 * 普通剧本转成 5E 规则玩的那一份：规则写成 5E、角色 3 级；身份带上预设的 5E 角色；线索的检定换成技能和 DC；
 * 敌人换成 SRD 的怪物；心智规则不用（5E 用感知豁免和恐慌状态）。剧本里别的内容（真相、线索、NPC、结局）不动。
 */
export function convertTo5e(scenario: Scenario, rules: RulesData = rules5e()): Scenario5eMod {
  if (!canPlayAs5e(scenario)) throw new Error('这个剧本不用转');
  const from: 1 | 2 = scenario.rules === 2 ? 2 : 1;
  const magic = magicWorld(scenario);
  const roles = scenario.roles.map((r) => {
    const data = pregenData(r, { magic, rules });
    return { ...r, pregen5e: { data, view: pregenView(data, rules) } satisfies Pregen5e };
  });
  const clues = scenario.clues.map((c) => {
    if (!c.check || 'dc' in c.check) return c;
    return { ...c, check: check5eFor(c, c.check.attribute, c.check.modifier) };
  });
  const converted: Scenario5eMod = {
    ...scenario,
    rules: '5e',
    level: MOD5E_LEVEL,
    monsters: monstersFrom(scenario.enemies ?? []),
    treasure: [],
    stress: false,
    roles,
    clues,
    mod5e: { from, level: MOD5E_LEVEL },
  };
  delete converted.enemies;
  return converted;
}
