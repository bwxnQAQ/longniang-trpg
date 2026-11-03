import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { gameMinutes, validateScenario } from '../server/game/scenario';
import { DUNGEON_SCHEMA, OUTLINE_SCHEMA, SCENARIO_SCHEMA, SCENARIO_WRITER_SYSTEM } from '../server/game/scenario-prompts';
import { strictIssues } from '../server/game/studio';
import { validRoleAttributes2 } from '../shared/rules2';
import { BUILTIN_SCENARIO_FILES, RETIRED_SCENARIO_FILES } from '../scripts/builtin-scenarios.mjs';

const dir = path.join(import.meta.dirname, '..', 'scenarios');
/** 测试剧本《雾港旅店》：阶段 1 写来测试的，不随网站发布，只给自动测试和测试数据用。 */
const file = path.join(import.meta.dirname, 'fixtures', 'fog-harbor-inn.json');
const original = JSON.parse(fs.readFileSync(file, 'utf8'));
const fresh = () => structuredClone(original);

test('测试剧本《雾港旅店》通过检查，没有错误也没有提醒', () => {
  const { scenario, errors, warnings } = validateScenario(original);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.equal(scenario?.title, '雾港旅店');
  assert.equal(scenario?.roles.length, 6);
  assert.equal(scenario?.players.max, 6);
});

test('引用了不存在的地点、真相时报错', () => {
  const s = fresh();
  s.clues[0].location = 'celler';
  s.clues[1].points = ['murder', 'motive'];
  s.npcs[0].location = 'nowhere';
  const { scenario, errors } = validateScenario(s);
  assert.equal(scenario, null);
  assert.ok(errors.some((e) => e.startsWith('clues[0].location') && e.includes('celler')));
  assert.ok(errors.some((e) => e.startsWith('clues[1].points') && e.includes('motive')));
  assert.ok(errors.some((e) => e.startsWith('npcs[0].location')));
});

test('key 重复或格式不对时报错', () => {
  const s = fresh();
  s.clues[1].key = s.clues[0].key;
  s.locations[0].key = 'Lobby Hall';
  const { errors } = validateScenario(s);
  assert.ok(errors.some((e) => e.includes('重复')));
  assert.ok(errors.some((e) => e.startsWith('locations[0].key')));
});

test('身份比最多人数少时报错', () => {
  const s = fresh();
  s.roles = s.roles.slice(0, 4);
  s.players.max = 5;
  const { errors } = validateScenario(s);
  assert.ok(errors.some((e) => e.startsWith('roles') && e.includes('至少要准备5个身份')));
});

test('有真相没有任何线索指向时报错；只有一条线索时提醒', () => {
  const s = fresh();
  s.truth.points.push({ key: 'motive', text: '周墨想用卖暗账的钱给母亲治病。' });
  let r = validateScenario(s);
  assert.ok(r.errors.some((e) => e.includes('「motive」') && e.includes('不可能查出来')));

  s.clues[0].points.push('motive');
  r = validateScenario(s);
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => w.includes('「motive」') && w.includes('只有一条线索')));
});

test('关键线索所在的地点走不到时报错；单向出口只提醒', () => {
  const s = fresh();
  // 把当铺和街道之间的路断掉
  s.locations.find((l: any) => l.key === 'street').exits = s.locations
    .find((l: any) => l.key === 'street')
    .exits.filter((e: any) => e.to !== 'pawnshop');
  const { errors, warnings } = validateScenario(s);
  assert.ok(errors.some((e) => e.includes('钱记当铺') && e.includes('pawn-envelope')));
  assert.ok(warnings.some((w) => w.includes('「pawnshop」去「street」')));
});

test('格式完全不对的东西也能给出明白的错误，不会崩', () => {
  assert.ok(validateScenario(null).errors.length > 0);
  assert.ok(validateScenario([]).errors.length > 0);
  const { errors } = validateScenario({ format: 'longniang-trpg/scenario@1', title: 123 });
  assert.ok(errors.some((e) => e.includes('title') && e.includes('文字')));
});

