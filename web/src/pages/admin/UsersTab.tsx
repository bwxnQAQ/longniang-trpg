import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, errorMessage, type AdminUser, type User } from '../../api';
import { CopyButton, Field } from '../../components/bits';
import { banHours, BanLengthPicker, DEFAULT_BAN_LENGTH, type BanLength } from '../../components/BanLength';
import { CurrencySelect } from '../../components/CurrencySwitch';
import { cnyRate, currentCurrency, fromUsd, setCnyRate, useCurrency, type Currency } from '../../currency';
import { Avatar, OnlineDot, profilePath } from '../../components/people';
import { formatDateTime, isoTime, money } from '../../format';
import { refreshBadges } from '../../live';
import { Link } from '../../router';
import { banLengthText } from '../../../../shared/admin';
import { amountText, defaultGrant, ErrorLine, has } from './common';
import { UserDetail } from './UserDetail';

// ==================== 账号 ====================

/** 只看哪些正式账号（游客单独放在下面一组）。 */
type UserFilter = 'all' | 'online' | 'user' | 'admin' | 'banned' | 'out' | 'withheld';
const FILTER_LABEL: Record<UserFilter, string> = {
  all: '全部',
  online: '在线的',
  user: '普通用户',
  admin: '管理员和站长',
  banned: '已封禁',
  out: '额度用完的',
  withheld: '没送初始额度的',
};

const creditCell = (u: AdminUser) =>
  u.isGuest
    ? '游客没有额度'
    : u.credit.unlimited
      ? `不限（已用 ${money(u.credit.spent)}）`
      : `${money(u.credit.spent)} / ${money(u.credit.total)}`;

function matchFilter(u: AdminUser, f: UserFilter): boolean {
  switch (f) {
    case 'online':
      return u.online;
    case 'user':
      return u.identity === 'user';
    case 'admin':
      return u.isAdmin || u.isOwner;
    case 'banned':
      return !!u.banned;
    case 'out':
      return !u.isGuest && u.credit.remaining !== null && u.credit.remaining <= 0;
    case 'withheld':
      return !!u.signup?.withheld;
    default:
      return true;
  }
}

function matchQuery(u: AdminUser, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    (u.uid !== null && String(u.uid) === s) ||
    u.username.toLowerCase().includes(s) ||
    u.displayName.toLowerCase().includes(s) ||
    u.note.toLowerCase().includes(s)
  );
}

/** 账号列表按什么排：默认按 UID 从小到大；点表头的「UID」「创建时间」换着排。 */
type UserSort = { key: 'uid' | 'created'; desc: boolean };

function sortUsers(list: AdminUser[], sort: UserSort): AdminUser[] {
  const value = (u: AdminUser) => (sort.key === 'uid' ? (u.uid ?? Number.MAX_SAFE_INTEGER) : u.createdAt);
  return [...list].sort((a, b) => (value(a) - value(b)) * (sort.desc ? -1 : 1) || a.id - b.id);
}

