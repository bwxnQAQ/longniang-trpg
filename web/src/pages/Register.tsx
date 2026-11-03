import { useEffect, useState, type FormEvent } from 'react';
import { api, confirmSession, errorMessage, SESSION_NOT_SAVED, type RegistrationStatus, type User } from '../api';
import { useAuth } from '../auth';
import { AuthBrand, Field } from '../components/bits';
import { setFlash } from '../flash';
import { live } from '../live';
import { Modal } from '../components/Modal';
import { UsageRulesList } from '../components/UsageRules';
import { Link, navigate, useLocation } from '../router';

// V0.7.1：游客也能打开（各页的「注册以后才能……」）。游客注册好了，服务器把原来的游客账号删掉，这里把推送连接换成新账号的。

export function RegisterPage() {
  const { user, setUser, logout } = useAuth();
  const guest = !!user?.isGuest;
  const { query } = useLocation();
  const [inviteCode, setInviteCode] = useState(query.get('code') ?? '');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // 只能用邀请码还是开放注册、是不是暂停注册了（问到之前按只能用邀请码显示）
  const [status, setStatus] = useState<RegistrationStatus>({ mode: 'invite', paused: false });
  const inviteRequired = status.mode === 'invite';

  useEffect(() => {
    document.title = '注册 - 龙娘跑团';
    api<RegistrationStatus>('GET', '/api/auth/registration')
      .then(setStatus)
      .catch(() => undefined);
  }, []);

  // 点「注册」：先检查填的东西，再弹出使用规则，同意了才真的注册
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ((inviteRequired && !inviteCode.trim()) || !username.trim() || !displayName.trim() || !password) {
      setError(inviteRequired ? '每一项都要填' : '除了邀请码，每一项都要填');
      return;
    }
    if (password !== confirm) {
      setError('两次输入的密码不一样');
      return;
    }
    setError('');
    setShowRules(true);
  }

  async function register() {
    setShowRules(false);
    setBusy(true);
    try {
      const r = await api<{ user: User; creditWithheld?: string }>('POST', '/api/auth/register', { inviteCode, username, displayName, password, agreeRules: true });
      try {
        await confirmSession();
      } catch {
        setError(`账号已经注册好了，可以直接登录。不过${SESSION_NOT_SAVED}`);
        return;
      }
      // 开放注册、这个账号没送初始额度：到大厅以后说一句为什么
      if (r.creditWithheld) setFlash(`注册好了。${r.creditWithheld}，这个账号没有初始额度，需要的话请联系管理员。`);
      // 游客注册的：推送连接还是游客的，重新连（带着新账号的登录）
      if (guest) live.restart();
      setUser(r.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <AuthBrand />
        <h1>注册</h1>
        {status.paused ? (
          <p className="form-error" role="alert">
            现在暂停了新用户注册，请过一段时间再来。
          </p>
        ) : (
          <form className="form" onSubmit={submit} noValidate>
            <Field label={inviteRequired ? '邀请码' : '邀请码（选填）'} htmlFor="reg-invite">
              <input
                id="reg-invite"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                spellCheck={false}
              />
            </Field>
            <Field label="用户名" htmlFor="reg-username" hint="3～20位字母、数字或下划线。">
              <input
                id="reg-username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-describedby="reg-username-hint"
              />
            </Field>
            <Field label="显示名" htmlFor="reg-display">
              <input id="reg-display" maxLength={20} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label="密码" htmlFor="reg-password" hint="至少8位。">
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby="reg-password-hint"
              />
            </Field>
            <Field label="再输一次密码" htmlFor="reg-confirm">
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? '正在注册……' : '注册'}
            </button>
          </form>
        )}
        <Modal open={showRules} onClose={() => setShowRules(false)} title="使用规则" wide>
          <UsageRulesList />
          <div className="form-actions modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => void register()} autoFocus>
              同意并注册
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setShowRules(false)}>
              不同意
            </button>
          </div>
        </Modal>
        <p className="auth-foot">
          已经有账号了？
          {guest ? (
            // 游客要先退出（游客账号会删掉），再去登录
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                void logout();
              }}
            >
              去登录
            </a>
          ) : (
            <Link to="/login">去登录</Link>
          )}
        </p>
        {guest && (
          <p className="auth-foot">
            <Link to="/">回到游戏大厅</Link>
          </p>
        )}
      </div>
    </div>
  );
}
