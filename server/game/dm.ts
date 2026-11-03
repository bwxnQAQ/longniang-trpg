import type { AiClient, CallMeta } from '../ai/client';
import { AiError, refusalOf, textOf, toolUsesOf, type Message, type TextBlock, type ToolResultBlock } from '../ai/types';
import {
  ANSWER_SYSTEM,
  ANSWER_SYSTEM_5E,
  ANSWER_SYSTEM_V2,
  DM_RULES_5E,
  DM_RULES_V2,
  buildAnswerContext,
  buildCatchupContext,
  buildEstimateContext,
  buildStorySummaryContext,
  CATCHUP_SYSTEM,
  DM_RULES,
  ESTIMATE_SCHEMA,
  ESTIMATE_SYSTEM,
  languageLine,
  parseEstimate,
  scenarioBlock,
  STORY_SUMMARY_SYSTEM,
  styleBlock,
  type AnswerContext,
  type CatchupEntry,
  type CompanionBrief,
  type RecentEntry,
} from './prompts';
import type { RoomStyle, StyleLanguage } from '../../shared/game';
import type { Scenario } from './scenario';
import { DM_TOOLS, type ResolutionContext } from './tools';
import { dmTools2 } from './tools2';
import { dmTools5e } from './tools5e-defs';
import type { Character } from './world';

// 和AI的几种对话：结算行动（可以多轮调用工具）、估算耗时、场外问答。

/**
 * 一次结算最多来回几轮（每轮AI可以一次调用好几个工具）。有的模型（DeepSeek）一次只调用一个工具，打仗时一步一步来，
 * 轮数要给够（V0.9.1 从 6 放宽到 12）；到了上限还在调用工具，就把做过的工具和结果交给它，只让它写叙述。
 */
export const MAX_TURNS = 12;
/** 只写叙述的那一次：每条工具结果最多交这么多字（太长的截短）。 */
const RESULT_CLIP = 1200;
/** 只写叙述的那一次用了：记进这次结算的结果里（整局排查包的诊断里数得出来）。 */
export const WRAP_UP_NOTE = '工具调用到了上限，最后单独让主持AI照工具结果写了叙述';

/** 工具调用的「指纹」：名字加上参数（参数按 key 排好，顺序不同算一样）。 */
function callKey(name: string, input: unknown): string {
  const sorted = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(sorted) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sorted((v as Record<string, unknown>)[k])])) : v;
  return `${name}\u0000${JSON.stringify(sorted(input ?? {}))}`;
}

function clipText(text: string, max: number): string {
  const chars = [...text];
  return chars.length > max ? `${chars.slice(0, max).join('')}……` : text;
}

/** 把缓存标记挪到最后一条玩家消息上：下一轮请求能直接读到这一轮的缓存。 */
function markLastUserMessage(messages: Message[]) {
  for (const m of messages) {
    if (m.role !== 'user' || typeof m.content === 'string') continue;
    for (const block of m.content) delete (block as TextBlock | ToolResultBlock).cache_control;
  }
  const last = messages[messages.length - 1];
  if (last?.role === 'user' && typeof last.content !== 'string' && last.content.length) {
    last.content[last.content.length - 1].cache_control = { type: 'ephemeral' };
  }
}

/**
 * 让主持AI结算一个行动：AI 调用工具（掷骰、给线索……），程序执行后把结果交回去，直到 AI 写出叙述。
 * 工具的效果都记在 ctx 里，这里不碰数据库。
 */
