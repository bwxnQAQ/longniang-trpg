import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { api, errorMessage, type AdminScenario, type AdminSubmission, type ScenarioSummary } from '../../api';
import { AiReviewBox, rejectReasonFrom } from '../../components/AiReview';
import { Field } from '../../components/bits';
import { profilePath } from '../../components/people';
import { formatDateTime, saveFile } from '../../format';
import { refreshBadges } from '../../live';
import { Link } from '../../router';
import { CATEGORY_NAME, RELATION_LABEL } from '../../../../shared/game';
import { REJECT_REASON_MAX, SUBMISSION_STATUS_LABEL } from '../../../../shared/works';
import { CategoryTag } from '../../components/Category';
import { ErrorLine } from './common';

// ==================== 剧本 ====================

const scenarioMeta = (s: ScenarioSummary) =>
  `${s.category ? `${CATEGORY_NAME[s.category]} · ` : ''}${s.genre} · ${s.players.min === s.players.max ? s.players.max : `${s.players.min}～${s.players.max}`}人 · 预计${s.expectedDays}天 · ${RELATION_LABEL[s.relation]}`;

/** 上传的文件名变成剧本的文件名：小写字母、数字、短横线，变不出来就用 custom- 加一串字母数字。 */
function keyFromFileName(name: string): string {
  const base = name
    .replace(/\.json$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return /^[a-z0-9]/.test(base) ? base : `custom-${Date.now().toString(36)}`;
}

type PendingUpload = { fileName: string; data: unknown; title: string; key: string };

export function ScenariosTab() {
  const [list, setList] = useState<AdminScenario[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setList((await api<{ scenarios: AdminScenario[] }>('GET', '/api/admin/scenarios')).scenarios);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(work: () => Promise<{ scenarios: AdminScenario[] }>) {
    setBusy(true);
    setError('');
    try {
      setList((await work()).scenarios);
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const title = (s: AdminScenario) => (s.summary ? `《${s.summary.title}》` : s.key);

  function setHidden(s: AdminScenario, hidden: boolean) {
    if (hidden && !window.confirm(`下架${title(s)}？下架以后建对局时选不到它，已经选了它的对局照常玩。`)) return;
    void run(() => api('PUT', `/api/admin/scenarios/${s.key}/hidden`, { hidden }));
  }

  function remove(s: AdminScenario) {
    if (!window.confirm(`删除${title(s)}？删除以后建对局时选不到它，已经选了它的对局照常玩。`)) return;
    void run(() => api('DELETE', `/api/admin/scenarios/${s.key}`)).then((ok) => {
      if (ok && open === s.key) setOpen(null);
    });
  }

  async function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    let data: unknown;
    try {
      data = JSON.parse((await file.text()).replace(/^﻿/, ''));
    } catch {
      setError('这个文件不是剧本文件（JSON 格式不对）');
      return;
    }
    const t = typeof data === 'object' && data !== null && typeof (data as { title?: unknown }).title === 'string' ? (data as { title: string }).title : '';
    setPending({ fileName: file.name, data, title: t, key: keyFromFileName(file.name) });
  }

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pending) return;
    const key = pending.key.trim().toLowerCase();
    const same = list?.find((s) => s.key === key && !s.builtin);
    if (same && !window.confirm(`已经有同名的剧本${title(same)}，用这个文件替换它？`)) return;
    const ok = await run(() => api('POST', '/api/admin/scenarios', { key, data: pending.data, replace: !!same }));
    if (ok) setPending(null);
  }

  return (
    <section className="section" aria-label="剧本">
      <SubmissionsReview onPublished={() => void load()} />
      <h2 className="section-title">剧本大厅里的剧本</h2>
      <ErrorLine error={error} />
      <div className="host-buttons">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => fileRef.current?.click()}>
          上传剧本
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void pickFile(e)} />
      </div>

      {pending && (
        <div className="callout scenario-upload">
          <p>{pending.title ? `《${pending.title}》` : pending.fileName}</p>
          <form className="inline-form" onSubmit={(e) => void upload(e)} aria-label="上传剧本">
            <Field label="文件名" htmlFor="scenario-key">
              <input id="scenario-key" maxLength={60} value={pending.key} onChange={(e) => setPending({ ...pending, key: e.target.value })} />
            </Field>
            <button className="btn btn-primary" disabled={busy || !pending.key.trim()}>
              {busy ? '正在检查……' : '上传'}
            </button>
            <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => setPending(null)}>
              取消
            </button>
          </form>
        </div>
      )}

      {list === null && !error && <p className="muted">正在读取……</p>}
      {list?.length === 0 && <p className="empty">还没有剧本。</p>}
      {list && list.length > 0 && (
        <ul className="scenario-admin-list">
          {list.map((s) => (
            <ScenarioRow
              key={s.key}
              scenario={s}
              open={open === s.key}
              busy={busy}
              onToggle={() => setOpen(open === s.key ? null : s.key)}
              onHidden={(hidden) => setHidden(s, hidden)}
              onRemove={() => remove(s)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ScenarioRow({
  scenario: s,
  open,
  busy,
  onToggle,
  onHidden,
  onRemove,
}: {
  scenario: AdminScenario;
  open: boolean;
  busy: boolean;
  onToggle: () => void;
  onHidden: (hidden: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <li className={s.hidden || !s.summary ? 'is-dim' : ''}>
      <div className="scenario-admin-head">
        <div>
          <strong className="scenario-admin-title">{s.summary ? `《${s.summary.title}》` : s.key}</strong>
          <p className="muted">{s.summary ? scenarioMeta(s.summary) : `文件有错误：${s.errors.join('；')}`}</p>
          <p className="scenario-admin-state">
            {s.builtin ? '自带' : '上传的'}
            {!s.builtin && s.summary?.author && ` · 作者 ${s.summary.author}`} · {s.hidden ? '已下架' : s.summary ? '上架中' : '用不了'} · 用过 {s.usedBy} 局
          </p>
        </div>
        <div className="scenario-admin-actions">
          <button type="button" className="btn btn-small btn-quiet" aria-expanded={open} onClick={onToggle}>
            {open ? '收起' : '查看'}
          </button>
          <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => onHidden(!s.hidden)}>
            {s.hidden ? '上架' : '下架'}
          </button>
          {!s.builtin && (
            <button type="button" className="btn btn-small btn-quiet btn-danger-text" disabled={busy} onClick={onRemove}>
              删除
            </button>
          )}
        </div>
      </div>
      {open && <ScenarioDetail scenarioKey={s.key} />}
    </li>
  );
}

type FullScenario = {
  title: string;
  opening: { background: string; situation: string };
  roles: { key: string; name: string; public: string; secret: string; goal: string }[];
  truth: { summary: string };
  endings: { key: string; title: string; condition: string }[];
};

/**
 * 投稿审核（V0.5.0）：等审核的投稿，看全文、通过（放进剧本大厅，写着作者）、不通过（写原因）。
 * 审核过的折起来放在下面。
 */
function SubmissionsReview({ onPublished }: { onPublished: () => void }) {
  const [list, setList] = useState<AdminSubmission[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      setList((await api<{ submissions: AdminSubmission[] }>('GET', '/api/admin/submissions')).submissions);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(s: AdminSubmission, approve: boolean) {
    if (approve && !window.confirm(`通过《${s.title}》？会放进剧本大厅，写着作者是${s.author.displayName}。`)) return;
    setBusy(true);
    setError('');
    try {
      const r = await api<{ submissions: AdminSubmission[] }>(
        'POST',
        `/api/admin/submissions/${s.id}/${approve ? 'approve' : 'reject'}`,
        approve ? undefined : { reason },
      );
      setList(r.submissions);
      setRejecting(null);
      setReason('');
      if (open === s.id) setOpen(null);
      if (approve) onPublished();
      void refreshBadges();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (list === null) return error ? <ErrorLine error={error} /> : <p className="muted">正在读取……</p>;
  const pending = list.filter((s) => s.status === 'pending');
  const done = list.filter((s) => s.status !== 'pending');
  const who = (s: AdminSubmission) => (s.author.deleted ? s.author.displayName : `${s.author.displayName}${s.author.uid !== null ? `（UID ${s.author.uid}）` : ''}`);
  return (
    <div className="submissions-review">
      <h2 className="section-title">投稿</h2>
      <ErrorLine error={error} />
      {pending.length === 0 && <p className="empty">没有等审核的投稿。</p>}
      {pending.length > 0 && (
        <ul className="scenario-admin-list">
          {pending.map((s) => (
            <li key={s.id}>
              <div className="scenario-admin-head">
                <div>
                  <strong className="scenario-admin-title">《{s.title}》</strong> <CategoryTag category={s.category} />
                  <p className="muted">
                    {s.author.deleted ? (
                      who(s)
                    ) : (
                      <Link to={profilePath(s.author.publicId)}>{who(s)}</Link>
                    )}{' '}
                    · {formatDateTime(s.createdAt)} 投稿
                  </p>
                  <p className="submission-intro">{s.intro}</p>
                  <AiReviewBox target="submission" id={s.id} review={s.aiReview} />
                </div>
                <div className="scenario-admin-actions">
                  <button type="button" className="btn btn-small btn-quiet" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>
                    {open === s.id ? '收起' : '看全文'}
                  </button>
                  <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void decide(s, true)}>
                    通过
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-quiet"
                    disabled={busy}
                    aria-expanded={rejecting === s.id}
                    onClick={() => {
                      setRejecting(rejecting === s.id ? null : s.id);
                      setReason('');
                    }}
                  >
                    不通过
                  </button>
                </div>
              </div>
              {rejecting === s.id && (
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void decide(s, false);
                  }}
                >
                  <Field label="原因" htmlFor={`reject-${s.id}`}>
                    <input id={`reject-${s.id}`} maxLength={REJECT_REASON_MAX} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
                  </Field>
                  {rejectReasonFrom(s.aiReview, REJECT_REASON_MAX) && !reason && (
                    <button type="button" className="btn btn-small btn-quiet" onClick={() => setReason(rejectReasonFrom(s.aiReview, REJECT_REASON_MAX))}>
                      用 AI 写的问题
                    </button>
                  )}
                  <button className="btn btn-small btn-danger" disabled={busy || !reason.trim()}>
                    不通过
                  </button>
                </form>
              )}
              {open === s.id && <SubmissionDetail id={s.id} />}
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <details className="submissions-done">
          <summary>审核过的（{done.length}）</summary>
          <ul className="plain-list">
            {done.map((s) => (
              <li key={s.id}>
                《{s.title}》 <CategoryTag category={s.category} />
                {who(s)} · {SUBMISSION_STATUS_LABEL[s.status]}
                {s.reviewer && ` · ${s.reviewer} 在 ${formatDateTime(s.reviewedAt ?? s.createdAt)} 审核`}
                {s.status === 'rejected' && s.reason && ` · 原因：${s.reason}`}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function SubmissionDetail({ id }: { id: number }) {
  const [data, setData] = useState<{ scenario: FullScenario | null } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ scenario: FullScenario | null }>('GET', `/api/admin/submissions/${id}`)
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, [id]);
  if (error) return <ErrorLine error={error} />;
  if (!data) return <p className="muted">正在读取……</p>;
  if (!data.scenario) return <p className="form-error">这份剧本读不出来。</p>;
  return <ScenarioFull s={data.scenario} fileName={`submission-${id}.json`} />;
}

function ScenarioDetail({ scenarioKey }: { scenarioKey: string }) {
  const [data, setData] = useState<{ scenario: FullScenario | null; errors: string[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ scenario: FullScenario | null; errors: string[] }>('GET', `/api/admin/scenarios/${scenarioKey}`)
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, [scenarioKey]);

  if (error) return <ErrorLine error={error} />;
  if (!data) return <p className="muted">正在读取……</p>;
  const s = data.scenario;
  if (!s) {
    return (
      <ul className="plain-list">
        {data.errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    );
  }
  return <ScenarioFull s={s} fileName={`${scenarioKey}.json`} />;
}

/** 一个剧本的全文（包括真相、各个身份的秘密）：管理员看剧本、审投稿时用。 */
function ScenarioFull({ s, fileName }: { s: FullScenario; fileName: string }) {
  return (
    <div className="scenario-detail">
      <h3>背景</h3>
      <p className="pre-line">{s.opening.background}</p>
      <p className="pre-line">{s.opening.situation}</p>
      <div className="callout">
        <strong>真相</strong>
        <p className="pre-line">{s.truth.summary}</p>
      </div>
      <h3>身份</h3>
      <ul className="plain-list">
        {s.roles.map((r) => (
          <li key={r.key}>
            <strong>{r.name}</strong>：{r.public}
            <br />
            秘密：{r.secret}
            <br />
            目标：{r.goal}
          </li>
        ))}
      </ul>
      <h3>结局</h3>
      <ul className="plain-list">
        {s.endings.map((e) => (
          <li key={e.key}>
            <strong>{e.title}</strong>：{e.condition}
          </li>
        ))}
      </ul>
      <div className="host-buttons">
        <button type="button" className="btn btn-small" onClick={() => saveFile(fileName, JSON.stringify(s, null, 2), 'application/json')}>
          下载剧本文件
        </button>
      </div>
      <details>
        <summary>完整剧本（JSON）</summary>
        <pre className="json-block">{JSON.stringify(s, null, 2)}</pre>
      </details>
    </div>
  );
}
