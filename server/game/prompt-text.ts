// 写提示词用的小工具（prompts.ts、prompts5e.ts 共用）。
import type { Scenario } from './scenario';
import type { Character } from './world';

export const sign = (n: number) => (n > 0 ? `+${n}` : String(n));

export function placeName(scenario: Scenario, key: string | null | undefined): string {
  if (!key) return '（不在任何地点）';
  const loc = scenario.locations.find((l) => l.key === key);
  return loc ? `${loc.name}（${key}）` : key;
}

export function quote(text: string): string {
  return `「${text.replace(/[「」]/g, (m) => (m === '「' ? '『' : '』'))}」`;
}

export function clip(text: string, max: number): string {
  const chars = [...text];
  return chars.length > max ? chars.slice(0, max).join('') + '……' : text;
}

/**
 * 接替了 AI 队友、又换了名字的角色（V0.8.0 AI 补位）：之前的叙述、笔记里写的都是旧名字，说清楚那就是他。
 * 旧名字是 AI 队友的名字（房主起的，检查过；本来就写在给主持 AI 的剧本里）。
 */
export function formerNameLine(c: Character): string[] {
  if (!c.formerName) return [];
  const was = quote(c.formerName);
  return [`  之前叫${was}：这个身份原来是你顺带演的 AI 队友，现在换成玩家来演，改了名字；之前故事里的${was}就是他`];
}