export async function runDm(opts: {
  ai: AiClient;
  scenario: Scenario;
  context: string;
  ctx: ResolutionContext;
  meta: CallMeta;
  /** 房主选的主持风格（V0.6.0）；不写是默认。 */
  style?: RoomStyle;
  signal?: AbortSignal;
}): Promise<string> {
  const v2 = opts.scenario.rules === 2;
  const five = opts.scenario.rules === '5e';
  // 规则第二版（V0.7.0）：工具按这一局用得上的给（有敌人才有战斗，地下城才有道具和宝物，有人会技能才有技能）；
  // 5E 模组（V0.9.0）：有怪物才有战斗的工具，有宝藏才有宝藏工具
  const tools = five
    ? dmTools5e(opts.scenario)
    : v2
      ? dmTools2(opts.scenario, { skills: [...opts.ctx.characters.values()].some((c) => (c.v2?.skills.length ?? 0) > 0) })
      : DM_TOOLS;
  const system: TextBlock[] = [
    // 规则对所有对局都一样，剧本对这一局一样：都用1小时缓存
    { type: 'text', text: five ? DM_RULES_5E : v2 ? DM_RULES_V2 : DM_RULES, cache_control: { type: 'ephemeral', ttl: '1h' } },
    { type: 'text', text: scenarioBlock(opts.scenario), cache_control: { type: 'ephemeral', ttl: '1h' } },
  ];
  // 主持风格对这一局也一样，很短，跟在剧本后面（不单独占一个缓存位）
  const style = opts.style ? styleBlock(opts.style) : null;
  if (style) system.push({ type: 'text', text: style });
  const messages: Message[] = [{ role: 'user', content: [{ type: 'text', text: opts.context }] }];
  // 和工具调用写在同一次回复里的文字。AI 有时先写好叙述、再顺手记一笔（比如更新NPC），之后就不再写了
  let textWithTools = '';
  let nudged = false;
  // 一次结算从头到尾用同一个模型：中途房主换了主持模型，前面几轮的思考、工具调用不能交给另一家接着做
  const meta: CallMeta = { ...opts.meta, model: opts.meta.model ?? opts.ai.modelFor('resolve', opts.meta.roomId) };

  // 已经做过的工具调用：指纹 → 第几次调用、在哪一轮、做成了没有。
  // 后面的轮次又用一模一样的参数调用（原地打转）就不再做一遍，免得同一下攻击、同一次检定算好几次；
  // 同一次回复里一模一样的几个（多重攻击的几下）照常做
  const seen = new Map<string, { index: number; turn: number; error: boolean }>();
  let calls = 0;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    markLastUserMessage(messages);
    const response = await opts.ai.send('resolve', { max_tokens: 16000, system, tools, messages }, meta, opts.signal);
    if (response.stop_reason === 'refusal') throw refusalOf(response, '这个行动被 AI 的安全机制拒绝了');
    // 被截断的回复里可能有写了一半的工具调用，不能执行：整次作废，稍后重来
    if (response.stop_reason === 'max_tokens') throw new AiError('主持AI的回复太长，被截断了，稍后会自动重试', true);

    const text = textOf(response);
    const uses = toolUsesOf(response);
    if (uses.length) {
      if (text) textWithTools = text;
      messages.push({ role: 'assistant', content: response.content });
      const results: ToolResultBlock[] = uses.map((use) => {
        calls++;
        const key = callKey(use.name, use.input);
        const before = seen.get(key);
        // 前面做成过的才拦：没做成的再调用一次不会多算什么（出错的调用什么都没改），情况变了（开打了）还可能做成
        if (before && !before.error && before.turn < turn) {
          const content = `和第 ${before.index} 次调用一模一样，那次已经做过了（结果见那一次），这次没有再做。真要再做一次同样的事（多重攻击的又一下、又一次检定），在 reason 里写明是第几下、为什么`;
          return { type: 'tool_result', tool_use_id: use.id, content, is_error: true };
        }
        const result = opts.ctx.execute(use.name, use.input);
        if (!before || before.error) seen.set(key, { index: calls, turn, error: result.isError });
        return { type: 'tool_result', tool_use_id: use.id, content: result.content, ...(result.isError ? { is_error: true } : {}) };
      });
      messages.push({ role: 'user', content: results });
      continue;
    }
    if (text) return text;
    // 空回复：如果之前那段文字已经是完整的叙述，就用它
    if ([...textWithTools].length >= 80) return textWithTools;
    if (nudged) break;
    // 提醒一次。空回复本身不放回对话里（空的 assistant 消息会被接口拒绝），提醒接在最后一条用户消息后面
    nudged = true;
    const last = messages[messages.length - 1];
    if (last.role === 'user' && typeof last.content !== 'string') {
      last.content.push({ type: 'text', text: '请写出这次行动的叙述正文。' });
    }
  }
  // 来回到了上限还在调用工具（或者提醒了也没写）：工具的效果都已经记在 ctx 里了。
  // 不再整次作废（V0.9.1 以前是作废、重试，同样的行动还会一样卡住），把做过的工具和结果写成文字，不给工具，单独要一次叙述
  return writeNarration({ ...opts, system, meta });
}

