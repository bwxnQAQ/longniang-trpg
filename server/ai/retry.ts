// 调用 AI 的接口出错时重试用的小工具：ClaudeProvider（DeepSeek 也用它）和 OpenRouterProvider 共用。

/** 第 attempt 次重试前等多久（毫秒）：按 1、2、4……秒翻倍，最多 30 秒，再加不到半秒的随机数，免得大家一起重试。 */
export function backoff(attempt: number): number {
  return Math.min(30_000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 500);
}

/** 回复头 Retry-After 说要等多久（秒，换成毫秒，最多等 60 秒）；没写或者看不懂是 null。 */
export function retryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.min(60_000, seconds * 1000);
}

/** 重试前等 ms 毫秒（sleep 是等的办法，测试里换成假的）；等的时候被取消了就马上停。 */
export async function sleepUnlessAborted(sleep: (ms: number) => Promise<void>, ms: number, signal?: AbortSignal) {
  if (!signal) return sleep(ms);
  signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    sleep(ms).then(
      () => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      },
    );
  });
}
