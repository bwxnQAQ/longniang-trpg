import {
  AiError,
  attachUsage,
  partialUsageOf,
  sumUsage,
  type AiProvider,
  type MessagesRequest,
  type MessagesResponse,
  type ResponseBlock,
  type SendHooks,
  type Usage,
} from './types';
import { backoff, retryAfter, sleepUnlessAborted } from './retry';

export type ClaudeOptions = {
  apiKey: string | undefined;
  baseUrl?: string;
  /** 报错时怎么称呼这家（默认 Claude）。DeepSeek 的接口和 Claude 的一样，也用这个类调用。 */
  label?: string;
  /** 密钥写在 .env 的哪一项（报错时告诉人去哪儿改），默认 ANTHROPIC_API_KEY。 */
  keyName?: string;
  /** 记账时记成哪一家（默认 claude）。 */
  providerName?: string;
  /** 密钥没有绑定工作区时，要用这个指定在哪个工作区里调用（控制台里 wrkspc_ 开头的编号）。 */
  workspaceId?: string;
  /** 限流、服务器忙、网络断了时最多重试几次。 */
  maxRetries?: number;
  /** 单次请求最长等多久。主持AI要思考，给足时间。 */
  timeoutMs?: number;
  /** 流式请求最长等多久（生成剧本可能要十几分钟）。 */
  streamTimeoutMs?: number;
  /** 流式请求多久收不到任何数据就算断了。 */
  streamIdleMs?: number;
  /** 流式请求写到一半断了，最多重新要几次（每次都要从头写、从头付钱，所以少一点）。 */
  streamMaxRetries?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

const RETRY_STATUS = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

/** 直接用 fetch 调用 Claude 的 Messages API，不依赖 SDK。 */
export class ClaudeProvider implements AiProvider {
  readonly name: string;
  readonly priced = true;
  readonly status: { ready: boolean; message: string | null };
  private readonly label: string;
  private readonly keyName: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly opts: ClaudeOptions) {
    this.name = opts.providerName ?? 'claude';
    this.label = opts.label ?? 'Claude';
    this.keyName = opts.keyName ?? 'ANTHROPIC_API_KEY';
    this.status = opts.apiKey
      ? { ready: true, message: null }
      : {
          ready: false,
          message: `还没有设置 ${this.label} 的 API 密钥（项目文件夹里 .env 文件的 ${this.keyName}），${this.label} 的模型暂时用不了。`,
        };
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.sleep = opts.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  /** 重试前等一会儿；等的时候被取消了就马上停。 */
  private wait(ms: number, signal?: AbortSignal) {
    return sleepUnlessAborted((t) => this.sleep(t), ms, signal);
  }

  async send(request: MessagesRequest, signal?: AbortSignal, hooks?: SendHooks): Promise<MessagesResponse> {
    if (!this.opts.apiKey) throw new AiError(this.status.message!, false);
    const url = `${(this.opts.baseUrl ?? 'https://api.anthropic.com').replace(/\/+$/, '')}/v1/messages`;
    const maxRetries = this.opts.maxRetries ?? 3;
    const body = JSON.stringify(request);
    const streaming = request.stream === true;
    const streamMaxRetries = this.opts.streamMaxRetries ?? 1;
    let streamRetries = 0;
    // 中途断开的那几次估计花掉的用量
    const spent: Usage[] = [];

    for (let attempt = 0; ; attempt++) {
      // 流式请求：总时长放宽，另外一段时间收不到任何数据就算断了
      const idle = new AbortController();
      let idleTimer: NodeJS.Timeout | undefined;
      const touch = () => {
        if (!streaming) return;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => idle.abort(new DOMException('收不到数据', 'TimeoutError')), this.opts.streamIdleMs ?? 180_000);
      };
      const overall = AbortSignal.timeout(streaming ? (this.opts.streamTimeoutMs ?? 30 * 60_000) : (this.opts.timeoutMs ?? 300_000));
      const signals = [overall, idle.signal];
      if (signal) signals.push(signal);
      touch();
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': this.opts.apiKey,
            'anthropic-version': '2023-06-01',
            ...(this.opts.workspaceId ? { 'anthropic-workspace-id': this.opts.workspaceId } : {}),
          },
          body,
          signal: AbortSignal.any(signals),
        });
      } catch (err) {
        clearTimeout(idleTimer);
        if (signal?.aborted) {
          attachUsage(err, spent.length ? sumUsage(spent) : null);
          throw err;
        }
        if (attempt < maxRetries) {
          await this.wait(backoff(attempt), signal);
          continue;
        }
        const reason = err instanceof Error && err.name === 'TimeoutError' ? '等太久没有回应' : '网络连不上';
        const final = new AiError(`连不上 ${this.label} 的服务器（${reason}），过一会儿会自动重试`, true);
        attachUsage(final, spent.length ? sumUsage(spent) : null);
        throw final;
      }

      if (res.ok) {
        // 读回复内容的时候也可能断网，和连不上一样处理：重试
        try {
          const data = streaming ? await readStream(res, touch, this.label, hooks) : ((await res.json()) as MessagesResponse);
          data.request_id = res.headers.get('request-id');
          if (spent.length) data.wasted_usage = sumUsage(spent);
          return data;
        } catch (err) {
          const partial = partialUsageOf(err);
          if (partial) spent.push(partial);
          const used = spent.length ? sumUsage(spent) : null;
          if (signal?.aborted) {
            attachUsage(err, used);
            throw err;
          }
          // 流式的写到一半断了要从头再写一遍，最多再要一次；写满了总时长还没写完的不再要
          const retryable = (!(err instanceof AiError) || err.retryable) && !overall.aborted;
          const allowed = streaming ? streamRetries < streamMaxRetries : attempt < maxRetries;
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
          attachUsage(final, used);
          throw final;
        } finally {
          clearTimeout(idleTimer);
        }
      }
      clearTimeout(idleTimer);

      const text = await res.text().catch(() => '');
      let type = '';
      let message = text.slice(0, 300);
      try {
        const data = JSON.parse(text) as { error?: { type?: string; message?: string } };
        type = data.error?.type ?? '';
        message = data.error?.message ?? message;
      } catch {
        // 不是 JSON，就用原文
      }
      const retryable = RETRY_STATUS.has(res.status) || res.status >= 500;
      if (retryable && attempt < maxRetries) {
        await this.wait(retryAfter(res.headers.get('retry-after')) ?? backoff(attempt), signal);
        continue;
      }
      const final = new AiError(explain(res.status, type, message, this.label, this.keyName), retryable, res.status);
      attachUsage(final, spent.length ? sumUsage(spent) : null);
      throw final;
    }
  }
}

