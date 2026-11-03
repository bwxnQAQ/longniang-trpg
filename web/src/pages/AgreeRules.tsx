import { useEffect, useState } from 'react';
import { api, errorMessage, type User } from '../api';
import { useAuth } from '../auth';
import { AuthBrand } from '../components/bits';
import { UsageRulesList } from '../components/UsageRules';

/** 以前注册、还没同意过使用规则的账号：同意以后才能接着用。 */
export function AgreeRulesPage() {
  const { setUser, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = '使用规则 - 龙娘跑团';
  }, []);

  async function agree() {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ user: User }>('POST', '/api/auth/agree-rules', {});
      setUser(r.user);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <main id="main" className="auth-page">
      <div className="auth-panel auth-panel-wide">
        <AuthBrand />
        <h1>使用规则</h1>
        <UsageRulesList />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => void agree()}>
          {busy ? '正在保存……' : '我同意'}
        </button>
        <p className="auth-foot">
          <button type="button" className="linklike" onClick={() => void logout()}>
            不同意，退出登录
          </button>
        </p>
      </div>
    </main>
  );
}
