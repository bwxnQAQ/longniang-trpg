import { useCallback, useEffect, useState } from 'react';
import type { ChestResult } from '../../../shared/cards';
import { gearEffectText, gearLabel, type GearView } from '../../../shared/gear2';
import { PET_NAME_MAX } from '../../../shared/pets';
import { GEAR_PART_LABEL, GEAR_PARTS, RARITY_KEYS, RARITY_LABEL } from '../../../shared/rules2';
import { type BagPage, type BagSupply } from '../../../shared/shop';
import { api, errorMessage } from '../api';
import { useLiveEvent } from '../live';
import { Link } from '../router';

// 我的背包（V0.7.0）：账号有的东西。吃的用的在这里用（喂宠物、给宠物喝、改名卡给宠物改名字）；
// 地下城道具、宝箱、装备、秘籍（研读在「我的角色」里）。买东西在商城，戴的东西在「我的装扮」。

/** 这几种通知来了，背包里的东西可能变了。 */
const REFRESH_ON = new Set(['pet_trip_done', 'chest', 'legendary', 'card_growth']);

export function BagPageView() {
  const [bag, setBag] = useState<BagPage | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [chest, setChest] = useState<ChestResult | null>(null);

  const load = useCallback(async () => {
    try {
      setBag(await api<BagPage>('GET', '/api/bag'));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '我的背包 - 龙娘跑团';
    void load();
  }, [load]);

  useLiveEvent<{ kind: string }>('notification', (n) => {
    if (REFRESH_ON.has(n.kind)) void load();
  });

  /** 做一件事：成功以后说一句、重新拉背包。 */
  async function act(run: () => Promise<string>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      setMessage(await run());
      await load();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const use = (item: BagSupply) =>
    act(async () => {
      await api('POST', '/api/pet/use', { item: item.key });
      return item.kind === 'food' ? `${bag?.pet?.name ?? '宠物'}吃了${item.name}` : `${bag?.pet?.name ?? '宠物'}喝了${item.name}`;
    });

  const rename = (name: string) =>
    act(async () => {
      await api('PUT', '/api/pet', { name });
      return `宠物改名叫「${name.trim()}」了`;
    });

  const openChest = () =>
    act(async () => {
      setChest(null);
      const r = await api<{ result: ChestResult; chests: number }>('POST', '/api/chests/open');
      setChest(r.result);
      return '';
    });

  if (!bag) {
    return error ? (
      <p className="form-error" role="alert">
        {error}
      </p>
    ) : (
      <p className="muted">正在加载……</p>
    );
  }

  const empty = !bag.supplies.length && !bag.consumables.length && !bag.manuals.length && !bag.chests && !bag.gear.length;

  return (
    <div className="bag-page">
      <div className="page-head">
        <h1>我的背包</h1>
        <Link to="/shop" className="btn btn-small btn-quiet">
          去商城
        </Link>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="bag-done" role="status">
          {message}
        </p>
      )}
      {chest && <ChestOpened result={chest} />}

      {empty && <p className="empty">背包是空的。</p>}

      {bag.supplies.length > 0 && (
        <section className="bag-section" aria-labelledby="bag-supplies">
          <h2 id="bag-supplies" className="bag-title">
            吃的用的
            {bag.pet && (
              <span className="bag-pet">
                {bag.pet.name}：饱食度 {bag.pet.satiety}，精力 {bag.pet.energy}
              </span>
            )}
          </h2>
          <ul className="bag-rows">
            {bag.supplies.map((s) => (
              <SupplyRow key={s.key} item={s} pet={bag.pet} busy={busy} onUse={() => void use(s)} onRename={rename} />
            ))}
          </ul>
        </section>
      )}

      {bag.consumables.length > 0 && (
        <section className="bag-section" aria-labelledby="bag-dungeon">
          <h2 id="bag-dungeon" className="bag-title">
            地下城道具
          </h2>
          <ul className="bag-rows">
            {bag.consumables.map((c) => (
              <li key={c.key} className="bag-row">
                <span className="bag-row-name">
                  {c.name}
                  <span className="bag-row-count">× {c.count}</span>
                </span>
                <span className="bag-row-effect">{c.effect}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {bag.manuals.length > 0 && (
        <section className="bag-section" aria-labelledby="bag-manuals">
          <h2 id="bag-manuals" className="bag-title">
            秘籍
          </h2>
          <ul className="bag-rows">
            {bag.manuals.map((m) => (
              <li key={m.key} className="bag-row">
                <span className="bag-row-name">
                  {m.name}
                  {m.count > 1 && <span className="bag-row-count">× {m.count}</span>}
                </span>
                <span className="bag-row-effect">{m.text}</span>
                <span className="bag-row-act">
                  <Link to={`/characters?learn=${encodeURIComponent(m.key)}`} className="btn btn-small">
                    去研读
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {bag.chests > 0 && (
        <section className="bag-section" aria-labelledby="bag-chests">
          <h2 id="bag-chests" className="bag-title">
            宝箱
          </h2>
          <ul className="bag-rows">
            <li className="bag-row">
              <span className="bag-row-name">
                <span className="chest-mark" aria-hidden="true" />
                宝箱
                <span className="bag-row-count">× {bag.chests}</span>
              </span>
              <span className="bag-row-effect" />
              <span className="bag-row-act">
                <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void openChest()}>
                  开宝箱
                </button>
              </span>
            </li>
          </ul>
        </section>
      )}

      {bag.gear.length > 0 && (
        <section className="bag-section" aria-labelledby="bag-gear">
          <h2 id="bag-gear" className="bag-title">
            装备
          </h2>
          {GEAR_PARTS.map((part) => {
            const list = bag.gear.filter((g) => g.part === part).sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || a.id - b.id);
            return (
              list.length > 0 && (
                <div key={part} className="bag-group">
                  <h3 className="bag-subtitle">{GEAR_PART_LABEL[part]}</h3>
                  <ul className="bag-rows">
                    {list.map((g) => (
                      <GearRow key={g.id} gear={g} />
                    ))}
                  </ul>
                </div>
              )
            );
          })}
        </section>
      )}
    </div>
  );
}

function SupplyRow({
  item,
  pet,
  busy,
  onUse,
  onRename,
}: {
  item: BagSupply;
  pet: BagPage['pet'];
  busy: boolean;
  onUse: () => void;
  onRename: (name: string) => Promise<boolean>;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(pet?.name ?? '');
  const label = item.kind === 'food' ? '喂宠物' : item.kind === 'tea' ? '给宠物喝' : '使用';
  return (
    <li className="bag-row">
      <span className="bag-row-name">
        {item.name}
        <span className="bag-row-count">× {item.count}</span>
      </span>
      <span className="bag-row-effect">{item.effect}</span>
      <span className="bag-row-act">
        {!pet ? (
          <Link to="/pet" className="btn btn-small btn-quiet">
            先养一只宠物
          </Link>
        ) : item.kind === 'rename' ? (
          !renaming && (
            <button
              type="button"
              className="btn btn-small"
              disabled={busy}
              onClick={() => {
                setName(pet.name);
                setRenaming(true);
              }}
            >
              {label}
            </button>
          )
        ) : (
          <button type="button" className="btn btn-small" disabled={busy} onClick={onUse}>
            {label}
          </button>
        )}
      </span>
      {renaming && pet && (
        <form
          className="inline-form bag-rename"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() === pet.name) {
              setRenaming(false);
              return;
            }
            void onRename(name).then((ok) => ok && setRenaming(false));
          }}
        >
          <input aria-label={`给${pet.name}起个新名字`} maxLength={PET_NAME_MAX} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <button className="btn btn-small btn-primary" disabled={busy || !name.trim()}>
            改名
          </button>
          <button type="button" className="btn btn-small btn-quiet" onClick={() => setRenaming(false)}>
            取消
          </button>
        </form>
      )}
    </li>
  );
}

/** 稀有度的先后（背包里高的排前面）。 */
const RARITY_RANK = Object.fromEntries(RARITY_KEYS.map((r, i) => [r, i])) as Record<GearView['rarity'], number>;

function GearRow({ gear: g }: { gear: GearView }) {
  return (
    <li className="bag-row">
      <span className="bag-row-name">
        <GearSeal slot={g.slot} />
        {g.name}
        <span className={`rarity-tag rarity-${g.rarity}`}>{RARITY_LABEL[g.rarity]}</span>
      </span>
      <span className="bag-row-effect">
        {gearEffectText(g)}，{g.use}
        {g.ability && <span className="bag-row-ability">{g.ability}</span>}
      </span>
    </li>
  );
}

/** 装备大类的小印章：武（主手武器）、甲（护甲、盾牌）、饰（加检定的）。商城里也用。 */
export function GearSeal({ slot }: { slot: GearView['slot'] }) {
  return (
    <span className={`gear-seal gear-seal-${slot}`} aria-hidden="true">
      {slot === 'weapon' ? '武' : slot === 'armor' ? '甲' : '饰'}
    </span>
  );
}

/** 刚开的宝箱开出了什么。 */
function ChestOpened({ result }: { result: ChestResult }) {
  const parts = [`${result.crystals} 龙晶`];
  if (result.item) parts.push(`${result.item.name} × ${result.item.count}`);
  if (result.gear) {
    parts.push(result.gear.duplicate !== null ? `${gearLabel(result.gear)}（已经有了，折成 ${result.gear.duplicate} 龙晶）` : gearLabel(result.gear));
  }
  return (
    <p className="chest-opened" role="status">
      <span className="chest-mark" aria-hidden="true" />
      开出了：{parts.join('、')}
    </p>
  );
}
