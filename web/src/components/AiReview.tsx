import { useEffect, useState } from 'react';
import { CATEGORY_NAME, type ScenarioCategory } from '../../../shared/game';
import {
  REPORT_ACTION_LABEL,
  REPORT_CATEGORY_LABEL,
  REVIEW_VERDICT_LABEL,
  SEVERITY_LABEL,
  type AiReviewView,
  type ReportReviewDetails,
  type ReviewTarget,
  type SubmissionReviewDetails,
} from '../../../shared/review';
import { api, errorMessage } from '../api';

// AI 审核的意见（V0.6.0）：投稿、举报交上来，AI 先看一遍，意见给管理员参考；最后由管理员决定。
// 正在审的时候每隔几秒看一次审完没有。

const POLL_MS = 4000;

export function AiReviewBox({ target, id, review: initial }: { target: ReviewTarget; id: number; review: AiReviewView | null }) {
  const [review, setReview] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setReview(initial), [initial]);

  // 还在审：过一会儿再看
  useEffect(() => {
    if (review?.status !== 'running') return;
    const timer = window.setTimeout(() => {
      api<{ review: AiReviewView | null }>('GET', `/api/admin/ai-reviews/${target}/${id}`)
        .then((r) => setReview(r.review))
        .catch(() => undefined);
    }, POLL_MS);
    return () => window.clearTimeout(timer);
  }, [review, target, id]);

  async function rerun() {
    setBusy(true);
    setError('');
    try {
      setReview((await api<{ review: AiReviewView }>('POST', '/api/admin/ai-reviews', { target, id })).review);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`ai-review${review?.verdict ? ` verdict-${review.verdict}` : ''}`}>
      <div className="ai-review-head">
        <span className="ai-review-label">AI 审核</span>
        {review?.status === 'done' && review.verdict && <span className="ai-review-verdict">{REVIEW_VERDICT_LABEL[review.verdict]}</span>}
        {review?.status === 'running' && (
          <span className="muted">
            <span className="thinking-dot" aria-hidden="true" />
            正在审……
          </span>
        )}
        {review?.model && <span className="muted ai-review-model">{review.model}</span>}
        {review?.status !== 'running' && (
          <button type="button" className="linklike" disabled={busy} onClick={() => void rerun()}>
            {review ? '重新审核' : '让 AI 审一遍'}
          </button>
        )}
      </div>
      {!review && <p className="muted">还没让 AI 审过。</p>}
      {review?.status === 'failed' && <p className="muted">没审成：{review.error ?? '出错了'}</p>}
      {review?.status === 'done' && (
        <>
          {review.summary && <p className="ai-review-summary">{review.summary}</p>}
          {review.details && target === 'submission' && <SubmissionDetails d={review.details as SubmissionReviewDetails} />}
          {review.details && target === 'report' && <ReportDetails d={review.details as ReportReviewDetails} />}
        </>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function SubmissionDetails({ d }: { d: SubmissionReviewDetails }) {
  const suggested = d.category.suggested && d.category.suggested in CATEGORY_NAME ? CATEGORY_NAME[d.category.suggested as ScenarioCategory] : null;
  return (
    <dl className="facts facts-tight ai-review-facts">
      <dt>内容</dt>
      <dd>{d.content.ok ? '没看出违规' : `有问题${d.content.notes ? `：${d.content.notes}` : ''}`}</dd>
      <dt>质量</dt>
      <dd>{d.quality.score} / 5</dd>
      {d.quality.strengths.length > 0 && (
        <>
          <dt>好的地方</dt>
          <dd>
            <ul className="plain-list">
              {d.quality.strengths.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </dd>
        </>
      )}
      {d.quality.problems.length > 0 && (
        <>
          <dt>问题</dt>
          <dd>
            <ul className="plain-list">
              {d.quality.problems.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </dd>
        </>
      )}
      <dt>简介</dt>
      <dd>{d.introSpoiler ? '有剧透' : '没有剧透'}</dd>
      <dt>分区</dt>
      <dd>
        {d.category.ok ? '合适' : `不太合适${suggested ? `，建议放进「${suggested}」` : ''}`}
        {d.category.notes && `（${d.category.notes}）`}
      </dd>
      {d.suggestions.length > 0 && (
        <>
          <dt>修改建议</dt>
          <dd>
            <ul className="plain-list">
              {d.suggestions.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </dd>
        </>
      )}
    </dl>
  );
}

function ReportDetails({ d }: { d: ReportReviewDetails }) {
  return (
    <dl className="facts facts-tight ai-review-facts">
      <dt>类别</dt>
      <dd>{REPORT_CATEGORY_LABEL[d.category] ?? d.category}</dd>
      <dt>严重程度</dt>
      <dd>{SEVERITY_LABEL[d.severity]}</dd>
      <dt>建议</dt>
      <dd>{REPORT_ACTION_LABEL[d.action]}</dd>
      {d.reasons.length > 0 && (
        <>
          <dt>理由</dt>
          <dd>
            <ul className="plain-list">
              {d.reasons.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </dd>
        </>
      )}
    </dl>
  );
}

/** 退回投稿时可以直接用 AI 写的问题和修改建议当原因。 */
export function rejectReasonFrom(review: AiReviewView | null, max: number): string {
  if (review?.status !== 'done' || review.target !== 'submission' || !review.details) return '';
  const d = review.details as SubmissionReviewDetails;
  const parts = [...d.quality.problems, ...d.suggestions];
  if (!d.content.ok && d.content.notes) parts.unshift(d.content.notes);
  return [...parts.join('；')].slice(0, max).join('');
}
