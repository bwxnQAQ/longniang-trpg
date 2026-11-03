import { useEffect, useState, type FormEvent } from 'react';
import { CATEGORY_NAME, type ScenarioCategory } from '../../../shared/game';
import { SUBMISSION_INTRO_MAX } from '../../../shared/works';
import { api, errorMessage, type GameState, type RoomSubmissionState, type Submission } from '../api';
import { CategorySelect } from './Category';

// 投稿到剧本大厅（V0.5.0 起在对局的「设置」里）。V0.9.2 一键投稿：剧本自己写了分区和简介的，点一下、确认就投；
// 对局的开团准备、「设置」、结局下面都能投（RoomSubmit），剧本编辑器里写好的也能直接投（Editor.tsx 用下面的两个函数）。

type RoomScenario = NonNullable<GameState['scenario']>;

/** 投到哪里：5E 模组投「模组」（V1.0.0），地下城投「地下城」，别的投「剧本大厅」。 */
export const hallNameOf = (category: ScenarioCategory | null | undefined, module = false) => (module ? '模组' : category === 'dungeon' ? '地下城' : '剧本大厅');

/** 一份投稿现在怎么样了，写成一句话。 */
export function submissionText(s: Submission): string {
  if (s.status === 'pending') return `《${s.title}》已经投稿，等管理员审核`;
  if (s.status === 'approved') return `《${s.title}》通过了审核，已经放进${hallNameOf(s.category, s.module)}`;
  if (s.status === 'rejected') return `《${s.title}》没通过：${s.reason}`;
  return `《${s.title}》的投稿撤回了`;
}

/** 投稿前问一下。module：投的是 5E 模组。 */
export function confirmSubmit(title: string, category: ScenarioCategory, module = false): boolean {
  const where = module ? '模组' : category === 'dungeon' ? '地下城' : `剧本大厅的「${CATEGORY_NAME[category]}」分区`;
  return window.confirm(`把《${title}》投稿到${where}？管理员审核时会看到完整的剧本。`);
}

/** 同一局开着两处投稿（开团准备里和「设置」里）：一处投了，另一处跟着变。 */
const CHANGED = 'room-submission-changed';
type Changed = { roomId: number; state: RoomSubmissionState };

/**
 * 一局的剧本投稿：只有房主看得到，剧本是剧本大厅里的不显示。
 * setup：开团准备里剧本下面那一排按钮的后面；settings：「设置」里的一节；ending：对局结束以后，结局下面的一块。
 */
