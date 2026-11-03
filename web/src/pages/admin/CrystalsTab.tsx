import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage, type AdminPetsOverview } from '../../api';
import { useAuth } from '../../auth';
import { Field } from '../../components/bits';
import { formatDateTime } from '../../format';
import { Link } from '../../router';
import { EXCHANGE_LIMITS } from '../../../../shared/pets';
import { ErrorLine } from './common';

// ==================== 龙晶 ====================

/** 站长给自己全部解锁（V0.6.0，测试用）：商城里的吃的用的、装扮、头像框、骰子、称号各放一个，结局、明信片、成就全部记上，不发龙晶。 */
function UnlockAll() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  if (!user?.isOwner) return null;

  async function unlock() {
    if (!window.confirm('给自己全部解锁？商城里的吃的用的、装扮、头像框、骰子、称号各放一个，图鉴里的结局、明信片、成就全部记上（不发龙晶）。会记进操作记录。')) return;
    setBusy(true);
    setError('');
    try {
      await api('POST', '/api/admin/unlock-all');
      setDone('解锁好了');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="registration-panel" aria-label="给自己全部解锁">
      <p>
        <button type="button" className="btn btn-small" disabled={busy} onClick={() => void unlock()}>
          给自己全部解锁
        </button>
        {done && (
          <span className="muted">
            {' '}
            {done}，<Link to="/collection">去图鉴看看</Link>
          </span>
        )}
      </p>
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}

/** 龙晶换 AI 额度：开关、多少龙晶换 1 元、每人每月和全站每月最多换多少；这个月全站换了多少、最近谁换了。 */
export function CrystalsTab() {
  const [view, setView] = useState<AdminPetsOverview | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [rate, setRate] = useState('');
  const [userCap, setUserCap] = useState('');
  const [siteCap, setSiteCap] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setView(await api<AdminPetsOverview>('GET', '/api/admin/pets'));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(v: AdminPetsOverview) {
    setEnabled(v.exchange.enabled);
    setRate(String(v.exchange.rate));
    setUserCap(String(v.exchange.userCap));
    setSiteCap(String(v.exchange.siteCap));
    setError('');
    setEditing(true);
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api('PUT', '/api/admin/pets/exchange', { enabled, rate: Number(rate), userCap: Number(userCap), siteCap: Number(siteCap) });
      setEditing(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!view) return <ErrorLine error={error} />;
  const s = view.exchange;
  return (
    <div className="crystals-tab">
      <UnlockAll />
      <section className="registration-panel" aria-label="龙晶换额度">
        {editing ? (
          <form className="inline-form exchange-form" onSubmit={save}>
            <label className="choice">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <span>能用龙晶换额度</span>
            </label>
            <Field label="多少龙晶换 1 元" htmlFor="exchange-rate">
              <input id="exchange-rate" type="number" min="1" max={EXCHANGE_LIMITS.rateMax} step="1" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Field>
            <Field label="每人每月最多换几元" htmlFor="exchange-user-cap">
              <input id="exchange-user-cap" type="number" min="0" max={EXCHANGE_LIMITS.userCapMax} step="1" inputMode="numeric" value={userCap} onChange={(e) => setUserCap(e.target.value)} />
            </Field>
            <Field label="全站每月最多换几元" htmlFor="exchange-site-cap">
              <input id="exchange-site-cap" type="number" min="0" max={EXCHANGE_LIMITS.siteCapMax} step="1" inputMode="numeric" value={siteCap} onChange={(e) => setSiteCap(e.target.value)} />
            </Field>
            <button className="btn btn-primary btn-small" disabled={busy || !rate.trim() || !userCap.trim() || !siteCap.trim()}>
              {busy ? '正在保存……' : '保存'}
            </button>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => setEditing(false)}>
              取消
            </button>
          </form>
        ) : (
          <p className="registration-row">
            <span>
              {s.enabled ? (
                <>
                  龙晶换额度开着：<strong>{s.rate}</strong> 龙晶换 1 元，每人每月最多 <strong>{s.userCap}</strong> 元，全站每月最多 <strong>{s.siteCap}</strong> 元
                </>
              ) : (
                '龙晶换额度关着'
              )}
              ，这个月全站换了 {formatYuan(view.siteUsedThisMonth)} 元
            </span>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => edit(view)}>
              修改
            </button>
          </p>
        )}
        <ErrorLine error={error} />
      </section>
      <h2 className="section-title">最近换额度的</h2>
      {view.recent.length === 0 ? (
        <p className="muted">还没有人换过。</p>
      ) : (
        <div className="table-wrap">
          <table className="table table-numbers">
            <thead>
              <tr>
                <th scope="col">时间</th>
                <th scope="col">账号</th>
                <th scope="col">花了多少龙晶</th>
                <th scope="col">换了多少额度</th>
              </tr>
            </thead>
            <tbody>
              {view.recent.map((r, i) => (
                <tr key={i}>
                  <td>{formatDateTime(r.at)}</td>
                  <td>
                    {r.name}
                    <span className="muted">（UID {r.uid ?? '—'}）</span>
                  </td>
                  <td>{r.crystals}</td>
                  <td>{formatYuan(r.yuan)} 元</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const formatYuan = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
