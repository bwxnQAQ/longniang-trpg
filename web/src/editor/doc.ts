// 剧本编辑器（V0.8.0）里改剧本用的小工具：都不改原来的对象（路上的对象、数组复制一份），没碰到的字段原样留着
// ——表单盖不到的字段（地下城那一大块、以后加的字段）只在 JSON 里改，表单改别的地方时不能把它们弄丢。
import type { ProblemTarget } from '../../../shared/editor';
import { ATTRIBUTE_KEYS, MODIFIER_MAX, MODIFIER_MIN, STARTING_VALUES } from '../../../shared/rules';
import { ATTRIBUTE2_KEYS, MODIFIER2_MAX, MODIFIER2_MIN, ROLE2_TOTAL, roleAttributes2Problem } from '../../../shared/rules2';
import { SKILL_ABILITY, type Skill } from '../../../shared/5e/core';

export type Obj = Record<string, unknown>;
/** 剧本里的一个位置，比如 ['roles', 2, 'name']。 */
export type Path = (string | number)[];

export const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** 显示在输入框里的文字：不是文字的（写错了类型）也照样显示出来。 */
export function text(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v === undefined || v === null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

export function getIn(root: unknown, path: Path): unknown {
  let v = root;
  for (const k of path) {
    if (v === null || typeof v !== 'object') return undefined;
    v = (v as Record<string | number, unknown>)[k];
  }
  return v;
}

/** 改一处，返回新的整份；value 是 undefined 时删掉对象里的这一项。 */
export function setIn(root: unknown, path: Path, value: unknown): unknown {
  if (!path.length) return value;
  const [k, ...rest] = path;
  if (typeof k === 'number') {
    const list = Array.isArray(root) ? [...root] : [];
    list[k] = setIn(list[k], rest, value);
    return list;
  }
  const obj: Obj = isObj(root) ? { ...root } : {};
  const next = setIn(obj[k], rest, value);
  if (next === undefined) delete obj[k];
  else obj[k] = next;
  return obj;
}

const asList = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function listAdd(list: unknown, item: unknown): unknown[] {
  return [...asList(list), item];
}

export function listRemove(list: unknown, index: number): unknown[] {
  const out = [...asList(list)];
  out.splice(index, 1);
  return out;
}

/** 和上一项（by = -1）或者下一项（by = 1）换个位置。 */
export function listMove(list: unknown, index: number, by: -1 | 1): unknown {
  const out = [...asList(list)];
  const to = index + by;
  if (to < 0 || to >= out.length) return list;
  [out[index], out[to]] = [out[to], out[index]];
  return out;
}

/** 输入框的 id（检查出问题时按路径找到它）：['roles', 2, 'name'] → ed-roles-2-name。 */
export function fieldId(path: Path): string {
  return `ed-${path.join('-')}`;
}

/** 新加一项用的标识：前缀加上没用过的最小的数，比如 place-3。 */
export function nextKey(list: unknown, prefix: string): string {
  const used = new Set(asList(list).map((x) => (isObj(x) ? x.key : undefined)));
  for (let n = 1; ; n++) if (!used.has(`${prefix}-${n}`)) return `${prefix}-${n}`;
}

/** 一个列表里的 { 标识, 显示的名字 }（下拉框的选项用）。 */
export function keyOptions(list: unknown, label: (item: Obj, key: string) => string): { value: string; label: string }[] {
  return asList(list)
    .filter(isObj)
    .filter((x): x is Obj & { key: string } => typeof x.key === 'string' && x.key !== '')
    .map((x) => ({ value: x.key, label: label(x, x.key) }));
}

// ---------- 改标识：引用它的地方跟着改 ----------

/** 有标识、会被别处引用的东西。 */
export type KeyKind = 'roles' | 'locations' | 'npcs' | 'truth.points' | 'clues' | 'timeline' | 'endings';

/** 列表里的每一项过一遍 fn；一项都没变就还给原来的列表（不是列表的原样还回去）。 */
function mapItems(list: unknown, fn: (item: Obj) => Obj): unknown {
  if (!Array.isArray(list)) return list;
  let changed = false;
  const out = list.map((item) => {
    if (!isObj(item)) return item;
    const next = fn(item);
    if (next !== item) changed = true;
    return next;
  });
  return changed ? out : list;
}

/** o[key] 是 from 的换成 to。 */
const swap = (o: Obj, key: string, from: string, to: string): Obj => (o[key] === from ? { ...o, [key]: to } : o);
/** o[key] 是文字列表的，里面的 from 换成 to。 */
const swapIn = (o: Obj, key: string, from: string, to: string): Obj =>
  Array.isArray(o[key]) && (o[key] as unknown[]).includes(from) ? { ...o, [key]: (o[key] as unknown[]).map((v) => (v === from ? to : v)) } : o;
/** o[key] 是对象的，它的键 from 改名成 to（顺序不变）。 */
const renameProp = (o: Obj, key: string, from: string, to: string): Obj => {
  const inner = o[key];
  if (!isObj(inner) || !(from in inner) || to in inner) return o;
  return { ...o, [key]: Object.fromEntries(Object.entries(inner).map(([k, v]) => [k === from ? to : k, v])) };
};
/** 只改已经有的字段（不凭空加上 roles: undefined 这种）。 */
function patch(doc: Obj, key: string, value: unknown): Obj {
  return key in doc && doc[key] !== value ? { ...doc, [key]: value } : doc;
}

/**
 * 标识从 from 改成 to 以后，剧本里引用它的地方也跟着改：
 * 地点（身份的开局地点、出口、线索和 NPC 的地点、地下城里的地点）、真相的要点（线索指向的真相）、
 * 线索和 NPC（地下城几种真相下的线索内容、NPC）。身份、时间线、结局的标识没有别处引用。
 */
export function renameRefs(doc: Obj, kind: KeyKind, from: string, to: string): Obj {
  if (!from || from === to) return doc;
  let d = doc;
  if (kind === 'locations') {
    d = patch(d, 'roles', mapItems(d.roles, (r) => swap(r, 'startLocation', from, to)));
    d = patch(
      d,
      'locations',
      mapItems(d.locations, (l) => {
        const exits = mapItems(l.exits, (e) => swap(e, 'to', from, to));
        return exits === l.exits ? l : { ...l, exits };
      }),
    );
    d = patch(d, 'clues', mapItems(d.clues, (c) => swap(c, 'location', from, to)));
    d = patch(d, 'npcs', mapItems(d.npcs, (n) => swap(n, 'location', from, to)));
    if (isObj(d.dungeon)) {
      let g = swap(d.dungeon, 'exit', from, to);
      if (isObj(g.boss)) {
        const boss = swap(g.boss, 'location', from, to);
        if (boss !== g.boss) g = { ...g, boss };
      }
      g = patch(g, 'encounters', mapItems(g.encounters, (e) => swapIn(e, 'places', from, to)));
      g = patch(g, 'loot', mapItems(g.loot, (l) => swapIn(l, 'places', from, to)));
      d = patch(d, 'dungeon', g);
    }
  } else if (kind === 'truth.points') {
    d = patch(d, 'clues', mapItems(d.clues, (c) => swapIn(c, 'points', from, to)));
  } else if ((kind === 'clues' || kind === 'npcs') && isObj(d.dungeon)) {
    d = patch(d, 'dungeon', patch(d.dungeon, 'variants', mapItems(d.dungeon.variants, (v) => renameProp(v, kind, from, to))));
  }
  return d;
}

/** 列表在剧本里的位置。 */
export const LIST_PATH: Record<KeyKind, Path> = {
  roles: ['roles'],
  locations: ['locations'],
  npcs: ['npcs'],
  'truth.points': ['truth', 'points'],
  clues: ['clues'],
  timeline: ['timeline'],
  endings: ['endings'],
};

/**
 * 把列表里第 index 项的标识改成 key。新的标识没被别的项用着、旧的标识也只有这一项在用，引用它的地方跟着改；
 * 不然只改这一项（检查会说重复了），免得把别的项的引用也改走。
 */
export function renameItemKey(doc: Obj, kind: KeyKind, index: number, key: string): Obj {
  const listPath = LIST_PATH[kind];
  const list = asList(getIn(doc, listPath));
  const item = list[index];
  if (!isObj(item) || item.key === key) return doc;
  const old = typeof item.key === 'string' ? item.key : '';
  const next = setIn(doc, [...listPath, index, 'key'], key) as Obj;
  const sameKey = (k: string) => list.filter((x, i) => i !== index && isObj(x) && x.key === k).length;
  if (!old || !key || sameKey(key) > 0 || sameKey(old) > 0) return next;
  return renameRefs(next, kind, old, key);
}

// ---------- 规则第一版、第二版 ----------

/** 身份的属性怎么写：第一版五项、第二版七项、地下城和 5E 模组不写（玩家带自己的角色卡）。 */
export type RoleMode = 'rules1' | 'rules2' | 'dungeon' | 'five';

export function roleMode(doc: Obj): RoleMode {
  if (doc.category === 'dungeon') return 'dungeon';
  if (doc.rules === '5e') return 'five';
  return doc.rules === 2 ? 'rules2' : 'rules1';
}

/** 第二版新身份的属性：七项加起来正好 4。 */
export function defaultAttributes2(): Record<string, number> {
  return { strength: 1, constitution: 1, agility: 1, intellect: 1, perception: 0, will: 0, charm: 0 };
}

/** 第一版新身份的属性：+2、+1、+1、0、−1 各用一次。 */
export function defaultAttributes1(): Record<string, number> {
  return Object.fromEntries(ATTRIBUTE_KEYS.map((k, i) => [k, STARTING_VALUES[i]]));
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** 第一版的属性对不对（+2、+1、+1、0、−1 各用一次）。 */
function valid1(v: unknown): v is Record<string, number> {
  if (!isObj(v)) return false;
  const values = ATTRIBUTE_KEYS.map((k) => v[k]);
  if (!values.every((x) => typeof x === 'number')) return false;
  const want = [...STARTING_VALUES].sort((a, b) => a - b).join();
  return (values as number[]).sort((a, b) => a - b).join() === want;
}

/** 第一版的五项换成第二版的七项：体魄给力量，体质、意志从 0 起，再把差的点数补在体质上（加起来正好 4）。 */
function toRules2(v: unknown): Record<string, number> {
  if (!valid1(v)) return defaultAttributes2();
  const out: Record<string, number> = { strength: v.body, constitution: 0, agility: v.agility, intellect: v.intellect, perception: v.perception, will: 0, charm: v.charm };
  out.constitution += ROLE2_TOTAL - Object.values(out).reduce((s, x) => s + x, 0);
  return out;
}

/** 第二版的七项换成第一版的五项：按高低排，最高的 +2，接着两个 +1，再 0，最低的 −1（同样高的按原来的顺序）。 */
function toRules1(v: unknown): Record<string, number> {
  if (!isObj(v)) return defaultAttributes1();
  const score: Record<string, number> = {
    body: Math.max(num(v.strength), num(v.constitution)),
    agility: num(v.agility),
    intellect: num(v.intellect),
    perception: Math.max(num(v.perception), num(v.will)),
    charm: num(v.charm),
  };
  const order = [...ATTRIBUTE_KEYS].sort((a, b) => score[b] - score[a]);
  return Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, STARTING_VALUES[order.indexOf(k)]]));
}

