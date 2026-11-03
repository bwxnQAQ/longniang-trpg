import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { edgeMinutes, hurried, pathKey, routesOnView, travelText, type MapNode, type MapView, type Route } from '../../../shared/map';
import { Modal } from '../components/Modal';

// 地图页签（V1.0.x）：自己走过的那一部分地图。实心的点是去过的地方，空心的是看得到、还没去过的，红的是自己在的地方；
// 点一个地点看它的情况和从这里过去的路，「写成行动」把「前往「某地」」填进行动的输入框（不会自动交）。

type Props = {
  view: MapView;
  /** 去过的地点的介绍（自己的角色卡里有的）。 */
  descriptions?: Record<string, string>;
  /** 能写成行动：有角色、活着、对局进行中、没有在等结果的行动。 */
  canAct?: boolean;
  /** 把行动填进输入框；看全图的管理员、观看的人没有。 */
  onWrite?: (text: string) => void;
};

export function MapPanel({ view, descriptions = {}, canAct = false, onWrite }: Props) {
  const here = view.nodes.find((n) => n.here)?.key ?? null;
  const [picked, setPicked] = useState<string | null>(null);
  const [big, setBig] = useState(false);
  // 没点过的时候选中自己在的地方（看整张地图的管理员、观看的人没有，就什么都不选）
  const selected = picked && view.nodes.some((n) => n.key === picked) ? picked : here;
  const routes = useMemo(() => (here ? routesOnView(view, here) : new Map<string, Route>()), [view, here]);
  const node = view.nodes.find((n) => n.key === selected) ?? null;
  const write = onWrite
    ? (text: string) => {
        setBig(false);
        onWrite(text);
      }
    : undefined;

  if (!view.nodes.length) return <p className="placeholder">地图上还什么都没有。</p>;
  const card = node && <PlaceCard node={node} route={routes.get(node.key) ?? null} hasHere={!!here} view={view} description={descriptions[node.key]} canAct={canAct} onWrite={write} />;

  return (
    <div className="map-panel">
      <MapCanvas view={view} selected={selected} route={selected ? (routes.get(selected) ?? null) : null} onSelect={setPicked} size="small" />
      <div className="map-zoom">
        <button type="button" className="btn btn-small btn-quiet" onClick={() => setBig(true)}>
          放大地图
        </button>
      </div>
      {card}
      {big && (
        <Modal open onClose={() => setBig(false)} title={view.full ? '整张地图' : '地图'} wide>
          <div className="map-big">
            <MapCanvas view={view} selected={selected} route={selected ? (routes.get(selected) ?? null) : null} onSelect={setPicked} size="large" />
            {card}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------- 画地图 ----------

type Placed = { node: MapNode; x: number; y: number };
type Label = { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' };
type Box = { x1: number; y1: number; x2: number; y2: number };

/** 路上写的分钟数，写短一点：「8分钟」「1小时20分」「1天3小时」。 */
function shortTravel(minutes: number): string {
  return travelText(minutes).replace(/ /g, '').replace(/小时(\d+)分钟$/, '小时$1分');
}

/** 估一行字有多宽：中文一个字一个字号，英文数字大约六成。 */
function textWidth(text: string, size: number): number {
  let w = 0;
  for (const ch of text) w += /[\u0000-ÿ]/.test(ch) ? size * 0.6 : size;
  return w;
}

function overlap(a: Box, b: Box): number {
  const w = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
  const h = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
  return w > 0 && h > 0 ? w * h : 0;
}

/** 给每个地点的名字找个位置：下、上、右、左里和别的名字、点挤得最少的那个。 */
function placeLabels(points: Placed[], size: number, r: number, width: number, height: number): { labels: Map<string, Label>; taken: Box[] } {
  const discs: Box[] = points.map((p) => ({ x1: p.x - r - 3, y1: p.y - r - 3, x2: p.x + r + 3, y2: p.y + r + 3 }));
  const taken: Box[] = [];
  const out = new Map<string, Label>();
  const order = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
  for (const p of order) {
    const w = textWidth(p.node.name, size);
    const gap = r + 4;
    const options: (Label & { box: Box })[] = [
      { dx: 0, dy: gap + size * 0.85, anchor: 'middle', box: { x1: p.x - w / 2, y1: p.y + gap, x2: p.x + w / 2, y2: p.y + gap + size } },
      { dx: 0, dy: -gap - size * 0.2, anchor: 'middle', box: { x1: p.x - w / 2, y1: p.y - gap - size, x2: p.x + w / 2, y2: p.y - gap } },
      { dx: gap + 1, dy: size * 0.35, anchor: 'start', box: { x1: p.x + gap + 1, y1: p.y - size / 2, x2: p.x + gap + 1 + w, y2: p.y + size / 2 } },
      { dx: -gap - 1, dy: size * 0.35, anchor: 'end', box: { x1: p.x - gap - 1 - w, y1: p.y - size / 2, x2: p.x - gap - 1, y2: p.y + size / 2 } },
    ];
    let best = options[0];
    let bestScore = Infinity;
    for (const o of options) {
      let score = 0;
      for (const t of taken) score += overlap(o.box, t);
      for (const [i, d] of discs.entries()) if (points[i] !== p) score += overlap(o.box, d) * 2;
      // 出了画布的边也算挤
      score += Math.max(0, -o.box.x1) * size + Math.max(0, o.box.x2 - width) * size + Math.max(0, -o.box.y1) * size + Math.max(0, o.box.y2 - height) * size;
      if (score < bestScore - 0.01) {
        best = o;
        bestScore = score;
      }
    }
    taken.push(best.box);
    out.set(p.node.key, { dx: best.dx, dy: best.dy, anchor: best.anchor });
  }
  // 地点的名字、点占的地方：路上写分钟数时躲开
  return { labels: out, taken: [...taken, ...discs] };
}

/** 路上写的分钟数放在哪：路的正中、靠两头一点的地方，挑一个不压着地点名字的；都压着就不写（走过去要多久看下面的卡片）。 */
function minutesSpot(a: Placed, b: Placed, text: string, taken: Box[]): { x: number; y: number } | null {
  const w = textWidth(text, MINUTES_FONT);
  for (const t of [0.5, 0.36, 0.64]) {
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const box = { x1: x - w / 2 - 1, y1: y - MINUTES_FONT / 2 - 1, x2: x + w / 2 + 1, y2: y + MINUTES_FONT / 2 + 1 };
    if (taken.every((other) => overlap(box, other) === 0)) return { x, y };
  }
  return null;
}

/** 路上分钟数的字号（和 map.css 的 .map-minutes 一样）。 */
const MINUTES_FONT = 10.5;

function MapCanvas({
  view,
  selected,
  route,
  onSelect,
  size,
}: {
  view: MapView;
  selected: string | null;
  route: Route | null;
  onSelect: (key: string) => void;
  size: 'small' | 'large';
}) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const gridId = useId();
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const font = size === 'large' ? 13 : 12;
  const r = size === 'large' ? 6 : 5;
  const layout = useMemo(() => {
    if (!width) return null;
    const pad = font * 2.6;
    const { minX, minY, maxX, maxY } = view.bounds;
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    const maxHeight = size === 'large' ? Math.max(320, Math.round(window.innerHeight * 0.62)) : Math.round(width * 1.25);
    const scale = Math.min((width - pad * 2) / spanX, (maxHeight - pad * 2) / spanY);
    const height = Math.max(Math.round(spanY * scale + pad * 2), 140);
    const offX = (width - spanX * scale) / 2;
    const offY = (height - spanY * scale) / 2;
    const points: Placed[] = view.nodes.map((node) => ({ node, x: offX + (node.x - minX) * scale, y: offY + (node.y - minY) * scale }));
    return { height, points, ...placeLabels(points, font, r, width, height) };
  }, [view, width, font, r, size]);

  const at = new Map(layout?.points.map((p) => [p.node.key, p]) ?? []);
  // 走过去的路：每一段从哪头走（分钟数照那个方向写）
  const routeFrom = new Map<string, string>();
  if (route) for (let i = 0; i + 1 < route.path.length; i++) routeFrom.set(pathKey(route.path[i], route.path[i + 1]), route.path[i]);
  const focus = selected ?? view.nodes.find((n) => n.here)?.key ?? null;

  function onKey(e: KeyboardEvent<SVGGElement>, key: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(key);
    }
  }

  return (
    <div ref={box} className={size === 'large' ? 'map-canvas map-canvas-large' : 'map-canvas'}>
      {layout && (
        <svg width={width} height={layout.height} viewBox={`0 0 ${width} ${layout.height}`} role="group" aria-label={view.full ? '整张地图' : '地图'}>
          <defs>
            <pattern id={gridId} width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.9" className="map-grid-dot" />
            </pattern>
          </defs>
          <rect width={width} height={layout.height} fill={`url(#${gridId})`} />
          {view.edges.map((e) => {
            const a = at.get(e.a);
            const b = at.get(e.b);
            if (!a || !b) return null;
            const faint = !a.node.visited || !b.node.visited;
            const cls = ['map-edge', faint && 'is-faint', e.hidden && 'is-secret'].filter(Boolean).join(' ');
            return <line key={`${e.a}|${e.b}`} className={cls} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
          {route &&
            view.edges
              .filter((e) => routeFrom.has(pathKey(e.a, e.b)))
              .map((e) => {
                const a = at.get(e.a)!;
                const b = at.get(e.b)!;
                return <line key={`route-${e.a}|${e.b}`} className="map-edge is-route" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
              })}
          {/* 选中的地点连出去的路、走过去的那条路上写着几分钟 */}
          {view.edges
            .filter((e) => e.a === focus || e.b === focus || routeFrom.has(pathKey(e.a, e.b)))
            .map((e) => {
              const a = at.get(e.a);
              const b = at.get(e.b);
              if (!a || !b) return null;
              // 路上的照走的方向，别的照从选中的地点出去的方向（只能往回走的路写回来的分钟）
              const from = routeFrom.get(pathKey(e.a, e.b)) ?? (focus === e.b ? e.b : e.a);
              const text = shortTravel(edgeMinutes(e, from) ?? edgeMinutes(e, from === e.a ? e.b : e.a) ?? 0);
              const spot = minutesSpot(a, b, text, layout.taken);
              if (!spot) return null;
              return (
                <text key={`m-${e.a}|${e.b}`} className="map-minutes" x={spot.x} y={spot.y + 3.5} textAnchor="middle">
                  {text}
                </text>
              );
            })}
          {layout.points.map(({ node, x, y }) => {
            const label = layout.labels.get(node.key)!;
            const cls = ['map-node', node.visited ? 'is-visited' : 'is-known', node.here && 'is-here', node.key === selected && 'is-selected'].filter(Boolean).join(' ');
            const who = [...node.people, ...(node.npcs ?? [])];
            return (
              <g
                key={node.key}
                className={cls}
                transform={`translate(${x} ${y})`}
                role="button"
                tabIndex={0}
                aria-pressed={node.key === selected}
                aria-label={`${node.name}${node.here ? '，你在这里' : node.visited ? '，去过' : '，没去过'}${who.length ? `，这里有${who.join('、')}` : ''}`}
                onClick={() => onSelect(node.key)}
                onKeyDown={(e) => onKey(e, node.key)}
              >
                <circle className="map-hit" r={r + 9} />
                {node.key === selected && !node.here && <circle className="map-select" r={r + 5} />}
                {node.here && <circle className="map-here-ring" r={r + 4} />}
                <circle className="map-dot" r={node.here ? r + 1 : r} />
                {node.clues.length > 0 && <rect className="map-clue" x={-r - 6} y={-r - 6} width="5" height="5" transform={`rotate(45 ${-r - 3.5} ${-r - 3.5})`} />}
                {who.slice(0, 3).map((name, i) => (
                  <circle key={`${name}-${i}`} className={i < node.people.length ? 'map-person' : 'map-npc'} cx={r + 4 + i * 6} cy={-r - 3} r="2.6" />
                ))}
                <text className="map-label" x={label.dx} y={label.dy} textAnchor={label.anchor}>
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

// ---------- 地点卡片 ----------

function PlaceCard({
  node,
  route,
  hasHere,
  view,
  description,
  canAct,
  onWrite,
}: {
  node: MapNode;
  route: Route | null;
  hasHere: boolean;
  view: MapView;
  description?: string;
  canAct: boolean;
  onWrite?: (text: string) => void;
}) {
  const nameOf = (key: string) => view.nodes.find((n) => n.key === key)?.name ?? key;
  const fast = route ? route.steps.reduce((sum, m) => sum + hurried(m), 0) : 0;
  return (
    <section className="map-card" aria-live="polite">
      <div className="map-card-head">
        <h3 className="map-card-title">{node.name}</h3>
        {node.here ? <span className="tag tag-here">你在这里</span> : <span className="tag">{node.visited ? '去过' : '没去过'}</span>}
      </div>
      {description && <p className="map-card-desc">{description}</p>}
      {!node.here && hasHere && (
        <p className="map-route">
          {route ? (
            <>
              走过去 {travelText(route.minutes)}，赶路 {travelText(fast)}
              {route.path.length > 2 && <span className="muted">（经过{route.path.slice(1, -1).map(nameOf).join('、')}）</span>}
            </>
          ) : (
            <span className="muted">从你知道的路走不到这里</span>
          )}
        </p>
      )}
      {node.people.length > 0 && <p className="map-card-line">这里有：{node.people.join('、')}</p>}
      {node.npcs && node.npcs.length > 0 && <p className="map-card-line">NPC：{node.npcs.join('、')}</p>}
      {node.clues.length > 0 && <p className="map-card-line">在这里找到的线索：{node.clues.map((t) => `「${t}」`).join('')}</p>}
      {onWrite && !node.here && route && (
        <div className="map-card-actions">
          <button type="button" className="btn btn-small" disabled={!canAct} onClick={() => onWrite(`前往「${node.name}」`)}>
            写成行动
          </button>
        </div>
      )}
    </section>
  );
}
