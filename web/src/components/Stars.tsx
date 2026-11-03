import { useState } from 'react';
import { RATING_COMMENT_MAX } from '../../../shared/works';
import { api, errorMessage, type ScenarioDetail } from '../api';

// 剧本评分（V0.6.0）：显示几星；玩完的人打分、写一句短评（剧本大厅里、对局结束时）。

export function Stars({ value, count }: { value: number | null; count?: number }) {
  if (value === null) return <span className="stars stars-none">还没人评</span>;
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} 星${count !== undefined ? `，${count} 人评过` : ''}`}>
      <span className="stars-glyphs" aria-hidden="true">
        {'★'.repeat(full)}
        <span className="stars-off">{'★'.repeat(5 - full)}</span>
      </span>
      <span className="stars-value">{value.toFixed(1)}</span>
      {count !== undefined && <span className="stars-count">（{count}）</span>}
    </span>
  );
}

/** 打分的表单：五颗星（单选）加一句短评。onSaved 拿到更新后的剧本详情。 */
export function RateForm({
  scenarioKey,
  mine,
  onSaved,
  compact = false,
}: {
  scenarioKey: string;
  mine: { stars: number; comment: string } | null;
  onSaved: (detail: ScenarioDetail) => void;
  compact?: boolean;
}) {
  const [stars, setStars] = useState(mine?.stars ?? 0);
  const [comment, setComment] = useState(mine?.comment ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const name = `rate-${scenarioKey}`;

  async function save() {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      onSaved(await api<ScenarioDetail>('PUT', `/api/scenario-hall/${encodeURIComponent(scenarioKey)}/rating`, { stars, comment }));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className={compact ? 'rate-form is-compact' : 'rate-form'}
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <fieldset className="star-input">
        <legend>{mine ? '你的评分' : '打个分'}</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= stars ? 'star is-on' : 'star'}>
            <input type="radio" name={name} value={n} checked={stars === n} onChange={() => setStars(n)} />
            <span aria-hidden="true">★</span>
            <span className="visually-hidden">{n} 星</span>
          </label>
        ))}
      </fieldset>
      <input
        className="rate-comment"
        aria-label="短评（选填）"
        maxLength={RATING_COMMENT_MAX}
        value={comment}
        placeholder="一句话短评（选填）"
        onChange={(e) => setComment(e.target.value)}
      />
      <button className="btn btn-small btn-primary" disabled={busy || stars < 1}>
        {mine ? '改评分' : '提交'}
      </button>
      {saved && !error && <span className="rate-saved">评好了</span>}
      {error && <span className="form-error">{error}</span>}
    </form>
  );
}
