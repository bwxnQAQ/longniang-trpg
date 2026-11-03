import { useState, type FormEvent } from 'react';
import { Field } from '../components/bits';

// 「用这个剧本开局」：和剧本大厅里建对局一样填对局名称、人数上限这些（真正的流程在编辑页里：
// 先建对局，再用导入剧本的接口装进去）。

export type StartOptions = { name: string; maxPlayers: number; untimed: boolean; isPublic: boolean };

/** busy：正在建对局（room）、正在装剧本（scenario，要等内容检查）。 */
export function StartGamePanel({
  title,
  limit,
  busy,
  error,
  canStart,
  onStart,
  onCancel,
}: {
  title: string;
  /** 剧本最多几个人玩（人数上限不超过它）。 */
  limit: number;
  busy: 'room' | 'scenario' | null;
  error: string;
  canStart: boolean;
  onStart: (o: StartOptions) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState([...title].slice(0, 30).join(''));
  const [maxPlayers, setMaxPlayers] = useState(Math.min(4, limit));
  const [untimed, setUntimed] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onStart({ name, maxPlayers: Math.min(maxPlayers, limit), untimed, isPublic: !isPrivate });
  }

  return (
    <form className="panel form ed-start-panel" onSubmit={submit} noValidate>
      <h2>用这个剧本开局</h2>
      <Field label="对局名称" htmlFor="ed-room-name">
        <input id="ed-room-name" maxLength={30} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="人数上限" htmlFor="ed-room-max">
        <select id="ed-room-max" value={Math.min(maxPlayers, limit)} onChange={(e) => setMaxPlayers(Number(e.target.value))}>
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
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy !== null || !canStart}>
          {busy === 'room' ? '正在建对局……' : busy === 'scenario' ? '正在装剧本……' : '开局'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onCancel} disabled={busy !== null}>
          取消
        </button>
      </div>
    </form>
  );
}
