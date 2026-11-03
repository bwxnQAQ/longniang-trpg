import fs from 'node:fs';
import path from 'node:path';
import { GUARD_MARK, type GuardVerdict } from './moderation';
import { GUIDE_MARK } from '../../shared/guide';
import { REVIEW_MARK, REVIEW_SUBMISSION_MARK } from './marks';
import type { AiProvider, MessagesRequest, MessagesResponse, ResponseBlock, SendHooks, StopReason, TextBlock, ToolResultBlock } from './types';

// 测试用的假主持人：不联网、不花钱。自动测试用它模拟各种回复；
// 在 .env 里写 AI_PROVIDER=fake，也能不设置 API 密钥先把流程走一遍。

export type FakeHandler = (request: MessagesRequest) => MessagesResponse | Promise<MessagesResponse>;

let counter = 0;

export function reply(content: ResponseBlock[], stop: StopReason = 'end_turn'): MessagesResponse {
  counter++;
  return {
    id: `fake_${counter}`,
    type: 'message',
    role: 'assistant',
    model: 'fake',
    content,
    stop_reason: stop,
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}

export const say = (text: string) => reply([{ type: 'text', text }]);

export function useTools(...calls: { name: string; input: unknown }[]): MessagesResponse {
  return reply(
    calls.map((c) => ({ type: 'tool_use', id: `toolu_fake_${++counter}`, name: c.name, input: c.input })),
    'tool_use',
  );
}

/** 假的内容检查：测试可以换成自己的规则。 */
export type FakeGuard = (text: string) => GuardVerdict | 'refusal';

const OK: GuardVerdict = { violation: false, category: 'none', reason: '测试用的假检查' };

/**
 * 假主持人模式下验收封号流程用：写了「测试违规」的内容当成违规，「测试无关」的当成和跑团无关，写了「测试拒绝」的行动、提问当成被 Claude 拒绝，
 * 写了「测试检查拒绝」的内容当成连发给 AI 之前的内容检查都被 Claude 拒绝了。
 * 真的 Claude 不认这几个词；千万不要拿真正违规的内容去试真的 Claude。
 */
export const FAKE_VIOLATION_WORD = '测试违规';
export const FAKE_REFUSAL_WORD = '测试拒绝';
export const FAKE_CHECK_REFUSAL_WORD = '测试检查拒绝';
/** 写了这个的内容当成「和跑团无关」（想让主持 AI 做别的事）。 */
export const FAKE_OFF_TOPIC_WORD = '测试无关';
/** 行动里写了这个，假主持人结算时宣布剧本的第一个结局（V0.5.0：玩完剧本、宠物成长要走到结局才验得了）。 */
export const FAKE_ENDING_WORD = '测试结局';
/** 行动里写了这个，假主持人一轮只调用一个工具、一直调用到上限（V0.9.1：验「到了上限照样写出叙述」）。 */
export const FAKE_LOOP_WORD = '测试打转';

const defaultGuard: FakeGuard = (text) => {
  if (text.includes(FAKE_CHECK_REFUSAL_WORD)) return 'refusal';
  if (text.includes(FAKE_OFF_TOPIC_WORD)) return { violation: true, category: 'off_topic', reason: '假主持人模式下的测试：和跑团无关' };
  return text.includes(FAKE_VIOLATION_WORD) ? { violation: true, category: 'other', reason: '假主持人模式下的测试违规' } : OK;
};

function refused(): MessagesResponse {
  return { ...reply([], 'refusal'), stop_details: { type: 'refusal', category: 'general_harms', explanation: null } };
}

export class FakeProvider implements AiProvider {
  readonly name = 'fake';
  readonly status = { ready: true, message: null };
  /** 测试额度时打开：回复里的用量按 Claude 的价格算钱。 */
  priced = false;
  /** 收到过的请求，测试里用来检查发给AI的内容（内容检查单独记在 guardRequests 里）。 */
  readonly requests: MessagesRequest[] = [];
  readonly guardRequests: MessagesRequest[] = [];
  /** 留不留收到过的请求（V0.8.0）：测试要留着检查；正式启动的假主持人不留，不然服务器开得越久占的内存越多。 */
  keepRequests = true;
  guard: FakeGuard = defaultGuard;

  constructor(
    public handler: FakeHandler = demoHandler,
    private readonly delayMs = 0,
  ) {}

  async send(request: MessagesRequest, signal?: AbortSignal, hooks?: SendHooks): Promise<MessagesResponse> {
    // 内容检查：按 guard 的规则回答，不算进 requests
    if (request.system?.[0]?.text.startsWith(GUARD_MARK)) {
      if (this.keepRequests) this.guardRequests.push(structuredClone(request));
      const text = lastUserText(request).replace(/^[\s\S]*?<<<\n/, '').replace(/\n>>>$/, '');
      const verdict = this.guard(text);
      if (verdict === 'refusal') return refused();
      return say(JSON.stringify(verdict));
    }
    if (this.keepRequests) this.requests.push(structuredClone(request));
    if (this.delayMs) {
      await new Promise<void>((resolve, reject) => {
        // 传进来的多半是一直用着的 signal（整个对局引擎共用一个）：等完了要把监听去掉，不然每次调用都留下一个（V0.8.0）
        const onAbort = () => {
          clearTimeout(timer);
          reject(signal?.reason);
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          resolve();
        }, this.delayMs);
        signal?.addEventListener('abort', onAbort, { once: true });
      });
    }
    const response = await this.handler(request);
    // 流式调用：假装一次写完，报一次进度
    if (request.stream && hooks?.onProgress) {
      hooks.onProgress(response.content.reduce((n, b) => n + (b.type === 'text' ? [...(b as TextBlock).text].length : 0), 0));
    }
    return response;
  }
}

