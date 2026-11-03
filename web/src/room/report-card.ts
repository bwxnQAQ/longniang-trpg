import { CATEGORY_NAME, formatDuration, formatGameTime, type ScenarioCategory } from '../../../shared/game';
import type { HighlightItem, ReportData, RollTally } from '../../../shared/highlights';
import { OUTCOME_LABEL, type Outcome } from '../../../shared/rules';

// 战报卡片（V0.8.0）：在浏览器里用 canvas 画一张竖图，不经过服务器。
// 配色固定用网站亮色的那一套（纸和墨、描金、朱红的印），亮色暗色模式下导出的图都一样；字体用网站自己的字体变量。
// canvas 不会自己折行：中文按字折行，连在一起的英文、数字不从中间断开，句读不放在行首。

export const CARD_WIDTH = 1080;
/** 竖图 3:4；内容多的时候往下长，最多 9:16（再多就少放几行名场面）。 */
const MIN_HEIGHT = 1440;
const MAX_HEIGHT = 1920;
const PAD = 84;
const INNER = CARD_WIDTH - PAD * 2;

/** 网站亮色的颜色（web/src/styles/base.css 里的变量）。 */
const C = {
  paper: '#f2f3ef',
  ink: '#1d2330',
  inkSoft: '#4b5263',
  muted: '#646a79',
  rule: '#d3d6ce',
  ruleStrong: '#b6bab0',
  seal: '#b23a2e',
  sealInk: '#f8eee9',
  gold: '#c08a2c',
  goldDeep: '#8f6418',
  jade: '#2d7563',
};

const CATEGORY_COLOR: Record<ScenarioCategory, string> = {
  puzzle: '#2e5aac',
  horror: '#5d3f73',
  combat: '#b23a2e',
  adventure: '#2d7563',
  social: '#8f6418',
  dungeon: '#3f4a6b',
};

/** 掷骰的五种结果：两头（大成功、大失败）是实心的印，中间三种是描边的字，和对局里骰子卡片的颜色一样。 */
const OUTCOMES: { key: Outcome; color: string; solid: boolean }[] = [
  { key: 'critical', color: C.jade, solid: true },
  { key: 'success', color: C.jade, solid: false },
  { key: 'partial', color: C.goldDeep, solid: false },
  { key: 'failure', color: C.seal, solid: false },
  { key: 'fumble', color: C.seal, solid: true },
];

const STATUS_TEXT: Record<ReportData['room']['status'], string> = { preparing: '准备中', running: '进行中', paused: '已暂停', ended: '已结束' };

const FALLBACK_FONTS = {
  ui: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Source Han Sans SC', system-ui, sans-serif",
  story: "'Source Han Serif SC', 'Noto Serif CJK SC', 'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif",
};

/** 网站的字体：读 base.css 里的 --font-ui、--font-story（读不到就用一样的默认值）。 */
export function siteFonts(): { ui: string; story: string } {
  try {
    const style = getComputedStyle(document.documentElement);
    return {
      ui: style.getPropertyValue('--font-ui').trim() || FALLBACK_FONTS.ui,
      story: style.getPropertyValue('--font-story').trim() || FALLBACK_FONTS.story,
    };
  } catch {
    return FALLBACK_FONTS;
  }
}

export type CardInput = {
  data: ReportData;
  /** 放上结局（会剧透，对话框里勾了才放）。 */
  showEnding: boolean;
  /** 选的名场面（最多 3 条，按记录的先后）。 */
  highlights: HighlightItem[];
  fonts: { ui: string; story: string };
  /** 网站的标志（没加载出来是 null，只写站名）。 */
  logo: CanvasImageSource | null;
  /** 卡片角上的日期（生成的时候）。 */
  today: number;
};

// ---------- 折行 ----------

/** 不放在行首的标点（挂在上一行末尾）；不放在行尾的开括号（挪到下一行）。 */
const NO_LINE_START = new Set([...'，。、；：？！…—）》」』〕】〉”’,.;:?!)]}%·～']);
const NO_LINE_END = new Set([...'（《「『〔【〈“‘([{']);
const WORD_CHAR = /^[A-Za-z0-9'’\-_.@#&+]$/;

type Segmenter = { segment(text: string): Iterable<{ segment: string }> };
/** 按「字」切（表情符号这类几个码点拼成的也算一个）；浏览器没有 Intl.Segmenter 时按码点切。建一次就够了。 */
let segmenter: Segmenter | null | undefined;

function graphemes(text: string): string[] {
  if (segmenter === undefined) {
    const Ctor = (Intl as unknown as { Segmenter?: new (locale: string, o: { granularity: 'grapheme' }) => Segmenter }).Segmenter;
    segmenter = Ctor ? new Ctor('zh', { granularity: 'grapheme' }) : null;
  }
  return segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);
}

