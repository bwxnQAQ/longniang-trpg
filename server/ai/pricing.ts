import type { Usage } from './types';

/**
 * 每百万 token 的价格（美元），2026年10月查的：
 * - Claude 的官方价格：https://platform.claude.com/docs/en/about-claude/pricing
 * - DeepSeek：https://api-docs.deepseek.com/quick_start/pricing。下面写的是高峰时段的价格；别的时段是一半（见 deepSeekPeak）。
 *   DeepSeek 没有单独的缓存写入费，按普通输入算。
 * - ChatGPT 的模型（V1.0.1，经中转站调用）：OpenAI 官方 API 的标准价格，2026年11月查的：https://developers.openai.com/api/docs/pricing。
 *   中转站实际收多少以中转站为准；这里按官方价格记账（一般比中转站贵，宁可算多）。OpenAI 没有缓存写入费，按普通输入算。
 * 价格变了就改这里。记下的费用只是估算，以各家控制台的账单为准。
 */
type Price = { input: number; write5m: number; write1h: number; read: number; output: number };

const PRICES: Record<string, Price> = {
  'claude-opus-5-5': { input: 4, write5m: 5, write1h: 8, read: 0.2, output: 20 },
  'claude-sonnet-5-5': { input: 2, write5m: 2.5, write1h: 4, read: 0.1, output: 10 },
  'claude-haiku-5-5': { input: 0.1, write5m: 0.125, write1h: 0.2, read: 0.01, output: 0.5 },
  'deepseek-v4-pro': { input: 1.32, write5m: 1.32, write1h: 1.32, read: 0.044, output: 3.96 },
  'deepseek-flash': { input: 0.3, write5m: 0.3, write1h: 0.3, read: 0.006, output: 1.2 },
  'gpt-6-astra': { input: 10, write5m: 10, write1h: 10, read: 1, output: 50 },
  'gpt-6.1-sol': { input: 2, write5m: 2, write1h: 2, read: 0.1, output: 10 },
  'gpt-6.1-terra': { input: 1, write5m: 1, write1h: 1, read: 0.05, output: 5 },
  'gpt-6-luna': { input: 0.1, write5m: 0.1, write1h: 0.1, read: 0.01, output: 0.5 },
};

/**
 * ChatGPT 的模型（V1.0.1）：经兼容 OpenAI 格式的中转站调用（.env 的 RELAY_BASE_URL、RELAY_API_KEY），模型名照 OpenAI 的写法。
 * 2026年11月 ChatGPT 里能用的就这四个：Astra、GPT-6.1 Sol、GPT-6.1 Terra、GPT-6 Luna（GPT-5.x 已经下线）。
 */
export const RELAY_MODELS = ['gpt-6-astra', 'gpt-6.1-sol', 'gpt-6.1-terra', 'gpt-6-luna'];

export function isRelayModel(model: string): boolean {
  return RELAY_MODELS.includes(model);
}

/** DeepSeek 的模型（走 DeepSeek 的接口，用 DEEPSEEK_API_KEY）。 */
export function isDeepSeekModel(model: string): boolean {
  return model.startsWith('deepseek-');
}

/**
 * DeepSeek 的高峰时段：周一到周五，UTC 1～4 点、6～10 点（北京时间 9～12 点、14～18 点）。别的时段半价。
 * 中国的法定节假日整天都不算高峰，这里分不出哪天是节假日，按高峰算（宁可算多）。
 */
export function deepSeekPeak(at: number): boolean {
  const time = new Date(at);
  const day = time.getUTCDay();
  const hour = time.getUTCHours();
  return day >= 1 && day <= 5 && ((hour >= 1 && hour < 4) || (hour >= 6 && hour < 10));
}

/** 管理员、房主在网页上能选的模型（价格表里有的）。 */
export const KNOWN_MODELS = Object.keys(PRICES);

