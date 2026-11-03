import { randomBytes } from 'node:crypto';
import type { DB } from '../db';
import { aiEnabled, getSetting } from '../settings';
import { costOf, isDeepSeekModel, isRelayModel, KNOWN_MODELS, MODEL_LABEL, modelOptions } from './pricing';
import {
  AiError,
  partialUsageOf,
  sumUsage,
  toolUsesOf,
  type AiProvider,
  type Effort,
  type MessagesRequest,
  type MessagesResponse,
  type SendHooks,
  type Usage,
} from './types';

/**
 * AI 的几种用途。主持（结算行动）、生成剧本、杂活（估时、场外问答、摘要）、内容检查可以分别用不同的模型。
 * 内容检查（moderation）是发给主持 AI 之前，先看一眼有没有违规（默认也用 Opus，看得最准）。
 */
export type AiPurpose = 'resolve' | 'estimate' | 'answer' | 'summary' | 'scenario' | 'moderation' | 'guide' | 'review';
/**
 * guide：网站向导（V0.6.0），正式用户问网站的事，花他自己的额度。
 * review：AI 审核（V0.6.0），投稿、举报交上来先看一遍，把意见给管理员（花网站的钱，最后由管理员裁决）。
 */
export type AiRole = 'dm' | 'scenario' | 'misc' | 'guard' | 'guide' | 'review';

export const AI_ROLES: AiRole[] = ['dm', 'scenario', 'misc', 'guard', 'guide', 'review'];

/** 管理员在网页上选的模型存在设置里的名字。 */
export const modelSettingKey = (role: AiRole) => `ai_model_${role}`;

const ROLE_OF: Record<AiPurpose, AiRole> = {
  resolve: 'dm',
  scenario: 'scenario',
  estimate: 'misc',
  answer: 'misc',
  summary: 'misc',
  moderation: 'guard',
  guide: 'guide',
  review: 'review',
};

export type AiSettings = {
  models: Record<AiRole, string>;
  effort: Record<AiRole, Effort>;
  /** OpenRouter 上要用的模型（.env 的 OPENROUTER_MODELS）；管理员在网页上改过就用网页上的。 */
  openrouterModels?: string[];
};

/** OpenRouter 这类服务：除了调用，还能列出有哪些模型、每百万 token 多少钱（美元）。 */
export type CatalogModel = {
  id: string;
  name: string;
  contextLength?: number | null;
  price: { input: number; output: number; cacheRead?: number | null } | null;
};
export type ModelCatalog = { listModels(force?: boolean): Promise<CatalogModel[]> };

/** 管理员在网页上填的 OpenRouter 模型，存在设置里的名字。 */
export const OPENROUTER_MODELS_SETTING = 'openrouter_models';

/** OpenRouter 的模型名：openai/gpt-5.2、~anthropic/claude-opus-latest 这样；别家兼容的服务可能没有斜杠。 */
export const OPENROUTER_MODEL_RE = /^~?[A-Za-z0-9][A-Za-z0-9._:/-]{0,99}$/;

/** 默认四项都用 DeepSeek V4.1 Flash 1017（V0.4.1 起）；.env 里的 CLAUDE_*_MODEL、管理页上选的优先。 */
/**
 * 开局能选哪些主持模型，按房主的身份分（游客开不了局；站长什么都能选）。站长在「管理」→「AI」里设。
 * 没设置过：普通用户只能选 DeepSeek 的模型，管理员都能选。
 */
export const MODEL_GROUPS = ['user', 'admin'] as const;
export type ModelGroup = (typeof MODEL_GROUPS)[number];
export const MODEL_GROUP_LABEL: Record<ModelGroup | 'owner', string> = { user: '普通用户', admin: '管理员', owner: '站长' };
export const MODEL_GROUP_SETTING: Record<ModelGroup, string> = { user: 'dm_models_user', admin: 'dm_models_admin' };

