import type { DB } from '../db';
import { HttpError } from '../http';
import type { PersonaSnapshot } from '../personas';
import { rejectInvisibleName } from '../util';
import type { Companion } from '../../shared/game';
import type { Npc, Relation, Role, Scenario } from './scenario';
import { modOf } from './mod5e';
import { loadRoom, loadScenario, type StoredScenario, type World } from './world';

// AI 补位（V0.8.0）：剧本的身份比来的人多时，房主在准备阶段把没人选的身份「交给 AI 演」。
// 做法：主持 AI 顺带演这个身份，当作跟着大家的队友（跑团里说的 GMPC）。不建角色、不建账号——
// 角色表里每个角色都对应 players 里的一个真人，所以宠物成长、结局图鉴、成就、龙晶、作者分成这些自然只算真人；
// 也不额外调用 AI、不多花额度，回合也不用等他。
// 数据库里只记哪个身份交给了 AI、叫什么（ai_seats）。给主持 AI 用、结算用的那份剧本（loadPlayScenario）里，
// 这些身份从 roles 里拿掉，变成 npcs 里标着「AI 队友」的 NPC，update_npc 这些现成的工具就能记他的位置、伤和状态。
// 数据库里存的剧本不改：投稿、地下城、宠物、管理页用的都是存的那份。
//
// AI 角色（V1.1.0 AI 大厅）：交给 AI 演的身份可以请一个 AI 角色来演（ai_seats.persona 是请进来那一刻的样子）。
// 它照样是给主持 AI 的剧本里标着「AI 队友」的 NPC（位置、伤和状态照旧用 update_npc 记），只是不再由主持人替它拿主意：
// 每一轮它照自己的人设、只用自己的角色知道的事交行动（persona-act.ts），主持人和在场的人的行动一起结算（engine.ts 的 resolveOne）。

/** AI 队友的名字最多几个字（和角色名一样）。 */
export const AI_SEAT_NAME_MAX = 20;

/** 给主持 AI 的剧本里，AI 队友的 identity 以它开头（主持规则里认这个标记）。 */
export const COMPANION_MARK = 'AI 队友';

/** persona：请来演这个身份的 AI 角色（请进来那一刻的样子），没有是主持人顺带演；personaId 是 AI 大厅里的那个（删掉了是 null）。 */
export type AiSeat = { roleKey: string; name: string; personaId?: number | null; persona?: PersonaSnapshot | null };

/** 一个 AI 队友：身份、名字，和他在给主持 AI 的那份剧本里的 NPC key；请了 AI 角色来演的，带着它的人设（snapshot）。 */
export type CompanionInfo = Omit<Companion, 'persona'> & { npcKey: string; role: Role; personaId: number | null; snapshot: PersonaSnapshot | null };

/** 给主持 AI 用、结算用的剧本：存的那份加上 AI 队友。 */
export type PlayScenario = StoredScenario & { companions: CompanionInfo[] };

/** 这一局交给 AI 的身份（按标的先后；要按剧本里身份的顺序用 companionsOf）。 */
export function loadAiSeats(db: DB, roomId: number): AiSeat[] {
  const rows = db.prepare('SELECT role_key, name, persona_id, persona FROM ai_seats WHERE room_id = ? ORDER BY created_at, role_key').all(roomId) as {
    role_key: string;
    name: string;
    persona_id: number | null;
    persona: string | null;
  }[];
  return rows.map((r) => ({ roleKey: r.role_key, name: r.name, personaId: r.persona_id, persona: parseSnapshot(r.persona) }));
}

/** 存着的 AI 角色的样子；坏了的当成没有（这个身份就由主持人顺带演）。 */
function parseSnapshot(text: string | null): PersonaSnapshot | null {
  if (!text) return null;
  try {
    const v = JSON.parse(text) as Partial<PersonaSnapshot>;
    if (typeof v.name !== 'string' || typeof v.prompt !== 'string' || !v.prompt) return null;
    return { name: v.name, intro: typeof v.intro === 'string' ? v.intro : '', prompt: v.prompt, author: typeof v.author === 'string' ? v.author : '', authorId: Number(v.authorId) || 0 };
  } catch {
    return null;
  }
}

