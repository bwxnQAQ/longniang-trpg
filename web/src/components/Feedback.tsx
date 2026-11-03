import { useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage, type ReportKind, type ReportTarget } from '../api';
import { recentErrors } from '../errors';
import { Modal } from './Modal';
import { APP_VERSION_LABEL } from '../version';

// 反馈问题：报告 bug、给管理员提意见、举报某个人或某条消息。页面底部、头像菜单、消息旁边的「举报」都打开它。

export type FeedbackOptions = {
  kind?: ReportKind;
  /** 举报某条消息：类型、编号，和给用户看的原文。 */
  target?: ReportTarget & { preview: string; author: string };
  /** 举报某个人（个人主页上）：他的公开编号和名字。 */
  user?: string;
  displayName?: string;
};

const OPEN_EVENT = 'feedback:open';

export function openFeedback(options: FeedbackOptions = {}) {
  window.dispatchEvent(new CustomEvent<FeedbackOptions>(OPEN_EVENT, { detail: options }));
}

const MAX = 1000;

/** 放在页面最外层，等着别处叫它打开。 */
export function FeedbackHost() {
  const [options, setOptions] = useState<FeedbackOptions | null>(null);
  useEffect(() => {
    const open = (e: Event) => setOptions((e as CustomEvent<FeedbackOptions>).detail);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);
  const reporting = !!options && (options.kind === 'report' || !!options.target || !!options.user);
  return (
    <Modal open={options !== null} onClose={() => setOptions(null)} title={reporting ? '举报' : '反馈问题'}>
      {options && <FeedbackForm key={JSON.stringify(options)} options={options} onDone={() => setOptions(null)} />}
    </Modal>
  );
}

function FeedbackForm({ options, onDone }: { options: FeedbackOptions; onDone: () => void }) {
  const reporting = options.kind === 'report' || !!options.target || !!options.user;
  const [kind, setKind] = useState<ReportKind>(reporting ? 'report' : (options.kind ?? 'bug'));
  const [body, setBody] = useState('');
  const [steps, setSteps] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const errors = recentErrors();
  const context = {
    page: location.pathname,
    screen: `${window.innerWidth}x${window.innerHeight}`,
    version: APP_VERSION_LABEL,
    errors,
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) {
      setError(kind === 'bug' ? '写一下发生了什么' : kind === 'report' ? '写一下举报的原因' : '写一下想说的话');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('POST', '/api/reports', {
        kind,
        body,
        ...(kind === 'bug' ? { steps, context } : {}),
        ...(kind === 'report' && options.target ? { target: { type: options.target.type, id: options.target.id } } : {}),
        ...(kind === 'report' && options.user ? { user: options.user } : {}),
      });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="feedback-done" role="status">
        <p>已经提交了。</p>
        <div className="form-actions">
          <button type="button" className="btn btn-primary" onClick={onDone} autoFocus>
            好的
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="form feedback-form" onSubmit={submit} noValidate>
      {!reporting && (
        <div className="picker-tabs" role="tablist" aria-label="反馈的类型">
          {(
            [
              ['bug', '报告 bug'],
              ['feedback', '提意见'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" role="tab" className="picker-tab" aria-selected={kind === k} onClick={() => setKind(k)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {kind === 'report' && options.target && (
        <blockquote className="feedback-quote">
          <cite>{options.target.author}</cite>
          <p>{options.target.preview}</p>
        </blockquote>
      )}
      {kind === 'report' && options.user && !options.target && (
        <p>
          举报 <strong>{options.displayName}</strong>
        </p>
      )}

      <div className="field">
        <label htmlFor="feedback-body">{kind === 'bug' ? '发生了什么' : kind === 'report' ? '举报的原因' : '想对管理员说的话'}</label>
        <textarea id="feedback-body" rows={4} maxLength={MAX} value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
      </div>

      {kind === 'bug' && (
        <>
          <div className="field">
            <label htmlFor="feedback-steps">怎么出现的（选填）</label>
            <textarea id="feedback-steps" rows={3} maxLength={MAX} value={steps} onChange={(e) => setSteps(e.target.value)} />
          </div>
          <details className="feedback-context">
            <summary>会一起发送的信息</summary>
            <dl className="compact-facts">
              <dt>页面</dt>
              <dd>{context.page}</dd>
              <dt>窗口大小</dt>
              <dd>{context.screen}</dd>
              <dt>版本</dt>
              <dd>{context.version}</dd>
              <dt>浏览器</dt>
              <dd>浏览器的型号和版本</dd>
              <dt>最近的报错</dt>
              {/* 同一条报错可能隔着别的又出现一次（只去掉了紧挨着的重复），key 用位置 */}
              <dd>{errors.length ? errors.map((e, i) => <code key={i}>{e}</code>) : '没有'}</dd>
            </dl>
          </details>
        </>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? '正在提交……' : '提交'}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onDone}>
          取消
        </button>
      </div>
    </form>
  );
}
