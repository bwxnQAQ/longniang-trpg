import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, errorMessage, type LogEntry } from '../api';
import { useLiveEvent, useLiveOpen } from '../live';
import { formatGameTime } from '../../../shared/game';
import type { HighlightChange, HighlightItem } from '../../../shared/highlights';

// 名场面（V0.8.0）：成员在对局记录里点星标收藏，右边「名场面」里按时间列出来，点一条跳到记录里那一条。
// 收藏是私人的；别的标签页收藏、取消了也跟着变（服务器只推给自己）；撤回结算删掉的记录跟着从列表里去掉。

/** 记录里的星标要用的：收藏了哪些、点了做什么。 */
export type HighlightTools = { ids: ReadonlySet<number>; toggle: (entry: LogEntry) => void };

/** 按记录的先后插进去。 */
function insert(list: HighlightItem[], item: HighlightItem): HighlightItem[] {
  if (list.some((h) => h.logId === item.logId)) return list;
  return [...list, item].sort((a, b) => a.logId - b.logId);
}

/**
 * 这一局我的收藏。enabled：是这一局的成员、已经开局（观看的人、游客没有）。
 * onError：收藏、取消出错时的说明（比如收满了）。
 */
export function useHighlights(roomId: number, enabled: boolean, onError: (message: string) => void) {
  const [items, setItems] = useState<HighlightItem[]>([]);
  /** 点了、还在等服务器的：记录编号 → 要收藏（true）还是取消（false）。星标先变过去，出错再变回来。 */
  const [pending, setPending] = useState<ReadonlyMap<number, boolean>>(new Map());
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const load = useCallback(async () => {
    try {
      setItems((await api<{ highlights: HighlightItem[] }>('GET', `/api/rooms/${roomId}/highlights`)).highlights);
    } catch {
      // 拿不到不影响玩：重连以后再拉
    }
  }, [roomId]);

  useEffect(() => {
    if (enabled) void load();
    else setItems([]);
  }, [enabled, load]);
  useLiveOpen(() => {
    if (enabled) void load();
  });
  useLiveEvent<HighlightChange>('highlights', (c) => {
    if (c.roomId !== roomId) return;
    setItems((list) => (c.on ? (c.item ? insert(list, c.item) : list) : list.filter((h) => h.logId !== c.logId)));
  });
  useLiveEvent<{ ids: number[] }>('log-removed', ({ ids }) => setItems((list) => list.filter((h) => !ids.includes(h.logId))));

  const ids = useMemo(() => {
    const set = new Set(items.map((h) => h.logId));
    for (const [id, on] of pending) {
      if (on) set.add(id);
      else set.delete(id);
    }
    return set;
  }, [items, pending]);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const setOn = useCallback(
    async (logId: number, on: boolean) => {
      setPending((p) => new Map(p).set(logId, on));
      try {
        if (on) {
          const r = await api<{ highlight: HighlightItem }>('POST', `/api/rooms/${roomId}/highlights`, { logId });
          setItems((list) => insert(list, r.highlight));
        } else {
          await api('DELETE', `/api/rooms/${roomId}/highlights/${logId}`);
          setItems((list) => list.filter((h) => h.logId !== logId));
        }
      } catch (err) {
        onErrorRef.current(errorMessage(err));
      } finally {
        setPending((p) => {
          const next = new Map(p);
          next.delete(logId);
          return next;
        });
      }
    },
    [roomId],
  );

  const toggle = useCallback(
    (entry: LogEntry) => {
      if (pendingRef.current.has(entry.id)) return;
      void setOn(entry.id, !idsRef.current.has(entry.id));
    },
    [setOn],
  );

  const tools = useMemo<HighlightTools | null>(() => (enabled ? { ids, toggle } : null), [enabled, ids, toggle]);
  const remove = useCallback((logId: number) => void setOn(logId, false), [setOn]);
  return { items, tools, remove };
}

/**
 * 跳到某一条之前，记录还没加载到那里的话往前加载（最多 20 页，和「在记录里看」一样）。
 * 返回新加载的、还有没有更早的、找没找到那一条。
 */
export async function loadOlderUntil(
  roomId: number,
  loaded: LogEntry[],
  hasMore: boolean,
  targetId: number,
): Promise<{ older: LogEntry[]; more: boolean; found: boolean }> {
  let older: LogEntry[] = [];
  let first = loaded[0]?.id ?? null;
  let more = hasMore;
  for (let i = 0; i < 20 && more && first !== null && first > targetId; i++) {
    const r = await api<{ entries: LogEntry[]; hasMore: boolean }>('GET', `/api/rooms/${roomId}/log?before=${first}`);
    older = [...r.entries, ...older];
    more = r.hasMore;
    first = r.entries[0]?.id ?? null;
  }
  return { older, more, found: loaded.some((e) => e.id === targetId) || older.some((e) => e.id === targetId) };
}

/** 右边的「名场面」：按时间列出收藏的条目；点一条跳到记录里，跳不过去的就在这里展开全文。 */
export function HighlightsPanel({
  items,
  onJump,
  onRemove,
}: {
  items: HighlightItem[];
  onJump: (logId: number) => Promise<boolean>;
  onRemove: (logId: number) => void;
}) {
  const [opened, setOpened] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  async function jump(logId: number) {
    setBusy(logId);
    try {
      const found = await onJump(logId);
      setOpened(found ? null : logId);
    } finally {
      setBusy(null);
    }
  }

  if (!items.length) return <p className="placeholder">还没有收藏的名场面。</p>;
  return (
    <ol className="hl-list">
      {items.map((h) => (
        <li key={h.logId} className="hl-item">
          <button type="button" className="hl-jump" aria-busy={busy === h.logId} onClick={() => void jump(h.logId)}>
            <span className="hl-head">
              {h.gameTime !== null && <span className="hl-time">{formatGameTime(h.gameTime)}</span>}
              <span className="hl-label">{h.label}</span>
            </span>
            {h.action && <span className="hl-action">{h.action}</span>}
            <span className={opened === h.logId ? 'hl-text is-open' : 'hl-text'}>{h.type === 'say' ? `「${h.text}」` : h.text}</span>
          </button>
          <button type="button" className="hl-star is-on" aria-label="取消收藏" title="取消收藏" onClick={() => onRemove(h.logId)}>
            ★
          </button>
        </li>
      ))}
    </ol>
  );
}
