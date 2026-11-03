// 记下网页最近的几条报错：报 bug 时一起附上（提交前会列给用户看）。只放在内存里，刷新就没了。

const MAX = 5;
const recent: string[] = [];

function remember(message: string) {
  const text = message.trim().slice(0, 500);
  if (!text || recent[recent.length - 1] === text) return;
  recent.push(text);
  if (recent.length > MAX) recent.shift();
}

window.addEventListener('error', (e) => {
  remember(e.error instanceof Error ? `${e.error.name}: ${e.error.message}` : String(e.message ?? '未知错误'));
});

window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason;
  remember(reason instanceof Error ? `${reason.name}: ${reason.message}` : `未处理的错误：${String(reason)}`);
});

/** 接口出错（不是“没登录”“没权限”这类正常的拒绝）也记一笔。 */
export function rememberApiError(method: string, path: string, status: number, message: string) {
  if (status >= 500 || status === 0) remember(`${method} ${path} → ${status || '连不上'}：${message}`);
}

export function recentErrors(): string[] {
  return [...recent];
}
