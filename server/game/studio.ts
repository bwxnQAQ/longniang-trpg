import type { AiClient, CallMeta } from '../ai/client';
import { AiError, AiRefusal, refusalOf, textOf, type MessagesRequest } from '../ai/types';
import { requireCredit } from '../credit';
import type { DB } from '../db';
import { asInt, asObject, asOneOf, asString, HttpError } from '../http';
import type { RealtimeHub } from '../realtime';
import type { Rooms } from '../routes/rooms';
import type { Safety } from '../safety';
import { CATEGORY_KEYS, type GenerateScenarioInput, type ScenarioCategory, type ScenarioJobStep, type ScenarioJobView } from '../../shared/game';
import type { GameEngine } from './engine';
import { SCENARIO_FORMAT, strictIssues, validateScenario, type Scenario } from './scenario';

// AI 生成的剧本要求更严的那几条挪到了 scenario.ts（V0.8.3，写剧本 skill 的检查脚本也用），这里接着导出
export { strictIssues };
import {
  buildConvertRequest,
  buildDetailsRequest,
  buildFixRequest,
  buildOutlineRequest,
  CONVERT_TEXT_MAX,
  DUNGEON_SCHEMA,
  normalizeDungeonVariants,
  OUTLINE_SCHEMA,
  SCENARIO_SCHEMA,
  SCENARIO_WRITER_SYSTEM,
} from './scenario-prompts';

// 剧本工坊：房主让 AI 生成剧本，或者把一份文本剧本转成本站的格式。
// 流程：（生成）写大纲 → 写完整的剧本，（转换）直接转 → 程序检查 → 有问题让 AI 改，最多改两次 → 存进这一局。
// 要好几分钟，在后台做；每一步和进度推给这一局的人看。
// AI 生成的剧本默认“盲开”：真相、线索、NPC 和检查出的具体问题都不给任何人看，房主也可以当玩家。

/** 检查出问题以后最多让 AI 改几次。 */
const MAX_FIX_ROUNDS = 2;
/** 进度最多每隔多久推一次。 */
const PROGRESS_PUSH_MS = 1500;
/** 大纲短，完整剧本长；思考也算在里面。 */
const OUTLINE_MAX_TOKENS = 32_000;
const FULL_MAX_TOKENS = 64_000;
/** 转换的原文至少多少字，太短的不像剧本。 */
const CONVERT_TEXT_MIN = 100;

type JobKind = 'generate' | 'convert';
type JobStatus = ScenarioJobView['status'];

type JobRow = {
  id: number;
  room_id: number;
  user_id: number | null;
  kind: JobKind;
  status: JobStatus;
  step: ScenarioJobStep | null;
  fix_round: number;
  input: string;
  error: string | null;
  notes: string | null;
  created_at: number;
  finished_at: number | null;
  by_name: string | null;
};

/** 给用户看的失败原因。 */
class StudioError extends Error {}

/** 房主填的生成要求：检查长度和范围，没填的选填项是空字符串。 */
export function parseGenerateInput(body: unknown): GenerateScenarioInput {
  const o = asObject(body);
  const optional = (value: unknown, max: number, message: string) =>
    value === undefined || value === null || (typeof value === 'string' && !value.trim()) ? '' : asString(value, { max, message });
  return {
    category: parseCategory(o.category),
    genre: asString(o.genre, { max: 20, message: '题材要在1～20个字之间' }),
    tone: optional(o.tone, 60, '基调最多60个字'),
    players: asInt(o.players, { min: 1, max: 6, message: '人数要在1～6之间' }),
    days: asInt(o.days, { min: 1, max: 14, message: '预计天数要在1～14之间' }),
    relation: asOneOf(o.relation ?? 'auto', ['auto', 'coop', 'secrets', 'versus'] as const, '玩家关系不对'),
    avoid: optional(o.avoid, 200, '不想出现的内容最多200个字'),
    want: optional(o.want, 300, '想要的元素最多300个字'),
  };
}