/**
 * 交给 AI 的身份，按剧本里身份的顺序，带上给主持 AI 用的 NPC key：「ai-身份的 key」，和剧本里的 NPC（或者前面的身份）重了就接 -2、-3……
 * key 按剧本里所有的身份排，不管别的身份交没交给 AI：有人接替了一个队友以后，别的队友的 key 不会变（world.npcs 里记的状态还对得上）。
 * 剧本里没有的身份、已经有人选了的身份（taken，包括被中途加入的玩家接替了的）不算。地下城没有 AI 队友。
 */
export function companionsOf(scenario: Scenario, seats: AiSeat[], taken: Iterable<string> = []): CompanionInfo[] {
  if (!seats.length || scenario.dungeon || scenario.rules === '5e') return [];
  const held = new Set(taken);
  const used = new Set(scenario.npcs.map((n) => n.key));
  const out: CompanionInfo[] = [];
  for (const role of scenario.roles) {
    let npcKey = `ai-${role.key}`;
    for (let n = 2; used.has(npcKey); n++) npcKey = `ai-${role.key}-${n}`;
    used.add(npcKey);
    const seat = seats.find((s) => s.roleKey === role.key);
    if (!seat || held.has(role.key)) continue;
    out.push({ roleKey: role.key, roleName: role.name, name: seat.name, npcKey, role, personaId: seat.personaId ?? null, snapshot: seat.persona ?? null });
  }
  return out;
}

/** 给主持 AI 的那份剧本：交给 AI 的身份从 roles 里拿掉，变成 npcs 里标着「AI 队友」的 NPC。不改传进来的剧本。 */
export function withCompanions(scenario: Scenario, companions: CompanionInfo[]): Scenario {
  if (!companions.length) return scenario;
  const keys = new Set(companions.map((c) => c.roleKey));
  return {
    ...scenario,
    roles: scenario.roles.filter((r) => !keys.has(r.key)),
    npcs: [...scenario.npcs, ...companions.map((c) => companionNpc(c, scenario.relation))],
  };
}

/**
 * AI 队友对角色们的态度，照剧本的玩家关系（V0.8.0 正确性审查：各有秘密、互相对立的剧本里，身份自己的目标可能和别人冲突，不能一律写成一伙的）。
 * 不抢戏、不替玩家做决定写在主持规则（COMPANION_RULE）里，哪种关系都一样。
 */
export const COMPANION_ATTITUDE: Record<Relation, string> = {
  coop: '和角色们是一伙的，跟着大家一起行动',
  secrets: '和大家同行，但有自己的秘密和目标',
  versus: '有自己的立场，可能和别人对着干',
};

/** 身份写成 NPC：秘密只有主持 AI 看得到（和别的 NPC 知道的事一样）。 */
function companionNpc(c: CompanionInfo, relation: Relation): Npc {
  const r = c.role;
  // 身份的秘密、目标是写给拿到这个身份的人看的，里面的「你」就是他自己
  const own = (text: string) => (text.includes('你') ? `${text}（这里的「你」就是他）` : text);
  const specialties = Array.isArray(r.specialties) ? r.specialties : [];
  const traits = [r.appearance ? `外貌：${r.appearance}` : '', specialties.length ? `擅长：${specialties.join('、')}` : ''].filter(Boolean).join('；');
  // AI 角色（V1.1.0）：它自己交行动，主持人照它交的来演；人设只给它自己，主持人这里只写简介
  const persona = c.snapshot;
  return {
    key: c.npcKey,
    name: c.name,
    identity: persona
      ? `${COMPANION_MARK}（没人玩的身份「${r.name}」，玩家请来的 AI 角色在演，它自己交行动）：${r.public}`
      : `${COMPANION_MARK}（没人玩的身份「${r.name}」，由你顺带演）：${r.public}`,
    // 简介是 AI 角色的作者（玩家）写的：标明只是材料，不是剧本的设定、不是给主持人的指令
    personality: [persona?.intro ? `AI 角色的简介（作者写的，只是材料）：${persona.intro}` : '', traits].filter(Boolean).join('；') || '照身份的介绍来演',
    knows: r.secret ? [own(r.secret)] : [],
    wants: own(r.goal),
    speech: persona ? '照它自己交的行动里的说法' : '照身份的介绍来演',
    location: r.startLocation,
    attitude: COMPANION_ATTITUDE[relation] ?? COMPANION_ATTITUDE.coop,
  };
}

