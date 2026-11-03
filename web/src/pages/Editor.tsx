import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  blankScenario,
  DRAFTS_MAX,
  EDITOR_MAX_BYTES,
  EDITOR_MAX_CHARS,
  EDITOR_SECTIONS,
  problemTarget,
  SECTION_NAME,
  type Draft,
  type DraftSummary,
  type EditorCheck,
  type EditorProblem,
  type EditorSection,
} from '../../../shared/editor';
import { api, ApiError, errorMessage, type RoomDetail, type Submission } from '../api';
import { useAuth } from '../auth';
import { isCategory } from '../components/Category';
import { GuestNote } from '../components/GuestNote';
import { confirmSubmit, submissionText } from '../components/Submit';
import { formatDateTime, formatTime, saveFile } from '../format';
import { Link, navigate } from '../router';
import {
  fileName,
  getIn,
  isObj,
  jsonErrorMessage,
  keyOptions,
  locateInJson,
  problemElementIds,
  readScenarioFile,
  renameItemKey,
  setIn,
  stashImported,
  takeImported,
  text,
  utf8Bytes,
  type Obj,
} from '../editor/doc';
import { readBackup, removeBackup, worthRestoring, writeBackup, type Backup } from '../editor/backup';
import { OpsContext, type Ops, type Option } from '../editor/fields';
import { leaveWithoutAsking, useLeaveGuard } from '../editor/leave-guard';
import { BasicSection, CluesSection, EndingsSection, JsonSection, LocationsSection, MonstersSection, NpcsSection, RolesSection, TimelineSection, TruthSection } from '../editor/sections';
import { StartGamePanel, type StartOptions } from '../editor/StartGame';

// 网页剧本编辑器（V0.8.0）：/editor 是草稿列表和新建，/editor/:id 编辑一份草稿（/editor/new 是还没存过的）。
// 一块块填表，改完停一会儿就让服务器检查一遍（和导入剧本时的检查一样），存草稿、导入导出 .json，
// 检查通过了可以直接用它开局（照现有的流程：建对局，再用导入剧本的接口装进去），也可以直接投稿（V0.9.2）。
// 游客能写、能检查、能导出，存不了、开不了局、投不了稿。

/** 改完停多久检查；两次检查至少隔多久（服务器按账号每分钟最多 20 次）。 */
const CHECK_DELAY_MS = 800;
const CHECK_GAP_MS = 3500;
const tooLong = (n: number) => `剧本太长了（${n}个字），最多${EDITOR_MAX_CHARS}个字`;
const untitled = (title: string) => title || '未命名剧本';
const clip = (s: string, n: number) => ([...s].length > n ? `${[...s].slice(0, n).join('')}…` : s);

// ---------- 草稿列表 ----------

