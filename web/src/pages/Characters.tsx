import { useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage, type CardRankings, type CardsPage, type CardView, type ChestResult, type DuelView, type GearView } from '../api';
import { gearEffectText, gearTotals } from '../../../shared/gear2';
import {
  ATTRIBUTES2,
  CARD2_MAX,
  CARD2_SPECIALTY_COST,
  CARD2_SPECIALTY_GROUPS,
  CARD2_SPECIALTY_MAX,
  CARD2_START_MAX,
  CARD2_START_MIN,
  CARD2_START_TOTAL,
  EQUIP_SLOT_LABEL,
  EQUIP_SLOT_PART,
  RARITY_KEYS,
  RARITY_LABEL,
  RESULT_LABEL,
  emptyAttributes2,
  raiseCost,
  type Attribute2,
  type Attributes2,
  type EquipSlot,
} from '../../../shared/rules2';
import { Modal } from '../components/Modal';
import { formatDate, sign } from '../format';
import { Link, useLocation } from '../router';
import { Cards5eTab } from './Characters5e';

// 我的角色（V0.7.0）：自带角色卡（规则第二版，只在地下城里用）。做卡、用成长点、穿装备、研读秘籍、开宝箱、切磋。
// V0.7.1：装备是魔兽世界那样的人物栏，浑身十六个格子；专长从列表里挑。

type Card = CardView;
type Page = CardsPage & { duels: DuelView[] };

type Tab = 'cards' | 'duel' | '5e';

export function CharactersPage() {
  const { query } = useLocation();
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>(query.get('tab') === 'duel' ? 'duel' : query.get('tab') === '5e' ? '5e' : 'cards');
  const [creating, setCreating] = useState(false);
  const [chest, setChest] = useState<ChestResult | null>(null);
  const [busy, setBusy] = useState(false);
  const learnKey = query.get('learn');

  async function load() {
    try {
      setPage(await api<Page>('GET', '/api/cards'));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    document.title = '我的角色 - 龙娘跑团';
    void load();
  }, []);

  async function openChest() {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ result: ChestResult }>('POST', '/api/chests/open');
      setChest(r.result);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!page) return <div className="characters-page">{error ? <p className="form-error">{error}</p> : <p className="muted">正在读……</p>}</div>;

  return (
    <div className="characters-page">
      <header className="page-head">
        <h1>我的角色</h1>
        <p className="muted">
          角色卡 {page.cards.length}/{CARD2_MAX} 张 · 龙晶 {page.crystals}
        </p>
      </header>

      <div className="picker-tabs" role="tablist" aria-label="我的角色">
        <button type="button" role="tab" className="picker-tab" aria-selected={tab === 'cards'} onClick={() => setTab('cards')}>
          角色卡
        </button>
        <button type="button" role="tab" className="picker-tab" aria-selected={tab === 'duel'} onClick={() => setTab('duel')}>
          切磋（今天还能 {page.duelsLeft} 次）
        </button>
        <button type="button" role="tab" className="picker-tab" aria-selected={tab === '5e'} onClick={() => setTab('5e')}>
          5E 角色
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {tab === 'cards' && (
        <>
          {(page.chests > 0 || chest) && (
            <section className="chest-bar">
              <span>宝箱 × {page.chests}</span>
              {page.chests > 0 && (
                <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void openChest()}>
                  开宝箱
                </button>
              )}
              {chest && <ChestLine result={chest} />}
            </section>
          )}

          {page.manuals.length > 0 && <Manuals page={page} preselect={learnKey} onDone={load} />}

          <div className="card-list">
            {page.cards.map((c) => (
              <CardPanel key={c.id} card={c} page={page} onChanged={load} />
            ))}
          </div>

          {page.cards.length < CARD2_MAX &&
            (creating ? (
              <CreateCard
                onDone={() => {
                  setCreating(false);
                  void load();
                }}
                onCancel={() => setCreating(false)}
              />
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
                做一张新卡
              </button>
            ))}

          {page.cards.length === 0 && !creating && <p className="empty">还没有角色卡。做一张，带它去地下城。</p>}
        </>
      )}

      {tab === 'duel' && <DuelTab page={page} onDone={load} />}
      {tab === '5e' && <Cards5eTab />}
    </div>
  );
}

