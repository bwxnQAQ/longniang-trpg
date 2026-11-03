import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api, errorMessage } from '../../api';
import { SECTION_LABEL, SHOP_PRICE_MAX } from '../../../../shared/shop';
import {
  BUNDLE_MAX,
  CUSTOM_TITLE_MAX,
  LISTING_KIND_LABEL,
  LISTING_KINDS,
  listingMinPrice,
  type AdminItemOptions,
  type AdminListing,
  type AdminShopItem,
  type AdminShopPage,
  type ListingKind,
} from '../../../../shared/shop-admin';
import { ErrorLine } from './common';

// ==================== 商城（V0.7.0；V0.7.1 加了上架、下架） ====================

/**
 * 商城：上架新商品（装备、秘籍、宝箱、道具、自己起名字的称号）；管理员上架的改价、改称号名字、下架、重新上架；
 * 自带的商品改价、恢复默认、下架、重新上架。都记进操作记录。换额度的价格就是「多少龙晶换 1 元」。
 */
export function ShopPricesTab() {
  const [page, setPage] = useState<AdminShopPage | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  /** 正在改的一行（自带的是商品编号，上架的是 listing-编号）。 */
  const [editing, setEditing] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    api<AdminShopPage>('GET', '/api/admin/shop')
      .then(setPage)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  /** 做一件事，拿回新的「商城」页。成功了返回 true。 */
  async function run(fn: () => Promise<AdminShopPage>): Promise<boolean> {
    setBusy(true);
    setError('');
    try {
      setPage(await fn());
      setEditing(null);
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const reload = () => api<AdminShopPage>('GET', '/api/admin/shop');
  const setBuiltinPrice = (key: string, value: number | null) =>
    run(async () => {
      await api('PUT', '/api/admin/shop-prices', { key, price: value });
      return reload();
    });
  const setHidden = (key: string, hidden: boolean) => run(() => api<AdminShopPage>('PUT', '/api/admin/shop/hidden', { key, hidden }));
  const changeListing = (id: number, body: { price?: number; name?: string; listed?: boolean }) =>
    run(() => api<AdminShopPage>('PUT', `/api/admin/shop/listings/${id}`, body));

  function edit(key: string, currentPrice: number, currentName = '') {
    setPrice(String(currentPrice));
    setName(currentName);
    setEditing(key);
  }

  if (!page) return <ErrorLine error={error} />;
  const priceOk = Number.isInteger(Number(price)) && Number(price) >= 1 && Number(price) <= SHOP_PRICE_MAX;

  const priceInput = (label: string, onSave: () => void) => (
    <input
      className="shop-price-input"
      aria-label={`${label}的新价格`}
      type="number"
      min="1"
      max={SHOP_PRICE_MAX}
      step="1"
      inputMode="numeric"
      value={price}
      onChange={(e) => setPrice(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && priceOk) onSave();
        if (e.key === 'Escape') setEditing(null);
      }}
      autoFocus
    />
  );

  const saveCancel = (onSave: () => void, ok: boolean) => (
    <>
      <button type="button" className="btn btn-small btn-primary" disabled={busy || !ok} onClick={onSave}>
        保存
      </button>
      <button type="button" className="btn btn-small btn-quiet" onClick={() => setEditing(null)}>
        取消
      </button>
    </>
  );

  return (
    <div className="shop-prices-tab">
      <NewListing options={page.options} busy={busy} onCreate={(body) => run(() => api<AdminShopPage>('POST', '/api/admin/shop/listings', body))} />
      <ErrorLine error={error} />

      {page.listings.length > 0 && (
        <>
          <h2 className="section-title">新上架的</h2>
          <div className="table-wrap">
            <table className="table shop-prices">
              <thead>
                <tr>
                  <th scope="col">商品</th>
                  <th scope="col">分类</th>
                  <th scope="col" className="num">
                    价格
                  </th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {page.listings.map((l) => (
                  <ListingRow
                    key={l.id}
                    listing={l}
                    editing={editing === l.key}
                    busy={busy}
                    nameValue={name}
                    onName={setName}
                    priceInput={priceInput}
                    saveCancel={saveCancel}
                    priceOk={priceOk}
                    onEdit={() => edit(l.key, l.price, l.kind === 'title' ? l.name : '')}
                    onSave={() => void changeListing(l.id, { price: Number(price), ...(l.kind === 'title' ? { name } : {}) })}
                    onListed={(listed) => void changeListing(l.id, { listed })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="section-title">自带的</h2>
      <div className="table-wrap">
        <table className="table shop-prices">
          <thead>
            <tr>
              <th scope="col">商品</th>
              <th scope="col">分类</th>
              <th scope="col" className="num">
                默认价
              </th>
              <th scope="col" className="num">
                现价
              </th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {page.items.map((i: AdminShopItem) => {
              const changed = i.price !== i.basePrice;
              const save = () => void setBuiltinPrice(i.key, Number(price));
              return (
                <tr key={i.key} className={[changed ? 'is-changed' : '', i.hidden ? 'is-hidden' : ''].filter(Boolean).join(' ') || undefined}>
                  <td>
                    {i.section === 'title' ? `「${i.name}」` : i.name}
                    {i.limited && <span className="tag">限时</span>}
                    {i.hidden && <span className="tag tag-warn">已下架</span>}
                  </td>
                  <td className="muted">{SECTION_LABEL[i.section]}</td>
                  <td className="num">{i.basePrice}</td>
                  <td className="num">{editing === i.key ? priceInput(i.name, save) : <strong>{i.price}</strong>}</td>
                  <td className="shop-price-actions">
                    {editing === i.key ? (
                      saveCancel(save, priceOk)
                    ) : (
                      <>
                        <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => edit(i.key, i.price)}>
                          改价
                        </button>
                        {changed && (
                          <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void setBuiltinPrice(i.key, null)}>
                            恢复默认
                          </button>
                        )}
                        <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void setHidden(i.key, !i.hidden)}>
                          {i.hidden ? '上架' : '下架'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 管理员上架的一行：改价（称号还能改名字）、下架、重新上架。 */
function ListingRow({
  listing: l,
  editing,
  busy,
  nameValue,
  onName,
  priceInput,
  saveCancel,
  priceOk,
  onEdit,
  onSave,
  onListed,
}: {
  listing: AdminListing;
  editing: boolean;
  busy: boolean;
  nameValue: string;
  onName: (v: string) => void;
  priceInput: (label: string, onSave: () => void) => ReactNode;
  saveCancel: (onSave: () => void, ok: boolean) => ReactNode;
  priceOk: boolean;
  onEdit: () => void;
  onSave: () => void;
  onListed: (listed: boolean) => void;
}) {
  const title = l.kind === 'title';
  const nameOk = !title || (nameValue.trim().length > 0 && [...nameValue.trim()].length <= CUSTOM_TITLE_MAX);
  return (
    <tr className={l.listed ? undefined : 'is-hidden'}>
      <td>
        {editing && title ? (
          <input className="shop-title-input" aria-label="称号" maxLength={CUSTOM_TITLE_MAX} value={nameValue} onChange={(e) => onName(e.target.value)} />
        ) : title ? (
          `「${l.name}」`
        ) : (
          l.name
        )}
        {!l.listed && <span className="tag tag-warn">已下架</span>}
        {!l.known && <span className="tag">认不出来</span>}
      </td>
      <td className="muted">{SECTION_LABEL[l.section]}</td>
      <td className="num">{editing ? priceInput(l.name, () => nameOk && onSave()) : <strong>{l.price}</strong>}</td>
      <td className="shop-price-actions">
        {editing ? (
          saveCancel(onSave, priceOk && nameOk)
        ) : (
          <>
            <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={onEdit}>
              {title ? '修改' : '改价'}
            </button>
            <button type="button" className="btn btn-small btn-quiet" disabled={busy || (!l.listed && !l.known)} onClick={() => onListed(!l.listed)}>
              {l.listed ? '下架' : '上架'}
            </button>
          </>
        )}
      </td>
    </tr>
  );
}

/** 上架新商品：种类、是什么（装备选种类和稀有度，道具、宝箱能几个一份，称号自己起名字）、价格。 */
function NewListing({
  options,
  busy,
  onCreate,
}: {
  options: AdminItemOptions;
  busy: boolean;
  onCreate: (body: { kind: ListingKind; ref: string; name?: string; count?: number; price: number }) => Promise<boolean>;
}) {
  const [kind, setKind] = useState<ListingKind>('gear');
  const [base, setBase] = useState(options.gear[0]?.key ?? '');
  const [rarity, setRarity] = useState(options.rarities[1]?.key ?? options.rarities[0]?.key ?? '');
  const [manual, setManual] = useState(options.manuals[0]?.key ?? '');
  const [item, setItem] = useState(options.consumables[0]?.key ?? options.supplies[0]?.key ?? '');
  const [count, setCount] = useState('1');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');

  const bundle = kind === 'item' || kind === 'chest';
  const n = Number(count);
  const p = Number(price);
  const ready =
    Number.isInteger(p) &&
    p >= 1 &&
    p <= SHOP_PRICE_MAX &&
    (!bundle || (Number.isInteger(n) && n >= 1 && n <= BUNDLE_MAX)) &&
    (kind !== 'title' || (title.trim().length > 0 && [...title.trim()].length <= CUSTOM_TITLE_MAX));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready || busy) return;
    const ref = kind === 'gear' ? `${base}:${rarity}` : kind === 'manual' ? manual.replace(/^manual:/, '') : kind === 'item' ? item : '';
    const ok = await onCreate({ kind, ref, price: p, ...(bundle ? { count: n } : {}), ...(kind === 'title' ? { name: title.trim() } : {}) });
    if (ok) {
      setTitle('');
      setPrice('');
    }
  }

  return (
    <form className="inline-form shop-new" onSubmit={submit} aria-label="上架新商品">
      <div className="field">
        <label htmlFor="listing-kind">上架</label>
        <select id="listing-kind" value={kind} onChange={(e) => setKind(e.target.value as ListingKind)}>
          {LISTING_KINDS.map((k) => (
            <option key={k} value={k}>
              {LISTING_KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </div>
      {kind === 'gear' && (
        <>
          <div className="field">
            <label htmlFor="listing-base">装备</label>
            <select id="listing-base" value={base} onChange={(e) => setBase(e.target.value)}>
              {options.gear.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="listing-rarity">稀有度</label>
            <select id="listing-rarity" value={rarity} onChange={(e) => setRarity(e.target.value)}>
              {options.rarities.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      {kind === 'manual' && (
        <div className="field">
          <label htmlFor="listing-manual">秘籍</label>
          <select id="listing-manual" value={manual} onChange={(e) => setManual(e.target.value)}>
            {options.manuals.map((m) => (
              <option key={m.key} value={m.key}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {kind === 'item' && (
        <div className="field">
          <label htmlFor="listing-item">道具</label>
          <select id="listing-item" value={item} onChange={(e) => setItem(e.target.value)}>
            <optgroup label="地下城道具">
              {options.consumables.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="吃的用的">
              {options.supplies.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      )}
      {kind === 'title' && (
        <div className="field">
          <label htmlFor="listing-title">称号</label>
          <input id="listing-title" maxLength={CUSTOM_TITLE_MAX} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      )}
      {bundle && (
        <div className="field field-narrow">
          <label htmlFor="listing-count">一份几个</label>
          <input id="listing-count" type="number" min="1" max={BUNDLE_MAX} step="1" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
      )}
      <div className="field field-narrow">
        <label htmlFor="listing-price">价格</label>
        <input
          id="listing-price"
          type="number"
          min={listingMinPrice(kind, kind === 'gear' ? `${base}:${rarity}` : '', bundle && Number.isInteger(n) && n >= 1 ? n : 1)}
          max={SHOP_PRICE_MAX}
          step="1"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <button className="btn btn-primary btn-small" disabled={busy || !ready}>
        上架
      </button>
    </form>
  );
}
