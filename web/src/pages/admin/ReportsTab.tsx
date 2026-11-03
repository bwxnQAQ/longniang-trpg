import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage, type AdminReport, type ReportKind, type User } from '../../api';
import { AiReviewBox } from '../../components/AiReview';
import { Field } from '../../components/bits';
import { UserChip } from '../../components/people';
import { formatDateTime } from '../../format';
import { refreshBadges } from '../../live';
import { Link } from '../../router';
import { LOBBY_SLOW_MAX } from '../../../../shared/admin';
import { ErrorLine, has } from './common';

// ==================== 举报和反馈 ====================

const KIND_LABEL: Record<ReportKind, string> = { report: '举报', feedback: '意见', bug: 'bug' };
const REPORT_OUTCOMES: Record<ReportKind, { value: string; label: string }[]> = {
  report: [{ value: 'handled', label: '已处理' }],
  feedback: [{ value: 'handled', label: '已处理' }],
  bug: [
    { value: 'confirmed', label: '已确认，会修' },
    { value: 'fixed', label: '已修复' },
    { value: 'need-info', label: '需要更多信息' },
    { value: 'not-a-bug', label: '不是问题' },
  ],
};

/** 大厅聊天的发言间隔（V0.5.0，防刷屏）：每人每隔几秒才能说一句、不能连着发一样的话；0 是不限。管理员自己不受限。 */
function LobbySlowSetting() {
  const [seconds, setSeconds] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ slowSeconds: number }>('GET', '/api/admin/lobby')
      .then((r) => setSeconds(r.slowSeconds))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      setSeconds((await api<{ slowSeconds: number }>('PUT', '/api/admin/lobby', { slowSeconds: Number(draft) })).slowSeconds);
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (seconds === null) return <ErrorLine error={error} />;
  return (
    <div className="registration-panel lobby-slow">
      {editing ? (
        <form className="inline-form" onSubmit={save}>
          <Field label="大厅聊天：每人每隔几秒才能说一句（0 是不限）" htmlFor="lobby-slow">
            <input id="lobby-slow" type="number" min="0" max={LOBBY_SLOW_MAX} step="1" inputMode="numeric" value={draft} onChange={(e) => setDraft(e.target.value)} />
          </Field>
          <button className="btn btn-primary btn-small" disabled={busy || draft.trim() === ''}>
            {busy ? '正在保存……' : '保存'}
          </button>
          <button type="button" className="btn btn-small btn-quiet" onClick={() => setEditing(false)}>
            取消
          </button>
        </form>
      ) : (
        <p className="registration-row">
          <span>{seconds > 0 ? <>大厅聊天：每人每 <strong>{seconds}</strong> 秒最多说一句，不能连着发一样的话</> : '大厅聊天：不限发言间隔'}</span>
          <button
            type="button"
            className="btn btn-small btn-quiet"
            onClick={() => {
              setDraft(String(seconds));
              setError('');
              setEditing(true);
            }}
          >
            修改
          </button>
        </p>
      )}
      <ErrorLine error={error} />
    </div>
  );
}

export function ReportsTab({ me }: { me: User }) {
  const [list, setList] = useState<AdminReport[] | null>(null);
  const [kind, setKind] = useState<ReportKind | 'all'>('all');
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setList((await api<{ reports: AdminReport[] }>('GET', '/api/admin/reports')).reports);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = (list ?? []).filter((r) => (kind === 'all' || r.kind === kind) && (!onlyOpen || r.handledAt === null));
  const openCount = (k: ReportKind) => (list ?? []).filter((r) => r.kind === k && r.handledAt === null).length;

  return (
    <section className="section" aria-label="举报和反馈">
      <LobbySlowSetting />
      <div className="admin-toolbar">
        <div className="segmented" role="radiogroup" aria-label="种类">
          {(['all', 'report', 'feedback', 'bug'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'segment is-on' : 'segment'} onClick={() => setKind(k)}>
              {k === 'all' ? '全部' : KIND_LABEL[k]}
              {k !== 'all' && openCount(k) > 0 && <span className="tab-count tab-count-new">{openCount(k)}</span>}
            </button>
          ))}
        </div>
        <label className="choice">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
          <span>只看还没处理的</span>
        </label>
      </div>
      <ErrorLine error={error} />
      {list && shown.length === 0 && <p className="empty">{onlyOpen ? '没有要处理的。' : '还没有人提交过。'}</p>}
      <ul className="report-list">
        {shown.map((r) => (
          <ReportItem key={r.id} report={r} me={me} onChanged={() => void load()} />
        ))}
      </ul>
    </section>
  );
}

