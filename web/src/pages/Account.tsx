import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { api, errorMessage, IDENTITY_LABEL, PERMISSION_LABEL, type Credit, type MyReport, type Profile } from '../api';
import { useAuth } from '../auth';
import { Field } from '../components/bits';
import { CurrencySwitch } from '../components/CurrencySwitch';
import { openFeedback } from '../components/Feedback';
import { Avatar, profilePath } from '../components/people';
import { PushSettings } from '../components/PushSettings';
import { creditText, formatTime, money } from '../format';
import { Link } from '../router';

// 账号设置：头像、显示名、介绍、个人主页展示什么（点「修改」才能改）；密码（点了才展开）、退出其他设备；我提交过的反馈。

export function AccountPage() {
  const { user, logout } = useAuth();
  const [credit, setCredit] = useState<Credit | null>(null);

  useEffect(() => {
    document.title = '账号设置 - 龙娘跑团';
    api<{ credit: Credit | null }>('GET', '/api/auth/me')
      .then((r) => setCredit(r.credit))
      .catch(() => setCredit(null));
  }, []);

  if (!user) return null;
  return (
    <div className="account">
      <div className="page-head">
        <h1>{user.isGuest ? '账号' : '账号设置'}</h1>
      </div>

      {user.isGuest ? (
        <section className="account-section">
          <p>
            你现在是<strong>{user.displayName}</strong>。
          </p>
        </section>
      ) : (
        <>
          <ProfileForm />
          <section className="account-section" aria-labelledby="account-info">
            <h2 id="account-info">账号</h2>
            <dl className="facts">
              <dt>用户名</dt>
              <dd>{user.username}</dd>
              <dt>身份</dt>
              <dd>
                {IDENTITY_LABEL[user.identity]}
                {user.identity === 'admin' && user.permissions.length > 0 && (
                  <span className="hint block-hint">权限：{user.permissions.map((p) => PERMISSION_LABEL[p]).join('、')}</span>
                )}
              </dd>
              {credit && (
                <>
                  <dt>AI 额度</dt>
                  <dd className="credit-dd">
                    {creditText(credit)}
                    <CurrencySwitch />
                  </dd>
                </>
              )}
            </dl>
            <RedeemCode onRedeemed={setCredit} />
          </section>
          <SecuritySection />
          <PushSettings />
        </>
      )}

      <MyReports />

      <div className="account-logout">
        <button type="button" className="btn" onClick={() => void logout()}>
          退出登录
        </button>
      </div>
    </div>
  );
}

/**
 * 头像、显示名、介绍、个人主页上展示不展示自己的对局。
 * 打开页面时只是看，点「修改」才能改（免得一进来不小心改了）；改完点「保存」，或者「取消」不改。
 */
