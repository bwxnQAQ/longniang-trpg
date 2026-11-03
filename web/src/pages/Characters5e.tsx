// 我的角色 → 5E 角色（V0.9.0）：5E 角色卡（兼容第五版，1～5 级）。做卡、升级、长休时能换的（装备、准备的法术、精通、野兽形态）、
// 改名字外貌背景、在主页展示、删掉。打完剧本大厅里的 5E 模组挣到一级，在这里升。
import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { GuestNote } from '../components/GuestNote';
import { LEVEL_MAX_5E, SPELL_LEVEL_LABEL } from '../../../shared/5e/core';
import { alwaysPrepared, masteryCount, wildShapeForms } from '../../../shared/5e/class-rules';
import { cardProblems, classOf, classSpells, computeSheet, maxSpellLevel, weaponProficient } from '../../../shared/5e/sheet';
import type { Card5eData, Card5eView, RulesData } from '../../../shared/5e/types';
import { CARD2_APPEARANCE_MAX, CARD2_BACKGROUND_MAX, CARD2_NAME_MAX } from '../../../shared/rules2';
import { CardEditor, type CardMeta } from '../five/Editor';
import { CardSheet } from '../five/SheetView';
import { blankCard, levelUpDraft } from '../five/draft';
import { useRules5e } from '../five/rules';
import { GearSlots, Pick, describeSpell } from '../five/steps';
import { formatDate } from '../format';
import { Link } from '../router';

type Page = { cards: Card5eView[]; max: number };

