import { randomUUID } from 'node:crypto';
import { appendToLastUser, extractJson, TOOL_ERROR_PREFIX } from './deepseek';
import { backoff, retryAfter, sleepUnlessAborted } from './retry';
import {
  AiError,
  AiRefusal,
  attachUsage,
  partialUsageOf,
  sumUsage,
  THIRD_PARTY_REFUSAL,
  type AiProvider,
  type Message,
  type MessagesRequest,
  type MessagesResponse,
  type ResponseBlock,
  type SendHooks,
  type StopReason,
  type TextBlock,
  type ToolDefinition,
  type ToolResultBlock,
  type ToolUseBlock,
  type Usage,
} from './types';

/**
 * OpenRouter：一个密钥调用各家的模型，模型名都带斜杠（openai/gpt-5.2、google/gemini-…、anthropic/claude-…）。
 * 接口是 OpenAI 的 chat completions 格式（https://openrouter.ai/docs/api_reference/overview），这里把程序里用的 Claude 格式翻译过去、再翻译回来：
 * - system 合成一条 system 消息；tool_use 变成 assistant 消息的 tool_calls，tool_result 变成 role 为 tool 的消息；
 * - 结构化输出（output_config.format）和 DeepSeek 一样：格式要求写进最后一条用户消息、打开 JSON 模式，回复里只取那个 JSON；
 * - 思考（thinking、思考强度）和缓存标记（cache_control）都不发；
 * - 用量里直接带着这次花了多少美元（usage.cost），记账时用它。
 * baseUrl 换成别家 OpenAI 兼容的接口也能用：只有 OpenRouter 认的字段只发给 openrouter.ai（OpenAI 收到不认识的字段会报错）。
 */

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * 中转站（V1.0.1）：兼容 OpenAI 格式的中转站，接口地址和密钥都要自己填（.env 的 RELAY_BASE_URL、RELAY_API_KEY），没有默认的。
 * 按 OpenAI 自己的写法发：max_completion_tokens、reasoning_effort，不发用户编号这类它不认的字段。
 */

export type OpenRouterOptions = {
  apiKey: string | undefined;
  /** 接口地址，到 /v1 为止。换成 https://api.openai.com/v1 之类就是直接调用那一家。不写是 OpenRouter；中转站没有默认的，不写就用不了。 */
  baseUrl?: string;
  /** 接口地址写在 .env 的哪一项（中转站没填地址时告诉人去哪儿填），默认 RELAY_BASE_URL。 */
  baseUrlName?: string;
  /** 报错时怎么称呼这家，默认 OpenRouter。 */
  label?: string;
  /** 密钥写在 .env 的哪一项（报错时告诉人去哪儿改），默认 OPENROUTER_API_KEY。 */
  keyName?: string;
  /** relay：中转站（V1.0.1），按 OpenAI 自己的写法发（max_completion_tokens、reasoning_effort），不发用户编号。 */
  kind?: 'relay';
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  /** 限流、服务器忙、网络断了时最多重试几次。 */
  maxRetries?: number;
};

/** 每百万 token 的价格（美元）。cacheRead：读缓存的价格，这个模型没有单独的缓存价格时是 null。 */
export type OpenRouterPrice = { input: number; output: number; cacheRead: number | null };

/** 模型列表里的一项。contextLength：最多能读多少 token；price：不知道（或者不固定）时是 null。 */
export type OpenRouterModel = { id: string; name: string; contextLength: number | null; price: OpenRouterPrice | null };

// 时限和 ClaudeProvider 的默认值一样
const TIMEOUT_MS = 300_000;
const STREAM_TIMEOUT_MS = 30 * 60_000;
const STREAM_IDLE_MS = 180_000;
/** 流式请求写到一半断了，最多重新要几次（每次都要从头写、从头付钱）。 */
const STREAM_MAX_RETRIES = 1;
/** 模型列表（带价格）缓存多久。 */
const MODELS_TTL_MS = 60 * 60_000;
/** 模型列表最多翻几页（一页几百个，正常一两页就完了）。 */
const MODELS_MAX_PAGES = 10;
/**
 * 回复里的推理记录（reasoning_details）放在这个类型的内容块里，调用工具的下一轮原样传回去：
 * Gemini 3 的思考签名、开了思考的 Claude 都要求这样，不传回去会报错。只有 OpenRouter 认这个字段。
 */
const REASONING_BLOCK = 'openrouter_reasoning';

type Host = 'openrouter' | 'openai' | 'relay' | 'other';

export class OpenRouterProvider implements AiProvider {
  /** 记账时写的是哪一家：openrouter，中转站是 relay。 */
  readonly name: string;
  readonly priced = true;
  private readonly baseUrl: string;
  private readonly label: string;
  private readonly keyName: string;
  private readonly host: Host;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private models: { at: number; list: OpenRouterModel[]; byId: Map<string, OpenRouterModel> } | null = null;
  private loadingModels: Promise<OpenRouterModel[]> | null = null;

