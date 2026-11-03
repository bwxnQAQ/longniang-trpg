import { useSyncExternalStore } from 'react';
import { api } from './api';
import { live } from './live';

// 自己的龙晶（V0.7.0，顶栏右上角）：打开网页、重新连上推送时拉一次；龙晶变了服务器推 crystals 过来。
// 页面上买了东西、开了宝箱拿到新的数，也可以直接 setCrystals。

let crystals: number | null = null;
const listeners = new Set<() => void>();

function set(next: number | null) {
  if (next === crystals) return;
  crystals = next;
  for (const fn of listeners) fn();
}

live.on('crystals', (data: { crystals?: unknown }) => {
  if (typeof data?.crystals === 'number') set(data.crystals);
});

export async function refreshCrystals() {
  try {
    set((await api<{ crystals: number }>('GET', '/api/me/crystals')).crystals);
  } catch {
    // 拿不到就等下一次推送
  }
}

export function setCrystals(n: number) {
  set(n);
}

/** 退出登录、换成游客：不显示。 */
export function resetCrystals() {
  set(null);
}

/** 自己的龙晶（还没拿到是 null）。 */
export function useCrystals(): number | null {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => crystals,
  );
}
