import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { layoutPlaces, MAP_SIZE, type MapPlace, type Point } from '../../../shared/map';
import { isObj, text, type Obj } from './doc';
import { useOps } from './fields';

// 剧本编辑器「地点」分区上面的小地图（V1.0.x）：拖动地点（或者选中以后按方向键）摆它在地图上的位置。
// 没写位置的地点按路程远近自动摆；动了一个以后，所有地点都定在现在的位置上（别的不会跟着乱跑）。

/** 剧本里的地点，读成地图用的样子（没写对的出口、标识不管）。 */
function placesOf(doc: Obj): MapPlace[] {
  const list = Array.isArray(doc.locations) ? doc.locations.filter(isObj) : [];
  const seen = new Set<string>();
  const out: MapPlace[] = [];
  for (const l of list) {
    const key = typeof l.key === 'string' ? l.key : '';
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const exits = (Array.isArray(l.exits) ? l.exits.filter(isObj) : [])
      .filter((e) => typeof e.to === 'string' && e.to)
      .map((e) => ({ to: e.to as string, minutes: typeof e.minutes === 'number' && e.minutes > 0 ? e.minutes : 1, ...(e.hidden === true ? { hidden: true } : {}) }));
    const placed = typeof l.x === 'number' && typeof l.y === 'number';
    out.push({ key, name: text(l.name).trim() || key, exits, ...(placed ? { x: l.x as number, y: l.y as number } : {}) });
  }
  return out;
}

const round1 = (v: number) => Math.round(Math.min(MAP_SIZE, Math.max(0, v)) * 10) / 10;

export function MapEditor({ doc }: { doc: Obj }) {
  const ops = useOps();
  const places = useMemo(() => placesOf(doc), [doc]);
  // 只有地点、出口、位置变了才重新摆（改描述、改别的分区不用）
  const signature = JSON.stringify(places);
  const pos = useMemo(() => layoutPlaces(JSON.parse(signature) as MapPlace[]), [signature]);
  const anyPlaced = places.some((p) => p.x !== undefined);
  // 量宽度的框：一开始地点不到两个时还没画出来，等它出现了再量（回调 ref）
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<{ key: string; at: Point; moved: boolean } | null>(null);
  useEffect(() => {
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(box);
    return () => observer.disconnect();
  }, [box]);

  /** 把一个地点挪到 at：所有地点都定在现在的位置上，这一个换成新的。 */
  function commit(key: string, at: Point) {
    ops.replace((d) => {
      const current = layoutPlaces(placesOf(d));
      const list = Array.isArray(d.locations) ? d.locations : [];
      return {
        ...d,
        locations: list.map((l) => {
          if (!isObj(l) || typeof l.key !== 'string' || !current[l.key]) return l;
          const p = l.key === key ? at : current[l.key];
          return { ...l, x: round1(p.x), y: round1(p.y) };
        }),
      };
    });
  }

  function clearAll() {
    ops.replace((d) => ({
      ...d,
      locations: (Array.isArray(d.locations) ? d.locations : []).map((l) => {
        if (!isObj(l)) return l;
        const { x: _x, y: _y, ...rest } = l;
        return rest;
      }),
    }));
  }

  if (places.length < 2) return null;
  const size = Math.min(width, 460);
  const pad = 26;
  const scale = (size - pad * 2) / MAP_SIZE;
  const toPx = (p: Point) => ({ x: pad + p.x * scale, y: pad + p.y * scale });
  const fromEvent = (e: PointerEvent): Point => {
    const rect = svg.current!.getBoundingClientRect();
    return { x: round1((e.clientX - rect.left - pad) / scale), y: round1((e.clientY - rect.top - pad) / scale) };
  };
  const at = (key: string) => (drag?.key === key ? drag.at : pos[key]);

  function onKey(e: KeyboardEvent<SVGGElement>, key: string) {
    const step = e.shiftKey ? 5 : 1;
    const delta: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    commit(key, { x: round1(pos[key].x + d[0]), y: round1(pos[key].y + d[1]) });
  }

  const drawn = new Set<string>();
  return (
    <div className="ed-map">
      <div ref={setBox} className="ed-map-box">
        {size > 0 && (
          <svg ref={svg} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="group" aria-label="地点在地图上的位置">
            <rect className="ed-map-paper" x={pad / 2} y={pad / 2} width={size - pad} height={size - pad} rx="4" />
            {places.flatMap((p) =>
              p.exits.map((e) => {
                const k = [p.key, e.to].sort().join('|');
                if (drawn.has(k) || !pos[e.to]) return null;
                drawn.add(k);
                // 两头的出口里有一个是暗门，就画成暗道
                const back = places.find((q) => q.key === e.to)?.exits.find((x) => x.to === p.key);
                const secret = !!e.hidden || !!back?.hidden;
                const a = toPx(at(p.key));
                const b = toPx(at(e.to));
                return <line key={k} className={secret ? 'ed-map-edge is-secret' : 'ed-map-edge'} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
              }),
            )}
            {places.map((p) => {
              const q = toPx(at(p.key));
              return (
                <g
                  key={p.key}
                  className={drag?.key === p.key ? 'ed-map-node is-dragging' : 'ed-map-node'}
                  transform={`translate(${q.x} ${q.y})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.name}：拖动或者用方向键挪位置`}
                  onKeyDown={(e) => onKey(e, p.key)}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDrag({ key: p.key, at: pos[p.key], moved: false });
                  }}
                  onPointerMove={(e) => {
                    if (drag?.key !== p.key) return;
                    const next = fromEvent(e);
                    if (drag.moved || Math.hypot(next.x - drag.at.x, next.y - drag.at.y) > 0.8) setDrag({ key: p.key, at: next, moved: true });
                  }}
                  onPointerUp={() => {
                    if (drag?.key === p.key && drag.moved) commit(p.key, drag.at);
                    setDrag(null);
                  }}
                  onPointerCancel={() => setDrag(null)}
                >
                  <circle className="ed-map-hit" r="14" />
                  <circle className="ed-map-dot" r="5.5" />
                  <text className="ed-map-label" y="19" textAnchor="middle">
                    {p.name}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
      {anyPlaced && (
        <button type="button" className="btn btn-small btn-quiet" onClick={clearAll}>
          按路程自动摆
        </button>
      )}
    </div>
  );
}