const CHECK_TO_2: Record<string, string> = { body: 'strength', agility: 'agility', intellect: 'intellect', perception: 'perception', charm: 'charm' };
const CHECK_TO_1: Record<string, string> = { strength: 'body', constitution: 'body', agility: 'agility', intellect: 'intellect', perception: 'perception', will: 'perception', charm: 'charm' };

/** 七项、五项属性对到 5E 的属性（V0.9.0）。 */
const ABILITY_OF: Record<string, string> = {
  strength: 'str',
  constitution: 'con',
  agility: 'dex',
  intellect: 'int',
  perception: 'wis',
  will: 'wis',
  charm: 'cha',
  body: 'str',
};
const FROM_ABILITY_2: Record<string, string> = { str: 'strength', con: 'constitution', dex: 'agility', int: 'intellect', wis: 'perception', cha: 'charm' };
const FROM_ABILITY_1: Record<string, string> = { str: 'body', con: 'body', dex: 'agility', int: 'intellect', wis: 'perception', cha: 'charm' };
/** 难度修正和 DC 互相换算（写剧本 skill 的换算表）：+2 及以上 DC 5、+1 DC 10、0 DC 15、−1 DC 15、−2 DC 20、更难 DC 25。 */
const dcOf = (modifier: number) => (modifier >= 2 ? 5 : modifier === 1 ? 10 : modifier >= -1 ? 15 : modifier === -2 ? 20 : 25);
const modifierOf = (dc: number) => (dc <= 7 ? 2 : dc <= 12 ? 1 : dc <= 17 ? 0 : dc <= 22 ? -2 : -3);