/** 这一局「跟随网站设置」、但网站设的主持模型这个身份不能用时，先用它（能用的话），不能用就用能选的第一个。 */
export const DM_FALLBACK = 'deepseek-flash';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  models: { dm: 'deepseek-flash', scenario: 'deepseek-flash', misc: 'deepseek-flash', guard: 'deepseek-flash', guide: 'deepseek-flash', review: 'deepseek-flash' },
  effort: { dm: 'medium', scenario: 'high', misc: 'low', guard: 'low', guide: 'low', review: 'medium' },
};

/**
 * 这次调用属于哪一局、哪个行动、替谁做的。
 * userId：内容是谁写的（他的行动、他的提问），会换成匿名编号发给 Anthropic。
 * billing：花费记到谁头上。self 记给 userId；room 由这一局参与游戏的人平摊（有角色的玩家，还没人建角色时是全体成员）。
 * 不写时：有 userId 就是 self，没有就是 room。
 */
export type CallMeta = {
  roomId: number | null;
  actionId?: number | null;
  userId?: number | null;
  billing?: 'self' | 'room';
  /** 花费记给这个人，不管内容是谁写的（房主让主持人重新结算别人的行动时，钱记给房主）。 */
  payer?: number | null;
  /** 用这个模型，不按用途重新选（一次结算要调用好几轮时，从头到尾用同一个）。 */
  model?: string;
};

/**
 * 在还没输出任何内容之前就被拒绝时，只有这几类要付钱（Anthropic 文档“Refusals and fallback”，2026年9月）；
 * 其他类别、没有类别的不收费。输出到一半才被拒绝的，照常收已经输出的部分。
 */
const BILLED_REFUSAL_CATEGORIES = new Set(['bio', 'frontier_llm', 'reasoning_extraction']);

export const AI_OFF_MESSAGE = '管理员暂时关掉了 AI，等打开以后才能继续。';

/** 管理员关掉了 AI。不算出错：在等的行动放回去，等打开以后接着结算。 */
export class AiSwitchedOff extends AiError {
  constructor() {
    super(AI_OFF_MESSAGE, false);
  }
}

export type AiStatus = { ready: boolean; message: string | null };

/** 所有 AI 调用都走这里：按用途选模型和思考强度，检查费用上限，记下用量和费用。 */
export class AiClient {
  /** 记了账以后通知一声（谁被记了钱）：额度用完的人不再算回合的参与者，要重新看看回合能不能开始。 */
  onCharged: ((userIds: number[]) => void) | null = null;

  /**
   * provider：Claude（测试时是假主持人）；deepseek：DeepSeek 的模型走它。
   * 没有 deepseek 时（测试用的假主持人），DeepSeek 的模型也交给 provider。
   */
  /** OpenRouter 上的模型的名字和价格（从 OpenRouter 拿的，见 refreshCatalog）。 */
  private catalog = new Map<string, CatalogModel>();

  constructor(
    private readonly db: DB,
    readonly provider: AiProvider,
    readonly settings: AiSettings = DEFAULT_AI_SETTINGS,
    private readonly now: () => number = Date.now,
    readonly deepseek: AiProvider | null = null,
    /** OpenRouter（或者别家兼容 OpenAI 格式的服务）：填在「OpenRouter 的模型」里的模型交给它。没有时（测试用的假主持人）交给 provider。 */
    readonly openrouter: (AiProvider & Partial<ModelCatalog>) | null = null,
    /** 中转站（V1.0.1）：ChatGPT 的模型交给它。没有时（测试用的假主持人）交给 provider。 */
    readonly relay: AiProvider | null = null,
  ) {}

  /** 这个模型由哪一家调用。 */
  providerFor(model: string): AiProvider {
    if (this.isOpenRouterModel(model)) return this.openrouter ?? this.provider;
    if (isRelayModel(model)) return this.relay ?? this.provider;
    return isDeepSeekModel(model) && this.deepseek ? this.deepseek : this.provider;
  }

