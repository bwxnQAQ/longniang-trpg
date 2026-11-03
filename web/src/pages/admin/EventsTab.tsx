import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { EVENT_NAME_MAX, EVENT_TEMPLATES, EVENT_TITLE_MAX, type EventView } from '../../../../shared/events';
import { CATEGORY_NAME, SCENARIO_CATEGORIES, type ScenarioCategory } from '../../../../shared/game';
import { EVENT_ITEMS, shopItemOf } from '../../../../shared/pets';
import { api, errorMessage } from '../../api';
import { Field } from '../../components/bits';
import { formatDateTime, pad } from '../../format';

// 管理页「活动」（V0.6.0，要「发放额度」权限）：开、改、删限时活动。活动期间选中分区的剧本玩完龙晶翻倍、
// 商店卖选中的限时商品、玩完能得活动称号。模板点一下填好名字、分区、商品、称号，时间自己改。

type Draft = { name: string; start: string; end: string; categories: ScenarioCategory[]; items: string[]; title: string };

/** 毫秒 → datetime-local 输入框要的本地时间。 */
function toLocal(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyDraft(now: number): Draft {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 1);
  return { name: '', start: toLocal(start.getTime()), end: toLocal(start.getTime() + 7 * 86_400_000), categories: [], items: [], title: '' };
}

function phase(e: EventView, now: number): string {
  if (now < e.startsAt) return '还没开始';
  if (now >= e.endsAt) return '结束了';
  return '进行中';
}

export function EventsTab() {
  const [events, setEvents] = useState<EventView[] | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  /** 正在编辑的活动编号（新开的是 0）；null 是没在编辑。 */
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(Date.now()));
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api<{ events: EventView[]; now: number }>('GET', '/api/admin/limited-events');
      setEvents(r.events);
      setNow(r.now);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startNew() {
    setDraft(emptyDraft(now));
    setEditing(0);
    setError('');
  }

  function startEdit(e: EventView) {
    setDraft({ name: e.name, start: toLocal(e.startsAt), end: toLocal(e.endsAt), categories: e.categories, items: e.items, title: e.title });
    setEditing(e.id);
    setError('');
  }

  async function save(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setBusy(true);
    setError('');
    const body = {
      name: draft.name,
      startsAt: new Date(draft.start).getTime(),
      endsAt: new Date(draft.end).getTime(),
      categories: draft.categories,
      items: draft.items,
      title: draft.title,
    };
    try {
      const r = await api<{ events: EventView[]; now: number }>(editing ? 'PUT' : 'POST', editing ? `/api/admin/limited-events/${editing}` : '/api/admin/limited-events', body);
      setEvents(r.events);
      setNow(r.now);
      setEditing(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(e: EventView) {
    if (!window.confirm(`删掉活动「${e.name}」？已经得到的活动称号和限时商品不会收回。`)) return;
    try {
      const r = await api<{ events: EventView[]; now: number }>('DELETE', `/api/admin/limited-events/${e.id}`);
      setEvents(r.events);
      setNow(r.now);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <section className="section events-tab" aria-label="活动">
      {editing === null ? (
        <p>
          <button type="button" className="btn btn-primary btn-small" onClick={startNew}>
            开一个活动
          </button>
        </p>
      ) : (
        <form className="panel form event-form" onSubmit={(e) => void save(e)} noValidate>
          <h2>{editing ? '改活动' : '开一个活动'}</h2>
          {editing === 0 && (
            <div className="event-templates">
              {EVENT_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className="btn btn-small btn-quiet"
                  onClick={() => setDraft((d) => ({ ...d, name: t.name, categories: t.categories, items: t.items, title: t.title }))}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
          <Field label="名字" htmlFor="event-name">
            <input id="event-name" maxLength={EVENT_NAME_MAX} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <div className="event-times">
            <Field label="开始" htmlFor="event-start">
              <input id="event-start" type="datetime-local" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
            </Field>
            <Field label="结束" htmlFor="event-end">
              <input id="event-end" type="datetime-local" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
            </Field>
          </div>
          <fieldset className="event-choices">
            <legend>龙晶翻倍的分区</legend>
            {SCENARIO_CATEGORIES.map((c) => (
              <label key={c.key} className="choice">
                <input type="checkbox" checked={draft.categories.includes(c.key)} onChange={() => setDraft({ ...draft, categories: toggle(draft.categories, c.key) })} />
                <span>{c.name}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="event-choices">
            <legend>限时商品</legend>
            {EVENT_ITEMS.map((k) => (
              <label key={k} className="choice">
                <input type="checkbox" checked={draft.items.includes(k)} onChange={() => setDraft({ ...draft, items: toggle(draft.items, k) })} />
                <span>{shopItemOf(k)?.name ?? k}</span>
              </label>
            ))}
          </fieldset>
          <Field label="活动称号（选填）" htmlFor="event-title">
            <input id="event-title" maxLength={EVENT_TITLE_MAX} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="btn btn-primary btn-small" disabled={busy}>
              保存
            </button>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => setEditing(null)}>
              取消
            </button>
          </div>
        </form>
      )}
      {editing === null && error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {events === null ? (
        <p className="muted">正在加载……</p>
      ) : events.length === 0 ? (
        <p className="empty">还没有活动。</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">活动</th>
                <th scope="col">时间</th>
                <th scope="col">翻倍分区</th>
                <th scope="col">限时商品</th>
                <th scope="col">称号</th>
                <th scope="col">
                  <span className="visually-hidden">操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.name} <span className="tag">{phase(e, now)}</span>
                  </td>
                  <td className="nowrap">
                    {formatDateTime(e.startsAt)} 到 {formatDateTime(e.endsAt)}
                  </td>
                  <td>{e.categories.map((c) => CATEGORY_NAME[c]).join('、') || '—'}</td>
                  <td>{e.items.map((i) => shopItemOf(i)?.name ?? i).join('、') || '—'}</td>
                  <td>{e.title ? `「${e.title}」` : '—'}</td>
                  <td className="row-actions">
                    <button type="button" className="btn btn-small btn-quiet" onClick={() => startEdit(e)}>
                      改
                    </button>
                    <button type="button" className="btn btn-small btn-quiet btn-danger-text" onClick={() => void remove(e)}>
                      删
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
