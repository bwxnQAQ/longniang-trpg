import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { GUIDE_QUESTION_MAX, type GuidePage } from '../../../shared/guide';
import { api, errorMessage } from '../api';

// 网站向导（V0.6.0）：页面最下面的「向导」打开，问关于这个网站的事（怎么玩、功能在哪、规则、额度、宠物……）。
// 正式用户才有；花自己的 AI 额度。对话存在服务器上，换个设备打开也在。

const OPEN_EVENT = 'guide:open';

export function openGuide() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function GuideHost() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);
  if (!open) return null;
  return <GuidePanel onClose={() => setOpen(false)} />;
}

function GuidePanel({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState<GuidePage | null>(null);
  const [question, setQuestion] = useState('');
  /** 刚问出去、还没回答的问题（先显示出来）。 */
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api<GuidePage>('GET', '/api/guide')
      .then(setPage)
      .catch((err) => setError(errorMessage(err)));
    inputRef.current?.focus();
  }, []);

  // 新的对话出来了：滚到最下面
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [page?.messages.length, pending]);

  // Esc 关掉
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function ask() {
    const q = question.trim();
    if (!q || pending) return;
    setPending(q);
    setQuestion('');
    setError('');
    try {
      setPage(await api<GuidePage>('POST', '/api/guide', { question: q }));
    } catch (err) {
      setError(errorMessage(err));
      setQuestion(q);
    } finally {
      setPending(null);
    }
  }

  async function clear() {
    if (!window.confirm('清空和向导的对话？')) return;
    try {
      setPage(await api<GuidePage>('DELETE', '/api/guide'));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void ask();
    }
  }

  const messages = page?.messages ?? [];
  return (
    <section className="guide-panel" role="dialog" aria-label="网站向导">
      <header className="guide-head">
        <h2>向导</h2>
        {messages.length > 0 && (
          <button type="button" className="btn btn-small btn-quiet" onClick={() => void clear()}>
            清空
          </button>
        )}
        <button type="button" className="btn btn-small btn-quiet" onClick={onClose} aria-label="关掉向导">
          关
        </button>
      </header>
      <ol className="guide-messages" ref={listRef} aria-live="polite">
        {messages.length === 0 && !pending && <li className="guide-msg guide-msg-assistant">想知道这个网站怎么玩、哪里能找到什么，问我就行。</li>}
        {messages.map((m) => (
          <li key={m.id} className={`guide-msg guide-msg-${m.role}`}>
            {m.text}
          </li>
        ))}
        {pending && (
          <>
            <li className="guide-msg guide-msg-user">{pending}</li>
            <li className="guide-msg guide-msg-assistant guide-msg-thinking">
              <span className="thinking-dot" aria-hidden="true" />
              正在想……
            </li>
          </>
        )}
      </ol>
      {page && !page.ready && <p className="guide-off">{page.message ?? 'AI 暂时用不了'}</p>}
      {error && (
        <p className="form-error guide-error" role="alert">
          {error}
        </p>
      )}
      <form
        className="guide-form"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <textarea
          ref={inputRef}
          rows={2}
          aria-label="问向导"
          maxLength={GUIDE_QUESTION_MAX}
          value={question}
          disabled={!!page && !page.ready}
          placeholder="问点什么"
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="btn btn-primary btn-small" disabled={!question.trim() || !!pending || (!!page && !page.ready)}>
          问
        </button>
      </form>
    </section>
  );
}
