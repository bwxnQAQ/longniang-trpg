import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, type AuditEntry } from '../../api';
import { formatDateTime } from '../../format';
import { ErrorLine } from './common';

// ==================== 操作记录 ====================

export function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async (before?: number) => {
    try {
      const r = await api<{ entries: AuditEntry[]; hasMore: boolean }>('GET', `/api/admin/audit${before ? `?before=${before}` : ''}`);
      setEntries((list) => (before && list ? [...list, ...r.entries] : r.entries));
      setHasMore(r.hasMore);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const s = q.trim().toLowerCase();
  const shown = (entries ?? []).filter((e) => !s || `${e.action} ${e.detail} ${e.by}`.toLowerCase().includes(s));
  return (
    <section className="section" aria-label="操作记录">
      <div className="admin-toolbar">
        <label className="visually-hidden" htmlFor="audit-search">
          筛选
        </label>
        <input id="audit-search" type="search" value={q} placeholder="操作、内容或管理员的名字" onChange={(e) => setQ(e.target.value)} />
      </div>
      <ErrorLine error={error} />
      {entries && shown.length === 0 && <p className="empty">{s ? '没有符合的记录。' : '还没有操作记录。'}</p>}
      {shown.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">时间</th>
                <th scope="col">谁</th>
                <th scope="col">做了什么</th>
                <th scope="col">内容</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id}>
                  <td className="nowrap">{formatDateTime(e.at)}</td>
                  <td>{e.by}</td>
                  <td className="nowrap">{e.action}</td>
                  <td>{e.detail || <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasMore && entries && (
        <div className="actions">
          <button type="button" className="btn btn-small btn-quiet" onClick={() => void load(entries[entries.length - 1]?.id)}>
            加载更早的
          </button>
        </div>
      )}
    </section>
  );
}