// ---------- 默认的假主持人 ----------

function lastUserText(request: MessagesRequest): string {
  for (let i = request.messages.length - 1; i >= 0; i--) {
    const m = request.messages[i];
    if (m.role !== 'user') continue;
    if (typeof m.content === 'string') return m.content;
    const text = m.content.filter((b): b is TextBlock => b.type === 'text').map((b) => b.text).join('\n');
    if (text) return text;
  }
  return '';
}

function actionText(context: string): string {
  const quotes = [...context.matchAll(/「([^」]*)」/g)];
  return quotes.length ? quotes[quotes.length - 1][1] : '';
}

const SEARCH_WORDS = /搜|查|找|看|检查|翻|观察|调查/;

/** 假的“生成剧本”：大纲和完整剧本都拿《雾港旅店》改个名字，流程能走通就行。 */
function demoScenario(request: MessagesRequest): MessagesResponse {
  let base: Record<string, any>;
  try {
    base = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', 'test', 'fixtures', 'fog-harbor-inn.json'), 'utf8'));
  } catch {
    return say('{}');
  }
  base.title = '雾港旅店（测试用的假剧本）';
  base.intro = '测试用的假剧本：海边小镇的旅店里出了命案，大雾封住了出镇的路，凶手就在住客当中。';
  if (lastUserText(request).startsWith('# 第一步')) {
    return say(
      JSON.stringify({
        title: base.title,
        genre: base.genre,
        tone: base.tone,
        relation: base.relation,
        stress: base.stress,
        start: base.start,
        premise: base.opening.situation,
        truth: base.truth,
        npcs: base.npcs.map((n: any) => ({ key: n.key, name: n.name, identity: n.identity, personality: n.personality, wants: n.wants, part: n.knows[0] ?? '' })),
        endings: base.endings,
        roles: base.roles.map((r: any) => ({ key: r.key, name: r.name, public: r.public, secret: r.secret, goal: r.goal })),
      }),
    );
  }
  return say(JSON.stringify(base));
}

