import { memo } from 'react';
import { RELATION_LABEL, SCENARIO_CATEGORIES } from '../../../shared/game';
import { ATTRIBUTE_NAME, ATTRIBUTES, MODIFIER_MAX, MODIFIER_MIN, SPECIALTY_COUNT } from '../../../shared/rules';
import { ATTRIBUTE2_NAME, ATTRIBUTES2, MODIFIER2_MAX, MODIFIER2_MIN, ROLE2_MAX, ROLE2_MIN, ROLE2_TOTAL } from '../../../shared/rules2';
import { ABILITIES, ABILITY_NAME, SKILL_ABILITY, SKILL_KEYS, SKILL_NAME } from '../../../shared/5e/core';
import { ITEM_INDEX } from '../../../shared/5e/item-index';
import { MONSTER_INDEX } from '../../../shared/5e/monster-index';
import { CR_LABEL } from '../../../shared/5e/types';
import { sign } from '../format';
import {
  checkAttributes,
  fieldId,
  getIn,
  isObj,
  listAdd,
  newClue,
  newEnding,
  newEvent,
  newLocation,
  newMonster5e,
  newNpc,
  newTreasure5e,
  newPoint,
  newRole,
  roleMode,
  setIn,
  switchRules,
  text,
  type Obj,
  type Path,
  type RoleMode,
} from './doc';
import {
  BadShape,
  CheckField,
  ItemCard,
  ItemList,
  KeyField,
  NumberField,
  NumberInput,
  RowTools,
  SelectField,
  SelectInput,
  StringListField,
  TextField,
  TimeField,
  useOps,
  type Option,
} from './fields';

// 剧本编辑器的各个分区。字段名照 docs/scenario-format.md 里的意思起中文名；说明文字不写（规则页、向导里有）。
// 列表里的每一项是单独的组件（memo）：改一个身份时，别的身份不用重画。