  constructor(private readonly opts: OpenRouterOptions) {
    this.baseUrl = (opts.baseUrl ?? (opts.kind === 'relay' ? '' : OPENROUTER_BASE_URL)).trim().replace(/\/+$/, '');
    this.label = opts.label ?? 'OpenRouter';
    this.keyName = opts.keyName ?? 'OPENROUTER_API_KEY';
    this.host = opts.kind === 'relay' ? 'relay' : hostOf(this.baseUrl);
    this.name = opts.kind === 'relay' ? 'relay' : 'openrouter';
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.sleep = opts.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  get status(): { ready: boolean; message: string | null } {
    if (!this.opts.apiKey) {
      return { ready: false, message: `还没有设置 ${this.label} 的 API 密钥（项目文件夹里 .env 文件的 ${this.keyName}），${this.label} 的模型暂时用不了。` };
    }
    if (!this.baseUrl) {
      const name = this.opts.baseUrlName ?? 'RELAY_BASE_URL';
      return { ready: false, message: `还没有设置 ${this.label} 的接口地址（项目文件夹里 .env 文件的 ${name}），${this.label} 的模型暂时用不了。` };
    }
    return { ready: true, message: null };
  }

  async send(request: MessagesRequest, signal?: AbortSignal, hooks?: SendHooks): Promise<MessagesResponse> {
    if (!this.status.ready) throw new AiError(this.status.message!, false);
    const { body, json } = toChatRequest(request, this.host);
    const response = await this.post(body, request.model, signal, hooks);
    return json ? withJson(response) : response;
  }

  /**
   * 模型列表：名字、最多能读多少 token、每百万 token 的价格。缓存一小时，force 时重新取。
   * 刷新失败时有以前取到的就先用着；没有、或者是 force 时报错。
   */
  async listModels(force = false): Promise<OpenRouterModel[]> {
    const cached = this.models;
    if (!force && cached && Date.now() - cached.at < MODELS_TTL_MS) return cached.list;
    if (!this.status.ready) throw new AiError(this.status.message!, false);
    this.loadingModels ??= this.fetchModels().finally(() => {
      this.loadingModels = null;
    });
    try {
      return await this.loadingModels;
    } catch (err) {
      if (force || !cached) throw err;
      console.error(`取 ${this.label} 的模型列表失败，先用以前取到的：`, err instanceof Error ? err.message : err);
      return cached.list;
    }
  }

  /** 缓存的模型列表里这个模型的价格（没取过列表、列表里没有、价格不固定都是 null）。 */
  priceOf(model: string): OpenRouterPrice | null {
    return this.models?.byId.get(model)?.price ?? null;
  }

  private async fetchModels(): Promise<OpenRouterModel[]> {
    const byId = new Map<string, OpenRouterModel>();
    let url: string | null = `${this.baseUrl}/models`;
    for (let page = 0; url && page < MODELS_MAX_PAGES; page++) {
      let res: Response;
      try {
        res = await this.fetchImpl(url, { headers: { authorization: `Bearer ${this.opts.apiKey}` }, signal: AbortSignal.timeout(30_000) });
      } catch {
        throw new AiError(`连不上 ${this.label} 的服务器，取不到模型列表`, true);
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw errorOf(res.status, parseErrorBody(text), this.label, this.keyName, false, this.host === 'relay');
      }
      let data: { data?: unknown; links?: { next?: unknown } | null };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        throw new AiError(`${this.label} 的模型列表看不懂`, true);
      }
      for (const item of Array.isArray(data.data) ? data.data : []) {
        const model = modelOf(item);
        if (model && !byId.has(model.id)) byId.set(model.id, model);
      }
      // 列表是分页的：links.next 是下一页（只跟着同一个网站的地址走，免得把密钥发到别处）
      url = nextPage(data.links?.next, url);
    }
    const list = [...byId.values()];
    this.models = { at: Date.now(), list, byId };
    return list;
  }

  /** 重试前等一会儿；等的时候被取消了就马上停。 */
  private wait(ms: number, signal?: AbortSignal) {
    return sleepUnlessAborted((t) => this.sleep(t), ms, signal);
  }

  /** 发请求，限流、服务器忙、断网时重试（和 ClaudeProvider 一样）。 */
  private async post(body: ChatRequest, model: string, signal?: AbortSignal, hooks?: SendHooks): Promise<MessagesResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    const payload = JSON.stringify(body);
    const streaming = body.stream === true;
    const maxRetries = this.opts.maxRetries ?? 3;
    const ctx: ReadContext = {
      label: this.label,
      keyName: this.keyName,
      relay: this.host === 'relay',
      model,
      price: this.priceOf(model),
      promptTokens: () => estimateTokens(payload),
      hooks,
    };
    let streamRetries = 0;
    // 中途断开、回复不能用的那几次花掉的用量（照样要付钱）
    const spent: Usage[] = [];
    const used = () => (spent.length ? sumUsage(spent) : null);