/** 假的 AI 审核意见。 */
function demoReview(request: MessagesRequest): MessagesResponse {
  const text = lastUserText(request);
  const bad = text.includes(FAKE_VIOLATION_WORD);
  if (request.system?.[0]?.text.includes(REVIEW_SUBMISSION_MARK)) {
    return say(
      JSON.stringify({
        verdict: bad ? 'reject' : 'approve',
        summary: bad ? '（测试用的假审核）内容里有违规的地方，建议退回。' : '（测试用的假审核）结构完整，能玩，建议通过。',
        content_ok: !bad,
        content_notes: bad ? '有违规内容' : '',
        quality_score: bad ? 2 : 4,
        strengths: bad ? [] : ['开场清楚'],
        problems: bad ? ['内容违规'] : [],
        intro_spoiler: false,
        category_ok: true,
        suggested_category: 'none',
        category_notes: '',
        suggestions: bad ? ['删掉违规的内容'] : [],
      }),
    );
  }
  return say(
    JSON.stringify({
      verdict: bad ? 'violation' : 'no_violation',
      summary: bad ? '（测试用的假审核）这条内容违规。' : '（测试用的假审核）没看出违规。',
      category: bad ? 'harassment' : 'none',
      severity: bad ? 'medium' : 'low',
      action: bad ? 'warn' : 'none',
      reasons: bad ? ['测试用的违规词'] : [],
    }),
  );
}

