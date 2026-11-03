import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage, type CreditCode } from '../../api';
import { CopyButton, Field } from '../../components/bits';
import { CurrencySelect } from '../../components/CurrencySwitch';
import { currentCurrency, type Currency } from '../../currency';
import { formatDateTime, money } from '../../format';
import { defaultGrant, ErrorLine } from './common';

// ==================== 额度兑换码 ====================

const CODE_DAYS = [1, 3, 7, 30, 90];

/** 生成额度兑换码（自己写或者随机）、看谁兑换了、删除（已经兑换的额度不受影响）。 */
export function CreditCodesTab() {
  const [codes, setCodes] = useState<CreditCode[] | null>(null);
  const [error, setError] = useState('');
  const [custom, setCustom] = useState('');
  const [amountCurrency, setAmountCurrency] = useState<Currency>(currentCurrency);
  const [amount, setAmount] = useState(() => defaultGrant(currentCurrency()));
  const [reusable, setReusable] = useState(false);
  const [days, setDays] = useState(7);
  const [note, setNote] = useState('');
  const [fresh, setFresh] = useState<CreditCode | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setCodes((await api<{ codes: CreditCode[] }>('GET', '/api/admin/credit-codes')).codes);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api<{ code: CreditCode }>('POST', '/api/admin/credit-codes', {
        code: custom.trim() || undefined,
        amount: Number(amount),
        currency: amountCurrency,
        reusable,
        days,
        note,
      });
      setFresh(r.code);
      setCustom('');
      setNote('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: CreditCode) {
    if (!window.confirm(`删除兑换码 ${c.code}？删掉以后不能再兑换，已经兑换的额度不受影响。`)) return;
    try {
      await api('DELETE', `/api/admin/credit-codes/${c.id}`);
      if (fresh?.id === c.id) setFresh(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const status = (c: CreditCode) => (c.status === 'expired' ? '已过期' : c.status === 'used' ? '已用掉' : '可以兑换');
  return (
    <section className="section" aria-label="额度兑换码">
      <ErrorLine error={error} />
      <form className="inline-form credit-code-form" onSubmit={create}>
        <Field label="兑换码（不填就随机生成）" htmlFor="code-custom">
          <input id="code-custom" maxLength={40} value={custom} autoComplete="off" spellCheck={false} onChange={(e) => setCustom(e.target.value)} />
        </Field>
        <Field label="额度" htmlFor="code-amount">
          <span className="money-input">
            <input id="code-amount" type="number" min="0.01" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <CurrencySelect value={amountCurrency} onChange={setAmountCurrency} />
          </span>
        </Field>
        <Field label="能用几次" htmlFor="code-reusable">
          <select id="code-reusable" value={reusable ? 'many' : 'once'} onChange={(e) => setReusable(e.target.value === 'many')}>
            <option value="once">单次：只能一个人兑换</option>
            <option value="many">可重复：每个人各兑换一次</option>
          </select>
        </Field>
        <Field label="有效期" htmlFor="code-days">
          <select id="code-days" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {CODE_DAYS.map((d) => (
              <option key={d} value={d}>
                {d} 天
              </option>
            ))}
          </select>
        </Field>
        <Field label="备注（选填）" htmlFor="code-note">
          <input id="code-note" maxLength={40} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <button className="btn btn-primary" disabled={busy || !(Number(amount) > 0)}>
          生成兑换码
        </button>
      </form>

      {fresh && (
        <div className="callout" role="status">
          <p>
            新的兑换码 <span className="code">{fresh.code}</span>：{money(fresh.amount)}，{fresh.reusable ? '每个人各能兑换一次' : '只能一个人兑换'}，
            {formatDateTime(fresh.expiresAt)} 之前有效。
          </p>
          <CopyButton text={fresh.code} label="复制兑换码" />
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">兑换码</th>
              <th scope="col">额度</th>
              <th scope="col">能用几次</th>
              <th scope="col">谁兑换了</th>
              <th scope="col">有效期到</th>
              <th scope="col">备注</th>
              <th scope="col">状态</th>
              <th scope="col">
                <span className="visually-hidden">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {codes !== null && codes.length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  还没有兑换码。
                </td>
              </tr>
            )}
            {(codes ?? []).map((c) => (
              <tr key={c.id} className={c.status === 'active' ? '' : 'is-dim'}>
                <td>
                  <span className="code">{c.code}</span>
                </td>
                <td className="nowrap">{money(c.amount)}</td>
                <td className="nowrap">{c.reusable ? '每人一次' : '单次'}</td>
                <td>
                  {c.uses === 0 ? (
                    <span className="muted">还没有</span>
                  ) : (
                    <>
                      {c.uses} 人
                      <span className="muted">：{c.usedBy.join('、')}{c.uses > c.usedBy.length ? '……' : ''}</span>
                    </>
                  )}
                </td>
                <td className="nowrap">{formatDateTime(c.expiresAt)}</td>
                <td>{c.note || '—'}</td>
                <td className="nowrap">{status(c)}</td>
                <td className="row-actions">
                  {c.status === 'active' && <CopyButton text={c.code} label="复制" className="btn btn-small btn-quiet" />}
                  <button type="button" className="btn btn-small btn-quiet btn-danger-text" onClick={() => void remove(c)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
