import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, PURPOSE_LABEL, type AdminLogEntry, type AdminRoomDetail, type RoomStatus } from '../api';
import { Stamp } from '../components/bits';
import { formatDateTime, money, saveFile } from '../format';
import { HostTools } from '../room/Host';
import { Link, navigate } from '../router';
import { formatGameTime, RELATION_LABEL } from '../../../shared/game';
import { STRESS_LABEL, WOUND_LABEL } from '../../../shared/rules';

// 管理员看一局的全部后台数据：不用加入。这里的内容包括所有秘密，只有管理员看得到。

type Tab = 'host' | 'people' | 'scenario' | 'log' | 'actions' | 'notes' | 'violations';
const TABS: { id: Tab; label: string }[] = [
  { id: 'host', label: '主持工具' },
  { id: 'people', label: '成员和角色' },
  { id: 'scenario', label: '剧本和世界' },
  { id: 'log', label: '全部记录' },
  { id: 'actions', label: '行动和 AI 调用' },
  { id: 'notes', label: '笔记和剧本生成' },
  { id: 'violations', label: '违规' },
];

const ACTION_STATUS: Record<string, string> = { waiting: '等待中', resolving: '结算中', done: '已结算', withdrawn: '已撤回', failed: '没能结算' };

export function AdminRoomPage({ id }: { id: number }) {
  const [detail, setDetail] = useState<AdminRoomDetail | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<'end' | 'delete' | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(async () => {
    try {
      setDetail(await api<AdminRoomDetail>('GET', `/api/admin/rooms/${id}`));
      setLoadedAt(Date.now());
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const name = detail?.room.name;
  useEffect(() => {
    if (name) document.title = `${name}（管理） - 龙娘跑团`;
  }, [name]);

  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await work();
      setConfirming(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function exportFull() {
    await run(async () => {
      const r = await api<{ filename: string; content: string }>('GET', `/api/rooms/${id}/export?full=1`);
      saveFile(r.filename.replace(/\.md$/, '-完整.md'), r.content, 'text/markdown;charset=utf-8');
    });
  }

  if (!detail) {
    return error ? (
      <div className="page-error">
        <p className="form-error" role="alert">
          {error}
        </p>
        <Link to="/admin?tab=rooms">回到所有对局</Link>
      </div>
    ) : (
      <p className="muted">正在加载……</p>
    );
  }

  const { room } = detail;
  const setStatus = (status: Exclude<RoomStatus, 'preparing'>) => run(() => api('POST', `/api/admin/rooms/${id}/status`, { status }));
  const current: Tab = tab ?? TABS[0].id;

  return (
    <div className="admin-room">
      <header className="room-head">
        <Link to="/admin?tab=rooms" className="back">
          所有对局
        </Link>
        <div className="room-title-row">
          <h1 className="room-title">{room.name}</h1>
          <Stamp status={room.status} />
          {detail.scenario && <span className="room-scenario">《{String(detail.scenario.data.title)}》</span>}
        </div>
        <div className="room-facts">
          <span className="fact">房主 {room.host?.displayName ?? '—'}</span>
          <span className="fact">
            {detail.members.length}/{room.maxPlayers} 人
          </span>
          {room.clock !== null && <span className="fact">{formatGameTime(room.clock)}</span>}
          {room.status === 'running' && <span className="fact">{room.mode === 'round' ? '回合模式' : '计时模式'}</span>}
          {room.untimed && <span className="fact">不计时</span>}
          <span className="fact">花费 {money(room.cost)}</span>
          <span className="fact">
            对局码 <span className="code">{room.joinCode}</span>
          </span>
          <span className="host-controls">
            <Link to={`/room/${id}`} className="btn btn-small btn-quiet">
              对局页面
            </Link>
            {room.status === 'preparing' && (
              <button
                type="button"
                className="btn btn-small btn-primary"
                disabled={busy || detail.characters.length === 0}
                title={detail.characters.length === 0 ? '还没有人选身份' : undefined}
                onClick={() => void setStatus('running')}
              >
                开始对局
              </button>
            )}
            {room.status === 'running' && (
              <button type="button" className="btn btn-small" disabled={busy} onClick={() => void setStatus('paused')}>
                暂停
              </button>
            )}
            {room.status === 'paused' && (
              <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void setStatus('running')}>
                继续
              </button>
            )}
            {room.status !== 'ended' && (
              <button type="button" className="btn btn-small btn-danger" disabled={busy} onClick={() => setConfirming('end')}>
                结束对局
              </button>
            )}
            <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void exportFull()}>
              导出完整团录
            </button>
            <a href={`/api/admin/rooms/${room.id}/debug-package`} className="btn btn-small btn-quiet" download>
              导出排查包
            </a>
            <button type="button" className="btn btn-small btn-quiet btn-danger-text" disabled={busy} onClick={() => setConfirming('delete')}>
              删除对局
            </button>
          </span>
        </div>
        {confirming && (
          <div className="confirm-bar" role="alertdialog" aria-labelledby="admin-confirm">
            <p id="admin-confirm">
              {confirming === 'delete'
                ? `删除「${room.name}」？所有记录、角色、笔记会一起删掉，成员们都看不到了，不能恢复。`
                : `结束「${room.name}」？结束以后不能再继续，记录会保留。`}
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-small btn-danger-solid"
                disabled={busy}
                onClick={() =>
                  void (confirming === 'delete'
                    ? run(async () => {
                        await api('DELETE', `/api/admin/rooms/${id}`);
                        navigate('/admin?tab=rooms', { replace: true });
                      })
                    : setStatus('ended'))
                }
              >
                {confirming === 'delete' ? '确认删除' : '确认结束'}
              </button>
              <button type="button" className="btn btn-small btn-quiet" onClick={() => setConfirming(null)} autoFocus>
                取消
              </button>
            </div>
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </header>

      <div className="picker-tabs admin-tabs" role="tablist" aria-label="这一局的后台数据">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="picker-tab" aria-selected={current === t.id} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'violations' && detail.violations.length > 0 && <span className="tab-count">{detail.violations.length}</span>}
          </button>
        ))}
      </div>

      <div className="admin-body">
        {current === 'host' && (
          <div className="admin-host">
            <HostTools
              roomId={id}
              full
              status={room.status}
              clock={room.clock}
              stressRule={!!detail.scenario?.data.stress}
              refreshKey={loadedAt}
            />
          </div>
        )}
        {current === 'people' && <People detail={detail} />}
        {current === 'scenario' && <ScenarioAndWorld detail={detail} />}
        {current === 'log' && <FullLog roomId={id} />}
        {current === 'actions' && <ActionsAndCalls detail={detail} />}
        {current === 'notes' && <NotesAndJobs detail={detail} />}
        {current === 'violations' && <RoomViolations detail={detail} />}
      </div>
    </div>
  );
}

