import { useCallback, useEffect, useState } from 'react';
import { ABILITIES, ABILITY_NAME } from '../../../shared/5e/core';
import { RELATION_LABEL } from '../../../shared/game';
import { ACHIEVEMENTS, HIDDEN_ACHIEVEMENT_COUNT } from '../../../shared/achievements';
import { ATTRIBUTE_KEYS, ATTRIBUTE_NAME } from '../../../shared/rules';
import { ATTRIBUTES2, EQUIP_SLOTS, EQUIP_SLOT_LABEL, RARITY_LABEL } from '../../../shared/rules2';
import { gearEffectText } from '../../../shared/gear2';
import { api, errorMessage, type Profile, type ProfileCollection, type PublicCard } from '../api';
import { useAuth } from '../auth';
import { BanForm } from '../components/BanLength';
import { Stamp } from '../components/bits';
import { CategoryTag } from '../components/Category';
import { openFeedback } from '../components/Feedback';
import { Avatar, IdentityTag, OnlineDot } from '../components/people';
import { PetFigure } from '../components/PetFigure';
import { formatDate, formatDateTime, sign } from '../format';
import { Link, navigate } from '../router';
import { CreateRoomForm } from './Lobby';

// 个人主页：头像、名字、介绍、关注、战绩、剧本大厅里的作品、参加过的对局（本人可以选择不展示）；私聊、屏蔽、举报。
// V0.6.0：称号、成就（隐藏的没达成只显示 ？？？）、达成的结局数；宠物的装扮、串门（好友：摸摸头、喂一口）。
// V0.7.0：头像框；称号在「装扮」里换；宠物留言去掉了。
// V0.8.1：自己的角色卡（主人选了在主页展示的）；有封号权限的管理员能在这里封号、解封。
// V0.8.2：上面四个数换成玩完的剧本、通关的地下城、达成的结局、成就；下面依次是角色卡、宠物、剧本、成就、对局。
// 地址里是公开编号，页面上不显示用户名（只有本人、管理员看得到）：加好友要在「好友」页输入对方完整的用户名。