    for (let attempt = 0; ; attempt++) {
      // 流式请求：总时长放宽，另外一段时间收不到任何数据就算断了（OpenRouter 等模型时会发注释行保持连接）
      const idle = new AbortController();
      let idleTimer: NodeJS.Timeout | undefined;
      const touch = () => {
        if (!streaming) return;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => idle.abort(new DOMException('收不到数据', 'TimeoutError')), STREAM_IDLE_MS);
      };
      const overall = AbortSignal.timeout(streaming ? STREAM_TIMEOUT_MS : TIMEOUT_MS);
      const signals = [overall, idle.signal];
      if (signal) signals.push(signal);
      touch();
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${this.opts.apiKey}` },
          body: payload,
          signal: AbortSignal.any(signals),
        });
      } catch (err) {
        clearTimeout(idleTimer);
        if (signal?.aborted) {
          attachUsage(err, used());
          throw err;
        }
        if (attempt < maxRetries) {
          await this.wait(backoff(attempt), signal);
          continue;
        }
        const reason = err instanceof Error && err.name === 'TimeoutError' ? '等太久没有回应' : '网络连不上';
        const final = new AiError(`连不上 ${this.label} 的服务器（${reason}），过一会儿会自动重试`, true);
        attachUsage(final, used());
        throw final;
      }

      if (res.ok) {
        // 读回复内容的时候也可能断网、回复也可能不能用，和连不上一样处理：重试
        try {
          const sse = streaming && !(res.headers.get('content-type') ?? '').includes('json');
          const data = sse ? await readStream(res, touch, ctx) : await readJson(res, ctx);
          data.request_id = res.headers.get('x-generation-id') ?? res.headers.get('x-request-id') ?? data.id;
          if (spent.length) data.wasted_usage = sumUsage(spent);
          return data;
        } catch (err) {
          const partial = partialUsageOf(err);
          if (partial) spent.push(partial);
          if (signal?.aborted) {
            attachUsage(err, used());
            throw err;
          }
          // 流式的写到一半断了要从头再写一遍，最多再要一次；写满了总时长还没写完的不再要
          const retryable = (!(err instanceof AiError) || err.retryable) && !overall.aborted;
          const allowed = streaming ? streamRetries < STREAM_MAX_RETRIES : attempt < maxRetries;
          if (retryable && allowed) {
            if (streaming) streamRetries++;
            await this.wait(backoff(attempt), signal);
            continue;
          }
          const final =
            err instanceof AiError
              ? err
              : new AiError(
                  overall.aborted ? `${this.label} 写了太久还没写完，这次先不等了` : `读 ${this.label} 的回复时断开了，过一会儿会自动重试`,
                  !overall.aborted,
                );
          attachUsage(final, used());
          throw final;
        } finally {
          clearTimeout(idleTimer);
        }
      }
      clearTimeout(idleTimer);

      const text = await res.text().catch(() => '');
      const waitMs = retryAfter(res.headers.get('retry-after'));
      const failure = errorOf(res.status, parseErrorBody(text), this.label, this.keyName, waitMs !== null, this.host === 'relay');
      if (failure.retryable && attempt < maxRetries) {
        await this.wait(waitMs ?? backoff(attempt), signal);
        continue;
      }
      attachUsage(failure, used());
      throw failure;
    }
  }
}

// ---------- 请求：Claude 格式 → chat completions ----------

type ChatToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };

type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ChatToolCall[]; reasoning_details?: unknown[] }
  | { role: 'tool'; tool_call_id: string; content: string };

type ChatRequest = {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  max_completion_tokens?: number;
  tools?: { type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }[];
  response_format?: { type: 'json_object' };
  stream?: true;
  stream_options?: { include_usage: true };
  user?: string;
  safety_identifier?: string;
  /** 思考强度（中转站的 ChatGPT 模型认）：low、medium、high、xhigh、max。 */
  reasoning_effort?: string;
};

/** 发到哪儿：OpenRouter、OpenAI 自己，还是别家兼容的接口（只发标准字段）。 */
function hostOf(baseUrl: string): Host {
  let host: string;
  try {
    host = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    return 'other';
  }
  if (host === 'openrouter.ai' || host.endsWith('.openrouter.ai')) return 'openrouter';
  return host === 'api.openai.com' ? 'openai' : 'other';
}

/** 改成 chat completions 的请求。json：要求的是 JSON 输出（回复要从文字里取出 JSON）。 */
function toChatRequest(request: MessagesRequest, host: Host): { body: ChatRequest; json: boolean } {
  const format = request.output_config?.format;
  const messages = format ? appendToLastUser(request.messages, jsonInstruction(format.schema)) : request.messages;
  const body: ChatRequest = {
    model: request.model,
    messages: toChatMessages(request.system ?? [], messages, host === 'openrouter'),
    // OpenAI 自己的推理模型不认已经废弃的 max_tokens（中转站后面也是 OpenAI 的模型）
    ...(host === 'openai' || host === 'relay' ? { max_completion_tokens: request.max_tokens } : { max_tokens: request.max_tokens }),
  };
  // 中转站的 ChatGPT 模型：按用途的思考强度想（估时、杂活想得少，生成剧本想得多）
  const effort = request.output_config?.effort;
  if (host === 'relay' && effort) body.reasoning_effort = effort;
  if (request.tools?.length) body.tools = request.tools.map(toChatTool);
  // JSON 模式保证回复是合法的 JSON；不支持的模型 OpenRouter 会忽略这个参数，格式要求反正也写在提示里了
  if (format) body.response_format = { type: 'json_object' };
  if (request.stream) {
    body.stream = true;
    // OpenRouter 的流式回复最后总会带一段用量；OpenAI 和别家兼容的接口要这样要
    if (host !== 'openrouter') body.stream_options = { include_usage: true };
  }
  // 玩家的匿名编号：出了违规内容时分得清是哪个用户（OpenRouter 叫 user，OpenAI 现在叫 safety_identifier）
  const userId = request.metadata?.user_id;
  if (userId && host === 'openrouter') body.user = userId;
  if (userId && host === 'openai') body.safety_identifier = userId;
  return { body, json: !!format };
}

/** 结构化输出的格式要求，和 deepseek.ts 的 adaptRequest 里写的一样。 */
function jsonInstruction(schema: Record<string, unknown>): string {
  return `# 输出格式\n只输出一个 JSON 对象，不要别的文字，也不要用代码块包起来。字段和嵌套按下面的 JSON Schema，所有字段都要有：\n${JSON.stringify(schema)}`;
}

