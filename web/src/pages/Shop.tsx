import { useCallback, useEffect, useState } from 'react';
import { LEDGER_LABEL } from '../../../shared/pets';
import { GEAR_PART_LABEL, GEAR_PARTS, RARITY_LABEL, type GearPart } from '../../../shared/rules2';
import { EXCHANGE_ITEM, SHOP_SECTIONS, type LedgerEntry, type ShopEntry, type ShopPage, type ShopSection } from '../../../shared/shop';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { setCrystals } from '../crystals';
import { Dice } from '../components/Dice';
import { GuestNote } from '../components/GuestNote';
import { PetFigure } from '../components/PetFigure';
import { Avatar } from '../components/people';
import { formatDateTime } from '../format';
import { useLiveEvent } from '../live';
import { Link, navigate, useLocation } from '../router';
import { GearSeal } from './Bag';

// 商城（V0.7.0）：所有用龙晶买的东西都在这里，分几栏；限时活动期间多一栏「限时」。
// 顶上是自己的龙晶和「龙晶记录」。买到的东西进「我的背包」，头像框、骰子、称号、宠物装扮在「我的装扮」里戴（V0.8.1 起在头像菜单里）。
// V0.7.1：管理员上架的商品排在各自那一栏里（多了「秘籍」「宝箱」两栏）；游客也能看，「买」按钮是灰的。

type Tab = 'limited' | ShopSection;

/** 买到以后去哪里看。 */
const WEAR_SECTIONS = new Set<ShopSection>(['outfit', 'frame', 'dice', 'title']);

