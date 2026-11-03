// 写提示词用的小工具（prompts.ts、prompts5e.ts 共用）。
import type { Scenario } from './scenario';
import type { Character } from './world';
import { flagText, SPOT_FLAG_LABEL, SPOT_FLAGS, spotFlags } from '../../shared/spots';

export const sign = (n: number) => (n > 0 ? `+${n}` : String(n));

export function placeName(scenario: Scenario, key: string | null | undefined): string {
  if (!key) return '（不在任何地点）';
  const loc = scenario.locations.find((l) => l.key === key);
  return loc ? `${loc.name}（${key}）` : key;
}

/** 角色在哪个地点、站在哪（V1.0.x 站位）：「大堂（lobby）·壁炉边（嘈杂）」；没特别站在哪只写地点。 */
export function placeAndSpot(scenario: Scenario, c: Pick<Character, 'location' | 'spot'>): string {
  const place = placeName(scenario, c.location);
  if (!c.location || !c.spot) return place;
  const flags = flagText(spotFlags(scenario.locations.find((l) => l.key === c.location), c.spot));
  return `${place}·${c.spot}${flags ? `（${flags}）` : ''}`;
}

/** 一个地点写好的站位和属性：「柜台（嘈杂）、壁炉边、楼梯口（昏暗）；整个地方嘈杂」。 */
export function spotsLine(scenario: Scenario, key: string | null | undefined): string {
  const loc = scenario.locations.find((l) => l.key === key);
  if (!loc) return '';
  const spots = (loc.spots ?? []).map((sp) => {
    const own = SPOT_FLAGS.filter((f) => sp[f]).map((f) => SPOT_FLAG_LABEL[f]);
    return `${sp.name}${own.length ? `（${own.join('、')}）` : ''}`;
  });
  const whole = [loc.noisy && '嘈杂', loc.dark && '昏暗'].filter(Boolean).join('、');
  return [spots.join('、'), whole ? `整个地方${whole}` : ''].filter(Boolean).join('；');
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