function ChestLine({ result }: { result: ChestResult }) {
  return (
    <span className="chest-result">
      开出 {result.crystals} 龙晶
      {result.item && `、${result.item.name}×${result.item.count}`}
      {result.gear && (
        <>
          、<span className={`gear-name rarity-${result.gear.rarity}`}>{result.gear.name}</span>（{RARITY_LABEL[result.gear.rarity]}）
          {result.gear.duplicate ? `，已经有了，折成 ${result.gear.duplicate} 龙晶` : ''}
        </>
      )}
    </span>
  );
}

// ---------- 一张卡 ----------

/** 人物栏（照魔兽世界）：左边一列、右边一列，中间是名字和属性，下面两只手。 */
const DOLL_LEFT: EquipSlot[] = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist'];
const DOLL_RIGHT: EquipSlot[] = ['hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2'];
const DOLL_HANDS: EquipSlot[] = ['mainHand', 'offHand'];

function CardPanel({ card, page, onChanged }: { card: Card; page: Page; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [specialty, setSpecialty] = useState('');
  /** 点开了哪个格子（换装备的对话框）。 */
  const [picking, setPicking] = useState<EquipSlot | null>(null);

  async function call(method: string, url: string, body?: unknown) {
    setBusy(true);
    setError('');
    try {
      await api(method as 'POST', url, body);
      await onChanged();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const locked = !!card.inRoom;
  const worn = Object.values(card.equipped).filter((g): g is GearView => !!g);
  const totals = gearTotals(worn);
  const legendary = worn.filter((g) => g.ability);
  const cell = (slot: EquipSlot) => (
    <SlotCell
      key={slot}
      slot={slot}
      item={card.equipped[slot] ?? null}
      open={picking === slot}
      onOpen={() => {
        setError('');
        setPicking(slot);
      }}
    />
  );

  return (
    <article className="card-panel">
      <section className="doll" aria-label={`${card.name}的装备`}>
        <div className="doll-grid">
          <ul className="doll-col doll-left">{DOLL_LEFT.map(cell)}</ul>
          <div className="doll-core">
            <header className="card-head">
              <h2>{card.name}</h2>
              <span className="card-power">战力 {card.power}</span>
              {card.inRoom && (
                <Link to={`/room/${card.inRoom.id}`} className="chip">
                  正在「{card.inRoom.name}」里
                </Link>
              )}
            </header>
            <dl className={card.points > 0 ? 'doll-attrs can-grow' : 'doll-attrs'}>
              {ATTRIBUTES2.map((a) => {
                const v = card.attributes[a.key];
                const cost = raiseCost(v);
                const attack = totals.weapon?.attribute === a.key ? totals.weapon.bonus : 0;
                const check = totals.checks[a.key]?.bonus ?? 0;
                return (
                  <div key={a.key} className="doll-attr" title={a.covers}>
                    <dt>{a.name}</dt>
                    <dd>
                      {sign(v)}
                      {attack > 0 && (
                        <span className="doll-gear" title={`${totals.weapon!.name}：攻击 +${attack}`}>
                          攻+{attack}
                        </span>
                      )}
                      {check > 0 && (
                        <span className="doll-gear" title={`${totals.checks[a.key]!.name}：检定 +${check}`}>
                          检+{check}
                        </span>
                      )}
                    </dd>
                    {card.points > 0 && (
                      <button
                        type="button"
                        className="attr-up"
                        disabled={busy || card.points < cost}
                        title={`加到 ${v + 1}，花 ${cost} 点`}
                        onClick={() => void call('POST', `/api/cards/${card.id}/grow`, { type: 'attribute', key: a.key })}
                      >
                        +1（{cost}）
                      </button>
                    )}
                  </div>
                );
              })}
            </dl>
            <p className="doll-vitals">
              <span>生命 {card.hpMax}</span>
              <span>精神 {card.mpMax}</span>
              <span>防御 {card.defense}</span>
              <span>减伤 {totals.reduction}</span>
            </p>
          </div>
          <ul className="doll-col doll-right">{DOLL_RIGHT.map(cell)}</ul>
          <ul className="doll-hands">{DOLL_HANDS.map(cell)}</ul>
        </div>
        {legendary.length > 0 && (
          <ul className="doll-abilities">
            {legendary.map((g) => (
              <li key={g.id}>
                <span className="gear-name rarity-legendary">{g.name}</span>
                {g.ability}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={picking !== null}
        onClose={() => {
          setPicking(null);
          setError('');
        }}
        title={picking ? `${card.name} · ${EQUIP_SLOT_LABEL[picking]}` : ''}
      >
        {picking && (
          <SlotPicker
            slot={picking}
            card={card}
            gear={page.gear}
            busy={busy}
            error={error}
            onPick={(gearId) => void call('PUT', `/api/cards/${card.id}/equip`, { slot: picking, gearId }).then((ok) => ok && setPicking(null))}
          />
        )}
      </Modal>

      {editing ? (
        <EditCard card={card} onDone={() => { setEditing(false); void onChanged(); }} onCancel={() => setEditing(false)} />
      ) : (
        <>
          {card.appearance && <p className="card-text">{card.appearance}</p>}
          {card.background && <p className="card-text muted">{card.background}</p>}
        </>
      )}

      <p className="vitals-line">
        成长点 {card.points}（用过 {card.spent}） · 切磋 {card.duel.wins} 胜 {card.duel.losses} 负
      </p>

      <p className="sheet-specialties">
        <span className="sheet-label-inline">专长</span>
        {card.specialties.join('、')}
      </p>
      {card.points >= CARD2_SPECIALTY_COST && card.specialties.length < CARD2_SPECIALTY_MAX && (
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (specialty) void call('POST', `/api/cards/${card.id}/grow`, { type: 'specialty', name: specialty }).then((ok) => ok && setSpecialty(''));
          }}
        >
          <SpecialtySelect value={specialty} label="新专长" taken={card.specialties} disabled={busy} onChange={setSpecialty} />
          <button className="btn btn-small" disabled={busy || !specialty}>
            学（{CARD2_SPECIALTY_COST} 点）
          </button>
        </form>
      )}

      {card.skills.length > 0 && (
        <>
          <h3 className="sheet-label">技能</h3>
          <ul className="skill-list">
            {card.skills.map((s) => (
              <li key={s.key}>
                <span className="skill-name">{s.name}</span>
                <span className="skill-cost">精神 {s.cost}</span>
                <span className="skill-text">{s.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {card.history.length > 0 && (
        <details className="card-history">
          <summary>经历（{card.history.length}）</summary>
          <ul>
            {card.history.map((h, i) => (
              <li key={i}>
                《{h.title}》{h.level ? ` 难度 ${h.level}` : ''} · {h.result === 'dead' ? '死在了里面' : h.result ? RESULT_LABEL[h.result] : ''}
                {h.points ? ` · 成长点 +${h.points}` : ''}
                {h.loot.length > 0 && ` · 带出：${h.loot.join('、')}`}
                <span className="muted"> {formatDate(h.at)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {error && picking === null && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!editing && (
        <div className="card-actions">
          {/* V0.8.1：个人主页上展示哪几张卡 */}
          <label className="choice card-on-profile">
            <input
              type="checkbox"
              checked={card.onProfile}
              disabled={busy}
              onChange={(e) => void call('PUT', `/api/cards/${card.id}`, { onProfile: e.target.checked })}
            />
            <span>在主页展示</span>
          </label>
          <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => setEditing(true)}>
            改名字、外貌、背景
          </button>
          <button
            type="button"
            className="btn btn-small btn-quiet"
            disabled={busy || locked}
            onClick={() => {
              if (window.confirm(`删掉「${card.name}」？成长点、技能都会没了（装备留在账号里）。`)) void call('DELETE', `/api/cards/${card.id}`);
            }}
          >
            删掉
          </button>
        </div>
      )}
    </article>
  );
}

/** 人物栏的一个格子：穿着的装备（名字的颜色按稀有度），空着就写「空」。点开换装备。 */
function SlotCell({ slot, item, open, onOpen }: { slot: EquipSlot; item: GearView | null; open: boolean; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        className={item ? `slot-cell gear-${item.rarity}` : 'slot-cell is-empty'}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={item ? `${item.name}（${RARITY_LABEL[item.rarity]}）${gearEffectText(item)}` : undefined}
        onClick={onOpen}
      >
        <span className="slot-cell-label">{EQUIP_SLOT_LABEL[slot]}</span>
        <span className="slot-cell-item gear-name">{item ? item.name : '空'}</span>
      </button>
    </li>
  );
}

const RARITY_RANK = Object.fromEntries(RARITY_KEYS.map((r, i) => [r, i])) as Record<GearView['rarity'], number>;

/** 换一个格子的装备：穿着的（能卸下）、账号里能穿进这一格的（加得多的在前；别的卡穿着的也能拿过来）。 */
function SlotPicker({
  slot,
  card,
  gear,
  busy,
  error,
  onPick,
}: {
  slot: EquipSlot;
  card: Card;
  gear: Page['gear'];
  busy: boolean;
  error: string;
  onPick: (gearId: number | null) => void;
}) {
  const current = card.equipped[slot] ?? null;
  const options = gear
    .filter((g) => g.part === EQUIP_SLOT_PART[slot] && g.id !== current?.id)
    .sort((a, b) => b.bonus - a.bonus || RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || a.id - b.id);
  return (
    <div className="slot-picker">
      {current && (
        <div className={`slot-current gear gear-${current.rarity}`}>
          <span className="gear-name">{current.name}</span>
          <span className="gear-meta">
            {RARITY_LABEL[current.rarity]} · {gearEffectText(current)}
          </span>
          <button type="button" className="btn btn-small btn-quiet slot-off" disabled={busy} onClick={() => onPick(null)}>
            卸下
          </button>
          <span className="gear-ability">{current.ability ?? current.use}</span>
        </div>
      )}
      {options.length > 0 ? (
        <ul className="slot-options">
          {options.map((g) => (
            <li key={g.id}>
              <button type="button" className={`slot-option gear gear-${g.rarity}`} disabled={busy} onClick={() => onPick(g.id)}>
                <span className="gear-name">{g.name}</span>
                <span className="gear-meta">
                  {RARITY_LABEL[g.rarity]} · {gearEffectText(g)}
                </span>
                {g.wornBy && <span className="slot-option-worn">{g.wornBy.cardId === card.id ? '在另一格' : `「${g.wornBy.name}」穿着`}</span>}
                <span className="gear-ability">{g.ability ?? g.use}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          {current ? '没有别的能换' : '没有能穿的'} · <Link to="/shop?t=gear">去商城</Link>
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** 挑一个专长（按组列出来）；taken 里的（已经有的、另一个框选了的）不能选。 */
function SpecialtySelect({
  value,
  label,
  taken,
  disabled,
  onChange,
}: {
  value: string;
  label: string;
  taken: readonly string[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} aria-label={label} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}</option>
      {CARD2_SPECIALTY_GROUPS.map((g) => (
        <optgroup key={g.name} label={g.name}>
          {g.list.map((s) => (
            <option key={s} value={s} disabled={taken.includes(s)}>
              {s}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// ---------- 做卡、改卡 ----------

function AttributeEditor({ value, onChange, disabled }: { value: Attributes2; onChange: (v: Attributes2) => void; disabled: boolean }) {
  const sum = ATTRIBUTES2.reduce((s, a) => s + value[a.key], 0);
  return (
    <fieldset className="field">
      <legend>
        属性（七项加起来 {CARD2_START_TOTAL}，每项 {CARD2_START_MIN}～+{CARD2_START_MAX}；现在 {sum}）
      </legend>
      <div className="attr-editor">
        {ATTRIBUTES2.map((a) => (
          <label key={a.key} title={a.covers}>
            <span>{a.name}</span>
            <select value={value[a.key]} disabled={disabled} onChange={(e) => onChange({ ...value, [a.key]: Number(e.target.value) as number })}>
              {[-1, 0, 1, 2].map((n) => (
                <option key={n} value={n}>
                  {sign(n)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CreateCard({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState('');
  const [background, setBackground] = useState('');
  const [attributes, setAttributes] = useState<Attributes2>({ ...emptyAttributes2(), strength: 1, constitution: 1, agility: 1, perception: 1 });
  const [specialties, setSpecialties] = useState(['', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('POST', '/api/cards', { name, appearance, background, attributes, specialties });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form card-form" onSubmit={(e) => void submit(e)} noValidate>
      <h2>新的角色卡</h2>
      <div className="field">
        <label htmlFor="card-name">名字</label>
        <input id="card-name" maxLength={20} value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="card-look">外貌</label>
        <textarea id="card-look" maxLength={200} rows={2} value={appearance} disabled={busy} onChange={(e) => setAppearance(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="card-bg">背景</label>
        <textarea id="card-bg" maxLength={300} rows={3} value={background} disabled={busy} onChange={(e) => setBackground(e.target.value)} />
      </div>
      <AttributeEditor value={attributes} onChange={setAttributes} disabled={busy} />
      <fieldset className="field">
        <legend>两个专长</legend>
        <div className="inline-inputs">
          {specialties.map((s, i) => (
            <SpecialtySelect
              key={i}
              value={s}
              label={`专长 ${i + 1}`}
              taken={specialties.filter((_, j) => j !== i)}
              disabled={busy}
              onChange={(v) => setSpecialties(specialties.map((x, j) => (j === i ? v : x)))}
            />
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? '正在保存……' : '做好了'}
        </button>
        <button type="button" className="btn btn-quiet" disabled={busy} onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

function EditCard({ card, onDone, onCancel }: { card: Card; onDone: () => void; onCancel: () => void }) {
  const fresh = card.spent === 0 && card.history.length === 0 && !card.inRoom;
  const [name, setName] = useState(card.name);
  const [appearance, setAppearance] = useState(card.appearance);
  const [background, setBackground] = useState(card.background);
  const [attributes, setAttributes] = useState<Attributes2>(card.attributes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('PUT', `/api/cards/${card.id}`, { name, appearance, background, ...(fresh ? { attributes } : {}) });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form card-form" onSubmit={(e) => void submit(e)} noValidate>
      <div className="field">
        <label htmlFor={`card-name-${card.id}`}>名字</label>
        <input id={`card-name-${card.id}`} maxLength={20} value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor={`card-look-${card.id}`}>外貌</label>
        <textarea id={`card-look-${card.id}`} maxLength={200} rows={2} value={appearance} disabled={busy} onChange={(e) => setAppearance(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor={`card-bg-${card.id}`}>背景</label>
        <textarea id={`card-bg-${card.id}`} maxLength={300} rows={3} value={background} disabled={busy} onChange={(e) => setBackground(e.target.value)} />
      </div>
      {fresh && <AttributeEditor value={attributes} onChange={setAttributes} disabled={busy} />}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-small btn-primary" disabled={busy}>
          保存
        </button>
        <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

// ---------- 秘籍 ----------

function Manuals({ page, preselect, onDone }: { page: Page; preselect: string | null; onDone: () => Promise<void> }) {
  const [manual, setManual] = useState(preselect && page.manuals.some((m) => m.key === preselect) ? preselect : (page.manuals[0]?.key ?? ''));
  const [cardId, setCardId] = useState<number>(page.cards[0]?.id ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chosen = page.manuals.find((m) => m.key === manual);

  async function learn() {
    setBusy(true);
    setError('');
    try {
      await api('POST', `/api/cards/${cardId}/learn`, { manual });
      await onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="manuals">
      <h2 className="sheet-label">秘籍</h2>
      <div className="inline-inputs">
        <select value={manual} aria-label="秘籍" disabled={busy} onChange={(e) => setManual(e.target.value)}>
          {page.manuals.map((m) => (
            <option key={m.key} value={m.key}>
              {m.name} ×{m.count}
            </option>
          ))}
        </select>
        <select value={cardId} aria-label="给哪张卡" disabled={busy || !page.cards.length} onChange={(e) => setCardId(Number(e.target.value))}>
          {page.cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-small btn-primary" disabled={busy || !page.cards.length || !manual} onClick={() => void learn()}>
          研读
        </button>
      </div>
      {chosen && <p className="muted">{chosen.text}</p>}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}

// ---------- 切磋 ----------

function DuelTab({ page, onDone }: { page: Page; onDone: () => Promise<void> }) {
  const [rankings, setRankings] = useState<CardRankings | null>(null);
  const [mine, setMine] = useState<number>(page.cards[0]?.id ?? 0);
  const [result, setResult] = useState<DuelView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<CardRankings>('GET', '/api/rankings/cards')
      .then(setRankings)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  async function duel(opponent: number) {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ duel: DuelView }>('POST', `/api/cards/${mine}/duel`, { opponent });
      setResult(r.duel);
      await onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!page.cards.length) return <p className="empty">先做一张角色卡才能切磋。</p>;
  const others = (rankings?.power ?? []).filter((r) => !r.me);
  return (
    <section className="duel-tab">
      <div className="field">
        <label htmlFor="duel-mine">出哪张卡</label>
        <select id="duel-mine" value={mine} disabled={busy} onChange={(e) => setMine(Number(e.target.value))}>
          {page.cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}（战力 {c.power}）
            </option>
          ))}
        </select>
      </div>
      {error && <p className="form-error">{error}</p>}
      {result && <DuelResult duel={result} />}
      <h2 className="sheet-label">挑一个对手</h2>
      {others.length ? (
        <ul className="duel-opponents">
          {others.map((r) => (
            <li key={r.cardId}>
              <span>
                {r.name}
                <span className="muted">（{r.owner.displayName} · 战力 {r.power} · {r.wins} 胜）</span>
              </span>
              <button type="button" className="btn btn-small" disabled={busy || page.duelsLeft <= 0} onClick={() => void duel(r.cardId)}>
                切磋
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">还没有别人的角色卡。</p>
      )}
      {page.duels.length > 0 && (
        <>
          <h2 className="sheet-label">最近的切磋</h2>
          <ul className="duel-history">
            {page.duels.map((d) => (
              <li key={d.id}>
                {d.a.card}（{d.a.displayName}）对 {d.b.card}（{d.b.displayName}）：{d.winner === 'a' ? d.a.card : d.b.card} 赢
                {d.myReward ? `，你得了 ${d.myReward} 龙晶` : ''}
                <span className="muted"> {formatDate(d.at)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function DuelResult({ duel }: { duel: DuelView }) {
  const name = (k: Attribute2) => ATTRIBUTES2.find((a) => a.key === k)?.name ?? k;
  return (
    <section className="duel-result" aria-live="polite">
      <h3>
        {duel.a.card} 对 {duel.b.card}：{duel.winner === 'a' ? duel.a.card : duel.b.card} 赢了
        {duel.myReward ? `，得到 ${duel.myReward} 龙晶` : ''}
      </h3>
      <ol>
        {duel.rounds.map((r, i) => (
          <li key={i}>
            比{name(r.attribute)}：{r.a.dice.join('+')}
            {r.a.bonus ? sign(r.a.bonus) : ''} = {r.a.total}
            {r.a.pet && `（${r.a.pet.name}帮忙重掷，原来 ${r.a.pet.first}）`} 对 {r.b.dice.join('+')}
            {r.b.bonus ? sign(r.b.bonus) : ''} = {r.b.total}
            {r.b.pet && `（${r.b.pet.name}帮忙重掷，原来 ${r.b.pet.first}）`} · {r.winner === 'tie' ? '平' : r.winner === 'a' ? `${duel.a.card}赢` : `${duel.b.card}赢`}
          </li>
        ))}
      </ol>
    </section>
  );
}
