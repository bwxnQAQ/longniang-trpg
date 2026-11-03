import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, type Condition, type HostCharacter, type HostCharacterState, type HostClue, type HostClues, type HostView, type RoomStatus } from '../api';
import { formatGameTime } from '../../../shared/game';
import { STRESS_LABEL, TRACK_MAX, WOUND_LABEL } from '../../../shared/rules';
import { formatTime, pad } from '../format';

// 主持工具：撤回或重新结算最近一次结算、改角色的数值、改游戏时间、改线索归属。
// 房主在对局页面的「主持」里用；管理员在「管理」里用同一套（full：能看到、改到全部内容）。

type Props = {
  roomId: number;
  /** 管理员：所有地点、所有线索都能选。 */
  full: boolean;
  status: RoomStatus;
  /** 现在的游戏时间（分钟），调时间时当默认值。 */
  clock: number | null;
  /** 剧本开了心智规则。 */
  stressRule: boolean;
  /** 这个值变了就重新拉一次（游戏状态有变化时）。 */
  refreshKey: number;
};

export function HostTools({ roomId, full, status, clock, stressRule, refreshKey }: Props) {
  // 房主点了“查看”的别人的角色（记录里会告诉大家）
  const [reveal, setReveal] = useState<number[]>([]);
  const query = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams(extra);
      if (full) p.set('full', '1');
      const s = p.toString();
      return s ? `?${s}` : '';
    },
    [full],
  );
  const revealQuery: Record<string, string> = reveal.length ? { reveal: reveal.join(',') } : {};
  const [view, setView] = useState<HostView | null>(null);
  const [error, setError] = useState('');

  const revealKey = reveal.join(',');
  const load = useCallback(async () => {
    try {
      setView(await api<HostView>('GET', `/api/rooms/${roomId}/host${query(revealKey ? { reveal: revealKey } : {})}`));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [roomId, query, revealKey]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (status === 'preparing') return <p className="placeholder">对局还没开始。</p>;
  if (!view) return error ? <p className="form-error">{error}</p> : <p className="muted">正在加载……</p>;
  const active = status !== 'ended';

  return (
    <div className="host-tools">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <LastResolutionBox roomId={roomId} query={query} view={view} onDone={() => void load()} />
      {active && view.characters.length > 0 && (
        <CharacterEditor
          roomId={roomId}
          query={(extra) => query({ ...revealQuery, ...extra })}
          characters={view.characters}
          stressRule={stressRule}
          onReveal={(id) => setReveal((list) => (list.includes(id) ? list : [...list, id]))}
          onSaved={(characters) => setView((v) => v && { ...v, characters })}
        />
      )}
      {active && <ClockForm roomId={roomId} q={query()} clock={clock} />}
      <CluesEditor roomId={roomId} query={query} full={full} characters={view.characters} refreshKey={refreshKey} />
    </div>
  );
}

type Query = (extra?: Record<string, string>) => string;

// ---------- 撤回最近一次结算 ----------

function LastResolutionBox({ roomId, query, view, onDone }: { roomId: number; query: Query; view: HostView; onDone: () => void }) {
  const [confirm, setConfirm] = useState<'undo' | 'regenerate' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const last = view.last;

  async function undo(regenerate: boolean) {
    setBusy(true);
    setError('');
    try {
      await api('POST', `/api/rooms/${roomId}/host/undo${query()}`, { regenerate });
      setConfirm(null);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="host-section" aria-labelledby="host-last">
      <h2 id="host-last">最近一次结算</h2>
      {!last ? (
        <p className="muted">还没有可以撤回的结算。</p>
      ) : (
        <>
          <div className="host-last">
            <p>
              <strong>{last.actor}</strong>
              {last.resolvedAt && <span className="muted">（{formatTime(last.resolvedAt)}）</span>}
            </p>
            {last.action !== null ? (
              <p className="host-last-action">{last.action}</p>
            ) : (
              <p className="host-last-action muted">看不到行动的内容。</p>
            )}
            {last.ended && <p className="hint">这次结算达成了结局。</p>}
          </div>
          {last.blocked ? (
            <p className="hint">{last.blocked}</p>
          ) : confirm ? (
            <div className="confirm-bar" role="alertdialog" aria-labelledby="undo-confirm">
              <p id="undo-confirm">
                {confirm === 'regenerate'
                  ? '撤回这次结算，让主持人按原来的行动重新结算？角色、线索、游戏时间先回到结算前，这次的叙述从记录里删掉；重新结算花的 AI 额度记在你名下。'
                  : '撤回这次结算？角色、线索、游戏时间回到结算前，这次的叙述从记录里删掉，这个行动不算了，玩家可以重新写。'}
                {last.ended && '对局回到进行中。'}
              </p>
              <div className="confirm-actions">
                <button type="button" className="btn btn-small btn-danger-solid" disabled={busy} onClick={() => void undo(confirm === 'regenerate')}>
                  {confirm === 'regenerate' ? '确认重新结算' : '确认撤回'}
                </button>
                <button type="button" className="btn btn-small btn-quiet" onClick={() => setConfirm(null)} autoFocus>
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="host-buttons">
              <button type="button" className="btn btn-small" onClick={() => setConfirm('regenerate')}>
                重新结算
              </button>
              <button type="button" className="btn btn-small btn-quiet" onClick={() => setConfirm('undo')}>
                撤回
              </button>
            </div>
          )}
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

// ---------- 角色的数值 ----------

function CharacterEditor({
  roomId,
  query,
  characters,
  stressRule,
  onReveal,
  onSaved,
}: {
  roomId: number;
  query: Query;
  characters: HostCharacter[];
  stressRule: boolean;
  onReveal: (id: number) => void;
  onSaved: (characters: HostCharacter[]) => void;
}) {
  // 先选自己的角色：别人的要点“查看”才看得到
  const [selected, setSelected] = useState((characters.find((x) => x.mine) ?? characters[0])?.id ?? 0);
  const c = characters.find((x) => x.id === selected) ?? characters[0];

  return (
    <section className="host-section" aria-labelledby="host-character">
      <h2 id="host-character">角色的数值</h2>
      <div className="field">
        <label htmlFor="host-who">角色</label>
        <select id="host-who" value={c.id} onChange={(e) => setSelected(Number(e.target.value))}>
          {characters.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}（{x.playerName}，{x.roleName}）{x.mine ? '，你的角色' : ''}
            </option>
          ))}
        </select>
      </div>
      {c.state ? (
        <StateForm key={c.id} roomId={roomId} query={query} character={c} state={c.state} stressRule={stressRule} onSaved={onSaved} />
      ) : (
        <div className="host-reveal">
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              if (window.confirm(`查看以后，记录里会告诉大家「房主查看了${c.name}的状态」。`)) onReveal(c.id);
            }}
          >
            查看「{c.name}」的状态
          </button>
        </div>
      )}
    </section>
  );
}

function StateForm({
  roomId,
  query,
  character: c,
  state,
  stressRule,
  onSaved,
}: {
  roomId: number;
  query: Query;
  character: HostCharacter;
  state: HostCharacterState;
  stressRule: boolean;
  onSaved: (characters: HostCharacter[]) => void;
}) {
  const [wounds, setWounds] = useState(state.wounds);
  const [stress, setStress] = useState(state.stress);
  const [location, setLocation] = useState(state.location?.key ?? '');
  const [items, setItems] = useState(state.items.join('\n'));
  const [conditions, setConditions] = useState<Condition[]>(state.conditions);
  const [dead, setDead] = useState(c.dead);
  // 5E 角色（V0.9.0）：改生命值（0 是倒地），不用伤势、心智和自己写的状态
  const five = state.hp5e !== null;
  const [hp5e, setHp5e] = useState(state.hp5e?.hp ?? 0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 角色的状态在别处变了：表单回到现在的样子
  const key = JSON.stringify([state, c.dead]);
  useEffect(() => {
    setHp5e(state.hp5e?.hp ?? 0);
    setWounds(state.wounds);
    setStress(state.stress);
    setLocation(state.location?.key ?? '');
    setItems(state.items.join('\n'));
    setConditions(state.conditions);
    setDead(c.dead);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const body: Record<string, unknown> = five
        ? { hp5e, items: items.split('\n').map((s) => s.trim()).filter(Boolean), dead }
        : {
            wounds,
            items: items.split('\n').map((s) => s.trim()).filter(Boolean),
            conditions: conditions.filter((k) => k.name.trim()),
            dead,
          };
      if (stressRule && !five) body.stress = stress;
      if (location && location !== state.location?.key) body.location = location;
      const r = await api<{ changed: boolean; characters: HostCharacter[] }>('PUT', `/api/rooms/${roomId}/host/characters/${c.id}${query()}`, body);
      onSaved(r.characters);
      setMessage(r.changed ? (c.mine ? '已保存' : '已保存，角色的主人会收到具体改了什么') : '没有变化');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const setCondition = (i: number, patch: Partial<Condition>) => setConditions((list) => list.map((k, j) => (j === i ? { ...k, ...patch } : k)));

  return (
    <>
      <div className="host-grid">
        {five && state.hp5e && (
          <div className="field">
            <label htmlFor="host-hp5e">生命值（最多 {state.hp5e.hpMax}）</label>
            <input id="host-hp5e" type="number" min={0} max={state.hp5e.hpMax} value={hp5e} onChange={(e) => setHp5e(Math.max(0, Math.min(state.hp5e!.hpMax, Math.round(Number(e.target.value) || 0))))} />
          </div>
        )}
        {!five && (
        <div className="field">
          <label htmlFor="host-wounds">伤势</label>
          <select id="host-wounds" value={wounds} onChange={(e) => setWounds(Number(e.target.value))}>
            {WOUND_LABEL.slice(0, TRACK_MAX + 1).map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </div>
        )}
        {stressRule && !five && (
          <div className="field">
            <label htmlFor="host-stress">心智</label>
            <select id="host-stress" value={stress} onChange={(e) => setStress(Number(e.target.value))}>
              {STRESS_LABEL.slice(0, TRACK_MAX + 1).map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="host-location">位置</label>
          <select id="host-location" value={location} onChange={(e) => setLocation(e.target.value)}>
            {!state.location && <option value="">不知道在哪</option>}
            {state.places.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="host-items">物品</label>
        <textarea id="host-items" rows={3} value={items} onChange={(e) => setItems(e.target.value)} placeholder="一行一件" />
      </div>
      {!five && (
      <fieldset className="host-conditions">
        <legend>状态</legend>
        {conditions.length === 0 && <p className="muted">没有。</p>}
        {conditions.map((k, i) => (
          <div key={i} className="host-condition">
            <input aria-label="状态名" maxLength={10} value={k.name} onChange={(e) => setCondition(i, { name: e.target.value })} placeholder="状态名" />
            <input aria-label="效果" maxLength={60} value={k.effect} onChange={(e) => setCondition(i, { effect: e.target.value })} placeholder="效果" />
            <div className="host-condition-foot">
              <select aria-label="检定减值" value={k.penalty} onChange={(e) => setCondition(i, { penalty: Number(e.target.value) })}>
                <option value={0}>不影响检定</option>
                <option value={-1}>检定 −1</option>
                <option value={-2}>检定 −2</option>
              </select>
              <button type="button" className="btn btn-small btn-quiet" onClick={() => setConditions((list) => list.filter((_, j) => j !== i))}>
                去掉
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-small btn-quiet" onClick={() => setConditions((list) => [...list, { name: '', effect: '', penalty: 0 }])}>
          加一个状态
        </button>
      </fieldset>
      )}
      <label className="choice">
        <input type="checkbox" checked={dead} onChange={(e) => setDead(e.target.checked)} />
        <span>已死亡</span>
      </label>
      <div className="host-buttons">
        <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void save()}>
          {busy ? '正在保存……' : '保存修改'}
        </button>
        {message && (
          <span className="form-ok" role="status">
            {message}
          </span>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

// ---------- 游戏时间 ----------

function ClockForm({ roomId, q, clock }: { roomId: number; q: string; clock: number | null }) {
  const current = Math.max(0, Math.floor(clock ?? 0));
  const [day, setDay] = useState(Math.floor(current / 1440) + 1);
  const [time, setTime] = useState(`${pad(Math.floor((current % 1440) / 60))}:${pad(current % 60)}`);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await api<{ minutes: number }>('PUT', `/api/rooms/${roomId}/host/clock${q}`, { day, time });
      setMessage(`已调到${formatGameTime(r.minutes)}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="host-section" aria-labelledby="host-clock">
      <h2 id="host-clock">游戏时间</h2>
      <p className="hint">现在是{formatGameTime(current)}。</p>
      <div className="host-grid">
        <div className="field">
          <label htmlFor="host-day">第几天</label>
          <input id="host-day" type="number" min={1} max={60} value={day} onChange={(e) => setDay(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="host-time">时间</label>
          <input id="host-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div className="host-buttons">
        <button type="button" className="btn btn-small" disabled={busy} onClick={() => void save()}>
          调整时间
        </button>
        {message && (
          <span className="form-ok" role="status">
            {message}
          </span>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

// ---------- 线索归属 ----------

function CluesEditor({
  roomId,
  query,
  full,
  characters,
  refreshKey,
}: {
  roomId: number;
  query: Query;
  full: boolean;
  characters: HostCharacter[];
  refreshKey: number;
}) {
  // 房主也可能在玩：别人找到的线索要他点“查看”以后才显示，记录里会告诉大家
  const [shown, setShown] = useState(full);
  const [data, setData] = useState<HostClues | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api<HostClues>('GET', `/api/rooms/${roomId}/host/clues${query(shown ? { reveal: '1' } : undefined)}`));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [roomId, query, shown]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const clues = data?.clues ?? null;
  return (
    <section className="host-section" aria-labelledby="host-clues">
      <h2 id="host-clues">线索归属</h2>
      {data === null ? (
        error ? null : <p className="muted">正在加载……</p>
      ) : data.count === 0 && !full ? (
        <p className="muted">还没有人找到线索。</p>
      ) : clues === null ? (
        <>
          <p className="hint">已经找到了 {data.count} 条线索。</p>
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              if (window.confirm('查看以后，记录里会告诉大家「房主查看了已经找到的线索」。')) setShown(true);
            }}
          >
            查看已经找到的线索
          </button>
        </>
      ) : clues.length === 0 ? (
        <p className="muted">还没有人找到线索。</p>
      ) : (
        <ul className="host-clue-list">
          {clues.map((clue) => (
            <ClueHolders key={clue.key} roomId={roomId} query={query} clue={clue} characters={characters} onSaved={setData} />
          ))}
        </ul>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function ClueHolders({
  roomId,
  query,
  clue,
  characters,
  onSaved,
}: {
  roomId: number;
  query: Query;
  clue: HostClue;
  characters: HostCharacter[];
  onSaved: (data: HostClues) => void;
}) {
  const [holders, setHolders] = useState(clue.holders);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const key = clue.holders.join(',');
  useEffect(() => setHolders(clue.holders), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const changed = [...holders].sort().join(',') !== [...clue.holders].sort().join(',');

  async function save() {
    setBusy(true);
    setError('');
    try {
      const r = await api<HostClues & { changed: boolean }>('PUT', `/api/rooms/${roomId}/host/clues/${encodeURIComponent(clue.key)}${query()}`, {
        characterIds: holders,
      });
      onSaved({ clues: r.clues, count: r.count });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="host-clue">
      <details>
        <summary>
          {clue.title}
          {!clue.found && <span className="tag">还没找到</span>}
        </summary>
        <p className="host-clue-text">{clue.content}</p>
      </details>
      <fieldset>
        <legend className="visually-hidden">「{clue.title}」有哪些角色知道</legend>
        <div className="host-clue-who">
          {characters.map((c) => (
            <label key={c.id} className="choice">
              <input
                type="checkbox"
                checked={holders.includes(c.id)}
                onChange={(e) => setHolders((list) => (e.target.checked ? [...list, c.id] : list.filter((id) => id !== c.id)))}
              />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {changed && (
        <div className="host-buttons">
          <button type="button" className="btn btn-small" disabled={busy} onClick={() => void save()}>
            {holders.length ? '保存' : '保存（没人知道就算没找到）'}
          </button>
          <button type="button" className="btn btn-small btn-quiet" onClick={() => setHolders(clue.holders)}>
            还原
          </button>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
