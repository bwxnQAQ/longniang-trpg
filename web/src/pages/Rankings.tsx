import { useEffect, useState } from 'react';
import type { CardRankings, CardRankRow } from '../../../shared/cards';
import { SCENARIO_CATEGORIES, type ScenarioCategory } from '../../../shared/game';
import { RANK_MIN_RATINGS, WORK_RANK_BY_LABEL, type AuthorRanking, type WorkRankBy, type WorkRanking } from '../../../shared/works';
import { api, errorMessage } from '../api';
import { CategoryTag, isCategory } from '../components/Category';
import { Avatar, profilePath } from '../components/people';
import { Link, navigate, useLocation } from '../router';

// 排行（V0.7.0）：作品榜放最前面、占大头（全部或者某个分区，按好评或者游玩次数）；作者榜；角色榜（战力、切磋胜场）。
// 以前剧本大厅里的「排行」、宠物页的排行都挪到这里（宠物排行不要了）。

export function RankingsPage() {
  const { query } = useLocation();
  const raw = query.get('c');
  const category: ScenarioCategory | null = isCategory(raw) ? raw : null;
  const by: WorkRankBy = query.get('by') === 'plays' ? 'plays' : 'rating';
  const [works, setWorks] = useState<WorkRanking | null>(null);
  const [worksError, setWorksError] = useState('');
  const [authors, setAuthors] = useState<AuthorRanking | null>(null);
  const [cards, setCards] = useState<CardRankings | null>(null);
  const [cardTab, setCardTab] = useState<'power' | 'wins'>('power');

  useEffect(() => {
    document.title = '排行 - 龙娘跑团';
    api<AuthorRanking>('GET', '/api/rankings/authors')
      .then(setAuthors)
      .catch(() => setAuthors({ rows: [] }));
    // 角色榜还没有的时候（没人做角色卡）也显示空的
    api<CardRankings>('GET', '/api/rankings/cards')
      .then((r) => setCards({ power: r.power ?? [], wins: r.wins ?? [] }))
      .catch(() => setCards({ power: [], wins: [] }));
  }, []);

  useEffect(() => {
    let live = true;
    const params = new URLSearchParams({ by, ...(category ? { category } : {}) });
    api<WorkRanking>('GET', `/api/rankings/works?${params}`)
      .then((r) => {
        if (!live) return;
        setWorks(r);
        setWorksError('');
      })
      .catch((err) => live && setWorksError(errorMessage(err)));
    return () => {
      live = false;
    };
  }, [category, by]);

  const go = (next: { c?: ScenarioCategory | null; by?: WorkRankBy }) => {
    const c = next.c === undefined ? category : next.c;
    const b = next.by ?? by;
    const params = new URLSearchParams({ ...(c ? { c } : {}), ...(b !== 'rating' ? { by: b } : {}) }).toString();
    navigate(params ? `/rankings?${params}` : '/rankings', { replace: true });
  };

  const current = works && works.category === category && works.by === by ? works : null;

  return (
    <div className="rankings-page">
      <div className="page-head">
        <h1>排行</h1>
      </div>
      <div className="rankings-layout">
        <section className="rank-panel rank-works" aria-labelledby="rank-works-title">
          <div className="rank-panel-head">
            <h2 id="rank-works-title" className="section-title">
              作品榜
            </h2>
            <div className="rank-by" role="group" aria-label="按什么排">
              {(Object.keys(WORK_RANK_BY_LABEL) as WorkRankBy[]).map((k) => (
                <button key={k} type="button" className="rank-by-option" aria-pressed={by === k} onClick={() => go({ by: k })}>
                  {WORK_RANK_BY_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
          <div className="shelf-tabs rank-categories" role="tablist" aria-label="分区">
            <button type="button" role="tab" className="shelf-tab" aria-selected={category === null} onClick={() => go({ c: null })}>
              <span className="shelf-tab-name">全部</span>
            </button>
            {SCENARIO_CATEGORIES.map((c) => (
              <button key={c.key} type="button" role="tab" className={`shelf-tab shelf-tab-${c.key}`} aria-selected={category === c.key} onClick={() => go({ c: c.key })}>
                <span className="shelf-tab-name">{c.name}</span>
              </button>
            ))}
          </div>
          {worksError ? (
            <p className="form-error">{worksError}</p>
          ) : !current ? (
            <p className="muted">正在加载……</p>
          ) : current.rows.length === 0 ? (
            <p className="empty">{by === 'rating' ? `还没有剧本被 ${RANK_MIN_RATINGS} 个人以上评过。` : '还没有剧本被玩完过。'}</p>
          ) : (
            <ol className="rank-list work-rank-list">
              {current.rows.map((r) => (
                <li key={r.key} className="rank-row work-rank-row">
                  <span className="rank-no">{r.rank}</span>
                  <span className="rank-who">
                    <span className="work-rank-title">《{r.title}》</span>
                    {category === null && <CategoryTag category={r.category} />}
                    <span className="muted">{r.author ? <Link to={profilePath(r.author.publicId)}>{r.author.displayName}</Link> : r.authorName}</span>
                  </span>
                  <span className="rank-value">{by === 'rating' ? `${r.value.toFixed(1)} 星（${r.count} 人）` : `玩完 ${r.value} 局`}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="rank-side">
          <section className="rank-panel" aria-labelledby="rank-authors-title">
            <h2 id="rank-authors-title" className="section-title">
              作者榜
            </h2>
            {!authors ? (
              <p className="muted">正在加载……</p>
            ) : authors.rows.length === 0 ? (
              <p className="empty">还没有作者的作品被玩完过。</p>
            ) : (
              <ol className="rank-list">
                {authors.rows.map((a) => (
                  <li key={a.author.publicId} className={a.me ? 'rank-row is-me' : 'rank-row'}>
                    <span className="rank-no">{a.rank}</span>
                    <Avatar user={a.author} size={28} />
                    <span className="rank-who">
                      <Link to={profilePath(a.author.publicId)}>{a.author.displayName}</Link>
                      <span className="muted">
                        {a.works} 部作品{a.average !== null && `，平均 ${a.average.toFixed(1)} 星`}
                      </span>
                    </span>
                    <span className="rank-value">玩完 {a.finishes} 局</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rank-panel" aria-labelledby="rank-cards-title">
            <div className="rank-panel-head">
              <h2 id="rank-cards-title" className="section-title">
                角色榜
              </h2>
              <div className="rank-by" role="group" aria-label="按什么排">
                <button type="button" className="rank-by-option" aria-pressed={cardTab === 'power'} onClick={() => setCardTab('power')}>
                  战力
                </button>
                <button type="button" className="rank-by-option" aria-pressed={cardTab === 'wins'} onClick={() => setCardTab('wins')}>
                  切磋胜场
                </button>
              </div>
            </div>
            {!cards ? <p className="muted">正在加载……</p> : <CardRankList rows={cards[cardTab]} by={cardTab} />}
          </section>
        </div>
      </div>
    </div>
  );
}

function CardRankList({ rows, by }: { rows: CardRankRow[]; by: 'power' | 'wins' }) {
  if (rows.length === 0) return <p className="empty">还没有角色上榜。</p>;
  return (
    <ol className="rank-list">
      {rows.map((r) => (
        <li key={r.cardId} className={r.me ? 'rank-row is-me' : 'rank-row'}>
          <span className="rank-no">{r.rank}</span>
          <Avatar user={r.owner} size={28} />
          <span className="rank-who">
            <span className="card-rank-name">{r.name}</span>
            <Link to={profilePath(r.owner.publicId)} className="muted">
              {r.owner.displayName}
            </Link>
          </span>
          <span className="rank-value">{by === 'power' ? `战力 ${r.power}` : `${r.wins} 胜 ${r.losses} 负`}</span>
        </li>
      ))}
    </ol>
  );
}
