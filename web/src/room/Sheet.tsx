import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, errorMessage, type ClueCard, type GameState, type OtherCharacter } from '../api';
import { formatGameTime } from '../../../shared/game';
import { SPOT_FLAG_LABEL } from '../../../shared/spots';
import { ATTRIBUTES, STRESS_LABEL, TRACK_MAX, WOUND_LABEL } from '../../../shared/rules';
import { sign } from '../format';
import { Attributes2Grid, CombatPanel, DungeonBadge, VitalsBlock } from './Vitals';
import { Fight5ePanel, Sheet5eBlock } from '../five/RoomSheet';

// 右侧的“角色卡”和“线索”。

export function CharacterSheet({ game, roomId, canGive, onChanged }: { game: GameState; roomId: number; canGive: boolean; onChanged: () => void }) {
  const me = game.me;
  if (!me) {
    return <p className="placeholder">{game.scenario ? '你还没有角色。' : '还没选剧本。'}</p>;
  }
  return (
    <div className="sheet">
      <div className="sheet-head">
        <h2 className="sheet-name">{me.name}</h2>
        <p className="sheet-role">{me.roleName}</p>
        {me.dead && <p className="sheet-dead">已经死亡</p>}
      </div>
      {game.dungeon && <DungeonBadge dungeon={game.dungeon} />}
      {game.dungeon && <CombatPanel dungeon={game.dungeon} place={me.location} />}
      {game.fight5e && <Fight5ePanel fight={game.fight5e} place={me.location} />}
      <p className="sheet-public">{me.rolePublic}</p>

      {me.roleSecret && (
        <section className="sheet-secret">
          <h3>只有你知道</h3>
          <p>{me.roleSecret}</p>
        </section>
      )}
      <section className="sheet-secret">
        <h3>目标</h3>
        <p>{me.roleGoal}</p>
      </section>

      {me.v5 && (
        <section>
          <Sheet5eBlock v5={me.v5} />
          {me.blocked && !me.dead && <p className="form-error">{me.blocked}</p>}
        </section>
      )}

      {!me.v5 && (
      <section>
        <h3 className="sheet-label">属性</h3>
        {me.v2 ? (
          <Attributes2Grid attributes={me.v2.attributes} />
        ) : (
          <dl className="attr-grid">
            {ATTRIBUTES.map((a) => (
              <div key={a.key} className="attr" title={a.covers}>
                <dt>{a.name}</dt>
                <dd>{sign(me.attributes[a.key])}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="sheet-specialties">
          <span className="sheet-label-inline">专长</span>
          {me.specialties.join('、')}
        </p>
      </section>
      )}

      {!me.v5 && (
      <section>
        {me.v2 ? (
          <VitalsBlock v2={me.v2} inDungeon={!!game.dungeon?.isDungeon} />
        ) : (
          <>
            <Track label="伤势" value={me.wounds} names={WOUND_LABEL} />
            {game.scenario?.stress && <Track label="心智" value={me.stress} names={STRESS_LABEL} />}
          </>
        )}
        {me.blocked && !me.dead && <p className="form-error">{me.blocked}</p>}
        {me.conditions.length > 0 && (
          <ul className="sheet-tags">
            {me.conditions.map((c) => (
              <li key={c.name} className="chip chip-harm" title={c.effect}>
                {c.name}
                {c.penalty ? ` ${c.penalty}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
      )}

      <section>
        <h3 className="sheet-label">随身物品</h3>
        {me.items.length ? (
          <ul className="sheet-items">
            {me.items.map((item, i) => (
              <li key={`${item}-${i}`}>
                <span>{item}</span>
                {canGive && !me.dead && !me.blocked && game.nearby.length > 0 && <GiveItem roomId={roomId} item={item} game={game} onChanged={onChanged} />}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">没有特别的东西</p>
        )}
      </section>

      {me.location && (
        <section className="sheet-place">
          <h3 className="sheet-label">现在在</h3>
          <p className="place-name">
            {me.location.name}
            {me.spot && <span className="place-spot">·{me.spot}</span>}
            {me.location.flags.map((f) => (
              <span key={f} className="chip">
                {SPOT_FLAG_LABEL[f]}
              </span>
            ))}
          </p>
          <p className="place-desc">{me.location.description}</p>
          {me.location.spots.length > 0 && (
            <p className="place-exits">
              站位：
              {me.location.spots.map((x, i) => (
                <span key={x.name}>
                  {i > 0 && '、'}
                  {x.name === me.spot ? <strong>{x.name}</strong> : x.name}
                  {x.flags.length > 0 && <span className="muted">（{x.flags.map((f) => SPOT_FLAG_LABEL[f]).join('、')}）</span>}
                </span>
              ))}
            </p>
          )}
          {me.location.exits.length > 0 && (
            <p className="place-exits">
              从这里能去：
              {me.location.exits.map((e, i) => (
                <span key={e.key}>
                  {i > 0 && '、'}
                  {e.name}
                  <span className="muted">（{e.minutes}分钟）</span>
                </span>
              ))}
            </p>
          )}
        </section>
      )}

      {(me.appearance || me.goal) && (
        <section>
          {me.appearance && (
            <p>
              <span className="sheet-label-inline">外貌</span>
              {me.appearance}
            </p>
          )}
          {me.goal && (
            <p>
              <span className="sheet-label-inline">自己写的目标</span>
              {me.goal}
            </p>
          )}
        </section>
      )}

      {me.visited.length > 1 && (
        <details className="sheet-visited">
          <summary>去过的地方（{me.visited.length}）</summary>
          <ul>
            {me.visited.map((p) => (
              <li key={p.key}>
                <strong>{p.name}</strong>：{p.description}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** 把一件东西交给同一地点的人：马上生效，在场的人都看得到。 */
function GiveItem({ roomId, item, game, onChanged }: { roomId: number; item: string; game: GameState; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState<number>(game.nearby[0]?.id ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function give() {
    setBusy(true);
    setError('');
    try {
      await api('POST', `/api/rooms/${roomId}/give`, { item, to });
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="linklike give-link" onClick={() => setOpen(true)}>
        交给…
      </button>
    );
  }
  return (
    <span className="give-form">
      <label className="visually-hidden" htmlFor={`give-${item}`}>
        交给谁
      </label>
      <select id={`give-${item}`} value={to} onChange={(e) => setTo(Number(e.target.value))}>
        {game.nearby.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void give()}>
        交给他
      </button>
      <button type="button" className="btn btn-small btn-quiet" onClick={() => setOpen(false)}>
        取消
      </button>
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}

function Track({ label, value, names }: { label: string; value: number; names: readonly string[] }) {
  return (
    <div className="track">
      <span className="sheet-label-inline">{label}</span>
      <span className="track-boxes" aria-hidden="true">
        {Array.from({ length: TRACK_MAX }, (_, i) => (
          <span key={i} className={i < value ? 'track-box is-filled' : 'track-box'} title={names[i + 1]} />
        ))}
      </span>
      <span className={value > 0 ? 'track-value is-hurt' : 'track-value'}>{names[value]}</span>
    </div>
  );
}

export function CluesPanel({
  roomId,
  clues,
  hasCharacter,
  others,
  canShare,
  focusKey = null,
}: {
  roomId: number;
  clues: ClueCard[];
  hasCharacter: boolean;
  /** 能分享给的人：这一局里还活着的其他角色。 */
  others: OtherCharacter[];
  canShare: boolean;
  /** 从记录里点了「告诉别人」的那条线索：直接打开分享。 */
  focusKey?: string | null;
}) {
  if (!hasCharacter) return <p className="placeholder">还没有线索。</p>;
  if (!clues.length) {
    return <p className="placeholder">还没有线索。</p>;
  }
  return (
    <>
      <ol className="clue-list">
        {[...clues].reverse().map((c) => (
          <li key={c.key} className="clue">
            <h3>{c.title}</h3>
            <p>{c.content}</p>
            <p className="clue-time">
              {c.gameTime !== null && `${formatGameTime(c.gameTime)} `}
              {c.from ? `${c.from}告诉你的` : '自己找到的'}
            </p>
            {canShare && others.length > 0 && (
              <ShareClue key={`${c.key}:${focusKey === c.key}`} roomId={roomId} clue={c} others={others} startOpen={focusKey === c.key} />
            )}
          </li>
        ))}
      </ol>
    </>
  );
}

/** 把一条线索告诉别人：选几个人，或者全队。不算行动，马上就告诉他们。 */
function ShareClue({ roomId, clue, others, startOpen = false }: { roomId: number; clue: ClueCard; others: OtherCharacter[]; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (startOpen) formRef.current?.scrollIntoView({ block: 'nearest' });
  }, [startOpen]);
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const all = picked.length === others.length;

  function toggle(id: number) {
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!picked.length) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<{ sharedWith: string[] }>('POST', `/api/rooms/${roomId}/clues/${encodeURIComponent(clue.key)}/share`, {
        to: all ? 'all' : picked,
      });
      setDone(`已经告诉了${r.sharedWith.join('、')}`);
      setOpen(false);
      setPicked([]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="clue-share-row">
        <button
          type="button"
          className="btn btn-small btn-quiet"
          onClick={() => {
            setOpen(true);
            setDone('');
          }}
        >
          告诉别人
        </button>
        {done && (
          <span className="muted" role="status">
            {done}
          </span>
        )}
      </div>
    );
  }
  return (
    <form className="clue-share" onSubmit={submit} ref={formRef}>
      <fieldset>
        <legend>把「{clue.title}」告诉谁</legend>
        <label className="choice">
          <input type="checkbox" checked={all} onChange={() => setPicked(all ? [] : others.map((o) => o.id))} />
          <span>
            <strong>全队</strong>
          </span>
        </label>
        {others.map((o) => (
          <label key={o.id} className="choice">
            <input type="checkbox" checked={picked.includes(o.id)} onChange={() => toggle(o.id)} />
            <span>
              <strong>{o.name}</strong>
              <small>{o.playerName}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="clue-share-actions">
        <button className="btn btn-small btn-primary" disabled={busy || !picked.length}>
          {busy ? '正在告诉……' : '告诉他们'}
        </button>
        <button type="button" className="btn btn-small btn-quiet" onClick={() => setOpen(false)}>
          取消
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
