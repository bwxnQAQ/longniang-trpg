import { useEffect, useState, type FormEvent } from 'react';
import { api, confirmSession, errorMessage, type User } from '../api';
import { useAuth } from '../auth';
import { AuthBrand, Field } from '../components/bits';
import { takeFlash } from '../flash';
import { Link, navigate, safeNext, useLocation } from '../router';

export function LoginPage() {
  const { setUser } = useAuth();
  const { query } = useLocation();
  const next = safeNext(query.get('next'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // 刚刚被封号退出的：说明原因
  const [notice] = useState(takeFlash);

  useEffect(() => {
    document.title = '登录 - 龙娘跑团';
  }, []);

  // 游客：不用注册，点一下就进来，只能观看
  async function enterAsGuest() {
    setError('');
    setBusy(true);
    try {
      const r = await api<{ user: User }>('POST', '/api/auth/guest');
      await confirmSession();
      setUser(r.user);
      navigate(next, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('请填写用户名和密码');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const r = await api<{ user: User }>('POST', '/api/auth/login', { username, password });
      await confirmSession();
      setUser(r.user);
      navigate(next, { replace: true });
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
        <h1>登录</h1>
        {notice && (
          <p className="callout callout-alert" role="alert">
            {notice}
          </p>
        )}
        <form className="form" onSubmit={submit} noValidate>
          <Field label="用户名" htmlFor="login-username">
            <input
              id="login-username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="密码" htmlFor="login-password">
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? '正在登录……' : '登录'}
          </button>
        </form>
        <div className="guest-entry">
          <button type="button" className="btn btn-block" disabled={busy} onClick={() => void enterAsGuest()}>
            游客进入
          </button>
        </div>
        <p className="auth-foot">
          还没有账号？<Link to="/register">去注册</Link>
        </p>
        <p className="auth-foot">
          想先了解玩法？<Link to="/rules">看看规则</Link>。
        </p>
      </div>
    </div>
  );
}
