import { useCallback, useEffect, useState } from 'react';
import { SIZE_LABEL } from '../../../shared/rules2';
import type { DungeonHallEntry, DungeonRecords } from '../../../shared/works';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { GuestNote } from '../components/GuestNote';
import { Stars } from '../components/Stars';
import { formatDate } from '../format';
import { Link } from '../router';
import { CreateRoomForm } from './Lobby';
import { ScenarioDetailPanel, ShelfAuthor } from './ScenarioHall';

// 地下城（V0.7.1）：从剧本大厅里单独拿出来，和剧本大厅并列。按难度列出地下城，每个带着通关记录；
// 评分和短评、「用这个地下城开局」和剧本大厅一样。最上面一句话说明局外培养（站长要的）。

export function DungeonHallPage() {
  const { user } = useAuth();
  const guest = !!user?.isGuest;
  const [list, setList] = useState<DungeonHallEntry[] | null>(null);
  const [error, setError] = useState('');
  /** 正在填哪个地下城的开局表单。 */
  const [opening, setOpening] = useState<string | null>(null);
  /** 点开了哪个地下城的评分和短评。 */
  const [detailOf, setDetailOf] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setList((await api<{ dungeons: DungeonHallEntry[] }>('GET', '/api/dungeon-hall')).dungeons);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '地下城 - 龙娘跑团';
    void load();
  }, [load]);

  // 关注、取消关注作者（用户投稿的地下城）：同一个作者的都一起变
  async function toggleFollow(publicId: string, following: boolean) {
    try {
      await api(following ? 'DELETE' : 'POST', `/api/users/${encodeURIComponent(publicId)}/follow`);
      setList((l) => l?.map((s) => (s.authorUser?.publicId === publicId ? { ...s, authorUser: { ...s.authorUser, following: !following } } : s)) ?? l);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="dungeon-hall">
      <div className="page-head">
        <h1>地下城</h1>
      </div>
      <section className="dungeon-pitch" aria-label="局外培养">
        <p className="dungeon-pitch-text">
          地下城有<strong>局外培养</strong>：带自己的角色卡进去，打出来的成长点、装备、宝箱都留在角色和账号上，角色越刷越强。
        </p>
        {guest ? (
          <GuestNote what="带角色进地下城" />
        ) : (
          <Link to="/characters" className="btn btn-small dungeon-pitch-link">
            我的角色
          </Link>
        )}
      </section>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {list === null ? (
        !error && <p className="muted">正在加载……</p>
      ) : list.length === 0 ? (
        <p className="empty">还没有地下城。</p>
      ) : (
        <ol className="shelf dungeon-list" aria-label="地下城，按难度排">
          {list.map((s) => (
            <li key={s.key} className="shelf-item spine-dungeon">
              <div className="shelf-body">
                <div className="shelf-head">
                  <h2 className="shelf-title">{s.title}</h2>
                  {s.dungeon && (
                    <span className={`dungeon-level size-${s.dungeon.size}`}>
                      难度 {s.dungeon.level} · {SIZE_LABEL[s.dungeon.size]}
                    </span>
                  )}
                </div>
                <p className="shelf-meta">{s.players.min === s.players.max ? s.players.max : `${s.players.min}～${s.players.max}`}人</p>
                <p className="shelf-intro">{s.intro || s.tone}</p>
                <ClearRecords records={s.records} />
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
                  用这个地下城开局
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

const minutesText = (m: number) => (m < 60 ? `${m} 分钟` : `${Math.floor(m / 60)} 小时${m % 60 ? ` ${m % 60} 分` : ''}`);

/** 通关记录：最快的一次、最近通关的几队。 */
function ClearRecords({ records }: { records: DungeonRecords }) {
  if (records.recent.length === 0) return <p className="muted clear-records">还没有人通关。</p>;
  return (
    <div className="clear-records">
      {records.fastest && (
        <p>
          最快通关：{records.fastest.players.join('、')}，{minutesText(records.fastest.realMinutes)}（{formatDate(records.fastest.at)}）
        </p>
      )}
      <ul>
        {records.recent.map((r, i) => (
          <li key={i}>
            {r.players.join('、')} · {minutesText(r.realMinutes)} · {formatDate(r.at)}
          </li>
        ))}
      </ul>
    </div>
  );
}