/** 估时、结算、场外问答都给一个看得出是“假的”的固定套路回复。 */
export function demoHandler(request: MessagesRequest): MessagesResponse {
  // AI 审核（V0.6.0）：写了「测试违规」的投稿建议退回、举报判违规，别的建议通过、判不违规
  if (request.system?.[0]?.text.startsWith(REVIEW_MARK)) return demoReview(request);
  // 生成剧本、转换剧本
  if (request.system?.[0]?.text.includes('剧本作者')) return demoScenario(request);
  // 验收用：写了「测试拒绝」的行动、提问，假装被 Claude 的安全机制拒绝
  if (!request.system?.[0]?.text.includes('补课') && actionText(lastUserText(request)).includes(FAKE_REFUSAL_WORD)) return refused();

  // 估算耗时
  if (request.output_config?.format) {
    const action = actionText(lastUserText(request));
    const minutes = /睡/.test(action) ? 480 : /去|走|前往/.test(action) ? 15 : SEARCH_WORDS.test(action) ? 30 : 10;
    // 以问号结尾的当成场外提问（测试合并的输入框用；真的 Claude 会按意思判断）
    const kind = /[?？]$/.test(action.trim()) ? 'question' : 'action';
    return say(JSON.stringify({ minutes, reason: '测试用的假估时', kind }));
  }

  // 工具调用到了上限以后，只让主持人写叙述的那一次（V0.9.1）：照已经做完的几步写一句
  if (!request.tools?.length && lastUserText(request).includes('# 这次结算里已经调用过的工具和结果')) {
    const text = lastUserText(request);
    const steps = text.match(/^\d+\. /gm)?.length ?? 0;
    const who = text.slice(text.indexOf('# 这次要结算的行动')).match(/角色：([^（\n]+)（编号/)?.[1]?.trim() || '角色';
    return say(`（这是测试用的假主持人，没有调用 AI。）${who}这一下做了太多步，程序让主持人照已经做完的 ${steps} 步写叙述。四周安静下来，雾气贴着窗户慢慢流动。`);
  }

  // 场外问答、“你不在时”的摘要、宠物日记
  if (!request.tools?.length) {
    if (request.system?.[0]?.text.includes('补课')) {
      return say('（测试用的假主持人）接上真的 AI 以后，这里会把这段时间里角色知道的事写成一段摘要。');
    }
    if (request.system?.[0]?.text.startsWith(GUIDE_MARK)) {
      return say(`（测试用的假向导）接上真的 AI 以后，这里会回答：${lastUserText(request).slice(0, 60)}`);
    }
    if (request.system?.[0]?.text.includes('替一只宠物写日记')) {
      const pet = lastUserText(request).match(/宠物：([^（\n]+)/)?.[1] ?? '宠物';
      return say(`（测试用的假主持人写的日记）今天我跟着主人出了一趟远门。接上真的 AI 以后，这里是${pet}用自己的口吻写的日记。`);
    }
    if (request.system?.[0]?.text.includes('整理笔记')) {
      return say('（测试用的假主持人写的剧情笔记，接上真的 AI 以后这里是更早的剧情摘要。）');
    }
    return say('（测试用的假主持人）接上真的 AI 以后，这里会根据你的角色已经知道的信息回答问题。');
  }

  const last = request.messages[request.messages.length - 1];
  const toolResults =
    last.role === 'user' && Array.isArray(last.content)
      ? last.content.filter((b): b is ToolResultBlock => b.type === 'tool_result')
      : [];

  const context = lastUserText(request);
  const action = actionText(context.slice(context.indexOf('# 这次要结算的行动')));

  // 验收用（V0.9.1）：写了「测试打转」的行动，一轮只调用一个工具（记一笔第一个 NPC，没有 NPC 就单独告诉自己一句），一直调用到上限
  if (toolResults.length && action.includes(FAKE_LOOP_WORD)) {
    const step = request.messages.filter((m) => m.role === 'user' && Array.isArray(m.content) && m.content.some((b) => b.type === 'tool_result')).length + 1;
    const actorId = Number(context.slice(context.indexOf('# 这次要结算的行动')).match(/编号 (\d+)/)?.[1] ?? 0);
    const scenarioText = request.system?.[1]?.text ?? '';
    let npc: string | undefined;
    try {
      npc = (JSON.parse(scenarioText.slice(scenarioText.indexOf('{'))) as { npcs?: { key: string }[] }).npcs?.[0]?.key;
    } catch {
      npc = undefined;
    }
    return npc
      ? useTools({ name: 'update_npc', input: { npc, note: `测试打转第${step}步` } })
      : useTools({ name: 'private_message', input: { character: actorId, text: `测试打转第${step}步` } });
  }

  // 第二轮：根据工具的结果写叙述
  if (toolResults.length) {
    const results = toolResults.map((r) => {
      try {
        return JSON.parse(r.content) as Record<string, unknown>;
      } catch {
        return {};
      }
    });
    const roll = results.find((r) => typeof r.outcome_label === 'string');
    // 5E（V0.9.0）的检定结果：总数、成没成
    const check5e = results.find((r) => typeof r.check === 'string' && typeof r.total === 'number');
    const clue = results.find((r) => Array.isArray(r.given_to) && r.given_to.length);
    const moved = results.find((r) => typeof r.location === 'string' && 'other_characters_here' in r);
    // 叙述用第三人称、写角色的名字（同一地点的人都看得到）
    const who = context.slice(context.indexOf('# 这次要结算的行动')).match(/角色：([^（\n]+)（编号/)?.[1]?.trim() || '角色';
    const parts = ['（这是测试用的假主持人，没有调用 AI。）', `${who}${action ? `试着「${action}」` : '行动了'}。`];
    if (moved) parts.push(`${who}来到了${String(moved.location)}。`);
    if (roll && typeof roll.pet_help === 'string') parts.push(`${String(roll.pet_help).split('（')[0]}扑上去帮了一把。`);
    if (roll) parts.push(`结果是「${String(roll.outcome_label)}」：${String(roll.meaning ?? '')}。`);
    if (check5e) parts.push(check5e.success === false ? '可惜没成。' : '这一下成了。');
    if (clue) parts.push(`${who}发现了「${String(clue.clue)}」。`);
    // 规则第二版（V0.7.0）：开打、攻击、还手、受伤、宝物、奇遇
    for (const r of results) {
      if (Array.isArray(r.enemies) && Array.isArray(r.order)) parts.push('敌人扑了上来。');
      if (typeof r.hit === 'boolean' && 'defense' in r && 'enemy' in r && typeof r.enemy === 'object') parts.push(r.hit ? '这一下打中了。' : '这一下落空了。');
      if (typeof r.hit === 'boolean' && typeof r.enemy === 'string') parts.push(r.hit ? `${String(r.enemy)}打中了${who}。` : `${String(r.enemy)}扑了个空。`);
      if (typeof r.lost_hp === 'number') parts.push(`${who}受了点伤。`);
      if (typeof r.found === 'string') parts.push(`${who}找到了${String(r.found)}。`);
      if (r.qiyu && typeof r.qiyu === 'object') parts.push(`${who}碰上了一桩奇遇：${String((r.qiyu as { title?: string }).title ?? '')}。`);
      if (typeof r.skill === 'string') parts.push(`${who}使出了「${String(r.skill)}」。`);
      // 5E（V0.9.0）：开打、攻击、怪物行动、施法、宝藏
      if (Array.isArray(r.monsters) && Array.isArray(r.order)) parts.push('怪物扑了上来。');
      if (typeof r.hit === 'boolean' && typeof r.weapon === 'string') parts.push(r.hit ? '这一下打中了。' : '这一下落空了。');
      if (typeof r.action === 'string' && typeof r.enemy === 'string' && Array.isArray(r.results)) parts.push(`${String(r.enemy)}动手了。`);
      if (typeof r.spell === 'string' && typeof r.cast_at === 'string') parts.push(`${who}念出了「${String(r.spell)}」。`);
      if (Array.isArray(r.got)) parts.push(`${who}找到了${(r.got as string[]).join('、')}。`);
    }
    parts.push('四周安静下来，雾气贴着窗户慢慢流动。');
    return say(parts.join(''));
  }

  // 第一轮：掷一次检定；搜查类的行动给一条这里的线索；提到别的地点就走过去
  const block = context.slice(context.indexOf('# 这次要结算的行动'));
  const actorId = Number(block.match(/编号 (\d+)/)?.[1] ?? 0);
  const here = block.match(/现在在 [^（\n]*（([a-z][a-z0-9-]*)）/)?.[1] ?? null;
  let scenario: {
    locations?: { key: string; name: string }[];
    clues?: { key: string; title: string; location: string }[];
    endings?: { key: string }[];
    enemies?: { key: string; tier: string }[];
    dungeon?: { enemies?: { key: string; tier: string }[]; encounters?: { key: string; at?: string }[]; loot?: { key: string; at?: string }[] };
  } = {};
  const scenarioText = request.system?.[1]?.text ?? '';
  try {
    scenario = JSON.parse(scenarioText.slice(scenarioText.indexOf('{')));
  } catch {
    scenario = {};
  }
  const actorBlock = context.slice(context.indexOf(`[编号 ${actorId}]`));
  const known = actorBlock.match(/已知线索：([^\n]*)/)?.[1]?.split('、') ?? [];

  const calls: { name: string; input: unknown }[] = [];
  // 5E 模组（V0.9.0）：工具换成 5E 的
  if (request.tools?.some((t) => t.name === 'check')) return demo5e(request, { action, actorId, here, actorBlock, known, context });
  // V0.7.0 验收用（规则第二版）：「测试开打」放出剧本的第一种小怪（地下城里这里有遇敌就用遇敌）、「测试攻击」打这里第一个没倒下的敌人、
  // 「测试还手」第一个敌人打行动的人、「测试受伤」受轻伤、「测试宝物」拿这里的宝物、「测试技能」用会的第一门技能、「测试结束战斗」、
  // 「测试喝药」喝一瓶治疗药水（带进来的先用，没有就用这一局捡到的）
  const fight = context.slice(context.indexOf('## 正在打的仗'));
  const enemyIds = context.includes('## 正在打的仗') ? [...fight.matchAll(/\n {2}- ([a-z][a-z0-9-]*-\d+) [^：\n]*：生命/g)].map((m) => m[1]) : [];
  const enemyList = scenario.dungeon?.enemies ?? scenario.enemies ?? [];
  if (action.includes('测试开打')) {
    const enc = scenario.dungeon?.encounters?.find((e) => e.at === here);
    const first = enemyList.find((e) => e.tier !== 'boss') ?? enemyList[0];
    if (enc) calls.push({ name: 'start_combat', input: { encounter: enc.key, note: '测试用的开打' } });
    else if (first) calls.push({ name: 'start_combat', input: { enemies: [{ enemy: first.key, count: 1 }], note: '测试用的开打' } });
  }
  if (action.includes('测试攻击') && enemyIds[0]) calls.push({ name: 'attack', input: { character: actorId, enemy: enemyIds[0], attribute: 'strength', modifier: 0, reason: '测试用的攻击' } });
  if (action.includes('测试还手') && enemyIds[0]) calls.push({ name: 'enemy_attack', input: { enemy: enemyIds[0], character: actorId, severity: 'light' } });
  if (action.includes('测试受伤')) calls.push({ name: 'hurt', input: { character: actorId, severity: 'light', reason: '测试用的受伤' } });
  if (action.includes('测试宝物')) {
    const loot = scenario.dungeon?.loot?.find((l) => l.at === here);
    if (loot) calls.push({ name: 'give_loot', input: { character: actorId, loot: loot.key } });
  }
  const skill = actorBlock.match(/会的技能（use_skill）：[^（]*（([a-z]+)，/)?.[1];
  if (action.includes('测试技能') && skill) calls.push({ name: 'use_skill', input: { character: actorId, skill, target_enemy: enemyIds[0], reason: '测试用的技能' } });
  if (action.includes('测试结束战斗')) calls.push({ name: 'end_combat', input: { note: '测试用的结束' } });
  if (action.includes('测试喝药')) calls.push({ name: 'use_item', input: { character: actorId, item: 'potion' } });
  if (!calls.length) calls.push({ name: 'roll_check', input: { character: actorId, attribute: 'perception', modifier: 0, reason: '测试用的检定' } });
  const target = scenario.locations?.find((l) => l.key !== here && action.includes(l.name));
  if (target) calls.push({ name: 'move_character', input: { character: actorId, location: target.key } });
  const at = target?.key ?? here;
  if (SEARCH_WORDS.test(action)) {
    const clue = scenario.clues?.find((c) => c.location === at && !known.includes(c.title));
    if (clue) calls.push({ name: 'give_clue', input: { clue: clue.key, characters: [actorId] } });
  }
  // 验收用：写了「测试结局」的行动，宣布剧本的第一个结局；「测试结局2」「测试结局3」……宣布第几个（V0.6.0：结局图鉴）
  const endingMatch = action.match(new RegExp(`${FAKE_ENDING_WORD}(\\d)?`));
  const ending = endingMatch ? scenario.endings?.[Math.max(0, Number(endingMatch[1] ?? 1) - 1)]?.key : undefined;
  if (ending) calls.push({ name: 'end_game', input: { ending, epilogue: '（测试用的假主持人）故事在这里画上了句号。' } });
  return useTools(...calls);
}

