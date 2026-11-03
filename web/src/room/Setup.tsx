import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { api, errorMessage, type CardsPage, type Companion, type GameState, type MyCharacter, type Pregen5eView, type RoleChoice, type RoomDetail, type ScenarioJobView, type ScenarioSummary } from '../api';
import { sign } from '../format';
import { Link } from '../router';
import { RELATION_LABEL } from '../../../shared/game';
import { ATTRIBUTES } from '../../../shared/rules';
import { ATTRIBUTES2, BAG_MAX, CONSUMABLES, type ConsumableKey } from '../../../shared/rules2';
import { gearTotals } from '../../../shared/gear2';
import type { Card5eView } from '../../../shared/5e/types';
import { ABILITIES, ABILITY_NAME } from '../../../shared/5e/core';
import { ConvertForm, GenerateForm, JobPanel, RevealScenario } from './Studio';
import { CategoryTag } from '../components/Category';
import { RoomSubmit } from '../components/Submit';
import { useAuth } from '../auth';

// 开团准备：房主（或管理员）选剧本，每个人选身份、起名字，房主开始。
// 每个身份的属性、专长、外貌是剧本定好的，选的时候就看得到，不能改；身份的秘密和目标选定以后才看得到，选定了就不能换。

export function SetupPanel({
  roomId,
  detail,
  game,
  onGame,
  onStart,
  job,
  onJob,
}: {
  roomId: number;
  detail: RoomDetail;
  game: GameState;
  onGame: (g: GameState) => void;
  /** 打开开局的对话框。 */
  onStart: () => void;
  /** 最近一次 AI 生成剧本、转换剧本的情况。 */
  job: ScenarioJobView | null;
  onJob: (job: ScenarioJobView) => void;
}) {
  const { user } = useAuth();
  const manager = detail.viewer.manager;
  const member = detail.viewer.role !== null;
  /** 谁带着宠物（V0.5.0）：自己的看自己的角色，别人的看他们的角色。 */
  const petOf = (userId: number) => (userId === user?.id ? game.me?.pet?.name : game.others.find((o) => o.userId === userId)?.petName) ?? null;
  const [picking, setPicking] = useState(false);
  const [dismissedJob, setDismissedJob] = useState<number | null>(null);
  const [jobError, setJobError] = useState('');
  const scenario = game.scenario;
  const running = job?.status === 'running';

  function started(next: ScenarioJobView) {
    setPicking(false);
    onJob(next);
  }

  async function cancelJob() {
    setJobError('');
    try {
      onJob((await api<{ job: ScenarioJobView }>('DELETE', `/api/rooms/${roomId}/scenario/job`)).job);
    } catch (err) {
      setJobError(errorMessage(err));
    }
  }

  // 上一次生成、转换没成功：打开时直接停在那一页，填过的内容还在
  const retryTab = job && (job.status === 'failed' || job.status === 'cancelled') ? (job.kind === 'generate' ? 'generate' : 'convert') : 'list';
  const picker = (currentKey: string | null, onChosen: (g: GameState) => void) => (
    <ScenarioPicker
      initialTab={retryTab}
      roomId={roomId}
      currentKey={currentKey}
      onChosen={onChosen}
      onJob={started}
      maxPlayers={detail.room.maxPlayers}
      memberCount={detail.members.length}
    />
  );
  const ready = detail.members.filter((m) => m.characterName).length;

  return (
    <div className="setup">
      <section className="setup-step">
        <h2>
          <span className="step-no">一</span>剧本
        </h2>
        {job && job.id !== dismissedJob && (
          <JobPanel job={job} isHost={manager} onCancel={() => void cancelJob()} onDismiss={() => setDismissedJob(job.id)} />
        )}
        {jobError && (
          <p className="form-error" role="alert">
            {jobError}
          </p>
        )}
        {!scenario ? (
          running ? null : manager ? (
            picker(null, onGame)
          ) : (
            <p className="muted">等房主选剧本。</p>
          )
        ) : (
          <>
            <ScenarioCard scenario={scenario} background={scenario.opening.background} source={scenario.source} revealed={scenario.revealed} mod5e={scenario.mod5e === 'on'} />
            {manager &&
              !running &&
              (picking ? (
                <>
                  {(game.me || ready > 0) && <p className="form-error">换剧本以后，大家已经选好的身份会清空，要重新选。</p>}
                  {picker(scenario.source === 'builtin' ? scenario.key : null, (g) => {
                    setPicking(false);
                    onGame(g);
                  })}
                  <button type="button" className="btn btn-small btn-quiet" onClick={() => setPicking(false)}>
                    不换了
                  </button>
                </>
              ) : (
                <div className="scenario-actions">
                  <button type="button" className="btn btn-small" onClick={() => setPicking(true)}>
                    换一个剧本
                  </button>
                  {/* 5E mod（V1.0.0）：普通剧本换成 5E 规则玩 */}
                  {scenario.mod5e !== null && (
                    <Mod5eSwitch roomId={roomId} on={scenario.mod5e === 'on'} chosen={!!game.me || ready > 0} onGame={onGame} />
                  )}
                  {scenario.source !== 'builtin' && <RevealScenario roomId={roomId} title={scenario.title} source={scenario.source} />}
                  {/* 一键投稿（V0.9.2）：AI 生成、导入的剧本，建好了就能投 */}
                  {scenario.source !== 'builtin' && detail.room.isHost && <RoomSubmit roomId={roomId} scenario={scenario} variant="setup" />}
                </div>
              ))}
          </>
        )}
      </section>

      {scenario && member && (
        <section className="setup-step">
          <h2>
            <span className="step-no">二</span>你的角色
          </h2>
          {game.me ? (
            <MyRole roomId={roomId} me={game.me} myPet={game.myPet} canRename onGame={onGame} />
          ) : (
            <RolePicker key={`${scenario.source}:${scenario.key}:${scenario.title}`} roomId={roomId} game={game} onSaved={onGame} />
          )}
        </section>
      )}

      {scenario && (
        <section className="setup-step">
          <h2>
            <span className="step-no">{member ? '三' : '二'}</span>开团
          </h2>
          <ul className="ready-list">
            {detail.members.map((m) => {
              const pet = m.characterName ? petOf(m.userId) : null;
              return (
                <li key={m.userId} className={m.characterName ? 'is-ready' : ''}>
                  <span className="member-name">{m.displayName}</span>
                  <span>{m.characterName ? `「${m.characterName}」${pet ? `，带着宠物「${pet}」` : ''}` : '还没选身份'}</span>
                </li>
              );
            })}
            {game.companions.map((c) => (
              <li key={`ai-${c.roleKey}`} className="is-ready">
                <span className="member-name">
                  <AiTag />
                </span>
                <span>
                  「{c.name}」{c.name !== c.roleName && `（${c.roleName}）`}
                </span>
              </li>
            ))}
          </ul>
          {manager && !scenario.dungeon && scenario.rules !== '5e' && !running && <AiSeatsEditor roomId={roomId} game={game} onGame={onGame} />}
          <p className="hint">
            {manager
              ? `剧本建议 ${scenario.players.min === scenario.players.max ? scenario.players.max : `${scenario.players.min}～${scenario.players.max}`} 人。`
              : '等房主开始。'}
          </p>
          {manager && (
            <button type="button" className="btn btn-primary" disabled={ready === 0} onClick={onStart}>
              开始对局
            </button>
          )}
        </section>
      )}
    </div>
  );
}

