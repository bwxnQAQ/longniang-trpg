import { useEffect, useState } from 'react';
import { ACHIEVEMENTS, HIDDEN_ACHIEVEMENT_COUNT, type CollectionBook } from '../../../shared/achievements';
import { PET_SHOP } from '../../../shared/pets';
import { FAR, NEAR } from '../../../shared/postcards';
import { api, errorMessage, type PetPage } from '../api';
import { useAuth } from '../auth';
import { Dice } from '../components/Dice';
import { GuestNote } from '../components/GuestNote';
import { PetFigure } from '../components/PetFigure';
import { formatDate } from '../format';
import { Link, navigate, useLocation } from '../router';

// 图鉴（V0.6.0）：结局（剧本大厅里的每个剧本）、明信片（宠物去过的地方）、装扮、骰子皮肤、成就。
// 还没拿到的显示「？？？」；隐藏成就没达成的连名字都不显示。V0.7.1：游客也能打开看看（全是「？？？」）。

type Tab = 'endings' | 'places' | 'outfits' | 'dice' | 'achievements';
const TABS: { key: Tab; label: string }[] = [
  { key: 'endings', label: '结局' },
  { key: 'places', label: '明信片' },
  { key: 'outfits', label: '装扮' },
  { key: 'dice', label: '骰子' },
  { key: 'achievements', label: '成就' },
];
const isTab = (v: string | null): v is Tab => TABS.some((t) => t.key === v);

const OUTFITS = PET_SHOP.filter((i) => i.kind === 'outfit');
const DICE = PET_SHOP.filter((i) => i.kind === 'dice');