  /** 网站上能选的 OpenRouter 模型：管理员在网页上填的；没填过就是 .env 里 OPENROUTER_MODELS 写的。 */
  get openRouterModels(): string[] {
    const raw = getSetting(this.db, OPENROUTER_MODELS_SETTING);
    if (raw !== null) {
      try {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list.filter((m): m is string => typeof m === 'string' && OPENROUTER_MODEL_RE.test(m) && !KNOWN_MODELS.includes(m));
      } catch {
        // 设置坏了：当成没填
      }
      return [];
    }
    return (this.settings.openrouterModels ?? []).filter((m) => OPENROUTER_MODEL_RE.test(m) && !KNOWN_MODELS.includes(m));
  }

  isOpenRouterModel(model: string): boolean {
    return !KNOWN_MODELS.includes(model) && this.openRouterModels.includes(model);
  }

  /** 能选的模型：Claude、DeepSeek 的，加上填了的 OpenRouter 模型。 */
  knownModels(): string[] {
    return [...KNOWN_MODELS, ...this.openRouterModels];
  }

  isKnownModel(model: string): boolean {
    return KNOWN_MODELS.includes(model) || this.isOpenRouterModel(model);
  }

  /** 给人看的模型名字。 */
  modelName(model: string): string {
    return MODEL_LABEL[model]?.name ?? this.catalog.get(model)?.name ?? model;
  }

  /**
   * 从 OpenRouter 拿模型列表（名字、价格），记下来。拿不到（没设密钥、连不上、别家的服务不给价格）返回 null。
   * 启动时、管理员改了模型列表时调用。
   */
  async refreshCatalog(force = false): Promise<CatalogModel[] | null> {
    if (!this.openrouter?.listModels || !this.openrouter.status.ready) return null;
    try {
      const list = await this.openrouter.listModels(force);
      this.catalog = new Map(list.map((m) => [m.id, m]));
      return list;
    } catch (err) {
      console.error('拿不到 OpenRouter 的模型列表：', err instanceof Error ? err.message : err);
      return null;
    }
  }

  /**
   * 这几种用途（在这一局里）能不能用：管理员关掉了 AI、用的模型那一家没设置密钥时不能用，message 说明原因。
   * 不传对局就按网站的设置看。
   */
  statusFor(purposes: AiPurpose | AiPurpose[], roomId: number | null = null): AiStatus {
    if (!aiEnabled(this.db)) return { ready: false, message: AI_OFF_MESSAGE };
    for (const purpose of [purposes].flat()) {
      const status = this.providerFor(this.modelFor(purpose, roomId)).status;
      if (!status.ready) return status;
    }
    return { ready: true, message: null };
  }

  /** 这个模型能不能选：那一家的密钥设置了。 */
  modelUsable(model: string): AiStatus {
    if (!this.isKnownModel(model)) return { ready: false, message: `只能选 ${this.knownModels().join('、')}` };
    return this.providerFor(model).status;
  }

  /** 网页上给的模型选项，带上能不能选。OpenRouter 的模型排在后面，价格是从 OpenRouter 拿的（拿不到就不写）。 */
  modelOptions() {
    const round = (n: number) => Number(n.toPrecision(4));
    return [
      ...modelOptions((model) => this.providerFor(model).status.ready),
      ...this.openRouterModels.map((model) => {
        const listed = this.catalog.get(model);
        const vendor = model.includes('/') ? model.replace(/^~/, '').split('/')[0] : '';
        return {
          model,
          name: listed?.name ?? model,
          note: `经 OpenRouter 调用${vendor ? `，内容发给 ${vendor}` : ''}`,
          price: listed?.price ? { input: round(listed.price.input), output: round(listed.price.output) } : null,
          available: this.providerFor(model).status.ready,
        };
      }),
    ];
  }

  /** 管理员关掉了 AI。 */
  get switchedOff(): boolean {
    return !aiEnabled(this.db);
  }

