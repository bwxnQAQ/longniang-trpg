import { api } from './api';
import { navigate } from './router';

// 浏览器推送（V0.8.0）：注册 /sw.js、在这台设备上订阅（用服务器给的公钥）、取消、读这台设备现在的订阅。
// 设置在账号设置页（components/PushSettings.tsx）；退出登录前先把这台设备的订阅删掉（auth.tsx）。

/** 这台设备能不能用：ok 能；insecure 不是 https 打开的；unsupported 浏览器不支持；ios-home iPhone、iPad 没从主屏幕打开。 */
export type PushSupport = 'ok' | 'insecure' | 'unsupported' | 'ios-home';

/** iPhone、iPad（iPadOS 的 Safari 说自己是 Mac，看有没有触屏）。 */
function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** 从主屏幕打开的（iPhone、iPad 只有这样才能收通知）。 */
function standalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

export function pushSupport(): PushSupport {
  if (isIos() && !standalone()) return 'ios-home';
  if (!window.isSecureContext) return 'insecure';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  return 'ok';
}

/** 这台设备现在的订阅。没注册过 /sw.js 的不去注册（没打开过通知的人什么都不留下）。 */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await navigator.serviceWorker.getRegistration('/');
  return reg ? reg.pushManager.getSubscription() : null;
}

/** 推送地址的哈希（SHA-256，base64url）：问服务器「这台设备是哪一台」时只传它，推送地址不进网址。 */
export async function endpointHash(endpoint: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint)));
  let binary = '';
  for (const b of digest) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** 服务器给的公钥（base64url）换成字节。 */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function sameKey(sub: PushSubscription, key: Uint8Array): boolean {
  const current = sub.options.applicationServerKey;
  if (!current) return false;
  const a = new Uint8Array(current);
  return a.length === key.length && a.every((v, i) => v === key[i]);
}

/**
 * 打开这台设备的通知：这时才要通知权限；注册 /sw.js、订阅，交给服务器。
 * 返回 denied：被浏览器拦了；dismissed：没点允许（关掉了询问）。
 */
export async function enablePush(publicKey: string): Promise<'ok' | 'denied' | 'dismissed'> {
  const permission = await Notification.requestPermission();
  if (permission === 'denied') return 'denied';
  if (permission !== 'granted') return 'dismissed';
  const registered = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  // 等它装好（装不好的话，下面订阅时会报错）
  const reg = (await within(navigator.serviceWorker.ready, 10_000)) ?? registered;
  const key = keyBytes(publicKey);
  let sub = await reg.pushManager.getSubscription();
  // 以前用别的公钥订阅的（服务器换过密钥）：先取消，不然订阅不了
  if (sub && !sameKey(sub, key)) {
    await sub.unsubscribe();
    sub = null;
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  await api('POST', '/api/push/subscriptions', sub.toJSON());
  return 'ok';
}

/** 关掉这台设备的通知：服务器上删掉，再取消订阅。 */
export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await api('DELETE', '/api/push/subscriptions', { endpoint: sub.endpoint });
  await sub.unsubscribe();
}

/** 最多等 ms 毫秒，等不到当作 null。 */
function within<T>(work: Promise<T>, ms = 3000): Promise<T | null> {
  return Promise.race([work, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

/**
 * 退出登录前：这台设备订阅了的话，先在服务器上删掉这台设备的订阅、再取消订阅
 * （不然下一个在这台电脑上登录的人会收到上一个人的通知）。出错、太慢都不影响退出。
 */
export async function forgetThisDevice(): Promise<void> {
  try {
    const sub = await within(currentSubscription());
    if (!sub) return;
    await within(api('DELETE', '/api/push/subscriptions', { endpoint: sub.endpoint }).catch(() => null));
    await within(sub.unsubscribe().catch(() => false));
  } catch {
    // 退出登录要紧
  }
}

/** 这个标签页里已经把订阅交给服务器了（存的是账号编号）：每个标签页交一次就够。 */
const BOUND_KEY = 'push-bound';

function readBound(): string | null {
  try {
    return sessionStorage.getItem(BOUND_KEY);
  } catch {
    return null;
  }
}

function writeBound(value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(BOUND_KEY);
    else sessionStorage.setItem(BOUND_KEY, value);
  } catch {
    // 存不了（隐私模式）：每次打开网站多交一次，没关系
  }
}

/** 正在交的（同时只交一次）。 */
let syncing: Promise<void> | null = null;

/**
 * 登录以后（每个标签页一次）：这个浏览器里有订阅、通知权限还在，就重新交给服务器，绑到现在的登录上
 * （登录过期、改了密码以后重新登录的，通知自动接上；上一个人没退出登录留下的订阅换成现在这个账号的，不会收到别人的通知）。
 * 游客打不开通知，浏览器里有的一定是别人的：取消掉。
 */
export function syncThisDevice(userId: number, isGuest: boolean): Promise<void> {
  if (readBound() === String(userId)) return Promise.resolve();
  // 登录以后和账号设置页可能同时要交：只交一次
  syncing ??= (async () => {
    try {
      const sub = await within(currentSubscription());
      if (sub && isGuest) await sub.unsubscribe();
      else if (sub && 'Notification' in window && Notification.permission === 'granted') {
        await api('POST', '/api/push/subscriptions', sub.toJSON());
      }
      writeBound(String(userId));
    } catch {
      // 交不上（网络不好）：下次打开网站再交
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

/** 退出登录了（或者登录没了）：下次登录，哪怕在同一个标签页里，也要再交一次。 */
export function forgetBound() {
  writeBound(null);
}

// 点了通知、网站已经开着：sw.js 让这个页面自己换到那一页（不用整页重新加载），换好了回它一声
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data as { type?: unknown; url?: unknown } | null;
      if (!data || data.type !== 'push-open' || typeof data.url !== 'string') return;
      // 只认本站的地址（按本站解析一遍，"/\t/evil.example" 这类其实是别的网站）
      let target: URL;
      try {
        target = new URL(data.url, location.origin);
      } catch {
        return;
      }
      if (target.origin !== location.origin) return;
      const path = target.pathname + target.search + target.hash;
      if (location.pathname + location.search + location.hash !== path) navigate(path);
      event.ports[0]?.postMessage('ok');
    });
    navigator.serviceWorker.startMessages?.();
  }
} catch {
  // 老浏览器：点通知时 sw.js 会改用整页打开
}
