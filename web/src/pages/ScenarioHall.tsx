import { useCallback, useEffect, useState } from 'react';
import { CATEGORY_NAME, RELATION_LABEL, SCENARIO_CATEGORIES, SITE_AUTHOR, type ScenarioCategory } from '../../../shared/game';
import { HALL_SORT_LABEL, SUBMISSION_STATUS_LABEL, type HallSort } from '../../../shared/works';
import { api, errorMessage, type HallScenario, type ScenarioDetail, type Submission } from '../api';
import { useAuth } from '../auth';
import { CategoryTag, isCategory } from '../components/Category';
import { openFeedback } from '../components/Feedback';
import { RateForm, Stars } from '../components/Stars';
import { Avatar, profilePath } from '../components/people';
import { formatDate } from '../format';
import { Link, navigate, Redirect, useLocation } from '../router';
import { CreateRoomForm } from './Lobby';
import { FeedbackToAuthor, MyWorks } from './HallExtras';

// 剧本大厅（V0.5.0）：按分区列出能用的剧本，「用这个剧本开局」；「新建对局」只在这里。
// 下面是自己投稿的进度。V0.6.0：评分和短评（玩完的人才能评、才看得到短评）、我达成了几个结局、排序。
// V0.7.0：作品排行挪到「排行」页。V0.7.1：地下城单独一页（DungeonHall.tsx），这里没有地下城分区了。
// V1.0.0：5E 模组也单独一页（ModuleHall.tsx），这里没有「5E 模组」那一栏了。

/** 剧本大厅里的分区（地下城在「地下城」页）。 */
const HALL_CATEGORIES = SCENARIO_CATEGORIES.filter((c) => c.key !== 'dungeon');

/** 全部、某个分区；我的作品（V0.6.0）。 */
type Tab = 'all' | ScenarioCategory | 'mine';