function People({ detail }: { detail: AdminRoomDetail }) {
  return (
    <>
      <section className="section" aria-labelledby="admin-members">
        <h2 id="admin-members">成员</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">成员</th>
                <th scope="col">身份</th>
                <th scope="col">在线</th>
                <th scope="col">AI 额度（已用 / 共）</th>
              </tr>
            </thead>
            <tbody>
              {detail.members.map((m) => (
                <tr key={m.userId} className={m.banned ? 'is-dim' : ''}>
                  <td>
                    <strong>{m.displayName}</strong> <span className="muted">{m.username}</span>
                    {m.banned && <span className="tag tag-warn">已封禁</span>}
                  </td>
                  <td>{m.role === 'host' ? '房主' : '玩家'}</td>
                  <td>{m.online ? '在线' : m.lastSeenAt ? `上次 ${formatDateTime(m.lastSeenAt)}` : '还没来过'}</td>
                  <td>{m.credit.unlimited ? `不限（已用 ${money(m.credit.spent)}）` : `${money(m.credit.spent)} / ${money(m.credit.total)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="section" aria-labelledby="admin-characters">
        <h2 id="admin-characters">角色（包括秘密）</h2>
        {detail.characters.length === 0 && <p className="muted">还没有人建角色。</p>}
        <div className="admin-cards">
          {detail.characters.map((c) => (
            <article key={c.id} className="admin-card">
              <h3>
                {c.name}
                <span className="muted">
                  {' '}
                  {c.playerName}，{c.roleName}
                </span>
                {c.dead && <span className="tag tag-warn">已死亡</span>}
              </h3>
              <dl className="facts compact-facts">
                <dt>属性</dt>
                <dd>
                  {Object.entries(c.attributes)
                    .map(([k, v]) => `${ATTR_NAME[k] ?? k} ${v > 0 ? `+${v}` : v}`)
                    .join('，')}
                </dd>
                <dt>专长</dt>
                <dd>{c.specialties.join('、') || '—'}</dd>
                <dt>伤势、心智</dt>
                <dd>
                  {WOUND_LABEL[c.wounds]}，{STRESS_LABEL[c.stress]}
                </dd>
                <dt>位置</dt>
                <dd>
                  {c.locationName ?? '—'}
                  <span className="muted">（去过：{c.visitedNames.join('、') || '—'}）</span>
                </dd>
                <dt>物品</dt>
                <dd>{c.items.join('、') || '—'}</dd>
                <dt>状态</dt>
                <dd>{c.conditions.map((k) => `${k.name}${k.effect ? `（${k.effect}）` : ''}`).join('、') || '—'}</dd>
                <dt>身份的秘密</dt>
                <dd>{c.roleSecret || '—'}</dd>
                <dt>身份的目标</dt>
                <dd>{c.roleGoal || '—'}</dd>
                <dt>外貌</dt>
                <dd>{c.appearance || '—'}</dd>
                <dt>个人目标</dt>
                <dd>{c.goal || '—'}</dd>
              </dl>
            </article>
          ))}
        </div>
        {detail.companions?.length > 0 && (
          <>
            <h3 className="admin-companions-title">AI 队友</h3>
            <ul className="plain-list admin-companions">
              {detail.companions.map((c) => (
                <li key={c.roleKey}>
                  <span className="tag ai-tag">AI</span>
                  <strong>{c.name}</strong>
                  <span className="muted">
                    {c.roleName}，NPC {c.npcKey}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}

const ATTR_NAME: Record<string, string> = { body: '体魄', agility: '敏捷', intellect: '智识', perception: '感知', charm: '魅力' };
const SOURCE_NAME: Record<string, string> = { builtin: '现成的剧本', generated: 'AI 生成的', imported: '导入的' };

function ScenarioAndWorld({ detail }: { detail: AdminRoomDetail }) {
  const s = detail.scenario;
  const world = detail.world;
  const npcs = Object.entries(world.npcs);
  const events = Object.entries(world.events).filter(([, e]) => e.happened);
  return (
    <>
      <section className="section" aria-labelledby="admin-scenario">
        <h2 id="admin-scenario">剧本</h2>
        {!s ? (
          <p className="muted">还没选剧本。</p>
        ) : (
          <>
            <p>
              《{String(s.data.title)}》{SOURCE_NAME[s.source] ?? s.source}，{String(s.data.genre)}，{RELATION_LABEL[s.data.relation as keyof typeof RELATION_LABEL] ?? ''}
              {s.revealed && <span className="muted">（房主看过完整剧本）</span>}
            </p>
            <div className="callout">
              <strong>真相</strong>
              <p className="pre-line">{String(s.data.truth?.summary ?? '')}</p>
            </div>
            <div className="host-buttons">
              <button
                type="button"
                className="btn btn-small"
                onClick={() => saveFile(`${String(s.data.title)}.json`, JSON.stringify(s.data, null, 2), 'application/json')}
              >
                下载剧本文件
              </button>
            </div>
            <details>
              <summary>完整剧本（JSON）</summary>
              <pre className="json-block">{JSON.stringify(s.data, null, 2)}</pre>
            </details>
          </>
        )}
      </section>
      <section className="section" aria-labelledby="admin-world">
        <h2 id="admin-world">世界状态</h2>
        {world.ending && (
          <p>
            结局：<strong>{world.ending.title}</strong>
          </p>
        )}
        <h3>NPC 的变化</h3>
        {npcs.length === 0 ? (
          <p className="muted">没有变化。</p>
        ) : (
          <ul className="plain-list">
            {npcs.map(([key, n]) => (
              <li key={key}>
                <strong>{key}</strong>：{[n.attitude, n.location && `在 ${n.location}`, n.dead && '已死亡', ...(n.notes ?? [])].filter(Boolean).join('；')}
              </li>
            ))}
          </ul>
        )}
        <h3>已经发生的时间线事件</h3>
        {events.length === 0 ? (
          <p className="muted">还没有。</p>
        ) : (
          <ul className="plain-list">
            {events.map(([key, e]) => (
              <li key={key}>
                {formatGameTime(e.at)} <strong>{key}</strong>：{e.note}
              </li>
            ))}
          </ul>
        )}
        <h3>主持人的剧情笔记</h3>
        <p className="pre-line">{detail.storySummary.text || '还没有（经历攒够了才会写）。'}</p>
      </section>
    </>
  );
}

function FullLog({ roomId }: { roomId: number }) {
  const [entries, setEntries] = useState<AdminLogEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (before?: number) => {
      try {
        const r = await api<{ entries: AdminLogEntry[]; hasMore: boolean }>('GET', `/api/admin/rooms/${roomId}/log${before ? `?before=${before}` : ''}`);
        setEntries((list) => (before ? [...r.entries, ...list] : r.entries));
        setHasMore(r.hasMore);
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [roomId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="section" aria-label="全部记录">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {hasMore && (
        <button type="button" className="btn btn-small btn-quiet" onClick={() => void load(entries[0]?.id)}>
          加载更早的
        </button>
      )}
      <ol className="admin-log">
        {entries.map((e) => (
          <li key={e.id} className={`admin-log-entry kind-${e.kind}`}>
            <p className="admin-log-head">
              <span className="muted">
                {formatDateTime(e.createdAt)}
                {e.gameTime !== null && `，游戏里${formatGameTime(e.gameTime)}`}
              </span>
              <span className="tag">{e.kind === 'narration' ? '叙述' : e.kind === 'ooc' ? '场外' : '系统'}</span>
              {e.author && <strong>{e.author}</strong>}
              {e.private && <span className="private-mark">只有{e.to.join('、') || '当事人'}看得到</span>}
            </p>
            {e.data?.type === 'resolution' && (
              <p className="admin-log-action">
                <strong>{String(e.data.actor)}</strong>：{String(e.data.action)}
              </p>
            )}
            <p className="pre-line">{e.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ActionsAndCalls({ detail }: { detail: AdminRoomDetail }) {
  return (
    <>
      <section className="section" aria-labelledby="admin-actions">
        <h2 id="admin-actions">行动（最近 100 个）</h2>
        {detail.actions.length === 0 ? (
          <p className="muted">还没有行动。</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">提交时间</th>
                  <th scope="col">角色</th>
                  <th scope="col">行动</th>
                  <th scope="col">状态</th>
                </tr>
              </thead>
              <tbody>
                {detail.actions.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDateTime(a.submittedAt)}</td>
                    <td>{a.character}</td>
                    <td className="cell-text">{a.content}</td>
                    <td>
                      {ACTION_STATUS[a.status] ?? a.status}
                      {a.refused && <span className="tag tag-warn">被拒绝</span>}
                      {a.error && <span className="block-hint hint">{a.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="section" aria-labelledby="admin-calls">
        <h2 id="admin-calls">AI 调用</h2>
        <ul className="plain-list">
          {detail.ai.byPurpose.map((p) => (
            <li key={p.purpose}>
              {PURPOSE_LABEL[p.purpose] ?? p.purpose}：{money(p.cost)}（{p.calls} 次）
            </li>
          ))}
        </ul>
        {detail.ai.recent.length > 0 && (
          <div className="table-wrap">
            <table className="table table-numbers">
              <thead>
                <tr>
                  <th scope="col">时间</th>
                  <th scope="col">用途</th>
                  <th scope="col">替谁</th>
                  <th scope="col">输入 / 输出</th>
                  <th scope="col">花费</th>
                  <th scope="col">结果</th>
                </tr>
              </thead>
              <tbody>
                {detail.ai.recent.map((c, i) => (
                  <tr key={i}>
                    <td>{formatDateTime(c.at)}</td>
                    <td>{PURPOSE_LABEL[c.purpose] ?? c.purpose}</td>
                    <td>{c.user ?? '大家'}</td>
                    <td>
                      {c.input + c.cacheRead + c.cacheWrite} / {c.output}
                    </td>
                    <td>{money(c.cost)}</td>
                    <td>
                      {c.error ? <span className="cell-alert">{c.error}</span> : c.stopReason === 'refusal' ? <span className="cell-alert">被拒绝</span> : '成功'}
                      {c.requestId && <span className="block-hint hint">{c.requestId}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function NotesAndJobs({ detail }: { detail: AdminRoomDetail }) {
  return (
    <>
      <section className="section" aria-labelledby="admin-notes">
        <h2 id="admin-notes">所有人的笔记</h2>
        {detail.notes.length === 0 && <p className="muted">没有人写笔记。</p>}
        {detail.notes.map((n, i) => (
          <article key={i} className="shared-note">
            <p className="shared-note-head">
              <strong>{n.author}</strong>
              <span className="muted">更新于 {formatDateTime(n.updatedAt)}</span>
              {n.sharedWith.length > 0 && <span className="muted">分享给 {n.sharedWith.join('、')}</span>}
            </p>
            {n.content.trim() ? <p className="shared-note-text">{n.content}</p> : <p className="muted">空的</p>}
          </article>
        ))}
      </section>
      <section className="section" aria-labelledby="admin-jobs">
        <h2 id="admin-jobs">AI 生成、转换剧本的记录</h2>
        {detail.jobs.length === 0 && <p className="muted">没有。</p>}
        <ul className="plain-list">
          {detail.jobs.map((j) => (
            <li key={j.id}>
              {formatDateTime(j.createdAt)} {j.by ?? '已注销的账号'} {j.kind === 'generate' ? '生成剧本' : '转换文本剧本'}：
              {j.status === 'done' ? '完成' : j.status === 'running' ? '进行中' : j.status === 'cancelled' ? '取消了' : `失败（${j.error ?? ''}）`}
              <details>
                <summary>要求和原文</summary>
                <pre className="json-block">{typeof j.input === 'string' ? j.input : JSON.stringify(j.input, null, 2)}</pre>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function RoomViolations({ detail }: { detail: AdminRoomDetail }) {
  if (!detail.violations.length) return <p className="empty">这一局没有违规记录。</p>;
  return (
    <ul className="violation-list">
      {detail.violations.map((v) => (
        <li key={v.id} className={v.reviewedAt ? 'violation is-done' : 'violation'}>
          <p className="violation-head">
            <strong>{v.user?.displayName ?? '没有对应的账号'}</strong>
            <span className="muted">{formatDateTime(v.at)}</span>
          </p>
          <p>
            {v.kind === 'precheck' ? '发给 AI 之前检查出来' : '被 AI 的安全机制拒绝'}，{v.sourceLabel}，{v.category}
          </p>
          <details>
            <summary>看内容</summary>
            <pre className="violation-content">{v.content}</pre>
          </details>
        </li>
      ))}
    </ul>
  );
}
