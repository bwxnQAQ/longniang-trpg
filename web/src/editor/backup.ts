import { isObj, type Obj } from './doc';

// 剧本编辑器没保存的改动，另外存一份在这个浏览器里（V0.8.0）：登录突然失效（被跳去登录页）、标签页被关掉、电脑没电……
// 回来打开同一份草稿时能恢复。键里带账号编号和草稿编号（还没存过的是 new）；存好了就删，退出登录时删掉这个账号的。
// 浏览器不让存（隐私模式、存满了）就算了：读写都不出错。

const PREFIX = 'editor-unsaved:';

/** at：存这一份的时间（这台电脑的钟）；base：这些改动是在服务器上哪一次保存（updatedAt）的基础上改的，新草稿是 null。 */
export type Backup = { at: number; base: number | null; data: Obj };

const keyOf = (userId: number, draftId: number | null) => `${PREFIX}${userId}:${draftId ?? 'new'}`;

export function readBackup(userId: number, draftId: number | null): Backup | null {
  try {
    const raw = localStorage.getItem(keyOf(userId, draftId));
    if (!raw) return null;
    const v: unknown = JSON.parse(raw);
    if (!isObj(v) || !isObj(v.data) || typeof v.at !== 'number') return null;
    return { at: v.at, base: typeof v.base === 'number' ? v.base : null, data: v.data };
  } catch {
    return null;
  }
}

export function writeBackup(userId: number, draftId: number | null, backup: Backup) {
  try {
    localStorage.setItem(keyOf(userId, draftId), JSON.stringify(backup));
  } catch {
    // 存不下：算了，只是少了一层保险
  }
}

export function removeBackup(userId: number, draftId: number | null) {
  try {
    localStorage.removeItem(keyOf(userId, draftId));
  } catch {
    // 浏览器不让用：本来也没存上
  }
}

/** 退出登录：这个账号在这个浏览器里暂存的都删掉（下一个用这台电脑的人看不到）。 */
export function clearBackups(userId: number) {
  try {
    const mine = `${PREFIX}${userId}:`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(mine)) localStorage.removeItem(key);
    }
  } catch {
    // 浏览器不让用：本来也没存上
  }
}

/**
 * 打开一份草稿时，暂存的这一份要不要拿出来问「恢复」：和服务器上的不一样，而且比服务器上的新——
 * 是在服务器现在这一份的基础上改的，或者存的时间比服务器上最后保存的晚（新草稿没有服务器上的，有就问）。
 */
export function worthRestoring(backup: Backup, serverText: string, serverUpdatedAt: number | null): boolean {
  if (JSON.stringify(backup.data) === serverText) return false;
  if (serverUpdatedAt === null) return true;
  return backup.base === serverUpdatedAt || backup.at > serverUpdatedAt;
}
