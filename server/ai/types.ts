// Claude Messages API（POST /v1/messages）用到的那部分格式。

export type CacheControl = { type: 'ephemeral'; ttl?: '5m' | '1h' };

export type TextBlock = { type: 'text'; text: string; cache_control?: CacheControl };
export type ThinkingBlock = { type: 'thinking'; thinking: string; signature: string };
export type RedactedThinkingBlock = { type: 'redacted_thinking'; data: string };
export type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: unknown };
export type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
  cache_control?: CacheControl;
};

/** 模型返回的内容块。不认识的类型原样保留，下一轮对话再原样传回去。 */
export type ResponseBlock = TextBlock | ThinkingBlock | RedactedThinkingBlock | ToolUseBlock | { type: string; [key: string]: unknown };

export type Message =
  | { role: 'user'; content: string | (TextBlock | ToolResultBlock)[] }
  | { role: 'assistant'; content: ResponseBlock[] };

export type ToolDefinition = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export type MessagesRequest = {
  model: string;
  max_tokens: number;
  system?: TextBlock[];
  messages: Message[];
  tools?: ToolDefinition[];
  output_config?: {
    effort?: Effort;
    format?: { type: 'json_schema'; schema: Record<string, unknown> };
  };
  /** 打开自适应思考：模型按需要先想一想再回答（生成剧本这类难活用）。思考也算在 max_tokens 里。 */
  thinking?: { type: 'adaptive' };
  /** 流式返回：边写边传回来。回复很长（几分钟）时用，连接不会因为长时间没动静被断开。 */
  stream?: boolean;
  /** user_id 是发起这次调用的玩家的匿名编号，Anthropic 用它分辨是哪个用户的请求（不能放名字、邮箱这类信息）。 */
  metadata?: { user_id?: string };
};

export type StopReason = 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | 'pause_turn' | 'refusal' | (string & {});

export type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation?: { ephemeral_5m_input_tokens?: number; ephemeral_1h_input_tokens?: number } | null;
  /** 这一家直接告诉了花了多少美元（OpenRouter 会报），有这个就不用按价格表算。 */
  cost_usd?: number | null;
};

export type MessagesResponse = {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  content: ResponseBlock[];
  stop_reason: StopReason | null;
  /** 只在 stop_reason 是 refusal 时有：被 Anthropic 安全机制拦下的类别和说明（两者都可能是 null）。 */
  stop_details?: { type: string; category: string | null; explanation: string | null } | null;
  usage: Usage;
  /** 不是接口返回的内容：程序记下的请求编号（响应头 request-id），出了问题找 Anthropic 时要用。 */
  request_id?: string | null;
  /** 不是接口返回的内容：这次成功之前，中途断开的那几次估计已经花掉的用量（照样要付钱）。 */
  wasted_usage?: Usage | null;
};

/** 把几次调用的用量加起来。每一次都报了花多少美元（OpenRouter）时，美元也加起来。 */
export function sumUsage(list: Usage[]): Usage {
  const n = (v: number | null | undefined) => v ?? 0;
  const total: Usage = {
    input_tokens: list.reduce((s, u) => s + n(u.input_tokens), 0),
    output_tokens: list.reduce((s, u) => s + n(u.output_tokens), 0),
    cache_creation_input_tokens: list.reduce((s, u) => s + n(u.cache_creation_input_tokens), 0),
    cache_read_input_tokens: list.reduce((s, u) => s + n(u.cache_read_input_tokens), 0),
    cache_creation: {
      ephemeral_5m_input_tokens: list.reduce((s, u) => s + n(u.cache_creation?.ephemeral_5m_input_tokens), 0),
      ephemeral_1h_input_tokens: list.reduce((s, u) => s + n(u.cache_creation?.ephemeral_1h_input_tokens), 0),
    },
  };
  if (list.length > 0 && list.every((u) => typeof u.cost_usd === 'number')) total.cost_usd = list.reduce((s, u) => s + (u.cost_usd as number), 0);
  return total;
}

/**
 * 没成功的调用（中途断开、被取消）可能已经写了一部分，照样要付钱：
 * 出错时把估算的用量挂在错误上，记账时一起记下。
 */
export function attachUsage(err: unknown, usage: Usage | null) {
  if (usage && typeof err === 'object' && err !== null) (err as { partialUsage?: Usage }).partialUsage = usage;
}

export function partialUsageOf(err: unknown): Usage | null {
  return typeof err === 'object' && err !== null ? ((err as { partialUsage?: Usage }).partialUsage ?? null) : null;
}

/** 调用AI出错。retryable 表示过一会儿重试可能就好了（网络、限流、服务器忙）。 */
export class AiError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly status: number | null = null,
  ) {
    super(message);
  }
}

/**
 * 不是 Anthropic 的安全机制拒绝的：经 OpenRouter 调用的模型拒绝回答，或者被 OpenRouter、服务商的内容审核拦下。
 * 这类拒绝的类别前面加上这个前缀。别家的审核误判多少不清楚，网站只拦下、标给管理员看，不因为它自动封号。
 */
export const THIRD_PARTY_REFUSAL = 'openrouter:';

export function isThirdPartyRefusal(category: string | null | undefined): boolean {
  return typeof category === 'string' && category.startsWith(THIRD_PARTY_REFUSAL);
}

/** 被别家拒绝时写「被谁那边」：中转站（V1.0.1）的类别是 openrouter:relay: 开头，别的是 OpenRouter。 */
export function thirdPartyBy(category: string | null | undefined): string {
  return typeof category === 'string' && category.startsWith(`${THIRD_PARTY_REFUSAL}relay:`) ? '被中转站那边' : '被 OpenRouter 那边';
}

/**
 * 请求被拒绝了（stop_reason 是 refusal）：多数是 Anthropic 的安全机制，也可能是别家（类别带上面的前缀）。
 * 同样的内容再发一次通常还会被拒，而且拒绝次数算在整个 API 账号上，所以不重试、也不让玩家手动重试。
 */
export class AiRefusal extends AiError {
  constructor(
    message: string,
    public readonly category: string | null = null,
  ) {
    super(message, false);
  }
}

/** 用接口的回复生成一个 AiRefusal，带上拒绝的类别。 */
export function refusalOf(response: MessagesResponse, message: string): AiRefusal {
  return new AiRefusal(message, response.stop_details?.category ?? null);
}

/** 一个能发送 Messages 请求的“供应商”：真的 Claude，或者测试用的假主持人。 */
/** 流式调用时的回调：chars 是到现在一共写了多少字（思考和正文都算）。 */
export type SendHooks = { onProgress?: (chars: number) => void };

export interface AiProvider {
  readonly name: string;
  /** 调用要花钱（真的 Claude）。测试用的假主持人默认不花钱，测试额度时可以打开。 */
  readonly priced?: boolean;
  /** 是否能用；不能用时 message 说明原因（比如没设置 API 密钥）。 */
  readonly status: { ready: boolean; message: string | null };
  send(request: MessagesRequest, signal?: AbortSignal, hooks?: SendHooks): Promise<MessagesResponse>;
}

export function textOf(response: { content: ResponseBlock[] }): string {
  return response.content
    .filter((b): b is TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

export function toolUsesOf(response: { content: ResponseBlock[] }): ToolUseBlock[] {
  return response.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
}