  /** 现在实际用的模型：管理员在网页上选过的优先（马上生效），没选过用 .env 里设的（没设就是默认的）。 */
  get models(): Record<AiRole, string> {
    const models = { ...this.settings.models };
    for (const role of AI_ROLES) {
      const chosen = getSetting(this.db, modelSettingKey(role));
      if (chosen && this.isKnownModel(chosen)) models[role] = chosen;
    }
    return models;
  }

  /**
   * 这次调用用哪个模型：主持（结算行动）先看这一局房主选的，没选就用网站的设置。
   * 房主选的、网站设的，这一局房主的身份不能用的话（站长改了设置、房主换了人），换成 roomDmDefault。
   */
  modelFor(purpose: AiPurpose, roomId: number | null = null): string {
    const role = ROLE_OF[purpose];
    if (role === 'dm' && roomId !== null) {
      const row = this.db.prepare('SELECT dm_model FROM rooms WHERE id = ?').get(roomId) as { dm_model: string | null } | undefined;
      if (row?.dm_model && this.isKnownModel(row.dm_model) && this.roomAllowedModels(roomId).includes(row.dm_model)) return row.dm_model;
      return this.roomDmDefault(roomId);
    }
    return this.models[role];
  }

  /** 这种身份开局能选哪些主持模型（站长都能选）。没设置过：普通用户只能选 DeepSeek 的，管理员都能选。 */
  allowedDmModels(group: ModelGroup | 'owner'): string[] {
    const all = this.knownModels();
    if (group === 'owner') return all;
    const raw = getSetting(this.db, MODEL_GROUP_SETTING[group]);
    if (raw !== null) {
      try {
        const list = JSON.parse(raw);
        // "all"：全部，包括以后再加的模型（网页上勾的是具体的几个，这个是给自动测试和手动改设置用的）
        if (list === 'all') return all;
        if (Array.isArray(list)) {
          const picked = all.filter((m) => list.includes(m));
          if (picked.length) return picked;
        }
      } catch {
        // 设置坏了：当成没设置
      }
    }
    return group === 'user' ? all.filter(isDeepSeekModel) : all;
  }

  /** 这一局房主的身份（对局没了按站长算，不限）。 */
  roomGroup(roomId: number): ModelGroup | 'owner' {
    const row = this.db.prepare('SELECT u.is_admin, u.is_owner FROM rooms r JOIN users u ON u.id = r.host_user_id WHERE r.id = ?').get(roomId) as
      | { is_admin: number; is_owner: number }
      | undefined;
    if (!row || row.is_owner === 1) return 'owner';
    return row.is_admin === 1 ? 'admin' : 'user';
  }

  /** 这一局能选的主持模型：看房主的身份。 */
  roomAllowedModels(roomId: number): string[] {
    return this.allowedDmModels(this.roomGroup(roomId));
  }

  /** 这一局「跟随网站设置」时用的主持模型：网站设的；房主的身份不能用它的话，先用 DM_FALLBACK，再不行用能选的第一个。 */
  roomDmDefault(roomId: number): string {
    const allowed = this.roomAllowedModels(roomId);
    const site = this.models.dm;
    if (allowed.includes(site)) return site;
    return allowed.includes(DM_FALLBACK) ? DM_FALLBACK : (allowed[0] ?? site);
  }

  /** 一局到现在花了多少美元。 */
  roomCost(roomId: number): number {
    const row = this.db.prepare('SELECT COALESCE(SUM(cost_usd), 0) AS total FROM ai_calls WHERE room_id = ?').get(roomId) as {
      total: number;
    };
    return row.total;
  }

