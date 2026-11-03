import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { TitleOption } from '../../../shared/achievements';
import { shopItemOf } from '../../../shared/pets';
import type { WardrobePage } from '../../../shared/shop';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Dice } from '../components/Dice';
import { GuestNote } from '../components/GuestNote';
import { PetFigure } from '../components/PetFigure';
import { Avatar } from '../components/people';
import { Link } from '../router';

// 装扮（V0.7.0）：头像框、骰子、称号、宠物装扮，有的都在这里戴上、摘下。称号只属于账号（个人主页、名字旁边显示）。
// 没有的去商城买。V0.7.1：游客也能打开看看（什么都没有，只有普通骰子）。

const nameOf = (key: string) => shopItemOf(key)?.name ?? key;

export function WardrobePageView() {
  const { user, reload } = useAuth();
  const [page, setPage] = useState<WardrobePage | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setPage(await api<WardrobePage>('GET', '/api/wardrobe'));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '我的装扮 - 龙娘跑团';
    void load();
  }, [load]);

  /** 换一样：接口返回新的「装扮」页的直接用，别的再拉一次。 */
  async function change(method: 'PUT', path: string, body: unknown, after?: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      const r = await api<WardrobePage | unknown>(method, path, body);
      if (r && typeof r === 'object' && 'frames' in r) setPage(r as WardrobePage);
      else await load();
      await after?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!page || !user) {
    return error ? (
      <p className="form-error" role="alert">
        {error}
      </p>
    ) : (
      <p className="muted">正在加载……</p>
    );
  }

  return (
    <div className="wardrobe-page">
      <div className="page-head">
        <h1>我的装扮</h1>
      </div>
      {user.isGuest && <GuestNote what="装扮" />}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <WardrobeSection title="头像框" shop="frame">
        {page.frames.length === 0 ? (
          <p className="muted">还没有头像框。</p>
        ) : (
          <ul className="wardrobe">
            {page.frames.map((k) => (
              <Choice
                key={k}
                on={page.frame === k}
                busy={busy}
                label={nameOf(k)}
                onWear={() => void change('PUT', '/api/me/frame', { frame: k }, reload)}
                onTakeOff={() => void change('PUT', '/api/me/frame', { frame: null }, reload)}
              >
                <Avatar user={{ ...user, frame: k }} size={48} />
              </Choice>
            ))}
          </ul>
        )}
      </WardrobeSection>

      <WardrobeSection title="骰子" shop="dice">
        <ul className="wardrobe">
          {[null, ...page.dice].map((k) => (
            <Choice key={k ?? 'plain'} on={page.diceSkin === k} busy={busy} label={k ? nameOf(k) : '普通骰子'} onWear={() => void change('PUT', '/api/pet/dice', { dice: k })}>
              <Dice dice={[6, 5]} skin={k} />
            </Choice>
          ))}
        </ul>
      </WardrobeSection>

      <WardrobeSection title="称号" shop="title">
        {page.titles.length === 0 ? (
          <p className="muted">还没有称号。</p>
        ) : (
          <ul className="wardrobe">
            {page.titles.map((t: TitleOption) => (
              <Choice
                key={t.key}
                on={page.title === t.key}
                busy={busy}
                label={t.source === 'shop' ? '商城' : '成就'}
                onWear={() => void change('PUT', '/api/me/title', { title: t.key })}
                onTakeOff={() => void change('PUT', '/api/me/title', { title: null })}
              >
                <span className="title-badge">{t.name}</span>
              </Choice>
            ))}
          </ul>
        )}
      </WardrobeSection>

      <WardrobeSection title="宠物装扮" shop="outfit">
        {!page.pet ? (
          <p className="muted">
            还没有宠物，<Link to="/pet">去养一只</Link>。
          </p>
        ) : page.outfits.length === 0 ? (
          <p className="muted">还没有宠物装扮。</p>
        ) : (
          <ul className="wardrobe">
            {page.outfits.map((k) => (
              <Choice
                key={k}
                on={page.outfit === k}
                busy={busy}
                label={nameOf(k)}
                onWear={() => void change('PUT', '/api/pet/outfit', { outfit: k })}
                onTakeOff={() => void change('PUT', '/api/pet/outfit', { outfit: null })}
              >
                <PetFigure name={page.pet!.name} image={page.pet!.image} outfit={k} size="small" />
              </Choice>
            ))}
          </ul>
        )}
      </WardrobeSection>
    </div>
  );
}

function WardrobeSection({ title, shop, children }: { title: string; shop: string; children: ReactNode }) {
  return (
    <section className="wardrobe-section" aria-label={title}>
      <h2 className="bag-title">
        {title}
        <Link to={`/shop?t=${shop}`} className="wardrobe-shop">
          去商城
        </Link>
      </h2>
      {children}
    </section>
  );
}

/** 一样能戴的东西：样子、名字；戴着的标出来，能摘下（「不戴」「普通骰子」那一项没有摘下）。 */
function Choice({
  on,
  busy,
  label,
  onWear,
  onTakeOff,
  children,
}: {
  on: boolean;
  busy: boolean;
  label: string;
  onWear: () => void;
  onTakeOff?: () => void;
  children: ReactNode;
}) {
  return (
    <li className={on ? 'wardrobe-item is-on' : 'wardrobe-item'}>
      {children}
      <span className="wardrobe-name">{label}</span>
      {on ? (
        onTakeOff ? (
          <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={onTakeOff}>
            摘下
          </button>
        ) : (
          <span className="muted wardrobe-state">在用</span>
        )
      ) : (
        <button type="button" className="btn btn-small" disabled={busy} onClick={onWear}>
          {onTakeOff ? '戴上' : '用这个'}
        </button>
      )}
    </li>
  );
}