function toChatTool(tool: ToolDefinition): NonNullable<ChatRequest['tools']>[number] {
  return { type: 'function', function: { name: tool.name, description: tool.description, parameters: tool.input_schema } };
}

function toChatMessages(system: TextBlock[], messages: Message[], openrouter: boolean): ChatMessage[] {
  const out: ChatMessage[] = [];
  const systemText = system
    .map((b) => b.text)
    .filter((text) => text)
    .join('\n\n');
  if (systemText) out.push({ role: 'system', content: systemText });
  for (const m of messages) {
    if (m.role === 'user') {
      if (typeof m.content === 'string') {
        out.push({ role: 'user', content: m.content });
        continue;
      }
      // 工具结果紧跟在发起调用的 assistant 消息后面，同一条消息里的文字放在工具结果之后
      const texts: string[] = [];
      for (const block of m.content) {
        if (block.type === 'tool_result') out.push({ role: 'tool', tool_call_id: block.tool_use_id, content: toolResultText(block) });
        else if (block.type === 'text' && block.text) texts.push(block.text);
      }
      if (texts.length) out.push({ role: 'user', content: texts.join('\n\n') });
      continue;
    }
    let text = '';
    const calls: ChatToolCall[] = [];
    const reasoning: unknown[] = [];
    for (const block of m.content) {
      if (block.type === 'text') {
        text += String((block as TextBlock).text ?? '');
      } else if (block.type === 'tool_use') {
        const use = block as ToolUseBlock;
        calls.push({ id: use.id, type: 'function', function: { name: use.name, arguments: JSON.stringify(use.input ?? {}) } });
      } else if (block.type === REASONING_BLOCK && openrouter) {
        const details = (block as { reasoning_details?: unknown }).reasoning_details;
        if (Array.isArray(details)) reasoning.push(...details);
      }
      // 思考（thinking、redacted_thinking）是 Claude 自己的，不认识的块也不发
    }
    // 什么都没有的 assistant 消息会被拒绝，不发
    if (!text && !calls.length) continue;
    out.push({
      role: 'assistant',
      content: text || null,
      ...(calls.length ? { tool_calls: calls } : {}),
      ...(reasoning.length ? { reasoning_details: reasoning } : {}),
    });
  }
  return out;
}

/** 工具结果的内容。role 为 tool 的消息没有 is_error：出错的开头写明失败了（和 DeepSeek 一样）。 */
function toolResultText(block: ToolResultBlock): string {
  const content = String(block.content ?? '');
  return block.is_error && !content.startsWith(TOOL_ERROR_PREFIX) ? `${TOOL_ERROR_PREFIX}${content}` : content;
}

// ---------- 回复：chat completions → Claude 格式 ----------

type ApiError = { code?: unknown; message?: unknown; metadata?: Record<string, unknown> | null };

type RawUsage = {
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  prompt_tokens_details?: { cached_tokens?: number | null; cache_write_tokens?: number | null } | null;
  cost?: number | null;
  is_byok?: boolean | null;
  cost_details?: { upstream_inference_cost?: number | null } | null;
};

type RawToolCall = { index?: number; id?: string | null; function?: { name?: string | null; arguments?: unknown } | null };

/** 普通回复里的 message 和流式回复里的 delta 字段差不多。 */
type RawMessage = {
  content?: unknown;
  refusal?: string | null;
  reasoning?: string | null;
  reasoning_content?: string | null;
  reasoning_details?: unknown;
  tool_calls?: RawToolCall[] | null;
};

type RawChoice = {
  message?: RawMessage | null;
  delta?: RawMessage | null;
  finish_reason?: string | null;
  native_finish_reason?: string | null;
  error?: ApiError | null;
};

type RawCompletion = { id?: string; model?: string; choices?: RawChoice[] | null; usage?: RawUsage | null; error?: ApiError | null };

type ReadContext = {
  label: string;
  keyName: string;
  /** 中转站（被拒绝时记成「被中转站那边拒绝」）。 */
  relay?: boolean;
  /** 请求的模型（按缓存的价格算钱用）。 */
  model: string;
  price: OpenRouterPrice | null;
  /** 估算这次的提示有多少 token（没拿到用量时用）。 */
  promptTokens: () => number;
  hooks?: SendHooks;
};