/**
 * 换成 5E（V0.9.0）：线索的检定换成属性 + DC，加上建议等级、怪物、宝藏。身份的属性和专长留着（5E 模组里不用，编辑器里不显示），
 * 换回来时还在；换回来时检定反过来换。原来的敌人（enemies）、怪物、宝藏有内容的留着，检查会说哪里要改。
 */
function toFive(doc: Obj): Obj {
  const d: Obj = { ...doc, rules: '5e', level: typeof doc.level === 'number' ? doc.level : 1 };
  if (!Array.isArray(d.monsters)) d.monsters = [];
  if (!Array.isArray(d.treasure)) d.treasure = [];
  if (Array.isArray(d.enemies) && !d.enemies.length) delete d.enemies;
  return patch(
    d,
    'clues',
    mapItems(d.clues, (c) => {
      if (!isObj(c.check)) return c;
      const ability = typeof c.check.attribute === 'string' ? (ABILITY_OF[c.check.attribute] ?? 'wis') : 'wis';
      return { ...c, check: { ability, dc: dcOf(typeof c.check.modifier === 'number' ? c.check.modifier : 0) } };
    }),
  );
}

/** 换回第一版、第二版时身份的属性：原来的对得上就留着，对不上的换算过来（换算不了的给一套默认的）。 */
function attributesFor(rules: 1 | 2, v: unknown): Record<string, number> {
  if (rules === 1) return valid1(v) ? { ...v } : toRules1(v);
  return isObj(v) && !roleAttributes2Problem(v) ? { ...(v as Record<string, number>) } : toRules2(v);
}