  async send(
    purpose: AiPurpose,
    request: Omit<MessagesRequest, 'model'>,
    meta: CallMeta,
    signal?: AbortSignal,
    hooks?: SendHooks,
  ): Promise<MessagesResponse> {
    if (!aiEnabled(this.db)) throw new AiSwitchedOff();
    if (meta.roomId !== null) {
      const room = this.db.prepare('SELECT cost_limit_usd FROM rooms WHERE id = ?').get(meta.roomId) as
        | { cost_limit_usd: number | null }
        | undefined;
      if (room?.cost_limit_usd != null && this.roomCost(meta.roomId) >= room.cost_limit_usd) {
        throw new AiError(`这一局的AI费用已经到房主设的上限（${room.cost_limit_usd}美元）了`, false);
      }
    }
    const role = ROLE_OF[purpose];
    const userRef = meta.userId != null ? this.anonymousId(meta.userId) : null;
    const full: MessagesRequest = {
      ...request,
      model: meta.model ?? this.modelFor(purpose, meta.roomId),
      output_config: { ...request.output_config, effort: this.settings.effort[role] },
      // 官方建议带上终端用户的编号：万一有人输入违规内容，Anthropic 能分清是哪个用户
      ...(userRef ? { metadata: { user_id: userRef } } : {}),
    };
    const provider = this.providerFor(full.model);
    const started = this.now();
    try {
      const response = await provider.send(full, signal, hooks);
      const usage = response.usage ?? { input_tokens: 0, output_tokens: 0 };
      // 成功之前中途断开的那几次也要付钱，一起记上
      const wasted = response.wasted_usage ?? null;
      // 那一家直接报了花多少（OpenRouter）就照报的记，拒绝了也一样
      const free = typeof usage.cost_usd !== 'number' && this.unbilledRefusal(response);
      const notes = [
        ...(wasted ? ['中途断开过，重新要了一次（断开的那次按收到的字数估算）'] : []),
        ...(free ? ['还没输出就被拒绝了，这一类不收费'] : []),
      ];
      this.record(purpose, provider, full.model, meta, {
        ...this.tokens(wasted ? sumUsage([usage, wasted]) : usage),
        cost: (free ? 0 : this.cost(provider, full.model, usage, started)) + (wasted ? this.cost(provider, full.model, wasted, started) : 0),
        durationMs: this.now() - started,
        stopReason: response.stop_reason,
        requestId: response.request_id ?? null,
        error: notes.length ? notes.join('；') : null,
        tools: toolUsesOf(response).map((u) => u.name),
      });
      return response;
    } catch (err) {
      // 没成功的调用也可能已经写了一部分：按估算的用量记账
      const partial = partialUsageOf(err);
      const message = err instanceof Error ? err.message.slice(0, 450) : String(err);
      this.record(purpose, provider, full.model, meta, {
        ...this.tokens(partial ?? { input_tokens: 0, output_tokens: 0 }),
        cost: partial ? this.cost(provider, full.model, partial, started) : 0,
        durationMs: this.now() - started,
        stopReason: null,
        requestId: null,
        error: partial ? `${message}（用量是估算的）` : message,
      });
      throw err;
    }
  }

  /** 还没输出任何内容就被拒绝、而且这一类拒绝不收费。 */
  private unbilledRefusal(response: MessagesResponse): boolean {
    if (response.stop_reason !== 'refusal') return false;
    const produced = (response.content ?? []).some((b) => (b.type === 'text' ? String((b as { text?: unknown }).text ?? '').length > 0 : true));
    return !produced && !BILLED_REFUSAL_CATEGORIES.has(response.stop_details?.category ?? '');
  }

  private tokens(usage: Usage) {
    return {
      input: usage.input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
      read: usage.cache_read_input_tokens ?? 0,
      write: usage.cache_creation_input_tokens ?? 0,
    };
  }

  /**
   * 一次调用花了多少美元。那一家直接报了（OpenRouter）就用报的；OpenRouter 的模型没报就按它列的价格算；
   * 别的按价格表算（at：调用开始的时间，DeepSeek 分高峰、非高峰）。
   */
  private cost(provider: AiProvider, model: string, usage: Usage, at: number): number {
    if (!provider.priced) return 0;
    if (typeof usage.cost_usd === 'number' && Number.isFinite(usage.cost_usd)) return usage.cost_usd;
    const listed = this.isOpenRouterModel(model) ? this.catalog.get(model)?.price : null;
    if (listed) {
      const read = usage.cache_read_input_tokens ?? 0;
      const written = usage.cache_creation_input_tokens ?? 0;
      return (usage.input_tokens * listed.input + written * listed.input + read * (listed.cacheRead ?? listed.input) + usage.output_tokens * listed.output) / 1_000_000;
    }
    return costOf(model, usage, at);
  }

