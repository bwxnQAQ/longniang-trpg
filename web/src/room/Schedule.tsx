import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  SCHEDULE_ANSWER_LABEL,
  SCHEDULE_ANSWERS,
  SCHEDULE_MAX_AHEAD_MS,
  SCHEDULE_MAX_SLOTS,
  SCHEDULE_MIN_LEAD_MS,
  SCHEDULE_NOTE_MAX,
  SCHEDULE_PAST_AFTER_MS,
  scheduleTimeText,
  type ScheduleAnswer,
  type ScheduleMine,
  type ScheduleResponse,
  type ScheduleSlot,
  type ScheduleView,
} from '../../../shared/schedule';
import { api, errorMessage } from '../api';
import { Modal } from '../components/Modal';
import { pad } from '../format';
import { useLiveEvent, useLiveOpen } from '../live';
import { navigate, useLocation } from '../router';
import { useNow } from './time';

// 约团（V0.8.0）：对局页页头上的「下次：10月30日 周五 20:00」或者「约时间」，点开是约团的对话框：
// 房主列时间、定下、取消；成员（包括房主）每个时间勾能来、也许、来不了。「我的对局」每一局下面的下次时间和「约时间」也在这里。
// 时间都按浏览器的本地时间显示、输入（服务器存的是 UTC 毫秒）。

function CalendarIcon() {
  return (
    <svg className="schedule-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.6h11M5.5 2v3M10.5 2v3" />
    </svg>
  );
}

/** 还算数的约团：还在勾的，或者定下了、还没过去（开始以后 6 小时之内）的。 */
function activeOf(view: ScheduleView | null, serverNow: number): ScheduleView | null {
  if (!view) return null;
  if (view.status === 'open') return view;
  return view.startsAt !== null && serverNow < view.startsAt + SCHEDULE_PAST_AFTER_MS ? view : null;
}

/** 对局页页头的约团（成员才有，结束了的对局不放）：一个按钮，点开对话框。 */
export function ScheduleBar({ roomId, isHost }: { roomId: number; isHost: boolean }) {
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const { query, pathname } = useLocation();

  const apply = useCallback((r: ScheduleResponse) => {
    setData(r);
    setOffset(r.now - Date.now());
  }, []);

  /** 拉一次现在的约团；返回拉到的（拿不到是 null）。 */
  const load = useCallback(async (): Promise<ScheduleResponse | null> => {
    try {
      const r = await api<ScheduleResponse>('GET', `/api/rooms/${roomId}/schedule`);
      apply(r);
      return r;
    } catch {
      // 拿不到先不显示，下次推送、重连时再拉
      return null;
    }
  }, [roomId, apply]);

  useEffect(() => {
    void load();
  }, [load]);
  // 推送来的变化：等半秒再拉，这半秒里来的几条合成一次
  const timer = useRef<number | undefined>(undefined);
  const soon = useCallback(() => {
    if (timer.current !== undefined) return;
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      void load();
    }, 500);
  }, [load]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useLiveEvent<{ roomId?: number }>('schedule', (d) => {
    if (d?.roomId === roomId) soon();
  });
  // 有人加入了：人数、还没勾的人变了
  useLiveEvent<{ roomId?: number }>('members', (d) => {
    if (d?.roomId === undefined || d.roomId === roomId) soon();
  });
  useLiveOpen(() => void load());

  // 地址里带 ?schedule（从通知、推送点进来的；已经开着这一局时再点的也算）：参数去掉，拉一次最新的，
  // 有在约的（房主没约也行）就打开对话框
  const asked = query.has('schedule');
  useEffect(() => {
    if (!asked) return;
    navigate(pathname, { replace: true });
    void load().then((r) => {
      if (r && (activeOf(r.schedule, r.now) || isHost)) setOpen(true);
    });
  }, [asked, pathname, load, isHost]);

  const view = data?.schedule ?? null;
  // 定下了的：每分钟看一下过没过去
  const now = useNow(view?.status === 'confirmed' ? 60_000 : null);
  const active = activeOf(view, now + offset);
  if (!data) return null;

  let button;
  if (active?.status === 'confirmed' && active.startsAt !== null) {
    button = (
      <button type="button" className="schedule-pill is-set" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <CalendarIcon />
        下次：{scheduleTimeText(active.startsAt)}
      </button>
    );
  } else if (active) {
    const mineNone = active.slots.every((s) => s.mine === null);
    button = (
      <button type="button" className={mineNone ? 'schedule-pill is-waiting' : 'schedule-pill'} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <CalendarIcon />
        约时间
        {mineNone ? (
          <span className="schedule-pill-badge">等你勾</span>
        ) : (
          <span className="schedule-pill-count">
            已勾 {active.answered}/{active.members}
          </span>
        )}
      </button>
    );
  } else if (isHost) {
    button = (
      <button type="button" className="schedule-pill is-empty" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <CalendarIcon />
        约时间
      </button>
    );
  } else {
    return null;
  }

  return (
    <>
      {button}
      {open && (
        <Modal open onClose={() => setOpen(false)} title="约团">
          <SchedulePanel roomId={roomId} view={active} isHost={isHost} offset={offset} onData={apply} />
        </Modal>
      )}
    </>
  );
}

