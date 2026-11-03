import { useEffect, useState } from 'react';
import { live } from '../live';
import { APP_QQ_GROUP } from '../version';

// 网站的电脑不在线（V0.9.0）：升级维护、关机、断网时，已经开着的网页顶上写一行，每隔一会儿看看网站回来了没有，
// 回来了就把这行收起来、重新连上推送（打开新网页时看到的是 Cloudflare 上的维护页，见 cloudflare/maintenance-worker.js）。

const CHECK_MS = 15_000;

export function SiteDownBanner() {
  const [down, setDown] = useState<null | 'maintenance' | 'network'>(null);

  useEffect(() => {
    const onDown = (e: Event) => setDown((d) => (d === 'maintenance' ? d : ((e as CustomEvent<'maintenance' | 'network'>).detail ?? 'network')));
    // 推送自己重新连上了（live.ts）：网站回来了
    const onUp = () => setDown(null);
    window.addEventListener('site:down', onDown);
    window.addEventListener('site:up', onUp);
    return () => {
      window.removeEventListener('site:down', onDown);
      window.removeEventListener('site:up', onUp);
    };
  }, []);

  useEffect(() => {
    if (!down) return;
    let stopped = false;
    async function check() {
      try {
        const r = await fetch('/api/health', { cache: 'no-store', credentials: 'same-origin' });
        if (!stopped && r.ok && (r.headers.get('content-type') ?? '').includes('application/json')) {
          setDown(null);
          live.restart();
        }
      } catch {
        // 还没回来
      }
    }
    const timer = window.setInterval(() => void check(), CHECK_MS);
    window.addEventListener('online', check);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener('online', check);
    };
  }, [down]);

  if (!down) return null;
  return (
    <div className="site-down" role="status">
      {down === 'maintenance' ? '网站正在升级维护，回来以后这里会自动重新连上。' : '连不上网站了，网络恢复以后会自动重新连上。'}
      {down === 'maintenance' && APP_QQ_GROUP && (
        <span className="site-down-qq">
          QQ群 <span className="site-down-qq-number">{APP_QQ_GROUP}</span>
        </span>
      )}
    </div>
  );
}
