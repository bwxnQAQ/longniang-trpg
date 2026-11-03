import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { GROUP_MEMBERS_MAX, GROUP_MESSAGE_MAX, GROUP_NAME_MAX } from '../../../shared/groups';
import { api, errorMessage, type Friend, type FriendsList, type GroupDetail, type GroupMessage, type GroupSummary } from '../api';
import { openFeedback } from '../components/Feedback';
import { Avatar, OnlineDot, profilePath } from '../components/people';
import { formatTime, isoTime } from '../format';
import { refreshBadges, useLiveEvent, useLiveOpen } from '../live';
import { Link, navigate } from '../router';

// 群聊（V0.7.0）：「社交」左边的群列表、建群；右边打开的群（消息、成员、拉人、退群、改群名、解散）。

/** 左边的「群聊」：我在的群，点开进群；「建群」拉几个好友。 */
/** 社交页左边的群聊列表。disabled：游客看得到（空的），不能建群（V0.7.1）。 */
export function GroupsSection({ current, friends, disabled = false }: { current: number | null; friends: Friend[]; disabled?: boolean }) {
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setGroups((await api<{ groups: GroupSummary[] }>('GET', '/api/groups')).groups);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveEvent('groups-changed', () => void load());
  useLiveEvent<{ groupId: number }>('group-message', () => void load());
  useLiveOpen(() => void load());

  return (
    <section className="friend-group" aria-labelledby="groups-title">
      <h2 id="groups-title" className="side-title group-side-title">
        <span>群聊</span>
        <button type="button" className="btn btn-small" disabled={disabled} aria-expanded={creating} onClick={() => setCreating((v) => !v)}>
          建群
        </button>
      </h2>
      {creating && !disabled && (
        <CreateGroup
          friends={friends}
          onCancel={() => setCreating(false)}
          onCreated={(g) => {
            setCreating(false);
            void load();
            navigate(`/friends/g/${g.id}`);
          }}
        />
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {groups && groups.length === 0 && !creating && <p className="hint">还没有群。</p>}
      {groups && groups.length > 0 && (
        <ul className="friend-list">
          {groups.map((g) => (
            <li key={g.id}>
              <Link to={`/friends/g/${g.id}`} className={current === g.id ? 'friend-row is-current' : 'friend-row'} aria-current={current === g.id ? 'page' : undefined}>
                <span className="group-badge" aria-hidden="true">
                  {[...g.name][0]}
                </span>
                <span className="friend-row-main">
                  <span className="friend-row-name">
                    {g.name}
                    <span className="muted group-count">（{g.members}）</span>
                  </span>
                  <span className="friend-row-last">{g.last ? `${g.last.from ? `${g.last.from}：` : ''}${g.last.text}` : '还没有消息'}</span>
                </span>
                {g.unread > 0 && <span className="count">{g.unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** 建群：群名、勾几个好友。 */
function CreateGroup({ friends, onCancel, onCreated }: { friends: Friend[]; onCancel: () => void; onCreated: (g: GroupSummary) => void }) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api<{ group: GroupSummary }>('POST', '/api/groups', { name, members: [...picked] });
      onCreated(r.group);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form className="group-create" onSubmit={submit}>
      <label htmlFor="group-name" className="visually-hidden">
        群名
      </label>
      <input id="group-name" maxLength={GROUP_NAME_MAX} placeholder="群名" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <FriendPicker friends={friends} picked={picked} onChange={setPicked} limit={GROUP_MEMBERS_MAX - 1} />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary btn-small" disabled={busy || !name.trim() || picked.size === 0}>
          {busy ? '正在建……' : `建群（${picked.size + 1} 人）`}
        </button>
        <button type="button" className="btn btn-quiet btn-small" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

/** 勾选好友。 */
function FriendPicker({ friends, picked, onChange, limit }: { friends: Friend[]; picked: Set<string>; onChange: (next: Set<string>) => void; limit: number }) {
  if (friends.length === 0) return <p className="hint">还没有好友。</p>;
  function toggle(id: string) {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else if (next.size < limit) next.add(id);
    onChange(next);
  }
  return (
    <ul className="group-picker">
      {friends.map((f) => (
        <li key={f.publicId}>
          <label className="group-picker-row">
            <input type="checkbox" checked={picked.has(f.publicId)} onChange={() => toggle(f.publicId)} />
            <Avatar user={f} size={22} />
            <span>{f.displayName}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

/** 打开的一个群。 */
export function GroupConversation({ id }: { id: number }) {
  const [data, setData] = useState<GroupDetail | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [gone, setGone] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const stick = useRef(true);
  const path = `/api/groups/${id}`;

  const markRead = useCallback(async () => {
    try {
      await api('POST', `${path}/read`);
      void refreshBadges();
    } catch {
      // 标不上已读，下次打开再标
    }
  }, [path]);

  const load = useCallback(async () => {
    try {
      setData(await api<GroupDetail>('GET', path));
      setError('');
      setGone(false);
      void markRead();
    } catch (err) {
      const message = errorMessage(err);
      if (message.includes('不在了')) setGone(true);
      else setError(message);
    }
  }, [path, markRead]);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveOpen(() => void load());
  useLiveEvent<{ groupId: number; message: GroupMessage; replace?: boolean }>('group-message', (d) => {
    if (d.groupId !== id) return;
    setData((c) => {
      if (!c) return c;
      if (c.messages.some((m) => m.id === d.message.id)) return { ...c, messages: c.messages.map((m) => (m.id === d.message.id ? d.message : m)) };
      return d.replace ? c : { ...c, messages: [...c.messages, d.message] };
    });
    if (!d.message.mine) void markRead();
  });
  useLiveEvent<{ groupId: number }>('groups-changed', (d) => {
    if (d.groupId === id) void load();
  });

  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [data?.messages.length]);

  async function older() {
    const first = data?.messages[0];
    if (!first) return;
    try {
      const r = await api<{ messages: GroupMessage[]; hasMore: boolean }>('GET', `${path}/messages?before=${first.id}`);
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
      const r = await api<{ message: GroupMessage }>('POST', `${path}/messages`, { text: value });
      stick.current = true;
      setData((c) => (c && !c.messages.some((m) => m.id === r.message.id) ? { ...c, messages: [...c.messages, r.message] } : c));
      setText('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(messageId: number) {
    if (!window.confirm('撤回这条消息？')) return;
    try {
      await api('DELETE', `${path}/messages/${messageId}`);
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

  if (gone) {
    return (
      <div className="conversation">
        <p className="placeholder friends-empty">这个群不在了。</p>
      </div>
    );
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
  return (
    <div className="conversation group-conversation">
      <header className="conversation-head">
        <button type="button" className="back conversation-back" onClick={() => navigate('/friends')}>
          社交
        </button>
        <span className="group-title">
          <span className="group-badge" aria-hidden="true">
            {[...data.name][0]}
          </span>
          <strong>{data.name}</strong>
        </span>
        <button type="button" className="btn btn-small" aria-expanded={showMembers} onClick={() => setShowMembers((v) => !v)}>
          成员（{data.members.length}）
        </button>
      </header>

      {showMembers && <GroupMembers group={data} onChanged={() => void load()} />}

      <ol
        className="dm-list group-list"
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
          <GroupLine key={m.id} m={m} onWithdraw={() => void withdraw(m.id)} groupName={data.name} />
        ))}
      </ol>

      <form className="dm-form" onSubmit={send}>
        <label htmlFor="group-text" className="visually-hidden">
          发到群里
        </label>
        <textarea
          id="group-text"
          rows={2}
          maxLength={GROUP_MESSAGE_MAX}
          value={text}
          placeholder="发到群里，Enter 发送"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="btn btn-primary btn-small" disabled={busy || !text.trim()}>
          发送
        </button>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function GroupLine({ m, onWithdraw, groupName }: { m: GroupMessage; onWithdraw: () => void; groupName: string }) {
  if (m.kind === 'system') {
    return (
      <li className="group-system">
        <span>{m.text}</span>
      </li>
    );
  }
  const who = m.mine ? '你' : (m.from?.displayName ?? '已注销的用户');
  if (m.withdrawn) {
    return (
      <li className="group-system">
        <span>{m.withdrawn === 'admin' ? `${who}的一条消息被管理员撤回了` : `${who}撤回了一条消息`}</span>
      </li>
    );
  }
  return (
    <li className={m.mine ? 'dm is-mine group-line' : 'dm group-line'}>
      {!m.mine && (
        <p className="group-from">
          {m.from ? (
            <Link to={profilePath(m.from.publicId)} className="group-from-link">
              <Avatar user={m.from} size={20} />
              {m.from.displayName}
            </Link>
          ) : (
            '已注销的用户'
          )}
        </p>
      )}
      <p className={m.hidden ? 'dm-text muted' : 'dm-text'}>{m.hidden ? '（你屏蔽了这个人，消息不显示）' : m.text}</p>
      <p className="dm-meta">
        <time dateTime={isoTime(m.at)}>{formatTime(m.at)}</time>
        {m.mine && (
          <button type="button" className="linklike" onClick={onWithdraw}>
            撤回
          </button>
        )}
        {!m.mine && !m.hidden && m.from && (
          <button
            type="button"
            className="linklike"
            onClick={() => openFeedback({ kind: 'report', target: { type: 'group', id: m.id, preview: m.text, author: `${m.from!.displayName}（群「${groupName}」）` } })}
          >
            举报
          </button>
        )}
      </p>
    </li>
  );
}

/** 成员：群主能移出别人、改群名、解散；谁都能拉自己的好友进群、退群。 */
function GroupMembers({ group, onChanged }: { group: GroupDetail; onChanged: () => void }) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const path = `/api/groups/${group.id}`;

  useEffect(() => {
    if (!adding || friends) return;
    api<FriendsList>('GET', '/api/friends')
      .then((r) => setFriends(r.friends))
      .catch((err) => setError(errorMessage(err)));
  }, [adding, friends]);

  async function act(method: 'POST' | 'PUT' | 'DELETE', url: string, body?: unknown, after?: () => void) {
    setBusy(true);
    setError('');
    try {
      await api(method, url, body);
      after?.();
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const inGroup = new Set(group.members.map((m) => m.publicId));
  const candidates = (friends ?? []).filter((f) => !inGroup.has(f.publicId));
  return (
    <div className="group-members">
      <ul className="group-member-list">
        {group.members.map((m) => (
          <li key={m.publicId}>
            <Link to={profilePath(m.publicId)} className="user-chip">
              <Avatar user={m} size={26} />
              <span className="user-chip-name">{m.displayName}</span>
            </Link>
            {m.owner && <span className="tag">群主</span>}
            <OnlineDot online={m.online} label={false} />
            {group.owner && !m.owner && (
              <button
                type="button"
                className="btn btn-small btn-quiet"
                disabled={busy}
                onClick={() => window.confirm(`把${m.displayName}移出群？`) && void act('DELETE', `${path}/members/${encodeURIComponent(m.publicId)}`)}
              >
                移出
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="group-member-actions">
        <button type="button" className="btn btn-small" aria-expanded={adding} onClick={() => setAdding((v) => !v)}>
          拉好友进群
        </button>
        {group.owner && (
          <button type="button" className="btn btn-small" aria-expanded={renaming} onClick={() => setRenaming((v) => !v)}>
            改群名
          </button>
        )}
        <button
          type="button"
          className="btn btn-small btn-quiet"
          disabled={busy}
          onClick={() => window.confirm('退出这个群？') && void act('DELETE', `${path}/members/me`, undefined, () => navigate('/friends'))}
        >
          退出群
        </button>
        {group.owner && (
          <button
            type="button"
            className="btn btn-small btn-danger"
            disabled={busy}
            onClick={() => window.confirm('解散这个群？所有人都会被移出。') && void act('DELETE', path, undefined, () => navigate('/friends'))}
          >
            解散群
          </button>
        )}
      </div>
      {renaming && (
        <form
          className="group-rename"
          onSubmit={(e) => {
            e.preventDefault();
            void act('PUT', path, { name }, () => setRenaming(false));
          }}
        >
          <label htmlFor="group-rename" className="visually-hidden">
            新群名
          </label>
          <input id="group-rename" maxLength={GROUP_NAME_MAX} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-small btn-primary" disabled={busy || !name.trim()}>
            保存
          </button>
        </form>
      )}
      {adding &&
        (friends === null ? (
          <p className="muted">正在加载……</p>
        ) : candidates.length === 0 ? (
          <p className="hint">好友都在群里了。</p>
        ) : (
          <div className="group-add">
            <FriendPicker friends={candidates} picked={picked} onChange={setPicked} limit={GROUP_MEMBERS_MAX - group.members.length} />
            <button
              type="button"
              className="btn btn-small btn-primary"
              disabled={busy || picked.size === 0}
              onClick={() =>
                void act('POST', `${path}/members`, { members: [...picked] }, () => {
                  setPicked(new Set());
                  setAdding(false);
                })
              }
            >
              拉进群（{picked.size}）
            </button>
          </div>
        ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
