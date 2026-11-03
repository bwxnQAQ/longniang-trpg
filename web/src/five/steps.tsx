// 做 5E 卡的每一步（V0.9.0）：职业、种族、背景、属性、技能、职业特性、法术、装备。
// 每一步只改草稿（card），对不对由 cardIssues 统一检查；升级时（levelup）不能变的部分只显示、不能改。
import { useState, type ReactNode } from 'react';
import {
  ABILITIES,
  ABILITY_NAME,
  ABILITY_SCORE_MAX,
  DAMAGE_NAME,
  POINT_BUY_COST,
  POINT_BUY_TOTAL,
  SKILL_KEYS,
  SKILL_NAME,
  SPELL_LEVEL_LABEL,
  STANDARD_ARRAY,
  abilityMod,
  formatMoney,
  signed,
  type Ability,
  type Skill,
} from '../../../shared/5e/core';
import {
  DIVINE_ORDERS,
  HUNTER_PREY,
  LANDS,
  MENTAL,
  PRIMAL_ORDERS,
  SCHOLAR_SKILLS,
  alwaysPrepared,
  expertiseCount,
  fightingStyleLevel,
  invocationCount,
  masteryCount,
  wildShapeForms,
} from '../../../shared/5e/class-rules';
import { armorOf, armorTrained, classOf, classSpells, finalAbilities, itemName, maxSpellLevel, weaponOf, weaponProficient } from '../../../shared/5e/sheet';
import type { Card5eData, ClassData, OriginFeatChoice, RulesData, SpellData } from '../../../shared/5e/types';
import { CLASS_KEYS } from '../../../shared/5e/types';
import { arrayFor, changeBackground, changeClass, changeSpecies, toggle, withStartingGear } from './draft';
import { featureText } from './rules';

export type StepProps = {
  rules: RulesData;
  card: Card5eData;
  set: (fn: (c: Card5eData) => Card5eData) => void;
  /** 升级：职业、种族、背景、基础属性这些不能改。 */
  levelUp: boolean;
  /** 升级前的卡（升级时：以前选的技能、专精、法术书不能去掉）。 */
  old: Card5eData | null;
};

// ==================== 小零件 ====================

/** 一排可以点选的格子（职业、种族、背景）。 */
function Tiles<T extends string>({ items, value, onPick, disabled }: { items: { key: T; title: string; lines: string[] }[]; value: T | null; onPick: (k: T) => void; disabled?: boolean }) {
  return (
    <div className="five-tiles" role="radiogroup">
      {items.map((it) => (
        <button key={it.key} type="button" role="radio" aria-checked={value === it.key} className="five-tile" disabled={disabled && value !== it.key} onClick={() => onPick(it.key)}>
          <span className="five-tile-title">{it.title}</span>
          {it.lines.map((l, i) => (
            <span key={i} className="five-tile-line">
              {l}
            </span>
          ))}
        </button>
      ))}
    </div>
  );
}

/** 「说明」按钮：点开以后这一项占满一行，说明写在它下面。 */
function InfoToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="five-info" aria-expanded={open} onClick={onToggle}>
      说明
    </button>
  );
}