/**
 * 读流式回复（SSE），拼成和普通回复一样的整条消息。
 * 中途收到 error 事件、或者没收到 message_stop 就断了，都当成没读完，交给外面决定要不要重来。
 * 没读完时，已经写出来的部分照样要付钱：按收到的字数估一个用量，挂在错误上。
 */
async function readStream(res: Response, touch: () => void, label: string, hooks?: SendHooks): Promise<MessagesResponse> {
  if (!res.body) throw new AiError(`${label} 的流式回复是空的`, true);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let message: MessagesResponse | null = null;
  const blocks: Record<string, unknown>[] = [];
  const partialJson = new Map<number, string>();
  let chars = 0;
  // 估算用量：中文大约一个字一个 token，英文、数字、标点大约四个字符一个 token
  let wide = 0;
  let narrow = 0;
  let stopped = false;

  const count = (text: string) => {
    for (const ch of text) {
      if (ch.codePointAt(0)! > 0x2e80) wide++;
      else narrow++;
    }
    chars += [...text].length;
    // 进度回调出了错不影响读回复，更不能因此重新要一遍
    try {
      hooks?.onProgress?.(chars);
    } catch (err) {
      console.error('报告进度时出错：', err);
    }
  };
  const estimate = (): Usage | null => {
    const start = (message as MessagesResponse | null)?.usage;
    if (!start) return null;
    return { ...start, output_tokens: Math.max(start.output_tokens ?? 0, Math.round(wide + narrow / 4)) };
  };

  const handle = (data: Record<string, any>) => {
    switch (data.type) {
      case 'message_start': {
        const start = data.message as MessagesResponse;
        // 兼容的接口（DeepSeek）开头不一定带用量：先当成 0，后面 message_delta 里的用量再补上
        const usage = { input_tokens: 0, output_tokens: 0 } as Usage;
        mergeUsage(usage, start?.usage);
        message = { ...start, usage, content: [] };
        break;
      }
      case 'content_block_start':
        blocks[data.index] = { ...data.content_block };
        if (data.content_block?.type === 'tool_use') partialJson.set(data.index, '');
        break;
      case 'content_block_delta': {
        const block = blocks[data.index];
        const delta = data.delta ?? {};
        if (!block) break;
        if (delta.type === 'text_delta') {
          block.text = String(block.text ?? '') + delta.text;
          count(String(delta.text));
        } else if (delta.type === 'thinking_delta') {
          block.thinking = String(block.thinking ?? '') + delta.thinking;
          count(String(delta.thinking));
        } else if (delta.type === 'signature_delta') {
          block.signature = String(block.signature ?? '') + delta.signature;
        } else if (delta.type === 'input_json_delta') {
          partialJson.set(data.index, (partialJson.get(data.index) ?? '') + delta.partial_json);
          count(String(delta.partial_json));
        }
        break;
      }
      case 'content_block_stop': {
        const json = partialJson.get(data.index);
        if (json !== undefined && blocks[data.index]) {
          try {
            blocks[data.index].input = json ? JSON.parse(json) : {};
          } catch {
            throw new AiError(`${label} 的流式回复里，工具参数不完整`, true);
          }
        }
        break;
      }
      case 'message_delta': {
        const current = message as MessagesResponse | null;
        if (!current) break;
        Object.assign(current, data.delta ?? {});
        current.usage ??= { input_tokens: 0, output_tokens: 0 };
        mergeUsage(current.usage, data.usage);
        break;
      }
      case 'message_stop':
        stopped = true;
        break;
      case 'error': {
        const type = String(data.error?.type ?? '');
        const retryable = type === 'overloaded_error' || type === 'api_error' || type === 'rate_limit_error';
        throw new AiError(
          type === 'overloaded_error' ? `${label} 的服务器太忙了，过一会儿会自动重试` : `${label} 中途出错了（${data.error?.message ?? type}）`,
          retryable,
        );
      }
      default:
        // ping 和不认识的事件不用管
        break;
    }
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      touch();
      buffer += decoder.decode(value, { stream: true });
      let index: number;
      while ((index = buffer.search(/\r?\n\r?\n/)) >= 0) {
        const chunk = buffer.slice(0, index);
        buffer = buffer.slice(index).replace(/^\r?\n\r?\n/, '');
        const data = chunk
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (!data) continue;
        let parsed: Record<string, any>;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }
        handle(parsed);
      }
    }
    const final = message as MessagesResponse | null;
    if (!final || !stopped) throw new AiError(`${label} 的流式回复中途断开了，过一会儿会自动重试`, true);
    final.content = blocks.filter((b) => b !== undefined) as ResponseBlock[];
    return final;
  } catch (err) {
    // 不再读了：关掉连接，免得那边还在接着写、接着算钱
    reader.cancel().catch(() => {});
    attachUsage(err, estimate());
    throw err;
  }
}

