import { useCallback, useEffect, useState } from 'react';
import { FEEDBACK_MAX } from '../../../shared/works';
import { api, errorMessage, type AuthorWork, type FeedbackView } from '../api';
import { CategoryTag } from '../components/Category';
import { openFeedback } from '../components/Feedback';
import { profilePath } from '../components/people';
import { Stars } from '../components/Stars';
import { formatDate, formatDateTime } from '../format';
import { Link } from '../router';

// 剧本大厅的「我的作品」（V0.6.0），和剧本详情里「给作者的反馈」。排行 V0.7.0 挪到「排行」页（Rankings.tsx）。

// ==================== 我的作品 ====================

export function MyWorks() {
  const [works, setWorks] = useState<AuthorWork[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setWorks((await api<{ works: AuthorWork[] }>('GET', '/api/my-works')).works);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="form-error">{error}</p>;
  if (!works) return <p className="muted">正在加载……</p>;
  if (works.length === 0) return <p className="empty">还没有作品放进剧本大厅。</p>;
  return (
    <ul className="my-works">
      {works.map((w) => (
        <WorkCard key={w.key} work={w} onChanged={(list) => (list ? setWorks(list) : void load())} />
      ))}
    </ul>
  );
}

function WorkCard({ work: w, onChanged }: { work: AuthorWork; onChanged: (list: AuthorWork[] | null) => void }) {
  const maxEnding = Math.max(1, ...w.endings.map((e) => e.count));
  const comments = w.comments.filter((c) => c.comment || c.commentDeleted);
  return (
    <li className={`my-work spine-${w.category ?? 'none'}`}>
      <div className="my-work-head">
        <h2 className="shelf-title">《{w.title}》</h2>
        <CategoryTag category={w.category} />
        {!w.listed && <span className="tag">已下架</span>}
        <span className="muted">{formatDate(w.publishedAt)} 上架</span>
      </div>
      <dl className="work-stats">
        <div>
          <dt>评分</dt>
          <dd>
            <Stars value={w.rating.average} count={w.rating.count} />
          </dd>
        </div>
        <div>
          <dt>开过</dt>
          <dd>{w.plays} 局</dd>
        </div>
        <div>
          <dt>玩完</dt>
          <dd>
            {w.finishes} 局{w.players > 0 && <span className="muted">（{w.players} 人次）</span>}
          </dd>
        </div>
      </dl>
      {w.endings.length > 0 && (
        <section className="work-endings" aria-label="结局分布">
          <h3 className="pet-subhead">结局分布</h3>
          <ul className="ending-bars">
            {w.endings.map((e) => (
              <li key={e.title}>
                <span className="ending-bar-title">「{e.title}」</span>
                <span className="ending-bar" aria-hidden="true">
                  <span style={{ width: `${(e.count / maxEnding) * 100}%` }} />
                </span>
                <span className="ending-bar-count">{e.count} 局</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="work-comments" aria-label="短评">
        <h3 className="pet-subhead">短评</h3>
        {comments.length === 0 ? (
          <p className="muted">还没有短评。</p>
        ) : (
          <ul className="rating-list">
            {comments.map((c) => (
              <li key={c.id} className="rating">
                <span className="rating-stars" aria-label={`${c.stars} 星`}>
                  {'★'.repeat(c.stars)}
                </span>
                <Link to={profilePath(c.author.publicId)} className="rating-who">
                  {c.author.displayName}
                </Link>
                <span className="rating-text">{c.commentDeleted ? <span className="muted">（短评被管理员删了）</span> : c.comment}</span>
                <span className="muted rating-at">{formatDate(c.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="work-feedback" aria-label="收到的反馈">
        <h3 className="pet-subhead">收到的反馈</h3>
        {w.feedback.length === 0 ? (
          <p className="muted">还没有人写反馈。</p>
        ) : (
          <ul className="feedback-list">
            {w.feedback.map((f) => (
              <FeedbackItem key={f.id} feedback={f} onChanged={onChanged} />
            ))}
          </ul>
        )}
      </section>
    </li>
  );
}

/** 作者看一条反馈：回复（能改）、删掉、举报给管理员。 */
function FeedbackItem({ feedback: f, onChanged }: { feedback: FeedbackView; onChanged: (list: AuthorWork[] | null) => void }) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState(f.reply ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function reply() {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ works: AuthorWork[] }>('PUT', `/api/feedback/${f.id}/reply`, { text });
      setReplying(false);
      onChanged(r.works);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('删掉这条反馈？')) return;
    try {
      await api('DELETE', `/api/feedback/${f.id}`);
      onChanged(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <li className="feedback-item">
      <p className="feedback-head">
        {f.from ? (
          <Link to={profilePath(f.from.publicId)} className="feedback-who">
            {f.from.displayName}
          </Link>
        ) : (
          <span>有人</span>
        )}
        <span className="muted">{formatDateTime(f.at)}</span>
      </p>
      <p className="feedback-text pre-line">{f.text}</p>
      {f.reply && !replying && (
        <p className="feedback-reply pre-line">
          <span className="muted">你的回复：</span>
          {f.reply}
        </p>
      )}
      {replying ? (
        <form
          className="feedback-form"
          onSubmit={(e) => {
            e.preventDefault();
            void reply();
          }}
        >
          <textarea aria-label="回复" rows={2} maxLength={FEEDBACK_MAX} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          <div className="form-actions">
            <button className="btn btn-small btn-primary" disabled={busy || !text.trim()}>
              回复
            </button>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => setReplying(false)}>
              取消
            </button>
          </div>
        </form>
      ) : (
        <p className="feedback-actions">
          <button type="button" className="linklike" onClick={() => setReplying(true)}>
            {f.reply ? '改回复' : '回复'}
          </button>
          <button type="button" className="linklike" onClick={() => void remove()}>
            删除
          </button>
          {f.from && (
            <button
              type="button"
              className="linklike btn-danger-text"
              onClick={() => openFeedback({ kind: 'report', target: { type: 'feedback', id: f.id, preview: f.text, author: f.from!.displayName } })}
            >
              举报
            </button>
          )}
        </p>
      )}
      {error && <p className="form-error">{error}</p>}
    </li>
  );
}

// ==================== 给作者的反馈（玩过的人看的） ====================

export function FeedbackToAuthor({
  scenarioKey,
  authorName,
  canSend,
  mine: initial,
}: {
  scenarioKey: string;
  authorName: string;
  canSend: boolean;
  mine: FeedbackView[];
}) {
  const [mine, setMine] = useState(initial);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function send() {
    setBusy(true);
    setError('');
    try {
      setMine((await api<{ mine: FeedbackView[] }>('POST', `/api/scenario-hall/${encodeURIComponent(scenarioKey)}/feedback`, { text })).mine);
      setText('');
      setOpen(false);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!canSend && mine.length === 0) return null;
  return (
    <div className="author-feedback">
      {mine.length > 0 && (
        <ul className="feedback-list">
          {mine.map((f) => (
            <li key={f.id} className="feedback-item is-mine">
              <p className="feedback-head">
                <span>你写给{authorName}的反馈</span>
                <span className="muted">{formatDateTime(f.at)}</span>
              </p>
              <p className="feedback-text pre-line">{f.text}</p>
              {f.reply && (
                <p className="feedback-reply pre-line">
                  <span className="muted">{authorName}回复：</span>
                  {f.reply}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {canSend &&
        (open ? (
          <form
            className="feedback-form"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              aria-label={`给${authorName}的反馈`}
              rows={3}
              maxLength={FEEDBACK_MAX}
              value={text}
              placeholder="只有作者看得到"
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <div className="form-actions">
              <button className="btn btn-small btn-primary" disabled={busy || !text.trim()}>
                发给作者
              </button>
              <button type="button" className="btn btn-small btn-quiet" onClick={() => setOpen(false)}>
                取消
              </button>
            </div>
          </form>
        ) : (
          <p>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => setOpen(true)}>
              给作者写反馈
            </button>
            {sent && <span className="muted"> 发出去了</span>}
          </p>
        ))}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