export function UsersTab({ me, initialQuery }: { me: User; initialQuery: string }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState(initialQuery);
  const [filter, setFilter] = useState<UserFilter>('all');
  const [sort, setSort] = useState<UserSort>({ key: 'uid', desc: false });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [cleaning, setCleaning] = useState(false);
  const [cleaned, setCleaned] = useState('');
  const [creating, setCreating] = useState(false);
  const [startCredit, setStartCredit] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ users: AdminUser[]; startCredit: number }>('GET', '/api/admin/users');
      setUsers(r.users);
      setStartCredit(r.startCredit);
      // 删掉了的账号不再算选中
      setSelected((s) => new Set([...s].filter((id) => r.users.some((u) => u.id === id))));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 正式账号在上面的表里；游客单独一组，默认折起来
  const members = useMemo(() => (users ?? []).filter((u) => !u.isGuest), [users]);
  const guests = useMemo(() => (users ?? []).filter((u) => u.isGuest), [users]);
  const shown = useMemo(() => sortUsers(members.filter((u) => matchFilter(u, filter) && matchQuery(u, q)), sort), [members, filter, q, sort]);
  const shownGuests = useMemo(() => sortUsers(guests.filter((u) => matchQuery(u, q)), sort), [guests, q, sort]);
  const canCreate = has(me, 'users');
  const canDetail = has(me, 'users', 'credit', 'ban');
  const canBatch = has(me, 'credit', 'ban', 'users');
  const canClean = has(me, 'users');
  const guestsOnline = guests.filter((u) => u.online).length;

  function toggle(id: number) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(list: AdminUser[]) {
    const all = list.every((u) => selected.has(u.id));
    setSelected((s) => {
      const next = new Set(s);
      for (const u of list) {
        if (all) next.delete(u.id);
        else next.add(u.id);
      }
      return next;
    });
  }

  async function cleanGuests() {
    if (!window.confirm('删掉现在不在线的游客账号？')) return;
    setCleaning(true);
    setCleaned('');
    try {
      const r = await api<{ removed: number }>('POST', '/api/admin/guests/cleanup');
      setCleaned(`删掉了 ${r.removed} 个。`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCleaning(false);
    }
  }

  /** 点表头换排序：同一列再点一次反过来。 */
  function sortBy(key: UserSort['key']) {
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key === 'created' }));
  }
  const sortHeader = (key: UserSort['key'], label: string) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
      <button type="button" className="th-sort" onClick={() => sortBy(key)}>
        {label}
        <span aria-hidden="true">{sort.key === key ? (sort.desc ? ' ↓' : ' ↑') : ''}</span>
      </button>
    </th>
  );

  const cols = canBatch ? 10 : 9;
  const table = (list: AdminUser[], label: string, empty: string) => (
    <div className="table-wrap">
      <table className="table admin-users">
        <thead>
          <tr>
            {canBatch && (
              <th scope="col" className="cell-check">
                <input
                  type="checkbox"
                  checked={list.length > 0 && list.every((u) => selected.has(u.id))}
                  onChange={() => toggleAll(list)}
                  aria-label={label}
                  disabled={!list.length}
                />
              </th>
            )}
            {sortHeader('uid', 'UID')}
            <th scope="col">账号</th>
            <th scope="col">身份</th>
            <th scope="col">备注</th>
            <th scope="col">AI 额度（已用 / 共）</th>
            <th scope="col">对局</th>
            {sortHeader('created', '创建时间')}
            <th scope="col">在线</th>
            <th scope="col">
              <span className="visually-hidden">操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 && (
            <tr>
              <td colSpan={cols} className="muted">
                {empty}
              </td>
            </tr>
          )}
          {list.map((u) => (
            <UserRows
              key={u.id}
              me={me}
              user={u}
              checkable={canBatch}
              checked={selected.has(u.id)}
              onCheck={() => toggle(u.id)}
              canDetail={canDetail}
              open={open === u.id}
              onToggle={() => setOpen(open === u.id ? null : u.id)}
              onChanged={() => void load()}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="section" aria-label="账号">
      {users && (
        <div className="admin-summary-row">
          <p className="admin-summary">
            正式账号 {members.length} 个，{members.filter((u) => u.online).length} 个在线。
          </p>
          {startCredit !== null && (
            <div className="credit-settings">
              <StartCredit value={startCredit} canEdit={has(me, 'credit')} onSaved={setStartCredit} />
              <RateSetting canEdit={has(me, 'credit')} />
              {me.isOwner && <ZeroAllCredit onDone={() => void load()} />}
            </div>
          )}
        </div>
      )}
      <div className="admin-toolbar">
        <label className="visually-hidden" htmlFor="user-search">
          找账号
        </label>
        <input id="user-search" type="search" value={q} placeholder="用户名、显示名、UID 或备注" onChange={(e) => setQ(e.target.value)} />
        <label className="visually-hidden" htmlFor="user-filter">
          只看
        </label>
        <select id="user-filter" value={filter} onChange={(e) => setFilter(e.target.value as UserFilter)}>
          {(Object.keys(FILTER_LABEL) as UserFilter[]).map((f) => (
            <option key={f} value={f}>
              {FILTER_LABEL[f]}
            </option>
          ))}
        </select>
        <span className="muted">{shown.length} 个</span>
        {canCreate && (
          <button type="button" className="btn btn-small" aria-expanded={creating} onClick={() => setCreating((v) => !v)}>
            新建账号
          </button>
        )}
      </div>
      {creating && <CreateAccount onCreated={() => void load()} onClose={() => setCreating(false)} />}
      {canBatch && selected.size > 0 && users && (
        <BatchBar
          me={me}
          users={users.filter((u) => selected.has(u.id))}
          onDone={() => void load()}
          onClear={() => setSelected(new Set())}
        />
      )}
      <ErrorLine error={error} />
      {users && table(shown, '选中列表里的全部账号', '没有符合条件的账号。')}
      {users && guests.length > 0 && (
        <details className="admin-guests">
          <summary>
            游客 {guests.length} 个{guestsOnline > 0 && `，${guestsOnline} 个在线`}
            {q.trim() && `（搜到 ${shownGuests.length} 个）`}
          </summary>
          {canClean && (
            <div className="admin-guests-actions">
              <button type="button" className="btn btn-small" disabled={cleaning || guestsOnline === guests.length} onClick={() => void cleanGuests()}>
                {cleaning ? '正在清理……' : '清理不在线的游客'}
              </button>
              {cleaned && (
                <span className="muted" role="status">
                  {cleaned}
                </span>
              )}
            </div>
          )}
          {table(shownGuests, '选中列表里的全部游客', '没有符合条件的游客。')}
        </details>
      )}
    </section>
  );
}

/** 新的正式账号（注册、管理员新建）一开始的额度：有「发放额度」权限的管理员点「修改」能改，已经有的账号不变。 */
function StartCredit({ value, canEdit, onSaved }: { value: number; canEdit: boolean; onSaved: (value: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftCurrency, setDraftCurrency] = useState<Currency>(currentCurrency);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<{ startCredit: number }>('PUT', '/api/admin/start-credit', { amount: Number(draft), currency: draftCurrency });
      onSaved(r.startCredit);
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <p className="start-credit">
        新账号的初始额度 <strong>{money(value)}</strong>
        {canEdit && (
          <button
            type="button"
            className="btn btn-small btn-quiet"
            onClick={() => {
              const c = currentCurrency();
              setDraftCurrency(c);
              setDraft(amountText(fromUsd(value, c)));
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
    <form className="inline-form start-credit-form" onSubmit={save}>
      <Field label="新账号的初始额度" htmlFor="start-credit">
        <span className="money-input">
          <input id="start-credit" type="number" min="0" step="any" inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <CurrencySelect value={draftCurrency} onChange={setDraftCurrency} />
        </span>
      </Field>
      <button className="btn btn-primary btn-small" disabled={busy || draft.trim() === ''}>
        {busy ? '正在保存……' : '保存'}
      </button>
      <button type="button" className="btn btn-small btn-quiet" onClick={() => setEditing(false)}>
        取消
      </button>
      <ErrorLine error={error} />
    </form>
  );
}

/** 一键清零（V1.0.1，只有站长）：所有正式用户的可用额度变成 0；已经用掉的不变，不限额度的不动。 */
function ZeroAllCredit({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  async function run() {
    if (busy) return;
    if (!window.confirm('把所有正式用户的可用额度都变成 0？剩下的额度全部收回，不限额度的账号不受影响。以后要用得重新发放额度。')) return;
    setBusy(true);
    setError('');
    setDone('');
    try {
      const r = await api<{ zeroed: number; takenUsd: number; unlimited: number }>('POST', '/api/admin/credit/zero-all');
      setDone(`清零了 ${r.zeroed} 个账号，一共收回 ${money(r.takenUsd)}${r.unlimited ? `，不限额度的 ${r.unlimited} 个没动` : ''}。`);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="start-credit zero-credit">
      <button type="button" className="btn btn-small btn-danger" disabled={busy} onClick={() => void run()}>
        {busy ? '正在清零……' : '所有正式用户的可用额度清零'}
      </button>
      {done && (
        <span className="muted" role="status">
          {done}
        </span>
      )}
      <ErrorLine error={error} />
    </div>
  );
}

/** 汇率：1 美元换多少人民币。网页上的人民币按它换算，填人民币发额度时也按它换成美元记。有「发放额度」权限的管理员能改。 */
function RateSetting({ canEdit }: { canEdit: boolean }) {
  useCurrency();
  const rate = cnyRate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<{ cnyRate: number }>('PUT', '/api/admin/cny-rate', { rate: Number(draft) });
      setCnyRate(r.cnyRate);
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <p className="start-credit">
        汇率 <strong>1 美元 = {rate} 元</strong>
        {canEdit && (
          <button
            type="button"
            className="btn btn-small btn-quiet"
            onClick={() => {
              setDraft(String(rate));
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
    <form className="inline-form start-credit-form" onSubmit={save}>
      <Field label="1 美元换多少元" htmlFor="cny-rate">
        <input id="cny-rate" type="number" min="1" max="20" step="any" inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} />
      </Field>
      <button className="btn btn-primary btn-small" disabled={busy || draft.trim() === ''}>
        {busy ? '正在保存……' : '保存'}
      </button>
      <button type="button" className="btn btn-small btn-quiet" onClick={() => setEditing(false)}>
        取消
      </button>
      <ErrorLine error={error} />
    </form>
  );
}

/** 新建正式账号：填用户名和显示的名字，密码是随机的临时密码（只显示这一次）；本人第一次登录时先同意使用规则。 */
function CreateAccount({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [made, setMade] = useState<{ user: AdminUser; tempPassword: string } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      setMade(await api<{ user: AdminUser; tempPassword: string }>('POST', '/api/admin/users', { username: username.trim(), displayName: displayName.trim() }));
      setUsername('');
      setDisplayName('');
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-create">
      {made ? (
        <div className="admin-created" role="status">
          <p>
            建好了：{made.user.displayName}（{made.user.username}），UID {made.user.uid}。
          </p>
          <p>
            临时密码：<span className="code">{made.tempPassword}</span> <CopyButton text={made.tempPassword} label="复制" className="btn btn-small btn-quiet" />
            <span className="hint block-hint">只显示这一次。</span>
          </p>
          <div className="actions">
            <button type="button" className="btn btn-small" onClick={() => setMade(null)}>
              再建一个
            </button>
            <button type="button" className="btn btn-small btn-quiet" onClick={onClose}>
              收起
            </button>
          </div>
        </div>
      ) : (
        <form className="inline-form" onSubmit={submit}>
          <Field label="用户名" htmlFor="new-username">
            <input id="new-username" value={username} maxLength={20} autoComplete="off" spellCheck={false} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="显示的名字" htmlFor="new-display-name">
            <input id="new-display-name" value={displayName} maxLength={20} autoComplete="off" onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <button className="btn btn-primary btn-small" disabled={busy || !username.trim() || !displayName.trim()}>
            {busy ? '正在新建……' : '建好账号'}
          </button>
          <button type="button" className="btn btn-small btn-quiet" onClick={onClose}>
            取消
          </button>
        </form>
      )}
      <ErrorLine error={error} />
    </div>
  );
}

function UserRows({
  me,
  user: u,
  checkable,
  checked,
  onCheck,
  canDetail,
  open,
  onToggle,
  onChanged,
}: {
  me: User;
  user: AdminUser;
  checkable: boolean;
  checked: boolean;
  onCheck: () => void;
  canDetail: boolean;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const out = !u.isGuest && u.credit.remaining !== null && u.credit.remaining <= 0;
  const cols = checkable ? 10 : 9;
  return (
    <>
      <tr className={u.banned ? 'is-dim' : checked ? 'is-selected' : ''}>
        {checkable && (
          <td className="cell-check">
            <input type="checkbox" checked={checked} onChange={onCheck} aria-label={`选中 ${u.displayName}`} />
          </td>
        )}
        <td className="nowrap cell-uid">{u.uid}</td>
        <td>
          <span className="admin-user">
            <Avatar user={u} size={28} />
            <span>
              {u.isGuest ? <strong>{u.displayName}</strong> : <Link to={profilePath(u.publicId)}>{u.displayName}</Link>}
              <span className="muted"> {u.username}</span>
              {u.id === me.id && <span className="you">（你）</span>}
            </span>
          </span>
        </td>
        <td>
          <span className="tag-row">
            <span className={`tag tag-identity tag-${u.identity}`}>{u.identityLabel}</span>
            {u.banned && <span className="tag tag-warn">{u.banned.until ? `封禁到 ${formatDateTime(u.banned.until)}` : '已封禁'}</span>}
            {u.signup?.withheld && (
              <span className="tag" title={u.signup.withheld}>
                没送初始额度
              </span>
            )}
            {u.locked && <span className="tag tag-warn">锁定中</span>}
            {!u.rulesAgreed && !u.isGuest && <span className="tag">没同意规则</span>}
          </span>
        </td>
        <td className="cell-note">{u.note ? <span title={u.note}>{u.note}</span> : <span className="muted">—</span>}</td>
        <td className={out ? 'cell-alert' : ''}>
          {creditCell(u)}
          {out && '（用完了）'}
        </td>
        <td>{u.rooms}</td>
        <td className="nowrap">
          <time dateTime={isoTime(u.createdAt)}>{formatDateTime(u.createdAt)}</time>
        </td>
        <td className="nowrap">{u.online ? <OnlineDot online /> : <span className="muted">{u.lastSeenAt ? formatDateTime(u.lastSeenAt) : '没来过'}</span>}</td>
        <td className="row-actions">
          {canDetail && (
            <button type="button" className="btn btn-small btn-quiet" aria-expanded={open} onClick={onToggle}>
              {open ? '收起' : '管理'}
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="detail-row">
          <td colSpan={cols}>
            <UserDetail me={me} userId={u.id} onChanged={onChanged} />
          </td>
        </tr>
      )}
    </>
  );
}

type BatchOp = 'credit' | 'unlimited-on' | 'unlimited-off' | 'ban' | 'unban' | 'delete-guests' | 'delete';

/** 对勾选的账号批量处理：做不了的（权限不够、已经封了之类）跳过，列出原因。 */
function BatchBar({ me, users, onDone, onClear }: { me: User; users: AdminUser[]; onDone: () => void; onClear: () => void }) {
  const ops: { op: BatchOp; label: string }[] = [
    ...(has(me, 'credit')
      ? [
          { op: 'credit' as const, label: '发放额度' },
          { op: 'unlimited-on' as const, label: '设成不限额度' },
          { op: 'unlimited-off' as const, label: '取消不限额度' },
        ]
      : []),
    ...(has(me, 'ban')
      ? [
          { op: 'ban' as const, label: '封号' },
          { op: 'unban' as const, label: '解封' },
        ]
      : []),
    // 站长能删任何账号（游客和正式账号）；别的管理员只能删游客
    ...(me.isOwner ? [{ op: 'delete' as const, label: '删除账号' }] : has(me, 'users') ? [{ op: 'delete-guests' as const, label: '删除游客账号' }] : []),
  ];
  const [op, setOp] = useState<BatchOp>(ops[0]?.op ?? 'credit');
  const [amountCurrency, setAmountCurrency] = useState<Currency>(currentCurrency);
  const [amount, setAmount] = useState(() => defaultGrant(currentCurrency()));
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [banLength, setBanLength] = useState<BanLength>(DEFAULT_BAN_LENGTH);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ done: number; skipped: { name: string; reason: string }[] } | null>(null);

  const guests = users.filter((u) => u.isGuest).length;
  const label = ops.find((o) => o.op === op)?.label ?? '';
  const hours = banHours(banLength);
  const ready = op === 'credit' ? !!Number(amount) : op === 'ban' ? hours !== undefined : op === 'delete-guests' ? guests > 0 : true;
  const dangerous = op === 'ban' || op === 'delete-guests' || op === 'delete';

  async function run() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const ids = users.map((u) => u.id);
      const body =
        op === 'credit'
          ? { op, ids, amount: Number(amount), currency: amountCurrency, note }
          : op === 'unlimited-on' || op === 'unlimited-off'
            ? { op: 'unlimited', ids, unlimited: op === 'unlimited-on' }
            : op === 'ban'
              ? { op, ids, reason, hours }
              : { op, ids };
      const r = await api<{ done: number[]; skipped: { id: number; reason: string }[] }>('POST', '/api/admin/users/batch', body);
      const nameOf = (id: number) => users.find((u) => u.id === id)?.displayName ?? `#${id}`;
      setResult({ done: r.done.length, skipped: r.skipped.map((s) => ({ name: nameOf(s.id), reason: s.reason })) });
      setConfirming(false);
      setNote('');
      setReason('');
      setBanLength(DEFAULT_BAN_LENGTH);
      onDone();
      void refreshBadges();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="batch-bar" role="region" aria-label="批量处理">
      <div className="batch-row">
        <strong>已选 {users.length} 个账号</strong>
        <label className="visually-hidden" htmlFor="batch-op">
          批量做什么
        </label>
        <select
          id="batch-op"
          value={op}
          disabled={busy}
          onChange={(e) => {
            setOp(e.target.value as BatchOp);
            setConfirming(false);
            setResult(null);
          }}
        >
          {ops.map((o) => (
            <option key={o.op} value={o.op}>
              {o.label}
            </option>
          ))}
        </select>
        {op === 'credit' && (
          <>
            <label className="visually-hidden" htmlFor="batch-amount">
              每个账号发放多少（负数是收回）
            </label>
            <input id="batch-amount" type="number" step="any" className="input-short" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <CurrencySelect value={amountCurrency} onChange={setAmountCurrency} />
            <span className="muted">每个账号</span>
            <label className="visually-hidden" htmlFor="batch-note">
              备注
            </label>
            <input id="batch-note" maxLength={40} value={note} placeholder="备注（选填）" onChange={(e) => setNote(e.target.value)} />
          </>
        )}
        {op === 'ban' && (
          <>
            <label className="visually-hidden" htmlFor="batch-reason">
              封号的原因
            </label>
            <input id="batch-reason" maxLength={100} value={reason} placeholder="封号的原因（选填）" onChange={(e) => setReason(e.target.value)} />
            <label className="visually-hidden" htmlFor="batch-ban-length">
              封多久
            </label>
            <BanLengthPicker id="batch-ban-length" value={banLength} onChange={setBanLength} disabled={busy} />
          </>
        )}
        {!confirming ? (
          <button type="button" className={dangerous ? 'btn btn-small btn-danger' : 'btn btn-small btn-primary'} disabled={busy || !ready} onClick={() => setConfirming(true)}>
            {label}
          </button>
        ) : (
          <span className="batch-confirm">
            <span>
              {op === 'delete-guests'
                ? `删除选中的 ${guests} 个游客账号？不是游客的会跳过。`
                : op === 'delete'
                  ? `删除选中的 ${users.length} 个账号？他们不能再登录，好友、私信、笔记都会清掉，当房主的对局交给别的成员。不能恢复。`
                  : op === 'ban'
                    ? `对 ${users.length} 个账号「封号」（${hours === undefined ? '' : hours === null ? '永久' : `封 ${banLengthText(hours)}`}）？做不了的会跳过。`
                    : `对 ${users.length} 个账号「${label}」？做不了的会跳过。`}
            </span>
            <button type="button" className={dangerous ? 'btn btn-small btn-danger-solid' : 'btn btn-small btn-primary'} disabled={busy} onClick={() => void run()}>
              {busy ? '正在处理……' : '确认'}
            </button>
            <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => setConfirming(false)}>
              取消
            </button>
          </span>
        )}
        <button type="button" className="btn btn-small btn-quiet" onClick={onClear} disabled={busy}>
          取消选择
        </button>
      </div>
      <ErrorLine error={error} />
      {result && (
        <div className="batch-result" role="status">
          <p>
            处理了 {result.done} 个{result.skipped.length > 0 && `，跳过 ${result.skipped.length} 个`}。
          </p>
          {result.skipped.length > 0 && (
            <ul className="plain-list">
              {result.skipped.map((s, i) => (
                <li key={i}>
                  {s.name}：{s.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