/** 多选：勾选框列表，标题写着选了几个、要几个（要一个的时候点别的就换成别的）。describe：点「说明」看这一项的说明。 */
export function Pick<T extends string>({
  label,
  need,
  options,
  chosen,
  onChange,
  locked = [],
  describe,
}: {
  label: string;
  need: number;
  options: { key: T; name: string; note?: string; disabled?: boolean }[];
  chosen: T[];
  onChange: (next: T[]) => void;
  /** 升级前就选了、不能去掉的。 */
  locked?: T[];
  describe?: (k: T) => ReactNode;
}) {
  const [info, setInfo] = useState<T | null>(null);
  const single = need === 1;
  return (
    <fieldset className="five-pick">
      <legend>
        {label}
        <span className={chosen.length === need ? 'five-count is-done' : chosen.length > need ? 'five-count is-over' : 'five-count'}>
          {chosen.length}/{need}
        </span>
      </legend>
      <ul>
        {options.map((o) => {
          const on = chosen.includes(o.key);
          const fixed = locked.includes(o.key);
          const full = !single && chosen.length >= need;
          const open = info === o.key;
          return (
            <li key={o.key} className={open ? 'is-open' : undefined}>
              <div className="five-option">
                <label className={o.disabled && !on ? 'five-check is-off' : 'five-check'}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={fixed || (!on && (o.disabled || full))}
                    onChange={() => onChange(on ? chosen.filter((x) => x !== o.key) : single ? [...locked.filter((x) => x !== o.key), o.key].slice(-1) : toggle(chosen, o.key, need))}
                  />
                  <span>
                    {o.name}
                    {o.note && <small> {o.note}</small>}
                  </span>
                </label>
                {describe && <InfoToggle open={open} onToggle={() => setInfo(open ? null : o.key)} />}
              </div>
              {describe && open && <div className="five-info-box">{describe(o.key)}</div>}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

/** 单选（一组单选按钮）。说明短的直接写在后面，长的点「说明」看。 */
function Radio<T extends string>({ label, options, value, onChange, disabled }: { label: string; options: { key: T; name: string; text?: string }[]; value: T | null; onChange: (k: T) => void; disabled?: boolean }) {
  const [info, setInfo] = useState<T | null>(null);
  return (
    <fieldset className="five-pick">
      {label && <legend>{label}</legend>}
      <ul>
        {options.map((o) => {
          const long = !!o.text && o.text.length > 60;
          const open = info === o.key;
          return (
            <li key={o.key} className={open || (o.text && !long) ? 'is-open' : undefined}>
              <div className="five-option">
                <label className="five-check">
                  <input type="radio" checked={value === o.key} disabled={disabled} onChange={() => onChange(o.key)} />
                  <span>
                    {o.name}
                    {o.text && !long && <small className="five-option-text">{o.text}</small>}
                  </span>
                </label>
                {long && <InfoToggle open={open} onToggle={() => setInfo(open ? null : o.key)} />}
              </div>
              {long && open && (
                <div className="five-info-box">
                  <p className="five-text">{o.text}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

/** 一段规则说明：标题，点开看全文。 */
function Rule({ name, text, note }: { name: string; text: string; note?: string }) {
  return (
    <details className="five-rule">
      <summary>
        {name}
        {note && <span className="muted">（{note}）</span>}
      </summary>
      <p className="five-text">{text}</p>
    </details>
  );
}

function spellOptions(spells: SpellData[], chosen: string[]) {
  return spells.map((s) => ({
    key: s.key,
    name: s.name,
    note: [s.level ? SPELL_LEVEL_LABEL[s.level] : '', s.concentration ? '专注' : '', s.ritual ? '仪式' : ''].filter(Boolean).join('·'),
    disabled: false,
    on: chosen.includes(s.key),
  }));
}

function SpellBody({ s }: { s: SpellData | undefined }) {
  if (!s) return null;
  return (
    <>
      <p className="five-spell-meta">
        {s.castingTime} · {s.range} · {s.components} · {s.duration}
      </p>
      <p className="five-text">{s.text}</p>
      {s.higher && <p className="five-text muted">升环：{s.higher}</p>}
    </>
  );
}

export const describeSpell = (rules: RulesData) => (k: string) => <SpellBody s={rules.spells.find((x) => x.key === k)} />;

// ==================== 职业 ====================

export function ClassStep({ rules, card, set, levelUp }: StepProps) {
  const cls = classOf(rules, card.class)!;
  const levels = cls.levels.filter((l) => l.level <= card.level);
  return (
    <div className="five-step">
      <Tiles
        items={CLASS_KEYS.map((k) => {
          const c = classOf(rules, k)!;
          return { key: k, title: c.name, lines: [`生命骰 d${c.hitDie}`, `主要属性：${c.primary.map((a) => ABILITY_NAME[a]).join('、')}`] };
        })}
        value={card.class}
        disabled={levelUp}
        onPick={(k) => set((c) => changeClass(c, k, rules))}
      />
      <section className="five-detail">
        <h3>{cls.name}</h3>
        <p className="five-text">{cls.text}</p>
        <dl className="five-facts">
          <div>
            <dt>生命骰</dt>
            <dd>d{cls.hitDie}（1 级生命值 {cls.hitDie} + 体质调整值）</dd>
          </div>
          <div>
            <dt>豁免熟练</dt>
            <dd>{cls.saves.map((a) => ABILITY_NAME[a]).join('、')}</dd>
          </div>
          <div>
            <dt>护甲受训</dt>
            <dd>{cls.armor.map((a) => ({ light: '轻甲', medium: '中甲', heavy: '重甲', shield: '盾牌' })[a]).join('、') || '无'}</dd>
          </div>
          <div>
            <dt>武器熟练</dt>
            <dd>{cls.weapons.map((w) => ({ simple: '简易武器', martial: '军用武器', 'martial-finesse-light': '带灵巧或轻型词条的军用武器', 'martial-light': '带轻型词条的军用武器' })[w]).join('、')}</dd>
          </div>
          <div>
            <dt>技能</dt>
            <dd>
              从 {cls.skillOptions.map((s) => SKILL_NAME[s]).join('、')} 里选 {cls.skillCount} 个
            </dd>
          </div>
          {cls.spellcasting && (
            <div>
              <dt>施法</dt>
              <dd>
                用{ABILITY_NAME[cls.spellcasting.ability]}施法（{{ full: '全施法者', half: '半施法者', pact: '契约魔法' }[cls.spellcasting.kind]}）
              </dd>
            </div>
          )}
        </dl>
        <h4 className="five-sub">{levelUp ? `到 ${card.level} 级为止的特性` : '1 级的特性'}</h4>
        {levels.flatMap((l) =>
          l.features.map((k) => {
            const f = rules.features[k];
            return f ? <Rule key={k} name={f.name} text={f.text} note={`${l.level} 级`} /> : null;
          }),
        )}
      </section>
    </div>
  );
}

// ==================== 种族 ====================

export function SpeciesStep({ rules, card, set, levelUp }: StepProps) {
  const sp = rules.species.find((s) => s.key === card.species)!;
  const speciesFeat = card.originFeats.find((f) => f.source === 'species') ?? null;
  return (
    <div className="five-step">
      <Tiles
        items={rules.species.map((s) => ({
          key: s.key,
          title: s.name,
          lines: [`${s.size === 'small' ? '小型' : s.size === 'choice' ? '中型或小型' : '中型'}，速度 ${s.speed} 尺`, s.darkvision ? `黑暗视觉 ${s.darkvision} 尺` : ''].filter(Boolean),
        }))}
        value={card.species}
        disabled={levelUp}
        onPick={(k) => set((c) => changeSpecies(c, k, rules))}
      />
      <section className="five-detail">
        <h3>{sp.name}</h3>
        <p className="five-text">{sp.text}</p>
        {sp.traits.map((k) => {
          const t = featureText(rules, k);
          return t ? <Rule key={k} name={t.name} text={t.text} /> : null;
        })}
        {sp.lineages.length > 0 && (
          <Radio
            label={sp.lineageLabel ?? '亚种'}
            options={sp.lineages.map((l) => ({
              key: l.key,
              name: l.name,
              text: [l.damageType ? `伤害类型：${DAMAGE_NAME[l.damageType]}` : '', ...l.traits.map((k) => featureText(rules, k)?.text ?? '')].filter(Boolean).join(' '),
            }))}
            value={card.lineage}
            disabled={levelUp}
            onChange={(k) => set((c) => ({ ...c, lineage: k }))}
          />
        )}
        {sp.size === 'choice' && (
          <Radio
            label="体型"
            options={[
              { key: 'medium', name: '中型' },
              { key: 'small', name: '小型' },
            ]}
            value={card.size}
            disabled={levelUp}
            onChange={(k) => set((c) => ({ ...c, size: k }))}
          />
        )}
        {['elf', 'gnome', 'tiefling'].includes(card.species) && (
          <Radio
            label="血统法术用什么属性施放"
            options={MENTAL.map((a) => ({ key: a, name: ABILITY_NAME[a] }))}
            value={card.lineageAbility}
            disabled={levelUp}
            onChange={(k) => set((c) => ({ ...c, lineageAbility: k }))}
          />
        )}
        {card.species === 'human' && (
          <OriginFeatPicker
            rules={rules}
            label="多才多艺：再选一个起源专长"
            feat={speciesFeat}
            fixedList={null}
            disabled={levelUp}
            exclude={card.originFeats.filter((f) => f.source === 'background' && f.key !== 'magic-initiate').map((f) => f.key)}
            onChange={(f) => set((c) => ({ ...c, originFeats: [...c.originFeats.filter((x) => x.source !== 'species'), ...(f ? [{ ...f, source: 'species' as const }] : [])] }))}
          />
        )}
      </section>
    </div>
  );
}

/** 起源专长：选哪个；魔法学徒要选法术表、施法属性、两个戏法、一个 1 环法术；多才多艺选三个技能。 */
function OriginFeatPicker({
  rules,
  label,
  feat,
  fixedList,
  disabled,
  exclude = [],
  onChange,
}: {
  rules: RulesData;
  label: string;
  feat: OriginFeatChoice | null;
  /** 背景定好的法术表（侍僧是牧师、贤者是法师）；null 是自己选。 */
  fixedList: 'cleric' | 'druid' | 'wizard' | null;
  disabled?: boolean;
  exclude?: string[];
  onChange: (f: OriginFeatChoice | null) => void;
}) {
  const origin = rules.feats.filter((f) => f.type === 'origin' && !exclude.includes(f.key));
  const list = fixedList ?? feat?.list ?? null;
  const pool = (level: 0 | 1) => (list ? rules.spells.filter((s) => s.level === level && s.classes.includes(list)) : []);
  return (
    <div className="five-feat">
      {fixedList === null && (
        <Radio
          label={label}
          options={origin.map((f) => ({ key: f.key, name: f.name, text: f.text }))}
          value={feat?.key ?? null}
          disabled={disabled}
          onChange={(k) => onChange({ key: k, source: 'species' })}
        />
      )}
      {feat?.key === 'magic-initiate' && (
        <>
          {!fixedList && (
            <Radio
              label="魔法学徒：用哪个职业的法术表"
              options={[
                { key: 'cleric', name: '牧师' },
                { key: 'druid', name: '德鲁伊' },
                { key: 'wizard', name: '法师' },
              ]}
              value={feat.list ?? null}
              disabled={disabled}
              onChange={(k) => onChange({ ...feat, list: k, cantrips: [], spell: undefined })}
            />
          )}
          <Radio label="魔法学徒：施法属性" options={MENTAL.map((a) => ({ key: a, name: ABILITY_NAME[a] }))} value={feat.ability ?? null} disabled={disabled} onChange={(k) => onChange({ ...feat, ability: k })} />
          {list && (
            <>
              <Pick label="魔法学徒：两个戏法" need={2} options={pool(0).map((s) => ({ key: s.key, name: s.name }))} chosen={feat.cantrips ?? []} onChange={(v) => !disabled && onChange({ ...feat, cantrips: v })} describe={describeSpell(rules)} />
              <Pick label="魔法学徒：一个 1 环法术（每天免费施放一次）" need={1} options={pool(1).map((s) => ({ key: s.key, name: s.name }))} chosen={feat.spell ? [feat.spell] : []} onChange={(v) => !disabled && onChange({ ...feat, spell: v[0] })} describe={describeSpell(rules)} />
            </>
          )}
        </>
      )}
      {feat?.key === 'skilled' && (
        <Pick label="多才多艺：三个技能" need={3} options={SKILL_KEYS.map((s) => ({ key: s, name: SKILL_NAME[s] }))} chosen={feat.skills ?? []} onChange={(v) => !disabled && onChange({ ...feat, skills: v })} />
      )}
    </div>
  );
}

// ==================== 背景 ====================

export function BackgroundStep({ rules, card, set, levelUp }: StepProps) {
  const bg = rules.backgrounds.find((b) => b.key === card.background)!;
  const feat = rules.feats.find((f) => f.key === bg.feat);
  const choice = card.originFeats.find((f) => f.source === 'background') ?? null;
  return (
    <div className="five-step">
      <Tiles
        items={rules.backgrounds.map((b) => ({
          key: b.key,
          title: b.name,
          lines: [`属性：${b.abilities.map((a) => ABILITY_NAME[a]).join('、')}`, `技能：${b.skills.map((s) => SKILL_NAME[s]).join('、')}`, `专长：${rules.feats.find((f) => f.key === b.feat)?.name ?? b.feat}`],
        }))}
        value={card.background}
        disabled={levelUp}
        onPick={(k) => set((c) => changeBackground(c, k, rules))}
      />
      <section className="five-detail">
        <h3>{bg.name}</h3>
        <p className="five-text">{bg.text}</p>
        <dl className="five-facts">
          <div>
            <dt>属性加值</dt>
            <dd>{bg.abilities.map((a) => ABILITY_NAME[a]).join('、')} 里一项 +2、一项 +1，或者三项各 +1（在「属性」那一步分）</dd>
          </div>
          <div>
            <dt>技能熟练</dt>
            <dd>{bg.skills.map((s) => SKILL_NAME[s]).join('、')}</dd>
          </div>
          <div>
            <dt>工具熟练</dt>
            <dd>{itemName(rules, bg.tool)}</dd>
          </div>
          <div>
            <dt>起始装备</dt>
            <dd>{bg.equipmentText}</dd>
          </div>
        </dl>
        {feat && <Rule name={`起源专长：${feat.name}`} text={feat.text} />}
        {bg.feat === 'magic-initiate' && (
          <OriginFeatPicker
            rules={rules}
            label=""
            feat={choice}
            fixedList={bg.featList}
            disabled={levelUp}
            onChange={(f) => set((c) => ({ ...c, originFeats: [...(f ? [{ ...f, source: 'background' as const, list: bg.featList ?? f.list }] : []), ...c.originFeats.filter((x) => x.source !== 'background')] }))}
          />
        )}
      </section>
    </div>
  );
}

// ==================== 属性 ====================

export function AbilitiesStep({ rules, card, set, levelUp }: StepProps) {
  const bg = rules.backgrounds.find((b) => b.key === card.background)!;
  const finals = finalAbilities(card);
  const used = (a: Ability) => ABILITIES.filter((x) => x !== a).map((x) => card.base[x]);
  const spent = card.method === 'pointbuy' ? ABILITIES.reduce((s, a) => s + (POINT_BUY_COST[card.base[a]] ?? 0), 0) : 0;
  const bonusMode: 'split' | 'even' = Object.values(card.bgBonus).filter(Boolean).length === 3 ? 'even' : 'split';
  const plus2 = (Object.entries(card.bgBonus).find(([, v]) => v === 2)?.[0] ?? null) as Ability | null;
  const plus1 = (Object.entries(card.bgBonus).find(([, v]) => v === 1)?.[0] ?? null) as Ability | null;
  const asiAt4 = card.level >= 4;
  const asi = card.asi[0] ?? {};
  const [asiMode, setAsiMode] = useState<'one' | 'two'>(Object.values(asi).filter(Boolean).length === 2 ? 'two' : 'one');
  const asiKeys = Object.entries(asi)
    .filter(([, v]) => v)
    .map(([k]) => k as Ability);
  return (
    <div className="five-step">
      {!levelUp && (
        <>
          <Radio
            label="怎么定属性"
            options={[
              { key: 'array', name: '标准数组', text: `${STANDARD_ARRAY.join('、')} 各用一次` },
              { key: 'pointbuy', name: '购点', text: `每项从 8 开始，一共 ${POINT_BUY_TOTAL} 点（8～15）` },
            ]}
            value={card.method}
            onChange={(m) => set((c) => ({ ...c, method: m, base: m === 'array' ? arrayFor(c.class) : { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } }))}
          />
          <p className="five-actions">
            <button type="button" className="btn btn-small" onClick={() => set((c) => ({ ...c, method: 'array', base: arrayFor(c.class) }))}>
              按职业推荐分（标准数组）
            </button>
            {card.method === 'pointbuy' && (
              <span className={spent > POINT_BUY_TOTAL ? 'five-count is-over' : 'five-count'}>
                用了 {spent}/{POINT_BUY_TOTAL} 点
              </span>
            )}
          </p>
        </>
      )}
      <table className="five-ability-table">
        <thead>
          <tr>
            <th scope="col">属性</th>
            <th scope="col">{card.method === 'array' ? '标准数组' : '购点'}</th>
            <th scope="col">背景</th>
            {asiAt4 && <th scope="col">4 级提升</th>}
            <th scope="col">最后</th>
            <th scope="col">调整值</th>
          </tr>
        </thead>
        <tbody>
          {ABILITIES.map((a) => (
            <tr key={a}>
              <th scope="row">{ABILITY_NAME[a]}</th>
              <td>
                {levelUp ? (
                  card.base[a]
                ) : card.method === 'array' ? (
                  <select
                    value={card.base[a]}
                    aria-label={`${ABILITY_NAME[a]}的标准数组`}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      // 换一个已经给了别的属性的数：两项互换
                      set((c) => {
                        const other = ABILITIES.find((x) => x !== a && c.base[x] === v);
                        return { ...c, base: { ...c.base, [a]: v, ...(other ? { [other]: c.base[a] } : {}) } };
                      });
                    }}
                  >
                    {STANDARD_ARRAY.map((v) => (
                      <option key={v} value={v}>
                        {v}
                        {used(a).includes(v) ? '（换过来）' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="five-stepper">
                    <button type="button" className="btn btn-small" aria-label={`${ABILITY_NAME[a]}减一`} disabled={card.base[a] <= 8} onClick={() => set((c) => ({ ...c, base: { ...c.base, [a]: c.base[a] - 1 } }))}>
                      −
                    </button>
                    <span>{card.base[a]}</span>
                    <button
                      type="button"
                      className="btn btn-small"
                      aria-label={`${ABILITY_NAME[a]}加一`}
                      disabled={card.base[a] >= 15 || spent - (POINT_BUY_COST[card.base[a]] ?? 0) + (POINT_BUY_COST[card.base[a] + 1] ?? 99) > POINT_BUY_TOTAL}
                      onClick={() => set((c) => ({ ...c, base: { ...c.base, [a]: c.base[a] + 1 } }))}
                    >
                      +
                    </button>
                  </span>
                )}
              </td>
              <td>{card.bgBonus[a] ? `+${card.bgBonus[a]}` : ''}</td>
              {asiAt4 && <td>{asi[a] ? `+${asi[a]}` : ''}</td>}
              <td className="five-final">{finals[a]}</td>
              <td>{signed(abilityMod(finals[a]))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!levelUp && (
        <fieldset className="five-pick">
          <legend>背景「{bg.name}」的属性加值</legend>
          <div className="five-row">
            <label className="five-check">
              <input type="radio" checked={bonusMode === 'split'} onChange={() => set((c) => ({ ...c, bgBonus: {} }))} />
              <span>一项 +2、一项 +1</span>
            </label>
            <label className="five-check">
              <input type="radio" checked={bonusMode === 'even'} onChange={() => set((c) => ({ ...c, bgBonus: Object.fromEntries(bg.abilities.map((x) => [x, 1])) }))} />
              <span>三项各 +1</span>
            </label>
          </div>
          {bonusMode === 'split' && (
            <div className="five-row">
              <label className="field-inline">
                +2 给
                <select value={plus2 ?? ''} onChange={(e) => set((c) => ({ ...c, bgBonus: { ...(plus1 && plus1 !== e.target.value ? { [plus1]: 1 } : {}), ...(e.target.value ? { [e.target.value]: 2 } : {}) } }))}>
                  <option value="">（选一项）</option>
                  {bg.abilities.map((x) => (
                    <option key={x} value={x}>
                      {ABILITY_NAME[x]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-inline">
                +1 给
                <select value={plus1 ?? ''} onChange={(e) => set((c) => ({ ...c, bgBonus: { ...(plus2 && plus2 !== e.target.value ? { [plus2]: 2 } : {}), ...(e.target.value ? { [e.target.value]: 1 } : {}) } }))}>
                  <option value="">（选一项）</option>
                  {bg.abilities.map((x) => (
                    <option key={x} value={x}>
                      {ABILITY_NAME[x]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </fieldset>
      )}

      {asiAt4 && (
        <fieldset className="five-pick">
          <legend>4 级：属性值提升（最高到 {ABILITY_SCORE_MAX}）</legend>
          <div className="five-row">
            <label className="five-check">
              <input
                type="radio"
                checked={asiMode === 'one'}
                onChange={() => {
                  setAsiMode('one');
                  set((c) => ({ ...c, asi: [{}] }));
                }}
              />
              <span>一项 +2</span>
            </label>
            <label className="five-check">
              <input
                type="radio"
                checked={asiMode === 'two'}
                onChange={() => {
                  setAsiMode('two');
                  set((c) => ({ ...c, asi: [{}] }));
                }}
              />
              <span>两项各 +1</span>
            </label>
          </div>
          <div className="five-row">
            {(asiMode === 'one' ? [0] : [0, 1]).map((i) => (
              <label key={i} className="field-inline">
                {asiMode === 'one' ? '+2 给' : `第 ${i + 1} 项 +1`}
                <select
                  value={asiKeys[i] ?? ''}
                  onChange={(e) =>
                    set((c) => {
                      const keys = [...asiKeys];
                      keys[i] = e.target.value as Ability;
                      const picked = keys.filter(Boolean);
                      const next = asiMode === 'one' ? { [picked[0]]: 2 } : Object.fromEntries(picked.map((k) => [k, 1]));
                      return { ...c, asi: [next] };
                    })
                  }
                >
                  <option value="">（选一项）</option>
                  {ABILITIES.map((x) => (
                    <option key={x} value={x} disabled={asiMode === 'two' && asiKeys.includes(x) && asiKeys[i] !== x}>
                      {ABILITY_NAME[x]}（现在 {finals[x] - (asi[x] ?? 0)}）
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}

// ==================== 技能 ====================

export function SkillsStep({ rules, card, set, levelUp, old }: StepProps) {
  const cls = classOf(rules, card.class)!;
  const bg = rules.backgrounds.find((b) => b.key === card.background)!;
  const featSkills = card.originFeats.flatMap((f) => f.skills ?? []);
  const others = (except: string) => new Set<Skill>([...bg.skills, ...featSkills, ...(except === 'class' ? [] : card.classSkills), ...card.bonusSkills.filter((b) => b.source !== except).map((b) => b.skill)]);
  const bonusNeed: { source: string; label: string; count: number; options: Skill[] }[] = [];
  if (card.species === 'elf') bonusNeed.push({ source: 'keen-senses', label: '精灵的敏锐感官', count: 1, options: ['insight', 'perception', 'survival'] });
  if (card.species === 'human') bonusNeed.push({ source: 'skillful', label: '人类的多才', count: 1, options: SKILL_KEYS });
  if (card.class === 'barbarian' && card.level >= 3) bonusNeed.push({ source: 'primal-knowledge', label: '野蛮人 3 级的原初学识', count: 1, options: cls.skillOptions });
  if (card.subclass === 'college-of-lore' && card.level >= 3) bonusNeed.push({ source: 'lore-bonus-proficiencies', label: '逸闻学院的额外熟练', count: 3, options: SKILL_KEYS });
  const proficient = [...new Set<Skill>([...bg.skills, ...featSkills, ...card.classSkills, ...card.bonusSkills.map((b) => b.skill)])];
  const expNeed = expertiseCount(card.class, card.level);
  const scholar = card.class === 'wizard';
  return (
    <div className="five-step">
      <p className="five-line">
        <span className="five-label">背景给的</span>
        {bg.skills.map((s) => SKILL_NAME[s]).join('、')}
        {featSkills.length > 0 && `；多才多艺：${featSkills.map((s) => SKILL_NAME[s]).join('、')}`}
      </p>
      <Pick
        label={`${cls.name}的技能`}
        need={cls.skillCount}
        options={cls.skillOptions.map((s) => ({ key: s, name: SKILL_NAME[s], disabled: levelUp || others('class').has(s) }))}
        chosen={card.classSkills}
        locked={levelUp ? card.classSkills : []}
        onChange={(v) => set((c) => ({ ...c, classSkills: v }))}
      />
      {bonusNeed.map((n) => {
        const mine = card.bonusSkills.filter((b) => b.source === n.source).map((b) => b.skill);
        const before = old?.bonusSkills.filter((b) => b.source === n.source).map((b) => b.skill) ?? [];
        return (
          <Pick
            key={n.source}
            label={n.label}
            need={n.count}
            options={n.options.map((s) => ({ key: s, name: SKILL_NAME[s], disabled: others(n.source).has(s) }))}
            chosen={mine}
            locked={before}
            onChange={(v) => set((c) => ({ ...c, bonusSkills: [...c.bonusSkills.filter((b) => b.source !== n.source), ...v.map((skill) => ({ source: n.source, skill }))] }))}
          />
        );
      })}
      {expNeed > 0 && (
        <Pick
          label={scholar ? '法师 2 级的学者：一个专精（奥秘、历史、调查、医药、自然、宗教里已经熟练的）' : '专精（熟练加值翻倍）'}
          need={expNeed}
          options={(scholar ? proficient.filter((s) => SCHOLAR_SKILLS.includes(s)) : proficient).map((s) => ({ key: s, name: SKILL_NAME[s] }))}
          chosen={card.expertise}
          locked={old?.expertise ?? []}
          onChange={(v) => set((c) => ({ ...c, expertise: v }))}
        />
      )}
    </div>
  );
}

// ==================== 职业特性 ====================

export function FeaturesStep({ rules, card, set, old }: StepProps) {
  const cls = classOf(rules, card.class)!;
  const L = card.level;
  const styleLevel = fightingStyleLevel(card.class);
  const subclasses = rules.subclasses.filter((s) => s.class === card.class);
  const mCount = masteryCount(card.class, L);
  const nothing =
    !['cleric', 'druid'].includes(card.class) && !(styleLevel && L >= styleLevel) && !mCount && L < 3 && !(card.class === 'sorcerer' && L >= 2) && card.class !== 'warlock' && !(card.class === 'druid' && L >= 2);
  return (
    <div className="five-step">
      {nothing && <p className="muted">{cls.name} {L} 级在这一步没有要选的。</p>}
      {(card.class === 'cleric' || card.class === 'druid') && (
        <Radio
          label={card.class === 'cleric' ? '神圣职责' : '原初职责'}
          options={(card.class === 'cleric' ? DIVINE_ORDERS : PRIMAL_ORDERS).map((o) => ({ key: o.key, name: o.name, text: o.text }))}
          value={card.order}
          disabled={!!old}
          onChange={(k) => set((c) => ({ ...withStartingGear({ ...c, order: k }, rules), ...(old ? { inventory: c.inventory, money: c.money, equipped: c.equipped } : {}), cantrips: c.cantrips.slice(0, (cls.spellcasting?.cantrips[L - 1] ?? 0) + (k === 'thaumaturge' || k === 'magician' ? 1 : 0)) }))}
        />
      )}
      {styleLevel !== null && L >= styleLevel && <FightingStyle rules={rules} card={card} set={set} />}
      {mCount > 0 && (
        <Pick
          label={`武器精通（${cls.name}${card.class === 'barbarian' ? '：近战武器' : ''}）`}
          need={mCount}
          options={rules.weapons
            .filter((w) => weaponProficient(card, cls, w) && w.mastery && !(card.class === 'barbarian' && w.ranged))
            .map((w) => ({ key: w.key, name: w.name, note: rules.masteries.find((m) => m.key === w.mastery)?.name ?? '' }))}
          chosen={card.masteries}
          onChange={(v) => set((c) => ({ ...c, masteries: v }))}
          describe={(k) => {
            const w = rules.weapons.find((x) => x.key === k);
            const m = rules.masteries.find((x) => x.key === w?.mastery);
            return m ? <p className="five-text">{`${m.name}：${m.text}`}</p> : null;
          }}
        />
      )}
      {L >= 3 && (
        <>
          <Radio
            label="子职业"
            options={subclasses.map((s) => ({ key: s.key, name: s.name, text: s.text }))}
            value={card.subclass}
            disabled={!!old?.subclass}
            onChange={(k) => set((c) => ({ ...c, subclass: k }))}
          />
          {card.subclass &&
            subclasses
              .find((s) => s.key === card.subclass)
              ?.features.filter((f) => f.level <= L)
              .map((f) => {
                const t = rules.features[f.key];
                return t ? <Rule key={f.key} name={t.name} text={t.text} note={`${f.level} 级`} /> : null;
              })}
        </>
      )}
      {card.subclass === 'hunter' && L >= 3 && (
        <Radio label="猎人猎物" options={HUNTER_PREY.map((h) => ({ key: h.key, name: h.name, text: h.text }))} value={card.hunterPrey} onChange={(k) => set((c) => ({ ...c, hunterPrey: k }))} />
      )}
      {card.subclass === 'circle-of-the-land' && L >= 3 && (
        <Radio
          label="大地结社：地形（长休时可以换）"
          options={LANDS.map((l) => ({ key: l.key, name: l.name, text: alwaysPrepared({ class: 'druid', subclass: 'circle-of-the-land', land: l.key, level: L }).filter((k) => k !== 'speak-with-animals').map((k) => rules.spells.find((s) => s.key === k)?.name ?? k).join('、') }))}
          value={card.land}
          onChange={(k) => set((c) => ({ ...c, land: k, prepared: c.prepared.filter((p) => !alwaysPrepared({ ...c, land: k }).includes(p)) }))}
        />
      )}
      {card.class === 'sorcerer' && L >= 2 && (
        <Pick
          label="超魔"
          need={2}
          options={rules.metamagic.map((m) => ({ key: m.key, name: m.name, note: `${m.cost ?? 1} 点术法点` }))}
          chosen={card.metamagic}
          onChange={(v) => set((c) => ({ ...c, metamagic: v }))}
          describe={(k) => {
            const m = rules.metamagic.find((x) => x.key === k);
            return m ? <p className="five-text">{m.text}</p> : null;
          }}
        />
      )}
      {card.class === 'warlock' && <Invocations rules={rules} card={card} set={set} />}
      {card.class === 'druid' && L >= 2 && (
        <Pick
          label={`荒野变形：会变的野兽（挑战等级 ${wildShapeForms(L).maxCr === 0.25 ? '1/4' : '1/2'} 以下、不会飞）`}
          need={wildShapeForms(L).count}
          options={rules.beasts.filter((b) => b.cr <= wildShapeForms(L).maxCr && !b.fly).map((b) => ({ key: b.key, name: b.name, note: `挑战 ${b.cr === 0.125 ? '1/8' : b.cr === 0.25 ? '1/4' : b.cr === 0.5 ? '1/2' : b.cr}${b.swim ? '，会游泳' : ''}` }))}
          chosen={card.wildShapes}
          onChange={(v) => set((c) => ({ ...c, wildShapes: v }))}
        />
      )}
    </div>
  );
}

function FightingStyle({ rules, card, set }: Pick<StepProps, 'rules' | 'card' | 'set'>) {
  const special = card.class === 'paladin' ? { key: 'blessed-warrior', name: '神佑战士', list: 'cleric' as const, text: '学会两个牧师戏法（用魅力施放），升级时可以换。' } : card.class === 'ranger' ? { key: 'druidic-warrior', name: '德鲁伊战士', list: 'druid' as const, text: '学会两个德鲁伊戏法（用感知施放），升级时可以换。' } : null;
  const styles = rules.feats.filter((f) => f.type === 'fighting-style').map((f) => ({ key: f.key, name: f.name, text: f.text }));
  return (
    <>
      <Radio
        label="战斗风格"
        options={[...styles, ...(special ? [{ key: special.key, name: special.name, text: special.text }] : [])]}
        value={card.fightingStyle}
        onChange={(k) => set((c) => ({ ...c, fightingStyle: k, styleCantrips: k === special?.key ? c.styleCantrips : [] }))}
      />
      {special && card.fightingStyle === special.key && (
        <Pick
          label={`${special.name}：两个${special.list === 'cleric' ? '牧师' : '德鲁伊'}戏法`}
          need={2}
          options={rules.spells.filter((s) => s.level === 0 && s.classes.includes(special.list)).map((s) => ({ key: s.key, name: s.name }))}
          chosen={card.styleCantrips}
          onChange={(v) => set((c) => ({ ...c, styleCantrips: v }))}
          describe={describeSpell(rules)}
        />
      )}
    </>
  );
}

function Invocations({ rules, card, set }: Pick<StepProps, 'rules' | 'card' | 'set'>) {
  const need = invocationCount(card.level);
  const keys = card.invocations.map((i) => i.key);
  const available = rules.invocations.filter((o) => (o.level ?? 1) <= card.level);
  const damageCantrips = (attack: boolean) => card.cantrips.map((k) => rules.spells.find((s) => s.key === k)).filter((s): s is SpellData => !!s && !!s.mech?.damage && (!attack || !!s.mech.attack));
  const update = (i: number, patch: Partial<Card5eData['invocations'][number]>) => set((c) => ({ ...c, invocations: c.invocations.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  return (
    <fieldset className="five-pick">
      <legend>
        魔能祈唤
        <span className={keys.length === need ? 'five-count is-done' : 'five-count'}>
          {keys.length}/{need}
        </span>
      </legend>
      <ul>
        {card.invocations.map((inv, i) => {
          const o = rules.invocations.find((x) => x.key === inv.key);
          return (
            <li key={`${inv.key}-${i}`} className="five-invocation">
              <div className="five-row">
                <strong>{o?.name ?? inv.key}</strong>
                <button type="button" className="btn btn-small btn-quiet" onClick={() => set((c) => ({ ...c, invocations: c.invocations.filter((_, j) => j !== i), ...(inv.key === 'pact-of-the-tome' ? { tome: null } : {}) }))}>
                  去掉
                </button>
              </div>
              {o && <Rule name="说明" text={o.text} />}
              {(o?.requires === 'damage-cantrip' || o?.requires === 'attack-cantrip') && (
                <label className="field-inline">
                  用在哪个戏法上
                  <select value={inv.cantrip ?? ''} onChange={(e) => update(i, { cantrip: e.target.value || undefined })}>
                    <option value="">（选一个）</option>
                    {damageCantrips(o.requires === 'attack-cantrip').map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {inv.key === 'lessons-of-the-first-ones' && (
                <OriginFeatPicker rules={rules} label="太古者教诲：一个起源专长" feat={inv.feat ?? null} fixedList={null} onChange={(f) => update(i, { feat: f ? { ...f, source: 'invocation' } : undefined })} />
              )}
            </li>
          );
        })}
      </ul>
      {keys.length < need && (
        <label className="field-inline">
          加一个
          <select
            value=""
            onChange={(e) => {
              const k = e.target.value;
              if (k) set((c) => ({ ...c, invocations: [...c.invocations, { key: k }], ...(k === 'pact-of-the-tome' ? { tome: { cantrips: [], rituals: [] } } : {}) }));
            }}
          >
            <option value="">（选一个魔能祈唤）</option>
            {available
              .filter((o) => o.repeatable || !keys.includes(o.key))
              .filter((o) => !(o.requires === 'pact-of-the-blade' || o.requires === 'pact-of-the-chain') || keys.includes(o.requires))
              .map((o) => (
                <option key={o.key} value={o.key}>
                  {o.name}
                  {(o.level ?? 1) > 1 ? `（${o.level} 级）` : ''}
                </option>
              ))}
          </select>
        </label>
      )}
      {keys.includes('pact-of-the-tome') && card.tome && (
        <>
          <Pick label="魔典契约：三个戏法（任何职业的）" need={3} options={rules.spells.filter((s) => s.level === 0).map((s) => ({ key: s.key, name: s.name }))} chosen={card.tome.cantrips} onChange={(v) => set((c) => ({ ...c, tome: { ...c.tome!, cantrips: v } }))} describe={describeSpell(rules)} />
          <Pick label="魔典契约：两个 1 环仪式法术" need={2} options={rules.spells.filter((s) => s.level === 1 && s.ritual).map((s) => ({ key: s.key, name: s.name }))} chosen={card.tome.rituals} onChange={(v) => set((c) => ({ ...c, tome: { ...c.tome!, rituals: v } }))} describe={describeSpell(rules)} />
        </>
      )}
    </fieldset>
  );
}

// ==================== 法术 ====================

export function SpellsStep({ rules, card, set, old }: StepProps) {
  const cls = classOf(rules, card.class)!;
  const sc = cls.spellcasting;
  const [show, setShow] = useState<number | 'all'>('all');
  if (!sc) return <p className="muted">{cls.name}不施法。</p>;
  const L = card.level;
  const max = maxSpellLevel(cls, L);
  const list = classSpells(rules, card.class, max);
  const extra = card.order === 'thaumaturge' || card.order === 'magician' ? 1 : 0;
  const cNeed = sc.cantrips[L - 1] + extra;
  const pNeed = sc.prepared[L - 1];
  const always = alwaysPrepared({ class: card.class, subclass: L >= 3 ? card.subclass : null, land: card.land, level: L });
  const leveled = list.filter((s) => s.level >= 1 && !always.includes(s.key));
  const wizard = card.class === 'wizard';
  const savant = card.subclass === 'evoker' && L >= 3 ? (L >= 5 ? 3 : 2) : 0;
  const bookNeed = 6 + 2 * (L - 1) + savant;
  const levels = [...new Set(leveled.map((s) => s.level))].sort();
  const shown = (s: SpellData) => show === 'all' || s.level === show;
  return (
    <div className="five-step">
      <p className="five-line">
        {cls.name} {L} 级：{cNeed} 个戏法；准备 {pNeed} 个{max > 1 ? ` 1～${max} 环` : ' 1 环'}的法术{wizard ? `（从法术书里挑；法术书里有 ${bookNeed} 个法术）` : ''}。长休以后可以换准备的法术。
      </p>
      {always.length > 0 && (
        <p className="five-line">
          <span className="five-label">总是准备好</span>
          {always.map((k) => rules.spells.find((s) => s.key === k)?.name ?? k).join('、')}（不占名额）
        </p>
      )}
      <Pick
        label="戏法"
        need={cNeed}
        options={list.filter((s) => s.level === 0).map((s) => ({ key: s.key, name: s.name, note: s.concentration ? '专注' : '' }))}
        chosen={card.cantrips}
        onChange={(v) => set((c) => ({ ...c, cantrips: v, invocations: c.invocations.map((i) => (i.cantrip && !v.includes(i.cantrip) ? { ...i, cantrip: undefined } : i)) }))}
        describe={describeSpell(rules)}
      />
      {levels.length > 1 && (
        <div className="five-row five-filter" role="group" aria-label="按环级看">
          {(['all', ...levels] as const).map((l) => (
            <button key={l} type="button" className="chip" aria-pressed={show === l} onClick={() => setShow(l)}>
              {l === 'all' ? '全部' : SPELL_LEVEL_LABEL[l]}
            </button>
          ))}
        </div>
      )}
      {wizard && (
        <Pick
          label="法术书"
          need={bookNeed}
          options={spellOptions(leveled.filter(shown), card.spellbook)}
          chosen={card.spellbook}
          locked={old?.spellbook ?? []}
          onChange={(v) => set((c) => ({ ...c, spellbook: v, prepared: c.prepared.filter((p) => v.includes(p)) }))}
          describe={describeSpell(rules)}
        />
      )}
      <Pick
        label={wizard ? '准备的法术（从法术书里）' : '准备的法术'}
        need={pNeed}
        options={spellOptions((wizard ? leveled.filter((s) => card.spellbook.includes(s.key)) : leveled).filter(shown), card.prepared)}
        chosen={card.prepared}
        onChange={(v) => set((c) => ({ ...c, prepared: v }))}
        describe={describeSpell(rules)}
      />
    </div>
  );
}

// ==================== 装备 ====================

export function EquipmentStep({ rules, card, set, levelUp }: StepProps) {
  const cls = classOf(rules, card.class)!;
  const bg = rules.backgrounds.find((b) => b.key === card.background)!;
  const optionText = (o: ClassData['equipment'][number]) =>
    [...o.items.map((i) => `${itemName(rules, i.key)}${i.qty > 1 ? `×${i.qty}` : ''}`), o.money ? formatMoney(o.money) : ''].filter(Boolean).join('、');
  const inv = card.inventory;
  return (
    <div className="five-step">
      {!levelUp && (
        <>
          <Radio
            label={`${cls.name}的起始装备`}
            options={cls.equipment.map((o, i) => ({ key: String(i), name: `第 ${i + 1} 套`, text: optionText(o) }))}
            value={String(card.equipmentChoice.class)}
            onChange={(k) => set((c) => withStartingGear({ ...c, equipmentChoice: { ...c.equipmentChoice, class: Number(k) } }, rules))}
          />
          <Radio
            label={`背景「${bg.name}」的起始装备`}
            options={bg.equipment.map((o, i) => ({ key: String(i), name: `第 ${i + 1} 套`, text: optionText(o) }))}
            value={String(card.equipmentChoice.background)}
            onChange={(k) => set((c) => withStartingGear({ ...c, equipmentChoice: { ...c.equipmentChoice, background: Number(k) } }, rules))}
          />
        </>
      )}
      <GearSlots rules={rules} card={card} onChange={(equipped) => set((c) => ({ ...c, equipped }))} />
      <p className="five-line">
        <span className="five-label">带着</span>
        {inv.map((i) => `${itemName(rules, i.key)}${i.qty > 1 ? `×${i.qty}` : ''}`).join('、') || '什么都没有'}
      </p>
      <p className="five-line">
        <span className="five-label">钱</span>
        {formatMoney(card.money)}
      </p>
    </div>
  );
}

/** 穿着、拿着的：护甲（受过训练的）、盾牌、主手、副手，从带着的东西里挑。 */
export function GearSlots({ rules, card, onChange }: { rules: RulesData; card: Card5eData; onChange: (eq: Card5eData['equipped']) => void }) {
  const cls = classOf(rules, card.class)!;
  const inv = card.inventory;
  const armors = inv.filter((i) => {
    const a = armorOf(rules, i.key);
    return a && a.kind !== 'shield' && armorTrained(card, cls, a.kind);
  });
  const shields = inv.filter((i) => armorOf(rules, i.key)?.kind === 'shield');
  const weapons = inv.filter((i) => weaponOf(rules, i.key));
  const slot = (key: keyof Card5eData['equipped'], v: string) => onChange({ ...card.equipped, [key]: v || null });
  const select = (key: keyof Card5eData['equipped'], label: string, none: string, items: typeof inv) => (
    <label className="field-inline">
      {label}
      <select value={card.equipped[key] ?? ''} onChange={(e) => slot(key, e.target.value)}>
        <option value="">{none}</option>
        {items.map((i) => (
          <option key={i.key} value={i.key}>
            {itemName(rules, i.key)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <fieldset className="five-pick">
      <legend>穿着、拿着的</legend>
      <div className="five-slots">
        {select('armor', '护甲', '不穿', armors)}
        {select('shield', '盾牌', '不拿', shields)}
        {select('main', '主手', '空手', weapons)}
        {select('off', '副手', '空手', weapons)}
      </div>
    </fieldset>
  );
}