function ReportTarget({ target }: { target: Record<string, any> }) {
  const [removed, setRemoved] = useState('');
  const [error, setError] = useState('');
  const where =
    target.type === 'lobby'
      ? '大厅聊天里的消息'
      : target.type === 'dm'
        ? '发给他的私信'
        : target.type === 'room'
          ? `对局「${target.roomName ?? ''}」里的发言`
          : target.type === 'user'
            ? '个人资料'
            : target.type === 'pet_note'
              ? `${target.ownerName ?? '别人'}的宠物主页上的留言`
              : target.type === 'rating'
                ? `剧本的短评（${target.scenarioKey ?? ''}）`
                : target.type === 'feedback'
                  ? `私下给作者的反馈（${target.scenarioKey ?? ''}）`
                  : target.type === 'group'
                    ? `群「${target.groupName ?? ''}」里的消息`
                    : target.type === 'persona'
                      ? `AI 大厅里的 AI 角色「${target.name ?? ''}」`
                      : '内容';

  // 剧本短评、给作者的反馈（V0.6.0）、AI 大厅里的 AI 角色（V1.1.0）：在这里直接删
  async function remove() {
    if (!window.confirm(target.type === 'rating' ? '删掉这条短评？星还留着。' : target.type === 'persona' ? '下架这个 AI 角色？作者那边也会删掉，没结束的对局里改由主持人顺带演。' : '删掉这条反馈？')) return;
    setError('');
    try {
      await api(
        'DELETE',
        target.type === 'rating' ? `/api/admin/ratings/${target.id}/comment` : target.type === 'persona' ? `/api/ai-personas/${target.id}` : `/api/feedback/${target.id}`,
      );
      setRemoved(target.type === 'persona' ? '下架了' : '删掉了');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="report-target">
      <p className="muted">
        举报的是{where}
        {target.at ? `（${formatDateTime(target.at)}）` : ''}：
      </p>
      {target.type === 'user' ? (
        <blockquote>
          显示名：{target.displayName}
          {target.bio ? `；介绍：${target.bio}` : ''}
        </blockquote>
      ) : (
        <blockquote className={target.type === 'persona' ? 'report-persona' : undefined}>{target.text}</blockquote>
      )}
      {(target.type === 'rating' || target.type === 'feedback' || target.type === 'persona') &&
        (removed ? (
          <p className="muted">{removed}</p>
        ) : (
          <button type="button" className="btn btn-small btn-danger" onClick={() => void remove()}>
            {target.type === 'rating' ? '删除这条短评' : target.type === 'persona' ? '下架这个 AI 角色' : '删除这条反馈'}
          </button>
        ))}
      {target.type === 'group' && target.groupId && (
        <Link to={`/admin?tab=chats&group=${target.groupId}`} className="btn btn-small">
          看这个群的记录
        </Link>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function ReportItem({ report: r, me, onChanged }: { report: AdminReport; me: User; onChanged: () => void }) {
  const outcomes = REPORT_OUTCOMES[r.kind];
  const [outcome, setOutcome] = useState(outcomes[0].value);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ctx = r.context ?? {};

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('POST', `/api/admin/reports/${r.id}/handle`, { outcome, reply });
      setReply('');
      onChanged();
      void refreshBadges();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={r.handledAt ? 'report is-done' : 'report'}>
      <p className="report-head">
        <span className={`tag tag-kind-${r.kind}`}>{KIND_LABEL[r.kind]}</span>
        {r.from ? <UserChip user={r.from} size={22} /> : <span className="muted">已删除的账号</span>}
        <span className="muted">{formatDateTime(r.at)}</span>
        {r.about && (
          <span className="report-about">
            举报了 <UserChip user={r.about} size={22} />
            {r.aboutBanned && <span className="tag tag-warn">已封禁</span>}
          </span>
        )}
      </p>
      {r.kind === 'report' && r.target && Object.keys(r.target).length > 0 && <ReportTarget target={r.target} />}
      {r.kind === 'report' && <AiReviewBox target="report" id={r.id} review={r.aiReview} />}
      <p className="report-body pre-line">{r.body}</p>
      {r.kind === 'bug' && r.steps && (
        <div className="report-steps">
          <p className="muted">怎么出现的：</p>
          <p className="pre-line">{r.steps}</p>
        </div>
      )}
      {r.kind === 'bug' && (
        <details className="report-context">
          <summary>自动附上的信息</summary>
          <dl className="facts facts-tight">
            <dt>页面</dt>
            <dd>{ctx.page || '—'}</dd>
            <dt>版本</dt>
            <dd>
              网页 {ctx.webVersion || '—'}，服务器 {ctx.serverVersion || '—'}
            </dd>
            <dt>屏幕</dt>
            <dd>{ctx.screen || '—'}</dd>
            <dt>浏览器</dt>
            <dd className="path">{ctx.browser || '—'}</dd>
            <dt>最近的报错</dt>
            <dd>
              {Array.isArray(ctx.errors) && ctx.errors.length ? (
                <ul className="plain-list">
                  {ctx.errors.map((e: string, i: number) => (
                    <li key={i} className="path">
                      {e}
                    </li>
                  ))}
                </ul>
              ) : (
                '没有'
              )}
            </dd>
          </dl>
        </details>
      )}
      {r.handledAt ? (
        <p className="hint">
          {r.handler ?? '管理员'} 在 {formatDateTime(r.handledAt)} 处理：{r.outcomeLabel ?? '已处理'}
          {r.reply && `；回复：${r.reply}`}
        </p>
      ) : (
        <form className="report-handle" onSubmit={handle}>
          {outcomes.length > 1 && (
            <>
              <label className="visually-hidden" htmlFor={`outcome-${r.id}`}>
                处理结果
              </label>
              <select id={`outcome-${r.id}`} value={outcome} onChange={(e) => setOutcome(e.target.value)} disabled={busy}>
                {outcomes.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </>
          )}
          <label className="visually-hidden" htmlFor={`reply-${r.id}`}>
            回复
          </label>
          <input id={`reply-${r.id}`} maxLength={1000} value={reply} placeholder="回复给提交的人（选填）" onChange={(e) => setReply(e.target.value)} disabled={busy} />
          <button className="btn btn-small btn-primary" disabled={busy}>
            {outcomes.length > 1 ? '提交' : '标成已处理'}
          </button>
          {r.kind === 'report' && r.about && has(me, 'ban') && !r.aboutBanned && (
            <Link to={`/admin?tab=users&q=${encodeURIComponent(r.about.username)}`} className="btn btn-small btn-quiet">
              去账号里处理他
            </Link>
          )}
          <ErrorLine error={error} />
        </form>
      )}
    </li>
  );
}
