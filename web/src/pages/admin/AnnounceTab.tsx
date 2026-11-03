import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage, type AdminAnnouncement } from '../../api';
import { useAuth } from '../../auth';
import { ANNOUNCE_TEMPLATES, type AnnounceGrantKind, type AnnounceTemplate } from '../../../../shared/announce';
import { Field } from '../../components/bits';
import { CurrencySelect } from '../../components/CurrencySwitch';
import { currentCurrency, type Currency } from '../../currency';
import { formatDateTime } from '../../format';
import { ErrorLine, has } from './common';

// ==================== 公告 ====================

type Audience = 'all' | 'user' | 'admin' | 'guest' | 'users';
/** 发过的公告先列几条，内容点标题才展开（V0.8.3）。 */
const ADMIN_ANNOUNCEMENTS_SHOWN = 10;

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'all', label: '全服（所有人）' },
  { value: 'user', label: '普通用户' },
  { value: 'admin', label: '管理员和站长' },
  { value: 'guest', label: '游客' },
  { value: 'users', label: '指定的人' },
];

export function AnnounceTab() {
  const { user } = useAuth();
  const [list, setList] = useState<AdminAnnouncement[] | null>(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [names, setNames] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState('');
  /** 全服发额度、发龙晶（V0.6.0 的公告模板）：选了这种模板才有。 */
  const [grant, setGrant] = useState<AnnounceGrantKind | null>(null);
  const [amount, setAmount] = useState('');
  const [grantCurrency, setGrantCurrency] = useState<Currency>(currentCurrency);
  const canGrant = !!user && has(user, 'credit');
  /** 展开了内容的公告。 */
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [all, setAll] = useState(false);

  function toggle(id: number) {
    setOpen((old) => {
      const next = new Set(old);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function applyTemplate(t: AnnounceTemplate) {
    setTitle(t.title);
    setBody(t.body);
    setAudience(t.audience);
    setGrant(t.grant ?? null);
    setAmount('');
    setSent('');
    setError('');
  }

  const load = useCallback(async () => {
    try {
      setList((await api<{ announcements: AdminAnnouncement[] }>('GET', '/api/admin/announcements')).announcements);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSent('');
    try {
      const usernames = names
        .split(/[\s,，、;；]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (grant) {
        const what = grant === 'credit' ? `每人 ${amount} ${grantCurrency === 'CNY' ? '元' : '美元'} AI 额度` : `每人 ${amount} 龙晶`;
        if (!window.confirm(`发公告「${title}」，同时给收到的正式账号${what}？发了收不回来。`)) return;
      }
      const r = await api<{ id: number; recipients: number }>('POST', '/api/admin/announcements', {
        title,
        body,
        audience,
        ...(audience === 'users' ? { usernames } : {}),
        ...(grant ? { grant: { kind: grant, amount: Number(amount), ...(grant === 'credit' ? { currency: grantCurrency } : {}) } } : {}),
      });
      setSent(grant ? `已经发出「${title}」，给 ${r.recipients} 个账号发了` : `已经发出「${title}」`);
      setTitle('');
      setBody('');
      setNames('');
      setGrant(null);
      setAmount('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: AdminAnnouncement) {
    if (!window.confirm(`删除公告「${a.title}」？大家就看不到了。`)) return;
    try {
      await api('DELETE', `/api/admin/announcements/${a.id}`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <section className="section" aria-label="公告">
      <form className="form announce-form" onSubmit={send}>
        <div className="announce-templates" role="group" aria-label="模板">
          {ANNOUNCE_TEMPLATES.filter((t) => !t.grant || canGrant).map((t) => (
            <button key={t.key} type="button" className="btn btn-small btn-quiet" onClick={() => applyTemplate(t)}>
              {t.name}
            </button>
          ))}
        </div>
        <Field label="标题" htmlFor="ann-title">
          <input id="ann-title" maxLength={40} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="内容" htmlFor="ann-body">
          <textarea id="ann-body" rows={5} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <fieldset className="field">
          <legend>发给谁</legend>
          <div className="audience-list">
            {AUDIENCE_OPTIONS.map((o) => (
              <label key={o.value} className="choice">
                <input type="radio" name="audience" value={o.value} checked={audience === o.value} onChange={() => setAudience(o.value)} />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {audience === 'users' && (
          <Field label="用户名" htmlFor="ann-users">
            <textarea id="ann-users" rows={3} value={names} onChange={(e) => setNames(e.target.value)} placeholder="要发给的人的用户名" />
          </Field>
        )}
        {grant && (
          <div className="announce-grant">
            <Field label={grant === 'credit' ? '每人发多少额度' : '每人发多少龙晶'} htmlFor="ann-amount">
              <span className="inline-inputs">
                <input id="ann-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                {grant === 'credit' ? <CurrencySelect value={grantCurrency} onChange={setGrantCurrency} /> : <span>龙晶</span>}
              </span>
            </Field>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => setGrant(null)}>
              只发公告，不发{grant === 'credit' ? '额度' : '龙晶'}
            </button>
          </div>
        )}
        <ErrorLine error={error} />
        {sent && (
          <p className="hint" role="status">
            {sent}
          </p>
        )}
        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy || !title.trim() || !body.trim() || (audience === 'users' && !names.trim()) || (!!grant && !Number(amount))}>
            {busy ? '正在发……' : grant ? (grant === 'credit' ? '发公告并发额度' : '发公告并发龙晶') : '发公告'}
          </button>
        </div>
      </form>

      <h2 className="section-title">发过的公告</h2>
      {list && list.length === 0 && <p className="empty">还没有发过公告。</p>}
      <ul className="announcement-admin-list">
        {(list ?? []).slice(0, all ? undefined : ADMIN_ANNOUNCEMENTS_SHOWN).map((a) => (
          <li key={a.id} className="announcement-admin">
            <div className="announcement-admin-head">
              <h3>
                <button type="button" className="announcement-admin-toggle" aria-expanded={open.has(a.id)} onClick={() => toggle(a.id)}>
                  {a.title}
                </button>
              </h3>
              <button type="button" className="btn btn-small btn-quiet btn-danger-text" onClick={() => void remove(a)}>
                删除
              </button>
            </div>
            <p className="announcement-meta">
              {formatDateTime(a.at)}
              {a.by && `，${a.by}发布`}，发给{a.audienceLabel}，{a.reads} 人看过
            </p>
            {open.has(a.id) && <p className="pre-line">{a.body}</p>}
          </li>
        ))}
      </ul>
      {!all && (list?.length ?? 0) > ADMIN_ANNOUNCEMENTS_SHOWN && (
        <button type="button" className="btn btn-small btn-quiet announcement-more" onClick={() => setAll(true)}>
          更早的公告（{(list?.length ?? 0) - ADMIN_ANNOUNCEMENTS_SHOWN} 条）
        </button>
      )}
    </section>
  );
}