/** 只写叙述：这次结算调用过的工具和结果写成文字跟在状态后面，不给工具。 */
async function writeNarration(opts: { ai: AiClient; context: string; ctx: ResolutionContext; system: TextBlock[]; meta: CallMeta; signal?: AbortSignal }): Promise<string> {
  const done = opts.ctx.trace.map(
    (t, i) => `${i + 1}. ${t.tool} ${clipText(JSON.stringify(t.input ?? {}), 300)}\n   → ${t.error ? '没做成：' : ''}${clipText(t.result, RESULT_CLIP)}`,
  );
  const text = `${opts.context}

# 这次结算里已经调用过的工具和结果（程序已经照这些记下来了）
${done.join('\n') || '（没有）'}

（程序提醒）这次结算调用工具的轮数到了上限，不能再调用工具了。照上面的结果写出这次行动的叙述正文；没来得及用工具记下的事，在叙述里写成还没做完、留到下一次，不要写成已经发生。`;
  const response = await opts.ai.send('resolve', { max_tokens: 16000, system: opts.system, messages: [{ role: 'user', content: [{ type: 'text', text }] }] }, opts.meta, opts.signal);
  if (response.stop_reason === 'refusal') throw refusalOf(response, '这个行动被 AI 的安全机制拒绝了');
  if (response.stop_reason === 'max_tokens') throw new AiError('主持AI的回复太长，被截断了，稍后会自动重试', true);
  const narration = textOf(response);
  if (!narration) throw new AiError(`主持AI没有写出叙述（${emptyReason(response)}），稍后会自动重试`, true);
  opts.ctx.dmNotes.push(WRAP_UP_NOTE);
  return narration;
}

/** 回复里没有正文时，说一下是怎么回事（写进报错里，排查时看得出来）。 */
export function emptyReason(response: { stop_reason?: string | null; usage?: { output_tokens?: number } }): string {
  if (response.stop_reason === 'max_tokens') return '想得太久，回复的字数用完了';
  return `回复是空的，stop_reason=${response.stop_reason ?? '没有'}，输出 ${response.usage?.output_tokens ?? 0} token`;
}

/** 估算行动在游戏里要花多少分钟。 */
export async function estimateMinutes(opts: {
  ai: AiClient;
  scenario: Scenario;
  actor: Character;
  content: string;
  /** 交给 AI 演的身份（V0.8.0 AI 补位）。 */
  companions?: CompanionBrief[];
  /** 地图（V1.0.x）：他自己的地图上从这里到各处要多久（map-view.ts 的 knownRoutesText）。 */
  routes?: string;
  meta: CallMeta;
  signal?: AbortSignal;
}): Promise<{ minutes: number; reason: string; kind: 'action' | 'question' }> {
  const response = await opts.ai.send(
    'estimate',
    {
      // 会先思考的模型（DeepSeek）思考也算在里面：给够，按实际用掉的收费
      max_tokens: 8000,
      system: [{ type: 'text', text: ESTIMATE_SYSTEM }],
      messages: [{ role: 'user', content: buildEstimateContext(opts.scenario, opts.actor, opts.content, opts.companions, opts.routes) }],
      output_config: { format: { type: 'json_schema', schema: ESTIMATE_SCHEMA } },
    },
    opts.meta,
    opts.signal,
  );
  // 估时这一步就被拒绝：同样的内容不再交给主持AI
  if (response.stop_reason === 'refusal') throw refusalOf(response, '这个行动被 AI 的安全机制拒绝了');
  const parsed = parseEstimate(textOf(response));
  if (!parsed) throw new AiError(textOf(response) ? '估时的回复看不懂' : `估时没有回复（${emptyReason(response)}）`, true);
  return parsed;
}

