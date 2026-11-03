import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, type User, type Violation } from '../../api';
import { formatDateTime } from '../../format';
import { refreshBadges } from '../../live';
import { Link } from '../../router';
import { ErrorLine, OUTCOME_LABEL } from './common';

// ==================== 违规记录 ====================

export function ViolationsTab({ me }: { me: User }) {
  const [list, setList] = useState<Violation[] | null>(null);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setList((await api<{ violations: Violation[] }>('GET', '/api/admin/violations')).violations);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: number, dismiss = false) {
    if (dismiss && !window.confirm('标成误判？这一次不算他的违规次数。因为这一次被封的号，要另外去「账号」里解封。')) return;
    try {
      await api('POST', `/api/admin/violations/${id}/review`, { dismiss });
      await load();
      void refreshBadges();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const shown = (list ?? []).filter((v) => !onlyOpen || v.reviewedAt === null);
  return (
    <section className="section" aria-label="违规记录">
      <label className="choice">
        <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
        <span>只看还没处理的</span>
      </label>
      <ErrorLine error={error} />
      {list && shown.length === 0 && <p className="empty">{onlyOpen ? '没有要处理的违规记录。' : '还没有违规记录。'}</p>}
      <ul className="violation-list">
        {shown.map((v) => (
          <li key={v.id} className={v.reviewedAt ? 'violation is-done' : 'violation'}>
            <p className="violation-head">
              <span className={v.outcome === 'flagged' ? 'tag tag-warn' : 'tag'}>{OUTCOME_LABEL[v.outcome]}</span>
              {v.dismissed && <span className="tag">误判</span>}
              <strong>{v.user ? v.user.displayName : '没有对应的账号'}</strong>
              {v.user && <span className="muted">{v.user.username}</span>}
              <span className="muted">{formatDateTime(v.at)}</span>
            </p>
            <p>
              {v.kind === 'precheck' ? '发给 AI 之前检查出来' : '被 AI 的安全机制拒绝'}，{v.sourceLabel}，{v.category}
              {v.room && (
                <>
                  ，在<Link to={`/admin/rooms/${v.room.id}`}>{v.room.name}</Link>
                </>
              )}
            </p>
            {v.reason && <p className="muted">{v.reason}</p>}
            <details>
              <summary>看内容</summary>
              <pre className="violation-content">{v.content}</pre>
            </details>
            {v.reviewedAt ? (
              <p className="hint">
                {v.reviewer ?? '管理员'} 在 {formatDateTime(v.reviewedAt)} {v.dismissed ? '标成了误判，不算次数' : '标成了已处理'}
              </p>
            ) : v.user?.isOwner && !me.isOwner ? null : (
              <div className="host-buttons">
                <button type="button" className="btn btn-small" onClick={() => void review(v.id)}>
                  标成已处理
                </button>
                {v.user && (v.outcome === 'warned' || v.outcome === 'banned') && (
                  <button type="button" className="btn btn-small btn-quiet" onClick={() => void review(v.id, true)}>
                    误判
                  </button>
                )}
                {v.user && v.outcome === 'flagged' && (
                  <Link to={`/admin?tab=users&q=${encodeURIComponent(v.user.username)}`} className="btn btn-small btn-quiet">
                    去账号里处理他
                  </Link>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
