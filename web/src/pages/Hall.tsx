import { useCallback, useEffect, useRef, useState } from 'react';
import { CATEGORY_NAME, RELATION_LABEL, SCENARIO_CATEGORIES } from '../../../shared/game';
import { SIZE_LABEL } from '../../../shared/rules2';
import { shopItemOf } from '../../../shared/pets';
import { api, errorMessage, type Announcement, type Credit, type EventView, type Friend, type FriendsList, type HallRoom } from '../api';
import { useAuth } from '../auth';
import { Stamp } from '../components/bits';
import { CurrencySwitch } from '../components/CurrencySwitch';
import { LobbyChat } from '../components/LobbyChat';
import { Avatar, IdentityTag, profilePath } from '../components/people';
import { takeFlash } from '../flash';
import { formatDateTime, formatTime } from '../format';
import { refreshBadges, useLiveEvent, useLiveOpen } from '../live';
import { Link } from '../router';
import { CreditLine, JoinRoomForm } from './Lobby';

// 游戏大厅：登录以后的首页。左边是自己、用对局码加入、在线的好友；中间是公告和公开的对局（自己在的也照常列出来）；
// 右边一整列是大厅聊天，输入框在最下面。「新建对局」在剧本大厅里（V0.5.0）；「我的对局」是单独的一页。
// V0.6.0：公告上面是进行中的限时活动。

/** 没有新动静时，也每隔这么久刷新一次在线人数。 */
const REFRESH_MS = 30_000;

type Panel = 'none' | 'join';

