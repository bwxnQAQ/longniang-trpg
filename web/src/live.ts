import { useEffect, useRef, useSyncExternalStore } from 'react';
import { api, type Badges } from './api';

// 实时推送：整个网页只开一条连接（浏览器对同一个网站的连接数有上限，开多个标签页时不够用）。
// 在对局页面里连这一局的推送（也算“在这一局在线”）；在别的页面连全站的推送（大厅、好友、通知、公告）。
// 跟着人走的推送（未读数、通知、私信、公告）两种连接都会收到。

type Handler = (data: any) => void;

const LOBBY_URL = '/api/events';

class Live {
  private es: EventSource | null = null;
  private url: string | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private openHandlers = new Set<() => void>();
  private lostHandlers = new Set<() => void>();
  private stopped = true;

  /** 连到这个地址（已经连着就不重连）。 */
  use(url: string) {
    this.stopped = false;
    if (this.url === url && this.es) return;
    this.close();
    this.url = url;
    const es = new EventSource(url);
    this.es = es;
    for (const name of this.handlers.keys()) this.attach(es, name);
    es.addEventListener('open', () => {
      if (this.es !== es) return;
      window.dispatchEvent(new Event('site:up'));
      for (const fn of [...this.openHandlers]) fn();
    });
    es.addEventListener('error', () => {
      if (this.es !== es) return;
      this.probe();
      // 服务器不让连了（登录失效了、这一局看不了了）：浏览器不会再自己重连，告诉页面去确认一下
      if (es.readyState !== EventSource.CLOSED) return;
      for (const fn of [...this.lostHandlers]) fn();
    });
  }

  /** 回到全站的推送（离开对局页面时）。 */
  useLobby() {
    this.use(LOBBY_URL);
  }

  /** 重新连一次同一个地址：在对局里的身份变了（从观看变成了成员），服务器要按新身份推送。 */
  restart() {
    if (this.stopped || !this.url) return;
    const url = this.url;
    this.close();
    this.use(url);
  }

  /** 退出登录：断开。 */
  stop() {
    this.stopped = true;
    this.close();
    this.url = null;
  }

  get current(): string | null {
    return this.stopped ? null : this.url;
  }

  private close() {
    this.es?.close();
    this.es = null;
  }

  private probing = false;

  /**
   * 推送断了（V0.9.0）：看看是不是整个网站都连不上了（网站的电脑关了、在升级维护、自己断网了）。是的话顶上写一行
   * （components/SiteDown.tsx），网站回来以后它会重新连上。十秒内只看一次（断着的时候浏览器每隔几秒重连一次）。
   */
  private probe() {
    if (this.probing) return;
    this.probing = true;
    fetch('/api/health', { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => {
        if (r.status === 502 || r.status === 503 || r.status === 504 || (r.status >= 520 && r.status <= 530)) {
          window.dispatchEvent(new CustomEvent('site:down', { detail: 'maintenance' }));
        }
      })
      .catch(() => window.dispatchEvent(new CustomEvent('site:down', { detail: 'network' })))
      .finally(() => window.setTimeout(() => (this.probing = false), 10_000));
  }

  private attach(es: EventSource, name: string) {
    es.addEventListener(name, (e) => {
      if (this.es !== es) return;
      let data: unknown = null;
      try {
        data = JSON.parse((e as MessageEvent).data);
      } catch {
        return;
      }
      for (const fn of [...(this.handlers.get(name) ?? [])]) fn(data);
    });
  }

  on(name: string, fn: Handler): () => void {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
      if (this.es) this.attach(this.es, name);
    }
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  }

  /** 连上（包括断线重连）以后：补拉错过的东西。 */
  onOpen(fn: () => void): () => void {
    this.openHandlers.add(fn);
    return () => {
      this.openHandlers.delete(fn);
    };
  }

  /** 服务器拒绝了这条连接（不会再自动重连）。 */
  onLost(fn: () => void): () => void {
    this.lostHandlers.add(fn);
    return () => {
      this.lostHandlers.delete(fn);
    };
  }
}

export const live = new Live();

/** 订阅一种推送。handler 每次渲染都可以是新的函数，不会重复订阅。 */
export function useLiveEvent<T = any>(name: string, handler: (data: T) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => live.on(name, (data) => ref.current(data)), [name]);
}

/** 连上、重连以后要做的事。 */
export function useLiveOpen(handler: () => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => live.onOpen(() => ref.current()), []);
}

/** 服务器不让连了以后要做的事（重新拉一次，看看是登录失效了还是看不了了）。 */
export function useLiveLost(handler: () => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => live.onLost(() => ref.current()), []);
}

// ---------- 未读数：铃铛、好友、管理旁边的数字 ----------

const EMPTY: Badges = { notifications: 0, announcements: 0, messages: 0, groups: 0, friendRequests: 0, admin: 0, adminReports: 0, adminViolations: 0, adminSubmissions: 0 };
let badges: Badges = EMPTY;
const badgeListeners = new Set<() => void>();

function setBadges(next: Badges) {
  badges = next;
  for (const fn of badgeListeners) fn();
}

live.on('badges', (data: Badges) => setBadges({ ...EMPTY, ...data }));

/** 重新拉一次未读数（读了通知、私信以后）。 */
export async function refreshBadges() {
  try {
    setBadges({ ...EMPTY, ...(await api<Badges>('GET', '/api/me/badges')) });
  } catch {
    // 拿不到就等下一次推送
  }
}

export function resetBadges() {
  setBadges(EMPTY);
}

export function useBadges(): Badges {
  return useSyncExternalStore(
    (fn) => {
      badgeListeners.add(fn);
      return () => {
        badgeListeners.delete(fn);
      };
    },
    () => badges,
  );
}
