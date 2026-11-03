import { useEffect, useRef } from 'react';
import { setLeaveGuard } from '../router';

// 剧本编辑器有改动还没保存时，离开页面先问一下：
// 站内跳转（<Link>、头像菜单里的按钮这些 navigate()，浏览器和顶栏的后退前进）由路由的离开前确认来问；
// 关掉标签页、刷新、去别的网站用 beforeunload。

const MESSAGE = '有改动还没保存，确定离开吗？';

/** 编辑器自己要跳走（开好局去对局页）时不问。 */
let bypass = false;

export function leaveWithoutAsking(go: () => void) {
  bypass = true;
  try {
    go();
  } finally {
    bypass = false;
  }
}

/** onDiscard：问了以后点了「确定」（不要这些改动了）时调用。 */
export function useLeaveGuard(dirty: boolean, onDiscard?: () => void) {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const discardRef = useRef(onDiscard);
  discardRef.current = onDiscard;

  useEffect(() => {
    const unset = setLeaveGuard(() => {
      if (!dirtyRef.current || bypass) return true;
      if (!window.confirm(MESSAGE)) return false;
      discardRef.current?.();
      return true;
    });
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current || bypass) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      unset();
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);
}
