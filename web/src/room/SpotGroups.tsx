import type { PlaceInfo } from '../api';
import { spotName, viewFlagText } from '../../../shared/spots';

// 战斗面板里的站位（V1.0.x）：谁和谁站在一起（近战只打得到同一个站位上的）。大家都在一起时不写。

type Who = { name: string; side: 'ally' | 'enemy'; spot: string | null; down: boolean };

export function SpotGroups({ people, place }: { people: Who[]; place: PlaceInfo | null }) {
  const up = people.filter((p) => !p.down);
  if (!up.some((p) => p.spot)) return null;
  const groups = new Map<string, Who[]>();
  for (const p of up) groups.set(p.spot ?? '', [...(groups.get(p.spot ?? '') ?? []), p]);
  return (
    <dl className="combat-spots" aria-label="站位">
      {[...groups].map(([key, list]) => {
        const flags = viewFlagText(place, key || null);
        return (
          <div key={key} className="combat-spot">
            <dt>
              {spotName(key || null)}
              {flags && <span className="muted">（{flags}）</span>}
            </dt>
            <dd>
              {list.map((p, i) => (
                <span key={`${p.name}-${i}`}>
                  {i > 0 && '、'}
                  <span className={p.side === 'enemy' ? 'is-enemy' : undefined}>{p.name}</span>
                </span>
              ))}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