  /** 账号的匿名编号：随机生成，和用户名、密码都没有关系，第一次用到时生成并存下来。 */
  private anonymousId(userId: number): string | null {
    const read = this.db.prepare('SELECT ai_ref FROM users WHERE id = ?');
    const row = read.get(userId) as { ai_ref: string | null } | undefined;
    if (!row) return null;
    if (row.ai_ref) return row.ai_ref;
    this.db.prepare('UPDATE users SET ai_ref = ? WHERE id = ? AND ai_ref IS NULL').run(randomBytes(16).toString('hex'), userId);
    return (read.get(userId) as { ai_ref: string }).ai_ref;
  }

  private record(
    purpose: AiPurpose,
    provider: AiProvider,
    model: string,
    meta: CallMeta,
    r: {
      input: number;
      output: number;
      read: number;
      write: number;
      cost: number;
      durationMs: number;
      stopReason: string | null;
      requestId: string | null;
      error: string | null;
      /** 这一回调用了哪些工具（V0.9.1）。 */
      tools?: string[];
    },
  ) {
    try {
      const { lastInsertRowid } = this.db
        .prepare(
          // 对局、行动可能在调用期间被删掉了：对不上的就记成空，花的钱照样记下
          `INSERT INTO ai_calls (room_id, action_id, user_id, provider, model, purpose, input_tokens, output_tokens,
             cache_read_tokens, cache_write_tokens, cost_usd, duration_ms, stop_reason, request_id, error, tools, created_at)
           VALUES ((SELECT id FROM rooms WHERE id = ?), (SELECT id FROM actions WHERE id = ?), (SELECT id FROM users WHERE id = ?),
             ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          meta.roomId,
          meta.actionId ?? null,
          meta.userId ?? null,
          provider.name,
          model,
          purpose,
          r.input,
          r.output,
          r.read,
          r.write,
          r.cost,
          r.durationMs,
          r.stopReason,
          r.requestId,
          r.error,
          r.tools?.length ? JSON.stringify(r.tools) : null,
          this.now(),
        );
      if (r.cost > 0) {
        const payers = this.payers(meta);
        const share = this.db.prepare('INSERT OR IGNORE INTO ai_call_shares (call_id, user_id, cost_usd) VALUES (?, ?, ?)');
        for (const userId of payers) share.run(Number(lastInsertRowid), userId, r.cost / payers.length);
        if (payers.length) this.onCharged?.(payers);
      }
    } catch (err) {
      // 记账失败不影响游戏
      console.error('记录AI用量失败：', err);
    }
  }

  /** 这次调用的钱记到谁头上。 */
  private payers(meta: CallMeta): number[] {
    const exists = (id: number) => !!this.db.prepare('SELECT 1 FROM users WHERE id = ?').get(id);
    if (meta.payer != null) return exists(meta.payer) ? [meta.payer] : [];
    const billing = meta.billing ?? (meta.userId != null ? 'self' : 'room');
    if (billing === 'self' || meta.roomId === null) return meta.userId != null && exists(meta.userId) ? [meta.userId] : [];
    const ids = (sql: string) => (this.db.prepare(sql).all(meta.roomId) as { user_id: number }[]).map((r) => r.user_id);
    const players = ids('SELECT DISTINCT p.user_id FROM players p JOIN characters c ON c.player_id = p.id WHERE p.room_id = ?');
    if (players.length) return players;
    const members = ids('SELECT user_id FROM players WHERE room_id = ?');
    if (members.length) return members;
    return meta.userId != null && exists(meta.userId) ? [meta.userId] : [];
  }
}
