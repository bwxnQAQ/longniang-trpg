import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type User } from './api';
import { setCnyRate } from './currency';
import { setFlash } from './flash';
import { live, refreshBadges, resetBadges } from './live';
import { forgetBound, forgetThisDevice, syncThisDevice } from './push';
import { confirmLeave, navigate } from './router';
import { clearBackups } from './editor/backup';

type AuthState = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  /** 重新拉一次自己的信息（改了显示名、头像，或者管理员改了你的身份以后）。 */
  reload: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const r = await api<{ user: User | null; cnyRate?: number }>('GET', '/api/auth/me');
      setCnyRate(r.cnyRate);
      setUser(r.user);
    } catch {
      // 网络出错时先保留现在的信息
    }
  }, []);

  useEffect(() => {
    api<{ user: User | null; cnyRate?: number }>('GET', '/api/auth/me')
      .then((r) => {
        setCnyRate(r.cnyRate);
        setUser(r.user);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const expired = () => setUser(null);
    const banned = (e: Event) => {
      setFlash((e as CustomEvent<string>).detail);
      setUser(null);
    };
    window.addEventListener('auth:expired', expired);
    window.addEventListener('auth:banned', banned);
    // 站长任命、撤销了你的管理员身份：顶栏和管理页的入口跟着变
    const offMe = live.on('me-changed', () => void reload());
    // 推送连接被服务器拒绝了：可能是在别处点了「退出其他设备」、改了密码，问一下还是不是登录着
    const offLost = live.onLost(() => void reload());
    return () => {
      window.removeEventListener('auth:expired', expired);
      window.removeEventListener('auth:banned', banned);
      offMe();
      offLost();
    };
  }, [reload]);

  // 登录了（并且同意过使用规则）就连上推送；退出就断开
  const signedIn = !!user?.rulesAgreed;
  useEffect(() => {
    if (!signedIn) {
      live.stop();
      resetBadges();
      return;
    }
    if (!live.current) live.useLobby();
    void refreshBadges();
  }, [signedIn]);

  // 浏览器通知（V0.8.0）：登录以后把这个浏览器的订阅绑到现在的登录上（每个标签页一次）；退出了、登录没了，下次登录再绑
  const signedInId = signedIn ? (user?.id ?? null) : null;
  const signedInGuest = !!user?.isGuest;
  useEffect(() => {
    if (loading) return;
    if (signedInId === null) forgetBound();
    else void syncThisDevice(signedInId, signedInGuest);
  }, [loading, signedInId, signedInGuest]);

  // 游客退出登录，这个游客账号就删掉了：先确认
  const logout = useCallback(async () => {
    if (user?.isGuest && !window.confirm('退出登录以后，这个游客账号会被删除。')) return;
    // 正在写的东西还没保存（剧本编辑器）：问一句，取消就不退出（最后问：点了确定就一定退出，没保存的改动跟着删掉）
    if (!confirmLeave()) return;
    // 剧本编辑器暂存在这个浏览器里的、没保存的内容：删掉（V0.8.0，下一个用这台电脑的人看不到）
    if (user) clearBackups(user.id);
    // 这台设备打开了浏览器通知：先删掉（不然下一个在这台电脑上登录的人会收到上一个人的通知）；出错不影响退出
    if (user?.isGuest === false) await forgetThisDevice();
    try {
      await api('POST', '/api/auth/logout');
    } finally {
      setUser(null);
      navigate('/login', { replace: true });
    }
  }, [user?.isGuest, user?.id]);

  return <AuthContext.Provider value={{ user, loading, setUser, reload, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 里面使用');
  return ctx;
}
