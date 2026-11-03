import { useEffect, useState } from 'react';
import { api, errorMessage, type AdminRoomRow } from '../../api';
import { Stamp } from '../../components/bits';
import { formatDateTime, money } from '../../format';
import { Link } from '../../router';
import { ErrorLine } from './common';

// ==================== 所有对局 ====================

export function RoomsTab() {
  const [rooms, setRooms] = useState<AdminRoomRow[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ rooms: AdminRoomRow[] }>('GET', '/api/admin/rooms')
      .then((r) => setRooms(r.rooms))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <section className="section" aria-label="所有对局">
      <ErrorLine error={error} />
      {rooms && rooms.length === 0 && <p className="empty">还没有对局。</p>}
      {rooms && rooms.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">对局</th>
                <th scope="col">状态</th>
                <th scope="col">房主</th>
                <th scope="col">人数</th>
                <th scope="col">花费</th>
                <th scope="col">最近动静</th>
                <th scope="col">
                  <span className="visually-hidden">操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/admin/rooms/${r.id}`}>{r.name}</Link>
                    {r.isPublic && <span className="tag">公开</span>}
                    {r.scenarioTitle && <span className="muted"> 《{r.scenarioTitle}》</span>}
                  </td>
                  <td>
                    <Stamp status={r.status} />
                  </td>
                  <td>{r.host?.displayName ?? '—'}</td>
                  <td>
                    {r.members} 人，{r.characters} 个角色{r.online > 0 && `，${r.online} 人在线`}
                  </td>
                  <td>{money(r.cost)}</td>
                  <td className="nowrap">{formatDateTime(r.lastActivityAt)}</td>
                  <td className="row-actions">
                    <Link to={`/room/${r.id}`} className="btn btn-small btn-quiet">
                      {r.status === 'preparing' ? '去开局' : '对局页面'}
                    </Link>
                    <a href={`/api/admin/rooms/${r.id}/debug-package`} className="btn btn-small btn-quiet" download>
                      导出排查包
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