/** 网页上给人看的模型名字和一句说明。 */
export const MODEL_LABEL: Record<string, { name: string; note: string }> = {
  'claude-opus-5-5': { name: 'Opus 5.5', note: '最聪明，叙述最好，最贵' },
  'claude-sonnet-5-5': { name: 'Sonnet 5.5', note: '又好又快，价钱是 Opus 的一半' },
  'claude-haiku-5-5': { name: 'Haiku 5.5', note: '最快、最便宜，复杂的剧情容易顾此失彼' },
  'deepseek-v4-pro': { name: 'DeepSeek V4 Pro', note: 'DeepSeek 的大模型，内容发给 DeepSeek' },
  // 调用时的名字是 deepseek-flash；2026年10月它对应的版本是 DeepSeek-V4.1-Flash-1017（DeepSeek 只认这个名字，不能指定版本）
  'deepseek-flash': { name: 'DeepSeek V4.1 Flash 1017', note: 'DeepSeek 的小模型，内容发给 DeepSeek' },
  'gpt-6-astra': { name: 'GPT-6 Astra', note: 'ChatGPT 最强的模型，也最贵；经中转站调用，内容发给中转站和 OpenAI' },
  'gpt-6.1-sol': { name: 'GPT-6.1 Sol', note: 'ChatGPT 的主力模型；经中转站调用，内容发给中转站和 OpenAI' },
  'gpt-6.1-terra': { name: 'GPT-6.1 Terra', note: '价钱是 Sol 的一半，快一些；经中转站调用，内容发给中转站和 OpenAI' },
  'gpt-6-luna': { name: 'GPT-6 Luna', note: 'ChatGPT 最快、最便宜的小模型；经中转站调用，内容发给中转站和 OpenAI' },
};

/**
 * 网页上给的模型选项：名字、说明、每百万 token 的价格。
 * available：这家的 API 密钥设置了没有（没设置的不能选），不传就都算能用。
 */
export function modelOptions(available: (model: string) => boolean = () => true) {
  return KNOWN_MODELS.map((model) => ({
    model,
    ...(MODEL_LABEL[model] ?? { name: model, note: '' }),
    price: priceOf(model),
    available: available(model),
  }));
}

/** 每百万 token 的输入、输出价格（美元），管理页上给管理员参考。 */
export function priceOf(model: string): { input: number; output: number } | null {
  const p = PRICES[model];
  return p ? { input: p.input, output: p.output } : null;
}

/** Haiku 5.5 的提示超过 10 万 token 时按这个价格算。 */
const HAIKU_LONG: Price = { input: 0.5, write5m: 0.625, write1h: 1, read: 0.05, output: 2.5 };

/** 不认识的模型按 Opus 5.5 的价格算，宁可算多。 */
const FALLBACK = PRICES['claude-opus-5-5'];

/** 一次调用的费用（美元）。at：调用的时间，DeepSeek 按它分高峰、非高峰；不传按高峰算。 */
export function costOf(model: string, usage: Usage, at?: number): number {
  const read = usage.cache_read_input_tokens ?? 0;
  const written = usage.cache_creation_input_tokens ?? 0;
  const by = usage.cache_creation ?? {};
  // 有分时长的明细就按明细算；没有就当成 5 分钟缓存
  const w1h = by.ephemeral_1h_input_tokens ?? 0;
  const w5m = by.ephemeral_5m_input_tokens ?? Math.max(0, written - w1h);
  const promptTokens = usage.input_tokens + read + written;

  let price = PRICES[model] ?? FALLBACK;
  if (model === 'claude-haiku-5-5' && promptTokens > 100_000) price = HAIKU_LONG;

  const usd =
    usage.input_tokens * price.input +
    w5m * price.write5m +
    w1h * price.write1h +
    read * price.read +
    usage.output_tokens * price.output;
  const offPeak = isDeepSeekModel(model) && at !== undefined && !deepSeekPeak(at);
  return (offPeak ? usd / 2 : usd) / 1_000_000;
}
