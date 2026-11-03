import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { api, errorMessage, type GameState, type LogEntry, type MyAction, type RoomStatus } from '../api';
import { formatDuration } from '../../../shared/game';
import { clockTime, formatRemaining, useNow } from './time';

// 故事下面的输入框：「行动」交给主持人（以「？」开头是问主持人），「对白」是角色当面说的话，同一地点的人马上看到。
// 场外聊天在右边的「聊天」里（ChatComposer）。

type Mode = 'action' | 'say';

const QUESTION = /^[?？]/;

export function Composer({
  roomId,
  status,
  game,
  serverOffset,
  asking,
  onAsked,
  onChanged,
}: {
  roomId: number;
  status: RoomStatus;
  game: GameState;
  /** 服务器时钟比本机快多少毫秒。 */
  serverOffset: number;
  /** 问主持人的问题已经发出、还没收到回答。 */
  asking: boolean;
  onAsked: () => void;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<Mode>('action');
  const [drafts, setDrafts] = useState<Record<Mode, string>>({ action: '', say: '' });
  const [secret, setSecret] = useState(false);
  /** 宠物出手（V0.6.0）：这次检定失败了，宠物帮着再掷一次（每局一次）。交了就复位。 */
  const [petHelp, setPetHelp] = useState(false);
  /** 对白说给谁：null 是在场的所有人，否则是悄悄话的对象（角色编号）。 */
  const [to, setTo] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const text = drafts[mode];
  const setText = (value: string) => setDrafts((d) => ({ ...d, [mode]: value }));
  const myAction = game.myAction;
  const me = game.me;
  const here = game.nearby;
  // 悄悄话的对象走开了：改回说给大家
  useEffect(() => {
    if (to !== null && !here.some((c) => c.id === to)) setTo(null);
  }, [here, to]);

  // 已经有行动在等结果：这时候写的都当成问主持人的问题
  const questionOnly = mode === 'action' && !!myAction;
  const asQuestion = mode === 'action' && (questionOnly || QUESTION.test(text.trim()));

  let disabledReason = '';
  if (status === 'ended') disabledReason = '这一局已经结束了';
  else if (!me) disabledReason = '你还没有角色';
  else if (me.dead) disabledReason = '你的角色已经死了';
  else if (!game.ai.ready && mode === 'action') disabledReason = game.ai.message ?? 'AI 主持暂时用不了';
  else if (status === 'paused' && (mode === 'say' || !asQuestion)) disabledReason = '对局暂停中，等房主继续';
  else if ((mode === 'say' || !asQuestion) && me.blocked) disabledReason = me.blocked;
  else if (mode === 'action' && !asQuestion && game.round?.resolving) disabledReason = '这一轮正在结算，结算完再写下一个行动';
  else if (game.credit.remaining !== null && game.credit.remaining <= 0) disabledReason = '你的 AI 额度用完了，请找管理员发放额度';
  const waitingAnswer = asQuestion && asking;
  const canSend = !disabledReason && !waitingAnswer && !busy && !!text.trim();

  async function send() {
    if (!canSend) return;
    setBusy(true);
    setError('');
    try {
      const value = text.trim();
      if (mode === 'say') {
        await api('POST', `/api/rooms/${roomId}/say`, { text: value, ...(to !== null ? { to } : {}) });
      } else {
        const r = await api<{ kind: 'action' | 'question' }>('POST', `/api/rooms/${roomId}/act`, {
          text: value,
          as: questionOnly ? 'question' : 'auto',
          secret,
          petHelp: petHelp && me?.petHelp === 'ready',
        });
        if (r.kind === 'question') onAsked();
        else {
          setPetHelp(false);
          onChanged();
        }
      }
      setText('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function actionCall(method: 'DELETE' | 'POST', path: string) {
    setBusy(true);
    setError('');
    try {
      await api(method, path);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // 用输入法打字时按回车是选字，不能当成发送
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    // 行动通常比较长，要按 Ctrl+Enter 才提交，免得误交；对白和提问按 Enter 就发
    const submit = mode === 'action' && !asQuestion ? e.ctrlKey || e.metaKey : !e.shiftKey;
    if (submit) {
      e.preventDefault();
      void send();
    }
  }

  const names = new Map<number, string>([...game.others.map((c) => [c.id, c.name] as const), ...(me ? [[me.id, '你'] as const] : [])]);
  const placeholder =
    disabledReason ||
    (mode === 'say'
      ? to === null
        ? '写下角色当面说的话'
        : `写下悄悄对${names.get(to) ?? '他'}说的话`
      : questionOnly
        ? '问主持人的问题'
        : '写下你的角色要做什么');

  return (
    <form
      className="composer"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void send();
      }}
    >
      <div className="composer-modes" role="radiogroup" aria-label="输入框用来做什么">
        {(
          [
            ['action', '行动'],
            ['say', '对白'],
          ] as const
        ).map(([id, label]) => (
          <label key={id} className={mode === id ? 'mode-option is-active' : 'mode-option'}>
            <input type="radio" name="composer-mode" value={id} checked={mode === id} onChange={() => setMode(id)} />
            {label}
          </label>
        ))}
        {mode === 'say' && (
          <label className="composer-to">
            <span>说给</span>
            <select value={to ?? ''} onChange={(e) => setTo(e.target.value ? Number(e.target.value) : null)}>
              <option value="">在场的所有人</option>
              {here.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}（悄悄话）
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {mode === 'action' && myAction && (
        <ActionStatus
          action={myAction}
          game={game}
          names={names}
          serverOffset={serverOffset}
          busy={busy}
          onWithdraw={() => void actionCall('DELETE', `/api/rooms/${roomId}/actions/${myAction.id}`)}
          onRetry={() => void actionCall('POST', `/api/rooms/${roomId}/actions/${myAction.id}/retry`)}
        />
      )}
      {mode === 'action' && asking && (
        <p className="action-status" role="status">
          <span className="thinking-dot" aria-hidden="true" />
          主持人在想怎么回答你的问题……
        </p>
      )}

      <label htmlFor="composer-text" className="visually-hidden">
        {mode === 'say' ? '对白' : '行动'}
      </label>
      <textarea
        id="composer-text"
        rows={mode === 'action' && !asQuestion ? 3 : 2}
        maxLength={mode === 'say' ? 300 : 500}
        value={text}
        disabled={!!disabledReason}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        aria-describedby="composer-hint"
      />
      <div className="composer-foot">
        <span className="hint" id="composer-hint">
          {mode === 'say' ? (here.length === 0 ? '这里只有你一个人。' : '') : asQuestion ? '' : roundStatus(game, names)}
        </span>
        <span className="composer-buttons">
          {mode === 'action' && !asQuestion && !disabledReason && me?.petHelp === 'ready' && me.pet && (
            <label className="choice composer-secret composer-pet" title={`检定失败时${me.pet.name}帮你再掷一次，这一局只能用一次`}>
              <input type="checkbox" checked={petHelp} onChange={(e) => setPetHelp(e.target.checked)} />
              <span>{me.pet.name}出手</span>
            </label>
          )}
          {mode === 'action' && !asQuestion && (
            <label className="choice composer-secret">
              <input type="checkbox" checked={secret} disabled={!!disabledReason} onChange={(e) => setSecret(e.target.checked)} />
              <span>悄悄做</span>
            </label>
          )}
          <button className="btn btn-primary btn-small" disabled={!canSend}>
            {busy ? '正在发送……' : mode === 'say' ? (to === null ? '说' : '悄悄说') : asQuestion ? '问主持人' : '交给主持人'}
          </button>
        </span>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

/** 回合模式下这一轮的情况：已经有人交了、在等你时说清楚还差谁；谁的额度用完了这一轮不等。 */
function roundStatus(game: GameState, names: Map<number, string>): string {
  if (game.mode !== 'round') return '';
  const round = game.round;
  const me = game.me?.id;
  const skipped = noCreditNote(game, names);
  if (round && me !== undefined && round.submitted.length > 0 && round.waitingFor.includes(me)) {
    const others = round.waitingFor.filter((id) => id !== me).map((id) => names.get(id) ?? '有人');
    return others.length
      ? `这一轮已经有 ${round.submitted.length} 人交了行动，还在等你和${others.join('、')}。${skipped}`
      : `其他人都交了行动，就等你了。${skipped}`;
  }
  return skipped;
}

/** 回合模式下额度用完、这一轮不等的人（不包括自己：自己的额度用完了，行动框会直接说）。 */
function noCreditNote(game: GameState, names: Map<number, string>): string {
  const ids = (game.round?.noCredit ?? []).filter((id) => id !== game.me?.id);
  if (!ids.length) return '';
  return `${ids.map((id) => names.get(id) ?? '有人').join('、')}的 AI 额度用完了，这一轮不等。`;
}

function ActionStatus({
  action,
  game,
  names,
  serverOffset,
  busy,
  onWithdraw,
  onRetry,
}: {
  action: MyAction;
  game: GameState;
  names: Map<number, string>;
  serverOffset: number;
  busy: boolean;
  onWithdraw: () => void;
  onRetry: () => void;
}) {
  const ticking = action.status === 'waiting' && action.mode === 'timed' && action.dueAt !== null;
  const serverNow = useNow(ticking ? 1000 : null) + serverOffset;
  let line: string;
  if (action.status === 'resolving') line = '主持人正在结算这个行动……';
  else if (action.status === 'failed' && action.refused) line = `${action.error ?? '这个行动被 AI 的安全机制拒绝了'}。不能重试，请撤回以后换个写法。`;
  else if (action.status === 'failed') line = `没能结算：${action.error ?? '出错了'}`;
  else if (action.assisting) line = `你在协助${action.assisting}：跟着他的行动一起出结果。`;
  else if (action.gameMinutes === null) line = '主持人在估算这件事要花多久……';
  else if (action.mode === 'round') {
    const waiting = (game.round?.waitingFor ?? []).map((id) => names.get(id) ?? '有人');
    const skipped = noCreditNote(game, names);
    line = `游戏里约${formatDuration(action.gameMinutes)}。${waiting.length ? `等${waiting.join('、')}交了行动一起结算。` : '人齐了，马上结算。'}${skipped}`;
  } else if (action.dueAt !== null) {
    line = `计时中：约 ${clockTime(action.dueAt - serverOffset)} 出结果（${formatRemaining(action.dueAt - serverNow)}），游戏里约${formatDuration(action.gameMinutes)}`;
  } else line = '等待中';

  const working = action.status === 'resolving' || (action.status === 'waiting' && action.gameMinutes === null && !action.assisting);
  return (
    <div className={action.status === 'failed' ? 'action-status is-failed' : 'action-status'} role="status">
      <p className="action-status-line">
        {working && <span className="thinking-dot" aria-hidden="true" />}
        {line}
        {action.estimateNote && action.status === 'waiting' && action.gameMinutes !== null && !action.assisting && (
          <span className="muted">（{action.estimateNote}）</span>
        )}
        {action.secret && <span className="tag">悄悄做</span>}
        {action.petHelp && <span className="tag">宠物出手</span>}
      </p>
      <p className="action-status-content">{action.content}</p>
      {action.status !== 'resolving' && (
        <div className="action-status-buttons">
          {action.status === 'failed' && !action.refused && (
            <button type="button" className="btn btn-small" disabled={busy} onClick={onRetry}>
              重试
            </button>
          )}
          <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={onWithdraw}>
            撤回
          </button>
        </div>
      )}
    </div>
  );
}

/** 场外聊天的输入框（右边的「聊天」里）：大家都看得到，主持人不会当成角色的言行。 */
export function ChatComposer({ roomId, status, onSent }: { roomId: number; status: RoomStatus; onSent: (entry: LogEntry) => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ended = status === 'ended';

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value || busy || ended) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<{ entry: LogEntry }>('POST', `/api/rooms/${roomId}/chat`, { text: value });
      onSent(r.entry);
      setText('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="chat-composer" onSubmit={send}>
      <label htmlFor="chat-text" className="visually-hidden">
        场外聊天
      </label>
      <textarea
        id="chat-text"
        rows={2}
        maxLength={500}
        value={text}
        disabled={ended}
        placeholder={ended ? '这一局已经结束了' : '和其他玩家场外聊天'}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void send();
          }
        }}
      />
      <button className="btn btn-small" disabled={busy || ended || !text.trim()}>
        发送
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
