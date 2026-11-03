import { useEffect, useState } from 'react';
import type { GameState } from '../api';
import { pad } from '../format';

/** 每隔 intervalMs 重新渲染一次，用来走倒计时和游戏时钟；传 null 就不走。 */
export function useNow(intervalMs: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (intervalMs === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** 现在的游戏时间（分钟）。serverOffset 是服务器时间减去本机时间。 */
export function currentGameMinutes(clock: NonNullable<GameState['clock']>, fetchedAt: number, now: number): number {
  if (!clock.running) return clock.minutes;
  return clock.minutes + Math.max(0, now - fetchedAt) * clock.minutesPerMs;
}

/** 还要等多久，写成“还剩 23 分钟”“还剩 1 小时 5 分钟”。 */
export function formatRemaining(ms: number): string {
  if (ms <= 30_000) return '马上就好';
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return `还剩 ${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `还剩 ${h} 小时 ${m} 分钟` : `还剩 ${h} 小时`;
}

/** 现实时间的“几点几分”。 */
export function clockTime(ms: number): string {
  const d = new Date(ms);
  const sameDay = d.toDateString() === new Date().toDateString();
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return sameDay ? hm : `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
}