/** 折行的单位：连在一起的英文字母、数字算一个，别的一个字一个。 */
function tokensOf(text: string): string[] {
  const out: string[] = [];
  let word = '';
  for (const ch of graphemes(text)) {
    if (WORD_CHAR.test(ch)) {
      word += ch;
      continue;
    }
    if (word) out.push(word);
    word = '';
    out.push(ch);
  }
  if (word) out.push(word);
  return out;
}

/**
 * 按宽度折行。超过 maxLines 的截断，最后一行末尾加省略号。measure 量一段文字有多宽（用 canvas 当前的字体）。
 * 换行符照样换行；一个词比一整行还宽时按字断开。
 */
export function wrapText(measure: (s: string) => number, text: string, width: number, maxLines = Infinity): string[] {
  const lines: string[] = [];
  // 已经超过 maxLines 就不用再往下折了（只要知道放不下）
  paragraphs: for (const paragraph of text.split('\n')) {
    let line: string[] = [];
    const push = () => {
      lines.push(line.join(''));
      line = [];
    };
    for (const token of tokensOf(paragraph)) {
      if (lines.length > maxLines) break paragraphs;
      if (!line.length || measure(line.join('') + token) <= width || NO_LINE_START.has(token)) {
        line.push(token);
      } else {
        // 开括号不留在行尾，跟着下一个字走
        const carry: string[] = [];
        while (line.length > 1 && NO_LINE_END.has(line[line.length - 1])) carry.unshift(line.pop()!);
        push();
        line = [...carry, token];
      }
      // 一个词就超过一行：按字断开
      while (line.length === 1 && measure(line[0]) > width && graphemes(line[0]).length > 1) {
        const chars = graphemes(line[0]);
        let n = 1;
        while (n < chars.length && measure(chars.slice(0, n + 1).join('')) <= width) n++;
        lines.push(chars.slice(0, n).join(''));
        line = [chars.slice(n).join('')];
      }
    }
    push();
  }
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, Math.max(1, maxLines));
  const ellipsis = '……';
  let last = graphemes(kept[kept.length - 1]);
  while (last.length && measure(last.join('') + ellipsis) > width) last = last.slice(0, -1);
  kept[kept.length - 1] = last.join('').replace(/[，。、；：！？,.;:!?\s]+$/, '') + ellipsis;
  return kept;
}

/** 名场面的正文放进卡片：段落接成一段（句末本来有标点的直接接上）。 */
function oneParagraph(text: string): string {
  return text
    .replace(/([^。！？…」』”.!?])[ \t]*\n+\s*/g, '$1 ')
    .replace(/\s*\n+\s*/g, '')
    .trim();
}

/** 结局的收尾只放第一句（太短就放到第二句）。 */
function firstSentence(text: string): string {
  const flat = oneParagraph(text);
  const sentences = flat.match(/[^。！？!?]+[。！？!?]*/g) ?? [flat];
  let out = '';
  for (const s of sentences) {
    out += s;
    if ([...out].length >= 12) break;
  }
  return out;
}

// ---------- 画 ----------