test('规则第二版的身份属性：按身份的实际情况分，每项 -2～+3、加起来正好 4；不对的说清楚哪里不对', () => {
  const qingxi = () => JSON.parse(fs.readFileSync(path.join(dir, 'qingxi-lantern-night.json'), 'utf8'));
  const errorsWith = (attributes: unknown) => {
    const s = qingxi();
    s.roles[0].attributes = attributes;
    return validateScenario(s).errors;
  };
  // 不再非得把 +2、+1、+1、+1、0、0、-1 各用一次：偏科的分法也行，开局照这套属性算生命值、精神值
  const bookworm = { strength: -2, constitution: 0, agility: 0, intellect: 3, perception: 3, will: 0, charm: 0 };
  const s = qingxi();
  s.roles[0].attributes = bookworm;
  const ok = validateScenario(s);
  assert.deepEqual(ok.errors, []);
  assert.deepEqual(ok.scenario?.roles[0].attributes, bookworm);
  assert.ok(validRoleAttributes2(bookworm));
  assert.deepEqual(errorsWith({ strength: 1, constitution: 1, agility: 1, intellect: 1, perception: 0, will: 0, charm: 0 }), [], '没有 +2 也行');

  assert.deepEqual(errorsWith({ ...bookworm, charm: 1 }), ['roles[0].attributes：七项属性加起来要正好是 4，现在是 5']);
  assert.deepEqual(errorsWith({ ...bookworm, charm: -1 }), ['roles[0].attributes：七项属性加起来要正好是 4，现在是 3']);
  assert.deepEqual(errorsWith({ ...bookworm, intellect: 4, perception: 2 }), ['roles[0].attributes：intellect（智识）是 +4，每项要在 -2～+3 之间'], '加起来是 4 也不行');
  assert.deepEqual(errorsWith({ ...bookworm, strength: -3, charm: 1 }), ['roles[0].attributes：strength（力量）是 -3，每项要在 -2～+3 之间']);
  const { will: _will, ...noWill } = bookworm;
  assert.deepEqual(errorsWith(noWill), ['roles[0].attributes：缺了 will（意志）：七项属性都要写']);
  assert.deepEqual(errorsWith({ ...bookworm, will: -0.5, charm: 0.5 }), ['roles[0].attributes：will（意志）要写整数']);
  assert.match(errorsWith(undefined).join('\n'), /^roles\[0\]\.attributes：要写七项属性（strength、.*），每项 -2～\+3，加起来正好 4$/);
  for (const bad of [{ ...bookworm, charm: 1 }, { ...bookworm, intellect: 4, perception: 2 }, noWill]) assert.equal(validRoleAttributes2(bad), false);

  // 地下城的身份照旧不看属性（玩家带自己的角色卡）
  const mine = JSON.parse(fs.readFileSync(path.join(dir, 'dungeon-abandoned-mine.json'), 'utf8'));
  mine.roles[0].attributes = { strength: 9 };
  assert.deepEqual(validateScenario(mine).errors, []);

  // 生成、转换剧本时也这样告诉 AI
  assert.match(SCENARIO_WRITER_SYSTEM, /attributes 七个属性加起来正好 4，每项 -2～\+3，按这个身份的实际情况分——擅长的高、不擅长的低，几个身份之间大体平衡/);
  assert.doesNotMatch(SCENARIO_WRITER_SYSTEM, /各用一次/);
  assert.match((SCENARIO_SCHEMA as Schema).properties.roles.items.properties.attributes.description, /加起来正好 4，每项 -2～3/);
});

test('游戏时间换算成分钟', () => {
  assert.equal(gameMinutes({ day: 1, time: '00:00' }), 0);
  assert.equal(gameMinutes({ day: 2, time: '08:30' }), 1440 + 510);
});

// ---------- 生成剧本时要求 AI 按这个格式输出 ----------


type Schema = Record<string, any>;

/** 按 schema 检查一份数据（只支持这里用到的关键字），返回不符合的地方。 */
function check(schema: Schema, value: unknown, at = '$'): string[] {
  if (schema.anyOf) return schema.anyOf.some((s: Schema) => check(s, value, at).length === 0) ? [] : [`${at}：哪一种都不符合`];
  if (schema.enum && !schema.enum.includes(value)) return [`${at}：不在 ${schema.enum.join('/')} 里`];
  const types: string[] = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isInteger(value) ? 'integer' : typeof value;
  if (!types.includes(actual) && !(actual === 'integer' && types.includes('number'))) return [`${at}：应该是 ${types.join('/')}，实际是 ${actual}`];
  if (actual === 'array') return (value as unknown[]).flatMap((v, i) => check(schema.items, v, `${at}[${i}]`));
  if (actual === 'object') {
    const o = value as Record<string, unknown>;
    const errors = (schema.required as string[]).filter((k) => !(k in o)).map((k) => `${at}.${k}：缺了`);
    for (const [k, v] of Object.entries(o)) {
      if (!schema.properties[k]) errors.push(`${at}.${k}：多出来的字段`);
      else errors.push(...check(schema.properties[k], v, `${at}.${k}`));
    }
    return errors;
  }
  return [];
}

