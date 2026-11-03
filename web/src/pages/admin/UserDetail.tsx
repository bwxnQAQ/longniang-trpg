import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage, PURPOSE_LABEL, STATUS_LABEL, type AdminUser, type AdminUserDetail, type AdminPetSummary, type User } from '../../api';
import { Field } from '../../components/bits';
import { BanForm } from '../../components/BanLength';
import { CurrencySelect } from '../../components/CurrencySwitch';
import { currentCurrency, type Currency } from '../../currency';
import { formatDate, formatDateTime, money } from '../../format';
import { Link } from '../../router';
import { LEDGER_LABEL } from '../../../../shared/pets';
import { ATTRIBUTE_KEYS, ATTRIBUTE_NAME } from '../../../../shared/rules';
import { defaultGrant, ErrorLine, has, OUTCOME_LABEL } from './common';
import { RoleEditor } from './AdminsTab';

// ==================== 账号详情 ====================

/** 我能不能动这个账号：站长的账号谁也动不了；管理员的账号只有站长能动。 */
function canTouch(me: User, u: AdminUser): boolean {
  if (u.isOwner) return false;
  if (u.isAdmin) return me.isOwner;
  return true;
}

export function UserDetail({ me, userId, onChanged }: { me: User; userId: number; onChanged: () => void }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState('');
  const [grantCurrency, setGrantCurrency] = useState<Currency>(currentCurrency);
  const [amount, setAmount] = useState(() => defaultGrant(currentCurrency()));
  const [grantNote, setGrantNote] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await api<AdminUserDetail>('GET', `/api/admin/users/${userId}`);
      setDetail(d);
      setNote((n) => n ?? d.user.note);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await work();
      await load();
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return error ? <ErrorLine error={error} /> : <p className="muted">正在加载……</p>;
  const u = detail.user;
  const self = u.id === me.id;
  const touch = self || canTouch(me, u);
  const canNote = has(me, 'users') && touch;
  const canCredit = has(me, 'credit') && !u.isGuest && !u.isOwner && touch;
  const canUnlimited = canCredit && (!self || me.isOwner);
  const canBan = has(me, 'ban') && !self && canTouch(me, u);
  const canReset = has(me, 'users') && !self && !u.isGuest && canTouch(me, u);
  const canRole = me.isOwner && !u.isOwner && !u.isGuest;
  // 游客：有「账号管理」权限就能删；正式账号只有站长能删
  const canDelete = !self && !u.isOwner && (u.isGuest ? has(me, 'users') && canTouch(me, u) : me.isOwner);

  async function remove() {
    const question = u.isGuest
      ? `删除游客账号「${u.displayName}」？`
      : `删除「${u.displayName}」的账号？他不能再登录，好友、私信、笔记都会清掉，当房主的对局交给别的成员；对局里的角色和记录还在。UID ${u.uid} 空出来，以后的新账号会用上。不能恢复。`;
    if (!window.confirm(question)) return;
    setBusy(true);
    setError('');
    try {
      await api('DELETE', `/api/admin/users/${userId}`);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="user-detail">
      <ErrorLine error={error} />
      <p className="user-detail-meta">
        UID {u.uid ?? '—'}，{formatDate(u.createdAt)} {u.createdBy ? `由${u.createdBy}新建` : u.signup ? (u.signup.via === 'invite' ? '用邀请码注册' : '开放注册') : '注册'}
        {u.signup?.withheld && `（没送初始额度：${u.signup.withheld}）`}
        {u.lastSeenAt && `，最近一次在线 ${formatDateTime(u.lastSeenAt)}`}
        {!touch && (u.isOwner ? '。这是站长的账号，只能看。' : '。这是管理员的账号，只有站长能改。')}
      </p>
      {detail.related.length > 0 && (
        <div className="user-related">
          <h3>可能是同一个人</h3>
          <ul className="plain-list">
            {detail.related.map((r) => (
              <li key={r.id}>
                {r.displayName}
                <span className="muted">
                  （{r.username}，UID {r.uid ?? '—'}）
                </span>
                ：{r.how.join('、')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="user-detail-grid">
        {canNote && note !== null && (
          <form
            className="user-detail-box"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              void run(() => api('PUT', `/api/admin/users/${userId}/note`, { note }));
            }}
          >
            <h3>后台备注</h3>
            <label className="visually-hidden" htmlFor={`note-${userId}`}>
              备注
            </label>
            <textarea id={`note-${userId}`} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn btn-small" disabled={busy || note.trim() === u.note}>
              保存备注
            </button>
          </form>
        )}

        {canCredit && (
          <form
            className="user-detail-box"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              void run(async () => {
                await api('POST', `/api/admin/users/${userId}/credit`, { amount: Number(amount), currency: grantCurrency, note: grantNote });
                setGrantNote('');
              });
            }}
          >
            <h3>AI 额度</h3>
            <p>
              {u.credit.unlimited ? '不限' : `已用 ${money(u.credit.spent)}，共 ${money(u.credit.total)}，剩 ${money(Math.max(0, u.credit.remaining ?? 0))}`}
            </p>
            <div className="inline-form">
              <Field label="发放多少（负数是收回）" htmlFor={`grant-${userId}`}>
                <span className="money-input">
                  <input id={`grant-${userId}`} type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <CurrencySelect value={grantCurrency} onChange={setGrantCurrency} />
                </span>
              </Field>
              <Field label="备注（选填）" htmlFor={`grant-note-${userId}`}>
                <input id={`grant-note-${userId}`} maxLength={40} value={grantNote} onChange={(e) => setGrantNote(e.target.value)} placeholder="发放的原因" />
              </Field>
              <button className="btn btn-primary btn-small" disabled={busy || !Number(amount)}>
                发放额度
              </button>
            </div>
            {canUnlimited && (
              <label className="choice">
                <input
                  type="checkbox"
                  checked={u.credit.unlimited}
                  disabled={busy}
                  onChange={(e) => void run(() => api('PUT', `/api/admin/users/${userId}/unlimited`, { unlimited: e.target.checked }))}
                />
                <span>不限额度</span>
              </label>
            )}
          </form>
        )}

        {(canBan || canReset) && (
          <div className="user-detail-box">
            {canBan && (
              <>
                <h3>封号</h3>
                {u.banned ? (
                  <>
                    <p>
                      {formatDateTime(u.banned.at)} 被封禁：{u.banned.reason}
                    </p>
                    <p className="muted">{u.banned.until ? `${formatDateTime(u.banned.until)} 自动解封` : '永久封禁'}</p>
                    <button type="button" className="btn btn-small" disabled={busy} onClick={() => void run(() => api('POST', `/api/admin/users/${userId}/unban`))}>
                      解封
                    </button>
                  </>
                ) : u.isAdmin ? null : (
                  <BanForm userId={userId} displayName={u.displayName} busy={busy} run={run} />
                )}
              </>
            )}
            {canReset && (
              <>
                <h3>密码</h3>
                {tempPassword ? (
                  <p>
                    临时密码：<span className="code">{tempPassword}</span>
                    <span className="hint block-hint">只显示这一次。</span>
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-small btn-quiet"
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm(`把 ${u.displayName} 的密码重置成一个临时密码？他在所有设备上的登录都会退出。`)) return;
                        void run(async () => setTempPassword((await api<{ tempPassword: string }>('POST', `/api/admin/users/${userId}/reset-password`)).tempPassword));
                      }}
                    >
                      重置密码
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {detail.pets && (
        <UserCrystals
          userId={userId}
          summary={detail.pets}
          canGrant={has(me, 'credit') && (self ? me.isOwner : canTouch(me, u))}
          onChanged={() => void load()}
        />
      )}

      {canDelete && (
        <div className="user-detail-box">
          <h3>删除账号</h3>
          <button type="button" className="btn btn-small btn-danger" disabled={busy} onClick={() => void remove()}>
            删除账号
          </button>
        </div>
      )}

      {canRole && (
        <RoleEditor
          user={u}
          onChanged={() => {
            void load();
            onChanged();
          }}
        />
      )}

      <div className="user-detail-grid">
        <div className="user-detail-box">
          <h3>AI 花费</h3>
          {detail.usage.byPurpose.length === 0 ? (
            <p className="muted">还没有花过。</p>
          ) : (
            <ul className="plain-list">
              {detail.usage.byPurpose.map((p) => (
                <li key={p.purpose}>
                  {PURPOSE_LABEL[p.purpose] ?? p.purpose}：{money(p.cost)}（{p.calls} 次）
                </li>
              ))}
            </ul>
          )}
          {detail.grants.length > 0 && (
            <>
              <h3>发放记录</h3>
              <ul className="plain-list">
                {detail.grants.map((g, i) => (
                  <li key={i}>
                    {formatDateTime(g.at)} {g.by ?? '管理员'}
                    {g.amount > 0 ? '发放了' : '收回了'} {money(Math.abs(g.amount))}
                    {g.note && <span className="muted">（{g.note}）</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="user-detail-box">
          <h3>在这些对局里</h3>
          {detail.rooms.length === 0 ? (
            <p className="muted">没有。</p>
          ) : (
            <ul className="plain-list">
              {detail.rooms.map((r) => (
                <li key={r.id}>
                  {has(me, 'rooms') ? <Link to={`/admin/rooms/${r.id}`}>{r.name}</Link> : r.name}
                  <span className="muted">
                    （{r.role === 'host' ? '房主' : '玩家'}，{STATUS_LABEL[r.status]}）
                  </span>
                </li>
              ))}
            </ul>
          )}
          {detail.violations.length > 0 && (
            <>
              <h3>违规记录</h3>
              <ul className="plain-list">
                {detail.violations.map((v) => (
                  <li key={v.id}>
                    {formatDateTime(v.at)} {v.sourceLabel}，{v.category}，{OUTCOME_LABEL[v.outcome]}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {detail.usage.recent.length > 0 && (
        <details className="user-detail-calls">
          <summary>最近 {detail.usage.recent.length} 次 AI 调用</summary>
          <div className="table-wrap">
            <table className="table table-numbers">
              <thead>
                <tr>
                  <th scope="col">时间</th>
                  <th scope="col">对局</th>
                  <th scope="col">用途</th>
                  <th scope="col">记到他名下</th>
                  <th scope="col">结果</th>
                </tr>
              </thead>
              <tbody>
                {detail.usage.recent.map((c, i) => (
                  <tr key={i}>
                    <td>{formatDateTime(c.at)}</td>
                    <td>{c.room ? has(me, 'rooms') ? <Link to={`/admin/rooms/${c.room.id}`}>{c.room.name}</Link> : c.room.name : '—'}</td>
                    <td>{PURPOSE_LABEL[c.purpose] ?? c.purpose}</td>
                    <td>
                      {money(c.cost)}
                      {c.shared && <span className="muted">（平摊）</span>}
                    </td>
                    <td>{c.error ? <span className="cell-alert">{c.error}</span> : c.stopReason === 'refusal' ? <span className="cell-alert">被拒绝</span> : '成功'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

/** 账号详情里的宠物和龙晶：有多少龙晶、宠物的情况、发龙晶、最近的进出。 */
function UserCrystals({ userId, summary, canGrant, onChanged }: { userId: number; summary: AdminPetSummary; canGrant: boolean; onChanged: () => void }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const grown = ATTRIBUTE_KEYS.filter((k) => summary.growth[k] > 0);
  const pet = summary.pet;

  async function grant(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = Number(amount);
    if (busy || !Number.isInteger(n) || n === 0) return;
    setBusy(true);
    setError('');
    try {
      await api('POST', `/api/admin/users/${userId}/crystals`, { amount: n, note: note.trim() });
      setAmount('');
      setNote('');
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="user-detail-box user-crystals">
      <h3>宠物和龙晶</h3>
      <p>
        龙晶 <strong>{summary.crystals}</strong>
        {pet ? (
          <>
            。宠物「{pet.name}」，饱食度 {pet.satiety}，精力 {pet.energy}
            {pet.job && `，正在${pet.job}`}
          </>
        ) : (
          '。还没养宠物'
        )}
        {grown.length > 0 && `。属性：${grown.map((k) => `${ATTRIBUTE_NAME[k]} ${summary.growth[k]}`).join('、')}`}
      </p>
      {canGrant && (
        <form className="inline-form" onSubmit={grant}>
          <Field label="发多少龙晶（负数是收回）" htmlFor={`crystals-${userId}`}>
            <input id={`crystals-${userId}`} type="number" step="1" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="备注（选填）" htmlFor={`crystals-note-${userId}`}>
            <input id={`crystals-note-${userId}`} maxLength={60} value={note} onChange={(e) => setNote(e.target.value)} placeholder="发放的原因" />
          </Field>
          <button className="btn btn-primary btn-small" disabled={busy || !Number.isInteger(Number(amount)) || Number(amount) === 0}>
            发龙晶
          </button>
        </form>
      )}
      <ErrorLine error={error} />
      {summary.ledger.length > 0 && (
        <details>
          <summary>最近 {summary.ledger.length} 笔龙晶进出</summary>
          <ul className="plain-list">
            {summary.ledger.map((l, i) => (
              <li key={i}>
                {formatDateTime(l.at)} {LEDGER_LABEL[l.kind]}
                {l.kind === 'grant' && l.by && `（${l.by}）`} <span className={l.delta > 0 ? 'ledger-in' : 'ledger-out'}>{l.delta > 0 ? `+${l.delta}` : l.delta}</span>
                <span className="muted">
                  {l.detail && `，${l.detail}`}，剩 {l.balance}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
