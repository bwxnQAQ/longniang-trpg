import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { scheduleTimeText } from '../../../shared/schedule';
import { api, errorMessage, type Announcement, type NotificationItem } from '../api';
import { useAuth } from '../auth';
import { Avatar } from '../components/people';
import { formatTime } from '../format';
import { refreshBadges, useLiveEvent } from '../live';
import { Link, navigate } from '../router';

// 通知和公告：好友申请、对局邀请、对局开始了、反馈的处理结果；管理员发的公告。打开这一页就算都看过了。
// V0.6.0：宠物远行回来、写了日记、有人串门留言，达成成就，作者分成。

const KIND_NAME: Record<string, string> = { report: '举报', feedback: '意见', bug: 'bug 反馈' };

/** 剧本在哪一页：剧本大厅、地下城（V0.7.1）、模组（5E 模组，V1.0.0）。 */
const HALL_PAGES = {
  scenarios: { name: '剧本大厅', path: '/scenarios' },
  dungeons: { name: '地下城', path: '/dungeons' },
  modules: { name: '模组', path: '/modules' },
} as const;

function hallPageOf(d: { category?: unknown; module?: unknown }) {
  return d.module === true ? HALL_PAGES.modules : d.category === 'dungeon' ? HALL_PAGES.dungeons : HALL_PAGES.scenarios;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  /** 打开页面时还没读的：标成已读以后，这一次还用颜色标出来。 */
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [n, a] = await Promise.all([
        api<{ items: NotificationItem[] }>('GET', '/api/notifications'),
        api<{ items: Announcement[] }>('GET', '/api/announcements'),
      ]);
      setItems(n.items);
      setAnnouncements(a.items);
      setFresh(
        (old) =>
          new Set([...old, ...n.items.filter((x) => !x.read).map((x) => `n${x.id}`), ...a.items.filter((x) => !x.read).map((x) => `a${x.id}`)]),
      );
      // 看到了就算读了
      if (n.items.some((x) => !x.read)) await api('POST', '/api/notifications/read', {});
      if (a.items.some((x) => !x.read)) await api('POST', '/api/announcements/read-all');
      void refreshBadges();
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '通知 - 龙娘跑团';
    void load();
  }, [load]);
  useLiveEvent('notification', () => void load());
  useLiveEvent('announcement', () => void load());
  // 在别处（好友页、对局页）同意了申请、加入了对局：这里的按钮跟着换成结果
  useLiveEvent('friends-changed', () => void load());

  return (
    <div className="notifications">
      <div className="page-head">
        <h1>通知</h1>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <section aria-labelledby="notice-title">
        <h2 id="notice-title" className="section-title">
          消息
        </h2>
        {items === null ? (
          <p className="muted">正在加载……</p>
        ) : items.length === 0 ? (
          <p className="empty">还没有消息。</p>
        ) : (
          <ul className="notice-list">
            {items.map((n) => (
              <NoticeRow key={n.id} item={n} fresh={fresh.has(`n${n.id}`)} admin={!!user?.isAdmin} onChanged={() => void load()} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="announce-title" id="announcements">
        <h2 id="announce-title" className="section-title">
          公告
        </h2>
        {announcements === null ? (
          <p className="muted">正在加载……</p>
        ) : announcements.length === 0 ? (
          <p className="empty">还没有公告。</p>
        ) : (
          <AnnouncementList items={announcements} fresh={fresh} />
        )}
      </section>
    </div>
  );
}

/** 先列出最近几条公告，更早的点「更早的公告」再列出来（V0.8.3）。 */
const ANNOUNCEMENTS_SHOWN = 5;

/**
 * 公告（V0.8.3）：打开这一页时还没看过的展开，看过的只显示标题和时间，点一下展开、再点收起。
 * 先列最近 5 条（没看过的不管多早都列出来），更早的点「更早的公告」。
 */
function AnnouncementList({ items, fresh }: { items: Announcement[]; fresh: Set<string> }) {
  /** 点过的：没看过的点了是收起，看过的点了是展开。 */
  const [toggled, setToggled] = useState<Set<number>>(new Set());
  const [all, setAll] = useState(false);
  const isFresh = (a: Announcement) => fresh.has(`a${a.id}`);
  const shown = all ? items : items.filter((a, i) => i < ANNOUNCEMENTS_SHOWN || isFresh(a));
  const hidden = items.length - shown.length;

  function toggle(id: number) {
    setToggled((old) => {
      const next = new Set(old);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <>
      <ul className="announcement-full-list">
        {shown.map((a) => {
          const open = isFresh(a) !== toggled.has(a.id);
          return (
            <li key={a.id} className={isFresh(a) ? 'announcement-full is-unread' : 'announcement-full'}>
              <h3>
                <button type="button" className="announcement-full-head" aria-expanded={open} onClick={() => toggle(a.id)}>
                  <span className="announcement-full-name">{a.title}</span>
                  <span className="announcement-meta">
                    {formatTime(a.at)}
                    {a.by && `，${a.by}发布`}
                  </span>
                </button>
              </h3>
              {open && <p className="pre-line">{a.body}</p>}
            </li>
          );
        })}
      </ul>
      {hidden > 0 && (
        <button type="button" className="btn btn-small btn-quiet announcement-more" onClick={() => setAll(true)}>
          更早的公告（{hidden} 条）
        </button>
      )}
    </>
  );
}

function NoticeRow({ item, fresh, admin, onChanged }: { item: NotificationItem; fresh: boolean; admin: boolean; onChanged: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const d = item.data;
  const from = d.from as { publicId: string; displayName: string; avatar: string | null } | undefined;

  async function act(method: 'POST' | 'DELETE', path: string, after: string, go?: string) {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ roomId?: number }>(method, path);
      setDone(after);
      void refreshBadges();
      if (go) navigate(go);
      else if (r?.roomId) navigate(`/room/${r.roomId}`);
    } catch (err) {
      setError(errorMessage(err));
      // 多半是在别处已经处理过了：重新拿一次，按钮换成现在的结果
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  let text: string;
  let buttons: ReactNode = null;
  const fromName = from?.publicId ? encodeURIComponent(from.publicId) : '';
  switch (item.kind) {
    case 'friend_request':
      text = `${from?.displayName ?? '有人'}想加你好友`;
      buttons =
        item.state === 'friends' ? (
          <span className="muted">已经是好友了</span>
        ) : item.state === 'gone' ? (
          <span className="muted">已经处理过了</span>
        ) : (
          <>
            <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void act('POST', `/api/friends/${fromName}/accept`, '已经是好友了')}>
              同意
            </button>
            <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void act('DELETE', `/api/friends/${fromName}`, '已拒绝')}>
              拒绝
            </button>
          </>
        );
      break;
    case 'friend_accepted':
      text = `${from?.displayName ?? '有人'}同意了你的好友申请`;
      buttons = (
        <Link to={`/friends/${fromName}`} className="btn btn-small">
          私聊
        </Link>
      );
      break;
    case 'room_invite':
      text = `${from?.displayName ?? '有人'}邀请你加入「${d.roomName}」`;
      buttons =
        item.state === 'joined' ? (
          <Link to={`/room/${d.roomId}`} className="btn btn-small">
            进入
          </Link>
        ) : item.state === 'gone' ? (
          <span className="muted">邀请已经失效了</span>
        ) : (
          <>
            <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void act('POST', `/api/rooms/${d.roomId}/invites/accept`, '已加入')}>
              加入
            </button>
            <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void act('POST', `/api/rooms/${d.roomId}/invites/decline`, '已拒绝')}>
              不去
            </button>
          </>
        );
      break;
    case 'join_request':
      text = `${from?.displayName ?? '有人'}申请加入「${d.roomName}」`;
      buttons =
        item.state === 'joined' ? (
          <span className="muted">已经加入了</span>
        ) : item.state === 'gone' ? (
          <span className="muted">已经处理过了</span>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-small btn-primary"
              disabled={busy}
              onClick={() => void act('POST', `/api/rooms/${d.roomId}/join-requests/${fromName}/approve`, '已同意')}
            >
              同意
            </button>
            <button
              type="button"
              className="btn btn-small btn-quiet"
              disabled={busy}
              onClick={() => void act('POST', `/api/rooms/${d.roomId}/join-requests/${fromName}/reject`, '已拒绝')}
            >
              拒绝
            </button>
          </>
        );
      break;
    case 'join_result':
      text = d.approved ? `${d.by ?? '房主'}同意了你加入「${d.roomName}」` : `${d.by ?? '房主'}没有同意你加入「${d.roomName}」`;
      buttons = d.approved ? (
        <Link to={`/room/${d.roomId}`} className="btn btn-small">
          进入
        </Link>
      ) : null;
      break;
    case 'violation_warning':
      text = `警告：${d.message ?? '你写的内容违反了使用规则'}`;
      buttons = (
        <Link to="/rules" className="btn btn-small btn-quiet">
          看规则
        </Link>
      );
      break;
    case 'room_started':
      text = `「${d.roomName}」开始了${d.by && d.by !== '房主' ? `（${d.by}开的局）` : ''}`;
      buttons = (
        <Link to={`/room/${d.roomId}`} className="btn btn-small">
          进入
        </Link>
      );
      break;
    case 'report_reply':
      text = `你提交的${KIND_NAME[d.kind] ?? '反馈'}有了结果：${d.outcomeLabel ?? '已处理'}`;
      buttons = (
        <Link to="/account" className="btn btn-small btn-quiet">
          看看
        </Link>
      );
      break;
    case 'new_report':
      text = `${from?.displayName ?? '有人'}提交了一条${KIND_NAME[d.kind] ?? '反馈'}`;
      buttons = admin ? (
        <Link to="/admin?tab=reports" className="btn btn-small">
          去处理
        </Link>
      ) : null;
      break;
    case 'submission_result': {
      // 地下城的投稿通过了：放在「地下城」页（V0.7.1；以前的通知没写分区，照旧去剧本大厅）；5E 模组放在「模组」页（V1.0.0）
      const page = d.approved ? hallPageOf(d) : HALL_PAGES.scenarios;
      text = d.approved ? `你投稿的《${d.title}》通过了审核，已经放进${page.name}` : `你投稿的《${d.title}》没有通过审核：${d.reason ?? ''}`;
      buttons = (
        <Link to={page.path} className="btn btn-small">
          去{page.name}
        </Link>
      );
      break;
    }
    case 'new_work':
      text = `你关注的${from?.displayName ?? '作者'}有新作品《${d.title}》`;
      buttons = (
        <Link to={d.module || d.category === 'dungeon' ? hallPageOf(d).path : d.category ? `/scenarios?c=${d.category}` : '/scenarios'} className="btn btn-small">
          去看看
        </Link>
      );
      break;
    case 'pet_job_done':
      text = `${d.pet ?? '宠物'}${d.job ? `做完「${d.job}」` : '打工'}回来了，挣了 ${d.pay ?? 0} 龙晶`;
      buttons = (
        <Link to="/pet" className="btn btn-small">
          看看
        </Link>
      );
      break;
    case 'pet_trip_done':
      text = `${d.pet ?? '宠物'}${d.trip ? `「${d.trip}」` : '远行'}回来了，带回 ${d.crystals ?? 0} 龙晶${d.food ? `、一份${d.food}` : ''}，还有一张「${d.place ?? '远方'}」的明信片`;
      buttons = (
        <Link to="/pet" className="btn btn-small">
          看看
        </Link>
      );
      break;
    case 'pet_diary':
      text = `${d.pet ?? '宠物'}写了一篇日记`;
      buttons = (
        <Link to="/pet" className="btn btn-small">
          去看
        </Link>
      );
      break;
    case 'pet_visit':
      text = `${from?.displayName ?? '有人'}来看${d.pet ?? '你的宠物'}，${d.kind === 'feed' ? `喂了它一口${d.item ?? '吃的'}` : '摸了摸它的头'}${d.reward ? `，你得了 ${d.reward} 龙晶` : ''}`;
      break;
    case 'pet_note':
      text = `${from?.displayName ?? '有人'}给${d.pet ?? '你的宠物'}留了言`;
      buttons = user ? (
        <Link to={`/u/${user.publicId}`} className="btn btn-small btn-quiet">
          看看
        </Link>
      ) : null;
      break;
    case 'achievement':
      text = `${d.hidden ? '达成隐藏成就' : '达成成就'}「${d.title ?? ''}」${d.how ? `：${d.how}` : ''}，得到同名称号和 ${d.reward ?? 0} 龙晶`;
      buttons = user ? (
        <Link to={`/u/${user.publicId}`} className="btn btn-small btn-quiet">
          去戴上
        </Link>
      ) : null;
      break;
    case 'author_reward':
      text = `有人玩完了你写的《${d.title ?? ''}》，你得了 ${d.reward ?? 0} 龙晶`;
      break;
    case 'work_review':
      text = `${from?.displayName ?? '有人'}给你的《${d.title ?? ''}》打了 ${d.stars ?? '?'} 星，还写了短评`;
      buttons = (
        <Link to="/scenarios?c=mine" className="btn btn-small">
          看看
        </Link>
      );
      break;
    case 'work_feedback':
      text = `${from?.displayName ?? '有人'}给你的《${d.title ?? ''}》写了反馈`;
      buttons = (
        <Link to="/scenarios?c=mine" className="btn btn-small">
          去看
        </Link>
      );
      break;
    case 'feedback_reply':
      text = `${from?.displayName ?? '作者'}回复了你对《${d.title ?? ''}》的反馈`;
      buttons = (
        <Link to={hallPageOf(d).path} className="btn btn-small">
          去看
        </Link>
      );
      break;
    case 'card_growth':
      text = `「${d.card ?? '角色卡'}」${d.title ? `在《${d.title}》里` : ''}${d.resultLabel ?? '回来了'}，得到 ${d.points ?? 0} 成长点${d.chests ? `、${d.chests} 个宝箱` : ''}${Array.isArray(d.loot) && d.loot.length ? `，带出来${d.loot.join('、')}` : ''}`;
      buttons = (
        <Link to="/characters" className="btn btn-small">
          去看看
        </Link>
      );
      break;
    case 'card5e_done':
      text = `5E 角色「${d.card ?? ''}」${d.title ? `在《${d.title}》里` : ''}${
        d.survived === false ? '没能活着回来，卡照旧' : d.levelUp ? '活着回来了，可以升一级' : d.counted === false ? '活着回来了（这个模组不升级、不带出东西）' : '活着回来了'
      }${Array.isArray(d.loot) && d.loot.length ? `，带出来${d.loot.join('、')}` : ''}`;
      buttons = (
        <Link to="/characters?tab=5e" className="btn btn-small">
          去看看
        </Link>
      );
      break;
    case 'chest':
      text = `玩完${d.title ? `《${d.title}》` : '一局'}，得到一个宝箱`;
      buttons = (
        <Link to="/bag" className="btn btn-small">
          去开
        </Link>
      );
      break;
    case 'legendary':
      text = `拿到了传奇装备「${d.name ?? ''}」${d.title ? `（${d.title}）` : ''}`;
      buttons = (
        <Link to="/bag" className="btn btn-small">
          去看看
        </Link>
      );
      break;
    case 'duel':
      text = `${d.from ?? '有人'}拿角色卡来和你的「${d.card ?? ''}」切磋，${d.won ? '你的卡赢了' : '你的卡输了'}`;
      buttons = (
        <Link to="/characters?tab=duel" className="btn btn-small btn-quiet">
          看看
        </Link>
      );
      break;
    case 'group_added':
      text = `${from?.displayName ?? '有人'}把你拉进了群「${d.name ?? ''}」`;
      buttons = (
        <Link to={`/friends/g/${d.groupId}`} className="btn btn-small">
          去看看
        </Link>
      );
      break;
    case 'item_grant':
      text = `管理员发给你：${d.item ?? '东西'}${typeof d.count === 'number' && d.count > 1 ? ` × ${d.count}` : ''}`;
      buttons = (
        <Link to={d.where === 'wardrobe' ? '/wardrobe' : '/bag'} className="btn btn-small">
          去看看
        </Link>
      );
      break;
    // 约团（V0.8.0）：时间按这台设备的本地时间显示；「列了时间」点进对局时直接打开约团（已经换掉、定下了的就只是进对局）
    case 'schedule_poll':
      text = `${from?.displayName ?? '房主'}在「${d.roomName}」列了${typeof d.count === 'number' ? ` ${d.count} 个` : ''}时间，勾一下能不能来`;
      buttons = (
        <Link to={`/room/${d.roomId}?schedule`} className="btn btn-small">
          去看看
        </Link>
      );
      break;
    case 'schedule_confirmed':
    case 'schedule_reminder': {
      const when = typeof d.startsAt === 'number' ? scheduleTimeText(d.startsAt) : '';
      text = item.kind === 'schedule_confirmed' ? `「${d.roomName}」下次定在 ${when}` : `「${d.roomName}」快开始了：${when}`;
      buttons = (
        <Link to={`/room/${d.roomId}`} className="btn btn-small">
          进入
        </Link>
      );
      break;
    }
    case 'schedule_cancelled':
      text = `「${d.roomName}」取消了定下的时间`;
      buttons = (
        <Link to={`/room/${d.roomId}`} className="btn btn-small btn-quiet">
          看看
        </Link>
      );
      break;
    default:
      text = '新消息';
  }

  return (
    <li className={fresh ? 'notice is-unread' : 'notice'}>
      {from ? <Avatar user={from} size={34} /> : <span className="notice-icon" aria-hidden="true" />}
      <div className="notice-main">
        <p className="notice-text">{text}</p>
        {item.kind === 'report_reply' && d.reply && <p className="notice-reply">管理员回复：{d.reply}</p>}
        <p className="entry-time">{formatTime(item.createdAt)}</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="notice-buttons">{done ? <span className="muted">{done}</span> : buttons}</div>
    </li>
  );
}
