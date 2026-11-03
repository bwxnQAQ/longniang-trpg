import { ClaudeProvider, type ClaudeOptions } from './claude';
import type { AiProvider, Message, MessagesRequest, MessagesResponse, ResponseBlock, SendHooks } from './types';

/**
 * DeepSeek：它有和 Claude 一样格式的接口（https://api-docs.deepseek.com/guides/anthropic_api），
 * 请求、流式回复、工具调用、思考都照 Claude 的格式，所以直接用 ClaudeProvider 发，只改几处它不支持的：
 * - 结构化输出（output_config.format）它不支持（只认 effort）：把格式要求写进提示里，回复里只取那个 JSON；
 * - 自适应思考（thinking.type = adaptive）它不认识：去掉，DeepSeek 默认就会先思考；
 * - 思考强度它只分 low、high、max，别的它自己换算（medium 当 high），照原样发过去就行；
 * - 工具结果的 is_error 它不管：出错的结果开头加一句「工具调用失败」，让它知道没做成。
 * 缓存标记（cache_control）它不管，自己会缓存相同的开头，留着也没关系。
 */

export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/anthropic';

export type DeepSeekOptions = Omit<ClaudeOptions, 'label' | 'keyName' | 'providerName' | 'workspaceId'>;

export class DeepSeekProvider implements AiProvider {
  readonly name = 'deepseek';
  readonly priced = true;
  private readonly inner: ClaudeProvider;

  constructor(opts: DeepSeekOptions) {
    this.inner = new ClaudeProvider({
      ...opts,
      baseUrl: opts.baseUrl ?? DEEPSEEK_BASE_URL,
      label: 'DeepSeek',
      keyName: 'DEEPSEEK_API_KEY',
      providerName: 'deepseek',
    });
  }

  get status() {
    return this.inner.status;
  }

  async send(request: MessagesRequest, signal?: AbortSignal, hooks?: SendHooks): Promise<MessagesResponse> {
    const { body, json } = adaptRequest(request);
    const response = await this.inner.send(body, signal, hooks);
    return json ? withJsonText(response) : response;
  }
}

/** 改成 DeepSeek 能接受的请求。json：要求的是 JSON 输出（回复要从文字里取出 JSON）。 */
export function adaptRequest(request: MessagesRequest): { body: MessagesRequest; json: boolean } {
  const { thinking, output_config, ...rest } = request;
  const format = output_config?.format;
  const body: MessagesRequest = {
    ...rest,
    messages: markToolErrors(rest.messages),
    ...(thinking && thinking.type !== 'adaptive' ? { thinking } : {}),
    ...(output_config?.effort ? { output_config: { effort: output_config.effort } } : {}),
  };
  if (!format) return { body, json: false };
  const instruction = `# 输出格式\n只输出一个 JSON 对象，不要别的文字，也不要用代码块包起来。字段和嵌套按下面的 JSON Schema，所有字段都要有：\n${JSON.stringify(format.schema)}`;
  body.messages = appendToLastUser(body.messages, instruction);
  return { body, json: true };
}

export const TOOL_ERROR_PREFIX = '工具调用失败：';

/** 出错的工具结果：开头写明失败了（DeepSeek 不看 is_error）。 */
function markToolErrors(messages: Message[]): Message[] {
  return messages.map((m) => {
    if (m.role !== 'user' || typeof m.content === 'string') return m;
    if (!m.content.some((b) => b.type === 'tool_result' && b.is_error)) return m;
    return {
      role: 'user',
      content: m.content.map((b) =>
        b.type === 'tool_result' && b.is_error && !b.content.startsWith(TOOL_ERROR_PREFIX) ? { ...b, content: `${TOOL_ERROR_PREFIX}${b.content}` } : b,
      ),
    };
  });
}

/** 把一段话加到最后一条用户消息的末尾（没有用户消息就新加一条）。OpenRouter 也用。 */
export function appendToLastUser(messages: Message[], text: string): Message[] {
  const index = messages.map((m) => m.role).lastIndexOf('user');
  if (index < 0) return [...messages, { role: 'user', content: text }];
  const last = messages[index] as Extract<Message, { role: 'user' }>;
  const content: Extract<Message, { role: 'user' }>['content'] =
    typeof last.content === 'string' ? `${last.content}\n\n${text}` : [...last.content, { type: 'text', text }];
  return messages.map((m, i) => (i === index ? { role: 'user', content } : m));
}

/**
 * 从回复的文字里取出 JSON，取不出来就原样返回，由调用的地方当成“回复看不懂”处理（会自动重试）。
 */
export function withJsonText(response: MessagesResponse): MessagesResponse {
  const texts = response.content.filter((b) => b.type === 'text');
  if (!texts.length) return response;
  const raw = texts.map((b) => String((b as { text?: unknown }).text ?? '')).join('');
  const json = extractJson(raw);
  if (json === null) return response;
  const others: ResponseBlock[] = response.content.filter((b) => b.type !== 'text');
  return { ...response, content: [...others, { type: 'text', text: json }] };
}

/**
 * 依次试：整段就是一个 JSON 对象；代码块（```json … ```）里的；从一个 { 开始到和它配对的 }（字符串里的括号不算）。
 * 都不行返回 null。
 */
export function extractJson(raw: string): string | null {
  const whole = asObjectJson(raw.trim());
  if (whole) return whole;
  for (const match of raw.matchAll(/```[a-zA-Z]*[ \t]*\r?\n?([\s\S]*?)```/g)) {
    const fenced = asObjectJson(match[1].trim());
    if (fenced) return fenced;
  }
  for (let start = raw.indexOf('{'); start >= 0; ) {
    const end = matchingBrace(raw, start);
    // 配不上对：多半是回复被截断了。后面的 { 都在这个没写完的对象里面，取出来的只是其中一小块，不要
    if (end < 0) return null;
    const candidate = asObjectJson(raw.slice(start, end + 1));
    if (candidate) return candidate;
    // 配上对、但不是 JSON 的（前面的话里的括号）：从它后面接着找
    start = raw.indexOf('{', end + 1);
  }
  return null;
}

/** 是一个 JSON 对象就原样返回，不是返回 null。 */
function asObjectJson(text: string): string | null {
  if (!text.startsWith('{')) return null;
  try {
    const value = JSON.parse(text);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? text : null;
  } catch {
    return null;
  }
}

/** 从 start 的 { 开始，找和它配对的 }，没有返回 -1。 */
function matchingBrace(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i;
  }
  return -1;
}
