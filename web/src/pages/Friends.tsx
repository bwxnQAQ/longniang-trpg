import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { api, errorMessage, type DirectMessage, type FollowingUser, type FriendsList, type Relation, type RoomSummary, type UserBrief } from '../api';
import { useAuth } from '../auth';
import { openFeedback } from '../components/Feedback';
import { GuestNote } from '../components/GuestNote';
import { Avatar, IdentityTag, OnlineDot, profilePath } from '../components/people';
import { formatTime, isoTime } from '../format';
import { refreshBadges, useLiveEvent, useLiveOpen } from '../live';
import { Link, navigate } from '../router';
import { GroupConversation, GroupsSection } from './GroupChat';

// 社交：左边是加好友、群聊（V0.7.0）、好友申请、好友列表、关注的人（V0.5.0）、屏蔽的人；
// 右边是和某个好友的私聊（可以邀请他进自己的对局），或者打开的群聊。
// V0.7.1：游客也能打开看看（列表都是空的，加好友、建群是灰的）。

export function FriendsPage({ chatWith, group = null }: { chatWith: string | null; group?: number | null }) {
  const { user } = useAuth();
  const guest = !!user?.isGuest;
  const [list, setList] = useState<FriendsList | null>(null);
  const [following, setFollowing] = useState<{ following: FollowingUser[]; followers: number } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [friends, follows] = await Promise.all([
        api<FriendsList>('GET', '/api/friends'),
        api<{ following: FollowingUser[]; followers: number }>('GET', '/api/follows'),
      ]);
      setList(friends);
      setFollowing(follows);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '社交 - 龙娘跑团';
    void load();
  }, [load]);
  useLiveEvent('friends-changed', () => void load());
  useLiveEvent<{ with: string }>('dm', (d) => {
    if (d.with !== chatWith) void load();
  });
  useLiveOpen(() => void load());

  // 游客没有私聊和群聊：地址里带着人或者群也只显示列表
  const chatting = !guest && (chatWith !== null || group !== null);

  return (
    <div className={chatting ? 'friends-layout is-chatting' : 'friends-layout'}>
      <aside className="friends-side" aria-label="社交">
        <div className="page-head">
          <h1>社交</h1>
        </div>
        {guest && <GuestNote what="加好友、私聊" />}
        <AddFriend disabled={guest} onAdded={() => void load()} />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {list && <GroupsSection current={group} friends={list.friends} disabled={guest} />}
        {list && <FriendLists list={list} following={following} current={chatWith} onChanged={() => void load()} />}
      </aside>
      <section className="friends-chat" aria-label={group !== null ? '群聊' : '私聊'}>
        {!chatting ? (
          <p className="placeholder friends-empty">选一个好友开始私聊。</p>
        ) : group !== null ? (
          <GroupConversation key={group} id={group} />
        ) : chatWith ? (
          <Conversation key={chatWith} who={chatWith} onRead={() => void load()} />
        ) : (
          <p className="placeholder friends-empty">选一个好友开始私聊。</p>
        )}
      </section>
    </div>
  );
}