/** 拼好的一条回复（普通回复、流式回复都先拼成这样）。 */
type Assembled = {
  id?: string;
  model?: string;
  text: string;
  refusal: string;
  calls: { id?: string | null; name?: string | null; args: unknown }[];
  finish: string | null;
  nativeFinish: string | null;
  reasoning: unknown[];
  usage: Usage;
};

/** 读普通（非流式）回复。 */
async function readJson(res: Response, ctx: ReadContext): Promise<MessagesResponse> {
  const data = (await res.json()) as RawCompletion;
  const usage = data.usage ? usageOf(data.usage, ctx.price) : null;
  try {
    const choice = data.choices?.[0];
    // 回了 200 以后才出的错写在回复里：整条只有 error，或者 finish_reason 是 error
    const failure = choice?.error ?? (!choice || choice.finish_reason === 'error' ? data.error : null);
    if (failure) throw errorOf(codeOf(failure.code), failure, ctx.label, ctx.keyName, false, ctx.relay);
    if (!choice) throw new AiError(`${ctx.label} 没有返回任何内容，过一会儿会自动重试`, true);
    if (choice.finish_reason === 'error') throw new AiError(`${ctx.label} 中途出错了，过一会儿会自动重试`, true);
    const message = choice.message ?? {};
    const text = contentText(message.content);
    return toResponse(
      {
        id: data.id,
        model: data.model,
        text,
        refusal: typeof message.refusal === 'string' ? message.refusal : '',
        calls: (message.tool_calls ?? []).map((c) => ({ id: c.id, name: c.function?.name, args: c.function?.arguments })),
        finish: choice.finish_reason ?? null,
        nativeFinish: choice.native_finish_reason ?? null,
        reasoning: Array.isArray(message.reasoning_details) ? message.reasoning_details : [],
        usage: usage ?? estimatedUsage(ctx, estimateTokens(text)),
      },
      ctx,
    );
  } catch (err) {
    attachUsage(err, usage);
    throw err;
  }
}

/**
 * 读流式回复（SSE），拼成和普通回复一样的整条消息。注释行（: OPENROUTER PROCESSING）不用管，data: [DONE] 是结尾。
 * 中途收到错误、或者没收到 finish_reason 就断了，都当成没读完，交给外面决定要不要重来。
 * 没读完时，已经写出来的部分照样要付钱：按收到的字数估一个用量，挂在错误上。
 */
async function readStream(res: Response, touch: () => void, ctx: ReadContext): Promise<MessagesResponse> {
  if (!res.body) throw new AiError(`${ctx.label} 的流式回复是空的`, true);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const s = {
    buffer: '',
    id: undefined as string | undefined,
    model: undefined as string | undefined,
    text: '',
    refusal: '',
    finish: null as string | null,
    nativeFinish: null as string | null,
    usage: null as RawUsage | null,
    started: false,
    done: false,
  };
  // 工具调用按 index 分开拼：id 和名字在第一段，参数分好几段来
  const calls = new Map<number, { id: string; name: string; args: string }>();
  // 估算用量：中文大约一个字一个 token，英文、数字、标点大约四个字符一个 token
  let chars = 0;
  let wide = 0;
  let narrow = 0;

  const count = (text: string) => {
    for (const ch of text) {
      if (ch.codePointAt(0)! > 0x2e80) wide++;
      else narrow++;
    }
    chars += [...text].length;
    // 进度回调出了错不影响读回复，更不能因此重新要一遍
    try {
      ctx.hooks?.onProgress?.(chars);
    } catch (err) {
      console.error('报告进度时出错：', err);
    }
  };
  // 已经花掉的用量：收到了用量就用它，没收到就估一个；还什么都没收到时不算
  const spent = (): Usage | null =>
    s.usage ? usageOf(s.usage, ctx.price) : s.started ? estimatedUsage(ctx, Math.round(wide + narrow / 4)) : null;

  const handle = (chunk: RawCompletion) => {
    s.started = true;
    s.id ??= chunk.id;
    s.model ??= chunk.model;
    if (chunk.usage) s.usage = chunk.usage;
    const choice = chunk.choices?.[0];
    const failure = chunk.error ?? choice?.error;
    if (failure) throw errorOf(codeOf(failure.code), failure, ctx.label, ctx.keyName, false, ctx.relay);
    if (!choice) return;
    const delta = choice.delta ?? {};
    if (typeof delta.content === 'string' && delta.content) {
      s.text += delta.content;
      count(delta.content);
    }
    // 推理的内容不放进回复，但算进度、算用量（只带 reasoning_details 时从里面取文字）
    const thought = delta.reasoning || delta.reasoning_content || reasoningText(delta.reasoning_details);
    if (typeof thought === 'string' && thought) count(thought);
    if (typeof delta.refusal === 'string') s.refusal += delta.refusal;
    for (const [i, call] of (delta.tool_calls ?? []).entries()) {
      const index = typeof call.index === 'number' ? call.index : i;
      const entry = calls.get(index) ?? { id: '', name: '', args: '' };
      calls.set(index, entry);
      if (call.id && !entry.id) entry.id = call.id;
      if (call.function?.name && !entry.name) entry.name = call.function.name;
      const piece = call.function?.arguments;
      if (typeof piece === 'string' && piece) {
        entry.args += piece;
        count(piece);
      }
    }
    if (choice.finish_reason === 'error') throw new AiError(`${ctx.label} 中途出错了，过一会儿会自动重试`, true);
    if (choice.finish_reason) s.finish = choice.finish_reason;
    if (choice.native_finish_reason) s.nativeFinish = choice.native_finish_reason;
  };

  const consume = (event: string) => {
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    // 只有注释行（冒号开头）的不用管
    if (!data) return;
    if (data === '[DONE]') {
      s.done = true;
      return;
    }
    let chunk: RawCompletion;
    try {
      chunk = JSON.parse(data) as RawCompletion;
    } catch {
      return;
    }
    handle(chunk);
  };

  try {
    while (!s.done) {
      const { value, done } = await reader.read();
      if (done) {
        // 最后一段后面可能没有空行
        consume(s.buffer + decoder.decode());
        break;
      }
      touch();
      s.buffer += decoder.decode(value, { stream: true });
      let index: number;
      while (!s.done && (index = s.buffer.search(/\r?\n\r?\n/)) >= 0) {
        const event = s.buffer.slice(0, index);
        s.buffer = s.buffer.slice(index).replace(/^\r?\n\r?\n/, '');
        consume(event);
      }
    }
    if (s.finish === null) throw new AiError(`${ctx.label} 的流式回复中途断开了，过一会儿会自动重试`, true);
    // [DONE] 后面不会再有东西，关掉连接
    if (s.done) reader.cancel().catch(() => {});
    return toResponse(
      {
        id: s.id,
        model: s.model,
        text: s.text,
        refusal: s.refusal,
        calls: [...calls.entries()].sort(([a], [b]) => a - b).map(([, c]) => c),
        finish: s.finish,
        nativeFinish: s.nativeFinish,
        // 流式回复里的推理记录是一段一段来的，不拼（流式调用不用工具）
        reasoning: [],
        usage: spent()!,
      },
      ctx,
    );
  } catch (err) {
    // 不再读了：关掉连接，免得那边还在接着写、接着算钱
    reader.cancel().catch(() => {});
    attachUsage(err, spent());
    throw err;
  }
}

