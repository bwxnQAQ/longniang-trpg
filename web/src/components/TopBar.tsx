import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../auth';
import { refreshCrystals, resetCrystals, useCrystals } from '../crystals';
import { useBadges, useLiveOpen } from '../live';
import { Link, navigate, useHistoryNav, useLocation } from '../router';
import { APP_NAME, Logo } from './bits';
import { openFeedback } from './Feedback';
import { Avatar, profilePath } from './people';

/** 数字小圆点：0 不显示，99 以上写 99+。 */
export function Count({ n, label }: { n: number; label: string }) {
  if (n <= 0) return null;
  return (
    <span className="count" aria-label={`${n}${label}`}>
      {n > 99 ? '99+' : n}
    </span>
  );
}

export function TopBar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const nav = useHistoryNav();
  const badges = useBadges();
  if (!user) return null;
  const current = (path: string) => (pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)) ? 'page' : undefined);
  const bell = badges.notifications + badges.announcements;
  const friends = badges.messages + badges.groups + badges.friendRequests;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-start">
          <div className="history-nav">
            <button type="button" className="nav-arrow" onClick={nav.back} disabled={!nav.canBack} aria-label="后退" title="后退">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M10 3L5 8l5 5" />
              </svg>
            </button>
            <button type="button" className="nav-arrow" onClick={nav.forward} disabled={!nav.canForward} aria-label="前进" title="前进">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M6 3l5 5-5 5" />
              </svg>
            </button>
          </div>
          <Link to="/" className="brand" aria-label={`${APP_NAME}，回到游戏大厅`}>
            <Logo />
            <span className="brand-name">{APP_NAME}</span>
          </Link>
          {/* 主菜单放在左上角，紧挨着站名；右上角只留通知和自己的头像。游客也看得到每一项、点得进去（V0.7.1） */}
          <MainNav pathname={pathname}>
            <Link to="/" aria-current={current('/')}>
              游戏大厅
            </Link>
            <Link to="/scenarios" aria-current={current('/scenarios')}>
              剧本大厅
            </Link>
            <Link to="/dungeons" aria-current={current('/dungeons')}>
              地下城
            </Link>
            {/* 模组（V1.0.0）：5E 模组单独一页 */}
            <Link to="/modules" aria-current={current('/modules')}>
              模组
            </Link>
            {/* AI 大厅（V1.1.0）：大家做的 AI 角色 */}
            <Link to="/ai-hall" aria-current={current('/ai-hall')}>
              AI 大厅
            </Link>
            <Link to="/rooms" aria-current={current('/rooms')}>
              我的对局
            </Link>
            {/* 宠物、装扮 V0.8.1 挪进了头像菜单（「我的宠物」「我的装扮」） */}
            <Link to="/shop" aria-current={current('/shop')}>
              商城
            </Link>
            <Link to="/collection" aria-current={current('/collection')}>
              图鉴
            </Link>
            <Link to="/friends" aria-current={current('/friends')}>
              社交
              <Count n={friends} label="条未读" />
            </Link>
            <Link to="/rankings" aria-current={current('/rankings')}>
              排行
            </Link>
            <Link to="/rules" aria-current={current('/rules')}>
              规则
            </Link>
            {user.isAdmin && (
              <Link to="/admin" aria-current={current('/admin')}>
                管理
                <Count n={badges.admin} label="件待处理" />
              </Link>
            )}
          </MainNav>
        </div>
        <div className="topnav topbar-end">
          {!user.isGuest && <CrystalCount />}
          <Link to="/notifications" className="nav-bell" aria-current={current('/notifications')} aria-label={bell ? `通知，${bell}条未读` : '通知'} title="通知和公告">
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M10 2.6c-2.6 0-4.6 2-4.6 4.6v3.1L3.8 13.4h12.4l-1.6-3.1V7.2c0-2.6-2-4.6-4.6-4.6z" />
              <path d="M8 15.6a2 2 0 0 0 4 0" />
            </svg>
            <Count n={bell} label="条未读" />
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

/** 右上角自己的龙晶（V0.7.0）：点了去商城。龙晶变了服务器会推过来。 */
function CrystalCount() {
  const { user } = useAuth();
  const crystals = useCrystals();
  useEffect(() => {
    void refreshCrystals();
    return () => resetCrystals();
  }, [user?.id]);
  // 断线重连以后补拉一次（断着的时候可能错过了推送）
  useLiveOpen(() => void refreshCrystals());
  return (
    <Link to="/shop" className="nav-crystals" aria-label={crystals === null ? '龙晶，去商城' : `龙晶 ${crystals}，去商城`} title="龙晶">
      <span className="crystal-mark" aria-hidden="true" />
      <span className="nav-crystals-count">{crystals ?? '…'}</span>
    </Link>
  );
}

/**
 * 主菜单。放不下时左右滑：换页面时把当前这一项滑进来；哪一头还有没露出来的菜单项，那一头淡出去。
 */
function MainNav({ pathname, children }: { pathname: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const left = el.scrollLeft > 1;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    const active = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !active || el.scrollWidth <= el.clientWidth) return;
    const box = el.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.left < box.left) el.scrollLeft -= box.left - item.left + 24;
    else if (item.right > box.right) el.scrollLeft += item.right - box.right + 24;
  }, [pathname]);

  return (
    <nav ref={ref} className={`topnav topnav-main${more.left ? ' more-left' : ''}${more.right ? ' more-right' : ''}`} aria-label="主菜单">
      {children}
    </nav>
  );
}

/**
 * 头像菜单：我的主页、我的角色、我的宠物、我的背包、我的装扮、账号设置、反馈问题、使用规则、退出登录。
 * V0.8.1：宠物、装扮从顶栏挪到这里。V0.8.2：按这个顺序排。游客也看得到我的宠物、我的装扮（点进去看看，养、戴要注册），
 * 我的主页、我的角色、我的背包只给正式账号。
 */
function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  // 换页面、点外面、按 Esc 都收起来
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  if (!user) return null;
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-menu-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} title={user.displayName}>
        <Avatar user={user} size={30} />
        <span className="user-menu-name">{user.displayName}</span>
      </button>
      {open && (
        <div className="user-menu-list" role="menu">
          <p className="user-menu-who">
            <strong>{user.displayName}</strong>
            <span className="muted">{user.isGuest ? '游客' : user.username}</span>
          </p>
          {!user.isGuest && (
            <>
              <button type="button" role="menuitem" onClick={() => go(profilePath(user.publicId))}>
                我的主页
              </button>
              <button type="button" role="menuitem" onClick={() => go('/characters')}>
                我的角色
              </button>
            </>
          )}
          <button type="button" role="menuitem" onClick={() => go('/pet')}>
            我的宠物
          </button>
          {!user.isGuest && (
            <button type="button" role="menuitem" onClick={() => go('/bag')}>
              我的背包
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => go('/wardrobe')}>
            我的装扮
          </button>
          <button type="button" role="menuitem" onClick={() => go('/account')}>
            {user.isGuest ? '账号' : '账号设置'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              openFeedback();
            }}
          >
            反馈问题
          </button>
          <button type="button" role="menuitem" onClick={() => go('/terms')}>
            使用规则
          </button>
          <button type="button" role="menuitem" className="user-menu-logout" onClick={() => void logout()}>
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