/** 分区：生成、转换剧本时选的。V0.5.0 以前的网页不传，按解谜算。 */
export function parseCategory(value: unknown): ScenarioCategory {
  return value === undefined || value === null || value === '' ? 'puzzle' : asOneOf(value, CATEGORY_KEYS, '分区不对');
}

/** 发给 AI 检查内容的生成要求。 */
function requirementsText(input: GenerateScenarioInput): string {
  return [
    `题材：${input.genre}`,
    input.tone && `基调：${input.tone}`,
    input.avoid && `不想出现的内容：${input.avoid}`,
    input.want && `想要的元素：${input.want}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** 雷点按逗号、顿号、分号、换行分开，每条最多40字，最多20条（剧本格式的限制）。 */
export function splitAvoid(text: string): string[] {
  return text
    .split(/[，,、；;\n]+/)
    .map((s) => [...s.trim()].slice(0, 40).join(''))
    .filter(Boolean)
    .slice(0, 20);
}

/**
 * 程序定死的字段直接改好，不让 AI 在这些地方出错：
 * 格式版本；生成的剧本按房主填的人数、天数、关系、雷点；转换的剧本人数夹在 1～6。
 */
function normalize(draft: unknown, kind: JobKind, input: GenerateScenarioInput | null, members: number, category: ScenarioCategory): unknown {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return draft;
  // 分区是房主选的；作者是谁另外记（投稿的时候），剧本里不写
  const d: Record<string, unknown> = { ...(draft as Record<string, unknown>), format: SCENARIO_FORMAT, category };
  delete d.author;
  if (kind === 'generate' && input) {
    d.players = { min: 1, max: input.players };
    d.expectedDays = input.days;
    if (input.players === 1) d.relation = 'coop';
    else if (input.relation !== 'auto') d.relation = input.relation;
    d.safety = { avoid: splitAvoid(input.avoid) };
  } else if (d.players && typeof d.players === 'object') {
    const p = d.players as { min?: unknown; max?: unknown };
    const clamp = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isInteger(v) ? Math.min(hi, Math.max(lo, v)) : hi);
    // 这一局已经有这么多人了：人数上限至少是这么多，身份不够的让 AI 补
    const max = Math.max(clamp(p.max, 1, 6), Math.min(6, members));
    d.players = { min: clamp(p.min, 1, max), max };
  }
  return d;
}

/** 从 AI 的回复里读出 JSON：结构化输出直接就是；没用结构化输出时，取第一个 { 到最后一个 }。 */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) return undefined;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return undefined;
    }
  }
}

export class ScenarioStudio {
  private readonly controllers = new Map<number, AbortController>();
  private readonly progress = new Map<number, { chars: number; pushedAt: number }>();
  private readonly pending = new Set<Promise<void>>();
  private readonly abort = new AbortController();
  private stopped = false;
  /** 接口嫌输出格式太复杂、不接受结构化输出：之后都改成把格式写进提示里。 */
  private schemaRejected = false;

  constructor(
    private readonly opts: {
      db: DB;
      ai: AiClient;
      safety: Safety;
      rooms: Rooms;
      hub: () => RealtimeHub;
      engine: GameEngine;
      now: () => number;
    },
  ) {}

  /** 服务器启动时：上次没做完的（服务器停的时候还在跑的）标成失败。 */
  recover() {
    const now = this.opts.now();
    this.opts.db
      .prepare(
        `UPDATE scenario_jobs SET status = 'failed', error = '服务器重启了，这次没做完，请重新开始', finished_at = ?, updated_at = ?
         WHERE status = 'running'`,
      )
      .run(now, now);
  }

  async stop() {
    this.stopped = true;
    this.abort.abort();
    await this.idle();
  }

  /** 测试用：等后台的任务都做完。 */
  async idle() {
    while (this.pending.size) await Promise.allSettled([...this.pending]);
  }

  /** 这一局最近一次生成或转换的情况。 */
  latest(roomId: number, userId: number): ScenarioJobView | null {
    const { manager } = this.opts.rooms.access(roomId, userId);
    const row = this.opts.db.prepare(`${JOB_SELECT} WHERE j.room_id = ? ORDER BY j.id DESC LIMIT 1`).get(roomId) as JobRow | undefined;
    return row ? this.view(row, manager) : null;
  }

  /**
   * 生成、转换期间还能有几个人加入：生成的按房主填的人数；转换的剧本人数要等转完才知道，先不让新的人进来。
   * 没在生成时是 null（不额外限制）。
   */
  joinLimit(roomId: number): { limit: number; message: string } | null {
    const row = this.runningRow(roomId);
    if (!row) return null;
    if (row.kind === 'generate') {
      const players = (JSON.parse(row.input) as GenerateScenarioInput).players;
      return { limit: players, message: `这一局正在按${players}个人生成剧本，已经满员了` };
    }
    return { limit: this.opts.rooms.memberIds(roomId).length, message: '房主正在准备剧本，准备好以后再来加入' };
  }

  /** 生成剧本：先检查要求、额度，再把房主写的要求发给 AI 检查内容，没问题才开始。 */
  async generate(roomId: number, userId: number, body: unknown): Promise<ScenarioJobView> {
    const input = parseGenerateInput(body);
    const check = () => {
      this.checkCanStart(roomId, userId);
      const members = this.opts.rooms.memberIds(roomId).length;
      if (input.players < members) throw new HttpError(400, `这一局现在有${members}个人，人数不能少于${members}`);
    };
    check();
    requireCredit(this.opts.db, userId);
    await this.opts.safety.precheck(userId, roomId, 'generate', requirementsText(input));
    // 检查内容要一会儿，这期间情况可能变了
    check();
    const by = this.checkCanStart(roomId, userId);
    return this.startJob(roomId, userId, 'generate', JSON.stringify(input), `${by}开始用 AI 生成剧本（${input.genre}，${input.players}人）`);
  }

  /** 转换文本剧本：原文是房主贴的，同样先检查内容。 */
  async convert(roomId: number, userId: number, body: unknown): Promise<ScenarioJobView> {
    const o = asObject(body);
    const category = parseCategory(o.category);
    const text = typeof o.text === 'string' ? o.text.trim() : '';
    const length = [...text].length;
    if (!length) throw new HttpError(400, '请粘贴剧本的原文');
    if (length < CONVERT_TEXT_MIN) throw new HttpError(400, `原文只有${length}个字，不像一份完整的剧本`);
    if (length > CONVERT_TEXT_MAX) throw new HttpError(400, `原文最多${CONVERT_TEXT_MAX}个字，现在有${length}个`);
    this.checkCanStart(roomId, userId);
    requireCredit(this.opts.db, userId);
    await this.opts.safety.precheck(userId, roomId, 'scenario', text);
    const by = this.checkCanStart(roomId, userId);
    return this.startJob(roomId, userId, 'convert', JSON.stringify({ text, category }), `${by}开始把一份文本剧本转成这里的格式`);
  }

  cancel(roomId: number, userId: number): ScenarioJobView {
    this.opts.rooms.requireManager(roomId, userId, '只有房主能取消');
    const row = this.runningRow(roomId);
    if (!row) throw new HttpError(409, '现在没有在生成');
    this.finish(row.id, 'cancelled', null);
    this.controllers.get(row.id)?.abort();
    return this.view(this.load(row.id)!, true);
  }

  /** 对局要被删除、结束时：停下这一局正在做的。 */
  cancelRoom(roomId: number) {
    const row = this.runningRow(roomId);
    if (!row) return;
    this.finish(row.id, 'cancelled', null);
    this.controllers.get(row.id)?.abort();
  }

  /** 能不能开始生成、转换：房主（或能管这一局的管理员）、准备阶段、没有在生成。返回记录里写的身份。 */
  private checkCanStart(roomId: number, userId: number): string {
    const { room, by } = this.opts.rooms.requireManager(roomId, userId, '只有房主能生成或导入剧本');
    if (room.status !== 'preparing') throw new HttpError(409, '对局已经开始了，不能再换剧本');
    if (this.runningRow(roomId)) throw new HttpError(409, '已经在生成了，等这一次做完或者取消');
    const ai = this.opts.ai.statusFor('scenario', roomId);
    if (!ai.ready) throw new HttpError(503, ai.message ?? 'AI 暂时用不了');
    return by;
  }

  private startJob(roomId: number, userId: number, kind: JobKind, input: string, logText: string): ScenarioJobView {
    const now = this.opts.now();
    const { lastInsertRowid } = this.opts.db
      .prepare(
        `INSERT INTO scenario_jobs (room_id, user_id, kind, status, step, input, created_at, updated_at)
         VALUES (?, ?, ?, 'running', ?, ?, ?, ?)`,
      )
      .run(roomId, userId, kind, kind === 'generate' ? 'outline' : 'converting', input, now, now);
    const id = Number(lastInsertRowid);
    const controller = new AbortController();
    this.controllers.set(id, controller);
    this.progress.set(id, { chars: 0, pushedAt: 0 });
    this.opts.rooms.addLog(roomId, 'system', logText);
    const row = this.load(id)!;
    this.push(row);
    this.opts.rooms.activity(roomId);
    this.opts.rooms.notifyHall(roomId);
    this.track(this.run(id, controller.signal));
    return this.view(row, true);
  }

  private async run(jobId: number, jobSignal: AbortSignal) {
    const job = this.load(jobId);
    if (!job) return;
    const signal = AbortSignal.any([this.abort.signal, jobSignal]);
    const input = job.kind === 'generate' ? (JSON.parse(job.input) as GenerateScenarioInput) : null;
    // V0.5.0 以前开始的（升级时还没做完的会标成失败，这里只是以防万一）没有分区，按解谜算
    const category: ScenarioCategory = (JSON.parse(job.input) as { category?: ScenarioCategory }).category ?? 'puzzle';
    // 地下城（V0.7.0）用另一份输出格式（多 dungeon、身份不写属性、结局写 result）
    const schema = category === 'dungeon' ? DUNGEON_SCHEMA : SCENARIO_SCHEMA;
    try {
      let draft: unknown;
      if (input) {
        const outline = await this.ask(job, buildOutlineRequest(input), OUTLINE_SCHEMA, OUTLINE_MAX_TOKENS, signal);
        this.setStep(job, 'details', 0);
        draft = await this.ask(job, buildDetailsRequest(input, outline), schema, FULL_MAX_TOKENS, signal);
      } else {
        const { text } = JSON.parse(job.input) as { text: string };
        const members = this.opts.rooms.memberIds(job.room_id).length;
        draft = await this.ask(job, buildConvertRequest(text, members, category), schema, FULL_MAX_TOKENS, signal);
      }

      // 改的过程中可能越改越糟：记住问题最少的那一份能用的剧本，接着在它上面改；最后改不好就用它
      let best: { scenario: Scenario; data: unknown; issues: string[]; warnings: string[] } | null = null;
      for (let round = 0; ; round++) {
        this.setStep(job, 'checking', round);
        const data = normalize(normalizeDungeonVariants(draft), job.kind, input, this.opts.rooms.memberIds(job.room_id).length, category);
        const result = validateScenario(data);
        // 生成的剧本连“提醒”也要改掉；转换的剧本只改错误，提醒留给房主（他看得到全部内容）
        const issues = input ? [...result.errors, ...result.warnings, ...strictIssues(data)] : result.errors;
        if (result.scenario && (!best || issues.length < best.issues.length)) best = { scenario: result.scenario, data, issues, warnings: result.warnings };
        if (best && (best.issues.length === 0 || round >= MAX_FIX_ROUNDS)) {
          if (jobSignal.aborted) return;
          this.setStep(job, 'saving', round);
          this.install(job, best.scenario, input ? [] : best.warnings);
          return;
        }
        if (round >= MAX_FIX_ROUNDS) {
          throw new StudioError(
            input
              ? `生成的剧本有${issues.length}处问题，让 AI 改了${MAX_FIX_ROUNDS}次还没改好。为了不剧透，这里不列出具体内容，可以再生成一次。`
              : `转换出来的剧本有${issues.length}处错误，让 AI 改了${MAX_FIX_ROUNDS}次还没改好：${issues.slice(0, 5).join('；')}${issues.length > 5 ? '……' : ''}`,
          );
        }
        this.setStep(job, 'fixing', round + 1);
        const target = best ?? { data, issues };
        draft = await this.ask(job, buildFixRequest(target.data, target.issues), schema, FULL_MAX_TOKENS, signal);
      }
    } catch (err) {
      // 服务器在停：下次启动时标成失败；房主取消的：已经标好了
      if (this.stopped || jobSignal.aborted) return;
      let message: string;
      let refusal: AiRefusal | null = null;
      if (err instanceof AiRefusal) {
        refusal = err;
        message = input ? '生成的内容被 AI 的安全机制拒绝了。换个题材或者写法再试。' : '这份剧本被 AI 的安全机制拒绝了，转换不了。';
      } else if (err instanceof StudioError || err instanceof HttpError || err instanceof AiError) {
        // 这里不会自动重试，换成让房主自己再试
        message = err.message.replace(/，?过一会儿会自动重试/, '');
        if (err instanceof AiError && err.retryable) message += '。可以再试一次。';
      } else {
        console.error('生成剧本出错：', err);
        message = '出错了，请再试一次';
      }
      this.finish(jobId, 'failed', message);
      // 转换的原文是房主自己贴的：被拒绝按违规处理（封号）；生成的内容是 AI 写的：只标给管理员看
      if (refusal) {
        this.opts.safety.refusal({
          userId: job.user_id,
          roomId: job.room_id,
          source: input ? 'generate' : 'scenario',
          content: input ? requirementsText(input) : (JSON.parse(job.input) as { text: string }).text,
          category: refusal.category,
          soloAuthor: !input,
        });
      }
    } finally {
      this.controllers.delete(jobId);
      this.progress.delete(jobId);
    }
  }

  /** 让 AI 写一步：流式返回（要好几分钟），先想后写，输出按 schema 的 JSON。 */
  private async ask(job: JobRow, content: string, schema: Record<string, unknown>, maxTokens: number, signal: AbortSignal): Promise<unknown> {
    signal.throwIfAborted();
    // 剧本是给这一局所有人玩的：花费由这一局的人平摊
    const meta: CallMeta = { roomId: job.room_id, userId: job.user_id, billing: 'room' };
    const hooks = { onProgress: (chars: number) => this.onProgress(job, chars) };
    const request: Omit<MessagesRequest, 'model'> = {
      max_tokens: maxTokens,
      system: [{ type: 'text', text: SCENARIO_WRITER_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content }],
      thinking: { type: 'adaptive' },
      output_config: { format: { type: 'json_schema', schema } },
      stream: true,
    };
    // 接口嫌输出格式太复杂、不接受结构化输出：把格式写进提示里，让 AI 自己照着写
    const withoutSchema: Omit<MessagesRequest, 'model'> = {
      ...request,
      output_config: undefined,
      messages: [
        {
          role: 'user',
          content: `${content}\n\n# 输出格式\n只输出一个 JSON 对象，不要别的文字，也不要用代码块包起来。字段和嵌套按下面的 JSON Schema：\n${JSON.stringify(schema)}`,
        },
      ],
    };
    let response;
    if (this.schemaRejected) {
      response = await this.opts.ai.send('scenario', withoutSchema, meta, signal, hooks);
    } else {
      try {
        response = await this.opts.ai.send('scenario', request, meta, signal, hooks);
      } catch (err) {
        if (!(err instanceof AiError) || err.status !== 400 || !/schema|grammar|complex/i.test(err.message)) throw err;
        this.schemaRejected = true;
        response = await this.opts.ai.send('scenario', withoutSchema, meta, signal, hooks);
      }
    }
    if (response.stop_reason === 'refusal') throw refusalOf(response, '被 AI 的安全机制拒绝了');
    if (response.stop_reason === 'max_tokens') throw new StudioError('AI 写得太长，没写完。可以再试一次，或者把人数、天数调小一点。');
    const parsed = parseJson(textOf(response));
    if (parsed === undefined) throw new StudioError('AI 的回复不是完整的 JSON，请再试一次。');
    return parsed;
  }

  private install(job: JobRow, scenario: Scenario, notes: string[]) {
    if (job.kind === 'generate') {
      this.opts.engine.installScenario(job.room_id, scenario, 'generated', null, `AI 生成了剧本《${scenario.title}》，房主也没看过真相，可以一起当玩家`);
    } else {
      this.opts.engine.installScenario(job.room_id, scenario, 'imported', null, `房主导入了剧本《${scenario.title}》`);
    }
    this.finish(job.id, 'done', null, notes);
  }

  private setStep(job: JobRow, step: ScenarioJobStep, fixRound: number) {
    const changed = this.opts.db
      .prepare("UPDATE scenario_jobs SET step = ?, fix_round = ?, updated_at = ? WHERE id = ? AND status = 'running'")
      .run(step, fixRound, this.opts.now(), job.id).changes;
    if (!changed) return;
    this.progress.set(job.id, { chars: 0, pushedAt: Date.now() });
    this.push(this.load(job.id)!);
  }

  private onProgress(job: JobRow, chars: number) {
    const p = this.progress.get(job.id);
    if (!p) return;
    p.chars = chars;
    const now = Date.now();
    if (now - p.pushedAt < PROGRESS_PUSH_MS) return;
    p.pushedAt = now;
    const row = this.load(job.id);
    if (row?.status === 'running') this.push(row);
  }

  private finish(jobId: number, status: Exclude<JobStatus, 'running'>, error: string | null, notes: string[] = []) {
    const now = this.opts.now();
    const changed = this.opts.db
      .prepare(
        `UPDATE scenario_jobs SET status = ?, error = ?, notes = ?, finished_at = ?, updated_at = ?
         WHERE id = ? AND status = 'running'`,
      )
      .run(status, error, JSON.stringify(notes), now, now, jobId).changes;
    if (!changed) return;
    const row = this.load(jobId);
    if (!row) return;
    this.push(row);
    this.opts.rooms.activity(row.room_id);
    // 大厅里显示“AI 正在写剧本”、剧本标题的，要刷新
    this.opts.rooms.notifyHall(row.room_id);
  }

  private runningRow(roomId: number): JobRow | undefined {
    return this.opts.db.prepare(`${JOB_SELECT} WHERE j.room_id = ? AND j.status = 'running'`).get(roomId) as JobRow | undefined;
  }

  private load(id: number): JobRow | undefined {
    return this.opts.db.prepare(`${JOB_SELECT} WHERE j.id = ?`).get(id) as JobRow | undefined;
  }

  /**
   * 给网页看的情况。转换出来的剧本，房主本来就知道内容，检查出的问题和提醒都给他看；
   * 别人只看得到进度，看不到这些（里面有线索、真相的名字）。
   */
  private view(row: JobRow, forHost: boolean): ScenarioJobView {
    return {
      id: row.id,
      kind: row.kind,
      status: row.status,
      step: row.step,
      fixRound: row.fix_round,
      chars: row.status === 'running' ? (this.progress.get(row.id)?.chars ?? 0) : 0,
      error: row.error === null ? null : forHost ? row.error : '没有成功',
      notes: forHost && row.notes ? (JSON.parse(row.notes) as string[]) : [],
      by: row.by_name ?? '已注销的账号',
      startedAt: row.created_at,
      finishedAt: row.finished_at,
    };
  }

  private push(row: JobRow) {
    const host = this.opts.db.prepare("SELECT user_id FROM players WHERE room_id = ? AND role = 'host'").get(row.room_id) as { user_id: number } | undefined;
    this.opts.hub().toRoomEach(row.room_id, 'scenario-job', (userId) => this.view(row, userId === host?.user_id));
  }

  private track(work: Promise<void>) {
    const p = work.catch((err) => console.error('剧本工坊的后台任务出错：', err));
    this.pending.add(p);
    void p.then(() => this.pending.delete(p));
  }
}

const JOB_SELECT = `SELECT j.id, j.room_id, j.user_id, j.kind, j.status, j.step, j.fix_round, j.input, j.error, j.notes,
  j.created_at, j.finished_at, u.display_name AS by_name
  FROM scenario_jobs j LEFT JOIN users u ON u.id = j.user_id`;