/** 约团对话框里面：房主没约的时候是列时间的表单；还在勾的列出每个时间；定下了的显示「下次」。 */
function SchedulePanel({
  roomId,
  view,
  isHost,
  offset,
  onData,
}: {
  roomId: number;
  view: ScheduleView | null;
  isHost: boolean;
  offset: number;
  onData: (r: ScheduleResponse) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /** 等第二下确认的：定下哪个时间、取消。 */
  const [confirming, setConfirming] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const serverNow = useNow(30_000) + offset;

  // 换了一个约团（重新列了、别处取消了）：等着确认的不算了
  const viewId = view?.id ?? null;
  useEffect(() => {
    setConfirming(null);
    setCancelling(false);
  }, [viewId, view?.status]);

  async function run(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) {
    setBusy(true);
    setError('');
    try {
      onData(await api<ScheduleResponse>(method, path, body));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const errorLine = error && (
    <p className="form-error" role="alert">
      {error}
    </p>
  );

  if (!view || editing) {
    if (!isHost) return <p className="muted">现在没有在约的时间。</p>;
    return (
      <ScheduleForm
        roomId={roomId}
        offset={offset}
        onBack={view ? () => setEditing(false) : null}
        onSent={(r) => {
          onData(r);
          setEditing(false);
        }}
      />
    );
  }

  const hostActions = isHost && (
    <div className="schedule-actions">
      {cancelling ? (
        <>
          <button type="button" className="btn btn-small btn-danger-solid" disabled={busy} onClick={() => void run('DELETE', `/api/rooms/${roomId}/schedule`)}>
            确认取消
          </button>
          <button type="button" className="btn btn-small btn-quiet" onClick={() => setCancelling(false)}>
            算了
          </button>
        </>
      ) : (
        <>
          <button type="button" className="btn btn-small" disabled={busy} onClick={() => setEditing(true)}>
            重新约
          </button>
          <button type="button" className="btn btn-small btn-quiet btn-danger-text" disabled={busy} onClick={() => setCancelling(true)}>
            {view.status === 'confirmed' ? '取消这次' : '取消约团'}
          </button>
        </>
      )}
    </div>
  );

  if (view.status === 'confirmed') {
    const slot = view.slots.find((s) => s.id === view.confirmedSlotId) ?? null;
    return (
      <div className="schedule-panel">
        <p className="schedule-next">
          <CalendarIcon />
          下次：<strong>{view.startsAt !== null ? scheduleTimeText(view.startsAt) : ''}</strong>
        </p>
        {view.note && <p className="schedule-note">{view.note}</p>}
        {slot && <Who slot={slot} />}
        {errorLine}
        {hostActions}
      </div>
    );
  }

  return (
    <div className="schedule-panel">
      {view.note && <p className="schedule-note">{view.note}</p>}
      <ul className="schedule-slots">
        {view.slots.map((slot) => (
          <SlotRow
            key={slot.id}
            slot={slot}
            past={slot.startsAt <= serverNow}
            busy={busy}
            isHost={isHost}
            confirming={confirming === slot.id}
            onVote={(answer) => void run('PUT', `/api/rooms/${roomId}/schedule/votes`, { votes: { [slot.id]: answer } })}
            onConfirm={() => {
              setCancelling(false);
              if (confirming !== slot.id) setConfirming(slot.id);
              else void run('POST', `/api/rooms/${roomId}/schedule/confirm`, { slotId: slot.id });
            }}
            onUnconfirm={() => setConfirming(null)}
          />
        ))}
      </ul>
      {view.waiting.length > 0 && <p className="schedule-waiting">还没勾：{view.waiting.map((u) => u.displayName).join('、')}</p>}
      {errorLine}
      {hostActions}
    </div>
  );
}

/** 还在勾的约团里的一个时间：几个人能来、也许、来不了（点开看是谁），我勾的；房主多一个「定下」。 */
function SlotRow({
  slot,
  past,
  busy,
  isHost,
  confirming,
  onVote,
  onConfirm,
  onUnconfirm,
}: {
  slot: ScheduleSlot;
  past: boolean;
  busy: boolean;
  isHost: boolean;
  confirming: boolean;
  onVote: (answer: ScheduleAnswer | null) => void;
  onConfirm: () => void;
  onUnconfirm: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const whoId = useId();
  const time = scheduleTimeText(slot.startsAt);
  return (
    <li className={past ? 'schedule-slot is-past' : 'schedule-slot'}>
      <div className="schedule-slot-head">
        <span className="schedule-time">{time}</span>
        <button type="button" className="schedule-tally" aria-expanded={expanded} aria-controls={whoId} onClick={() => setExpanded((x) => !x)}>
          {SCHEDULE_ANSWERS.map((a) => (
            <span key={a} className={`is-${a}`}>
              {SCHEDULE_ANSWER_LABEL[a]} {slot.counts[a]}
            </span>
          ))}
          <svg className="schedule-caret" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
            <path d="M3 4.5l3 3 3-3" />
          </svg>
          <span className="visually-hidden">{expanded ? '收起' : '看是谁'}</span>
        </button>
      </div>
      <div id={whoId} hidden={!expanded}>
        {expanded && <Who slot={slot} />}
      </div>
      <div className="schedule-slot-actions">
        <div className="schedule-answers" role="group" aria-label={`${time} 能不能来`}>
          {SCHEDULE_ANSWERS.map((a) => (
            <button
              key={a}
              type="button"
              className={`schedule-answer is-${a}`}
              aria-pressed={slot.mine === a}
              disabled={busy || past}
              onClick={() => onVote(slot.mine === a ? null : a)}
            >
              {SCHEDULE_ANSWER_LABEL[a]}
            </button>
          ))}
        </div>
        {isHost &&
          (confirming ? (
            <span className="schedule-confirm">
              <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={onConfirm}>
                确认定下
              </button>
              <button type="button" className="btn btn-small btn-quiet" onClick={onUnconfirm}>
                算了
              </button>
            </span>
          ) : (
            <button type="button" className="btn btn-small" disabled={busy || past} onClick={onConfirm}>
              定下
            </button>
          ))}
      </div>
    </li>
  );
}

/** 一个时间谁能来、谁也许、谁来不了。 */
function Who({ slot }: { slot: ScheduleSlot }) {
  if (!slot.votes.length) return <p className="schedule-who-empty">还没有人勾</p>;
  return (
    <dl className="schedule-who">
      {SCHEDULE_ANSWERS.map((a) => {
        const names = slot.votes.filter((v) => v.answer === a).map((v) => v.user.displayName);
        return names.length ? (
          <div key={a}>
            <dt className={`is-${a}`}>{SCHEDULE_ANSWER_LABEL[a]}</dt>
            <dd>{names.join('、')}</dd>
          </div>
        ) : null;
      })}
    </dl>
  );
}

/** datetime-local 输入框要的本地时间：2026-10-30T20:00。 */
function localInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 新加一个时间默认填什么：上一个的第二天同一时间；没有就是明天晚上 8 点。 */
function nextDefault(serverNow: number, previous: string | undefined): string {
  const prev = previous ? new Date(previous).getTime() : NaN;
  const d = new Date(Number.isNaN(prev) ? serverNow : prev);
  d.setDate(d.getDate() + 1);
  if (Number.isNaN(prev)) d.setHours(20, 0, 0, 0);
  return localInput(d.getTime());
}

/** 房主列时间：1～6 个，附一句话（可以不写）。发出以后原来的作废。 */
function ScheduleForm({
  roomId,
  offset,
  onBack,
  onSent,
}: {
  roomId: number;
  offset: number;
  onBack: (() => void) | null;
  onSent: (r: ScheduleResponse) => void;
}) {
  const [times, setTimes] = useState<string[]>(() => [nextDefault(Date.now() + offset, undefined)]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const baseId = useId();
  const serverNow = Date.now() + offset;
  const min = localInput(serverNow + SCHEDULE_MIN_LEAD_MS + 60_000);
  const max = localInput(serverNow + SCHEDULE_MAX_AHEAD_MS);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const at = Date.now() + offset;
    const slots = times.map((v) => (v ? new Date(v).getTime() : NaN));
    let problem = '';
    if (slots.some((x) => Number.isNaN(x))) problem = '每个时间都要填好';
    else if (new Set(slots.map((x) => Math.floor(x / 60_000))).size !== slots.length) problem = '有两个时间一样，删掉一个';
    else if (slots.some((x) => x < at + SCHEDULE_MIN_LEAD_MS)) problem = '每个时间都要比现在晚至少 10 分钟';
    else if (slots.some((x) => x > at + SCHEDULE_MAX_AHEAD_MS)) problem = '时间要在 60 天以内';
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      onSent(await api<ScheduleResponse>('POST', `/api/rooms/${roomId}/schedule`, { slots, note }));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form className="schedule-form" onSubmit={submit} noValidate>
      <ol className="schedule-form-slots">
        {times.map((value, i) => (
          <li key={i} className="schedule-form-row">
            <input
              type="datetime-local"
              id={`${baseId}-${i}`}
              aria-label={`第 ${i + 1} 个时间`}
              value={value}
              min={min}
              max={max}
              onChange={(e) => setTimes((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
            />
            {times.length > 1 && (
              <button type="button" className="btn btn-small btn-quiet" aria-label={`删掉第 ${i + 1} 个时间`} onClick={() => setTimes((list) => list.filter((_, j) => j !== i))}>
                删掉
              </button>
            )}
          </li>
        ))}
      </ol>
      {times.length < SCHEDULE_MAX_SLOTS && (
        <button type="button" className="btn btn-small schedule-add" onClick={() => setTimes((list) => [...list, nextDefault(Date.now() + offset, list[list.length - 1])])}>
          加一个时间
        </button>
      )}
      <div className="field">
        <label htmlFor={`${baseId}-note`}>附言</label>
        <input id={`${baseId}-note`} maxLength={SCHEDULE_NOTE_MAX} value={note} placeholder="可以不写" onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? '正在发出……' : '发出'}
        </button>
        {onBack && (
          <button type="button" className="btn btn-quiet" onClick={onBack}>
            返回
          </button>
        )}
      </div>
    </form>
  );
}

/** 「我的对局」每一局下面：有要我勾的「约时间」，定下了的「下次 10月30日 周五 20:00」。 */
export function MyRoomSchedule({ info }: { info: ScheduleMine | undefined }) {
  if (!info) return null;
  const upcoming = info.startsAt !== null && Date.now() < info.startsAt + SCHEDULE_PAST_AFTER_MS ? info.startsAt : null;
  if (upcoming === null && !info.needsVote) return null;
  return (
    <span className="room-row-todo schedule-row">
      {info.needsVote && <span className="schedule-mark">约时间</span>}
      {upcoming !== null && (
        <span className="schedule-next-mini">
          <CalendarIcon />
          下次 {scheduleTimeText(upcoming)}
        </span>
      )}
    </span>
  );
}