/**
 * 5E 模组（V0.9.0）的假主持人：默认做一次察觉检定；验收用的几个词：「测试开打」放出剧本的第一种怪物、「测试攻击」用身上第一件武器
 * 打这里第一个没倒下的怪物、「测试还手」第一个怪物用它的第一个动作打行动的人、「测试受伤」受 1d6 挥砍伤害、「测试施法」施放第一个戏法、
 * 「测试喝药」喝一瓶治疗药水、「测试宝物」拿这里的宝藏、「测试休息」短休、「测试结束战斗」、「测试结局」。
 */
function demo5e(
  request: MessagesRequest,
  c: { action: string; actorId: number; here: string | null; actorBlock: string; known: string[]; context: string },
): MessagesResponse {
  let scenario: {
    locations?: { key: string; name: string }[];
    clues?: { key: string; title: string; location: string }[];
    endings?: { key: string }[];
    monsters?: { key: string }[];
    treasure?: { key: string; location: string }[];
  } = {};
  const scenarioText = request.system?.[1]?.text ?? '';
  try {
    // 剧本 JSON 在怪物数据块后面：从最后一段以 { 开头的行读
    const start = scenarioText.lastIndexOf('\n{');
    scenario = JSON.parse(scenarioText.slice(start >= 0 ? start + 1 : scenarioText.indexOf('{')));
  } catch {
    scenario = {};
  }
  const { action, actorId, here, actorBlock, known, context } = c;
  const fight = context.includes('## 正在打的仗') ? context.slice(context.indexOf('## 正在打的仗')) : '';
  const enemyIds = [...fight.matchAll(/\n {2}- ([a-z][a-z0-9-]*-\d+) [^：\n]*：生命/g)].map((m) => m[1]);
  const weapon = actorBlock.match(/攻击（attack 的 weapon 填括号里的）：[^（\n]*（([a-z0-9+-]+)）/)?.[1];
  const cantrip = actorBlock.match(/戏法（随意施放）：[^（\n]*（([a-z0-9-]+)/)?.[1];
  const calls: { name: string; input: unknown }[] = [];
  if (action.includes('测试开打') && scenario.monsters?.[0]) calls.push({ name: 'start_combat', input: { monsters: [{ monster: scenario.monsters[0].key, count: 1 }], note: '测试用的开打' } });
  if (action.includes('测试攻击') && enemyIds[0] && weapon) calls.push({ name: 'attack', input: { character: actorId, target: enemyIds[0], weapon, reason: '测试用的攻击' } });
  if (action.includes('测试还手') && enemyIds[0]) calls.push({ name: 'monster_action', input: { enemy: enemyIds[0], action: '1', targets: [actorId], reason: '测试用的还手' } });
  if (action.includes('测试受伤')) calls.push({ name: 'damage', input: { characters: [actorId], dice: '1d6', type: 'slashing', reason: '测试用的受伤' } });
  if (action.includes('测试施法') && cantrip) calls.push({ name: 'cast_spell', input: { character: actorId, spell: cantrip, ...(enemyIds[0] ? { enemies: [enemyIds[0]] } : {}), reason: '测试用的施法' } });
  if (action.includes('测试喝药')) calls.push({ name: 'use_item', input: { character: actorId, item: 'potion-of-healing', reason: '测试用的喝药' } });
  if (action.includes('测试宝物')) {
    const t = scenario.treasure?.find((x) => x.location === here);
    if (t) calls.push({ name: 'give_treasure', input: { character: actorId, treasure: t.key, reason: '测试用的宝藏' } });
  }
  if (action.includes('测试休息')) calls.push({ name: 'rest', input: { kind: 'short', reason: '测试用的休息' } });
  if (action.includes('测试结束战斗')) calls.push({ name: 'end_combat', input: { note: '测试用的结束' } });
  if (!calls.length) calls.push({ name: 'check', input: { character: actorId, skill: 'perception', dc: 10, reason: '测试用的检定' } });
  const target = scenario.locations?.find((l) => l.key !== here && action.includes(l.name));
  if (target) calls.push({ name: 'move_character', input: { character: actorId, location: target.key } });
  const at = target?.key ?? here;
  if (SEARCH_WORDS.test(action)) {
    const clue = scenario.clues?.find((x) => x.location === at && !known.includes(x.title));
    if (clue) calls.push({ name: 'give_clue', input: { clue: clue.key, characters: [actorId] } });
  }
  const endingMatch = action.match(new RegExp(`${FAKE_ENDING_WORD}(\\d)?`));
  const ending = endingMatch ? scenario.endings?.[Math.max(0, Number(endingMatch[1] ?? 1) - 1)]?.key : undefined;
  if (ending) calls.push({ name: 'end_game', input: { ending, epilogue: '（测试用的假主持人）故事在这里画上了句号。' } });
  return useTools(...calls);
}
