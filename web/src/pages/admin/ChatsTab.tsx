import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage, type AdminDmRow, type AdminDmThread, type AdminGroupDetail, type AdminGroupRow } from '../../api';
import { Avatar, profilePath } from '../../components/people';
import { formatDateTime } from '../../format';
import { Link } from '../../router';
import { ErrorLine } from './common';

// ==================== 聊天记录（V0.7.0）：所有的群聊和私信 ====================
// 有「举报和大厅聊天」权限的管理员看。打开一个群、一组私信时记进操作记录（服务器记）。

type Kind = 'groups' | 'dms';

export function ChatsTab({ initialGroup = null }: { initialGroup?: number | null }) {
  const [kind, setKind] = useState<Kind>('groups');
  return (
    <section className="section admin-chats" aria-label="聊天记录">
      <div className="picker-tabs" role="tablist" aria-label="聊天记录">
        <button type="button" role="tab" className="picker-tab" aria-selected={kind === 'groups'} onClick={() => setKind('groups')}>
          群聊
        </button>
        <button type="button" role="tab" className="picker-tab" aria-selected={kind === 'dms'} onClick={() => setKind('dms')}>
          私信
        </button>
      </div>
      {kind === 'groups' ? <Groups initial={initialGroup} /> : <Dms />}
    </section>
  );
}

function SearchBox({ placeholder, onSearch }: { placeholder: string; onSearch: (q: string) => void }) {
  const [q, setQ] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    onSearch(q.trim());
  }
  return (
    <form className="admin-chat-search" onSubmit={submit}>
      <input type="search" aria-label="搜索" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="btn btn-small">搜索</button>
    </form>
  );
}

