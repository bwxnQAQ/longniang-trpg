import { useState } from 'react';
import { api, errorMessage, type GameState, type NearbyCharacter } from '../api';
import { sameSpot, spotName, viewFlagText } from '../../../shared/spots';

// 故事下面、输入框上面的“在场的人”：和你在同一个地点的角色，他们交了还没出结果的行动，可以点「协助」。
// 站位（V1.0.x）：有人站在特别的地方时，写出你站在哪、每个人在不在你身边（身边的人排在前面）。

export function Nearby({ roomId, game, onChanged }: { roomId: number; game: GameState; onChanged: () => void }) {
  const [open, setOpen] = useState(true);
  const me = game.me;
  if (!me || me.dead || !me.location) return null;
  const busyCount = game.nearby.filter((n) => n.action).length;
  // 和你在一起的 AI 队友（V1.1.0）：对白它们也听得到
  const ai = game.nearbyCompanions ?? [];
  const names = [...game.nearby.map((n) => n.name), ...ai.map((c) => c.name)];
  const spotted = !!me.spot || game.nearby.some((n) => n.spot);
  const rows = spotted
    ? [...game.nearby.filter((n) => sameSpot(n.spot, me.spot)), ...game.nearby.filter((n) => !sameSpot(n.spot, me.spot))]
    : game.nearby;
  const flags = viewFlagText(me.location, me.spot);
  return (
    <section className="nearby" aria-labelledby="nearby-title">
      <button type="button" className="nearby-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span id="nearby-title">
          在{me.location.name}的人
          <span className="muted">
            {names.length ? `：${names.join('、')}` : '：只有你'}
            {busyCount > 0 && `，${busyCount} 个在等结果`}
          </span>
        </span>
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="nearby-chevron">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && spotted && (
        <p className="nearby-spot">
          你站在{spotName(me.spot)}
          {flags && <span className="chip">{flags}</span>}
        </p>
      )}
      {open && names.length > 0 && (
        <ul className="nearby-list">
          {rows.map((n) => (
            <NearbyRow
              key={n.id}
              roomId={roomId}
              person={n}
              pet={game.others.find((o) => o.id === n.id)?.petName ?? null}
              where={spotted ? (sameSpot(n.spot, me.spot) ? '在你身边' : `站在${spotName(n.spot)}`) : null}
              onChanged={onChanged}
            />
          ))}
          {ai.map((c) => (
            <li key={`ai-${c.roleKey}`} className="nearby-row nearby-ai">
              <p className="nearby-who">
                <strong>{c.name}</strong>
                <span className="muted">{c.roleName}</span>
              </p>
              <p className="nearby-action">{c.persona ? <span className="tag persona-tag">AI 角色</span> : <span className="tag ai-tag">AI</span>}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NearbyRow({
  roomId,
  person,
  pet,
  where,
  onChanged,
}: {
  roomId: number;
  person: NearbyCharacter;
  pet: string | null;
  /** 站位：「在你身边」「站在窗边」；没人站在特别的地方时是 null。 */
  where: string | null;
  onChanged: () => void;
}) {
  const [assisting, setAssisting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const a = person.action;

  async function assist() {
    if (!a) return;
    setBusy(true);
    setError('');
    try {
      await api('POST', `/api/rooms/${roomId}/actions/${a.id}/assist`, { note });
      setAssisting(false);
      setNote('');
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="nearby-row">
      <p className="nearby-who">
        <strong>{person.name}</strong>
        <span className="muted">{person.roleName}</span>
        {pet && <span className="muted">带着宠物「{pet}」</span>}
        {where && <span className={where === '在你身边' ? 'nearby-where is-beside' : 'nearby-where'}>{where}</span>}
      </p>
      {a ? (
        <div className="nearby-action">
          <p>
            {a.assisting ? `在协助${a.assisting}` : a.content === null ? '悄悄做了些什么' : a.content}
            <span className="muted">{a.status === 'resolving' ? '（主持人正在结算）' : '（在等结果）'}</span>
          </p>
          {a.assistedBy.length > 0 && <p className="hint">{a.assistedBy.join('、')}在协助</p>}
          {a.canAssist &&
            (assisting ? (
              <div className="assist-form">
                <label htmlFor={`assist-${a.id}`} className="visually-hidden">
                  怎么帮他（选填）
                </label>
                <input id={`assist-${a.id}`} maxLength={100} value={note} placeholder="怎么帮他（选填）" onChange={(e) => setNote(e.target.value)} autoFocus />
                <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void assist()}>
                  {busy ? '正在提交……' : '协助'}
                </button>
                <button type="button" className="btn btn-small btn-quiet" onClick={() => setAssisting(false)}>
                  取消
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-small" onClick={() => setAssisting(true)}>
                协助
              </button>
            ))}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <p className="muted nearby-action">没有在等结果的行动</p>
      )}
    </li>
  );
}