export function HallPage() {
  const { user } = useAuth();
  const [credit, setCredit] = useState<Credit | null>(null);
  const [rooms, setRooms] = useState<HallRoom[] | null>(null);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<Panel>('none');
  const [flash, setFlash] = useState(takeFlash);
  const guest = !!user?.isGuest;

  // 左上角自己的额度（和「我的对局」一起拿）
  const loadCredit = useCallback(async () => {
    if (guest) return;
    try {
      setCredit((await api<{ credit: Credit }>('GET', '/api/rooms')).credit);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [guest]);

  const loadHall = useCallback(async () => {
    try {
      const r = await api<{ rooms: HallRoom[] }>('GET', '/api/hall');
      setRooms(r.rooms);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '游戏大厅 - 龙娘跑团';
    void loadCredit();
    void loadHall();
    const timer = window.setInterval(() => void loadHall(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [loadCredit, loadHall]);

  // 推送：自己的对局有了新动静（额度可能变了）、公开的对局有变化。几条一起来的，稍等一下合并成一次刷新
  const timers = useRef<{ mine?: number; hall?: number }>({});
  const soon = (key: 'mine' | 'hall', fn: () => void) => {
    if (timers.current[key] !== undefined) return;
    timers.current[key] = window.setTimeout(() => {
      timers.current[key] = undefined;
      fn();
    }, 400);
  };
  useEffect(() => () => {
    window.clearTimeout(timers.current.mine);
    window.clearTimeout(timers.current.hall);
  }, []);
  useLiveEvent('rooms-changed', () => soon('mine', () => void loadCredit()));
  useLiveEvent('room-activity', () => soon('mine', () => void loadCredit()));
  useLiveEvent('hall-changed', () => soon('hall', () => void loadHall()));
  useLiveOpen(() => {
    void loadCredit();
    void loadHall();
  });

  const toggle = (next: Panel) => setPanel((current) => (current === next ? 'none' : next));

  return (
    <div className="hall-layout">
      <aside className="hall-left" aria-label="我">
        <MeCard credit={credit} />
        {!guest && (
          <div className="hall-actions">
            <button type="button" className="btn btn-block" aria-expanded={panel === 'join'} onClick={() => toggle('join')}>
              用对局码加入
            </button>
          </div>
        )}
        {!guest && <OnlineFriends />}
      </aside>

      <div className="hall-main">
        <h1 className="visually-hidden">游戏大厅</h1>
        {flash && (
          <div className="flash" role="status">
            <span>{flash}</span>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => setFlash(null)}>
              知道了
            </button>
          </div>
        )}
        {panel === 'join' && <JoinRoomForm onCancel={() => setPanel('none')} />}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <EventBanner />
        <AnnouncementsBox />

        <section className="hall-section" aria-labelledby="public-title">
          <h2 id="public-title" className="section-title">
            公开的对局
          </h2>
          {rooms === null ? (
            <p className="muted">正在加载……</p>
          ) : rooms.length === 0 ? (
            <p className="empty">现在没有公开的对局。</p>
          ) : (
            <FilteredHall rooms={rooms} />
          )}
        </section>

      </div>

      <aside className="hall-right" aria-label="大厅聊天">
        <LobbyChat />
      </aside>
    </div>
  );
}

/** 左上角的自己：头像、名字、额度。游客说明能做什么。 */
function MeCard({ credit }: { credit: Credit | null }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="me-card">
      <div className="me-card-head">
        <Avatar user={user} size={44} />
        <div>
          <p className="me-card-name">
            {user.displayName}
            <IdentityTag identity={user.identity} />
          </p>
          {!user.isGuest && (
            <Link to={profilePath(user.publicId)} className="back">
              我的主页
            </Link>
          )}
        </div>
      </div>
      {!user.isGuest && credit && (
        <div className="me-card-credit">
          <CreditLine credit={credit} />
          <CurrencySwitch />
        </div>
      )}
    </div>
  );
}

/** 在线的好友：点了去私聊。 */
function OnlineFriends() {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const load = useCallback(async () => {
    try {
      setFriends((await api<FriendsList>('GET', '/api/friends')).friends);
    } catch {
      setFriends([]);
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);
  useLiveEvent('friends-changed', () => void load());
  useLiveEvent('dm', () => void load());

  if (!friends) return null;
  const sorted = [...friends].sort((a, b) => Number(b.online) - Number(a.online) || b.unread - a.unread);
  const online = friends.filter((f) => f.online).length;
  return (
    <section className="hall-friends" aria-labelledby="friends-title">
      <h2 id="friends-title" className="side-title">
        好友 <span className="muted">{online} 人在线</span>
      </h2>
      {friends.length === 0 ? (
        <p className="hint">还没有好友。</p>
      ) : (
        <ul className="friend-mini-list">
          {sorted.slice(0, 10).map((f) => (
            <li key={f.publicId}>
              <Link to={`/friends/${encodeURIComponent(f.publicId)}`} className="friend-mini">
                <span className="friend-mini-avatar">
                  <Avatar user={f} size={26} />
                  {f.online && <span className="avatar-online" aria-hidden="true" />}
                </span>
                <span className="friend-mini-name">{f.displayName}</span>
                {f.unread > 0 && <span className="count">{f.unread}</span>}
                <span className="visually-hidden">{f.online ? '在线' : '不在线'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {friends.length > 10 && (
        <Link to="/friends" className="back">
          全部好友
        </Link>
      )}
    </section>
  );
}

/** 公告：最近几条，没读的标出来；点开就算读了。 */
function AnnouncementsBox() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const load = useCallback(async () => {
    try {
      setItems((await api<{ items: Announcement[] }>('GET', '/api/announcements')).items);
    } catch {
      setItems([]);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useLiveEvent<Announcement>('announcement', (a) => setItems((list) => [a, ...(list ?? []).filter((x) => x.id !== a.id)]));

  async function toggle(a: Announcement) {
    setOpen((id) => (id === a.id ? null : a.id));
    if (a.read) return;
    setItems((list) => list?.map((x) => (x.id === a.id ? { ...x, read: true } : x)) ?? list);
    try {
      await api('POST', `/api/announcements/${a.id}/read`);
      void refreshBadges();
    } catch {
      // 标不上已读不影响看
    }
  }

  if (!items || items.length === 0) return null;
  return (
    <section className="hall-section announcements-box" aria-labelledby="announcements-title">
      <h2 id="announcements-title" className="section-title">
        公告
      </h2>
      <ul className="announcement-list">
        {items.slice(0, 3).map((a) => (
          <li key={a.id} className={a.read ? 'announcement' : 'announcement is-unread'}>
            <button type="button" className="announcement-head" aria-expanded={open === a.id} onClick={() => void toggle(a)}>
              <span className="announcement-title">{a.title}</span>
              <span className="entry-time">{formatTime(a.at)}</span>
            </button>
            {open === a.id && <p className="announcement-body">{a.body}</p>}
          </li>
        ))}
      </ul>
      {items.length > 3 && (
        <Link to="/notifications" className="back">
          全部公告
        </Link>
      )}
    </section>
  );
}

/** 公开的对局：点这一行就进去看看（观看），想玩再在里面点「申请加入」（房主同意了才进来）。自己已经在的标着「已加入」，点了直接进去。 */
function HallList({ rooms }: { rooms: HallRoom[] }) {
  return (
    <ul className="room-list">
      {rooms.map((r) => (
        <li key={r.id}>
          <Link to={`/room/${r.id}`} className="room-row">
            <span className="room-row-main">
              <span className="room-row-name">{r.name}</span>
              <span className="room-row-meta">
                {r.joined && <span className="tag">已加入</span>}
                {!r.joined && r.requested && <span className="tag">已申请</span>}
                <span>房主 {r.host}</span>
                <span>
                  {r.members}/{r.limit} 人
                </span>
                {r.status !== 'ended' && (
                  <span className={r.online > 0 ? 'presence is-on' : 'presence'}>
                    <span className="dot" aria-hidden="true" />
                    {r.online} 人在线
                  </span>
                )}
                {r.untimed && <span>不计时</span>}
              </span>
              <span className="hall-scenario">{scenarioLine(r)}</span>
            </span>
            <span className="hall-row-side">
              <Stamp status={r.status} />
              {r.full && r.status !== 'ended' && <span className="hall-full">已满</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

type StatusFilter = 'all' | 'preparing' | 'running';
const STATUS_FILTERS: { key: StatusFilter; name: string }[] = [
  { key: 'all', name: '全部' },
  { key: 'preparing', name: '等人开局' },
  { key: 'running', name: '进行中' },
];

/** 大厅里的公开对局，可以按状态、分区、还能不能加入、名字筛选（V0.7.0）。 */
function FilteredHall({ rooms }: { rooms: HallRoom[] }) {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState<string>('all');
  const [joinable, setJoinable] = useState(false);
  const [text, setText] = useState('');
  const words = text.trim().toLowerCase();
  const shown = rooms.filter((r) => {
    if (status === 'preparing' && r.status !== 'preparing') return false;
    if (status === 'running' && r.status === 'preparing') return false;
    if (category === 'none' && r.scenario) return false;
    if (category !== 'all' && category !== 'none' && r.scenario?.category !== category) return false;
    if (joinable && (r.full || r.joined)) return false;
    if (words && ![r.name, r.host, r.scenario?.title ?? ''].some((x) => x.toLowerCase().includes(words))) return false;
    return true;
  });
  return (
    <>
      <div className="hall-filters" role="group" aria-label="筛选公开的对局">
        <div className="chip-row">
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} type="button" className="chip" aria-pressed={status === f.key} onClick={() => setStatus(f.key)}>
              {f.name}
            </button>
          ))}
        </div>
        <select aria-label="分区" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">全部分区</option>
          {SCENARIO_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
          <option value="none">还没选剧本</option>
        </select>
        <label className="choice hall-filter-check">
          <input type="checkbox" checked={joinable} onChange={(e) => setJoinable(e.target.checked)} />
          <span>只看还能加入的</span>
        </label>
        <input type="search" className="hall-filter-search" placeholder="对局名、剧本、房主" aria-label="搜索" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {shown.length === 0 ? <p className="empty">没有符合条件的对局。</p> : <HallList rooms={shown} />}
    </>
  );
}

function scenarioLine(r: HallRoom): string {
  const s = r.scenario;
  if (!s) return r.generating ? 'AI 正在写剧本' : '还没选剧本';
  const players = s.players.min === s.players.max ? `${s.players.max}` : `${s.players.min}～${s.players.max}`;
  const parts = [`《${s.title}》${s.genre}`, `${players}人`, `预计${s.expectedDays}天`, RELATION_LABEL[s.relation]];
  if (s.category) parts.unshift(s.dungeon ? `${CATEGORY_NAME[s.category]}·难度${s.dungeon.level}·${SIZE_LABEL[s.dungeon.size]}` : CATEGORY_NAME[s.category]);
  if (s.stress) parts.push('有心智规则');
  return parts.join('，');
}

/** 进行中的限时活动（V0.6.0）：活动名、到什么时候、哪些分区龙晶翻倍、限时商品、活动称号。 */
function EventBanner() {
  const [events, setEvents] = useState<EventView[]>([]);
  useEffect(() => {
    api<{ events: EventView[] }>('GET', '/api/limited-events')
      .then((r) => setEvents(r.events))
      .catch(() => setEvents([]));
  }, []);
  if (!events.length) return null;
  return (
    <>
      {events.map((e) => (
        <section key={e.id} className="event-banner" aria-label={`限时活动：${e.name}`}>
          <p className="event-name">{e.name}</p>
          <p className="event-when">到 {formatDateTime(e.endsAt)}</p>
          <ul className="event-perks">
            {e.categories.length > 0 && (
              <li>
                <Link to={`/scenarios?c=${e.categories[0]}`}>{e.categories.map((c) => CATEGORY_NAME[c]).join('、')}</Link>分区的剧本玩完，龙晶翻倍
              </li>
            )}
            {e.title && (
              <li>
                活动期间玩完{e.categories.length > 0 ? `${e.categories.map((c) => CATEGORY_NAME[c]).join('、')}分区的剧本` : ''}，得到称号「{e.title}」
              </li>
            )}
            {e.items.length > 0 && (
              <li>
                <Link to="/shop?t=limited">商城</Link>里有限时的{e.items.map((i) => shopItemOf(i)?.name ?? i).join('、')}
              </li>
            )}
          </ul>
        </section>
      ))}
    </>
  );
}