function fromFive(doc: Obj, rules: 1 | 2): Obj {
  let d: Obj = { ...doc, rules };
  for (const k of ['level', 'monsters', 'treasure'] as const) if (k === 'level' || (Array.isArray(d[k]) && !(d[k] as unknown[]).length)) delete d[k];
  if (doc.category !== 'dungeon') {
    d = patch(
      d,
      'roles',
      mapItems(d.roles, (r) => ({
        ...r,
        attributes: attributesFor(rules, r.attributes),
        specialties: Array.isArray(r.specialties) ? r.specialties : ['', ''],
        appearance: typeof r.appearance === 'string' ? r.appearance : '',
      })),
    );
  }
  const names = rules === 2 ? FROM_ABILITY_2 : FROM_ABILITY_1;
  return patch(
    d,
    'clues',
    mapItems(d.clues, (c) => {
      if (!isObj(c.check)) return c;
      const skill = typeof c.check.skill === 'string' ? (SKILL_ABILITY as Record<string, string>)[c.check.skill as Skill] : undefined;
      const ability = typeof c.check.ability === 'string' ? c.check.ability : (skill ?? 'wis');
      const modifier = modifierOf(typeof c.check.dc === 'number' ? c.check.dc : 15);
      const [min, max] = rules === 2 ? [MODIFIER2_MIN, MODIFIER2_MAX] : [MODIFIER_MIN, MODIFIER_MAX];
      return { ...c, check: { attribute: names[ability] ?? 'perception', modifier: clamp(modifier, min, max) } };
    }),
  );
}

/**
 * 换规则：身份的属性按新规则换算（擅长的还是高），线索的检定换成新规则的属性、修正限在新规则的范围里。
 * 地下城的身份没有属性，不动。5E 见 toFive、fromFive。
 */