export function Cards5eTab() {
  const { user } = useAuth();
  const guest = !!user?.isGuest;
  const { rules, error: rulesError } = useRules5e();
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    try {
      setPage(await api<Page>('GET', '/api/cards5e'));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(data: Card5eData, meta: CardMeta) {
    setBusy(true);
    setFormError('');
    try {
      await api('POST', '/api/cards5e', { ...meta, data });
      setCreating(false);
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const problem = error || rulesError;
  if (problem) return <p className="form-error">{problem}</p>;
  if (!page || !rules) return <p className="muted">正在读……</p>;

  if (creating) {
    return <CardEditor rules={rules} mode="create" start={blankCard(rules, 'fighter')} meta={{ name: '', appearance: '', background: '' }} busy={busy} error={formError} onSubmit={(d, m) => void create(d, m)} onCancel={() => setCreating(false)} />;
  }

  return (
    <div className="five-cards">
      {guest && <GuestNote what="做 5E 角色卡" />}
      <p className="muted">
        5E 角色卡 {page.cards.length}/{page.max} 张
      </p>
      {page.cards.map((c) => (
        <Card5ePanel key={c.id} rules={rules} card={c} onChanged={load} />
      ))}
      {page.cards.length < page.max && !guest && (
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          做一张 5E 角色卡
        </button>
      )}
    </div>
  );
}

function Card5ePanel({ rules, card, onChanged }: { rules: RulesData; card: Card5eView; onChanged: () => Promise<void> }) {
  const [mode, setMode] = useState<null | 'levelup' | 'remake' | 'rest' | 'text'>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = !!card.inRoom;
  const canLevel = card.data.earned > 0 && card.data.level < LEVEL_MAX_5E;
  const todo = cardProblems(card.data, rules, { todoOnly: true });

  async function call(method: 'PUT' | 'POST' | 'DELETE', url: string, body?: unknown) {
    setBusy(true);
    setError('');
    try {
      await api(method, url, body);
      setMode(null);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (mode === 'levelup' || mode === 'remake') {
    return (
      <CardEditor
        rules={rules}
        mode={mode}
        start={mode === 'levelup' ? levelUpDraft(card.data) : card.data}
        old={mode === 'levelup' ? card.data : null}
        meta={{ name: card.name, appearance: card.appearance, background: card.background }}
        busy={busy}
        error={error}
        onSubmit={(data) => void call(mode === 'levelup' ? 'POST' : 'PUT', mode === 'levelup' ? `/api/cards5e/${card.id}/level-up` : `/api/cards5e/${card.id}`, { data })}
        onCancel={() => {
          setMode(null);
          setError('');
        }}
      />
    );
  }

  return (
    <article className="five-card">
      <header className="five-card-head">
        <h2>{card.name}</h2>
        <span className="five-card-class">
          {card.sheet.speciesName}
          {card.sheet.className} {card.data.level} 级{card.sheet.subclassName ? `（${card.sheet.subclassName}）` : ''}
        </span>
        {card.inRoom && (
          <Link to={`/room/${card.inRoom.id}`} className="chip">
            正在「{card.inRoom.name}」里
          </Link>
        )}
        {canLevel && (
          <button type="button" className="btn btn-small btn-primary" disabled={busy || locked} onClick={() => setMode('levelup')}>
            升到 {card.data.level + 1} 级
          </button>
        )}
      </header>
      {todo.length > 0 && (
        <ul className="five-issues">
          {todo.map((t, i) => (
            <li key={i} className="is-todo">
              {t}
            </li>
          ))}
        </ul>
      )}
      {mode === 'text' ? (
        <TextForm card={card} busy={busy} onSave={(body) => void call('PUT', `/api/cards5e/${card.id}`, body)} onCancel={() => setMode(null)} />
      ) : (
        <>
          {card.appearance && <p className="card-text">{card.appearance}</p>}
          {card.background && <p className="card-text muted">{card.background}</p>}
        </>
      )}
      {mode === 'rest' ? (
        <RestForm rules={rules} card={card} busy={busy} onSave={(rest) => void call('PUT', `/api/cards5e/${card.id}`, { rest })} onCancel={() => setMode(null)} />
      ) : (
        <CardSheet rules={rules} data={card.data} sheet={card.sheet} who={false} />
      )}

      {card.history.length > 0 && (
        <details className="card-history">
          <summary>打过的模组（{card.history.length}）</summary>
          <ul>
            {card.history.map((h, i) => (
              <li key={i}>
                《{h.title}》{h.ending ? `「${h.ending}」` : ''} · {h.level} 级 · {h.survived ? '活着回来' : '死在了里面'}
                {!h.counted && h.survived ? '（这个模组不升级）' : ''}
                {h.loot.length > 0 && ` · 带出：${h.loot.join('、')}`}
                <span className="muted"> {formatDate(h.at)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {mode === null && (
        <div className="card-actions">
          <label className="choice card-on-profile">
            <input type="checkbox" checked={card.onProfile} disabled={busy} onChange={(e) => void call('PUT', `/api/cards5e/${card.id}`, { onProfile: e.target.checked })} />
            <span>在主页展示</span>
          </label>
          <button type="button" className="btn btn-small btn-quiet" disabled={busy || locked} onClick={() => setMode('rest')}>
            换装备、准备的法术
          </button>
          <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => setMode('text')}>
            改名字、外貌、背景
          </button>
          {card.editable && (
            <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => setMode('remake')}>
              重新做
            </button>
          )}
          <button
            type="button"
            className="btn btn-small btn-quiet"
            disabled={busy || locked}
            onClick={() => {
              if (window.confirm(`删掉「${card.name}」？等级和带着的东西都会没了。`)) void call('DELETE', `/api/cards5e/${card.id}`);
            }}
          >
            删掉
          </button>
        </div>
      )}
    </article>
  );
}

function TextForm({ card, busy, onSave, onCancel }: { card: Card5eView; busy: boolean; onSave: (b: CardMeta) => void; onCancel: () => void }) {
  const [v, setV] = useState<CardMeta>({ name: card.name, appearance: card.appearance, background: card.background });
  return (
    <form
      className="form five-text-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v);
      }}
    >
      <div className="field">
        <label htmlFor={`n5-${card.id}`}>名字</label>
        <input id={`n5-${card.id}`} value={v.name} maxLength={CARD2_NAME_MAX} required onChange={(e) => setV({ ...v, name: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor={`a5-${card.id}`}>外貌</label>
        <textarea id={`a5-${card.id}`} rows={2} maxLength={CARD2_APPEARANCE_MAX} value={v.appearance} onChange={(e) => setV({ ...v, appearance: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor={`b5-${card.id}`}>背景故事</label>
        <textarea id={`b5-${card.id}`} rows={3} maxLength={CARD2_BACKGROUND_MAX} value={v.background} onChange={(e) => setV({ ...v, background: e.target.value })} />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary btn-small" disabled={busy || !v.name.trim()}>
          保存
        </button>
        <button type="button" className="btn btn-small btn-quiet" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

/** 长休时能换的：穿着拿着的东西、准备的法术（法师从法术书里挑）、精通的武器、荒野变形的形态。 */
function RestForm({ rules, card, busy, onSave, onCancel }: { rules: RulesData; card: Card5eView; busy: boolean; onSave: (rest: Partial<Card5eData>) => void; onCancel: () => void }) {
  const [d, setD] = useState<Card5eData>(card.data);
  const cls = classOf(rules, d.class)!;
  const L = d.level;
  const sc = cls.spellcasting;
  const always = alwaysPrepared({ class: d.class, subclass: L >= 3 ? d.subclass : null, land: d.land, level: L });
  const spells = sc ? classSpells(rules, d.class, maxSpellLevel(cls, L)).filter((s) => s.level >= 1 && !always.includes(s.key) && (d.class !== 'wizard' || d.spellbook.includes(s.key))) : [];
  const mCount = masteryCount(d.class, L);
  const sheet = computeSheet(d, rules);
  const problems = cardProblems(d, rules);
  return (
    <form
      className="five-rest"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ equipped: d.equipped, prepared: d.prepared, masteries: d.masteries, wildShapes: d.wildShapes });
      }}
    >
      <GearSlots rules={rules} card={d} onChange={(equipped) => setD({ ...d, equipped })} />
      <p className="five-line">
        AC {sheet.ac} · 攻击：{sheet.attacks.filter((a) => a.kind === 'weapon').map((a) => a.name).join('、') || '徒手'}
      </p>
      {sc && (
        <Pick
          label={d.class === 'wizard' ? '准备的法术（从法术书里）' : '准备的法术'}
          need={sc.prepared[L - 1]}
          options={spells.map((s) => ({ key: s.key, name: s.name, note: SPELL_LEVEL_LABEL[s.level] }))}
          chosen={d.prepared}
          onChange={(v) => setD({ ...d, prepared: v })}
          describe={describeSpell(rules)}
        />
      )}
      {mCount > 0 && (
        <Pick
          label="武器精通"
          need={mCount}
          options={rules.weapons.filter((w) => weaponProficient(d, cls, w) && w.mastery && !(d.class === 'barbarian' && w.ranged)).map((w) => ({ key: w.key, name: w.name, note: rules.masteries.find((m) => m.key === w.mastery)?.name }))}
          chosen={d.masteries}
          onChange={(v) => setD({ ...d, masteries: v })}
        />
      )}
      {d.class === 'druid' && L >= 2 && (
        <Pick
          label="荒野变形的形态"
          need={wildShapeForms(L).count}
          options={rules.beasts.filter((b) => b.cr <= wildShapeForms(L).maxCr && !b.fly).map((b) => ({ key: b.key, name: b.name }))}
          chosen={d.wildShapes}
          onChange={(v) => setD({ ...d, wildShapes: v })}
        />
      )}
      {problems.length > 0 && (
        <ul className="five-issues">
          {problems.map((p, i) => (
            <li key={i} className="is-bad">
              {p}
            </li>
          ))}
        </ul>
      )}
      <div className="form-actions">
        <button className="btn btn-primary btn-small" disabled={busy || problems.length > 0}>
          保存
        </button>
        <button type="button" className="btn btn-small btn-quiet" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}