function toResponse(a: Assembled, ctx: ReadContext): MessagesResponse {
  const truncated = a.finish === 'length';
  const uses: ToolUseBlock[] = [];
  for (const call of a.calls) {
    const input = parseArguments(call.args);
    if (input === undefined) {
      // 写到 max_tokens 被截断的工具调用参数没写完，不能执行：去掉，stop_reason 是 max_tokens，由调用的地方处理
      if (truncated) continue;
      throw new AiError(`${ctx.label} 回复里的工具参数不是完整的 JSON，过一会儿会自动重试`, true);
    }
    uses.push({ type: 'tool_use', id: call.id || `call_${randomUUID().replace(/-/g, '')}`, name: call.name ?? '', input });
  }
  const refusal = a.refusal.trim();
  const refused = !!refusal || a.finish === 'content_filter' || a.nativeFinish === 'refusal';
  const content: ResponseBlock[] = [];
  if (uses.length && a.reasoning.length) content.push({ type: REASONING_BLOCK, reasoning_details: a.reasoning });
  if (a.text) content.push({ type: 'text', text: a.text });
  content.push(...uses);
  return {
    id: a.id ?? `gen-${randomUUID()}`,
    type: 'message',
    role: 'assistant',
    model: a.model ?? ctx.model,
    content,
    stop_reason: stopReasonOf(a.finish, uses.length > 0, refused),
    ...(refused
      ? {
          stop_details: {
            type: 'refusal',
            category: `${THIRD_PARTY_REFUSAL}${ctx.relay ? 'relay:' : ''}${a.finish === 'content_filter' ? 'content_filter' : 'refusal'}`,
            explanation: refusal || null,
          },
        }
      : {}),
    usage: a.usage,
  };
}

function stopReasonOf(finish: string | null, hasTools: boolean, refused: boolean): StopReason {
  if (refused) return 'refusal';
  if (finish === 'length') return 'max_tokens';
  if (hasTools) return 'tool_use';
  if (!finish || finish === 'stop' || finish === 'tool_calls') return 'end_turn';
  return finish;
}

/** 工具参数一般是 JSON 字符串（个别服务商会再包一层字符串）。解析不了返回 undefined。 */
function parseArguments(args: unknown): unknown {
  if (args === undefined || args === null || args === '') return {};
  if (typeof args !== 'string') return args;
  try {
    const value: unknown = JSON.parse(args);
    if (typeof value === 'string' && value.trim().startsWith('{')) return JSON.parse(value);
    return value;
  } catch {
    return undefined;
  }
}

/** 推理记录里的文字（加密的推理没有文字）。 */
function reasoningText(details: unknown): string {
  if (!Array.isArray(details)) return '';
  return details.map((d) => (d && typeof d === 'object' ? String(d.text ?? d.summary ?? '') : '')).join('');
}

