import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage, type Invite, type RegistrationSettings, type User } from '../../api';
import { CopyButton, Field } from '../../components/bits';
import { CurrencySelect } from '../../components/CurrencySwitch';
import { currentCurrency, fromUsd, useCurrency, type Currency } from '../../currency';
import { formatDate, money } from '../../format';
import { amountText, ErrorLine, has } from './common';

// ==================== 邀请码 ====================

const registerLink = (code: string) => `${location.origin}/register?code=${code}`;

/**
 * 注册：应急开关（一键暂停注册：用邀请码注册、开放注册、新开游客都停）、注册方式（只能用邀请码 / 开放注册）、
 * 开放注册的新账号送多少初始额度、每天最多送几份。开关和方式要「注册邀请码」权限，额度要「发放额度」权限。
 */
export function RegistrationPanel({ me }: { me: User }) {
  useCurrency();
  const [view, setView] = useState<RegistrationSettings | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const canSwitch = has(me, 'invites');

  useEffect(() => {
    api<RegistrationSettings>('GET', '/api/admin/registration')
      .then(setView)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  async function put(path: string, body: unknown) {
    setBusy(true);
    setError('');
    try {
      setView(await api<RegistrationSettings>('PUT', `/api/admin/registration/${path}`, body));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!view) return <ErrorLine error={error} />;
  return (
    <section className="registration-panel" aria-label="注册">
      {view.paused && (
        <div className="registration-paused" role="status">
          <strong>注册暂停中</strong>
          <span>用邀请码注册、开放注册、新开游客都停了。</span>
          {canSwitch && (
            <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void put('pause', { paused: false })}>
              恢复注册
            </button>
          )}
        </div>
      )}
      <div className="registration-row">
        <span className="registration-label">注册方式</span>
        <span className="segmented" role="group" aria-label="注册方式">
          {(['invite', 'open'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={view.mode === mode ? 'segment is-on' : 'segment'}
              aria-pressed={view.mode === mode}
              disabled={!canSwitch || busy}
              onClick={() => {
                if (view.mode === mode) return;
                if (mode === 'open' && !window.confirm('开放注册？不用邀请码也能注册新账号。')) return;
                void put('mode', { mode });
              }}
            >
              {mode === 'invite' ? '只能用邀请码' : '开放注册'}
            </button>
          ))}
        </span>
        {canSwitch && !view.paused && (
          <button type="button" className="btn btn-small btn-danger registration-pause" disabled={busy} onClick={() => void put('pause', { paused: true })}>
            暂停注册
          </button>
        )}
      </div>
      <TrialSetting view={view} canEdit={has(me, 'credit')} onSaved={setView} />
      <ErrorLine error={error} />
    </section>
  );
}

/** 开放注册的新账号送多少初始额度、每天最多送几份。 */
function TrialSetting({ view, canEdit, onSaved }: { view: RegistrationSettings; canEdit: boolean; onSaved: (v: RegistrationSettings) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftCurrency, setDraftCurrency] = useState<Currency>(currentCurrency);
  const [daily, setDaily] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      onSaved(await api<RegistrationSettings>('PUT', '/api/admin/registration/trial', { amount: Number(draft), currency: draftCurrency, daily: Number(daily) }));
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <p className="registration-row">
        <span>
          开放注册的初始额度 <strong>{money(view.openStartCredit)}</strong>，每天最多送 <strong>{view.openDailyTrials}</strong> 份，今天送了 {view.trialsToday} 份
        </span>
        {canEdit && (
          <button
            type="button"
            className="btn btn-small btn-quiet"
            onClick={() => {
              const c = currentCurrency();
              setDraftCurrency(c);
              setDraft(amountText(fromUsd(view.openStartCredit, c)));
              setDaily(String(view.openDailyTrials));
              setError('');
              setEditing(true);
            }}
          >
            修改
          </button>
        )}
      </p>
    );
  }
  return (
    <form className="inline-form trial-form" onSubmit={save}>
      <Field label="开放注册的初始额度" htmlFor="trial-credit">
        <span className="money-input">
          <input id="trial-credit" type="number" min="0" step="any" inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <CurrencySelect value={draftCurrency} onChange={setDraftCurrency} />
        </span>
      </Field>
      <Field label="每天最多送几份" htmlFor="trial-daily">
        <input id="trial-daily" type="number" min="0" step="1" inputMode="numeric" value={daily} onChange={(e) => setDaily(e.target.value)} />
      </Field>
      <button className="btn btn-primary btn-small" disabled={busy || draft.trim() === '' || daily.trim() === ''}>
        {busy ? '正在保存……' : '保存'}
      </button>
      <button type="button" className="btn btn-small btn-quiet" onClick={() => setEditing(false)}>
        取消
      </button>
      <ErrorLine error={error} />
    </form>
  );
}

export function InvitesTab() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [days, setDays] = useState(7);
  const [fresh, setFresh] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setInvites((await api<{ invites: Invite[] }>('GET', '/api/admin/invites')).invites);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ invite: Invite }>('POST', '/api/admin/invites', { note, days });
      setFresh(r.invite);
      setNote('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(invite: Invite) {
    if (!window.confirm(`撤销邀请码 ${invite.code}？撤销后这个码就不能用来注册了。`)) return;
    try {
      await api('DELETE', `/api/admin/invites/${invite.id}`);
      if (fresh?.id === invite.id) setFresh(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const inviteStatus = (i: Invite) => (i.status === 'used' ? `${i.usedBy?.displayName ?? '有人'} 已用` : i.status === 'expired' ? '已过期' : '未使用');

  return (
    <section className="section" aria-label="注册邀请码">
      <ErrorLine error={error} />
      <form className="inline-form" onSubmit={createInvite}>
        <Field label="备注（选填）" htmlFor="invite-note">
          <input id="invite-note" maxLength={40} value={note} onChange={(e) => setNote(e.target.value)} placeholder="这个邀请码是给谁的" />
        </Field>
        <Field label="有效期" htmlFor="invite-days">
          <select id="invite-days" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[1, 3, 7, 30].map((d) => (
              <option key={d} value={d}>
                {d} 天
              </option>
            ))}
          </select>
        </Field>
        <button className="btn btn-primary" disabled={busy}>
          生成邀请码
        </button>
      </form>

      {fresh && (
        <div className="callout" role="status">
          <p>
            新的邀请码 <span className="code">{fresh.code}</span>，把注册链接发给朋友：
          </p>
          <p className="link-line">{registerLink(fresh.code)}</p>
          <CopyButton text={registerLink(fresh.code)} label="复制注册链接" />
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">邀请码</th>
              <th scope="col">备注</th>
              <th scope="col">状态</th>
              <th scope="col">有效期到</th>
              <th scope="col">
                <span className="visually-hidden">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  还没有邀请码。
                </td>
              </tr>
            )}
            {invites.map((i) => (
              <tr key={i.id} className={i.status === 'unused' ? '' : 'is-dim'}>
                <td>
                  <span className="code">{i.code}</span>
                </td>
                <td>{i.note || '—'}</td>
                <td>{inviteStatus(i)}</td>
                <td>{i.expiresAt ? formatDate(i.expiresAt) : '不限'}</td>
                <td className="row-actions">
                  {i.status === 'unused' && (
                    <>
                      <CopyButton text={registerLink(i.code)} label="复制链接" className="btn btn-small btn-quiet" />
                      <button type="button" className="btn btn-small btn-quiet btn-danger-text" onClick={() => void revoke(i)}>
                        撤销
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