/** 结构化输出的限制：不支持长度、个数、数值范围；对象都要 additionalProperties: false；可选字段、联合类型有上限。 */
function limits(schema: Schema) {
  let unions = 0;
  let optional = 0;
  const forbidden: string[] = [];
  const walk = (s: Schema, at: string) => {
    for (const k of ['minLength', 'maxLength', 'minimum', 'maximum', 'maxItems', 'pattern', 'multipleOf']) if (k in s) forbidden.push(`${at}.${k}`);
    if ('minItems' in s && s.minItems > 1) forbidden.push(`${at}.minItems`);
    if (s.anyOf || Array.isArray(s.type)) unions++;
    if (s.type === 'object') {
      if (s.additionalProperties !== false) forbidden.push(`${at}.additionalProperties`);
      optional += Object.keys(s.properties).filter((k) => !s.required.includes(k)).length;
      for (const [k, v] of Object.entries(s.properties)) walk(v as Schema, `${at}.${k}`);
    }
    if (s.items) walk(s.items, `${at}[]`);
    for (const option of s.anyOf ?? []) walk(option, at);
  };
  walk(schema, '$');
  return { unions, optional, forbidden };
}

test('生成剧本的输出格式：自带的《青溪灯夜》（规则第二版）正好符合；没用结构化输出不支持的写法', () => {
  const qingxi = JSON.parse(fs.readFileSync(path.join(dir, 'qingxi-lantern-night.json'), 'utf8'));
  const { category: _c, author: _a, ...written } = qingxi;
  assert.deepEqual(check(SCENARIO_SCHEMA, { enemies: [], ...written }), []);
  for (const schema of [SCENARIO_SCHEMA, OUTLINE_SCHEMA, DUNGEON_SCHEMA]) {
    const { unions, optional, forbidden } = limits(schema);
    assert.deepEqual(forbidden, []);
    assert.equal(optional, 0, '所有字段都必填');
    assert.ok(unions <= 16);
  }
  // 少一个字段、多一个字段、类型不对都查得出来
  const s = fresh();
  delete s.title;
  s.extra = 1;
  s.clues[0].check = { attribute: 'luck', modifier: 0 };
  const errors = check(SCENARIO_SCHEMA, s);
  assert.ok(errors.includes('$.title：缺了'));
  assert.ok(errors.includes('$.extra：多出来的字段'));
  assert.ok(errors.some((e) => e.startsWith('$.clues[0].check')));
});

// ---------- scenarios 文件夹里自带的剧本 ----------

/** 自带的剧本（V0.7.0）：五个分区各两个，再加五个地下城，都用规则第二版；V0.9.0 加了一个 5E 入门模组（冒险分区）。 */
const BUILTIN_BY_CATEGORY: Record<string, string[]> = {
  puzzle: ['qingxi-lantern-night.json', 'opera-house-last-night.json'],
  horror: ['yakou-fifth-man.json', 'paper-effigy-shop.json'],
  combat: ['border-town-siege.json', 'heifeng-ridge-escort.json'],
  adventure: ['cliff-herb-moon.json', 'desert-camel-bells.json', 'mistridge-silent-bell.json'],
  social: ['mengzhu-ling.json', 'teahouse-truce.json'],
  dungeon: ['dungeon-abandoned-mine.json', 'dungeon-sunken-fort.json', 'dungeon-foxfire-manor.json', 'dungeon-general-tomb.json', 'dungeon-demon-tower.json'],
};

/** 最早的三个剧本：人数、天数、规模一个比一个大。 */
const FIRST_THREE = [
  { file: 'qingxi-lantern-night.json', title: '青溪灯夜', players: { min: 1, max: 2 }, days: 1, relation: 'coop', stress: false },
  { file: 'yakou-fifth-man.json', title: '垭口的第五个人', players: { min: 1, max: 4 }, days: 3, relation: 'secrets', stress: true },
  { file: 'mengzhu-ling.json', title: '盟主令', players: { min: 2, max: 6 }, days: 7, relation: 'versus', stress: false },
];