const range = (min: number, max: number): Option[] => Array.from({ length: max - min + 1 }, (_, i) => ({ value: min + i, label: sign(min + i) }));
const PEOPLE: Option[] = Array.from({ length: 6 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
const CATEGORY_OPTIONS: Option[] = [{ value: null, label: '不选' }, ...SCENARIO_CATEGORIES.map((c) => ({ value: c.key, label: c.name }))];
const RULES_OPTIONS: Option[] = [
  { value: 1, label: '第一版（五项属性）' },
  { value: 2, label: '第二版（七项属性）' },
  { value: '5e', label: '5E（兼容第五版）' },
];
const LEVEL_OPTIONS: Option[] = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} 级` }));
/** 5E 的检定：技能（或者不带技能的属性）、DC。 */
const SKILL5E_OPTIONS: Option[] = [
  { value: null, label: '不用检定' },
  ...SKILL_KEYS.map((k) => ({ value: `skill:${k}`, label: `${SKILL_NAME[k]}（${ABILITY_NAME[SKILL_ABILITY[k]]}）` })),
  ...ABILITIES.map((a) => ({ value: `ability:${a}`, label: `${ABILITY_NAME[a]}（不带技能）` })),
];
const DC_OPTIONS: Option[] = [5, 10, 12, 15, 18, 20, 25, 30].map((n) => ({ value: n, label: `DC ${n}` }));
const RELATION_OPTIONS: Option[] = Object.entries(RELATION_LABEL).map(([value, label]) => ({ value, label }));
const RESULT_OPTIONS: Option[] = [
  { value: 'clear', label: '通关' },
  { value: 'escape', label: '活着逃出来' },
  { value: 'fail', label: '失败' },
];
const NO_PLACE: Option = { value: '', label: '（选一个地点）' };

/** 列表里一项的标题：「身份 2 · 上海来的记者」。 */
const titleOf = (what: string, index: number, name: unknown) => `${what} ${index + 1}${text(name).trim() ? ` · ${text(name).trim()}` : ''}`;

// ---------- 基本信息 ----------

export function BasicSection({ doc }: { doc: Obj }) {
  const ops = useOps();
  const opening = isObj(doc.opening) ? doc.opening : {};
  const safety = isObj(doc.safety) ? doc.safety : {};
  const players = isObj(doc.players) ? doc.players : {};
  const start = isObj(doc.start) ? doc.start : {};
  const dungeon = doc.category === 'dungeon';
  const rules = doc.rules === undefined || doc.rules === null ? 1 : doc.rules;

  // 地下城要用规则第二版：选了地下城顺便换过去
  const pickCategory = (value: unknown) =>
    ops.replace((d) => {
      const next = { ...d, category: value };
      return value === 'dungeon' && d.rules !== 2 ? switchRules(next, 2) : next;
    });
  const pickRules = (value: unknown) => ops.replace((d) => (value === 1 || value === 2 || value === '5e' ? switchRules(d, value) : d));

  return (
    <>
      <div className="ed-grid">
        <TextField path={['title']} value={doc.title} label="标题" />
        <SelectField path={['category']} value={doc.category} label="分区" options={CATEGORY_OPTIONS} onPick={pickCategory} />
        <TextField path={['genre']} value={doc.genre} label="题材" />
        <TextField path={['author']} value={doc.author} label="作者" />
      </div>
      <TextField path={['tone']} value={doc.tone} label="基调" />
      <TextField path={['intro']} value={doc.intro} label="简介" rows={3} />

      <div className="ed-grid ed-grid-4">
        <SelectField path={['rules']} value={rules} label="规则" options={RULES_OPTIONS} onPick={pickRules} disabled={dungeon && rules === 2} />
        <fieldset className="field ed-field" id={fieldId(['players'])}>
          <legend>人数</legend>
          <span className="ed-inline">
            <SelectInput path={['players', 'min']} value={players.min} options={PEOPLE} label="最少几人" />
            <span aria-hidden="true">～</span>
            <SelectInput path={['players', 'max']} value={players.max} options={PEOPLE} label="最多几人" />
          </span>
        </fieldset>
        <NumberField path={['expectedDays']} value={doc.expectedDays} label="预计天数" min={1} max={30} />
        <SelectField path={['relation']} value={doc.relation} label="玩家关系" options={RELATION_OPTIONS} />
      </div>
      {rules === '5e' && (
        <div className="ed-grid ed-grid-4">
          <SelectField path={['level']} value={doc.level ?? 1} label="建议等级" options={LEVEL_OPTIONS} />
        </div>
      )}
      <CheckField path={['stress']} value={doc.stress} label="用心智规则" />

      <h3 className="ed-subhead">开场</h3>
      <div className="ed-grid ed-grid-start">
        <TextField path={['start', 'label']} value={start.label} label="开场时间" />
        <NumberField path={['start', 'day']} value={start.day} label="第几天" min={1} max={365} />
        <TimeField path={['start', 'time']} value={start.time} label="几点" />
      </div>
      {doc.opening !== undefined && !isObj(doc.opening) ? (
        <BadShape what="开场" />
      ) : (
        <>
          <TextField path={['opening', 'background']} value={opening.background} label="世界背景" rows={4} />
          <TextField path={['opening', 'situation']} value={opening.situation} label="开场情境" rows={6} />
          <StringListField path={['opening', 'known']} value={opening.known} label="大家都知道的事" rows={1} />
        </>
      )}
      {doc.safety !== undefined && !isObj(doc.safety) ? <BadShape what="雷点" /> : <StringListField path={['safety', 'avoid']} value={safety.avoid} label="雷点" />}
    </>
  );
}

// ---------- 身份 ----------

export function RolesSection({ doc, locations }: { doc: Obj; locations: Option[] }) {
  const ops = useOps();
  const mode = roleMode(doc);
  return (
    <ItemList
      path={['roles']}
      value={doc.roles}
      what="身份"
      addLabel="添加身份"
      onAdd={() => ops.replace((d) => setIn(d, ['roles'], listAdd(d.roles, newRole(d))) as Obj)}
      render={(item, index, count) => <RoleItem item={item} index={index} count={count} mode={mode} locations={locations} />}
    />
  );
}

const RoleItem = memo(function RoleItem({ item, index, count, mode, locations }: { item: Obj; index: number; count: number; mode: RoleMode; locations: Option[] }) {
  const path: Path = ['roles', index];
  return (
    <ItemCard listPath={['roles']} index={index} count={count} title={titleOf('身份', index, item.name)} name={text(item.name) || `身份 ${index + 1}`}>
      <div className="ed-grid">
        <KeyField kind="roles" index={index} value={item.key} path={[...path, 'key']} />
        <TextField path={[...path, 'name']} value={item.name} label="身份名" />
      </div>
      <TextField path={[...path, 'public']} value={item.public} label="大家知道的" rows={2} />
      <TextField path={[...path, 'secret']} value={item.secret} label="秘密" rows={3} />
      <TextField path={[...path, 'goal']} value={item.goal} label="目标" rows={2} />
      <SelectField path={[...path, 'startLocation']} value={item.startLocation} label="开局地点" options={[NO_PLACE, ...locations]} />
      {(mode === 'rules1' || mode === 'rules2') && <Attributes path={[...path, 'attributes']} value={item.attributes} mode={mode} />}
      {(mode === 'rules1' || mode === 'rules2') && <Specialties path={[...path, 'specialties']} value={item.specialties} />}
      <TextField path={[...path, 'appearance']} value={item.appearance} label="外貌" rows={2} />
    </ItemCard>
  );
});

/** 第二版七项（每项 −2～+3，加起来 4），第一版五项（+2、+1、+1、0、−1 各用一次）。 */
function Attributes({ path, value, mode }: { path: Path; value: unknown; mode: 'rules1' | 'rules2' }) {
  const attrs = isObj(value) ? value : {};
  const list = mode === 'rules2' ? ATTRIBUTES2 : ATTRIBUTES;
  const options = mode === 'rules2' ? range(ROLE2_MIN, ROLE2_MAX) : range(-1, 2);
  const sum = list.reduce((s, a) => s + (typeof attrs[a.key] === 'number' ? (attrs[a.key] as number) : 0), 0);
  return (
    <fieldset className="field ed-field" id={fieldId(path)}>
      <legend>
        属性
        {mode === 'rules2' && <span className={sum === ROLE2_TOTAL ? 'ed-sum' : 'ed-sum is-off'}>合计 {sign(sum)}</span>}
      </legend>
      <div className="ed-attrs">
        {list.map((a) => (
          <label key={a.key} className="ed-attr" htmlFor={fieldId([...path, a.key])}>
            <span>{a.name}</span>
            <SelectInput path={[...path, a.key]} value={attrs[a.key]} options={options} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** 正好两个专长。 */
function Specialties({ path, value }: { path: Path; value: unknown }) {
  const ops = useOps();
  const list = Array.isArray(value) ? value : [];
  const put = (i: number, v: string) =>
    ops.edit(path, (old) => {
      const next = Array.isArray(old) ? [...old] : [];
      while (next.length < SPECIALTY_COUNT) next.push('');
      next[i] = v;
      return next;
    });
  return (
    <fieldset className="field ed-field" id={fieldId(path)}>
      <legend>专长</legend>
      <div className="ed-pair">
        {Array.from({ length: Math.max(SPECIALTY_COUNT, list.length) }, (_, i) => (
          <input key={i} id={fieldId([...path, i])} aria-label={`专长 ${i + 1}`} autoComplete="off" value={text(list[i])} onChange={(e) => put(i, e.target.value)} />
        ))}
      </div>
    </fieldset>
  );
}

// ---------- 地点 ----------

export function LocationsSection({ doc, locations }: { doc: Obj; locations: Option[] }) {
  const ops = useOps();
  return (
    <ItemList
      path={['locations']}
      value={doc.locations}
      what="地点"
      addLabel="添加地点"
      onAdd={() => ops.replace((d) => setIn(d, ['locations'], listAdd(d.locations, newLocation(d))) as Obj)}
      render={(item, index, count) => <LocationItem item={item} index={index} count={count} locations={locations} />}
    />
  );
}

const LocationItem = memo(function LocationItem({ item, index, count, locations }: { item: Obj; index: number; count: number; locations: Option[] }) {
  const path: Path = ['locations', index];
  return (
    <ItemCard listPath={['locations']} index={index} count={count} title={titleOf('地点', index, item.name)} name={text(item.name) || `地点 ${index + 1}`}>
      <div className="ed-grid">
        <KeyField kind="locations" index={index} value={item.key} path={[...path, 'key']} />
        <TextField path={[...path, 'name']} value={item.name} label="名字" />
      </div>
      <TextField path={[...path, 'description']} value={item.description} label="描述" rows={4} />
      <Exits path={[...path, 'exits']} value={item.exits} self={item.key} locations={locations} />
      <StringListField path={[...path, 'features']} value={item.features} label="可以调查的" rows={1} />
    </ItemCard>
  );
});

/** 出口：去哪个地点（下拉选），路上要几分钟。 */
function Exits({ path, value, self, locations }: { path: Path; value: unknown; self: unknown; locations: Option[] }) {
  const ops = useOps();
  const id = fieldId(path);
  if (value !== undefined && !Array.isArray(value)) return <BadShape id={id} what="出口" />;
  const list = value ?? [];
  const others = locations.filter((o) => o.value !== self);
  const add = () =>
    ops.edit(path, (old) => {
      const used = new Set((Array.isArray(old) ? old : []).map((e) => (isObj(e) ? e.to : undefined)));
      return listAdd(old, { to: others.find((o) => !used.has(o.value))?.value ?? '', minutes: 5 });
    });
  return (
    <fieldset className="field ed-field ed-exits" id={id}>
      <legend>出口</legend>
      {list.map((exit, i) => {
        const e = isObj(exit) ? exit : {};
        return (
          <div key={i} className="ed-exit" id={fieldId([...path, i])}>
            <SelectInput path={[...path, i, 'to']} value={e.to} options={[NO_PLACE, ...others]} label={`出口 ${i + 1} 去哪里`} />
            <span className="ed-minutes">
              <NumberInput path={[...path, i, 'minutes']} value={e.minutes} min={1} max={1440} label={`出口 ${i + 1} 路上要几分钟`} />
              <span aria-hidden="true">分钟</span>
            </span>
            <RowTools path={path} index={i} count={list.length} />
          </div>
        );
      })}
      <button type="button" className="btn btn-small btn-quiet ed-add" onClick={add}>
        添加出口
      </button>
    </fieldset>
  );
}

// ---------- NPC ----------

export function NpcsSection({ doc, locations }: { doc: Obj; locations: Option[] }) {
  const ops = useOps();
  return (
    <ItemList
      path={['npcs']}
      value={doc.npcs}
      what="NPC"
      addLabel="添加 NPC"
      onAdd={() => ops.replace((d) => setIn(d, ['npcs'], listAdd(d.npcs, newNpc(d))) as Obj)}
      render={(item, index, count) => <NpcItem item={item} index={index} count={count} locations={locations} />}
    />
  );
}

const NpcItem = memo(function NpcItem({ item, index, count, locations }: { item: Obj; index: number; count: number; locations: Option[] }) {
  const path: Path = ['npcs', index];
  return (
    <ItemCard listPath={['npcs']} index={index} count={count} title={titleOf('NPC', index, item.name)} name={text(item.name) || `NPC ${index + 1}`}>
      <div className="ed-grid">
        <KeyField kind="npcs" index={index} value={item.key} path={[...path, 'key']} />
        <TextField path={[...path, 'name']} value={item.name} label="名字" />
      </div>
      <div className="ed-grid">
        <TextField path={[...path, 'identity']} value={item.identity} label="身份" />
        <SelectField path={[...path, 'location']} value={item.location} label="平时在哪" options={[{ value: null, label: '不在任何地点' }, ...locations]} />
      </div>
      <TextField path={[...path, 'personality']} value={item.personality} label="性格" rows={2} />
      <StringListField path={[...path, 'knows']} value={item.knows} label="知道的事" rows={1} />
      <TextField path={[...path, 'wants']} value={item.wants} label="想要什么" rows={2} />
      <TextField path={[...path, 'speech']} value={item.speech} label="说话风格" rows={2} />
      <TextField path={[...path, 'attitude']} value={item.attitude} label="对玩家的态度" rows={2} />
    </ItemCard>
  );
});

// ---------- 真相 ----------

export function TruthSection({ doc }: { doc: Obj }) {
  const ops = useOps();
  if (doc.truth !== undefined && !isObj(doc.truth)) return <BadShape id={fieldId(['truth'])} what="真相" />;
  const truth = isObj(doc.truth) ? doc.truth : {};
  // 每条真相有几条线索指向它（最好两条以上）
  const pointed = new Map<unknown, number>();
  for (const c of Array.isArray(doc.clues) ? doc.clues : []) {
    if (isObj(c) && Array.isArray(c.points)) for (const p of new Set(c.points)) pointed.set(p, (pointed.get(p) ?? 0) + 1);
  }
  return (
    <>
      <TextField path={['truth', 'summary']} value={truth.summary} label="来龙去脉" rows={7} />
      <h3 className="ed-subhead">要点</h3>
      <ItemList
        path={['truth', 'points']}
        value={truth.points}
        what="要点"
        addLabel="添加要点"
        onAdd={() => ops.replace((d) => setIn(d, ['truth', 'points'], listAdd(getIn(d, ['truth', 'points']), newPoint(d))) as Obj)}
        render={(item, index, count) => <PointItem item={item} index={index} count={count} clues={pointed.get(item.key) ?? 0} />}
      />
    </>
  );
}

const PointItem = memo(function PointItem({ item, index, count, clues }: { item: Obj; index: number; count: number; clues: number }) {
  const path: Path = ['truth', 'points', index];
  return (
    <ItemCard listPath={['truth', 'points']} index={index} count={count} title={`要点 ${index + 1}`} name={`要点 ${index + 1}`}>
      <div className="ed-grid ed-grid-key">
        <KeyField kind="truth.points" index={index} value={item.key} path={[...path, 'key']} />
        <p className={clues >= 2 ? 'ed-count' : 'ed-count is-low'}>线索 ×{clues}</p>
      </div>
      <TextField path={[...path, 'text']} value={item.text} label="内容" rows={2} />
    </ItemCard>
  );
});

// ---------- 线索 ----------

export function CluesSection({ doc, locations, points }: { doc: Obj; locations: Option[]; points: Option[] }) {
  const ops = useOps();
  const mode = roleMode(doc);
  return (
    <ItemList
      path={['clues']}
      value={doc.clues}
      what="线索"
      addLabel="添加线索"
      onAdd={() => ops.replace((d) => setIn(d, ['clues'], listAdd(d.clues, newClue(d))) as Obj)}
      render={(item, index, count) => <ClueItem item={item} index={index} count={count} locations={locations} points={points} mode={mode} />}
    />
  );
}

const ClueItem = memo(function ClueItem({ item, index, count, locations, points, mode }: { item: Obj; index: number; count: number; locations: Option[]; points: Option[]; mode: RoleMode }) {
  const path: Path = ['clues', index];
  return (
    <ItemCard listPath={['clues']} index={index} count={count} title={titleOf('线索', index, item.title)} name={text(item.title) || `线索 ${index + 1}`}>
      <div className="ed-grid">
        <KeyField kind="clues" index={index} value={item.key} path={[...path, 'key']} />
        <TextField path={[...path, 'title']} value={item.title} label="标题" />
      </div>
      <TextField path={[...path, 'content']} value={item.content} label="内容" rows={3} />
      <div className="ed-grid">
        <SelectField path={[...path, 'location']} value={item.location} label="在哪找到" options={[NO_PLACE, ...locations]} />
        <CheckField path={[...path, 'core']} value={item.core} label="关键线索" />
      </div>
      <PointsPicker path={[...path, 'points']} value={item.points} points={points} />
      <TextField path={[...path, 'how']} value={item.how} label="怎么拿到" rows={2} />
      <Check path={[...path, 'check']} value={item.check} mode={mode} />
    </ItemCard>
  );
});

/** 这条线索指向哪几条真相（勾选）；指向了不存在的真相的也列出来，可以去掉。 */
function PointsPicker({ path, value, points }: { path: Path; value: unknown; points: Option[] }) {
  const ops = useOps();
  const id = fieldId(path);
  if (value !== undefined && !Array.isArray(value)) return <BadShape id={id} what="指向的真相" />;
  const chosen = value ?? [];
  const missing = chosen.filter((k) => !points.some((p) => p.value === k));
  const toggle = (key: unknown, on: boolean) =>
    ops.edit(path, (old) => {
      const list = Array.isArray(old) ? old : [];
      return on ? [...list, key] : list.filter((k) => k !== key);
    });
  return (
    <fieldset className="field ed-field ed-points" id={id}>
      <legend>指向的真相</legend>
      {points.map((p, i) => (
        <label key={i} className="choice ed-check">
          <input type="checkbox" checked={chosen.includes(p.value)} onChange={(e) => toggle(p.value, e.target.checked)} />
          <span>{p.label}</span>
        </label>
      ))}
      {missing.map((k, i) => (
        <label key={`missing-${i}`} className="choice ed-check is-missing">
          <input type="checkbox" checked onChange={() => toggle(k, false)} />
          <span>（没有这条真相：{text(k)}）</span>
        </label>
      ))}
    </fieldset>
  );
}

/** 检定：不用检定，或者用哪项属性、难度修正多少。 */
function Check({ path, value, mode }: { path: Path; value: unknown; mode: RoleMode }) {
  if (mode === 'five') return <Check5e path={path} value={value} />;
  return <Check2 path={path} value={value} mode={mode} />;
}

/** 5E 的检定（V0.9.0）：技能或者属性、DC。 */
function Check5e({ path, value }: { path: Path; value: unknown }) {
  const ops = useOps();
  const check = isObj(value) ? value : null;
  const current = check ? (typeof check.skill === 'string' ? `skill:${check.skill}` : typeof check.ability === 'string' ? `ability:${check.ability}` : null) : null;
  const pick = (v: unknown) => {
    if (typeof v !== 'string') return ops.set(path, null);
    const [kind, key] = v.split(':');
    const dc = check && typeof check.dc === 'number' ? check.dc : 15;
    ops.set(path, kind === 'skill' ? { skill: key, dc } : { ability: key, dc });
  };
  return (
    <div className="ed-grid" id={fieldId(path)}>
      <SelectField path={[...path, 'skill']} value={current} label="检定" options={SKILL5E_OPTIONS} onPick={pick} />
      {check && <SelectField path={[...path, 'dc']} value={check.dc} label="难度" options={DC_OPTIONS} />}
    </div>
  );
}

function Check2({ path, value, mode }: { path: Path; value: unknown; mode: RoleMode }) {
  const ops = useOps();
  const check = isObj(value) ? value : null;
  const second = mode !== 'rules1';
  const names: Record<string, string> = second ? ATTRIBUTE2_NAME : ATTRIBUTE_NAME;
  const options: Option[] = [{ value: null, label: '不用检定' }, ...checkAttributes(mode).map((k) => ({ value: k, label: names[k] }))];
  const modifiers = second ? range(MODIFIER2_MIN, MODIFIER2_MAX) : range(MODIFIER_MIN, MODIFIER_MAX);
  const pick = (attribute: unknown) => ops.set(path, attribute === null ? null : { ...(check ?? { modifier: 0 }), attribute });
  return (
    <div className="ed-grid" id={fieldId(path)}>
      <SelectField path={[...path, 'attribute']} value={check ? check.attribute : null} label="检定" options={options} onPick={pick} />
      {check && <SelectField path={[...path, 'modifier']} value={check.modifier} label="难度修正" options={modifiers} />}
    </div>
  );
}

// ---------- 时间线 ----------

export function TimelineSection({ doc }: { doc: Obj }) {
  const ops = useOps();
  return (
    <ItemList
      path={['timeline']}
      value={doc.timeline}
      what="事件"
      addLabel="添加事件"
      onAdd={() => ops.replace((d) => setIn(d, ['timeline'], listAdd(d.timeline, newEvent(d))) as Obj)}
      render={(item, index, count) => <EventItem item={item} index={index} count={count} />}
    />
  );
}

const EventItem = memo(function EventItem({ item, index, count }: { item: Obj; index: number; count: number }) {
  const path: Path = ['timeline', index];
  const at = isObj(item.at) ? item.at : {};
  return (
    <ItemCard listPath={['timeline']} index={index} count={count} title={`事件 ${index + 1}`} name={`事件 ${index + 1}`}>
      <div className="ed-grid ed-grid-3">
        <KeyField kind="timeline" index={index} value={item.key} path={[...path, 'key']} />
        <NumberField path={[...path, 'at', 'day']} value={at.day} label="第几天" min={1} max={365} />
        <TimeField path={[...path, 'at', 'time']} value={at.time} label="几点" />
      </div>
      <TextField path={[...path, 'event']} value={item.event} label="发生什么" rows={2} />
      <TextField path={[...path, 'ifIgnored']} value={item.ifIgnored} label="没人管的后果" rows={2} />
    </ItemCard>
  );
});

// ---------- 结局 ----------

export function EndingsSection({ doc }: { doc: Obj }) {
  const ops = useOps();
  const dungeon = doc.category === 'dungeon';
  return (
    <ItemList
      path={['endings']}
      value={doc.endings}
      what="结局"
      addLabel="添加结局"
      onAdd={() => ops.replace((d) => setIn(d, ['endings'], listAdd(d.endings, newEnding(d))) as Obj)}
      render={(item, index, count) => <EndingItem item={item} index={index} count={count} dungeon={dungeon} />}
    />
  );
}

const EndingItem = memo(function EndingItem({ item, index, count, dungeon }: { item: Obj; index: number; count: number; dungeon: boolean }) {
  const path: Path = ['endings', index];
  return (
    <ItemCard listPath={['endings']} index={index} count={count} title={titleOf('结局', index, item.title)} name={text(item.title) || `结局 ${index + 1}`}>
      <div className={dungeon ? 'ed-grid ed-grid-3' : 'ed-grid'}>
        <KeyField kind="endings" index={index} value={item.key} path={[...path, 'key']} />
        <TextField path={[...path, 'title']} value={item.title} label="标题" />
        {dungeon && <SelectField path={[...path, 'result']} value={item.result} label="结果" options={RESULT_OPTIONS} />}
      </div>
      <TextField path={[...path, 'condition']} value={item.condition} label="达成条件" rows={2} />
      <TextField path={[...path, 'summary']} value={item.summary} label="结局描述" rows={4} />
    </ItemCard>
  );
});

// ---------- 怪物和宝藏（5E 模组，V0.9.0） ----------

const MONSTER_LIST_ID = 'ed-srd-monsters';
const ITEM_LIST_ID = 'ed-srd-items';

export function MonstersSection({ doc, locations }: { doc: Obj; locations: Option[] }) {
  const ops = useOps();
  return (
    <>
      <datalist id={MONSTER_LIST_ID}>
        {MONSTER_INDEX.map((m) => (
          <option key={m.key} value={m.key}>
            {m.name}（挑战 {CR_LABEL(m.cr)}）
          </option>
        ))}
      </datalist>
      <datalist id={ITEM_LIST_ID}>
        {ITEM_INDEX.map((i) => (
          <option key={i.key} value={i.key}>
            {i.name}
          </option>
        ))}
      </datalist>
      <h3 className="ed-subhead">怪物</h3>
      <ItemList
        path={['monsters']}
        value={doc.monsters}
        what="怪物"
        addLabel="添加怪物"
        onAdd={() => ops.replace((d) => setIn(d, ['monsters'], listAdd(d.monsters, newMonster5e(d))) as Obj)}
        render={(item, index, count) => <MonsterItem item={item} index={index} count={count} />}
      />
      <h3 className="ed-subhead">宝藏</h3>
      <ItemList
        path={['treasure']}
        value={doc.treasure}
        what="宝藏"
        addLabel="添加宝藏"
        onAdd={() => ops.replace((d) => setIn(d, ['treasure'], listAdd(d.treasure, newTreasure5e(d))) as Obj)}
        render={(item, index, count) => <TreasureItem item={item} index={index} count={count} locations={locations} />}
      />
    </>
  );
}

const MonsterItem = memo(function MonsterItem({ item, index, count }: { item: Obj; index: number; count: number }) {
  const path: Path = ['monsters', index];
  const srd = typeof item.monster === 'string' ? MONSTER_INDEX.find((m) => m.key === item.monster) : null;
  return (
    <ItemCard listPath={['monsters']} index={index} count={count} title={titleOf('怪物', index, item.name)} name={text(item.name) || `怪物 ${index + 1}`}>
      <div className="ed-grid">
        <TextField path={[...path, 'key']} value={item.key} label="标识" />
        <TextField path={[...path, 'name']} value={item.name} label="名字" />
      </div>
      {isObj(item.stats) ? (
        <p className="ed-note">自己写的数据块（在 JSON 里改）</p>
      ) : (
        <div className="field ed-field">
          <label htmlFor={fieldId([...path, 'monster'])}>SRD 怪物{srd ? `：${srd.name}（挑战 ${CR_LABEL(srd.cr)}）` : ''}</label>
          <ListInput path={[...path, 'monster']} value={item.monster} list={MONSTER_LIST_ID} />
        </div>
      )}
      <TextField path={[...path, 'description']} value={item.description} label="在这个故事里的样子" rows={2} />
    </ItemCard>
  );
});

const TreasureItem = memo(function TreasureItem({ item, index, count, locations }: { item: Obj; index: number; count: number; locations: Option[] }) {
  const ops = useOps();
  const path: Path = ['treasure', index];
  const items = Array.isArray(item.items) ? item.items : [];
  return (
    <ItemCard listPath={['treasure']} index={index} count={count} title={`宝藏 ${index + 1}`} name={`宝藏 ${index + 1}`}>
      <div className="ed-grid ed-grid-3">
        <TextField path={[...path, 'key']} value={item.key} label="标识" />
        <SelectField path={[...path, 'location']} value={item.location} label="在哪" options={[NO_PLACE, ...locations]} />
        <NumberField path={[...path, 'gold']} value={item.gold} label="金币" min={0} max={10000} />
      </div>
      <TextField path={[...path, 'how']} value={item.how} label="怎么拿到" rows={2} />
      <fieldset className="field ed-field" id={fieldId([...path, 'items'])}>
        <legend>物品</legend>
        {items.map((it, i) => (
          <div key={i} className="ed-inline ed-treasure-item">
            <ListInput path={[...path, 'items', i, 'item']} value={isObj(it) ? it.item : ''} list={ITEM_LIST_ID} label="物品" />
            <NumberInput path={[...path, 'items', i, 'count']} value={isObj(it) ? it.count : 1} min={1} max={50} label="数量" />
            <button type="button" className="btn btn-small btn-quiet" onClick={() => ops.edit([...path, 'items'], (old) => (Array.isArray(old) ? old.filter((_, j) => j !== i) : old))}>
              去掉
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-small btn-quiet" onClick={() => ops.edit([...path, 'items'], (old) => [...(Array.isArray(old) ? old : []), { item: '', count: 1 }])}>
          加一件物品
        </button>
      </fieldset>
    </ItemCard>
  );
});

/** 可以自己打、也可以从列表里挑的输入框（SRD 的怪物、物品的标识）。 */
function ListInput({ path, value, list, label }: { path: Path; value: unknown; list: string; label?: string }) {
  const ops = useOps();
  return <input id={fieldId(path)} value={text(value)} list={list} aria-label={label} autoComplete="off" onChange={(e) => ops.set(path, e.target.value.trim())} />;
}

// ---------- JSON ----------

/** 整份剧本的原文：能直接改。改不对（不是 JSON）的时候停在这里，说哪里不对。 */
export function JsonSection({ value, error, onChange }: { value: string; error: string; onChange: (text: string) => void }) {
  return (
    <div className="ed-json">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <label htmlFor="ed-json-text" className="visually-hidden">
        整份剧本（JSON）
      </label>
      <textarea id="ed-json-text" className="ed-json-text" value={value} spellCheck={false} autoCapitalize="off" autoComplete="off" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