/** 回复的文字：一般是字符串，也可能是一组内容块。 */
function contentText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map((part) => (part && typeof part === 'object' && typeof part.text === 'string' ? part.text : '')).join('');
}

/** 要求的是 JSON：从回复的文字里取出 JSON，取不出来就原样返回，由调用的地方当成“回复看不懂”处理（会自动重试）。 */
function withJson(response: MessagesResponse): MessagesResponse {
  const texts = response.content.filter((b) => b.type === 'text');
  if (!texts.length) return response;
  const json = extractJson(texts.map((b) => String((b as { text?: unknown }).text ?? '')).join(''));
  if (json === null) return response;
  return { ...response, content: [...response.content.filter((b) => b.type !== 'text'), { type: 'text', text: json }] };
}

// ---------- 用量和价格 ----------

/**
 * prompt_tokens 包括读缓存、写缓存的部分，Claude 的 input_tokens 不包括：减掉。
 * 花了多少美元：OpenRouter 报了就用它，没报按缓存的模型价格算，价格也不知道就不填（记账时按价格表算）。
 */
function usageOf(raw: RawUsage, price: OpenRouterPrice | null): Usage {
  const read = tokens(raw.prompt_tokens_details?.cached_tokens);
  const written = tokens(raw.prompt_tokens_details?.cache_write_tokens);
  const usage: Usage = {
    input_tokens: Math.max(0, tokens(raw.prompt_tokens) - read - written),
    output_tokens: tokens(raw.completion_tokens),
    cache_creation_input_tokens: written,
    cache_read_input_tokens: read,
  };
  const cost = reportedCost(raw) ?? (price ? costFrom(price, usage) : null);
  if (cost !== null) usage.cost_usd = cost;
  return usage;
}