/** 场外问答：AI 只拿到这名玩家的角色已经知道的信息。 */
export async function answerQuestion(opts: {
  ai: AiClient;
  context: AnswerContext;
  meta: CallMeta;
  /** 主持用日语、英语时回答也跟着换（V0.6.0）。 */
  language?: StyleLanguage;
  signal?: AbortSignal;
}): Promise<string> {
  const response = await opts.ai.send(
    'answer',
    {
      max_tokens: 8000,
      system: [{ type: 'text', text: opts.context.scenario.rules === '5e' ? ANSWER_SYSTEM_5E : opts.context.scenario.rules === 2 ? ANSWER_SYSTEM_V2 : ANSWER_SYSTEM }],
      messages: [{ role: 'user', content: buildAnswerContext(opts.context) + languageLine(opts.language ?? 'zh') }],
    },
    opts.meta,
    opts.signal,
  );
  if (response.stop_reason === 'refusal') throw refusalOf(response, '这个问题被 AI 的安全机制拒绝了');
  const text = textOf(response);
  if (!text) throw new AiError(`主持人没有给出回答（${emptyReason(response)}）`, true);
  return text;
}

/** “你不在时发生了什么”的摘要：只用这名玩家看得到的内容。 */
/** 把更早的剧情并进主持人的笔记，返回新的笔记。 */
export async function summarizeStory(opts: {
  ai: AiClient;
  previous: string;
  entries: RecentEntry[];
  /** 交给 AI 演的身份（V0.8.0 AI 补位）。 */
  companions?: CompanionBrief[];
  meta: CallMeta;
  signal?: AbortSignal;
}): Promise<string> {
  const response = await opts.ai.send(
    'summary',
    {
      max_tokens: 12000,
      system: [{ type: 'text', text: STORY_SUMMARY_SYSTEM }],
      messages: [{ role: 'user', content: buildStorySummaryContext(opts.previous, opts.entries, opts.companions) }],
    },
    opts.meta,
    opts.signal,
  );
  if (response.stop_reason === 'refusal') throw refusalOf(response, '剧情笔记被 AI 的安全机制拒绝了');
  const text = textOf(response);
  if (!text) throw new AiError(`没有写出剧情笔记（${emptyReason(response)}）`, true);
  // 写到上限被截断的笔记会丢掉后面的事：不用，过一会儿重写
  if (response.stop_reason === 'max_tokens') throw new AiError('剧情笔记写到一半被截断了', true);
  return text;
}

export async function summarizeCatchup(opts: {
  ai: AiClient;
  characterName: string | null;
  entries: CatchupEntry[];
  /** 交给 AI 演的身份（V0.8.0 AI 补位）。 */
  companions?: CompanionBrief[];
  meta: CallMeta;
  language?: StyleLanguage;
  signal?: AbortSignal;
}): Promise<string> {
  const response = await opts.ai.send(
    'summary',
    {
      max_tokens: 8000,
      system: [{ type: 'text', text: CATCHUP_SYSTEM }],
      messages: [{ role: 'user', content: buildCatchupContext(opts.characterName, opts.entries, opts.companions) + languageLine(opts.language ?? 'zh') }],
    },
    opts.meta,
    opts.signal,
  );
  if (response.stop_reason === 'refusal') throw refusalOf(response, '摘要被 AI 的安全机制拒绝了');
  const text = textOf(response);
  if (!text) throw new AiError(`没有写出摘要（${emptyReason(response)}）`, true);
  return text;
}