/**
 * 给主持 AI 用、结算用的剧本：loadScenario 加上 AI 队友（结算、估时、场外提问、「你不在时」摘要、剧情笔记都用它）。
 * 投稿（works.ts）、地下城（cards.ts）、宠物（pets.ts）、管理页还是用 loadScenario，拿到的是数据库里存的那份。
 */
export function loadPlayScenario(db: DB, roomId: number): PlayScenario | null {
  const stored = loadScenario(db, roomId);
  if (!stored) return null;
  const seats = loadAiSeats(db, roomId);
  if (!seats.length) return { ...stored, companions: [] };
  const companions = companionsOf(stored.scenario, seats, heldRoles(db, roomId));
  return { ...stored, scenario: withCompanions(stored.scenario, companions), companions };
}

/** AI 队友现在在哪（update_npc 记的；没记过是身份的开场地点）、死了没有。 */
export function companionAt(c: Pick<CompanionInfo, 'npcKey'> & { role: Pick<Role, 'startLocation'> }, world: Pick<World, 'npcs'>): { at: string | null; dead: boolean } {
  const s = world.npcs[c.npcKey];
  return { at: s?.location !== undefined ? (s.location ?? null) : c.role.startLocation, dead: !!s?.dead };
}

/** 这个地点上还活着的、请了 AI 角色来演的 AI 队友（V1.1.0）。 */
export function personasAt(companions: CompanionInfo[], world: Pick<World, 'npcs'>, location: string | null): CompanionInfo[] {
  if (!location) return [];
  return companions.filter((c) => {
    if (!c.snapshot) return false;
    const { at, dead } = companionAt(c, world);
    return !dead && at === location;
  });
}

/** 这一局的 AI 队友（没有剧本、没有交给 AI 的身份是空的）。 */
export function roomCompanions(db: DB, roomId: number): CompanionInfo[] {
  return loadPlayScenario(db, roomId)?.companions ?? [];
}

function heldRoles(db: DB, roomId: number): string[] {
  return (db.prepare('SELECT role_key FROM characters WHERE room_id = ?').all(roomId) as { role_key: string }[]).map((r) => r.role_key);
}

/** 开局时写给大家看的一句：「记者」由 AI 来演：林小满。（没起名字的只写身份；请了 AI 角色的写「由 AI 角色「林小满」来演」） */
export function companionsStartText(companions: (Pick<Companion, 'roleName' | 'name'> & { snapshot?: PersonaSnapshot | null })[]): string {
  if (companions.length === 1) {
    const c = companions[0];
    if (c.snapshot) return `「${c.roleName}」由 AI 角色「${c.name}」来演。`;
    return c.name === c.roleName ? `「${c.roleName}」由 AI 来演。` : `「${c.roleName}」由 AI 来演：${c.name}。`;
  }
  const part = (c: (typeof companions)[number]) => (c.snapshot ? `「${c.roleName}」AI 角色${c.name}` : c.name === c.roleName ? `「${c.roleName}」` : `「${c.roleName}」${c.name}`);
  return `这几个身份由 AI 来演：${companions.map(part).join('、')}。`;
}

// ==================== 房主标「AI 演」 ====================