export function ProfilePage({ who }: { who: string }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  /** 正在用哪个作品开局。 */
  const [opening, setOpening] = useState<string | null>(null);
  /** 管理员点开了封号的表单（V0.8.1）。 */
  const [banOpen, setBanOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setProfile(await api<Profile>('GET', `/api/users/${encodeURIComponent(who)}`));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [who]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (profile) document.title = `${profile.user.displayName} - 龙娘跑团`;
  }, [profile]);

  async function act(method: 'POST' | 'DELETE', path: string, body?: unknown) {
    await run(() => api(method, path, body));
  }

  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setActionError('');
    try {
      await work();
      await load();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="page-error">
        <p className="form-error" role="alert">
          {error}
        </p>
        <Link to="/">回到游戏大厅</Link>
      </div>
    );
  }
  if (!profile || !user) return <p className="muted">正在加载……</p>;

  const p = profile.user;
  const self = profile.relation === 'self';
  const canAct = !user.isGuest && !self && p.identity !== 'guest';
  const name = encodeURIComponent(p.publicId);
  // 管理员在主页上封号、解封（V0.8.1）：有封号权限、能动这个账号才有
  const mod = profile.moderation;
  const canBan = !!mod?.canBan;

  return (
    <div className="profile">
      <header className="profile-head">
        <Avatar user={p} size={96} />
        <div className="profile-who">
          <h1>
            {p.displayName}
            <IdentityTag identity={p.identity} />
            {profile.title && <span className="title-badge">{profile.title}</span>}
          </h1>
          <p className="muted">{[p.username, p.identity !== 'guest' ? `${formatDate(p.joinedAt)}加入` : null].filter(Boolean).join('，')}</p>
          <p className="profile-presence">
            <OnlineDot online={p.online} />
            {!p.online && p.lastSeenAt && <span className="muted">上次来过：{formatDateTime(p.lastSeenAt)}</span>}
          </p>
          {p.identity !== 'guest' && <p className="muted profile-followers">{profile.followers} 人关注</p>}
          {mod?.banned ? (
            <p className="form-error">
              {formatDateTime(mod.banned.at)} 被封禁{mod.banned.reason ? `（${mod.banned.reason}）` : ''}。{mod.banned.until ? `${formatDateTime(mod.banned.until)} 自动解封。` : '永久封禁。'}
            </p>
          ) : (
            p.banned && <p className="form-error">这个账号被封禁了。</p>
          )}
        </div>
      </header>

      {p.bio && <p className="profile-bio">{p.bio}</p>}

      {(canAct || canBan) && (
        <div className="profile-actions">
          {canAct && (profile.blocked ? (
            <button type="button" className="btn btn-small" disabled={busy} onClick={() => void act('DELETE', `/api/blocks/${name}`)}>
              取消屏蔽
            </button>
          ) : (
            <>
              <button
                type="button"
                className={profile.following ? 'btn btn-small btn-quiet' : 'btn btn-small'}
                aria-pressed={profile.following}
                disabled={busy}
                onClick={() => void act(profile.following ? 'DELETE' : 'POST', `/api/users/${name}/follow`)}
              >
                {profile.following ? '已关注' : '关注'}
              </button>
              {profile.relation === 'pending-out' && (
                <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void act('DELETE', `/api/friends/${name}`)}>
                  撤回好友申请
                </button>
              )}
              {profile.relation === 'pending-in' && (
                <>
                  <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void act('POST', `/api/friends/${name}/accept`)}>
                    同意加好友
                  </button>
                  <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void act('DELETE', `/api/friends/${name}`)}>
                    拒绝
                  </button>
                </>
              )}
              {profile.relation === 'friends' && (
                <>
                  <button type="button" className="btn btn-small btn-primary" onClick={() => navigate(`/friends/${name}`)}>
                    私聊
                  </button>
                  <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void act('DELETE', `/api/friends/${name}`)}>
                    删除好友
                  </button>
                </>
              )}
              <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void act('POST', '/api/blocks', { user: p.publicId })}>
                屏蔽
              </button>
            </>
          ))}
          {canAct && (
            <button type="button" className="btn btn-small btn-quiet btn-danger-text" onClick={() => openFeedback({ kind: 'report', user: p.publicId, displayName: p.displayName })}>
              举报
            </button>
          )}
          {canBan &&
            (mod!.banned ? (
              <button type="button" className="btn btn-small" disabled={busy} onClick={() => void run(() => api('POST', `/api/admin/users/${mod!.id}/unban`))}>
                解封
              </button>
            ) : (
              <button type="button" className="btn btn-small btn-quiet btn-danger-text" aria-expanded={banOpen} onClick={() => setBanOpen((v) => !v)}>
                封号
              </button>
            ))}
        </div>
      )}
      {canBan && !mod!.banned && banOpen && (
        <div className="profile-ban">
          <BanForm userId={mod!.id} displayName={p.displayName} busy={busy} run={run} onBanned={() => setBanOpen(false)} />
        </div>
      )}
      {profile.blocked && <p className="hint">你屏蔽了他。</p>}
      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}
      {self && (
        <p className="hint">
          <Link to="/account">修改资料</Link>
        </p>
      )}

      {profile.stats && (
        <dl className="profile-stats">
          <div>
            <dt>玩完的剧本</dt>
            <dd>{profile.stats.scenarios}</dd>
          </div>
          <div>
            <dt>通关的地下城</dt>
            <dd>{profile.stats.dungeons}</dd>
          </div>
          <div>
            <dt>达成的结局</dt>
            <dd>{profile.stats.endings}</dd>
          </div>
          <div>
            <dt>成就</dt>
            <dd>{profile.stats.achievements}</dd>
          </div>
        </dl>
      )}

      {profile.cards.length > 0 && (
        <section aria-labelledby="profile-cards" className="profile-cards">
          <h2 id="profile-cards" className="section-title">
            角色卡
          </h2>
          <div className="profile-card-grid">
            {profile.cards.map((c) => (
              <ProfileCard key={c.id} card={c} />
            ))}
          </div>
        </section>
      )}

      {profile.cards5e.length > 0 && (
        <section aria-labelledby="profile-cards5e" className="profile-cards">
          <h2 id="profile-cards5e" className="section-title">
            5E 角色
          </h2>
          <div className="profile-card-grid">
            {profile.cards5e.map((c) => (
              <article key={c.id} className="profile-card profile-card-5e" aria-labelledby={`profile-card5e-${c.id}`}>
                <header className="profile-card-head">
                  <h3 id={`profile-card5e-${c.id}`}>{c.name}</h3>
                  <span className="five-card-class">
                    {c.species}
                    {c.className} {c.level} 级
                  </span>
                </header>
                {c.subclassName && <p className="profile-card-line">{c.subclassName}</p>}
                {c.appearance && <p className="profile-card-look">{c.appearance}</p>}
                <dl className="profile-card-attrs">
                  {ABILITIES.map((a) => (
                    <div key={a}>
                      <dt>{ABILITY_NAME[a]}</dt>
                      <dd>{c.abilities[a]}</dd>
                    </div>
                  ))}
                </dl>
                <p className="profile-card-vitals">
                  <span>生命 {c.hpMax}</span>
                  <span>AC {c.ac}</span>
                  <span>打完 {c.modules} 个模组</span>
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {profile.pet && (
        <section aria-labelledby="profile-pet" className="profile-pet">
          <h2 id="profile-pet" className="section-title">
            宠物
          </h2>
          <div className="profile-pet-card">
            <PetFigure name={profile.pet.name} image={profile.pet.image} outfit={profile.pet.outfit} size="medium" />
            <div className="profile-pet-info">
              <p className="pet-name profile-pet-name">{profile.pet.name}</p>
              {profile.pet.description && <p className="pet-desc">{profile.pet.description}</p>}
              <dl className="pet-attrs">
                {ATTRIBUTE_KEYS.map((k) => (
                  <div key={k}>
                    <dt>{ATTRIBUTE_NAME[k]}</dt>
                    <dd>{profile.pet!.attributes[k]}</dd>
                  </div>
                ))}
              </dl>
              {profile.pet.visit?.allowed && <Visit profile={profile} onDone={() => void load()} />}
            </div>
          </div>
        </section>
      )}

      {profile.works.length > 0 && (
        <section aria-labelledby="profile-works" className="profile-works">
          <h2 id="profile-works" className="section-title">
            剧本大厅里的作品
          </h2>
          <ul className="shelf">
            {profile.works.map((s) => (
              <li key={s.key} className={`shelf-item spine-${s.category ?? 'none'}`}>
                <div className="shelf-body">
                  <div className="shelf-head">
                    <h3 className="shelf-title">{s.title}</h3>
                    <CategoryTag category={s.category} />
                  </div>
                  <p className="shelf-meta">
                    {s.genre} · {s.players.min === s.players.max ? s.players.max : `${s.players.min}～${s.players.max}`}人 · 预计{s.expectedDays}天 · {RELATION_LABEL[s.relation]}
                    {s.plays > 0 && ` · 开过 ${s.plays} 局`}
                    {s.finishes > 0 && ` · 玩完 ${s.finishes} 局`}
                    {s.rating.average !== null && ` · ${s.rating.average.toFixed(1)} 星（${s.rating.count} 人评）`}
                  </p>
                  <p className="shelf-intro">{s.intro || s.tone}</p>
                </div>
                {!user.isGuest && (
                  <div className="shelf-action">
                    <button type="button" className="btn btn-primary btn-small" aria-expanded={opening === s.key} onClick={() => setOpening(opening === s.key ? null : s.key)}>
                      用这个剧本开局
                    </button>
                  </div>
                )}
                {opening === s.key && (
                  <div className="shelf-create">
                    <CreateRoomForm scenario={s} onCancel={() => setOpening(null)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.collection && <Achievements collection={profile.collection} />}

      {profile.rooms === null ? (
        p.identity !== 'guest' && <p className="muted">{p.displayName}没有公开自己的对局。</p>
      ) : profile.rooms.length === 0 ? (
        <p className="muted">还没有参加过对局。</p>
      ) : (
        <section aria-labelledby="profile-rooms">
          <h2 id="profile-rooms" className="section-title">
            对局
          </h2>
          <ul className="room-list">
            {profile.rooms.map((r) => {
              const inner = (
                <>
                  <span className="room-row-main">
                    <span className="room-row-name">{r.name}</span>
                    <span className="room-row-meta">
                      {r.role === 'host' && <span className="tag">房主</span>}
                      {r.isPublic && <span className="tag">公开</span>}
                      {r.scenarioTitle && <span>《{r.scenarioTitle}》</span>}
                      {r.characterName && (
                        <span>
                          扮演「{r.characterName}」{r.roleName && `（${r.roleName}）`}
                        </span>
                      )}
                    </span>
                  </span>
                  <Stamp status={r.status} />
                </>
              );
              return (
                <li key={r.id}>
                  {r.canOpen ? (
                    <Link to={`/room/${r.id}`} className="room-row">
                      {inner}
                    </Link>
                  ) : (
                    <div className="room-row is-closed">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

/** 主页上的一张角色卡（V0.8.1）：名字、战力、外貌、七项属性、生命精神防御、专长、技能、身上的装备、切磋和通关。 */
function ProfileCard({ card }: { card: PublicCard }) {
  const worn = EQUIP_SLOTS.flatMap((slot) => {
    const g = card.equipped[slot];
    return g ? [{ slot, g }] : [];
  });
  const legendary = worn.filter(({ g }) => g.ability);
  return (
    <article className="profile-card" aria-labelledby={`profile-card-${card.id}`}>
      <header className="profile-card-head">
        <h3 id={`profile-card-${card.id}`}>{card.name}</h3>
        <span className="card-power">战力 {card.power}</span>
      </header>
      {card.appearance && <p className="profile-card-look">{card.appearance}</p>}
      <dl className="profile-card-attrs">
        {ATTRIBUTES2.map((a) => (
          <div key={a.key} title={a.covers}>
            <dt>{a.name}</dt>
            <dd>{sign(card.attributes[a.key])}</dd>
          </div>
        ))}
      </dl>
      <p className="profile-card-vitals">
        <span>生命 {card.hpMax}</span>
        <span>精神 {card.mpMax}</span>
        <span>防御 {card.defense}</span>
      </p>
      <p className="profile-card-line">
        <span className="sheet-label-inline">专长</span>
        {card.specialties.join('、')}
      </p>
      {card.skills.length > 0 && (
        <p className="profile-card-line">
          <span className="sheet-label-inline">技能</span>
          {card.skills.map((k, i) => (
            <span key={k.name} title={k.text}>
              {i > 0 && '、'}
              {k.name}
            </span>
          ))}
        </p>
      )}
      {worn.length > 0 && (
        <ul className="profile-card-gear" aria-label={`${card.name}身上的装备`}>
          {worn.map(({ slot, g }) => (
            <li key={slot} className={`gear-${g.rarity}`} title={`${g.name}（${RARITY_LABEL[g.rarity]}）${gearEffectText(g)}`}>
              <span className="profile-card-slot">{EQUIP_SLOT_LABEL[slot]}</span>
              <span className="gear-name">{g.name}</span>
            </li>
          ))}
        </ul>
      )}
      {legendary.length > 0 && (
        <ul className="doll-abilities">
          {legendary.map(({ g }) => (
            <li key={g.id}>
              <span className="gear-name rarity-legendary">{g.name}</span>
              {g.ability}
            </li>
          ))}
        </ul>
      )}
      <p className="profile-card-record">
        切磋 {card.duel.wins} 胜 {card.duel.losses} 负 · 通关地下城 {card.clears} 次
      </p>
    </article>
  );
}

/** 成就：普通的全列出来（没达成的灰着、写着怎么达成）；隐藏的达成了才显示，没达成的只显示 ？？？。称号在「我的装扮」里换。 */
function Achievements({ collection }: { collection: ProfileCollection }) {
  const earned = new Map(collection.achievements.map((a) => [a.key, a]));
  const hiddenEarned = collection.achievements.filter((a) => a.hidden);
  const events = collection.achievements.filter((a) => a.key.startsWith('event-'));
  const hiddenLeft = Math.max(0, HIDDEN_ACHIEVEMENT_COUNT - hiddenEarned.length);
  const visibleDone = ACHIEVEMENTS.filter((a) => earned.has(a.key)).length;

  return (
    <section aria-labelledby="profile-achievements" className="profile-achievements">
      <h2 id="profile-achievements" className="section-title">
        成就
        <span className="section-count">
          {visibleDone + hiddenEarned.length}/{ACHIEVEMENTS.length + HIDDEN_ACHIEVEMENT_COUNT}
        </span>
      </h2>
      <ul className="achievement-grid">
        {ACHIEVEMENTS.map((a) => {
          const got = earned.get(a.key);
          return (
            <li key={a.key} className={got ? 'achievement is-earned' : 'achievement'}>
              <span className="achievement-title">{a.title}</span>
              <span className="achievement-how">{a.how}</span>
              {got && <span className="achievement-at">{formatDate(got.at)}</span>}
            </li>
          );
        })}
        {[...hiddenEarned, ...events].map((a) => (
          <li key={a.key} className={a.hidden ? 'achievement is-earned is-hidden' : 'achievement is-earned is-event'}>
            <span className="achievement-title">{a.title}</span>
            <span className="achievement-how">{a.how}</span>
            <span className="achievement-at">{formatDate(a.at)}</span>
          </li>
        ))}
        {Array.from({ length: hiddenLeft }, (_, i) => (
          <li key={`hidden-${i}`} className="achievement is-secret" aria-label="隐藏成就">
            <span className="achievement-title">？？？</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 串门（好友）：摸摸头，或者从自己背包里拿一口吃的喂它。每天第一次两边各得龙晶。 */
function Visit({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const visit = profile.pet!.visit!;
  const [food, setFood] = useState(visit.food[0]?.key ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const ref = encodeURIComponent(profile.user.publicId);

  async function go(kind: 'pat' | 'feed') {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await api<{ pet: string; rewarded: number }>('POST', `/api/pets/${ref}/visit`, kind === 'feed' ? { kind, item: food } : { kind });
      setMessage(`${kind === 'pat' ? `摸了摸${r.pet}的头` : `喂了${r.pet}一口`}${r.rewarded ? `，你们各得 ${r.rewarded} 龙晶` : ''}。`);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pet-visit">
      <button type="button" className="btn btn-small" disabled={busy} onClick={() => void go('pat')}>
        摸摸头
      </button>
      {visit.food.length > 0 && (
        <>
          <select aria-label="喂什么" value={food} onChange={(e) => setFood(e.target.value)}>
            {visit.food.map((f) => (
              <option key={f.key} value={f.key}>
                {f.name}（{f.count}）
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-small" disabled={busy || !food} onClick={() => void go('feed')}>
            喂一口
          </button>
        </>
      )}
      {visit.visitedToday && !message && <span className="muted">今天来过了</span>}
      {message && <span className="pet-visit-done">{message}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
