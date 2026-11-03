import { useSyncExternalStore } from 'react';

// 金额用人民币还是美元显示：每个人自己选，记在这台浏览器上，默认人民币。
// 账本都按美元记（AI 的价格是美元标的），显示人民币时按管理员设的汇率换算（登录时从服务器拿）。

export type Currency = 'CNY' | 'USD';

const KEY = 'trpg-currency';
/** 服务器还没告诉汇率时先用这个（2026年10月的市场汇率）。 */
const FALLBACK_RATE = 6.68;

function saved(): Currency {
  try {
    return localStorage.getItem(KEY) === 'USD' ? 'USD' : 'CNY';
  } catch {
    return 'CNY';
  }
}

let currency: Currency = saved();
let rate = FALLBACK_RATE;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function setCurrency(next: Currency) {
  if (next === currency) return;
  currency = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // 存不下（无痕窗口之类）也照样切换，只是下次打开回到默认
  }
  emit();
}

/** 服务器给的汇率：1 美元换多少人民币。 */
export function setCnyRate(next: unknown) {
  if (typeof next !== 'number' || !Number.isFinite(next) || next <= 0 || next === rate) return;
  rate = next;
  emit();
}

export const currentCurrency = (): Currency => currency;
export const cnyRate = (): number => rate;

/** 美元换成现在显示用的那种钱。 */
export const fromUsd = (usd: number, c: Currency = currency): number => (c === 'CNY' ? usd * rate : usd);

/** 用到金额的组件调用它：切换币种、汇率变了时跟着重画。 */
export function useCurrency(): Currency {
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => `${currency}:${rate}`,
  );
  return currency;
}

export const CURRENCY_LABEL: Record<Currency, string> = { CNY: '人民币', USD: '美元' };