/** 只用有值的数字覆盖：有的字段在 message_delta 里是 null，不能把开头记下的输入用量冲掉。 */
function mergeUsage(target: Usage, source: unknown) {
  for (const [k, v] of Object.entries((source ?? {}) as Record<string, unknown>)) {
    if (v !== null && v !== undefined) (target as Record<string, unknown>)[k] = v;
  }
}

/** 把 API 的错误换成看得懂的中文说明，原始信息放在括号里，方便排查。 */
function explain(status: number, type: string, message: string, label: string, keyName: string): string {
  const raw = message ? `（${message}）` : '';
  if (label === 'Claude' && message.includes('anthropic-workspace-id')) {
    return `这个 API 密钥没有绑定工作区：在 .env 里加一行 ANTHROPIC_WORKSPACE_ID=工作区编号（控制台里 wrkspc_ 开头的那串），或者在控制台重新创建一个只用于某个工作区的密钥${raw}`;
  }
  switch (true) {
    case status === 401 || type === 'authentication_error':
      return `${label} 的 API 密钥不对，请检查 .env 文件里的 ${keyName}`;
    case status === 402 || type === 'billing_error':
      return `${label} 账户的余额或付款有问题，请到 ${label} 的控制台看一下${raw}`;
    case status === 403 || type === 'permission_error':
      return `${label} 拒绝了这次请求：没有权限，或者所在地区不在服务范围内${raw}`;
    case status === 404 || type === 'not_found_error':
      return `找不到这个模型或接口，请检查 .env 里的模型名${raw}`;
    case status === 413 || type === 'request_too_large':
      return `发给 ${label} 的内容太长了`;
    case status === 429 || type === 'rate_limit_error':
      return `${label} 那边限流了，过一会儿会自动重试${raw}`;
    case status === 529 || type === 'overloaded_error':
      return `${label} 的服务器太忙了，过一会儿会自动重试`;
    case status >= 500:
      return `${label} 的服务器出错了（${status}），过一会儿会自动重试`;
    default:
      return `${label} 返回了错误（${status}）${raw}`;
  }
}