function Groups({ initial }: { initial: number | null }) {
  const [list, setList] = useState<AdminGroupRow[] | null>(null);
  const [open, setOpen] = useState<number | null>(initial);
  const [error, setError] = useState('');

  const load = useCallback(async (q = '') => {
    try {
      setList((await api<{ groups: AdminGroupRow[] }>('GET', `/api/admin/groups${q ? `?q=${encodeURIComponent(q)}` : ''}`)).groups);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="admin-chats-body">
      <SearchBox placeholder="群名、成员的显示名" onSearch={(q) => void load(q)} />
      <ErrorLine error={error} />
      {list && list.length === 0 && <p className="empty">没有群聊。</p>}
      {list && list.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">群</th>
                <th scope="col">群主</th>
                <th scope="col">人数</th>
                <th scope="col">消息</th>
                <th scope="col">最近</th>
                <th scope="col">
                  <span className="visually-hidden">操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.id} className={open === g.id ? 'is-current' : undefined}>
                  <td>
                    {g.name}
                    {g.disbandedAt !== null && <span className="tag">已解散</span>}
                  </td>
                  <td>{g.owner ? g.owner.displayName : '—'}</td>
                  <td>{g.members}</td>
                  <td>{g.messages}</td>
                  <td>{formatDateTime(g.lastAt ?? g.createdAt)}</td>
                  <td>
                    <button type="button" className="btn btn-small" onClick={() => setOpen(open === g.id ? null : g.id)}>
                      {open === g.id ? '收起' : '看记录'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open !== null && <GroupRecord key={open} id={open} onChanged={() => void load()} />}
    </div>
  );
}

function GroupRecord({ id, onChanged }: { id: number; onChanged: () => void }) {
  const [data, setData] = useState<AdminGroupDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<AdminGroupDetail>('GET', `/api/admin/groups/${id}`)
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  async function older() {
    const first = data?.messages[0];
    if (!first) return;
    try {
      const r = await api<AdminGroupDetail>('GET', `/api/admin/groups/${id}?before=${first.id}`);
      setData((c) => c && { ...c, messages: [...r.messages, ...c.messages], hasMore: r.hasMore });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function act(method: 'POST' | 'DELETE', url: string, confirm: string) {
    if (!window.confirm(confirm)) return;
    setBusy(true);
    setError('');
    try {
      setData(await api<AdminGroupDetail>(method, url));
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return error ? <ErrorLine error={error} /> : <p className="muted">正在加载……</p>;
  return (
    <div className="admin-chat-record">
      <h3 className="admin-chat-title">
        群「{data.group.name}」
        {data.group.disbandedAt !== null && <span className="muted">（{formatDateTime(data.group.disbandedAt)} 解散）</span>}
      </h3>
      <p className="admin-chat-members">
        成员：
        {data.members.length === 0
          ? '没有人了'
          : data.members.map((m) => (
              <Link key={m.publicId} to={profilePath(m.publicId)} className="user-chip">
                <Avatar user={m} size={20} />
                <span className="user-chip-name">
                  {m.displayName}
                  {m.owner ? '（群主）' : ''}
                </span>
              </Link>
            ))}
      </p>
      {data.group.disbandedAt === null && (
        <p>
          <button type="button" className="btn btn-small btn-danger" disabled={busy} onClick={() => void act('POST', `/api/admin/groups/${id}/disband`, `解散群「${data.group.name}」？`)}>
            解散这个群
          </button>
        </p>
      )}
      <ErrorLine error={error} />
      <ol className="admin-chat-lines">
        {data.hasMore && (
          <li>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => void older()}>
              看更早的
            </button>
          </li>
        )}
        {data.messages.length === 0 && <li className="muted">还没有消息。</li>}
        {data.messages.map((m) => (
          <li key={m.id} className={m.kind === 'system' ? 'is-system' : m.withdrawn ? 'is-withdrawn' : undefined}>
            <span className="admin-chat-at">{formatDateTime(m.at)}</span>
            {m.kind === 'system' ? (
              <span className="muted">{m.text}</span>
            ) : (
              <>
                <strong>{m.from?.displayName ?? '已注销的用户'}：</strong>
                <span>{m.withdrawn ? m.withdrawnText : m.text}</span>
                {m.withdrawn && <span className="tag">{m.withdrawn === 'admin' ? '管理员撤回了' : '自己撤回了'}</span>}
                {!m.withdrawn && (
                  <button
                    type="button"
                    className="linklike btn-danger-text"
                    disabled={busy}
                    onClick={() => void act('DELETE', `/api/admin/groups/${id}/messages/${m.id}`, '撤回这条消息？')}
                  >
                    撤回
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Dms() {
  const [list, setList] = useState<AdminDmRow[] | null>(null);
  const [open, setOpen] = useState<[string, string] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (q = '') => {
    try {
      setList((await api<{ pairs: AdminDmRow[] }>('GET', `/api/admin/dms${q ? `?q=${encodeURIComponent(q)}` : ''}`)).pairs);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const key = (p: AdminDmRow) => `${p.a.publicId}/${p.b.publicId}`;
  return (
    <div className="admin-chats-body">
      <SearchBox placeholder="任何一方的显示名、用户名" onSearch={(q) => void load(q)} />
      <ErrorLine error={error} />
      {list && list.length === 0 && <p className="empty">没有私信。</p>}
      {list && list.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">两个人</th>
                <th scope="col">消息</th>
                <th scope="col">最近一条</th>
                <th scope="col">最近</th>
                <th scope="col">
                  <span className="visually-hidden">操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const current = open !== null && `${open[0]}/${open[1]}` === key(p);
                return (
                  <tr key={key(p)} className={current ? 'is-current' : undefined}>
                    <td>
                      {p.a.displayName} ↔ {p.b.displayName}
                    </td>
                    <td>{p.messages}</td>
                    <td className="admin-chat-last">{p.last}</td>
                    <td>{formatDateTime(p.lastAt)}</td>
                    <td>
                      <button type="button" className="btn btn-small" onClick={() => setOpen(current ? null : [p.a.publicId, p.b.publicId])}>
                        {current ? '收起' : '看记录'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {open && <DmRecord key={`${open[0]}/${open[1]}`} a={open[0]} b={open[1]} />}
    </div>
  );
}

function DmRecord({ a, b }: { a: string; b: string }) {
  const [data, setData] = useState<AdminDmThread | null>(null);
  const [error, setError] = useState('');
  const path = `/api/admin/dms/${encodeURIComponent(a)}/${encodeURIComponent(b)}`;

  useEffect(() => {
    api<AdminDmThread>('GET', path)
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, [path]);

  async function older() {
    const first = data?.messages[0];
    if (!first) return;
    try {
      const r = await api<AdminDmThread>('GET', `${path}?before=${first.id}`);
      setData((c) => c && { ...c, messages: [...r.messages, ...c.messages], hasMore: r.hasMore });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (!data) return error ? <ErrorLine error={error} /> : <p className="muted">正在加载……</p>;
  return (
    <div className="admin-chat-record">
      <h3 className="admin-chat-title">
        {data.a.displayName} 和 {data.b.displayName} 的私信
      </h3>
      <ErrorLine error={error} />
      <ol className="admin-chat-lines">
        {data.hasMore && (
          <li>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => void older()}>
              看更早的
            </button>
          </li>
        )}
        {data.messages.map((m) => (
          <li key={m.id}>
            <span className="admin-chat-at">{formatDateTime(m.at)}</span>
            <strong>{m.from === 'a' ? data.a.displayName : data.b.displayName}：</strong>
            <span>{m.text}</span>
            {!m.read && <span className="tag">对方没读</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
