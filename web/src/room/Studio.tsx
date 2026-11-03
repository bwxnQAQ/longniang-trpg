import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { ScenarioCategory } from '../../../shared/game';
import { api, errorMessage, type GenerateScenarioInput, type ScenarioJobView } from '../api';
import { CategorySelect } from '../components/Category';
import { saveFile } from '../format';
import { useNow } from './time';

// 剧本工坊：让 AI 生成剧本、把文本剧本转成这里的格式，以及生成过程的进度。

/** 填过的内容：生成没成功、回来重试时不用再填一遍（只在这个页面打开期间记着）。 */
const drafts: { generate: GenerateScenarioInput | null; convertText: string; convertCategory: ScenarioCategory } = {
  generate: null,
  convertText: '',
  convertCategory: 'puzzle',
};

const RELATIONS: { value: GenerateScenarioInput['relation']; label: string }[] = [
  { value: 'auto', label: '交给 AI 决定' },
  { value: 'coop', label: '合作' },
  { value: 'secrets', label: '各有秘密' },
  { value: 'versus', label: '互相对立' },
];

export function GenerateForm({
  roomId,
  maxPlayers,
  memberCount,
  onStarted,
}: {
  roomId: number;
  maxPlayers: number;
  memberCount: number;
  onStarted: (job: ScenarioJobView) => void;
}) {
  const draft = drafts.generate;
  const [category, setCategory] = useState<ScenarioCategory>(draft?.category ?? 'puzzle');
  const [genre, setGenre] = useState(draft?.genre ?? '');
  const [tone, setTone] = useState(draft?.tone ?? '');
  const [players, setPlayers] = useState(Math.max(draft?.players ?? maxPlayers, memberCount, 1));
  const [days, setDays] = useState(draft?.days ?? 3);
  const [relation, setRelation] = useState<GenerateScenarioInput['relation']>(draft?.relation ?? 'auto');
  const [avoid, setAvoid] = useState(draft?.avoid ?? '');
  const [want, setWant] = useState(draft?.want ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    drafts.generate = { category, genre, tone, players, days, relation, avoid, want };
  }, [category, genre, tone, players, days, relation, avoid, want]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!genre.trim()) return setError('写一下题材');
    if (!window.confirm('生成剧本通常要几分钟到十几分钟，花费由这一局的人平摊。开始生成？')) return;
    setBusy(true);
    try {
      const input: GenerateScenarioInput = { category, genre, tone, players, days, relation, avoid, want };
      const r = await api<{ job: ScenarioJobView }>('POST', `/api/rooms/${roomId}/scenario/generate`, input);
      onStarted(r.job);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form studio-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="gen-category">分区</label>
        <CategorySelect id="gen-category" value={category} onChange={setCategory} />
      </div>
      <div className="field">
        <label htmlFor="gen-genre">题材</label>
        <input id="gen-genre" maxLength={20} value={genre} placeholder="这一局的题材" onChange={(e) => setGenre(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="gen-tone">基调（选填）</label>
        <input id="gen-tone" maxLength={60} value={tone} placeholder="故事的气氛" onChange={(e) => setTone(e.target.value)} />
      </div>
      <div className="studio-row">
        <div className="field">
          <label htmlFor="gen-players">玩家人数</label>
          <select id="gen-players" value={players} onChange={(e) => setPlayers(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n} disabled={n < memberCount}>
                {n} 人
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="gen-days">预计跑几天</label>
          <select id="gen-days" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} 天
              </option>
            ))}
          </select>
        </div>
      </div>
      {players > 1 && (
        <fieldset className="field">
          <legend>玩家之间的关系</legend>
          <div className="studio-relations">
            {RELATIONS.map((r) => (
              <label key={r.value} className="choice">
                <input type="radio" name="gen-relation" value={r.value} checked={relation === r.value} onChange={() => setRelation(r.value)} />
                <span>
                  <strong>{r.label}</strong>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="field">
        <label htmlFor="gen-avoid">不想出现的内容（选填）</label>
        <textarea
          id="gen-avoid"
          rows={2}
          maxLength={200}
          value={avoid}
          placeholder="不想在故事里出现的内容"
          onChange={(e) => setAvoid(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="gen-want">想要的元素（选填）</label>
        <textarea id="gen-want" rows={2} maxLength={300} value={want} placeholder="希望故事里有的元素、场景或人物" onChange={(e) => setWant(e.target.value)} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? '正在提交……' : '开始生成'}
        </button>
      </div>
    </form>
  );
}

const TEXT_MAX = 60_000;

export function ConvertForm({ roomId, onStarted }: { roomId: number; onStarted: (job: ScenarioJobView) => void }) {
  const [text, setText] = useState(drafts.convertText);
  const [category, setCategory] = useState<ScenarioCategory>(drafts.convertCategory);
  useEffect(() => {
    drafts.convertText = text;
    drafts.convertCategory = category;
  }, [text, category]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const length = [...text].length;

  async function readFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    const content = (await file.text()).replace(/^﻿/, '');
    if ([...content].length > TEXT_MAX) setError(`这个文件有${[...content].length}个字，超过了${TEXT_MAX}字，只能粘贴其中的剧本部分`);
    setText(content);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!text.trim()) return setError('先粘贴剧本的原文');
    if (length > TEXT_MAX) return setError(`最多${TEXT_MAX}个字`);
    if (!window.confirm('转换通常要几分钟，花费由这一局的人平摊。开始转换？')) return;
    setBusy(true);
    try {
      const r = await api<{ job: ScenarioJobView }>('POST', `/api/rooms/${roomId}/scenario/convert`, { text, category });
      onStarted(r.job);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form studio-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="convert-category">分区</label>
        <CategorySelect id="convert-category" value={category} onChange={setCategory} />
      </div>
      <div className="field">
        <label htmlFor="convert-text">剧本原文</label>
        <textarea id="convert-text" rows={10} value={text} placeholder="粘贴剧本的全文" onChange={(e) => setText(e.target.value)} />
        <p className={length > TEXT_MAX ? 'hint is-over' : 'hint'}>
          {length.toLocaleString()} / {TEXT_MAX.toLocaleString()} 字
          <button type="button" className="btn btn-small btn-quiet" onClick={() => fileRef.current?.click()}>
            从文件读取（.txt、.md）
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md,text/plain,text/markdown" hidden onChange={(e) => void readFile(e)} />
        </p>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? '正在提交……' : '开始转换'}
        </button>
      </div>
    </form>
  );
}

const GENERATE_STEPS = [
  { key: 'outline', label: '写大纲', detail: '真相、主要人物、结局、每个身份' },
  { key: 'details', label: '写完整的剧本', detail: '开场、地点、线索、时间线' },
  { key: 'checking', label: '检查', detail: '程序检查一遍，有问题让 AI 改' },
] as const;

const CONVERT_STEPS = [
  { key: 'converting', label: '转换格式', detail: '读原文，转成这里的剧本格式' },
  { key: 'checking', label: '检查', detail: '程序检查一遍，有错误让 AI 改' },
] as const;

/** 生成、转换的进度。进行中大家都看得到；没成功、有提醒时只给房主看。 */
export function JobPanel({
  job,
  isHost,
  onCancel,
  onDismiss,
}: {
  job: ScenarioJobView;
  isHost: boolean;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const running = job.status === 'running';
  const now = useNow(running ? 15_000 : null);
  const what = job.kind === 'generate' ? '生成剧本' : '转换剧本';

  if (!running) {
    if (!isHost) return null;
    if (job.status === 'done' && job.notes.length === 0) return null;
    // 很久以前的结果不再提
    if (job.finishedAt !== null && now - job.finishedAt > 30 * 60_000) return null;
    return (
      <div className={job.status === 'failed' ? 'studio-job is-failed' : 'studio-job'} role="status">
        <p className="studio-job-title">
          {job.status === 'failed' ? `${what}没有成功` : job.status === 'cancelled' ? `已经取消了${what}` : '剧本可以用了，这几处可以再改进：'}
        </p>
        {job.error && <p className="studio-job-error">{job.error}</p>}
        {job.notes.length > 0 && (
          <ul className="studio-job-notes">
            {job.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn-small btn-quiet" onClick={onDismiss}>
          知道了
        </button>
      </div>
    );
  }

  const steps = job.kind === 'generate' ? GENERATE_STEPS : CONVERT_STEPS;
  const currentKey = job.step === 'fixing' || job.step === 'saving' ? 'checking' : job.step;
  const current = steps.findIndex((s) => s.key === currentKey);
  const minutes = Math.max(0, Math.floor((now - job.startedAt) / 60_000));
  return (
    <div className="studio-job" role="status" aria-live="polite">
      <p className="studio-job-title">
        <span className="thinking-dot" aria-hidden="true" />
        {isHost ? `AI 正在${what}` : `${job.by}正在让 AI ${what}`}
        <span className="muted">（已经过了 {minutes} 分钟）</span>
      </p>
      <ol className="studio-steps">
        {steps.map((s, i) => (
          <li key={s.key} className={i < current ? 'is-done' : i === current ? 'is-current' : ''}>
            <span className="studio-step-label">{s.label}</span>
            <span className="studio-step-detail">
              {i === current && job.step === 'fixing'
                ? `检查出问题，AI 在改（第${job.fixRound}次）`
                : i === current && job.step === 'saving'
                  ? '检查通过，正在存下来'
                  : s.detail}
              {i === current && job.chars > 0 && `，已经写了约 ${job.chars.toLocaleString()} 字`}
            </span>
          </li>
        ))}
      </ol>
      {isHost && (
        <button type="button" className="btn btn-small btn-quiet" onClick={onCancel}>
          取消
        </button>
      )}
    </div>
  );
}

/** 房主看完整剧本：存成文件。AI 生成的剧本，第一次看时记录里会告诉大家。 */
export function RevealScenario({ roomId, title, source }: { roomId: number; title: string; source: 'builtin' | 'generated' | 'imported' }) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ scenario: unknown }>('GET', `/api/rooms/${roomId}/scenario/full`);
      saveFile(`${title}.json`, JSON.stringify(r.scenario, null, 2), 'application/json');
      setAsking(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!asking) {
    return (
      <button type="button" className="btn btn-small btn-quiet" onClick={() => setAsking(true)}>
        存成文件（会剧透）
      </button>
    );
  }
  return (
    <div className="studio-reveal" role="alert">
      <p>
        {source === 'generated'
          ? '文件里有真相、NPC 和全部线索。看了以后就没法当一个不知情的玩家了，记录里也会告诉大家你看过。'
          : '文件里有真相、NPC 和全部线索。'}
      </p>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-small" disabled={busy} onClick={() => void download()}>
          确定，存成文件
        </button>
        <button type="button" className="btn btn-small btn-quiet" onClick={() => setAsking(false)}>
          算了
        </button>
      </div>
    </div>
  );
}