export function EditorListPage() {
  const { user } = useAuth();
  const guest = !!user?.isGuest;
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = '剧本编辑器 - 龙娘跑团';
    if (guest) return;
    api<{ drafts: DraftSummary[] }>('GET', '/api/editor/drafts')
      .then((r) => setDrafts(r.drafts))
      .catch((err) => setError(errorMessage(err)));
  }, [guest]);

  async function remove(d: DraftSummary) {
    if (!window.confirm(`删掉草稿《${untitled(d.title)}》？删了就找不回来了。`)) return;
    try {
      await api('DELETE', `/api/editor/drafts/${d.id}`);
      if (user) removeBackup(user.id, d.id);
      setDrafts((list) => list?.filter((x) => x.id !== d.id) ?? list);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      stashImported(await readScenarioFile(file));
      navigate('/editor/new?from=import');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="editor-home">
      <div className="page-head">
        <h1>剧本编辑器</h1>
      </div>
      {guest && <GuestNote what="存草稿、用写好的剧本开局和投稿" />}
      <div className="editor-new">
        <Link to="/editor/new" className="btn btn-primary">
          新建空白剧本
        </Link>
        <Link to="/editor/new?from=example" className="btn">
          打开示例
        </Link>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          导入 .json 文件
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void importFile(e)} />
        {/* 写剧本 skill（V0.8.3）：交给自己的 AI 写剧本、转换文字剧本，写好的 .json 在这里导入 */}
        <a href="/api/editor/skill" className="btn" download>
          下载写剧本 skill
        </a>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!guest && (
        <section className="editor-drafts" aria-labelledby="editor-drafts-title">
          <h2 id="editor-drafts-title" className="section-title">
            我的草稿
            {drafts && (
              <span className="muted editor-drafts-count">
                {drafts.length}/{DRAFTS_MAX}
              </span>
            )}
          </h2>
          {drafts === null ? (
            !error && <p className="muted">正在加载……</p>
          ) : drafts.length === 0 ? (
            <p className="empty">还没有草稿。</p>
          ) : (
            <ul className="draft-list">
              {drafts.map((d) => (
                <li key={d.id} className="draft-row">
                  <Link to={`/editor/${d.id}`} className="draft-title">
                    {untitled(d.title)}
                  </Link>
                  <span className="muted draft-time">{formatDateTime(d.updatedAt)} 保存</span>
                  <button type="button" className="btn btn-small btn-quiet btn-danger-text" onClick={() => void remove(d)}>
                    删除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

// ---------- 编辑页 ----------

/** 内容没变就还用原来那一份（列表里每一项的组件是 memo 的：选项一换，每一项都要重画）。 */
function useStable<T>(value: T): T {
  const sig = JSON.stringify(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => value, [sig]);
}

type CheckState = { result: EditorCheck; text: string };

export function EditorPage({ id, from }: { id: number | null; from: string | null }) {
  const { user } = useAuth();
  const guest = !!user?.isGuest;
  const [doc, setDoc] = useState<Obj | null>(null);
  /** 最新的一份（改动一律先改它再交给 React，存的时候用它：刚离开的输入框改的也算上）。 */
  const docRef = useRef<Obj | null>(null);
  const draftIdRef = useRef<number | null>(null);
  const [loadError, setLoadError] = useState('');
  const [savedText, setSavedText] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState<EditorSection>('basic');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [check, setCheck] = useState<CheckState | null>(null);
  const [checkError, setCheckError] = useState('');
  const [checkRetry, setCheckRetry] = useState(0);
  const [showProblems, setShowProblems] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startBusy, setStartBusy] = useState<'room' | 'scenario' | null>(null);
  const [startError, setStartError] = useState('');
  const [jump, setJump] = useState<{ problem: EditorProblem } | null>(null);
  /** 我的投稿（新的在前）：看写的这个剧本投过没有、审得怎么样了。 */
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  /** 上一次检查是什么时候发出去的。 */
  const lastCheckAt = useRef(0);
  /** 换了几次草稿（读别的草稿时加一）：之前那一份还没存完、没读完的，回来以后不能动现在这一份。 */
  const generation = useRef(0);
  /** 上次没保存、暂存在浏览器里的（比服务器上的新）：问要不要恢复。 */
  const [restoreOffer, setRestoreOffer] = useState<Backup | null>(null);
  /** 问了要不要离开、点了确定：这些改动不要了，不再暂存。 */
  const discarded = useRef(false);
  const userId = user?.id ?? null;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const sectionRef = useRef(section);
  sectionRef.current = section;
  const jsonErrorRef = useRef(jsonError);
  jsonErrorRef.current = jsonError;

  /** 换成另一份（读进来的、导入的）。saved：已经存下的样子（和它一样就算没有改动）。 */
  const load = useCallback((next: Obj, saved: string) => {
    docRef.current = next;
    setDoc(next);
    setSavedText(saved);
    setJsonError('');
    setJsonText(JSON.stringify(next, null, 2));
  }, []);

  useEffect(() => {
    // 刚存好的新草稿换了地址（/editor/new → /editor/123）：还是这一份，不用再读
    if (id !== null && id === draftIdRef.current) return;
    let cancelled = false;
    generation.current++;
    draftIdRef.current = id;
    // 换了一份（比如长按后退直接跳到另一份）：先清空，读回来之前显示「正在加载」、存不了（不然会把上一份的内容存进这一份）
    docRef.current = null;
    setDoc(null);
    setSavedText('');
    setSavedAt(null);
    setJsonText('');
    setJsonError('');
    setRestoreOffer(null);
    discarded.current = false;
    setLoadError('');
    setError('');
    setCheck(null);
    setCheckError('');
    setStarting(false);
    setStartError('');
    setSection('basic');
    (async () => {
      try {
        let data: Obj;
        let saved: string;
        let updatedAt: number | null = null;
        if (id !== null) {
          const r = await api<{ draft: Draft }>('GET', `/api/editor/drafts/${id}`);
          if (cancelled) return;
          data = isObj(r.draft.data) ? r.draft.data : {};
          saved = JSON.stringify(data);
          updatedAt = r.draft.updatedAt;
        } else if (from === 'example') {
          const r = await api<{ data: Obj }>('GET', '/api/editor/example');
          if (cancelled) return;
          data = r.data;
          saved = JSON.stringify(data);
        } else {
          // 列表页导入的文件；刷新以后就没有了，给一份空白的
          const imported = from === 'import' ? takeImported() : null;
          data = imported ?? blankScenario();
          saved = imported ? '' : JSON.stringify(data);
        }
        setSavedAt(updatedAt);
        load(data, saved);
        // 上次没保存的（登录失效被跳去登录页、页面关掉了……）：比服务器上的新，就问一下要不要恢复
        const me = userIdRef.current;
        if (me !== null) {
          const backup = readBackup(me, id);
          if (backup && worthRestoring(backup, JSON.stringify(data), updatedAt)) setRestoreOffer(backup);
          else if (backup) removeBackup(me, id);
        }
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, from, load]);

  useEffect(() => {
    if (guest) return;
    let live = true;
    api<{ submissions: Submission[] }>('GET', '/api/submissions')
      .then((r) => live && setSubmissions(r.submissions))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [guest]);

  const docText = useMemo(() => (doc ? JSON.stringify(doc) : ''), [doc]);
  const docBytes = useMemo(() => utf8Bytes(docText), [docText]);
  const dirty = doc !== null && (docText !== savedText || jsonError !== '');
  // 问了要不要离开、点了确定：不要这些改动了，暂存的也删掉
  useLeaveGuard(dirty, () => {
    discarded.current = true;
    if (userIdRef.current !== null) removeBackup(userIdRef.current, draftIdRef.current);
  });

  // 没保存的改动另外存一份在浏览器里（停 1 秒存一次）；没有改动了就删掉。正在问要不要恢复的时候先不动
  useEffect(() => {
    if (userId === null || !doc || restoreOffer) return;
    const draftId = draftIdRef.current;
    const timer = window.setTimeout(() => {
      // 刚点了「确定离开」、页面还没换走：不再存
      if (discarded.current) return;
      if (dirty) writeBackup(userId, draftId, { at: Date.now(), base: savedAt, data: doc });
      else removeBackup(userId, draftId);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [userId, doc, dirty, restoreOffer, savedAt]);

  // 离开这一页（登录失效被跳去登录页也是）、关掉标签页之前：最后改的那一点也补存上
  const flushInfo = useRef({ savedText, savedAt, jsonError, offer: false });
  flushInfo.current = { savedText, savedAt, jsonError, offer: restoreOffer !== null };
  useEffect(() => {
    const flush = () => {
      const me = userIdRef.current;
      const current = docRef.current;
      const f = flushInfo.current;
      if (me === null || !current || f.offer || discarded.current) return;
      if (JSON.stringify(current) === f.savedText && !f.jsonError) return;
      writeBackup(me, draftIdRef.current, { at: Date.now(), base: f.savedAt, data: current });
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);
  const title = doc ? text(doc.title).trim() : '';

  useEffect(() => {
    document.title = `${untitled(title)} - 剧本编辑器 - 龙娘跑团`;
  }, [title]);

  // 边写边检查：改完停 0.8 秒（离上一次检查不到 3.5 秒的，等到 3.5 秒），把整份剧本发给服务器查一遍
  useEffect(() => {
    if (!doc || jsonError || check?.text === docText) return;
    if (docText.length > EDITOR_MAX_CHARS) {
      setCheckError(tooLong(docText.length));
      return;
    }
    let cancelled = false;
    let retry: number | undefined;
    const wait = Math.max(CHECK_DELAY_MS, lastCheckAt.current + CHECK_GAP_MS - Date.now());
    const timer = window.setTimeout(async () => {
      lastCheckAt.current = Date.now();
      try {
        const result = await api<EditorCheck>('POST', '/api/editor/validate', { data: doc });
        if (cancelled) return;
        setCheck({ result, text: docText });
        setCheckError('');
      } catch (err) {
        if (cancelled) return;
        setCheckError(errorMessage(err));
        // 查得太频繁了、网络断了、服务器出错了：过一会儿再查（剧本太长这种要改了才行，不重试）
        if (err instanceof ApiError && (err.status === 429 || err.status === 0 || err.status >= 500)) {
          retry = window.setTimeout(() => setCheckRetry((n) => n + 1), 5000);
        }
      }
    }, wait);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(retry);
    };
  }, [doc, docText, jsonError, check, checkRetry]);

  const apply = useCallback((fn: (d: Obj) => Obj) => {
    const current = docRef.current;
    if (!current) return;
    const next = fn(current);
    if (next === current) return;
    docRef.current = next;
    setDoc(next);
  }, []);
  const ops = useMemo<Ops>(
    () => ({
      set: (path, value) => apply((d) => setIn(d, path, value) as Obj),
      edit: (path, fn) => apply((d) => setIn(d, path, fn(getIn(d, path))) as Obj),
      renameKey: (kind, index, key) => apply((d) => renameItemKey(d, kind, index, key)),
      replace: apply,
    }),
    [apply],
  );

  const locations: Option[] = useStable(doc ? keyOptions(doc.locations, (l, key) => `${text(l.name).trim() || '（没名字）'}（${key}）`) : []);
  const points: Option[] = useStable(doc ? keyOptions(getIn(doc, ['truth', 'points']), (p, key) => clip(text(p.text).trim(), 40) || key) : []);

  /** 换分区。JSON 改得不对的时候换不走（停在 JSON 分区，说哪里不对）。 */
  const goSection = (next: EditorSection): boolean => {
    if (next === sectionRef.current) return true;
    if (sectionRef.current === 'json' && jsonErrorRef.current) {
      document.getElementById('ed-json-text')?.focus();
      return false;
    }
    if (next === 'json' && docRef.current) setJsonText(JSON.stringify(docRef.current, null, 2));
    setSection(next);
    // 往下翻了很远再换分区：回到分区的开头
    const body = bodyRef.current;
    if (body && body.getBoundingClientRect().top < 0) body.scrollIntoView();
    return true;
  };

  // JSON 分区：改成能解析的就马上用上；解析不了的先停在这里
  const onJsonChange = (value: string) => {
    setJsonText(value);
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch (err) {
      setJsonError(jsonErrorMessage(err, value));
      return;
    }
    if (!isObj(parsed)) {
      setJsonError('整份剧本要是一个 JSON 对象，用 { } 包起来');
      return;
    }
    setJsonError('');
    docRef.current = parsed;
    setDoc(parsed);
  };

  /** 存一次草稿（现在最新的内容）。存好了返回 null，没存上返回原因。 */
  const saveOnce = useCallback(async (): Promise<string | null> => {
    const current = docRef.current;
    // 还没读好（刚换了草稿）：没有东西可存
    if (!current) return null;
    if (jsonErrorRef.current) return 'JSON 格式不对，改好了再存';
    const sent = JSON.stringify(current);
    if (sent.length > EDITOR_MAX_CHARS) return tooLong(sent.length);
    const gen = generation.current;
    const draftId = draftIdRef.current;
    setSaving(true);
    try {
      const r =
        draftId === null
          ? await api<{ draft: DraftSummary }>('POST', '/api/editor/drafts', { data: current })
          : await api<{ draft: DraftSummary }>('PUT', `/api/editor/drafts/${draftId}`, { data: current });
      // 存的这会儿换到了别的草稿：那一份存上了就行，这边的页面不动
      if (gen !== generation.current) return null;
      setSavedText(sent);
      setSavedAt(r.draft.updatedAt);
      const me = userIdRef.current;
      if (me !== null) removeBackup(me, draftId);
      if (draftId === null) {
        // 新草稿存好了：地址换成 /editor/:id（replace，不算离开这一页）
        draftIdRef.current = r.draft.id;
        navigate(`/editor/${r.draft.id}`, { replace: true });
      }
      return null;
    } catch (err) {
      return gen === generation.current ? errorMessage(err) : null;
    } finally {
      setSaving(false);
    }
  }, []);

  /** 正在存的那一次、排着等它存完再存的那一次（只留一个）。 */
  const savingRun = useRef<Promise<string | null> | null>(null);
  const queuedRun = useRef<Promise<string | null> | null>(null);

  /**
   * 存草稿：一次只存一份。正在存的时候又要存（连按两下 Ctrl+S），就等这次存完再存一次最新的；
   * 新草稿第一次存好、拿到编号以前不会再新建一份。
   */
  const save = useCallback((): Promise<string | null> => {
    if (savingRun.current) {
      if (!queuedRun.current) {
        const gen = generation.current;
        queuedRun.current = savingRun.current.then(() => {
          queuedRun.current = null;
          return gen === generation.current ? save() : null;
        });
      }
      return queuedRun.current;
    }
    const run = saveOnce().finally(() => {
      savingRun.current = null;
    });
    savingRun.current = run;
    return run;
  }, [saveOnce]);

  const saveNow = useCallback(async () => {
    setError('');
    const problem = await save();
    if (problem) setError(problem);
  }, [save]);

  // Ctrl+S（Mac 上 ⌘S）存草稿
  const saveNowRef = useRef(saveNow);
  saveNowRef.current = saveNow;
  useEffect(() => {
    if (guest) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== 's') return;
      e.preventDefault();
      // 正在改的标识离开输入框才算数：先让它离开一下再回来
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
        active.focus();
      }
      void saveNowRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guest]);

  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    let data: Obj;
    try {
      data = await readScenarioFile(file);
    } catch (err) {
      setError(errorMessage(err));
      return;
    }
    if ((dirty || draftIdRef.current !== null) && !window.confirm('用这个文件换掉现在写的内容？')) return;
    // 存下的还是原来那一份：导入的算是改动
    load(data, savedText);
  }

  // 上次没保存的：恢复（换成那一份，算有改动）或者丢掉
  function restoreBackup() {
    if (!restoreOffer) return;
    load(restoreOffer.data, savedText);
    setRestoreOffer(null);
  }

  function dropBackup() {
    if (userId !== null) removeBackup(userId, draftIdRef.current);
    setRestoreOffer(null);
  }

  function exportFile() {
    const current = docRef.current;
    if (!current) return;
    if (jsonErrorRef.current) {
      setError('JSON 格式不对，改好了再导出');
      return;
    }
    setError('');
    saveFile(fileName(text(current.title)), `${JSON.stringify(current, null, 2)}\n`, 'application/json');
  }

  // 用这个剧本开局：有改动先存草稿；建对局；用导入剧本的接口装进去（那里有内容检查、要 AI 额度）；
  // 装不进去就把刚建的空对局删掉
  async function startGame(o: StartOptions) {
    const current = docRef.current;
    if (!current) return;
    setStartError('');
    setStartBusy('room');
    if (dirty) {
      const problem = await save();
      if (problem) {
        setStartError(`草稿没存上：${problem}`);
        setStartBusy(null);
        return;
      }
    }
    let roomId: number;
    try {
      roomId = (await api<RoomDetail>('POST', '/api/rooms', o)).room.id;
    } catch (err) {
      setStartError(errorMessage(err));
      setStartBusy(null);
      return;
    }
    setStartBusy('scenario');
    try {
      await api('POST', `/api/rooms/${roomId}/scenario`, { data: current });
    } catch (err) {
      const reason = errorMessage(err);
      try {
        await api('DELETE', `/api/rooms/${roomId}`);
        setStartError(`剧本没装进对局：${reason}（刚建的对局已经删掉了）`);
      } catch (deleteErr) {
        setStartError(`剧本没装进对局：${reason}。刚建的空对局没删掉（${errorMessage(deleteErr)}），可以到「我的对局」里删掉它。`);
      }
      setStartBusy(null);
      return;
    }
    leaveWithoutAsking(() => navigate(`/room/${roomId}`));
  }

  // 投稿（V0.9.2）：检查通过的剧本直接投稿，分区、简介用「基本信息」里写的。有改动先存草稿
  async function submitDraft() {
    const current = docRef.current;
    if (!current) return;
    setError('');
    const category = text(current.category);
    const missing = !isCategory(category)
      ? { field: 'category', message: '投稿前在「基本信息」里选一个分区' }
      : !text(current.intro).trim()
        ? { field: 'intro', message: '投稿前在「基本信息」里写一段简介' }
        : null;
    if (missing) {
      setError(missing.message);
      jumpTo({ level: 'error', text: `${missing.field}：${missing.message}`, section: 'basic', index: null, key: null });
      return;
    }
    if (!isCategory(category) || !confirmSubmit(untitled(title), category, current.rules === '5e')) return;
    setSubmitting(true);
    try {
      if (dirty) {
        const problem = await save();
        if (problem) {
          setError(`草稿没存上：${problem}`);
          return;
        }
      }
      const r = await api<{ submission: Submission }>('POST', '/api/editor/submission', { data: current });
      setSubmissions((list) => [r.submission, ...(list ?? [])]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // 点了一条问题：换到它的分区，滚到那一项（能找到输入框就放上光标）
  const jumpTo = (problem: EditorProblem) => {
    if (goSection(problem.section)) setJump({ problem });
  };
  useEffect(() => {
    if (!jump) return;
    setJump(null);
    const { problem } = jump;
    // 列出来的报错可能截短过：路径照报错的开头算（特别长的截掉了，就跳到那个分区）
    const target = { path: problemTarget(problem.text).path, key: problem.key, section: problem.section };
    if (problem.section === 'json') {
      const area = document.getElementById('ed-json-text');
      if (area instanceof HTMLTextAreaElement) {
        area.scrollIntoView({ block: 'nearest' });
        area.focus({ preventScroll: true });
        const at = locateInJson(area.value, target.path);
        if (at) area.setSelectionRange(at.start, at.end);
      }
      return;
    }
    for (const elementId of problemElementIds(docRef.current, target)) {
      const el = document.getElementById(elementId);
      if (!el) continue;
      el.scrollIntoView({ block: 'center' });
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        el.focus({ preventScroll: true });
      } else {
        el.classList.remove('ed-flash');
        void el.offsetWidth;
        el.classList.add('ed-flash');
      }
      return;
    }
  }, [jump, section]);

  // 手机上分区排成一排、左右滑：换了分区（点了问题跳过去）把它滑进来
  const loaded = doc !== null;
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const box = nav.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.left < box.left) nav.scrollLeft -= box.left - item.left + 24;
    else if (item.right > box.right) nav.scrollLeft += item.right - box.right + 24;
  }, [section, loaded]);

  if (loadError) {
    return (
      <div className="page-error">
        <p className="form-error" role="alert">
          {loadError}
        </p>
        <Link to="/editor">回到剧本编辑器</Link>
      </div>
    );
  }
  if (!doc) return <p className="muted">正在加载……</p>;

  const current = check?.text === docText;
  const canStart = !guest && current && !!check?.result.ok && !jsonError;
  const players = isObj(doc.players) && typeof doc.players.max === 'number' ? doc.players.max : 6;
  // 每个分区有几个错误、几个提醒（服务器算好的总数：列出来的问题最多 100 条）
  const counts = check?.result.sections;
  // 这个标题最近一次投稿：等审核、通过了的不能再投
  const submission = title ? (submissions?.find((s) => s.title === title) ?? null) : null;
  const submitted = submission?.status === 'pending' || submission?.status === 'approved';

  return (
    <div className="editor">
      <div className="ed-head">
        <div className="ed-head-main">
          <Link to="/editor" className="back">
            剧本编辑器
          </Link>
          <h1 className="ed-title">{untitled(title)}</h1>
        </div>
        <div className="ed-actions">
          {!guest && <span className={dirty ? 'ed-saved is-dirty' : 'ed-saved'}>{dirty ? '有改动没保存' : savedAt !== null ? `已保存 ${formatTime(savedAt)}` : ''}</span>}
          {!guest && (
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void saveNow()}>
              {saving ? '正在保存……' : '保存'}
            </button>
          )}
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            导入
          </button>
          <button type="button" className="btn" onClick={exportFile}>
            导出
          </button>
          {!guest && (
            <button
              type="button"
              className="btn"
              aria-expanded={starting}
              disabled={!starting && !canStart}
              title={canStart ? undefined : '检查通过才能开局'}
              onClick={() => setStarting((s) => !s)}
            >
              用这个剧本开局
            </button>
          )}
          {!guest && (
            <button type="button" className="btn" disabled={submitting || submitted || !canStart} onClick={() => void submitDraft()}>
              {submitting ? '正在投稿……' : '投稿'}
            </button>
          )}
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void importFile(e)} />
        </div>
      </div>
      {guest && <GuestNote what="存草稿、用写好的剧本开局和投稿" />}
      {!guest && submission && <p className={`submission-state ed-submission status-${submission.status}`}>{submissionText(submission)}</p>}
      {restoreOffer && (
        <div className="ed-restore" role="alert">
          <span>
            有上次没保存的内容<span className="muted">（{formatDateTime(restoreOffer.at)}）</span>
          </span>
          <button type="button" className="btn btn-small btn-primary" onClick={restoreBackup}>
            恢复
          </button>
          <button type="button" className="btn btn-small btn-quiet" onClick={dropBackup}>
            丢掉
          </button>
        </div>
      )}
      {error && (
        <p className="form-error ed-error" role="alert">
          {error}
        </p>
      )}
      {starting && !guest && (
        <StartGamePanel
          title={title}
          limit={Math.min(6, Math.max(1, players))}
          busy={startBusy}
          error={startError}
          canStart={canStart}
          onStart={(o) => void startGame(o)}
          onCancel={() => setStarting(false)}
        />
      )}

      <CheckBar
        check={check}
        current={current}
        size={{ chars: docText.length, bytes: docBytes }}
        error={jsonError ? 'JSON 格式不对' : checkError}
        open={showProblems}
        onToggle={() => setShowProblems((v) => !v)}
        onJump={jumpTo}
      />

      <div className="ed-body" ref={bodyRef}>
        <nav className="ed-nav" aria-label="分区" ref={navRef}>
          {EDITOR_SECTIONS.map((s) => {
            const n = counts?.[s.key] ?? { errors: 0, warnings: 0 };
            // 怪物和宝藏只有 5E 模组有（写了却不是 5E 的，检查会报错，这时也列出来）
            if (s.key === 'monsters' && doc.rules !== '5e' && !n.errors && !n.warnings && section !== 'monsters') return null;
            return (
              <button
                key={s.key}
                type="button"
                className="ed-nav-item"
                aria-current={section === s.key ? 'true' : undefined}
                disabled={jsonError !== '' && s.key !== 'json'}
                onClick={() => goSection(s.key)}
              >
                <span>{s.name}</span>
                {n.errors > 0 ? (
                  <span className="ed-badge is-error" aria-label={`${n.errors} 个错误`}>
                    {n.errors}
                  </span>
                ) : n.warnings > 0 ? (
                  <span className="ed-badge is-warning" aria-label={`${n.warnings} 个提醒`}>
                    {n.warnings}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="ed-main" id={`ed-section-${section}`}>
          <h2 className="ed-section-title">{SECTION_NAME[section]}</h2>
          <OpsContext.Provider value={ops}>
            {section === 'basic' && <BasicSection doc={doc} />}
            {section === 'roles' && <RolesSection doc={doc} locations={locations} />}
            {section === 'locations' && <LocationsSection doc={doc} locations={locations} />}
            {section === 'npcs' && <NpcsSection doc={doc} locations={locations} />}
            {section === 'truth' && <TruthSection doc={doc} />}
            {section === 'clues' && <CluesSection doc={doc} locations={locations} points={points} />}
            {section === 'timeline' && <TimelineSection doc={doc} />}
            {section === 'endings' && <EndingsSection doc={doc} />}
            {section === 'monsters' && <MonstersSection doc={doc} locations={locations} />}
            {section === 'json' && <JsonSection value={jsonText} error={jsonError} onChange={onJsonChange} />}
          </OpsContext.Provider>
        </div>
      </div>
    </div>
  );
}

/** 页面上方：检查的结果（检查通过 / 几个错误几个提醒）、剧本里有几个身份地点线索结局，下面列出问题，点了跳过去。 */
function CheckBar({
  check,
  current,
  size,
  error,
  open,
  onToggle,
  onJump,
}: {
  check: CheckState | null;
  /** 整份剧本写成 JSON 有多少个字、多少字节（快到上限时写出来）。 */
  size: { chars: number; bytes: number };
  /** 检查结果是不是现在这一份的（改了还没查完的时候，先接着显示上一次的）。 */
  current: boolean;
  error: string;
  open: boolean;
  onToggle: () => void;
  onJump: (p: EditorProblem) => void;
}) {
  const problems = check?.result.problems ?? [];
  const errors = check?.result.errors ?? 0;
  const warnings = check?.result.warnings ?? 0;
  let tone: 'ok' | 'warn' | 'bad' | 'wait';
  let status: string;
  if (error) {
    tone = 'bad';
    status = error;
  } else if (!check) {
    tone = 'wait';
    status = '正在检查……';
  } else if (errors) {
    tone = 'bad';
    status = `${errors} 个错误${warnings ? ` · ${warnings} 个提醒` : ''}`;
  } else {
    tone = warnings ? 'warn' : 'ok';
    status = warnings ? `检查通过 · ${warnings} 个提醒` : '检查通过';
  }
  const s = check?.result.summary;
  return (
    <section className={`ed-check-bar is-${tone}`} aria-label="检查结果">
      <div className="ed-check-line">
        {problems.length > 0 ? (
          <button type="button" className="ed-check-status" aria-expanded={open} onClick={onToggle}>
            {status}
          </button>
        ) : (
          <span className="ed-check-status" role="status">
            {status}
          </span>
        )}
        {check && !current && !error && <span className="ed-checking">正在检查……</span>}
        {(size.chars >= EDITOR_MAX_CHARS * 0.9 || size.bytes >= EDITOR_MAX_BYTES * 0.9) && (
          <span className="ed-size">
            {size.chars >= EDITOR_MAX_CHARS * 0.9
              ? `${size.chars.toLocaleString()} 字，最多 ${EDITOR_MAX_CHARS.toLocaleString()} 字`
              : `${Math.ceil(size.bytes / 1024)}KB，最多 ${EDITOR_MAX_BYTES / 1024}KB`}
          </span>
        )}
        {s && (
          <span className="ed-summary">
            {s.roles} 个身份 · {s.locations} 个地点 · {s.npcs} 个 NPC · {s.clues} 条线索 · {s.endings} 个结局
            {s.five && ` · ${s.monsters} 种怪物 · ${s.treasure} 处宝藏`}
          </span>
        )}
      </div>
      {open && problems.length > 0 && (
        <ul className="ed-problems">
          {problems.map((p, i) => (
            <li key={i}>
              <button type="button" className={`ed-problem is-${p.level}`} onClick={() => onJump(p)}>
                <span className="ed-problem-tag">{p.level === 'error' ? '错误' : '提醒'}</span>
                <span className="ed-problem-where">{SECTION_NAME[p.section]}</span>
                <span className="ed-problem-text">{p.text}</span>
              </button>
            </li>
          ))}
          {errors + warnings > problems.length && <li className="ed-problems-more">还有 {errors + warnings - problems.length} 条</li>}
        </ul>
      )}
    </section>
  );
}