/** AI 补位（V0.8.0）：交给 AI 演的身份旁边的小标记。 */
export function AiTag() {
  return (
    <span className="tag ai-tag" title="AI 来演">
      AI
    </span>
  );
}

/** 房主把没人选的身份交给 AI 演（V0.8.0 AI 补位）：勾上就交给 AI，可以改名字（不改就是身份的名字）。地下城、5E 模组没有这一块。 */
function AiSeatsEditor({ roomId, game, onGame }: { roomId: number; game: GameState; onGame: (g: GameState) => void }) {
  const roles = (game.scenario?.roles ?? []).filter((r) => !r.takenBy || game.companions.some((c) => c.roleKey === r.key));
  if (!roles.length) return null;
  return (
    <div className="ai-seats">
      <h3 className="ai-seats-title">交给 AI 演</h3>
      <ul className="ai-seat-list">
        {roles.map((r) => (
          <AiSeatRow key={r.key} roomId={roomId} role={r} seat={game.companions.find((c) => c.roleKey === r.key) ?? null} onGame={onGame} />
        ))}
      </ul>
    </div>
  );
}

function AiSeatRow({ roomId, role, seat, onGame }: { roomId: number; role: RoleChoice; seat: Companion | null; onGame: (g: GameState) => void }) {
  const [name, setName] = useState(seat?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // 名字在别处改了（另一个管理员、刚交给 AI）：跟上
  useEffect(() => setName(seat?.name ?? ''), [seat?.name]);
  const changed = !!seat && name.trim() !== seat.name;

  async function call(method: 'PUT' | 'DELETE', body?: unknown) {
    setBusy(true);
    setError('');
    try {
      onGame(await api<GameState>(method, `/api/rooms/${roomId}/ai-seats/${encodeURIComponent(role.key)}`, body));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function rename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (changed) void call('PUT', { name: name.trim() });
  }

  return (
    <li className={seat ? 'ai-seat is-on' : 'ai-seat'}>
      <label className="choice ai-seat-toggle">
        <input type="checkbox" checked={!!seat} disabled={busy} onChange={(e) => void (e.target.checked ? call('PUT', {}) : call('DELETE'))} />
        <span>{role.name}</span>
      </label>
      {seat && (
        <form className="ai-seat-name" onSubmit={rename} noValidate>
          <label htmlFor={`ai-seat-${role.key}`} className="visually-hidden">
            「{role.name}」的名字
          </label>
          <input id={`ai-seat-${role.key}`} maxLength={20} value={name} placeholder={role.name} disabled={busy} onChange={(e) => setName(e.target.value)} />
          {changed && (
            <button className="btn btn-small" disabled={busy}>
              {busy ? '正在保存……' : '改名字'}
            </button>
          )}
        </form>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

/** 用 5E 规则玩（V1.0.0）：开关。换的时候大家选好的身份会清空，先问一下。 */
function Mod5eSwitch({ roomId, on, chosen, onGame }: { roomId: number; on: boolean; chosen: boolean; onGame: (g: GameState) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function toggle(next: boolean) {
    if (chosen && !window.confirm('换规则以后，大家已经选好的身份会清空，要重新选。确定吗？')) return;
    setBusy(true);
    setError('');
    try {
      onGame(await api<GameState>('PUT', `/api/rooms/${roomId}/scenario/mod5e`, { on: next }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <label className="choice mod5e-switch">
        <input type="checkbox" checked={on} disabled={busy} onChange={(e) => void toggle(e.target.checked)} />
        <span>用 5E 规则玩</span>
      </label>
      {error && (
        <p className="form-error scenario-actions-row" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

/** 身份转成的 5E 角色（V1.0.0 5E mod）：职业等级、生命值、AC、六项属性、技能、攻击、法术。 */
function Pregen5eStats({ pregen, appearance }: { pregen: Pregen5eView; appearance: string }) {
  return (
    <span className="role-stats">
      <span className="role-line">
        {pregen.speciesName}
        {pregen.className}
        {pregen.subclassName && `（${pregen.subclassName}）`} {pregen.level} 级 · {pregen.backgroundName} · 生命 {pregen.hpMax} · AC {pregen.ac}
      </span>
      <span className="role-attrs">
        {ABILITIES.map((a) => (
          <span key={a} className="role-attr">
            {ABILITY_NAME[a]}
            <b>{pregen.abilities[a]}</b>
          </span>
        ))}
      </span>
      <span className="role-line">
        <span className="role-label">技能</span>
        {pregen.skills.join('、')}
      </span>
      {pregen.attacks.length > 0 && (
        <span className="role-line">
          <span className="role-label">攻击</span>
          {pregen.attacks.join('、')}
        </span>
      )}
      {pregen.spells.length > 0 && (
        <span className="role-line">
          <span className="role-label">法术</span>
          {pregen.spells.join('、')}
        </span>
      )}
      {appearance && (
        <span className="role-line">
          <span className="role-label">外貌</span>
          {appearance}
        </span>
      )}
    </span>
  );
}

/** 身份的属性、专长、外貌：剧本定好的，只能看。用在选身份的列表、自己的角色上。 */
function RoleStats({ role }: { role: Pick<RoleChoice, 'attributes' | 'specialties' | 'appearance'> }) {
  // 规则第二版（V0.7.0）是七项属性；地下城的身份没有属性（带自己的角色卡）
  const list = 'strength' in role.attributes ? ATTRIBUTES2 : 'body' in role.attributes ? ATTRIBUTES : [];
  return (
    <span className="role-stats">
      {list.length > 0 && (
        <span className="role-attrs">
          {list.map((a) => (
            <span key={a.key} className="role-attr" title={a.covers}>
              {a.name}
              <b>{sign(role.attributes[a.key] ?? 0)}</b>
            </span>
          ))}
        </span>
      )}
      {role.specialties.length > 0 && (
        <span className="role-line">
          <span className="role-label">专长</span>
          {role.specialties.join('、')}
        </span>
      )}
      {role.appearance && (
        <span className="role-line">
          <span className="role-label">外貌</span>
          {role.appearance}
        </span>
      )}
    </span>
  );
}

/**
 * 选身份、起名字。选之前要确认一次：选定以后能看到这个身份的秘密和目标，就不能再换了。
 * late：开局以后中途加入。
 */
export function RolePicker({ roomId, game, onSaved, late = false }: { roomId: number; game: GameState; onSaved: (g: GameState) => void; late?: boolean }) {
  const roles = game.scenario?.roles ?? [];
  // AI 演的身份（V0.8.0）：开局以后可以接替；名字先填上他的（可以改），没起名字的留空
  const aiOf = (key: string) => game.companions.find((c) => c.roleKey === key) ?? null;
  const open = (r: RoleChoice) => !r.takenBy || (late && !!aiOf(r.key));
  const suggested = (key: string) => {
    const c = late ? aiOf(key) : null;
    return c && c.name !== c.roleName ? c.name : '';
  };
  const firstFree = (roles.find((r) => !r.takenBy) ?? roles.find(open))?.key ?? '';
  const [roleKey, setRoleKey] = useState(firstFree);
  const [name, setName] = useState(() => suggested(firstFree));
  // 地下城（V0.7.0）：带自己的角色卡和道具进去，不用起名字
  const dungeon = !!game.scenario?.dungeon;
  const [cardPick, setCardPick] = useState<CardPick | null>(null);
  // 5E 模组（V0.9.0）：带自己的 5E 角色卡进去；用 5E 规则玩普通剧本（V1.0.0）用身份转成的角色，只起名字
  const five = game.scenario?.rules === '5e' && game.scenario.mod5e !== 'on';
  const [card5e, setCard5e] = useState<{ cardId: number; name: string } | null>(null);
  /** 带上宠物（V0.5.0，只陪伴）。 */
  const [withPet, setWithPet] = useState(!!game.myPet);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const role = roles.find((r) => r.key === roleKey && open(r)) ?? null;
  const replacing = role ? late && !!aiOf(role.key) : false;

  function choose(key: string) {
    setRoleKey(key);
    setConfirming(false);
    // 没改过的名字（空的、或者是上一个 AI 队友的）跟着换
    setName((n) => (!n.trim() || n === suggested(roleKey) ? suggested(key) : n));
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!role) return setError('选一个还没人选的身份');
    if (dungeon) {
      if (!cardPick) return setError('选一张角色卡');
    } else if (five) {
      if (!card5e) return setError('选一张 5E 角色卡');
    } else if (!name.trim()) return setError('给角色起个名字');
    setConfirming(true);
  }

  async function save() {
    if (!role) return;
    setBusy(true);
    setError('');
    try {
      onSaved(
        await api<GameState>(
          'PUT',
          `/api/rooms/${roomId}/character`,
          dungeon && cardPick
            ? { roleKey: role.key, cardId: cardPick.cardId, bag: cardPick.bag, withPet: !!game.myPet && withPet }
            : five && card5e
              ? { roleKey: role.key, cardId: card5e.cardId, withPet: !!game.myPet && withPet }
              : { roleKey: role.key, name: name.trim(), withPet: !!game.myPet && withPet },
        ),
      );
    } catch (err) {
      setError(errorMessage(err));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form role-picker" onSubmit={submit} noValidate>
      <fieldset className="field">
        <legend>身份</legend>
        <div className="role-list">
          {roles.map((r) => {
            const taken = !open(r);
            const ai = aiOf(r.key);
            return (
              <label key={r.key} className={`role-option${roleKey === r.key ? ' is-active' : ''}${taken ? ' is-taken' : ''}`}>
                <input
                  type="radio"
                  name={late ? 'late-role' : 'role'}
                  value={r.key}
                  checked={roleKey === r.key}
                  disabled={taken || busy}
                  onChange={() => choose(r.key)}
                />
                <span className="role-name">{r.name}</span>
                <span className="role-public">{r.public}</span>
                {r.pregen5e ? <Pregen5eStats pregen={r.pregen5e} appearance={r.appearance} /> : <RoleStats role={r} />}
                {ai ? (
                  <span className="role-taken role-ai">
                    <AiTag />
                    {ai.name}
                  </span>
                ) : (
                  taken && <span className="role-taken">已被「{r.takenBy}」选走</span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {dungeon ? (
        <CardPicker
          disabled={busy}
          onChange={(pick) => {
            setCardPick(pick);
            setConfirming(false);
          }}
        />
      ) : five ? (
        <Card5ePicker
          disabled={busy}
          level={game.scenario?.module5e?.level ?? 1}
          onChange={(pick) => {
            setCard5e(pick);
            setConfirming(false);
          }}
        />
      ) : (
        <div className="field">
          <label htmlFor={late ? 'late-char-name' : 'char-name'}>角色名</label>
          <input
            id={late ? 'late-char-name' : 'char-name'}
            maxLength={20}
            value={name}
            disabled={busy}
            onChange={(e) => {
              setName(e.target.value);
              setConfirming(false);
            }}
          />
        </div>
      )}

      {game.myPet && (
        <label className="choice">
          <input
            type="checkbox"
            checked={withPet}
            disabled={busy}
            onChange={(e) => {
              setWithPet(e.target.checked);
              setConfirming(false);
            }}
          />
          <span>{`带上宠物「${game.myPet.name}」（只陪伴）`}</span>
        </label>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {confirming && role ? (
        <div className="confirm-bar" role="alertdialog" aria-labelledby="role-confirm-text">
          <p id="role-confirm-text">
            {replacing ? '接替 AI 演的' : '选定'}「{role.name}」，
            {dungeon ? `带角色卡「${cardPick?.name ?? ''}」进去` : five ? `带 5E 角色「${card5e?.name ?? ''}」进去` : `角色名「${name.trim()}」`}
            ？选定以后会看到这个身份的秘密和目标，就不能再换身份了
            {late ? '。' : '（开局前还能改名字）。'}
          </p>
          <div className="confirm-actions">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()} autoFocus>
              {busy ? '正在保存……' : '确定'}
            </button>
            <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => setConfirming(false)}>
              再想想
            </button>
          </div>
        </div>
      ) : (
        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy || !roles.some(open)}>
            {replacing ? '接替，加入故事' : late ? '选这个身份，加入故事' : '选这个身份'}
          </button>
        </div>
      )}
    </form>
  );
}

type CardPick = { cardId: number; name: string; bag: Partial<Record<ConsumableKey, number>> };

/** 5E 模组（V0.9.0）：选一张自己的 5E 角色卡（在别的局里的、选择还没做完的选不了）。level：模组建议的等级。 */
function Card5ePicker({ disabled, level, onChange }: { disabled: boolean; level: number; onChange: (pick: { cardId: number; name: string } | null) => void }) {
  const [cards, setCards] = useState<Card5eView[] | null>(null);
  const [error, setError] = useState('');
  const [cardId, setCardId] = useState<number | null>(null);
  const usable = (c: Card5eView) => !c.inRoom && c.sheet.todo.length === 0;

  useEffect(() => {
    api<{ cards: Card5eView[] }>('GET', '/api/cards5e')
      .then((p) => {
        setCards(p.cards);
        const free = p.cards.find((c) => usable(c) && c.data.level === level) ?? p.cards.find(usable);
        if (free) setCardId(free.id);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const card = cards?.find((c) => c.id === cardId) ?? null;
  useEffect(() => {
    onChange(card ? { cardId: card.id, name: card.name } : null);
    // onChange 每次都是新的函数，不放进依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, cards]);

  if (error) return <p className="form-error">{error}</p>;
  if (!cards) return <p className="muted">正在读你的 5E 角色卡……</p>;
  if (!cards.length) {
    return (
      <p className="empty">
        5E 模组只能带自己的 5E 角色进去。<Link to="/characters?tab=5e">先去做一张</Link>
      </p>
    );
  }
  return (
    <fieldset className="field">
      <legend>带哪张 5E 角色卡（这个模组建议 {level} 级）</legend>
      <div className="role-list">
        {cards.map((c) => (
          <label key={c.id} className={`role-option${cardId === c.id ? ' is-active' : ''}${usable(c) ? '' : ' is-taken'}`}>
            <input type="radio" name="five-card" checked={cardId === c.id} disabled={disabled || !usable(c)} onChange={() => setCardId(c.id)} />
            <span className="role-name">{c.name}</span>
            <span className="role-public">
              {c.sheet.speciesName}
              {c.sheet.className} {c.data.level} 级 · 生命 {c.sheet.hpMax} · AC {c.sheet.ac}
            </span>
            {c.inRoom ? (
              <span className="role-taken">正在「{c.inRoom.name}」里</span>
            ) : c.sheet.todo.length > 0 ? (
              <span className="role-taken">还有选择没做完（去「5E 角色」里补上）</span>
            ) : (
              c.data.level !== level && <span className="role-taken">建议 {level} 级，这张卡 {c.data.level} 级</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** 地下城（V0.7.0）：选一张自己的角色卡，再选带哪些道具（一共最多 BAG_MAX 个）。 */
function CardPicker({ disabled, onChange }: { disabled: boolean; onChange: (pick: CardPick | null) => void }) {
  const [page, setPage] = useState<CardsPage | null>(null);
  const [error, setError] = useState('');
  const [cardId, setCardId] = useState<number | null>(null);
  const [bag, setBag] = useState<Partial<Record<ConsumableKey, number>>>({});

  useEffect(() => {
    api<CardsPage>('GET', '/api/cards')
      .then((p) => {
        setPage(p);
        const free = p.cards.find((c) => !c.inRoom);
        if (free) setCardId(free.id);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const card = page?.cards.find((c) => c.id === cardId) ?? null;
  useEffect(() => {
    onChange(card ? { cardId: card.id, name: card.name, bag } : null);
    // onChange 每次都是新的函数，不放进依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, bag, page]);

  if (error) return <p className="form-error">{error}</p>;
  if (!page) return <p className="muted">正在读你的角色卡……</p>;
  if (!page.cards.length) {
    return (
      <p className="empty">
        地下城只能带自己的角色卡进去。<Link to="/characters">先去做一张</Link>
      </p>
    );
  }
  const total = Object.values(bag).reduce((a, b) => a + (b ?? 0), 0);
  return (
    <>
      <fieldset className="field">
        <legend>带哪张角色卡</legend>
        <div className="role-list">
          {page.cards.map((c) => (
            <label key={c.id} className={`role-option${cardId === c.id ? ' is-active' : ''}${c.inRoom ? ' is-taken' : ''}`}>
              <input type="radio" name="dungeon-card" checked={cardId === c.id} disabled={disabled || !!c.inRoom} onChange={() => setCardId(c.id)} />
              <span className="role-name">{c.name}</span>
              <span className="role-public">
                战力 {c.power} · 生命 {c.hpMax} · 精神 {c.mpMax} · 防御 {c.defense}
              </span>
              <RoleStats role={{ attributes: c.attributes, specialties: c.specialties, appearance: '' }} />
              {c.inRoom && <span className="role-taken">正在「{c.inRoom.name}」里</span>}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend>带的道具（一共最多 {BAG_MAX} 个）</legend>
        {CONSUMABLES.some((c) => (page.bag[c.key] ?? 0) > 0) ? (
          <div className="inline-inputs bag-pick">
            {CONSUMABLES.filter((c) => (page.bag[c.key] ?? 0) > 0).map((c) => (
              <label key={c.key} title={c.effect}>
                <span>
                  {c.name}（有 {page.bag[c.key]}）
                </span>
                <input
                  type="number"
                  min={0}
                  max={Math.min(page.bag[c.key] ?? 0, BAG_MAX)}
                  value={bag[c.key] ?? 0}
                  disabled={disabled}
                  onChange={(e) => {
                    const n = Math.max(0, Math.min(Number(e.target.value) || 0, page.bag[c.key] ?? 0));
                    const others = total - (bag[c.key] ?? 0);
                    setBag({ ...bag, [c.key]: Math.min(n, BAG_MAX - others) });
                  }}
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="muted">
            背包里没有道具。<Link to="/shop">去商城</Link>
          </p>
        )}
      </fieldset>
    </>
  );
}

/** 选好的身份：属性这些、身份的秘密和目标。开局前可以改名字、带不带宠物。 */
function MyRole({
  roomId,
  me,
  myPet,
  canRename,
  onGame,
}: {
  roomId: number;
  me: MyCharacter;
  myPet: GameState['myPet'];
  canRename: boolean;
  onGame: (g: GameState) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(me.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function rename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('给角色起个名字');
    setBusy(true);
    try {
      onGame(await api<GameState>('PUT', `/api/rooms/${roomId}/character`, { roleKey: me.roleKey, name: name.trim() }));
      setRenaming(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function togglePet() {
    setError('');
    setBusy(true);
    try {
      onGame(await api<GameState>('PUT', `/api/rooms/${roomId}/character`, { roleKey: me.roleKey, name: me.name, withPet: !me.pet }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="my-character">
      <p className="my-character-name">
        {me.name}
        <span className="muted">（{me.roleName}）</span>
      </p>
      {me.pet && <p className="my-pet">带着宠物「{me.pet.name}」</p>}
      <p className="role-public">{me.rolePublic}</p>
      {me.v5 ? (
        <p className="role-line">
          {me.v5.speciesName}
          {me.v5.className} {me.v5.level} 级 · 生命 {me.v5.hpMax} · AC {me.v5.ac}
          {me.appearance && ` · ${me.appearance}`}
        </p>
      ) : me.v2 ? (
        <>
          <RoleStats role={{ attributes: me.v2.attributes, specialties: me.specialties, appearance: me.appearance }} />
          <p className="role-line">
            生命 {me.v2.hpMax} · 精神 {me.v2.mpMax} · 防御 {me.v2.defense}
            {me.v2.gear.length > 0 && ` · 减伤 ${gearTotals(me.v2.gear).reduction} · 装备 ${me.v2.gear.length} 件`}
          </p>
        </>
      ) : (
        <RoleStats role={me} />
      )}
      <div className="sheet-secret">
        <h3>只有你知道</h3>
        <p>{me.roleSecret || '这个身份没有秘密。'}</p>
        <h3>目标</h3>
        <p>{me.roleGoal}</p>
      </div>
      {canRename &&
        !me.cardId &&
        !me.v5?.cardId &&
        (renaming ? (
          <form className="rename-form" onSubmit={rename} noValidate>
            <label htmlFor="rename-input" className="visually-hidden">
              新的角色名
            </label>
            <input id="rename-input" maxLength={20} value={name} disabled={busy} onChange={(e) => setName(e.target.value)} autoFocus />
            <button className="btn btn-small btn-primary" disabled={busy}>
              {busy ? '正在保存……' : '保存'}
            </button>
            <button
              type="button"
              className="btn btn-small btn-quiet"
              onClick={() => {
                setRenaming(false);
                setName(me.name);
                setError('');
              }}
            >
              取消
            </button>
          </form>
        ) : (
          <span className="my-character-actions">
            <button type="button" className="btn btn-small" onClick={() => setRenaming(true)}>
              改名字
            </button>
            {(me.pet || myPet) && (
              <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void togglePet()}>
                {me.pet ? '不带宠物了' : `带上宠物「${myPet!.name}」`}
              </button>
            )}
          </span>
        ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ScenarioCard({
  scenario,
  background,
  source,
  revealed = false,
  mod5e = false,
}: {
  scenario: ScenarioSummary;
  background?: string;
  source?: 'builtin' | 'generated' | 'imported';
  revealed?: boolean;
  /** 用 5E 规则玩这个普通剧本（V1.0.0）。 */
  mod5e?: boolean;
}) {
  const sourceLabel =
    source === 'generated' ? (revealed ? 'AI 生成，房主看过完整剧本' : 'AI 生成，谁都没看过真相') : source === 'imported' ? '导入的剧本' : null;
  return (
    <div className="scenario-card">
      <h3 className="scenario-title">{scenario.title}</h3>
      <p className="scenario-meta">
        <CategoryTag category={scenario.category} />
        {scenario.genre} · {scenario.players.min === scenario.players.max ? scenario.players.max : `${scenario.players.min}～${scenario.players.max}`}人 · 预计{scenario.expectedDays}天 ·{' '}
        {RELATION_LABEL[scenario.relation]}
        {scenario.stress && ' · 有心智规则'}
        {scenario.rules === '5e' && (
          <span className="tag tag-five">{mod5e ? `5E 规则 · 角色 ${scenario.module5e?.level ?? 3} 级` : `5E · 建议 ${scenario.module5e?.level ?? 1} 级`}</span>
        )}
        {sourceLabel && <span className="tag scenario-source">{sourceLabel}</span>}
      </p>
      <p className="scenario-tone">{scenario.tone}</p>
      {!background && scenario.intro && <p className="scenario-intro">{scenario.intro}</p>}
      {background && <p className="scenario-background">{background}</p>}
    </div>
  );
}

const PICKER_TABS = [
  { key: 'list', label: '现成的剧本' },
  { key: 'generate', label: 'AI 生成' },
  { key: 'convert', label: '导入文本剧本' },
] as const;

type PickerTab = (typeof PICKER_TABS)[number]['key'];

function ScenarioPicker({
  initialTab,
  roomId,
  currentKey,
  onChosen,
  onJob,
  maxPlayers,
  memberCount,
}: {
  initialTab: PickerTab;
  roomId: number;
  currentKey: string | null;
  onChosen: (g: GameState) => void;
  onJob: (job: ScenarioJobView) => void;
  maxPlayers: number;
  memberCount: number;
}) {
  const [tab, setTab] = useState<PickerTab>(initialTab);
  return (
    <div className="scenario-picker">
      <div className="picker-tabs" role="tablist" aria-label="剧本从哪里来">
        {PICKER_TABS.map((t) => (
          <button key={t.key} type="button" role="tab" className="picker-tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'list' && <BuiltinScenarios roomId={roomId} currentKey={currentKey} onChosen={onChosen} />}
      {tab === 'generate' && <GenerateForm roomId={roomId} maxPlayers={maxPlayers} memberCount={memberCount} onStarted={onJob} />}
      {tab === 'convert' && <ConvertForm roomId={roomId} onStarted={onJob} />}
    </div>
  );
}

function BuiltinScenarios({ roomId, currentKey, onChosen }: { roomId: number; currentKey: string | null; onChosen: (g: GameState) => void }) {
  const [list, setList] = useState<ScenarioSummary[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<{ scenarios: ScenarioSummary[] }>('GET', '/api/scenarios')
      .then((r) => setList(r.scenarios))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  async function choose(body: unknown) {
    setBusy(true);
    setError('');
    try {
      onChosen(await api<GameState>('POST', `/api/rooms/${roomId}/scenario`, body));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let data: unknown;
    try {
      data = JSON.parse((await file.text()).replace(/^﻿/, ''));
    } catch {
      setError('这个文件不是 JSON 格式的剧本');
      return;
    }
    await choose({ data });
  }

  return (
    <div className="scenario-builtin">
      {list === null ? (
        !error && <p className="muted">正在加载剧本……</p>
      ) : list.length === 0 ? (
        <p className="muted">没有能用的剧本。</p>
      ) : (
        <ul className="scenario-list">
          {list.map((s) => (
            <li key={s.key}>
              <ScenarioCard scenario={s} />
              <p className="scenario-start">开场：{s.startLabel}</p>
              <button type="button" className="btn btn-small btn-primary" disabled={busy || s.key === currentKey} onClick={() => void choose({ key: s.key })}>
                {s.key === currentKey ? '正在用这个' : '选这个'}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="scenario-import">
        <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => fileRef.current?.click()}>
          导入剧本文件（.json）
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void importFile(e)} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