export function CollectionPage() {
  const guest = !!useAuth().user?.isGuest;
  const { query } = useLocation();
  const fromQuery = query.get('t');
  const tab: Tab = isTab(fromQuery) ? fromQuery : 'endings';
  const [book, setBook] = useState<CollectionBook | null>(null);
  /** 宠物（装扮的预览画在它身上）。 */
  const [pet, setPet] = useState<PetPage['pet']>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = '图鉴 - 龙娘跑团';
    api<CollectionBook>('GET', '/api/collection')
      .then(setBook)
      .catch((err) => setError(errorMessage(err)));
    api<PetPage>('GET', '/api/pet')
      .then((p) => setPet(p.pet))
      .catch(() => setPet(null));
  }, []);

  if (error) {
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  }
  if (!book) return <p className="muted">正在加载……</p>;

  const endingsTotal = book.endings.reduce((n, s) => n + s.total, 0);
  const endingsGot = book.endings.reduce((n, s) => n + s.reached.length, 0);
  const visited = new Set(book.places);
  const earned = new Map(book.achievements.map((a) => [a.key, a]));
  const hiddenEarned = book.achievements.filter((a) => a.hidden);
  const events = book.achievements.filter((a) => a.key.startsWith('event-'));
  const counts: Record<Tab, [number, number]> = {
    endings: [endingsGot, endingsTotal],
    places: [NEAR.concat(FAR).filter((p) => visited.has(p.place)).length, NEAR.length + FAR.length],
    outfits: [book.outfits.length, OUTFITS.length],
    dice: [book.dice.length, DICE.length],
    achievements: [ACHIEVEMENTS.filter((a) => earned.has(a.key)).length + hiddenEarned.length, ACHIEVEMENTS.length + HIDDEN_ACHIEVEMENT_COUNT],
  };
  const got = Object.values(counts).reduce((n, [a]) => n + a, 0);
  const all = Object.values(counts).reduce((n, [, b]) => n + b, 0);
  const petName = pet?.name ?? '宠物';

  return (
    <div className="collection-page">
      <div className="page-head">
        <h1>图鉴</h1>
        <p className="collection-progress">
          <span className="collection-progress-bar" aria-hidden="true">
            <span style={{ width: `${all ? Math.round((got / all) * 100) : 0}%` }} />
          </span>
          {got}/{all}
        </p>
      </div>
      {guest && <GuestNote what="收集" />}

      <div className="picker-tabs collection-tabs" role="tablist" aria-label="图鉴">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            className="picker-tab"
            aria-selected={tab === t.key}
            onClick={() => navigate(t.key === 'endings' ? '/collection' : `/collection?t=${t.key}`, { replace: true })}
          >
            {t.label}
            <span className="tab-count">
              {counts[t.key][0]}/{counts[t.key][1]}
            </span>
          </button>
        ))}
      </div>

      {tab === 'endings' &&
        (book.endings.length === 0 ? (
          <p className="empty">剧本大厅里还没有剧本。</p>
        ) : (
          <ul className="book-endings">
            {book.endings.map((s) => (
              <li key={s.key} className={s.total > 0 && s.reached.length === s.total ? 'book-scenario is-complete' : 'book-scenario'}>
                <h2 className="book-scenario-title">
                  《{s.title}》
                  <span className="muted">
                    {s.reached.length}/{s.total}
                  </span>
                </h2>
                <ul className="book-cells">
                  {s.reached.map((e) => (
                    <li key={e.key} className="book-cell is-got">
                      {e.title}
                    </li>
                  ))}
                  {Array.from({ length: Math.max(0, s.total - s.reached.length) }, (_, i) => (
                    <li key={`unknown-${i}`} className="book-cell is-unknown">
                      ？？？
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ))}

      {tab === 'places' && (
        <div className="book-places">
          {[
            { label: '附近', places: NEAR },
            { label: '远方', places: FAR },
          ].map((g) => (
            <section key={g.label} aria-label={g.label}>
              <h2 className="pet-subhead">{g.label}</h2>
              <ul className="book-cells">
                {g.places.map((p) =>
                  visited.has(p.place) ? (
                    <li key={p.place} className="book-cell is-got book-postcard">
                      {p.place}
                    </li>
                  ) : (
                    <li key={p.place} className="book-cell is-unknown">
                      ？？？
                    </li>
                  ),
                )}
              </ul>
            </section>
          ))}
          {!pet && (
            <p className="muted">
              <Link to="/pet">养一只宠物</Link>，让它出门远行。
            </p>
          )}
        </div>
      )}

      {tab === 'outfits' && (
        <ul className="book-items">
          {OUTFITS.map((o) =>
            book.outfits.includes(o.key) ? (
              <li key={o.key} className="book-item is-got">
                <PetFigure name={petName} image={pet?.image ?? null} outfit={o.key} size="medium" />
                <span className="book-item-name">{o.name}</span>
              </li>
            ) : (
              <li key={o.key} className="book-item is-unknown">
                <span className="book-item-blank" aria-hidden="true" />
                <span className="book-item-name">？？？</span>
              </li>
            ),
          )}
        </ul>
      )}

      {tab === 'dice' && (
        <ul className="book-items">
          {DICE.map((d) =>
            book.dice.includes(d.key) ? (
              <li key={d.key} className="book-item is-got">
                <Dice dice={[6, 6]} skin={d.key} />
                <span className="book-item-name">{d.name}</span>
              </li>
            ) : (
              <li key={d.key} className="book-item is-unknown">
                <span className="book-item-blank book-item-blank-dice" aria-hidden="true" />
                <span className="book-item-name">？？？</span>
              </li>
            ),
          )}
        </ul>
      )}

      {tab === 'achievements' && (
        <ul className="achievement-grid">
          {ACHIEVEMENTS.map((a) => {
            const e = earned.get(a.key);
            return (
              <li key={a.key} className={e ? 'achievement is-earned' : 'achievement'}>
                <span className="achievement-title">{a.title}</span>
                <span className="achievement-how">{a.how}</span>
                {e && <span className="achievement-at">{formatDate(e.at)}</span>}
              </li>
            );
          })}
          {[...hiddenEarned, ...events].map((a) => (
            <li key={a.key} className={a.hidden ? 'achievement is-earned is-hidden' : 'achievement is-earned is-event'}>
              <span className="achievement-title">{a.title}</span>
              <span className="achievement-how">{a.how}</span>
              <span className="achievement-at">{formatDate(a.at)}</span>
            </li>
          ))}
          {Array.from({ length: Math.max(0, HIDDEN_ACHIEVEMENT_COUNT - hiddenEarned.length) }, (_, i) => (
            <li key={`secret-${i}`} className="achievement is-secret" aria-label="隐藏成就">
              <span className="achievement-title">？？？</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
