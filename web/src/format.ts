import { cnyRate, currentCurrency, type Currency } from './currency';

/** 补成两位数：7 → 07（时间、日期里用）。 */
export const pad = (n: number) => String(n).padStart(2, '0');

/** 数字前面带上正负号：+2、−1、0（负号用的是减号 −，不是连字符 -）。属性、检定的加减值用。 */
export const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

/** 今天的只显示时分；今年的显示月日；更早的带上年份。 */
export function formatTime(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return hm;
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  if (d.getFullYear() === now.getFullYear()) return `${md} ${hm}`;
  return `${d.getFullYear()}年${md} ${hm}`;
}

/** 带日期的时间（上次在线、创建时间、管理页里的各种记录）：今年的显示月日和时分，更早的带上年份。 */
export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  return d.getFullYear() === new Date().getFullYear() ? `${md} ${hm}` : `${d.getFullYear()}年${md} ${hm}`;
}

export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function isoTime(ms: number): string {
  return new Date(ms).toISOString();
}

/**
 * 金额（账本里是美元）：按自己选的币种显示（默认人民币，按汇率换算），不到一分钱的显示到小数点后四位。
 * currency：指定用哪种钱显示（不写是自己选的那种）。
 */
export function money(usd: number, currency: Currency = currentCurrency()): string {
  const n = currency === 'CNY' ? usd * cnyRate() : usd;
  const symbol = currency === 'CNY' ? '¥' : '$';
  const minus = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  if (abs < 0.00005) return `${symbol}0`;
  return `${minus}${symbol}${abs < 0.01 ? abs.toFixed(4) : abs.toFixed(2)}`;
}

/** AI 额度写成一句话。 */
export function creditText(c: { spent: number; total: number; unlimited: boolean; remaining: number | null }): string {
  if (c.unlimited) return `不限（已用 ${money(c.spent)}）`;
  return `剩 ${money(Math.max(0, c.remaining ?? 0))}（已用 ${money(c.spent)}，共 ${money(c.total)}）`;
}

/** 在浏览器里把一段文字存成文件。 */
export function saveFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