/** 能改哪些身份交给 AI 的时候：准备阶段、选好了剧本、不是地下城。 */
function seatContext(db: DB, roomId: number, adding: boolean) {
  const room = loadRoom(db, roomId);
  if (!room) throw new HttpError(404, '对局不存在');
  if (room.status !== 'preparing') throw new HttpError(409, '对局已经开始了，交给 AI 的身份不能再改');
  if (adding && db.prepare("SELECT 1 FROM scenario_jobs WHERE room_id = ? AND status = 'running'").get(roomId)) {
    throw new HttpError(409, 'AI 正在生成剧本，等生成完再定哪些身份交给 AI');
  }
  const stored = loadScenario(db, roomId);
  if (!stored) throw new HttpError(409, '先选一个剧本');
  if (adding && stored.scenario.dungeon) {
    throw new HttpError(409, '地下城的身份不能交给 AI：地下城里每个角色都是玩家带自己的角色卡进去，按规则第二版打怪、拿宝物');
  }
  if (adding && stored.scenario.rules === '5e') {
    throw new HttpError(
      409,
      // 用 5E 规则玩普通剧本（V1.0.0）：AI 队友只会龙娘规则
      modOf(stored.scenario)
        ? '用 5E 规则玩的时候身份不能交给 AI（AI 队友只会龙娘规则）：要 AI 补位，先换回剧本原来的规则'
        : '5E 模组的身份不能交给 AI：每个角色都是玩家带自己的 5E 角色卡进去，按 5E 规则打怪、施法',
    );
  }
  const characters = db.prepare('SELECT role_key, name FROM characters WHERE room_id = ?').all(roomId) as { role_key: string; name: string }[];
  return { scenario: stored.scenario, characters, seats: loadAiSeats(db, roomId) };
}

/** 请一个 AI 角色来演（V1.1.0）：大厅里的编号和请进来时的样子；null 是不请了（换回主持人顺带演），不写是照旧。 */
export type SeatPersona = { id: number; snapshot: PersonaSnapshot } | null | undefined;

/**
 * 把一个身份交给 AI 演（或者改名字、换 AI 角色）之前的检查（不写入）。名字不写：请了 AI 角色的用它的名字，不然用身份的名字。
 * needsCheck：起了新名字（不是身份的名字、原来的名字、AI 角色的名字），要先发给 AI 检查内容（它会写进给主持 AI 的提示词）。
 * AI 角色的名字、人设在 AI 大厅里检查过。
 */
export function checkAiSeat(db: DB, roomId: number, roleKey: string, rawName: unknown, persona?: SeatPersona) {
  const { scenario, characters, seats } = seatContext(db, roomId, true);
  const role = scenario.roles.find((r) => r.key === roleKey);
  if (!role) throw new HttpError(404, '剧本里没有这个身份');
  if (characters.some((c) => c.role_key === roleKey)) throw new HttpError(409, '这个身份已经有人选了，不能交给 AI');
  if (rawName !== undefined && rawName !== null && typeof rawName !== 'string') throw new HttpError(400, '请求格式不对');
  // 名字没写：换了 AI 角色用它的名字，换回主持人顺带演用身份的名字，别的照原来的；
  // 写了空的（清空了名字）：请着 AI 角色的用它的名字，不然用身份的名字
  const before = seats.find((s) => s.roleKey === roleKey);
  const given = typeof rawName === 'string' ? rawName.trim() : null;
  const personaName = persona ? persona.snapshot.name : persona === null ? null : (before?.persona?.name ?? null);
  const name = given || (given === '' || persona !== undefined ? (personaName ?? role.name) : (before?.name ?? role.name));
  if ([...name].length > AI_SEAT_NAME_MAX) throw new HttpError(400, `名字最多${AI_SEAT_NAME_MAX}个字`);
  // 名字会写进记录和给主持 AI 的提示词：换行、改文字方向的、零宽这些看不见的字符不要
  rejectInvisibleName(name);
  // 别的身份的名字不行（房主本来就看得到，用了分不清是哪个身份）；和剧本里的 NPC 重名不拦（拦了就等于告诉房主那是 NPC 的名字），
  // 给主持 AI 的剧本里队友的 key 是 ai- 开头的、identity 标着「AI 队友」，分得清
  if (scenario.roles.some((r) => r.key !== roleKey && r.name === name)) throw new HttpError(409, '这是剧本里别的身份的名字，换一个吧');
  if (characters.some((c) => c.name === name)) throw new HttpError(409, '这个名字已经有角色在用了，换一个吧');
  if (seats.some((s) => s.roleKey !== roleKey && s.name === name)) throw new HttpError(409, '这个名字已经给别的 AI 队友用了，换一个吧');
  const existing = seats.find((s) => s.roleKey === roleKey) ?? null;
  // 还没有人建角色时，至少留一个身份给玩家自己选（不然谁都选不了，也开不了局）
  const free = scenario.roles.filter((r) => r.key !== roleKey && !seats.some((s) => s.roleKey === r.key) && !characters.some((c) => c.role_key === r.key));
  if (!existing && !characters.length && !free.length) throw new HttpError(409, '至少留一个身份给玩家自己选');
  return { role, name, existing, needsCheck: name !== role.name && name !== existing?.name && name !== personaName };
}