/** 加好友：要填对方完整的用户名（不能按显示名搜，免得陌生人随便加）。disabled：游客看得到，用不了。 */
function AddFriend({ onAdded, disabled = false }: { onAdded: () => void; disabled?: boolean }) {
  const [username, setUsername] = useState('');
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = username.trim();
    if (!name || busy || disabled) return;
    setBusy(true);
    setError('');
    setDone('');
    try {
      const r = await api<{ relation: Relation }>('POST', '/api/friends', { username: name });
      setDone(r.relation === 'friends' ? '你们已经是好友了。' : '申请发出去了，等对方同意。');
      setUsername('');
      onAdded();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="add-friend">
      <form className="inline-form" onSubmit={add}>
        <label htmlFor="friend-username" className="visually-hidden">
          对方的用户名
        </label>
        <input
          id="friend-username"
          value={username}
          maxLength={20}
          placeholder="对方的用户名"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          onChange={(e) => {
            setUsername(e.target.value);
            setDone('');
          }}
        />
        <button className="btn btn-small" disabled={disabled || busy || !username.trim()}>
          加好友
        </button>
      </form>
      {done && (
        <p className="muted" role="status">
          {done}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function FriendLists({
  list,
  following,
  current,
  onChanged,
}: {
  list: FriendsList;
  following: { following: FollowingUser[]; followers: number } | null;
  current: string | null;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function act(method: 'POST' | 'DELETE', path: string) {
    setBusy(true);
    setError('');
    try {
      await api(method, path);
      onChanged();
      void refreshBadges();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const name = (u: UserBrief) => encodeURIComponent(u.publicId);
  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {list.incoming.length > 0 && (
        <section className="friend-group" aria-labelledby="incoming-title">
          <h2 id="incoming-title" className="side-title">
            想加你好友
          </h2>
          <ul className="friend-requests">
            {list.incoming.map((u) => (
              <li key={u.publicId}>
                <Link to={profilePath(u.publicId)} className="user-chip">
                  <Avatar user={u} size={26} />
                  <span className="user-chip-name">{u.displayName}</span>
                </Link>
                <span className="friend-request-buttons">
                  <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void act('POST', `/api/friends/${name(u)}/accept`)}>
                    同意
                  </button>
                  <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void act('DELETE', `/api/friends/${name(u)}`)}>
                    拒绝
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="friend-group" aria-labelledby="friends-title">
        <h2 id="friends-title" className="side-title">
          好友 <span className="muted">{list.friends.filter((f) => f.online).length} 人在线</span>
        </h2>
        {list.friends.length === 0 ? (
          <p className="hint">还没有好友。</p>
        ) : (
          <ul className="friend-list">
            {list.friends.map((f) => (
              <li key={f.publicId}>
                <Link to={`/friends/${name(f)}`} className={current === f.publicId ? 'friend-row is-current' : 'friend-row'} aria-current={current === f.publicId ? 'page' : undefined}>
                  <span className="friend-mini-avatar">
                    <Avatar user={f} size={34} />
                    {f.online && <span className="avatar-online" aria-hidden="true" />}
                  </span>
                  <span className="friend-row-main">
                    <span className="friend-row-name">
                      {f.displayName}
                      <span className="visually-hidden">{f.online ? '，在线' : '，不在线'}</span>
                    </span>
                    <span className="friend-row-last">{f.last ? `${f.last.mine ? '你：' : ''}${f.last.text}` : '还没聊过'}</span>
                  </span>
                  {f.unread > 0 && <span className="count">{f.unread}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {list.outgoing.length > 0 && (
        <section className="friend-group" aria-labelledby="outgoing-title">
          <h2 id="outgoing-title" className="side-title">
            等对方同意
          </h2>
          <ul className="friend-requests">
            {list.outgoing.map((u) => (
              <li key={u.publicId}>
                <Link to={profilePath(u.publicId)} className="user-chip">
                  <Avatar user={u} size={26} />
                  <span className="user-chip-name">{u.displayName}</span>
                </Link>
                <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void act('DELETE', `/api/friends/${name(u)}`)}>
                  撤回
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {following && (
        <section className="friend-group" aria-labelledby="following-title">
          <h2 id="following-title" className="side-title">
            关注 <span className="muted">{following.following.length} 人，{following.followers} 人关注你</span>
          </h2>
          {following.following.length === 0 ? (
            <p className="hint">还没有关注的人。</p>
          ) : (
            <ul className="friend-list">
              {following.following.map((f) => (
                <li key={f.publicId} className="friend-item">
                  <Link to={profilePath(f.publicId)} className="friend-row">
                    <span className="friend-mini-avatar">
                      <Avatar user={f} size={34} />
                    </span>
                    <span className="friend-row-main">
                      <span className="friend-row-name">{f.displayName}</span>
                      <span className="friend-row-last">{f.latest ? `${f.works} 部作品，最新《${f.latest.title}》` : '还没有作品'}</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="btn btn-small btn-quiet friend-row-action"
                    disabled={busy}
                    onClick={() => void act('DELETE', `/api/users/${name(f)}/follow`)}
                  >
                    取消关注
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {list.blocked.length > 0 && (
        <details className="friend-group">
          <summary className="side-title">屏蔽的人（{list.blocked.length}）</summary>
          <ul className="friend-requests">
            {list.blocked.map((u) => (
              <li key={u.publicId}>
                <span className="user-chip">
                  <Avatar user={u} size={26} />
                  <span className="user-chip-name">{u.displayName}</span>
                </span>
                <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void act('DELETE', `/api/blocks/${name(u)}`)}>
                  取消屏蔽
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

type ConversationData = {
  user: UserBrief & { online: boolean };
  relation: Relation;
  blocked: boolean;
  messages: DirectMessage[];
  hasMore: boolean;
};

/** 和一个好友的私聊。who：对方的公开编号（地址栏里的）。 */
function Conversation({ who, onRead }: { who: string; onRead: () => void }) {
  const [data, setData] = useState<ConversationData | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const stick = useRef(true);
  const path = `/api/friends/${encodeURIComponent(who)}`;
  // 推送里用公开编号认人（以前的地址里可能是用户名，加载以后按对方的公开编号比）
  const otherId = data?.user.publicId ?? who;
  // onRead 是外面每次渲染新写的函数：放进 ref 里用，不放进 markRead 的依赖。
  // 放进依赖的话：标已读 → 外面重新拉好友列表、重画 → onRead 变了 → load 变了 → 又拉一次消息、又标已读……会一直循环。
  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;

  const markRead = useCallback(async () => {
    try {
      await api('POST', `${path}/read`);
      onReadRef.current();
      void refreshBadges();
    } catch {
      // 标不上已读，下次打开再标
    }
  }, [path]);

  const load = useCallback(async () => {
    try {
      setData(await api<ConversationData>('GET', `${path}/messages`));
      setError('');
      void markRead();
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [path, markRead]);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveOpen(() => void load());

  useLiveEvent<{ with: string; message: DirectMessage }>('dm', (d) => {
    if (d.with !== otherId) return;
    setData((c) => (c && !c.messages.some((m) => m.id === d.message.id) ? { ...c, messages: [...c.messages, d.message] } : c));
    if (!d.message.mine) void markRead();
  });
  useLiveEvent<{ by: string }>('dm-read', (d) => {
    if (d.by === otherId) setData((c) => c && { ...c, messages: c.messages.map((m) => (m.mine ? { ...m, read: true } : m)) });
  });

  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [data?.messages.length]);

  async function older() {
    const first = data?.messages[0];
    if (!first) return;
    try {
      const r = await api<ConversationData>('GET', `${path}/messages?before=${first.id}`);
      stick.current = false;
      setData((c) => c && { ...c, messages: [...r.messages, ...c.messages], hasMore: r.hasMore });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<{ message: DirectMessage }>('POST', `${path}/messages`, { text: value });
      stick.current = true;
      setData((c) => (c && !c.messages.some((m) => m.id === r.message.id) ? { ...c, messages: [...c.messages, r.message] } : c));
      setText('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  if (!data) {
    return error ? (
      <p className="form-error" role="alert">
        {error}
      </p>
    ) : (
      <p className="muted">正在加载……</p>
    );
  }
  const other = data.user;
  const canSend = data.relation === 'friends' && !data.blocked;
  return (
    <div className="conversation">
      <header className="conversation-head">
        <button type="button" className="back conversation-back" onClick={() => navigate('/friends')}>
          社交
        </button>
        <Link to={profilePath(other.publicId)} className="user-chip">
          <Avatar user={other} size={36} />
          <span className="user-chip-name">{other.displayName}</span>
          <IdentityTag identity={other.identity} />
        </Link>
        <OnlineDot online={other.online} />
        {canSend && <InviteToRoom who={other.publicId} />}
      </header>

      <ol
        className="dm-list"
        ref={listRef}
        aria-live="polite"
        onScroll={() => {
          const el = listRef.current;
          if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {data.hasMore && (
          <li className="log-more">
            <button type="button" className="btn btn-small btn-quiet" onClick={() => void older()}>
              看更早的
            </button>
          </li>
        )}
        {data.messages.length === 0 && <li className="muted">还没有消息。</li>}
        {data.messages.map((m) => (
          <li key={m.id} className={m.mine ? 'dm is-mine' : 'dm'}>
            <p className="dm-text">{m.text}</p>
            <p className="dm-meta">
              <time dateTime={isoTime(m.at)}>{formatTime(m.at)}</time>
              {m.mine && <span>{m.read ? '已读' : '未读'}</span>}
              {!m.mine && (
                <button
                  type="button"
                  className="linklike"
                  onClick={() => openFeedback({ kind: 'report', target: { type: 'dm', id: m.id, preview: m.text, author: other.displayName } })}
                >
                  举报
                </button>
              )}
            </p>
          </li>
        ))}
      </ol>

      {canSend ? (
        <form className="dm-form" onSubmit={send}>
          <label htmlFor="dm-text" className="visually-hidden">
            发给{other.displayName}
          </label>
          <textarea id="dm-text" rows={2} maxLength={1000} value={text} placeholder={`发给${other.displayName}，Enter 发送`} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown} />
          <button className="btn btn-primary btn-small" disabled={busy || !text.trim()}>
            发送
          </button>
        </form>
      ) : (
        <p className="hint">{data.blocked ? '你屏蔽了他。' : '你们现在不是好友。'}</p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** 邀请这个好友进自己当房主的对局（还没结束的）。 */
function InviteToRoom({ who }: { who: string }) {
  const [rooms, setRooms] = useState<RoomSummary[] | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open || rooms) return;
    api<{ rooms: RoomSummary[] }>('GET', '/api/rooms')
      .then((r) => {
        const mine = r.rooms.filter((x) => x.isHost && x.status !== 'ended');
        setRooms(mine);
        setRoomId(mine[0]?.id ?? null);
      })
      .catch(() => setRooms([]));
  }, [open, rooms]);

  async function invite() {
    if (roomId === null) return;
    setBusy(true);
    setMessage('');
    try {
      await api('POST', `/api/rooms/${roomId}/invites`, { user: who });
      setMessage('邀请发出去了，对方会在通知里看到。');
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="invite-to-room">
      <button type="button" className="btn btn-small" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        邀请进对局
      </button>
      {open && (
        <div className="invite-to-room-box">
          {rooms === null ? (
            <p className="muted">正在加载……</p>
          ) : rooms.length === 0 ? (
            <p className="hint">没有可以邀请的对局。</p>
          ) : (
            <>
              <label htmlFor="invite-room" className="visually-hidden">
                选一局
              </label>
              <select id="invite-room" value={roomId ?? ''} onChange={(e) => setRoomId(Number(e.target.value))}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void invite()}>
                发邀请
              </button>
            </>
          )}
          {message && (
            <p className="hint" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
