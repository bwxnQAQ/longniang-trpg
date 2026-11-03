import { useState, type FormEvent, type ReactNode } from 'react';
import { api, errorMessage, type Credit, type RoomDetail, type RoomSummary, type RoomTodo, type ScenarioSummary } from '../api';
import { Field, Stamp } from '../components/bits';
import { creditText } from '../format';
import { clockTime, formatRemaining, useNow } from '../room/time';
import { Link, navigate } from '../router';

// 大厅里“我的对局”那一块：每一局要你做的事、你的行动还要等多久、你不在时的新进展。

/** 我在的对局。rooms 是 null 表示还在加载。extra：每一局下面再加的一行（V0.8.0 约团的下次时间、「约时间」）。 */
export function MyRooms({ rooms, serverOffset, extra }: { rooms: RoomSummary[]; serverOffset: number; extra?: (room: RoomSummary) => ReactNode }) {
  // 有行动在倒计时，就每 15 秒刷新一次剩下的时间
  const counting = rooms.some((r) => r.todo.action?.status === 'waiting' && r.todo.action.dueAt !== null);
  const now = useNow(counting ? 15_000 : null);
  return (
    <ul className="room-list">
      {rooms.map((r) => (
        <li key={r.id}>
          <Link to={`/room/${r.id}`} className="room-row">
            <span className="room-row-main">
              <span className="room-row-name">{r.name}</span>
              <span className="room-row-meta">
                {r.isHost && <span className="tag">房主</span>}
                {r.isPublic && <span className="tag">公开</span>}
                {r.scenarioTitle && <span>《{r.scenarioTitle}》</span>}
                <span>
                  {r.memberCount}/{r.maxPlayers} 人
                </span>
                <span className={r.onlineCount > 0 ? 'presence is-on' : 'presence'}>
                  <span className="dot" aria-hidden="true" />
                  {r.onlineCount} 人在线
                </span>
              </span>
              <TodoLine todo={r.todo} status={r.status} serverNow={now + serverOffset} serverOffset={serverOffset} />
              {extra?.(r)}
            </span>
            <Stamp status={r.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 我的 AI 额度：用完了要说清楚哪些事做不了、找谁。 */
export function CreditLine({ credit }: { credit: Credit }) {
  const out = credit.remaining !== null && credit.remaining <= 0;
  return (
    <p className={out ? 'credit-line is-out' : 'credit-line'}>
      <span className="credit-label">AI 额度</span>
      {out ? '用完了，暂时不能交行动、对白、提问或生成剧本。请找管理员发放额度。' : creditText(credit)}
    </p>
  );
}

type TodoTone = 'yours' | 'new' | 'alert' | 'wait';

const SETUP_TEXT: Record<NonNullable<RoomTodo['setup']>, [string, TodoTone]> = {
  'pick-scenario': ['该你选剧本了', 'yours'],
  'wait-scenario': ['等房主选剧本', 'wait'],
  generating: ['AI 正在生成剧本', 'wait'],
  'make-character': ['该你选身份了', 'yours'],
  'wait-players': ['还没有人选身份', 'wait'],
  start: ['可以开局了', 'yours'],
  'wait-start': ['等房主开局', 'wait'],
};

/** 每一局下面的一行：要你做的事、你的行动还要等多久、你不在时的新进展。 */
function TodoLine({ todo, status, serverNow, serverOffset }: { todo: RoomTodo; status: RoomSummary['status']; serverNow: number; serverOffset: number }) {
  const items: [string, TodoTone][] = [];
  if (todo.setup) items.push(SETUP_TEXT[todo.setup]);
  const a = todo.action;
  if (a?.status === 'failed') items.push([a.refused ? '你的行动被安全机制拒绝了，要撤回重写' : '你的行动没能结算，要重试或撤回', 'alert']);
  else if (a?.status === 'resolving') items.push(['主持人在写你的行动结果', 'wait']);
  else if (a?.mode === 'round') items.push(['你的行动在等这一轮的其他人', 'wait']);
  else if (a && a.dueAt === null) items.push(['主持人在估算你的行动要多久', 'wait']);
  else if (a && a.dueAt !== null) {
    const left = a.dueAt - serverNow;
    items.push([left <= 30_000 ? '你的行动马上出结果' : `你的行动约 ${clockTime(a.dueAt - serverOffset)} 出结果，${formatRemaining(left)}`, 'wait']);
  }
  if (status === 'paused' && !a) items.push(['暂停中，等房主继续', 'wait']);
  if (todo.newResults) items.push([todo.newResults > 1 ? `你的 ${todo.newResults} 个行动有结果了` : '你的行动有结果了', 'new']);
  // 新进展里已经包含你自己的行动结果，这里只数别的
  const rest = todo.newStory - todo.newResults;
  if (rest > 0) items.push([todo.newResults ? `还有 ${rest} 条新进展` : `${rest} 条新进展`, 'new']);
  if (todo.newChat) items.push([`${todo.newChat} 条新聊天`, 'new']);
  if (todo.canAct) items.push(['可以行动', 'yours']);
  if (!items.length) return null;
  return (
    <span className="room-row-todo">
      {items.map(([text, tone]) => (
        <span key={text} className={`todo is-${tone}`}>
          {text}
        </span>
      ))}
    </span>
  );
}

/** 新建对局。scenario：剧本大厅里「用这个剧本开局」，建好就选上这个剧本，人数上限不超过剧本的。 */
export function CreateRoomForm({ onCancel, scenario }: { onCancel: () => void; scenario?: ScenarioSummary }) {
  const limit = scenario?.players.max ?? 6;
  const [name, setName] = useState(scenario?.title ?? '');
  const [maxPlayers, setMaxPlayers] = useState(Math.min(4, limit));
  const [untimed, setUntimed] = useState(false);
  // 默认在大厅里公开；勾了「私人对局」才不公开
  const [isPrivate, setIsPrivate] = useState(false);
  // 用 5E 规则玩（V1.0.0 5E mod）：普通剧本才有（地下城、5E 模组不用转）
  const canMod5e = !!scenario && scenario.rules !== '5e' && !scenario.dungeon;
  const [mod5e, setMod5e] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await api<RoomDetail>('POST', '/api/rooms', {
        name,
        maxPlayers,
        untimed,
        isPublic: !isPrivate,
        ...(scenario ? { scenarioKey: scenario.key } : {}),
        ...(canMod5e && mod5e ? { mod5e: true } : {}),
      });
      navigate(`/room/${r.room.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <h2>{scenario ? `用《${scenario.title}》开局` : '新建对局'}</h2>
      <Field label="对局名称" htmlFor={scenario ? `room-name-${scenario.key}` : 'room-name'}>
        <input id={scenario ? `room-name-${scenario.key}` : 'room-name'} maxLength={30} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="人数上限" htmlFor={scenario ? `room-max-${scenario.key}` : 'room-max'}>
        <select id={scenario ? `room-max-${scenario.key}` : 'room-max'} value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}>
          {Array.from({ length: limit }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} 人
            </option>
          ))}
        </select>
      </Field>
      <label className="choice">
        <input type="checkbox" checked={untimed} onChange={(e) => setUntimed(e.target.checked)} />
        <span>
          <strong>不计时</strong>
        </span>
      </label>
      <label className="choice">
        <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
        <span>
          <strong>私人对局</strong>
        </span>
      </label>
      {canMod5e && (
        <label className="choice">
          <input type="checkbox" checked={mod5e} onChange={(e) => setMod5e(e.target.checked)} />
          <span>
            <strong>用 5E 规则玩</strong>
          </span>
        </label>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? '正在创建……' : '创建对局'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

export function JoinRoomForm({ onCancel }: { onCancel: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await api<{ roomId: number }>('POST', '/api/rooms/join', { code });
      navigate(`/room/${r.roomId}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <h2>用对局码加入</h2>
      <Field label="对局码" htmlFor="join-code">
        <input
          id="join-code"
          className="code-input"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
        />
      </Field>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? '正在加入……' : '加入'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}
