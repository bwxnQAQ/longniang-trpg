import { layoutPlaces, routesOnView, travelText, visibleMap, type MapNode, type MapPlace, type MapView, type Point } from '../../shared/map';
import type { CompanionInfo } from './companions';
import type { Scenario } from './scenario';
import { exitsKnownTo, type Character, type World } from './world';

// 地图页签（V1.0.x）：每个人看得到的那一部分地图。

type CompanionLike = Pick<CompanionInfo, 'npcKey' | 'name'> & { role: Pick<CompanionInfo['role'], 'startLocation'> };

export type MapViewOptions = {
  /** 看地图的角色；没有角色的（管理员）要 full 才有地图。 */
  me: Character | null;
  /** 整张地图都看得到：对局结束了、不在这一局里玩的管理员。 */
  full: boolean;
  /** 标上 NPC 在哪（管理员）。 */
  npcs?: boolean;
  /** 交给 AI 演的身份（AI 队友）：在哪由 world.npcs 记着。 */
  companions?: readonly CompanionLike[];
  /** 自己知道的线索（key）：标在出自的地点上。 */
  clueKeys?: readonly string[];
};

/**
 * 自动摆的位置记下来：每次推送游戏状态都要算一遍地图，地点多、没写位置的剧本按路程摆一次要十几毫秒。
 * 按地点、出口、位置记（同一个剧本的各局共用），最多记这么多份。
 */
const LAYOUT_CACHE_MAX = 64;
const layoutCache = new Map<string, Record<string, Point>>();

export function cachedLayout(places: readonly MapPlace[]): Record<string, Point> {
  if (places.every((p) => p.x !== undefined && p.y !== undefined)) return layoutPlaces(places);
  const id = JSON.stringify(places.map((p) => [p.key, p.x ?? null, p.y ?? null, p.exits.map((e) => [e.to, e.minutes])]));
  const hit = layoutCache.get(id);
  if (hit) return hit;
  const pos = layoutPlaces(places);
  if (layoutCache.size >= LAYOUT_CACHE_MAX) layoutCache.delete(layoutCache.keys().next().value!);
  layoutCache.set(id, pos);
  return pos;
}

function push(map: Map<string, string[]>, key: string | null | undefined, name: string) {
  if (!key) return;
  const list = map.get(key);
  if (list) list.push(name);
  else map.set(key, [name]);
}

/**
 * 一个人看得到的地图。还没结束时：去过的地点（合作的剧本里算上队友去过的），从去过的地点看得见的出口通向的地点；
 * 暗道要发现了才画。地点上的人：和自己在一起的角色；合作的剧本里队友在哪都看得到（AI 队友也一样）。
 * full：整张地图、所有人在哪（暗道标出来）。地图的范围按整张地图算，越走越大时已经画出来的地方不挪位置。
 */
export function mapViewOf(scenario: Scenario, world: World, characters: readonly Character[], opts: MapViewOptions): MapView | null {
  const places = scenario.locations;
  const { me, full } = opts;
  if (!places.length || (!full && !me)) return null;
  const coop = scenario.relation === 'coop';
  const companions = opts.companions ?? [];
  const companionAt = (m: CompanionLike) => {
    const s = world.npcs[m.npcKey];
    return { at: s?.location !== undefined ? s.location : m.role.startLocation, dead: !!s?.dead };
  };

  // 去过的地点：自己的（合作的剧本里一队人的）；管理员看全图时是所有人的
  const team = me && !coop ? [me] : characters;
  const visited = new Set<string>();
  for (const c of team) {
    for (const k of c.visited) visited.add(k);
    if (c.location) visited.add(c.location);
  }
  if (coop || (!me && full)) {
    for (const m of companions) {
      const { at, dead } = companionAt(m);
      if (at && !dead) visited.add(at);
    }
  }
  const found = me ? exitsKnownTo(world, scenario, characters, me.id) : new Set<string>();
  const here = me?.location ?? null;
  const shown = visibleMap(places, { visited, found, here, full });

  // 谁在哪：和自己在一起的；合作的剧本、看全图时是所有人
  const seeAll = full || coop;
  const people = new Map<string, string[]>();
  for (const c of characters) {
    if (c.dead || c.id === me?.id || !c.location) continue;
    if (seeAll || c.location === here) push(people, c.location, c.name);
  }
  for (const m of companions) {
    const { at, dead } = companionAt(m);
    if (!dead && at && (seeAll || at === here)) push(people, at, m.name);
  }
  const npcs = new Map<string, string[]>();
  if (opts.npcs) {
    for (const n of scenario.npcs) {
      const s = world.npcs[n.key];
      push(npcs, s?.location !== undefined ? s.location : n.location, s?.dead ? `${n.name}（死了）` : n.name);
    }
  }
  const clues = new Map<string, string[]>();
  for (const key of opts.clueKeys ?? []) {
    const clue = scenario.clues.find((c) => c.key === key);
    if (clue) push(clues, clue.location, clue.title);
  }

  const pos = cachedLayout(places);
  const xs = places.map((p) => pos[p.key].x);
  const ys = places.map((p) => pos[p.key].y);
  const nodes: MapNode[] = places
    .filter((p) => shown.nodes.has(p.key))
    .map((p) => ({
      key: p.key,
      name: p.name,
      x: pos[p.key].x,
      y: pos[p.key].y,
      visited: visited.has(p.key),
      here: p.key === here,
      clues: clues.get(p.key) ?? [],
      people: people.get(p.key) ?? [],
      ...(opts.npcs ? { npcs: npcs.get(p.key) ?? [] } : {}),
    }));
  return {
    nodes,
    edges: shown.edges,
    bounds: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) },
    full,
  };
}

/**
 * 这个角色看得到的地图上，从他在的地方到各处的路程：「后厨 8 分钟（赶路 4 分钟）；账房 15 分钟（赶路 8 分钟，经过后厨）」。
 * 估时（只写分钟）和场外问答（也写经过哪里）用。只有他知道的地方和路：估时的说明、问答的回答玩家都看得到。
 */
export function knownRoutesText(view: MapView | null, from: string | null, opts: { path?: boolean } = {}): string {
  if (!view || !from) return '';
  const routes = routesOnView(view, from);
  const fast = routesOnView(view, from, true);
  const nameOf = (key: string) => view.nodes.find((n) => n.key === key)?.name ?? key;
  return view.nodes
    .filter((n) => n.key !== from && routes.has(n.key))
    .map((n) => {
      const r = routes.get(n.key)!;
      const hurry = fast.get(n.key);
      const via = opts.path && r.path.length > 2 ? `，经过${r.path.slice(1, -1).map(nameOf).join('、')}` : '';
      return `${n.name} ${travelText(r.minutes)}（赶路 ${travelText(hurry?.minutes ?? r.minutes)}${via}）`;
    })
    .join('；');
}
