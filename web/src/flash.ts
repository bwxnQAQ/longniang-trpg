// 跳转到另一个页面后还要显示的一句提示，比如“已删除对局”。显示一次就清掉。
let pending: string | null = null;

export function setFlash(message: string) {
  pending = message;
}

export function takeFlash(): string | null {
  const message = pending;
  pending = null;
  return message;
}
