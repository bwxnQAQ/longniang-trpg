import { useEffect, useState } from 'react';

// 骰子：两颗 d6。V0.6.0：骰子皮肤（按掷骰的人用的皮肤换颜色）；刚掷出来的骰子先滚一下再停
// （系统设置了减少动画的就不滚）。

// 骰子的点：在 0～10 的格子里的位置
const PIPS: Record<number, [number, number][]> = {
  1: [[5, 5]],
  2: [
    [2.6, 2.6],
    [7.4, 7.4],
  ],
  3: [
    [2.6, 2.6],
    [5, 5],
    [7.4, 7.4],
  ],
  4: [
    [2.6, 2.6],
    [7.4, 2.6],
    [2.6, 7.4],
    [7.4, 7.4],
  ],
  5: [
    [2.6, 2.6],
    [7.4, 2.6],
    [5, 5],
    [2.6, 7.4],
    [7.4, 7.4],
  ],
  6: [
    [2.6, 2.4],
    [7.4, 2.4],
    [2.6, 5],
    [7.4, 5],
    [2.6, 7.6],
    [7.4, 7.6],
  ],
};

function Die({ value }: { value: number }) {
  return (
    <svg className={value === 6 || value === 1 ? `die die-${value}` : 'die'} viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <rect x="0.6" y="0.6" width="8.8" height="8.8" rx="2" />
      {(PIPS[value] ?? []).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={value === 1 ? 1.25 : 0.95} />
      ))}
    </svg>
  );
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** 滚多久（毫秒）。 */
const ROLL_MS = 700;

/**
 * 两颗骰子。skin 是骰子皮肤的 key（dice-jade……，普通的是 null）；rolling：刚掷出来，先滚一下。
 */
export function Dice({ dice, skin = null, rolling = false }: { dice: [number, number]; skin?: string | null; rolling?: boolean }) {
  const [faces, setFaces] = useState<[number, number] | null>(() => (rolling && !reducedMotion() ? randomFaces() : null));
  useEffect(() => {
    if (!faces) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started >= ROLL_MS) {
        window.clearInterval(timer);
        setFaces(null);
      } else {
        setFaces(randomFaces());
      }
    }, 80);
    return () => window.clearInterval(timer);
    // 只在出现的时候滚一次
  }, []);
  const shown = faces ?? dice;
  const skinClass = skin ? ` skin-${skin.replace(/^dice-/, '')}` : '';
  return (
    <span className={`dice${skinClass}${faces ? ' is-rolling' : ''}`} role="img" aria-label={`骰子 ${dice[0]} 和 ${dice[1]}`}>
      <Die value={shown[0]} />
      <Die value={shown[1]} />
    </span>
  );
}

function randomFaces(): [number, number] {
  return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
}

/** 5E 的 d20（V0.9.0）：一个六边形里写着点数。20 是金色，1 是朱红。 */
function D20Face({ value, dropped = false }: { value: number; dropped?: boolean }) {
  const tone = value === 20 ? ' die-20' : value === 1 ? ' die-1' : '';
  return (
    <svg className={`d20${tone}${dropped ? ' is-dropped' : ''}`} viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <polygon className="d20-body" points="5,0.5 9.2,2.9 9.2,7.1 5,9.5 0.8,7.1 0.8,2.9" />
      <polygon className="d20-facet" points="5,2.4 7.7,7 2.3,7" />
      <text x="5" y="5.55" textAnchor="middle" dominantBaseline="middle">
        {value}
      </text>
    </svg>
  );
}

/**
 * 5E 的 d20：一颗，或者优势、劣势时的两颗（没取的那颗淡一些）。kept 是留下的那颗的点数。
 * skin 是骰子皮肤；rolling：刚掷出来，先滚一下。
 */
export function D20Dice({ rolls, kept, skin = null, rolling = false }: { rolls: number[]; kept: number; skin?: string | null; rolling?: boolean }) {
  const [faces, setFaces] = useState<number[] | null>(() => (rolling && !reducedMotion() ? rolls.map(() => 1 + Math.floor(Math.random() * 20)) : null));
  useEffect(() => {
    if (!faces) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started >= ROLL_MS) {
        window.clearInterval(timer);
        setFaces(null);
      } else {
        setFaces(rolls.map(() => 1 + Math.floor(Math.random() * 20)));
      }
    }, 80);
    return () => window.clearInterval(timer);
    // 只在出现的时候滚一次
  }, []);
  const shown = faces ?? rolls;
  const keptIndex = rolls.indexOf(kept);
  const skinClass = skin ? ` skin-${skin.replace(/^dice-/, '')}` : '';
  return (
    <span className={`dice dice-d20${skinClass}${faces ? ' is-rolling' : ''}`} role="img" aria-label={rolls.length > 1 ? `d20 掷了 ${rolls.join(' 和 ')}，取 ${kept}` : `d20 掷出 ${kept}`}>
      {shown.map((v, i) => (
        <D20Face key={i} value={v} dropped={!faces && rolls.length > 1 && i !== keptIndex} />
      ))}
    </span>
  );
}
