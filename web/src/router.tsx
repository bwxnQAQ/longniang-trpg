import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes } from 'react';

// 一个很小的前端路由：用浏览器的 history 切换页面，不刷新整页

const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

// 记下当前在站内历史里的第几步，用来判断“后退”“前进”按钮能不能按。
// 步数存在每条历史记录自己身上（刷新也不丢），最远走到第几步存在这个标签页的 sessionStorage 里。
const MAX_KEY = 'nav-max-step';
let step = 0;
let maxStep = 0;

function readMaxStep(): number {
  try {
    return Number(sessionStorage.getItem(MAX_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeMaxStep(value: number) {
  try {
    sessionStorage.setItem(MAX_KEY, String(value));
  } catch {
    // 隐私模式等情况下存不了，只影响“前进”按钮在刷新后是否可用
  }
}

const initial = history.state as { step?: unknown } | null;
if (initial && typeof initial.step === 'number') {
  step = initial.step;
  maxStep = Math.max(step, readMaxStep());
} else {
  history.replaceState({ step: 0 }, '');
  writeMaxStep(0);
}

// 离开前确认（V0.8.0，剧本编辑器有没保存的改动时用）：换到别的页面、后退、前进之前先问它，返回 false 就留在这一页。
// 同一时间只有一个（当前页面的）。关掉标签页、刷新、去别的网站不经过这里，页面自己用 beforeunload。
let leaveGuard: (() => boolean) | null = null;
/** 现在显示的是哪一页（地址的路径和查询参数）：后退前进只换了 #… 的不算换页面。 */
let shown = location.pathname + location.search;
/** 不让走、退回原页时要回到第几步：那一下引起的 popstate 不处理（地址、步数都已经是原来的）。 */
let restoringTo: number | null = null;

const here = () => location.pathname + location.search;

/** 设一个离开前确认（传 null 是取消）。返回的函数取消这一个（已经换成别的就不动）。 */
export function setLeaveGuard(fn: (() => boolean) | null): () => void {
  leaveGuard = fn;
  return () => {
    if (leaveGuard === fn) leaveGuard = null;
  };
}

/** 现在能不能离开这一页（没设确认的直接能走）。要先办事再跳转的地方（比如退出登录）可以先问它。 */
export function confirmLeave(): boolean {
  return !leaveGuard || leaveGuard();
}

window.addEventListener('popstate', (e) => {
  const state = e.state as { step?: unknown } | null;
  const next = state && typeof state.step === 'number' ? state.step : null;
  if (restoringTo !== null) {
    const expected = restoringTo;
    restoringTo = null;
    if (next === expected) return;
  }
  // 后退、前进到别的页面，离开前要确认的不让走：退回原页（后退了几步就前进几步，前进了就后退），页面不重画
  if (next !== null && next !== step && here() !== shown && !confirmLeave()) {
    restoringTo = step;
    history.go(step - next);
    return;
  }
  step = next ?? 0;
  if (step > maxStep) maxStep = step;
  shown = here();
  emit();
});

/**
 * 站内跳转（<Link> 也走这里）。换到别的页面之前，离开前要确认的先问一下，不让走就不跳。
 * replace 是纠正地址（登录前后的跳转、页面里换分页这些），不问。
 */
export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (!opts.replace) {
    const next = new URL(to, location.href);
    if (next.pathname + next.search !== here() && !confirmLeave()) return;
  }
  if (opts.replace) {
    history.replaceState({ step }, '', to);
  } else {
    step += 1;
    maxStep = step; // 走了新的一步，原来“前进”方向的记录就作废了
    writeMaxStep(maxStep);
    history.pushState({ step }, '', to);
    window.scrollTo(0, 0);
  }
  shown = here();
  emit();
}

function historySnapshot() {
  return `${step}/${maxStep}`;
}

/** 顶栏的后退、前进按钮用：只在站内走，不会退出网站。 */
export function useHistoryNav() {
  useSyncExternalStore(subscribe, historySnapshot);
  return {
    canBack: step > 0,
    canForward: step < maxStep,
    back: () => history.back(),
    forward: () => history.forward(),
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot() {
  return location.pathname + location.search;
}

export function useLocation() {
  const key = useSyncExternalStore(subscribe, snapshot);
  const url = new URL(key, location.origin);
  return { pathname: url.pathname, search: url.search, query: url.searchParams };
}

export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const a = pattern.split('/').filter(Boolean);
  const b = pathname.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) {
      try {
        params[a[i].slice(1)] = decodeURIComponent(b[i]);
      } catch {
        return null;
      }
    } else if (a[i] !== b[i]) {
      return null;
    }
  }
  return params;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export function Link({ to, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
    />
  );
}

export function Redirect({ to }: { to: string }) {
  useEffect(() => {
    navigate(to, { replace: true });
  }, [to]);
  return null;
}

/** 只允许站内跳转，防止登录后被带到别的网站。 */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}