test('自带的剧本是写好的十六个：五个分区各两个、五个地下城、一个 5E 入门模组（测试剧本《雾港旅店》不随网站发布）；5E 以外的都用规则第二版，通过检查：没有错误、没有提醒，也满足 AI 生成剧本的更严要求和输出格式', () => {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  assert.deepEqual(files, Object.values(BUILTIN_BY_CATEGORY).flat().sort());
  assert.deepEqual([...BUILTIN_SCENARIO_FILES].sort(), files, '升级时认得出这些是自带的');
  assert.deepEqual(RETIRED_SCENARIO_FILES, ['fog-harbor-inn.json'], '从旧版本升级时不把《雾港旅店》搬过来');
  const levels: number[] = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const { scenario, errors, warnings } = validateScenario(data);
    assert.deepEqual(errors, [], f);
    assert.deepEqual(warnings, [], f);
    assert.ok(scenario, f);
    if (data.rules === '5e') {
      // 5E 入门模组（V0.9.0）：1 级，三到五个人，有怪物和宝藏；AI 生成剧本不写 5E，不对输出格式
      assert.equal(f, 'mistridge-silent-bell.json');
      assert.equal(scenario.level, 1);
      assert.deepEqual(scenario.players, { min: 3, max: 5 });
      assert.ok(scenario.monsters!.length >= 3 && scenario.treasure!.length >= 2, f);
      assert.deepEqual(strictIssues(data), [], f);
      continue;
    }
    assert.equal(data.rules, 2, `${f} 用规则第二版`);
    // 分区、作者是程序填的（生成剧本时按房主选的分区，投稿时记作者），不在 AI 的输出格式里；
    // 敌人的 tweak（微调数值）是手写剧本才用的，AI 生成的不写
    const { category, author, enemies, ...rest } = data;
    const written = { ...rest, enemies: ((enemies ?? []) as Record<string, unknown>[]).map(({ tweak: _tweak, ...e }) => e) };
    assert.ok(category && author === '龙娘跑团' && data.intro, `${f} 写了分区、简介，作者是龙娘跑团`);
    assert.ok(BUILTIN_BY_CATEGORY[category]?.includes(f), `${f} 在「${category}」分区`);
    if (category === 'dungeon') {
      // 地下城的输出格式里真相分支的线索、NPC 是列表，程序读进来以后换成剧本文件的写法，所以这里不对输出格式
      assert.ok(scenario.dungeon, f);
      levels.push(scenario.dungeon.level);
    } else {
      assert.deepEqual(check(SCENARIO_SCHEMA, written), [], `${f} 的字段和生成剧本的输出格式一致`);
    }
    assert.deepEqual(strictIssues(data), [], `${f} 每条真相至少三条线索、分散在两个以上地点，时间线不超出天数`);
  }
  assert.equal(new Set(levels).size, 5, '五个地下城的难度各不相同');
});

test('最早的三个剧本：人数、天数、玩家关系各不相同，规模一个比一个大', () => {
  let last = { locations: 0, clues: 0, npcs: 0 };
  for (const b of FIRST_THREE) {
    const { scenario } = validateScenario(JSON.parse(fs.readFileSync(path.join(dir, b.file), 'utf8')));
    assert.ok(scenario);
    assert.equal(scenario.title, b.title);
    assert.deepEqual(scenario.players, b.players);
    assert.equal(scenario.expectedDays, b.days);
    assert.equal(scenario.relation, b.relation);
    assert.equal(scenario.stress, b.stress);
    assert.ok(scenario.roles.length >= b.players.max);
    assert.ok(scenario.locations.length > last.locations && scenario.clues.length > last.clues, `${b.title} 比上一个大`);
    last = { locations: scenario.locations.length, clues: scenario.clues.length, npcs: scenario.npcs.length };
    // 时间线事件都在开场之后（不超出预计天数，上一个测试里查过了）
    const start = gameMinutes(scenario.start);
    for (const ev of scenario.timeline) assert.ok(gameMinutes(ev.at) >= start, `${b.title} ${ev.key}`);
  }
});
