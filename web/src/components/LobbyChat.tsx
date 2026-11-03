import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { api, errorMessage, type LobbyMessage } from '../api';
import { useAuth } from '../auth';
import { formatTime, isoTime } from '../format';
import { useLiveEvent, useLiveOpen } from '../live';
import { useNow } from '../room/time';
import { Link } from '../router';
import { openFeedback } from './Feedback';
import { Avatar, IdentityTag, profilePath } from './people';

// 大厅聊天（世界频道）：开着网站的人都看得到。游客只能看；屏蔽了的人说的话看不到。
// 防刷屏（V0.5.0）：每人每隔几秒才能说一句（管理员定，管理员自己不受限），发完按钮上倒数；管理员能撤回任何人的话，也能一下撤回一个人最近一小时的。

const MAX = 300;

export function LobbyChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LobbyMessage[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [slowSeconds, setSlowSeconds] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const now = useNow(cooldownUntil > Date.now() ? 250 : null);
  const listRef = useRef<HTMLOListElement>(null);
  const stick = useRef(true);
  // 刚发完时 now 可能还是很久以前的：取两者里晚的那个
  const waiting = Math.max(0, Math.ceil((cooldownUntil - Math.max(now, Date.now())) / 1000));

  const load = useCallback(async () => {
    try {
      const r = await api<{ messages: LobbyMessage[]; hasMore: boolean; slowSeconds: number }>('GET', '/api/lobby/chat');
      setMessages(r.messages);
      setHasMore(r.hasMore);
      setSlowSeconds(r.slowSeconds ?? 0);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveOpen(() => void load());

  useLiveEvent<LobbyMessage>('lobby-chat', (m) => setMessages((list) => (list && !list.some((x) => x.id === m.id) ? [...list, m] : list)));
  useLiveEvent<{ id?: number; ids?: number[]; byAdmin?: boolean }>('lobby-chat-deleted', (e) => {
    const ids = new Set(e.ids ?? (e.id ? [e.id] : []));
    setMessages((list) => list?.map((m) => (ids.has(m.id) ? { ...m, deleted: true, byAdmin: !!e.byAdmin, text: '' } : m)) ?? list);
  });

  // 新消息来了，本来在底部的跟着滚到底
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function older() {
    const first = messages?.[0];
    if (!first) return;
    try {
      const r = await api<{ messages: LobbyMessage[]; hasMore: boolean }>('GET', `/api/lobby/chat?before=${first.id}`);
      stick.current = false;
      setMessages((list) => [...r.messages, ...(list ?? [])]);
      setHasMore(r.hasMore);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value || busy || waiting > 0) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<{ message: LobbyMessage }>('POST', '/api/lobby/chat', { text: value });
      stick.current = true;
      setMessages((list) => (list && !list.some((x) => x.id === r.message.id) ? [...list, r.message] : list));
      setText('');
      if (slowSeconds > 0) setCooldownUntil(Date.now() + slowSeconds * 1000);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function recall(m: LobbyMessage) {
    setError('');
    try {
      await api('DELETE', `/api/lobby/chat/${m.id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  /** 管理员：撤回这个人最近一小时在大厅里说的话（清理刷屏）。 */
  async function recallRecent(m: LobbyMessage) {
    if (!window.confirm(`撤回${m.user.displayName}最近一小时在大厅里说的话？`)) return;
    setError('');
    try {
      await api('POST', '/api/lobby/chat/recall-recent', { user: m.user.publicId });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  const canModerate = !!user?.permissions.includes('reports');
  return (
    <section className="lobby-chat" aria-labelledby="lobby-chat-title">
      <h2 id="lobby-chat-title" className="side-title">
        大厅聊天
      </h2>
      <ol
        className="lobby-chat-list"
        ref={listRef}
        aria-live="polite"
        onScroll={() => {
          const el = listRef.current;
          if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {hasMore && (
          <li className="log-more">
            <button type="button" className="btn btn-small btn-quiet" onClick={() => void older()}>
              看更早的
            </button>
          </li>
        )}
        {messages === null ? (
          <li className="muted">正在加载……</li>
        ) : messages.length === 0 ? (
          <li className="muted">还没有人说话。</li>
        ) : (
          messages.map((m) => (
            <li key={m.id} className={m.deleted ? 'lobby-msg is-deleted' : 'lobby-msg'}>
              <Link to={profilePath(m.user.publicId)} className="lobby-msg-avatar" tabIndex={-1} aria-hidden="true">
                <Avatar user={m.user} size={28} />
              </Link>
              <div className="lobby-msg-body">
                <p className="lobby-msg-head">
                  <Link to={profilePath(m.user.publicId)} className="lobby-msg-name">
                    {m.user.displayName}
                  </Link>
                  <IdentityTag identity={m.user.identity} />
                  {m.title && <span className="title-badge title-badge-small">{m.title}</span>}
                  <time dateTime={isoTime(m.at)} className="entry-time">
                    {formatTime(m.at)}
                  </time>
                </p>
                {m.deleted ? (
                  <p className="muted">{m.byAdmin ? '这条消息被管理员撤回了' : '撤回了一条消息'}</p>
                ) : (
                  <p className="lobby-msg-text">{m.text}</p>
                )}
                {/* 自己撤回的话别人照样能举报（管理员在举报里看得到原文） */}
                {m.deleted && !m.byAdmin && user && !user.isGuest && m.user.publicId !== user.publicId && (
                  <p className="msg-tools">
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => openFeedback({ kind: 'report', target: { type: 'lobby', id: m.id, preview: '（撤回了的消息）', author: m.user.displayName } })}
                    >
                      举报
                    </button>
                  </p>
                )}
                {!m.deleted && user && !user.isGuest && (
                  <p className="msg-tools">
                    {/* 站长的消息只有站长自己能撤回 */}
                    {(m.user.publicId === user.publicId || (canModerate && (m.user.identity !== 'owner' || user.isOwner))) && (
                      <button type="button" className="linklike" onClick={() => void recall(m)}>
                        撤回
                      </button>
                    )}
                    {canModerate && m.user.publicId !== user.publicId && (m.user.identity !== 'owner' || user.isOwner) && (
                      <button type="button" className="linklike" onClick={() => void recallRecent(m)}>
                        撤回他最近一小时的
                      </button>
                    )}
                    {m.user.publicId !== user.publicId && (
                      <button
                        type="button"
                        className="linklike"
                        onClick={() => openFeedback({ kind: 'report', target: { type: 'lobby', id: m.id, preview: m.text, author: m.user.displayName } })}
                      >
                        举报
                      </button>
                    )}
                  </p>
                )}
              </div>
            </li>
          ))
        )}
      </ol>
      {user?.isGuest ? null : (
        <form className="lobby-chat-form" onSubmit={send}>
          <label htmlFor="lobby-chat-text" className="visually-hidden">
            在大厅里说话
          </label>
          <textarea
            id="lobby-chat-text"
            rows={2}
            maxLength={MAX}
            value={text}
            placeholder="在大厅里说话"
            onChange={(e) => {
              setText(e.target.value);
              setError('');
            }}
            onKeyDown={onKeyDown}
          />
          <button className="btn btn-small btn-primary" disabled={busy || !text.trim() || waiting > 0} aria-label={waiting > 0 ? `${waiting} 秒后能再发` : undefined}>
            {waiting > 0 ? `${waiting} 秒` : '发送'}
          </button>
        </form>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