/**
 * 写进去（先用 checkAiSeat 检查过）。persona 不写是照旧，null 是不请 AI 角色了（主持人顺带演），写了就换成它。
 * 返回 added 新交给 AI、renamed 改了名字或者换了 AI 角色、same 没变。
 */
export function saveAiSeat(db: DB, roomId: number, roleKey: string, name: string, now: number, persona?: SeatPersona): 'added' | 'renamed' | 'same' {
  const before = db.prepare('SELECT name, persona_id, persona FROM ai_seats WHERE room_id = ? AND role_key = ?').get(roomId, roleKey) as
    | { name: string; persona_id: number | null; persona: string | null }
    | undefined;
  const personaId = persona === undefined ? (before?.persona_id ?? null) : (persona?.id ?? null);
  const snapshot = persona === undefined ? (before?.persona ?? null) : persona ? JSON.stringify(persona.snapshot) : null;
  if (before && before.name === name && before.persona_id === personaId && before.persona === snapshot) return 'same';
  db.prepare(
    `INSERT INTO ai_seats (room_id, role_key, name, persona_id, persona, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (room_id, role_key) DO UPDATE SET name = excluded.name, persona_id = excluded.persona_id, persona = excluded.persona`,
  ).run(roomId, roleKey, name, personaId, snapshot, now);
  return before ? 'renamed' : 'added';
}

/** 房主取消：这个身份又可以选了。返回身份的名字（写记录用）。 */
export function removeAiSeat(db: DB, roomId: number, roleKey: string): { roleName: string; name: string } {
  const { scenario, seats } = seatContext(db, roomId, false);
  const seat = seats.find((s) => s.roleKey === roleKey);
  if (!seat) throw new HttpError(404, '这个身份没有交给 AI');
  db.prepare('DELETE FROM ai_seats WHERE room_id = ? AND role_key = ?').run(roomId, roleKey);
  return { roleName: scenario.roles.find((r) => r.key === roleKey)?.name ?? roleKey, name: seat.name };
}

/** 换剧本（选现成的、导入、AI 生成、转换）时清掉这一局交给 AI 的身份。返回清掉了几个。 */
export function clearAiSeats(db: DB, roomId: number): number {
  return Number(db.prepare('DELETE FROM ai_seats WHERE room_id = ?').run(roomId).changes);
}

/** 这个身份交给 AI 演了（选身份时检查）。 */
export function isAiSeat(db: DB, roomId: number, roleKey: string): boolean {
  return !!db.prepare('SELECT 1 FROM ai_seats WHERE room_id = ? AND role_key = ?').get(roomId, roleKey);
}

/** 这个名字已经给 AI 队友用了（起角色名时检查）。exceptRoleKey：正在接替的那个身份（接着用他的名字可以）。 */
export function aiSeatNamed(db: DB, roomId: number, name: string, exceptRoleKey = ''): boolean {
  return !!db.prepare('SELECT 1 FROM ai_seats WHERE room_id = ? AND name = ? AND role_key != ?').get(roomId, name, exceptRoleKey);
}