export function ShopPageView() {
  const { query } = useLocation();
  const [page, setPage] = useState<ShopPage | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  /** 刚买好的：买了什么、去哪里看。 */
  const [done, setDone] = useState<{ text: string; to: string; where: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const p = await api<ShopPage>('GET', '/api/shop');
      setPage(p);
      if (p.crystals !== null) setCrystals(p.crystals);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '商城 - 龙娘跑团';
    void load();
  }, [load]);

  // 龙晶在别处变了（打工回来、开宝箱……）：余额和记录跟着变
  useLiveEvent<{ crystals: number }>('crystals', (d) => {
    if (page && !page.guest && d.crystals !== page.crystals) void load();
  });

  async function buy(item: ShopEntry, count: number) {
    if (item.key === EXCHANGE_ITEM && !window.confirm(`用 ${item.price * count} 龙晶换 ${count} 元 AI 额度？`)) return;
    setBusy(true);
    setError('');
    setDone(null);
    try {
      const p = await api<ShopPage>('POST', '/api/shop/buy', { item: item.key, count });
      setPage(p);
      if (p.crystals !== null) setCrystals(p.crystals);
      const what = `${item.section === 'title' ? `称号「${item.name}」` : item.name}${count > 1 ? ` × ${count}` : ''}`;
      setDone(
        item.key === EXCHANGE_ITEM
          ? { text: `换好了 ${count} 元 AI 额度`, to: '/account', where: '看额度' }
          : WEAR_SECTIONS.has(item.section)
            ? { text: `买好了：${what}`, to: '/wardrobe', where: '去我的装扮' }
            : { text: `买好了：${what}`, to: '/bag', where: '去背包' },
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!page) {
    return error ? (
      <p className="form-error" role="alert">
        {error}
      </p>
    ) : (
      <p className="muted">正在加载……</p>
    );
  }

  const limited = page.items.filter((i) => i.limited);
  const tabs: { key: Tab; label: string }[] = [
    ...(limited.length ? [{ key: 'limited' as const, label: '限时' }] : []),
    ...SHOP_SECTIONS.filter((s) => page.items.some((i) => !i.limited && i.section === s.key)),
  ];
  const asked = query.get('t');
  const tab: Tab = tabs.find((t) => t.key === asked)?.key ?? tabs[0]?.key ?? 'supplies';
  const shown = tab === 'limited' ? limited : page.items.filter((i) => !i.limited && i.section === tab);

  return (
    <div className="shop-page">
      <div className="page-head">
        <h1>商城</h1>
        {page.crystals !== null && (
          <div className="shop-balance">
            <p className="pet-crystals" aria-label={`龙晶 ${page.crystals}`}>
              <span className="crystal-mark" aria-hidden="true" />
              {page.crystals}
              <span className="muted">龙晶</span>
            </p>
            <button type="button" className="btn btn-small btn-quiet" aria-expanded={ledgerOpen} onClick={() => setLedgerOpen((v) => !v)}>
              龙晶记录
            </button>
          </div>
        )}
      </div>
      {page.guest && <GuestNote what="买" />}
      {ledgerOpen && page.ledger && <Ledger ledger={page.ledger} />}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="shop-done" role="status">
        {done && (
          <>
            {done.text}，<Link to={done.to}>{done.where}</Link>
          </>
        )}
      </p>

      <div className="picker-tabs shop-tabs" role="tablist" aria-label="商城">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            className={t.key === 'limited' ? 'picker-tab shop-tab-limited' : 'picker-tab'}
            aria-selected={tab === t.key}
            onClick={() => navigate(`/shop?t=${t.key}`, { replace: true })}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'gear' ? (
        gearShelves(shown).map((shelf) => (
          <section key={shelf.part ?? 'rest'} className="shop-group">
            {shelf.part && <h2 className="shop-group-title">{GEAR_PART_LABEL[shelf.part]}</h2>}
            <ul className="shop-shelf">
              {shelf.items.map((item) => (
                <ShopRow key={item.key} item={item} page={page} busy={busy} onBuy={(n) => void buy(item, n)} />
              ))}
            </ul>
          </section>
        ))
      ) : (
        <ul className={shown.some(hasPreview) ? 'shop-shelf' : 'shop-shelf is-plain'}>
          {shown.map((item) => (
            <ShopRow key={item.key} item={item} page={page} busy={busy} onBuy={(n) => void buy(item, n)} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** 装备一栏按部位分组（头部、颈部……主手、副手，V0.7.1），同一部位里照原来的顺序。 */
function gearShelves(items: ShopEntry[]): { part: GearPart | null; items: ShopEntry[] }[] {
  const groups: { part: GearPart | null; items: ShopEntry[] }[] = GEAR_PARTS.map((part) => ({ part, items: items.filter((i) => i.gear?.part === part) }));
  groups.push({ part: null, items: items.filter((i) => !i.gear) });
  return groups.filter((g) => g.items.length > 0);
}

const COUNTS = [1, 2, 3, 5, 10, 20];

function ShopRow({ item, page, busy, onBuy }: { item: ShopEntry; page: ShopPage; busy: boolean; onBuy: (count: number) => void }) {
  const [count, setCount] = useState(1);
  const exchange = item.key === EXCHANGE_ITEM;
  const choices = exchange ? Array.from({ length: item.max }, (_, i) => i + 1) : COUNTS.filter((n) => n <= item.max);
  const n = Math.max(1, Math.min(count, item.max));
  const short = item.price * n > (page.crystals ?? 0);
  const effect = exchange && page.exchange ? `每人每月最多 ${page.exchange.userCap} 元，这个月换了 ${page.exchange.usedThisMonth} 元` : item.effect;
  return (
    <li className={item.max === 0 && !page.guest ? 'shop-row is-done' : 'shop-row'}>
      <span className="shop-row-art">
        <ShopPreview item={item} page={page} />
      </span>
      <span className="shop-row-main">
        <span className="shop-row-name">
          {item.section === 'title' ? `「${item.name}」` : item.name}
          {item.gear && item.gear.rarity !== 'common' && <span className={`rarity-tag rarity-${item.gear.rarity}`}>{RARITY_LABEL[item.gear.rarity]}</span>}
          {!item.once && item.owned > 0 && <span className="shop-row-have">有 {item.owned}</span>}
        </span>
        <span className="shop-row-effect">{effect}</span>
      </span>
      <span className="shop-row-price" aria-label={`${item.price} 龙晶${exchange ? '换 1 元' : ''}`}>
        <span className="crystal-mark" aria-hidden="true" />
        {item.price}
      </span>
      {page.guest ? (
        <span className="shop-row-buy">
          <button type="button" className="btn btn-small" disabled title="注册以后才能买">
            {exchange ? '换' : '买'}
          </button>
        </span>
      ) : item.max === 0 ? (
        <span className="muted shop-row-buy">{item.note}</span>
      ) : (
        <span className="shop-row-buy">
          {choices.length > 1 && (
            <select aria-label={exchange ? '换几元' : `买几个${item.name}`} value={n} onChange={(e) => setCount(Number(e.target.value))}>
              {choices.map((c) => (
                <option key={c} value={c}>
                  {exchange ? `${c} 元` : `${c} 个`}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="btn btn-small" disabled={busy || short} title={short ? '龙晶不够' : undefined} onClick={() => onBuy(n)}>
            {exchange ? '换' : '买'}
          </button>
        </span>
      )}
    </li>
  );
}

/** 商品的样子：骰子、宠物装扮（戴在自己的宠物身上）、头像框（套在自己的头像上）、装备（格子的印章）。 */
/** 有图的：骰子、宠物装扮、头像框、装备。一栏里都没有图时，不留图的那一列。 */
function hasPreview(item: ShopEntry): boolean {
  return item.section === 'dice' || item.section === 'outfit' || item.section === 'frame' || !!item.gear;
}

function ShopPreview({ item, page }: { item: ShopEntry; page: ShopPage }) {
  const { user } = useAuth();
  if (item.section === 'dice') return <Dice dice={[6, 5]} skin={item.key} />;
  if (item.section === 'outfit') return <PetFigure name={page.pet?.name ?? '宠'} image={page.pet?.image ?? null} outfit={item.key} size="small" />;
  if (item.section === 'frame' && user) return <Avatar user={{ ...user, frame: item.key }} size={36} />;
  if (item.gear) return <GearSeal slot={item.gear.slot} />;
  return null;
}

function Ledger({ ledger }: { ledger: LedgerEntry[] }) {
  return (
    <section className="shop-ledger" aria-label="龙晶记录">
      {ledger.length === 0 ? (
        <p className="muted">还没有进出。</p>
      ) : (
        <ul className="plain-list ledger">
          {ledger.map((l, i) => (
            <li key={i}>
              <span className={l.delta > 0 ? 'ledger-in' : 'ledger-out'}>{l.delta > 0 ? `+${l.delta}` : l.delta}</span> {LEDGER_LABEL[l.kind] ?? l.kind}
              {l.detail && `：${l.detail}`} <span className="muted">{formatDateTime(l.at)}，剩 {l.balance}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