export function ScenarioHallPage() {
  const { user } = useAuth();
  const guest = !!user?.isGuest;
  const { query } = useLocation();
  const fromQuery = query.get('c');
  const tab: Tab = isCategory(fromQuery) ? fromQuery : fromQuery === 'mine' ? fromQuery : 'all';
  const [list, setList] = useState<HallScenario[] | null>(null);
  const [mine, setMine] = useState<Submission[]>([]);
  const [error, setError] = useState('');
  /** 正在填哪个剧本的开局表单；'' 是不选剧本的「新建对局」。 */
  const [opening, setOpening] = useState<string | null>(null);
  /** 点开了哪个剧本的评分和短评。 */
  const [detailOf, setDetailOf] = useState<string | null>(null);
  const [sort, setSort] = useState<HallSort>('default');

  const load = useCallback(async () => {
    try {
      const r = await api<{ scenarios: HallScenario[]; submissions: Submission[] }>('GET', '/api/scenario-hall');
      setList(r.scenarios);
      setMine(r.submissions);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '剧本大厅 - 龙娘跑团';
    void load();
  }, [load]);

  const choose = (next: Tab) => navigate(next === 'all' ? '/scenarios' : `/scenarios?c=${next}`, { replace: true });

  // 关注、取消关注：同一个作者的所有剧本一起变
  async function toggleFollow(publicId: string, following: boolean) {
    try {
      await api(following ? 'DELETE' : 'POST', `/api/users/${encodeURIComponent(publicId)}/follow`);
      setList((l) => l?.map((s) => (s.authorUser?.publicId === publicId ? { ...s, authorUser: { ...s.authorUser, following: !following } } : s)) ?? l);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function withdraw(id: number) {
    if (!window.confirm('撤回这份投稿？')) return;
    try {
      const r = await api<{ submission: Submission }>('DELETE', `/api/submissions/${id}`);
      setMine((m) => m.map((s) => (s.id === id ? r.submission : s)));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const filtered = list?.filter((s) => tab === 'all' || s.category === tab) ?? null;
  // 我有作品放进了剧本大厅（还在大厅里的，或者投稿通过过的）：显示「我的作品」
  const hasWorks = !!list?.some((s) => s.authorUser?.self) || mine.some((m) => m.status === 'approved');
  const shown = filtered && sortHall(filtered, sort);
  const count = (c: ScenarioCategory) => list?.filter((s) => s.category === c).length ?? 0;

  // 以前的「排行」分页（收藏的地址）：去「排行」页；以前的地下城分区（通知、活动里的链接）：去「地下城」页；
  // 以前的「5E 模组」那一栏（V0.9.0）：去「模组」页
  if (fromQuery === 'rank') return <Redirect to="/rankings" />;
  if (fromQuery === 'dungeon') return <Redirect to="/dungeons" />;
  if (fromQuery === '5e') return <Redirect to="/modules" />;

  return (
    <div className="scenario-hall">
      <div className="page-head">
        <h1>剧本大厅</h1>
        <div className="actions">
          {/* 网页剧本编辑器（V0.8.0）：游客也能写、能检查、能导出 */}
          <Link to="/editor" className="btn">
            写一个剧本
          </Link>
          {!guest && (
            <button type="button" className="btn btn-primary" aria-expanded={opening === ''} onClick={() => setOpening((o) => (o === '' ? null : ''))}>
              新建对局
            </button>
          )}
        </div>
      </div>
      {opening === '' && <CreateRoomForm onCancel={() => setOpening(null)} />}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="shelf-tabs" role="tablist" aria-label="分区">
        <button type="button" role="tab" className="shelf-tab" aria-selected={tab === 'all'} onClick={() => choose('all')}>
          <span className="shelf-tab-name">全部</span>
          <span className="shelf-tab-sub">{list?.length ?? ''}</span>
        </button>
        {HALL_CATEGORIES.map((c) => (
          <button key={c.key} type="button" role="tab" className={`shelf-tab shelf-tab-${c.key}`} aria-selected={tab === c.key} onClick={() => choose(c.key)}>
            <span className="shelf-tab-name">{c.name}</span>
            <span className="shelf-tab-sub">{list ? count(c.key) : ''}</span>
          </button>
        ))}
        {!guest && (hasWorks || tab === 'mine') && (
          <button type="button" role="tab" className="shelf-tab shelf-tab-mine" aria-selected={tab === 'mine'} onClick={() => choose('mine')}>
            <span className="shelf-tab-name">我的作品</span>
            <span className="shelf-tab-sub">数据 · 短评 · 反馈</span>
          </button>
        )}
      </div>

      {tab === 'mine' && <MyWorks />}

      {tab !== 'mine' && (
      <>
      <div className="hall-sort">
        <label htmlFor="hall-sort">排序</label>
        <select id="hall-sort" value={sort} onChange={(e) => setSort(e.target.value as HallSort)}>
          {(Object.keys(HALL_SORT_LABEL) as HallSort[]).map((k) => (
            <option key={k} value={k}>
              {HALL_SORT_LABEL[k]}
            </option>
          ))}
        </select>
      </div>

      {shown === null ? (
        !error && <p className="muted">正在加载……</p>
      ) : shown.length === 0 ? (
        <p className="empty">{tab === 'all' ? '还没有能用的剧本。' : `「${CATEGORY_NAME[tab]}」分区还没有剧本。`}</p>
      ) : (
        <ul className="shelf" aria-label={tab === 'all' ? '全部剧本' : `${CATEGORY_NAME[tab]}分区的剧本`}>
          {shown.map((s) => (
            <li key={s.key} className={`shelf-item spine-${s.category ?? 'none'}`}>
              <div className="shelf-body">
                <div className="shelf-head">
                  <h2 className="shelf-title">{s.title}</h2>
                  <CategoryTag category={s.category} />
                  {s.rules === '5e' && <span className="tag tag-five">5E · {s.module5e?.level ?? 1} 级</span>}
                </div>
                <p className="shelf-meta">
                  {s.genre} · {s.players.min === s.players.max ? s.players.max : `${s.players.min}～${s.players.max}`}人 · 预计{s.expectedDays}天 · {RELATION_LABEL[s.relation]}
                  {s.stress && ' · 有心智规则'}
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
              {!guest && (
                <div className="shelf-action">
                  <button type="button" className="btn btn-primary" aria-expanded={opening === s.key} onClick={() => setOpening((o) => (o === s.key ? null : s.key))}>
                    用这个剧本开局
                  </button>
                </div>
              )}
              {opening === s.key && (
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
        </ul>
      )}

      </>
      )}

      {mine.length > 0 && (
        <section className="my-submissions" aria-labelledby="my-submissions-title">
          <h2 id="my-submissions-title" className="section-title">
            我的投稿
          </h2>
          <ul className="submission-list">
            {mine.map((m) => (
              <li key={m.id} className={`submission submission-${m.status}`}>
                <div className="submission-main">
                  <span className="submission-title">《{m.title}》</span>
                  <CategoryTag category={m.category} />
                  <span className={`submission-status status-${m.status}`}>{SUBMISSION_STATUS_LABEL[m.status]}</span>
                  <span className="muted">{formatDate(m.createdAt)} 投稿</span>
                </div>
                {m.status === 'rejected' && m.reason && <p className="submission-reason">原因：{m.reason}</p>}
                <div className="submission-actions">
                  {m.roomId !== null && (
                    <Link to={`/room/${m.roomId}`} className="btn btn-small btn-quiet">
                      回到那一局
                    </Link>
                  )}
                  {m.status === 'pending' && (
                    <button type="button" className="btn btn-small btn-quiet" onClick={() => void withdraw(m.id)}>
                      撤回
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** 剧本卡片上的作者：用户投稿的带头像、点了去他的主页，正式账号能关注他（剧本大厅、地下城页都用）。 */
export function ShelfAuthor({ scenario: s, onFollow }: { scenario: HallScenario; onFollow: (publicId: string, following: boolean) => void }) {
  const { user } = useAuth();
  const author = s.authorUser;
  return (
    <span className="shelf-author">
      作者
      {author ? (
        author.deleted ? (
          <span>{author.displayName}</span>
        ) : (
          <Link to={profilePath(author.publicId)} className="shelf-author-link">
            <Avatar user={author} size={20} />
            {author.displayName}
          </Link>
        )
      ) : (
        <span>{s.author || SITE_AUTHOR}</span>
      )}
      {author && !author.self && !author.deleted && !user?.isGuest && (
        <button
          type="button"
          className={author.following ? 'btn btn-small btn-quiet' : 'btn btn-small'}
          aria-pressed={author.following}
          onClick={() => onFollow(author.publicId, author.following)}
        >
          {author.following ? '已关注' : '关注'}
        </button>
      )}
    </span>
  );
}

/** 排序：默认按服务器给的顺序；评分高的、开过的局多的、新上架的排前面。 */
function sortHall(list: HallScenario[], sort: HallSort): HallScenario[] {
  if (sort === 'default') return list;
  const copy = [...list];
  if (sort === 'rating') copy.sort((a, b) => (b.rating.average ?? -1) - (a.rating.average ?? -1) || b.rating.count - a.rating.count);
  if (sort === 'plays') copy.sort((a, b) => b.plays - a.plays);
  if (sort === 'newest') copy.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  return copy;
}

/** 点开的剧本：我的评分、短评（玩完的人、作者、管理员才看得到）、我达成过的结局。地下城页也用。 */
export function ScenarioDetailPanel({ scenario, onRated }: { scenario: HallScenario; onRated: (d: ScenarioDetail) => void }) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<ScenarioDetail | null>(null);
  const [error, setError] = useState('');
  const moderator = !!user?.permissions.includes('reports');

  const load = useCallback(async () => {
    try {
      setDetail(await api<ScenarioDetail>('GET', `/api/scenario-hall/${encodeURIComponent(scenario.key)}`));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [scenario.key]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeComment(id: number) {
    if (!window.confirm('删掉这条短评？星还留着。')) return;
    try {
      await api('DELETE', `/api/admin/ratings/${id}/comment`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (error) return <p className="form-error shelf-detail">{error}</p>;
  if (!detail) return <p className="muted shelf-detail">正在加载……</p>;
  const left = detail.endings.total - detail.endings.reached.length;
  return (
    <div className="shelf-detail">
      {detail.endings.total > 0 && (
        <p className="shelf-detail-endings">
          {detail.endings.reached.length === 0
            ? `${detail.endings.total} 个结局，你还一个都没达成。`
            : `你达成过：${detail.endings.reached.map((e) => `「${e.title}」`).join('')}${left > 0 ? `，还有 ${left} 个没达成。` : '，全部达成了。'}`}
        </p>
      )}
      {detail.feedback && scenario.authorUser && (
        <FeedbackToAuthor
          scenarioKey={scenario.key}
          authorName={scenario.authorUser.displayName}
          canSend={detail.feedback.canSend}
          mine={detail.feedback.mine}
        />
      )}
      {detail.canRate && (
        <RateForm
          scenarioKey={scenario.key}
          mine={detail.mine}
          onSaved={(d) => {
            setDetail(d);
            onRated(d);
          }}
        />
      )}
      {detail.comments === null ? (
        <p className="muted">玩完这个剧本才看得到短评。</p>
      ) : detail.comments.filter((c) => c.comment || c.commentDeleted).length === 0 ? (
        <p className="muted">还没有短评。</p>
      ) : (
        <ul className="rating-list">
          {detail.comments
            .filter((c) => c.comment || c.commentDeleted)
            .map((c) => (
              <li key={c.id} className={c.mine ? 'rating is-mine' : 'rating'}>
                <span className="rating-stars" aria-label={`${c.stars} 星`}>
                  {'★'.repeat(c.stars)}
                </span>
                <Link to={profilePath(c.author.publicId)} className="rating-who">
                  {c.author.displayName}
                </Link>
                <span className="rating-text">{c.commentDeleted ? <span className="muted">（短评被管理员删了）</span> : c.comment}</span>
                <span className="muted rating-at">{formatDate(c.at)}</span>
                {!c.mine && !c.commentDeleted && user && !user.isGuest && (
                  <button
                    type="button"
                    className="linklike"
                    onClick={() => openFeedback({ kind: 'report', target: { type: 'rating', id: c.id, preview: c.comment, author: c.author.displayName } })}
                  >
                    举报
                  </button>
                )}
                {moderator && !c.commentDeleted && (
                  <button type="button" className="linklike btn-danger-text" onClick={() => void removeComment(c.id)}>
                    删除短评
                  </button>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