export function RoomSubmit({ roomId, scenario, variant }: { roomId: number; scenario: RoomScenario; variant: 'setup' | 'settings' | 'ending' }) {
  const [state, setState] = useState<RoomSubmissionState | null>(null);
  const [open, setOpen] = useState(false);
  const isDungeon = scenario.category === 'dungeon';
  // 5E 模组（V1.0.0 放进「模组」页）；用 5E 规则玩的普通剧本投的是原来那份，照旧投剧本大厅
  const module = scenario.rules === '5e' && scenario.mod5e !== 'on';
  const hallName = hallNameOf(scenario.category, module);
  const [category, setCategory] = useState<ScenarioCategory>(scenario.category ?? 'puzzle');
  const [intro, setIntro] = useState(scenario.intro);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /** 剧本自己写了分区和简介：一键投稿（不用再填）。 */
  const ready = scenario.category !== null && scenario.intro.trim() !== '';

  useEffect(() => {
    if (scenario.source === 'builtin') {
      setState(null);
      return;
    }
    let live = true;
    api<{ submission: RoomSubmissionState | null }>('GET', `/api/rooms/${roomId}/submission`)
      .then((r) => live && setState(r.submission))
      .catch(() => live && setState(null));
    return () => {
      live = false;
    };
  }, [roomId, scenario.source, scenario.title]);

  // 换了剧本：表单换成新剧本的分区和简介
  useEffect(() => {
    setCategory(scenario.category ?? 'puzzle');
    setIntro(scenario.intro);
    setOpen(false);
    setError('');
  }, [scenario.title, scenario.category, scenario.intro]);

  useEffect(() => {
    const onChanged = (e: Event) => {
      const changed = (e as CustomEvent<Changed>).detail;
      if (changed.roomId === roomId) setState(changed.state);
    };
    window.addEventListener(CHANGED, onChanged);
    return () => window.removeEventListener(CHANGED, onChanged);
  }, [roomId]);

  if (!state?.canSubmit) return null;
  const latest = state.latest;
  const locked = latest?.status === 'pending' || latest?.status === 'approved';

  async function send(body: { category?: ScenarioCategory; intro?: string }) {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ submission: Submission; state: RoomSubmissionState }>('POST', `/api/rooms/${roomId}/submission`, body);
      setOpen(false);
      window.dispatchEvent(new CustomEvent<Changed>(CHANGED, { detail: { roomId, state: r.state } }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // 一键投稿：分区、简介用剧本里写的（服务器那边也是）；剧本里没写全的，打开表单填
  function quick() {
    setError('');
    if (!ready) {
      setOpen(true);
      return;
    }
    if (confirmSubmit(scenario.title, scenario.category!, module)) void send({});
  }

  function submitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!intro.trim()) {
      setError('写一段简介');
      return;
    }
    if (confirmSubmit(scenario.title, category, module)) void send({ category, intro });
  }

  const form = (
    <form className="form submission-form" onSubmit={submitForm} noValidate>
      <div className="field">
        <label htmlFor={`submit-category-${variant}`}>分区</label>
        <CategorySelect id={`submit-category-${variant}`} value={category} onChange={setCategory} only={(k) => (k === 'dungeon') === isDungeon} />
      </div>
      <div className="field">
        <label htmlFor={`submit-intro-${variant}`}>简介</label>
        <textarea
          id={`submit-intro-${variant}`}
          rows={4}
          maxLength={SUBMISSION_INTRO_MAX}
          value={intro}
          placeholder="给挑剧本的人看的一段话，不剧透"
          onChange={(e) => setIntro(e.target.value)}
        />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary btn-small" disabled={busy}>
          {busy ? '正在投稿……' : '投稿'}
        </button>
        <button
          type="button"
          className="btn btn-small btn-quiet"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
        >
          取消
        </button>
      </div>
    </form>
  );
  const quickError = error && !open && (
    <p className="form-error submit-error" role="alert">
      {error}
    </p>
  );
  const status = latest && <span className={`submission-state status-${latest.status}`}>{submissionText(latest)}</span>;

  if (variant === 'setup') {
    return (
      <>
        {!locked && !open && (
          <button type="button" className="btn btn-small" disabled={busy} onClick={quick}>
            {busy ? '正在投稿……' : `投稿到${hallName}`}
          </button>
        )}
        {status}
        {!locked && open && <div className="scenario-actions-row">{form}</div>}
        {quickError}
      </>
    );
  }

  const body = (
    <>
      {latest && <p className={`submission-state status-${latest.status}`}>{submissionText(latest)}</p>}
      {!locked && !open && (
        <div className="submit-actions">
          <button type="button" className={variant === 'ending' ? 'btn btn-small btn-primary' : 'btn btn-small'} disabled={busy} onClick={quick}>
            {busy ? '正在投稿……' : latest ? '再投一次' : '投稿'}
          </button>
          {ready && (
            <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => setOpen(true)}>
              改分区和简介
            </button>
          )}
        </div>
      )}
      {!locked && open && form}
      {quickError}
    </>
  );
  if (variant === 'ending') {
    return (
      <section className="ending-submit" aria-labelledby="ending-submit-title">
        <p id="ending-submit-title" className="ending-submit-title">
          投稿到{hallName}
        </p>
        {body}
      </section>
    );
  }
  return (
    <section className="settings-section">
      <h2>投稿到{hallName}</h2>
      {body}
    </section>
  );
}