/** 小工具：同一套代码先「量」一遍（算出要多高），再真的画。paint 是 false 时只量不画。 */
class Pen {
  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly paint: boolean,
    readonly fonts: { ui: string; story: string },
  ) {}

  font(kind: 'ui' | 'story', size: number, weight = 400) {
    this.ctx.font = `${weight} ${size}px ${this.fonts[kind]}`;
    return this;
  }

  width(text: string) {
    return this.ctx.measureText(text).width;
  }

  /** 写一行字：y 是这一行的中线。 */
  text(text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left') {
    if (!this.paint) return;
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  /** 字距拉开以后有多宽。 */
  spacedWidth(text: string, spacing: number) {
    const chars = graphemes(text);
    return chars.reduce((w, ch) => w + this.width(ch), 0) + spacing * (chars.length - 1);
  }

  /** 字距拉开的一行（小标题），返回宽度。 */
  spaced(text: string, x: number, y: number, color: string, spacing: number, align: 'left' | 'right' = 'left') {
    const chars = graphemes(text);
    const total = this.spacedWidth(text, spacing);
    let cx = align === 'left' ? x : x - total;
    for (const ch of chars) {
      this.text(ch, cx, y, color);
      cx += this.width(ch) + spacing;
    }
    return total;
  }

  rect(x: number, y: number, w: number, h: number, color: string) {
    if (!this.paint) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  round(x: number, y: number, w: number, h: number, r: number, fill: string | null, stroke: string | null = null, lineWidth = 2) {
    if (!this.paint) return;
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }
}

/** 可以重复的随机数（印章上的斑驳每次画都一样）。 */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 右上角盖的「战报」朱印：实心的方印、白字，稍微歪一点，边上有点斑驳。 */
function drawSeal(pen: Pen, cx: number, cy: number, size: number) {
  if (!pen.paint) return;
  const { ctx } = pen;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-5 * Math.PI) / 180);
  pen.round(-size / 2, -size / 2, size, size, 12, C.seal);
  ctx.strokeStyle = C.sealInk;
  ctx.lineWidth = 3;
  ctx.strokeRect(-size / 2 + 10, -size / 2 + 10, size - 20, size - 20);
  pen.font('story', Math.round(size * 0.34), 900);
  pen.text('战', 0, -size * 0.19, C.sealInk, 'center');
  pen.text('报', 0, size * 0.2, C.sealInk, 'center');
  // 斑驳：几粒纸色的小点
  const random = seeded(20261028);
  ctx.fillStyle = C.paper;
  for (let i = 0; i < 70; i++) {
    const x = (random() - 0.5) * size;
    const y = (random() - 0.5) * size;
    const edge = Math.max(Math.abs(x), Math.abs(y)) > size * 0.38;
    ctx.globalAlpha = edge ? 0.55 : 0.25;
    ctx.beginPath();
    ctx.arc(x, y, random() * (edge ? 2.6 : 1.6) + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 每一块顶上一道墨线，下面是字距拉开的小标题；right 是标题右边的一句（比如「2 人」）。返回这一块正文开始的 y。 */
function sectionHead(pen: Pen, y: number, title: string, right?: string): number {
  pen.rect(PAD, y, INNER, 3, C.ink);
  pen.font('ui', 24, 700);
  pen.spaced(title, PAD, y + 34, C.ink, 8);
  if (right) {
    pen.font('ui', 22);
    pen.text(right, PAD + INNER, y + 34, C.muted, 'right');
  }
  return y + 62;
}

/** 「3小时20分钟」这样的数：数字用大号宋体，单位用小号黑体；没有数字的（「未开局」）整个用中号宋体。返回宽度。 */
function drawAmount(pen: Pen, value: string, centerX: number, y: number, color: string, big = 50): number {
  if (!/\d/.test(value)) {
    pen.font('story', Math.round(big * 0.7), 700);
    pen.text(value, centerX, y, color, 'center');
    return pen.width(value);
  }
  const parts = value.split(/(\d+)/).filter(Boolean);
  const measure = (p: string) => (/^\d+$/.test(p) ? pen.font('story', big, 700).width(p) : pen.font('ui', Math.round(big * 0.46), 500).width(p) + 2);
  const total = parts.reduce((w, p) => w + measure(p), 0);
  let x = centerX - total / 2;
  for (const p of parts) {
    const w = measure(p);
    if (/^\d+$/.test(p)) {
      pen.font('story', big, 700);
      pen.text(p, x, y, color);
    } else {
      pen.font('ui', Math.round(big * 0.46), 500);
      pen.text(p, x + 1, y + big * 0.12, C.inkSoft);
    }
    x += w;
  }
  return total;
}

function dateText(ms: number, withYear = true): string {
  const d = new Date(ms);
  return `${withYear ? `${d.getFullYear()}年` : ''}${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 玩的日子：同一天写一天，跨天写「10月25日—28日」。 */
function playDates(start: number, end: number): string {
  const a = new Date(start);
  const b = new Date(end);
  if (a.toDateString() === b.toDateString()) return dateText(start);
  if (a.getFullYear() !== b.getFullYear()) return `${dateText(start)}—${dateText(end)}`;
  return `${dateText(start)}—${a.getMonth() === b.getMonth() ? `${b.getDate()}日` : dateText(end, false)}`;
}

/** 名场面一条的署名：游戏时间 · 谁。 */
function byline(h: HighlightItem): string {
  return `${h.gameTime !== null ? `${formatGameTime(h.gameTime)} · ` : ''}${h.label}`;
}

/**
 * 排一遍版：paintHeight 是 null 时只量，返回内容要多高、块和块之间有几处空；给了画布的高度就照着画（页脚贴着底边）。
 * quoteLines：每条名场面最多几行；spread：内容少的时候，块和块之间多空出来的高度（免得下面空一大片）。
 */
function layout(pen: Pen, input: CardInput, quoteLines: number, paintHeight: number | null, spread = 0): { height: number; gaps: number } {
  const { data } = input;
  const H = paintHeight ?? 0;
  let gaps = 0;
  /** 块和块之间空一段。 */
  const space = (base: number) => {
    gaps++;
    return base + spread;
  };

  // 纸面（纯色：渐变几乎看不出来，却让 PNG 大三倍）；顶上一道墨、一道金，底下一道墨
  if (pen.paint) {
    pen.rect(0, 0, CARD_WIDTH, H, C.paper);
    pen.rect(0, 0, CARD_WIDTH, 14, C.ink);
    pen.rect(0, 14, CARD_WIDTH, 4, C.gold);
    pen.rect(0, H - 10, CARD_WIDTH, 10, C.ink);
  }

  // ---- 抬头：状态和日子、对局名、剧本；右边一方朱印 ----
  const sealSize = 132;
  const headWidth = INNER - sealSize - 36;
  let y = 76;
  const start = data.startedAt;
  const end = data.endedAt ?? data.now;
  pen.font('ui', 24, 700);
  const statusWidth = pen.spaced(STATUS_TEXT[data.room.status], PAD, y + 16, data.room.status === 'ended' ? C.seal : C.jade, 4);
  if (start !== null) {
    pen.font('ui', 24);
    pen.text(`·  ${playDates(start, end)}`, PAD + statusWidth + 14, y + 16, C.muted);
  }
  y += 48;
  // 对局名：一行放得下就用大字，放不下缩小（56 号最多两行，50 号最多三行，再多截断）
  let titleLines: string[] = [];
  let titleSize = 72;
  for (const [size, max] of [
    [72, 1],
    [64, 1],
    [56, 2],
    [50, 3],
  ]) {
    titleSize = size;
    pen.font('story', size, 700);
    const lines = wrapText((s) => pen.width(s), data.room.name, headWidth);
    titleLines = lines.length <= max ? lines : wrapText((s) => pen.width(s), data.room.name, headWidth, max);
    if (lines.length <= max) break;
  }
  const titleLine = Math.round(titleSize * 1.25);
  pen.font('story', titleSize, 700);
  titleLines.forEach((line, i) => pen.text(line, PAD, y + titleLine * i + titleLine / 2, C.ink));
  y += titleLine * titleLines.length + 10;
  if (data.scenario) {
    pen.font('story', 34, 500);
    const scenarioLines = wrapText((s) => pen.width(s), `《${data.scenario.title}》`, headWidth - 120, 2);
    scenarioLines.forEach((line, i) => pen.text(line, PAD - 6, y + 23 + 46 * i, C.inkSoft));
    const category = data.scenario.category;
    if (category) {
      const lastWidth = pen.width(scenarioLines[scenarioLines.length - 1]);
      const cy = y + 23 + 46 * (scenarioLines.length - 1);
      pen.font('ui', 22, 700);
      const label = CATEGORY_NAME[category];
      const w = pen.width(label) + 24;
      const x = PAD - 6 + lastWidth + 14;
      pen.round(x, cy - 18, w, 36, 6, null, CATEGORY_COLOR[category], 2);
      pen.text(label, x + w / 2, cy + 1, CATEGORY_COLOR[category], 'center');
    }
    y += 46 * scenarioLines.length;
  }
  y = Math.max(y, 76 + sealSize + 20);
  drawSeal(pen, PAD + INNER - sealSize / 2 + 4, 76 + sealSize / 2 + 6, sealSize);
  y += space(36);

  // ---- 历时、回合、行动、检定 ----
  pen.rect(PAD, y, INNER, 3, C.ink);
  const facts: { label: string; value: string }[] = [
    { label: '历时', value: start === null ? '未开局' : formatDuration((end - start) / 60_000) },
    ...(data.rounds > 0 ? [{ label: '回合', value: `${data.rounds}轮` }] : []),
    { label: '行动', value: `${data.actions.total}次` },
    { label: '检定', value: `${data.rolls.all.total}次` },
  ];
  const cell = INNER / facts.length;
  facts.forEach((f, i) => {
    const cx = PAD + cell * i + cell / 2;
    if (i > 0) pen.rect(PAD + cell * i, y + 26, 1, 92, C.ruleStrong);
    pen.font('ui', 22, 500);
    pen.spaced(f.label, cx - pen.spacedWidth(f.label, 6) / 2, y + 44, C.muted, 6);
    drawAmount(pen, f.value, cx, y + 96, C.ink);
  });
  y += 142 + space(0);

  // ---- 结局（勾了才放）：上下两道朱红的双线 ----
  if (input.showEnding && data.ending) {
    y += 8;
    const top = y;
    const double = (at: number) => {
      pen.rect(PAD, at, INNER, 2, C.seal);
      pen.rect(PAD, at + 6, INNER, 2, C.seal);
    };
    double(top);
    pen.font('ui', 24, 700);
    const lw = pen.spaced('结局', PAD, y + 50, C.seal, 8);
    pen.font('story', 44, 700);
    const titleLinesEnd = wrapText((s) => pen.width(s), data.ending.title, INNER - lw - 32, 1);
    pen.text(titleLinesEnd[0], PAD + lw + 28, y + 50, C.ink);
    y += 84;
    pen.font('story', 28);
    const summary = wrapText((s) => pen.width(s), firstSentence(data.ending.epilogue), INNER, 2);
    summary.forEach((line, i) => pen.text(line, PAD, y + 20 + 46 * i, C.inkSoft));
    y += 46 * summary.length + 18;
    double(y);
    y += 8 + space(40);
  }

  // ---- 登场角色：两栏，角色名、身份和玩家 ----
  y = sectionHead(pen, y, '登场角色', `${data.characters.length} 人`);
  const colWidth = (INNER - 48) / 2;
  data.characters.forEach((c, i) => {
    const x = PAD + (i % 2) * (colWidth + 48);
    const top = y + Math.floor(i / 2) * 102;
    pen.font('story', 36, 700);
    const tags = (c.mine ? 1 : 0) + (c.dead ? 1 : 0);
    const name = wrapText((s) => pen.width(s), c.name, colWidth - tags * 76, 1)[0];
    pen.text(name, x, top + 24, c.dead ? C.muted : C.ink);
    let tx = x + pen.width(name) + 14;
    const tag = (label: string, color: string) => {
      pen.font('ui', 20, 700);
      const w = pen.width(label) + 18;
      pen.round(tx, top + 9, w, 30, 5, null, color, 2);
      pen.text(label, tx + w / 2, top + 25, color, 'center');
      tx += w + 8;
    };
    if (c.mine) tag('我', C.goldDeep);
    if (c.dead) tag('已死亡', C.seal);
    pen.font('ui', 23);
    pen.text(wrapText((s) => pen.width(s), `${c.roleName} · ${c.playerName}`, colWidth, 1)[0], x, top + 68, C.muted);
  });
  if (!data.characters.length) {
    pen.font('ui', 24);
    pen.text('还没有角色', PAD, y + 24, C.muted);
  }
  y += Math.max(1, Math.ceil(data.characters.length / 2)) * 102 + space(24);

  // ---- 掷骰：五种结果各几次；有角色的人多一行「我」 ----
  const all: RollTally = data.rolls.all;
  y = sectionHead(pen, y, '掷骰', data.rolls.mine ? `我掷了 ${data.rolls.mine.total} 次` : undefined);
  const gap = 14;
  const box = (INNER - gap * 4) / 5;
  const boxHeight = data.rolls.mine ? 160 : 128;
  OUTCOMES.forEach((o, i) => {
    const x = PAD + i * (box + gap);
    pen.round(x, y, box, boxHeight, 8, o.solid ? o.color : null, o.solid ? null : o.color, 2);
    const fg = o.solid ? C.sealInk : o.color;
    pen.font('story', 58, 700);
    pen.text(String(all.counts[o.key]), x + box / 2, y + 50, fg, 'center');
    pen.font('ui', 21, 700);
    pen.text(OUTCOME_LABEL[o.key], x + box / 2, y + 102, fg, 'center');
    if (data.rolls.mine) {
      pen.rect(x + 18, y + 124, box - 36, 1, o.solid ? 'rgba(248, 238, 233, 0.5)' : C.rule);
      pen.font('ui', 20, 500);
      pen.text(`我 ${data.rolls.mine.counts[o.key]}`, x + box / 2, y + 143, fg, 'center');
    }
  });
  y += boxHeight + space(44);

  // ---- 名场面：左边一道金线，宋体；署名是游戏时间和谁 ----
  if (input.highlights.length) {
    y = sectionHead(pen, y, '名场面');
    for (const h of input.highlights) {
      const top = y;
      pen.font('ui', 22, 500);
      pen.text(wrapText((s) => pen.width(s), byline(h), INNER - 28, 1)[0], PAD + 28, y + 16, C.goldDeep);
      y += 40;
      pen.font('story', 30);
      const body = h.type === 'say' ? `「${oneParagraph(h.text)}」` : oneParagraph(h.text);
      const lines = wrapText((s) => pen.width(s), body, INNER - 28, quoteLines);
      lines.forEach((line, i) => pen.text(line, PAD + 28, y + 24 + 50 * i, C.ink));
      y += 50 * lines.length;
      pen.rect(PAD, top + 2, 5, y - top - 4, C.gold);
      y += 30;
    }
    y += space(14);
  }

  // ---- 页脚：右下角是标志、站名和日期 ----
  const footer = 132;
  const footTop = paintHeight === null ? y : Math.max(y, H - footer - 30);
  if (pen.paint) {
    const logoSize = 112;
    const lx = PAD + INNER - logoSize;
    const ly = footTop + 4;
    if (input.logo) pen.ctx.drawImage(input.logo, lx, ly, logoSize, logoSize);
    const tx = input.logo ? lx - 18 : PAD + INNER;
    pen.font('story', 36, 700);
    pen.text('龙娘跑团', tx, ly + logoSize / 2 - 18, C.ink, 'right');
    pen.font('ui', 22);
    const d = new Date(input.today);
    pen.text(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`, tx, ly + logoSize / 2 + 24, C.muted, 'right');
    pen.rect(PAD, ly + logoSize / 2, Math.max(0, tx - PAD - 260), 1, C.ruleStrong);
  }
  return { height: footTop + footer + 30, gaps };
}