function ProfileForm() {
  const { user, setUser } = useAuth();
  const [stored, setStored] = useState<{ bio: string; showRooms: boolean } | null>(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [showRooms, setShowRooms] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    api<Profile>('GET', `/api/users/${encodeURIComponent(user.publicId)}`)
      .then((p) => setStored({ bio: p.user.bio, showRooms: p.showRooms ?? true }))
      .catch((err) => setError(errorMessage(err)));
    // 只在打开页面时读一次
  }, []);

  function startEditing() {
    if (!user || !stored) return;
    setDisplayName(user.displayName);
    setBio(stored.bio);
    setShowRooms(stored.showRooms);
    setError('');
    setSaved(false);
    setEditing(true);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const p = await api<Profile>('PUT', '/api/me/profile', { displayName, bio, showRooms });
      setUser({ ...user, displayName: p.user.displayName });
      setStored({ bio: p.user.bio, showRooms: p.showRooms ?? showRooms });
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;
  return (
    <section className="account-section" aria-labelledby="profile-title">
      <h2 id="profile-title">个人资料</h2>
      {editing ? (
        <>
          <AvatarEditor />
          <form className="form narrow" onSubmit={submit} noValidate>
            <Field label="显示名" htmlFor="profile-name">
              <input id="profile-name" maxLength={20} value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoFocus />
            </Field>
            <Field label="一句话介绍（选填）" htmlFor="profile-bio">
              <textarea id="profile-bio" rows={3} maxLength={200} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
            <label className="choice">
              <input type="checkbox" checked={showRooms} onChange={(e) => setShowRooms(e.target.checked)} />
              <span>
                <strong>在个人主页上展示我的对局和战绩</strong>
              </span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={busy}>
                {busy ? '正在保存……' : '保存'}
              </button>
              <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => setEditing(false)}>
                取消
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <div className="avatar-editor">
            <Avatar user={user} size={72} />
          </div>
          <dl className="facts">
            <dt>显示名</dt>
            <dd>{user.displayName}</dd>
            <dt>一句话介绍</dt>
            <dd>{stored === null ? '……' : stored.bio || <span className="muted">没写</span>}</dd>
            <dt>个人主页</dt>
            <dd>{stored === null ? '……' : stored.showRooms ? '展示我的对局和战绩' : '不展示我的对局和战绩'}</dd>
          </dl>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="form-ok" role="status">
              已保存。
            </p>
          )}
          <div className="form-actions">
            <button type="button" className="btn btn-primary" disabled={stored === null} onClick={startEditing}>
              修改
            </button>
            <Link to={profilePath(user.publicId)} className="btn btn-quiet">
              看看我的主页
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

/** 兑换额度：填管理员给的兑换码。 */
function RedeemCode({ onRedeemed }: { onRedeemed: (credit: Credit) => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError('');
    setDone('');
    try {
      const r = await api<{ amount: number; credit: Credit }>('POST', '/api/me/redeem', { code: code.trim() });
      onRedeemed(r.credit);
      setDone(`兑换成功，额度加了 ${money(r.amount)}。`);
      setCode('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="redeem">
      <form className="inline-form" onSubmit={submit}>
        <label htmlFor="redeem-code" className="visually-hidden">
          兑换码
        </label>
        <input id="redeem-code" value={code} maxLength={60} placeholder="兑换码" autoComplete="off" spellCheck={false} onChange={(e) => setCode(e.target.value)} />
        <button className="btn btn-small" disabled={busy || !code.trim()}>
          {busy ? '正在兑换……' : '兑换额度'}
        </button>
      </form>
      {done && (
        <p className="form-ok" role="status">
          {done}
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

/** 头像：选一张图，网页上先裁成正方形、缩到 256×256，再传上去。 */
const AVATAR_SIZE = 256;

export async function squareImage(file: File, size = AVATAR_SIZE): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('这个文件打不开，换一张图片试试'));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (!side) throw new Error('这个文件打不开，换一张图片试试');
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    // 有的浏览器不会存 WebP，存出来是 PNG：换成 JPEG，小一些
    const webp = canvas.toDataURL('image/webp', 0.86);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function AvatarEditor() {
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  if (!user) return null;

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    setBusy(true);
    setError('');
    try {
      const image = await squareImage(file);
      const r = await api<{ avatar: string }>('PUT', '/api/me/avatar', { image });
      setUser({ ...user, avatar: r.avatar });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      await api('DELETE', '/api/me/avatar');
      setUser({ ...user, avatar: null });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="avatar-editor">
      <Avatar user={user} size={72} />
      <div className="avatar-editor-actions">
        <button type="button" className="btn btn-small" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? '正在上传……' : user.avatar ? '换头像' : '上传头像'}
        </button>
        {user.avatar && (
          <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void remove()}>
            去掉头像
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void pick(e)} />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

/** 修改密码（点了才展开）、退出其他设备。 */
function SecuritySection() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDone('');
    if (next !== confirm) {
      setError('两次输入的新密码不一样');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api('POST', '/api/auth/password', { currentPassword: current, newPassword: next });
      setDone('密码已修改。其他设备上的登录已经退出。');
      setCurrent('');
      setNext('');
      setConfirm('');
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function logoutOthers() {
    setBusy(true);
    setError('');
    setDone('');
    try {
      await api('POST', '/api/auth/logout-others');
      setDone('其他设备上的登录都退出了，这里的还在。');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-section" aria-labelledby="security-title">
      <h2 id="security-title">安全</h2>
      <div className="actions">
        <button type="button" className="btn btn-small" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          修改密码
        </button>
        <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void logoutOthers()}>
          退出其他设备
        </button>
      </div>
      {open && (
        <form className="form narrow account-password" onSubmit={submit} noValidate>
          <Field label="当前密码" htmlFor="pw-current">
            <input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />
          </Field>
          <Field label="新密码" htmlFor="pw-next" hint="至少8位。">
            <input id="pw-next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-describedby="pw-next-hint" />
          </Field>
          <Field label="再输一次新密码" htmlFor="pw-confirm">
            <input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? '正在修改……' : '修改密码'}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setOpen(false)}>
              取消
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="form-ok" role="status">
          {done}
        </p>
      )}
    </section>
  );
}

const KIND_LABEL: Record<string, string> = { report: '举报', feedback: '意见', bug: 'bug' };
const OUTCOME_LABEL: Record<string, string> = {
  handled: '已处理',
  confirmed: '已确认',
  fixed: '已修复',
  'not-a-bug': '不是问题',
  'need-info': '需要更多信息',
};

/** 我提交过的举报、意见、bug，和管理员的处理结果。 */
function MyReports() {
  const [reports, setReports] = useState<MyReport[] | null>(null);
  useEffect(() => {
    api<{ reports: MyReport[] }>('GET', '/api/reports/mine')
      .then((r) => setReports(r.reports))
      .catch(() => setReports([]));
  }, []);
  return (
    <section className="account-section" aria-labelledby="my-reports-title">
      <div className="section-head">
        <h2 id="my-reports-title">我的反馈</h2>
        <button type="button" className="btn btn-small btn-quiet" onClick={() => openFeedback()}>
          反馈问题
        </button>
      </div>
      {reports === null ? (
        <p className="muted">正在加载……</p>
      ) : reports.length === 0 ? (
        <p className="muted">还没有提交过。</p>
      ) : (
        <ul className="my-reports">
          {reports.map((r) => (
            <li key={r.id}>
              <p className="my-report-head">
                <span className="tag">{KIND_LABEL[r.kind] ?? r.kind}</span>
                {r.about && <span>关于 {r.about.displayName}</span>}
                <span className="entry-time">{formatTime(r.at)}</span>
                <span className={r.handledAt ? 'my-report-state is-done' : 'my-report-state'}>
                  {r.handledAt ? (OUTCOME_LABEL[r.outcome ?? 'handled'] ?? '已处理') : '等管理员处理'}
                </span>
              </p>
              <p className="pre-line">{r.body}</p>
              {r.reply && <p className="my-report-reply">管理员回复：{r.reply}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
