import { useCallback, useEffect, useState } from 'react';
import type { HallScenario } from '../../../shared/works';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { CategoryTag } from '../components/Category';
import { Stars } from '../components/Stars';
import { formatDate } from '../format';
import { Link } from '../router';
import { CreateRoomForm } from './Lobby';
import { ScenarioDetailPanel, ShelfAuthor } from './ScenarioHall';

// 模组（V1.0.0）：5E 模组从剧本大厅里单独拿出来，和剧本大厅、地下城并列，按建议等级排。
// 评分和短评、「用这个模组开局」和剧本大厅一样；带自己的 5E 角色卡进去。

export function ModuleHallPage() {
  const { user } = useAuth();
  const guest = !!user?.isGuest;
  const [list, setList] = useState<HallScenario[] | null>(null);
  const [error, setError] = useState('');
  /** 正在填哪个模组的开局表单。 */
  const [opening, setOpening] = useState<string | null>(null);
  /** 点开了哪个模组的评分和短评。 */
  const [detailOf, setDetailOf] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setList((await api<{ modules: HallScenario[] }>('GET', '/api/module-hall')).modules);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '模组 - 龙娘跑团';
    void load();
  }, [load]);

  // 关注、取消关注作者（用户投稿的模组）：同一个作者的都一起变
  async function toggleFollow(publicId: string, following: boolean) {
    try {
      await api(following ? 'DELETE' : 'POST', `/api/users/${encodeURIComponent(publicId)}/follow`);
      setList((l) => l?.map((s) => (s.authorUser?.publicId === publicId ? { ...s, authorUser: { ...s.authorUser, following: !following } } : s)) ?? l);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="module-hall">
      <div className="page-head">
        <h1>模组</h1>
        {!guest && (
          <Link to="/characters?tab=5e" className="btn btn-small">
            我的 5E 角色
          </Link>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {list === null ? (
        !error && <p className="muted">正在加载……</p>
      ) : list.length === 0 ? (
        <p className="empty">还没有模组。</p>
      ) : (
        <ol className="shelf module-list" aria-label="模组，按建议等级排">
          {list.map((s) => (
            <li key={s.key} className="shelf-item spine-module">
              <div className="shelf-body">
                <div className="shelf-head">
                  <h2 className="shelf-title">{s.title}</h2>
                  <span className="tag tag-five">5E · 建议 {s.module5e?.level ?? 1} 级</span>
                </div>
                <p className="shelf-meta">
                  <CategoryTag category={s.category} />
                  {s.genre} · {s.players.min === s.players.max ? s.players.max : `${s.players.min}～${s.players.max}`}人
                </p>
                <p className="shelf-intro">{s.intro || s.tone}</p>
                <div className="shelf-foot">
                  <ShelfAuthor scenario={s} onFollow={(publicId, following) => void toggleFollow(publicId, following)} />
                  {s.plays > 0 && <span className="shelf-plays">开过 {s.plays} 局</span>}
                  {s.finishes > 0 && <span className="shelf-plays">玩完 {s.finishes} 局</span>}
                  {s.publishedAt !== null && <span className="shelf-plays">{formatDate(s.publishedAt)} 上架</span>}
                </div>
                <div className="shelf-score">
                  <Stars value={s.rating.average} count={s.rating.count} />
                  {s.endings.total > 0 && (
                    <span className={s.endings.reached === s.endings.total ? 'shelf-endings is-complete' : 'shelf-endings'}>
                      结局 {s.endings.reached}/{s.endings.total}
                    </span>
                  )}
                  <button type="button" className="linklike" aria-expanded={detailOf === s.key} onClick={() => setDetailOf((d) => (d === s.key ? null : s.key))}>
                    {detailOf === s.key ? '收起' : s.canRate ? '评分和短评' : '看短评'}
                  </button>
                </div>
              </div>
              <div className="shelf-action">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={guest}
                  aria-expanded={opening === s.key}
                  onClick={() => setOpening((o) => (o === s.key ? null : s.key))}
                >
                  用这个模组开局
                </button>
              </div>
              {opening === s.key && !guest && (
                <div className="shelf-create">
                  <CreateRoomForm scenario={s} onCancel={() => setOpening(null)} />
                </div>
              )}
              {detailOf === s.key && (
                <ScenarioDetailPanel
                  scenario={s}
                  onRated={(d) => setList((l) => l?.map((x) => (x.key === s.key ? { ...x, rating: d.rating } : x)) ?? l)}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