export function switchRules(doc: Obj, rules: 1 | 2 | '5e'): Obj {
  if (rules === '5e') return doc.rules === '5e' ? doc : toFive(doc);
  if (doc.rules === '5e') return fromFive(doc, rules);
  let d: Obj = { ...doc, rules };
  if (doc.category !== 'dungeon') {
    d = patch(
      d,
      'roles',
      mapItems(d.roles, (r) => ({ ...r, attributes: rules === 2 ? toRules2(r.attributes) : toRules1(r.attributes) })),
    );
  }
  const map = rules === 2 ? CHECK_TO_2 : CHECK_TO_1;
  const [min, max] = rules === 2 ? [MODIFIER2_MIN, MODIFIER2_MAX] : [MODIFIER_MIN, MODIFIER_MAX];
  return patch(
    d,
    'clues',
    mapItems(d.clues, (c) => {
      if (!isObj(c.check)) return c;
      const attribute = typeof c.check.attribute === 'string' ? (map[c.check.attribute] ?? c.check.attribute) : c.check.attribute;
      const modifier = typeof c.check.modifier === 'number' ? clamp(c.check.modifier, min, max) : c.check.modifier;
      return { ...c, check: { ...c.check, attribute, modifier } };
    }),
  );
}

/** 这种规则下检定能用的属性。 */
export const checkAttributes = (mode: RoleMode): string[] => (mode === 'rules1' ? [...ATTRIBUTE_KEYS] : [...ATTRIBUTE2_KEYS]);

// ---------- 新加的一项 ----------

const firstKey = (list: unknown): string => {
  const first = asList(list).find((x) => isObj(x) && typeof x.key === 'string' && x.key);
  return isObj(first) ? String(first.key) : '';
};

export function newRole(doc: Obj): Obj {
  const base = { key: nextKey(doc.roles, 'role'), name: '', public: '', secret: '', goal: '', startLocation: firstKey(doc.locations) };
  const mode = roleMode(doc);
  if (mode === 'dungeon' || mode === 'five') return { ...base, appearance: '' };
  return { ...base, attributes: mode === 'rules2' ? defaultAttributes2() : defaultAttributes1(), specialties: ['', ''], appearance: '' };
}

/**
 * 新地点。别的地点都摆好了地图上的位置的，新的也给一个（离别的地点最远的空地方），免得只有它没位置。
 */
export function newLocation(doc: Obj): Obj {
  const base = { key: nextKey(doc.locations, 'place'), name: '', description: '', exits: [], features: [] };
  const placed = asList(doc.locations).filter(isObj);
  if (!placed.length || !placed.every((l) => typeof l.x === 'number' && typeof l.y === 'number')) return base;
  let best = { x: 50, y: 50, gap: -1 };
  for (let x = 10; x <= 90; x += 10) {
    for (let y = 10; y <= 90; y += 10) {
      const gap = Math.min(...placed.map((l) => Math.hypot((l.x as number) - x, (l.y as number) - y)));
      if (gap > best.gap) best = { x, y, gap };
    }
  }
  return { ...base, x: best.x, y: best.y };
}

export const newNpc = (doc: Obj): Obj => ({
  key: nextKey(doc.npcs, 'npc'),
  name: '',
  identity: '',
  personality: '',
  knows: [],
  wants: '',
  speech: '',
  location: firstKey(doc.locations) || null,
  attitude: '',
});

export const newPoint = (doc: Obj): Obj => ({ key: nextKey(getIn(doc, ['truth', 'points']), 'point'), text: '' });

export const newClue = (doc: Obj): Obj => ({
  key: nextKey(doc.clues, 'clue'),
  title: '',
  content: '',
  location: firstKey(doc.locations),
  points: [],
  how: '',
  check: null,
  core: false,
});

export function newEvent(doc: Obj): Obj {
  const start = isObj(doc.start) ? doc.start : {};
  return {
    key: nextKey(doc.timeline, 'event'),
    at: { day: typeof start.day === 'number' ? start.day : 1, time: typeof start.time === 'string' ? start.time : '20:00' },
    event: '',
    ifIgnored: '',
  };
}

export const newEnding = (doc: Obj): Obj => ({
  key: nextKey(doc.endings, 'ending'),
  title: '',
  condition: '',
  summary: '',
  ...(doc.category === 'dungeon' ? { result: 'clear' } : {}),
});

// ---------- 检查出的问题在页面上的哪里 ----------

/**
 * 点了一条问题，按顺序找这些 id 的元素（最具体的在前）：roles[2].name → ed-roles-2-name、ed-roles-2、ed-roles，
 * 最后是这个分区。truth.points「key」按标识找到是第几条。
 */