function tokens(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * OpenRouter 报的花费（单位是 credits，就是美元）。用自己的服务商密钥（BYOK）时 cost 只是 OpenRouter 收的手续费，
 * 服务商那边收的在 upstream_inference_cost 里，加在一起才是这次一共花的。
 */
function reportedCost(raw: RawUsage): number | null {
  if (typeof raw.cost !== 'number' || !Number.isFinite(raw.cost)) return null;
  const upstream = raw.is_byok ? raw.cost_details?.upstream_inference_cost : null;
  return raw.cost + (typeof upstream === 'number' && Number.isFinite(upstream) ? upstream : 0);
}

function costFrom(price: OpenRouterPrice, usage: Usage): number {
  const read = usage.cache_read_input_tokens ?? 0;
  const written = usage.cache_creation_input_tokens ?? 0;
  return ((usage.input_tokens + written) * price.input + read * (price.cacheRead ?? price.input) + usage.output_tokens * price.output) / 1_000_000;
}

/** 没拿到用量时估一个：提示按发出去的请求估，输出按收到的字数估。 */
function estimatedUsage(ctx: ReadContext, output: number): Usage {
  const usage: Usage = { input_tokens: ctx.promptTokens(), output_tokens: output, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
  if (ctx.price) usage.cost_usd = costFrom(ctx.price, usage);
  return usage;
}

/** 中文大约一个字一个 token，英文、数字、标点大约四个字符一个 token（和 ClaudeProvider 的估法一样）。 */
function estimateTokens(text: string): number {
  let wide = 0;
  let narrow = 0;
  for (const ch of text) {
    if (ch.codePointAt(0)! > 0x2e80) wide++;
    else narrow++;
  }
  return Math.round(wide + narrow / 4);
}

function modelOf(item: unknown): OpenRouterModel | null {
  if (!item || typeof item !== 'object') return null;
  const m = item as { id?: unknown; name?: unknown; context_length?: unknown; pricing?: unknown };
  if (typeof m.id !== 'string' || !m.id) return null;
  return {
    id: m.id,
    name: typeof m.name === 'string' && m.name.trim() ? m.name.trim() : m.id,
    contextLength: typeof m.context_length === 'number' && Number.isFinite(m.context_length) && m.context_length > 0 ? m.context_length : null,
    price: priceFrom(m.pricing),
  };
}

/**
 * 接口给的是每个 token 多少美元（字符串），换成每百万 token。
 * 负数表示价格不固定（比如自动选模型的 openrouter/auto 是 -1），当成不知道。
 * discount（折扣）说明得不清楚是不是已经算在价格里了，不管它：宁可算多。
 */
function priceFrom(pricing: unknown): OpenRouterPrice | null {
  if (!pricing || typeof pricing !== 'object') return null;
  const p = pricing as Record<string, unknown>;
  const input = perMillion(p.prompt);
  const output = perMillion(p.completion);
  if (input === null || output === null) return null;
  return { input, output, cacheRead: perMillion(p.input_cache_read) };
}

function perMillion(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() ? Number(value) : typeof value === 'number' ? value : NaN;
  // 每 token 的价格很小，乘一百万以后去掉浮点误差（保留到百万分之一美元）
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 1e12) / 1e6 : null;
}

/** 下一页的地址：只跟着同一个网站的走。 */
function nextPage(next: unknown, current: string): string | null {
  if (typeof next !== 'string' || !next) return null;
  try {
    const url = new URL(next, current);
    return url.origin === new URL(current).origin && url.href !== current ? url.href : null;
  } catch {
    return null;
  }
}

// ---------- 出错和重试（等多久见 retry.ts） ----------

/** 回复里的 error.code：数字（和 HTTP 状态码一样）才用；别的（比如 "server_error"）当成不知道。 */
function codeOf(code: unknown): number | null {
  if (typeof code === 'number' && Number.isInteger(code)) return code;
  if (typeof code === 'string' && /^\d{3}$/.test(code)) return Number(code);
  return null;
}

function parseErrorBody(text: string): ApiError {
  try {
    const data = JSON.parse(text) as { error?: ApiError | string; message?: unknown } | null;
    if (data?.error && typeof data.error === 'object') return data.error;
    if (typeof data?.error === 'string') return { message: data.error };
    if (typeof data?.message === 'string') return { message: data.message };
  } catch {
    // 不是 JSON，就用原文
  }
  return { message: text.slice(0, 300) };
}

/**
 * 把错误换成看得懂的中文说明，原始信息放在括号里，方便排查。
 * status：HTTP 状态码，或者回复里 error.code 的数字（流里的错误、200 回复里的错误）；不知道时是 null。
 * retryLater：响应头里有 Retry-After（402 只有带着它时才是等一会儿就好的情况）。
 * 状态码的意思见 https://openrouter.ai/docs/api_reference/errors-and-debugging
 */
/** relay：中转站（V1.0.1）的拒绝类别前面多一段 relay:，管理页上写「被中转站那边拒绝」。 */
function errorOf(status: number | null, error: ApiError, label: string, keyName: string, retryLater = false, relay = false): AiError {
  const refused = `${THIRD_PARTY_REFUSAL}${relay ? 'relay:' : ''}`;
  const message = typeof error.message === 'string' ? error.message.slice(0, 300) : '';
  const raw = message ? `（${message}）` : '';
  const meta = error.metadata && typeof error.metadata === 'object' ? error.metadata : {};
  const type = typeof meta.error_type === 'string' ? meta.error_type : '';
  switch (true) {
    case status === 401:
      return new AiError(`${label} 的 API 密钥不对，请检查 .env 文件里的 ${keyName}`, false, 401);
    case status === 402:
      // 同时在进行的请求太多、预留的额度不够：OpenRouter 会带上 Retry-After，等一会儿就好
      if (retryLater || meta.limit_source === 'openrouter_in_flight_budget') {
        return new AiError(`${label} 账户里同时在进行的请求太多，余额暂时不够用，过一会儿会自动重试${raw}`, true, 402);
      }
      return new AiError(`${label} 账户的余额不够了（也可能是这个 API 密钥的额度用完了），请到 ${label} 的网站充值或调高额度${raw}`, false, 402);
    case status === 403: {
      // 内容被审核拦下、模型拒绝回答：按“被拒绝”处理（同样的内容再发还会被拒）。没有权限、被账户的限制规则拦下不算
      const reasons = Array.isArray(meta.reasons) ? meta.reasons.filter((r): r is string => typeof r === 'string') : [];
      if (type === 'refusal') return new AiRefusal(`${label} 那边的模型拒绝了这次请求${raw}`, `${refused}refusal`);
      if (reasons.length || typeof meta.flagged_input === 'string' || type === 'content_policy_violation') {
        const why = reasons.length ? `（${reasons.join('、')}）` : raw;
        return new AiRefusal(`这次请求被 ${label} 的内容审核拦下了${why}`, `${refused}${type || 'moderation'}`);
      }
      return new AiError(`${label} 拒绝了这次请求：这个 API 密钥没有权限，或者被账户的限制规则拦下了${raw}`, false, 403);
    }
    case status === 404:
      return new AiError(`${label} 找不到这个模型，或者没有服务商能处理这次请求（也可能是这个模型不支持工具调用）${raw}`, false, 404);
    case status === 408:
      return new AiError(`${label} 等太久没有回应，过一会儿会自动重试`, true, 408);
    case status === 413:
      return new AiError(`发给 ${label} 的内容太长了${raw}`, false, 413);
    case status === 429:
      return new AiError(`${label} 那边限流了，过一会儿会自动重试${raw}`, true, 429);
    case status === 502:
      return new AiError(`${label} 那边的模型出错了或者没有回应，过一会儿会自动重试${raw}`, true, 502);
    case status === 503:
      return new AiError(`${label} 现在没有能用的服务商提供这个模型，过一会儿会自动重试${raw}`, true, 503);
    case status !== null && status >= 500:
      return new AiError(`${label} 的服务器出错了（${status}），过一会儿会自动重试`, true, status);
    case status === 400:
      return new AiError(`${label} 不接受这次请求${raw}`, false, 400);
    case status === null:
      // 流里、回复里的错误没有数字状态码：多半是服务商那边断了，重试
      return new AiError(`${label} 中途出错了${raw}，过一会儿会自动重试`, true);
    default:
      return new AiError(`${label} 返回了错误（${status}）${raw}`, false, status);
  }
}