/**
 * 在这张 canvas 上画战报（会改它的大小：宽 1080，高按内容 1440～1920）。
 * 放不下时名场面少放几行（每条最少两行；还放不下就让图再长一点）；内容少时块和块之间空得多一点。
 */
export function drawReportCard(canvas: HTMLCanvasElement, input: CardInput) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const measure = new Pen(ctx, false, input.fonts);
  let quoteLines = 4;
  let m = layout(measure, input, quoteLines, null);
  while (m.height > MAX_HEIGHT && quoteLines > 2) {
    quoteLines--;
    m = layout(measure, input, quoteLines, null);
  }
  const spread = m.height < MIN_HEIGHT && m.gaps ? Math.min(56, (MIN_HEIGHT - m.height) / m.gaps) : 0;
  canvas.width = CARD_WIDTH;
  canvas.height = Math.max(MIN_HEIGHT, Math.ceil(m.height));
  layout(new Pen(ctx, true, input.fonts), input, quoteLines, canvas.height, spread);
}

/** 文件名：「龙娘跑团战报-对局名.png」（文件名里不能有的字换成下划线）。 */
export function reportFileName(roomName: string): string {
  const safe = [...roomName.replace(/[\\/:*?"<>|\s]+/g, '_')].slice(0, 40).join('') || '对局';
  return `龙娘跑团战报-${safe}.png`;
}

/** 把画好的 canvas 存成 PNG 下载。 */
export function saveCard(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片没生成出来'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      resolve();
    }, 'image/png');
  });
}