// ==================== 中途加入的玩家接替 AI 队友 ====================
// V0.8.0 正确性审查：空身份都交给 AI 并开局以后，再来的朋友能加入，却没有身份可选，房主也取消不了。
// 所以开局以后（进行中、暂停中），还没有角色的人可以接替 AI 演的身份：建角色的同一个事务里删掉 ai_seats 那一行，
// 之后 loadPlayScenario 不再把他合进剧本。world.npcs 里他原来的状态留着，但主持 AI 看不到（局面里只列剧本里有的 NPC）。
// 准备阶段照旧：房主取消以后才能选。

/**
 * 接替 AI 演的这个身份：返回这个队友，和接替的角色放在哪——队友现在的位置（update_npc 记的）；
 * 没记过、不在任何地点、或者已经死了的，放在身份的起点。不是交给 AI 的身份返回 null。
 */
export function takeoverOf(db: DB, roomId: number, roleKey: string, world: World): { companion: CompanionInfo; location: string } | null {
  const play = loadPlayScenario(db, roomId);
  const companion = play?.companions.find((c) => c.roleKey === roleKey);
  if (!play || !companion) return null;
  const s = world.npcs[companion.npcKey];
  const here = s && !s.dead && typeof s.location === 'string' && play.scenario.locations.some((l) => l.key === s.location) ? s.location : null;
  return { companion, location: here ?? companion.role.startLocation };
}

/** 接替：删掉这个身份交给 AI 的那一行（和建角色在同一个事务里）。返回删没删掉。 */
export function dropAiSeat(db: DB, roomId: number, roleKey: string): boolean {
  return Number(db.prepare('DELETE FROM ai_seats WHERE room_id = ? AND role_key = ?').run(roomId, roleKey).changes) > 0;
}

/**
 * 接替时换了名字：记下他之前在故事里叫什么。之前的叙述、剧情笔记里写的都是旧名字，
 * 主持 AI 每次结算时在角色那几行里看到「之前叫……」，才知道那就是他（prompts.ts 的 formerNameLine）。名字没变的不用记。
 */
export function rememberFormerName(db: DB, characterId: number, name: string) {
  db.prepare('UPDATE characters SET former_name = ? WHERE id = ?').run(name, characterId);
}

/** 接替时写给大家看的一句：小明 的角色「阿青」接替了 AI 演的「记者」（原来叫林小满）。名字没变的、原来就叫身份名字的，不写括号。 */
export function takeoverText(playerName: string, characterName: string, roleName: string, oldName: string): string {
  const was = oldName !== characterName && oldName !== roleName ? `（原来叫${oldName}）` : '';
  return `${playerName} 的角色「${characterName}」接替了 AI 演的「${roleName}」${was}`;
}

// ==================== 记录（大家看得到的系统记录） ====================

export type SeatChange = 'added' | 'renamed' | 'removed';

/**
 * 记录合并的时间（V0.8.0 安全审查：房主来回「交给 AI / 取消」会刷屏）：这一局最后一条记录正好是同一个人对同一个身份写的这类记录、
 * 而且是这么久以内写的，就撤掉它换成新的一条；刚交给 AI 又取消的，两条都不留。频率另外有限制（limits.ts 的 aiSeat）。
 */
export const SEAT_LOG_MERGE_MS = 10 * 60_000;

/**
 * 记录里的一句。by 是谁做的（房主、管理员、站长）。persona（V1.1.0）：现在请了 AI 角色来演是 true；
 * 刚把请来的 AI 角色换下、改成主持人顺带演是 dropped。renamed 包括换了 AI 角色、换回主持人顺带演。
 */