export function problemElementIds(doc: unknown, problem: Pick<ProblemTarget, 'path' | 'key' | 'section'>): string[] {
  let path = problem.path;
  if (problem.key !== null) {
    const points = asList(getIn(doc, ['truth', 'points']));
    const i = points.findIndex((p) => isObj(p) && p.key === problem.key);
    path = i >= 0 ? `truth.points[${i}]` : 'truth.points';
  }
  const parts = path
    .replace(/「[^」]*」/g, '')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
  const ids: string[] = [];
  for (let n = parts.length; n > 0; n--) ids.push(`ed-${parts.slice(0, n).join('-')}`);
  ids.push(`ed-section-${problem.section}`);
  return ids;
}

/**
 * JSON 分区里大概的位置：按路径一层层找键名（"boss": 这样的），遇到第几项（[2]）就停在那一层。
 * 地下城、敌人这些表单里没有的，点了问题就在 JSON 里选中这个键名。
 */
export function locateInJson(source: string, path: string): { start: number; end: number } | null {
  let from = 0;
  let found: { start: number; end: number } | null = null;
  for (const segment of path.split('.')) {
    const name = /^[A-Za-z][\w-]*/.exec(segment)?.[0];
    if (!name) break;
    const re = new RegExp(`"${name}"\\s*:`, 'g');
    re.lastIndex = from;
    const m = re.exec(source);
    if (!m) break;
    found = { start: m.index, end: m.index + name.length + 2 };
    from = found.end;
    if (segment !== name) break;
  }
  return found;
}

/** 写成 UTF-8 有多少字节（请求体的上限按字节算；中文一个字 3 字节）。 */
export function utf8Bytes(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
      n += 4;
      i++;
    } else n += 3;
  }
  return n;
}

// ---------- 文件 ----------

/** 导出的文件名：剧本标题（去掉文件名里不能用的字符）。 */
export function fileName(title: string): string {
  const name = title
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${[...(name || '未命名剧本')].slice(0, 60).join('')}.json`;
}

/** 读一个剧本文件：要是 JSON，整份是一个对象。 */
export async function readScenarioFile(file: File): Promise<Obj> {
  if (file.size > 2 * 1024 * 1024) throw new Error('文件太大了，不像是剧本');
  let data: unknown;
  try {
    data = JSON.parse((await file.text()).replace(/^﻿/, ''));
  } catch {
    throw new Error('这个文件不是 JSON 格式的剧本');
  }
  if (!isObj(data)) throw new Error('这个文件不是剧本：整份剧本要是一个 JSON 对象 { … }');
  return data;
}

/** JSON.parse 的报错换成「第几行第几列附近」（各家浏览器的说法不一样）。 */
export function jsonErrorMessage(err: unknown, source: string): string {
  const message = err instanceof Error ? err.message : '';
  const lineCol = /line (\d+) column (\d+)/i.exec(message);
  if (lineCol) return `JSON 格式不对（第 ${lineCol[1]} 行第 ${lineCol[2]} 列附近）`;
  const pos = /position (\d+)/i.exec(message);
  if (pos) {
    const before = source.slice(0, Number(pos[1])).split('\n');
    return `JSON 格式不对（第 ${before.length} 行第 ${before[before.length - 1].length + 1} 列附近）`;
  }
  if (!source.trim()) return 'JSON 是空的';
  return 'JSON 格式不对';
}

/** 列表页「导入」读好的剧本，交给新开的编辑页（站内跳过去，不经过服务器）。 */
let imported: Obj | null = null;

export function stashImported(doc: Obj) {
  imported = doc;
}

export function takeImported(): Obj | null {
  const doc = imported;
  imported = null;
  return doc;
}

// ---------- 5E 模组的怪物、宝藏（V0.9.0） ----------

export const newMonster5e = (doc: Obj): Obj => ({ key: nextKey(doc.monsters, 'monster'), name: '', description: '', monster: '' });

export const newTreasure5e = (doc: Obj): Obj => ({ key: nextKey(doc.treasure, 'treasure'), location: firstKey(doc.locations), how: '', items: [], gold: 0 });
