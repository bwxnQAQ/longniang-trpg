// 龙娘跑团的 Service Worker（V0.8.0）：只管浏览器推送，不做离线缓存（没有 fetch 处理，网页的请求不经过它）。
// 这个文件原样复制到网站根目录（/sw.js），不经过打包，所以是普通的 JavaScript。
// 处理的事件：push（弹通知）、notificationclick（点了去哪）、pushsubscriptionchange（推送地址换了，重新交给服务器）。
// 服务器推来的内容是 JSON：{ title, body, url, tag, startsAt?, always?, renotify? }。

'use strict';

const WEEKDAYS = '日一二三四五六';

/** 约团的开始时间按这台设备的本地时间写，比如「10月30日 周五 20:00」（服务器不知道对方在哪个时区）。 */
function formatTime(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAYS[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 只认站内的地址，别的一律回首页。浏览器解析网址时会去掉制表符、换行，把 \ 当成 /：
 * "/\t/evil.example"、"/\\evil.example" 其实都是 //evil.example（别的网站）。先照这样清理，再按本站解析一遍，
 * 解析出来还是本站的，才用解析后的路径。
 */
function safePath(url) {
  if (typeof url !== 'string') return '/';
  const cleaned = url.replace(/[\t\n\r]/g, '').replace(/\\/g, '/');
  if (!cleaned.startsWith('/') || cleaned.startsWith('//')) return '/';
  if (typeof URL !== 'function') return cleaned;
  const origin = (self.location && self.location.origin) || 'https://sw.invalid';
  try {
    const parsed = new URL(cleaned, origin);
    return parsed.origin === origin ? parsed.pathname + parsed.search + parsed.hash : '/';
  } catch {
    return '/';
  }
}

// 新版本的 sw.js 马上生效，已经开着的页面也归它管（点通知时才能让那个页面换页）
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  event.waitUntil(show(data && typeof data === 'object' ? data : {}));
});

async function show(data) {
  const title = typeof data.title === 'string' && data.title ? data.title : '龙娘跑团';
  let body = typeof data.body === 'string' ? data.body : '';
  if (typeof data.startsAt === 'number' && Number.isFinite(data.startsAt)) body = body.replace('{time}', formatTime(data.startsAt));
  if (!data.always) {
    // 网页正开在前台：页面上已经看得到了，不弹
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (windows.some((w) => w.focused)) return;
  }
  const tag = typeof data.tag === 'string' && data.tag ? data.tag : undefined;
  await self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    // 同一件事（同一局、同一个人的私信）后来的替换前面的，不再响；要紧的（快开团、轮到你）照样响
    ...(tag ? { tag, renotify: data.renotify === true } : {}),
    data: { url: safePath(data.url) },
  });
}

// 浏览器换了这台设备的推送地址（订阅过期、推送服务换了）：用原来的选项重新订阅，交给服务器（同源的请求带着登录）。
// 失败就算了：下次打开网站时网页会把订阅再交一次
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(resubscribe(event.oldSubscription || null, event.newSubscription || null));
});

/** 服务器给的公钥（base64url）换成字节。 */
function keyBytes(base64url) {
  const b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function resubscribe(oldSub, newSub) {
  try {
    let sub = newSub;
    if (!sub) {
      let key = oldSub && oldSub.options ? oldSub.options.applicationServerKey : null;
      if (!key) {
        // 原来的选项拿不到：问服务器要公钥（没登录就算了）
        const res = await fetch('/api/push', { credentials: 'same-origin' });
        if (!res.ok) return;
        const info = await res.json();
        if (!info || typeof info.publicKey !== 'string') return;
        key = keyBytes(info.publicKey);
      }
      sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    }
    const json = (body) => ({ method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    await fetch('/api/push/subscriptions', json(sub.toJSON()));
    // 原来的地址已经不能用了：从服务器上删掉
    if (oldSub && oldSub.endpoint && oldSub.endpoint !== sub.endpoint) {
      await fetch('/api/push/subscriptions', { ...json({ endpoint: oldSub.endpoint }), method: 'DELETE' });
    }
  } catch {
    // 下次打开网站时网页会再交一次
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = safePath(event.notification.data && event.notification.data.url);
  event.waitUntil(openPage(url));
});

/** 有开着的本站页面：切过去、换到那一页；没有就开一个新的。 */
async function openPage(url) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const win = windows.find((w) => w.focused) || windows.find((w) => w.visibilityState === 'visible') || windows[0];
  if (!win) {
    await self.clients.openWindow(url);
    return;
  }
  try {
    await win.focus();
  } catch {
    // 有的浏览器不让切过去，照样换页
  }
  // 先让页面自己换（不用整页重新加载，正在写的东西不会丢）；页面没回应再让浏览器打开那个地址
  if (await askPage(win, url)) return;
  try {
    await win.navigate(url);
  } catch {
    await self.clients.openWindow(url);
  }
}

function askPage(win, url) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), 1000);
    channel.port1.onmessage = () => {
      clearTimeout(timer);
      resolve(true);
    };
    try {
      win.postMessage({ type: 'push-open', url }, [channel.port2]);
    } catch {
      clearTimeout(timer);
      resolve(false);
    }
  });
}