export function seatLogText(by: string, change: SeatChange, roleName: string, name: string, persona: boolean | 'dropped' = false): string {
  if (change === 'added') return persona === true ? `${by}请 AI 角色「${name}」来演「${roleName}」` : `${by}把「${roleName}」交给 AI 来演${name === roleName ? '' : `：${name}`}`;
  if (change === 'renamed') {
    if (persona === true) return `${by}改请 AI 角色「${name}」来演「${roleName}」`;
    if (persona === 'dropped') return `${by}改由主持人顺带演「${roleName}」${name === roleName ? '' : `：${name}`}`;
    return `${by}给 AI 来演的「${roleName}」改了名字：${name}`;
  }
  return `${by}不再让 AI 演「${roleName}」，这个身份可以选了`;
}

/** 一条记录是不是 by 对这个身份写的上面那几句之一（是哪一种）；不是返回 null。 */
export function seatLogChange(text: string, by: string, roleName: string): SeatChange | null {
  const added = `${by}把「${roleName}」交给 AI 来演`;
  const persona = (lead: string) => text.startsWith(`${by}${lead} AI 角色「`) && text.endsWith(`」来演「${roleName}」`);
  if (text === added || text.startsWith(`${added}：`) || persona('请')) return 'added';
  const dropped = `${by}改由主持人顺带演「${roleName}」`;
  if (text.startsWith(`${by}给 AI 来演的「${roleName}」改了名字：`) || persona('改请') || text === dropped || text.startsWith(`${dropped}：`)) return 'renamed';
  if (text === seatLogText(by, 'removed', roleName, '')) return 'removed';
  return null;
}

/**
 * 这次改动和上一条记录（prev，是同一个人对同一个身份写的、还在合并时间以内）怎么合并：replace 是撤掉上一条，write 是再写哪一种（不写是 null）。
 * - 刚交给 AI 又取消：两条都不留；交给 AI 以后马上改名字：只留「交给 AI 来演：新名字」；
 * - 改了名字又改、改了名字又取消：只留新的这一条；
 * - 取消了又交给 AI：两条都留（不然之后再取消时，会把这条「交给 AI」也撤掉，记录里就看不出取消过了）。
 * 这样来回切的时候，记录最多多出一两条，而且记录里最后说的一直和现在的情况一样。
 */
export function seatLogMerge(prev: SeatChange, change: SeatChange): { replace: boolean; write: SeatChange | null } {
  if (prev === 'added' && change === 'removed') return { replace: true, write: null };
  if (prev === 'added' && change === 'renamed') return { replace: true, write: 'added' };
  if (prev === 'renamed') return { replace: true, write: change };
  return { replace: false, write: change };
}

/** 一条记录是哪一种写法（V1.1.0）：请了 AI 角色的（请、改请）、把请来的 AI 角色换下来的（改由主持人顺带演）、别的。 */
export type SeatFlavor = 'persona' | 'dropped' | 'plain';

export function seatLogFlavor(text: string, by: string, roleName: string): SeatFlavor {
  const persona = (lead: string) => text.startsWith(`${by}${lead} AI 角色「`) && text.endsWith(`」来演「${roleName}」`);
  if (persona('请') || persona('改请')) return 'persona';
  const dropped = `${by}改由主持人顺带演「${roleName}」`;
  if (text === dropped || text.startsWith(`${dropped}：`)) return 'dropped';
  return 'plain';
}

/**
 * 要写的那一句用哪种写法（seatLogText 的 persona）。write：合并以后要写的；own：这次改动本身（请了或换了 AI 角色是 persona，
 * 把请来的换下来是 dropped，只改名字是 plain）；prev：被撤掉、合并进来的上一条的写法；has：现在是不是请着 AI 角色。
 * 合并以后的一句要说清楚从上一条之前到现在变了什么：刚请了 AI 角色又改名字，还是「请 AI 角色」；刚改请又改名字，还是「改请」。
 */
export function seatLogPersona(write: SeatChange, own: SeatFlavor, prev: SeatFlavor | null, has: boolean): boolean | 'dropped' {
  if (write === 'added') return has;
  if (write === 'removed') return false;
  if (has) return own === 'persona' || prev === 'persona' || prev === 'dropped';
  return own === 'dropped' || prev === 'dropped' || prev === 'persona' ? 'dropped' : false;
}
