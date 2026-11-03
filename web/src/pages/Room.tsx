import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  api,
  errorMessage,
  modelName,
  type Catchup,
  type GameState,
  type LogEntry,
  type Presence,
  type RoomDetail,
  type RoomStatus,
  type ScenarioDetail,
  type ScenarioJobView,
  type SharedNote,
} from '../api';
import { useAuth } from '../auth';
import { Stamp } from '../components/bits';
import { Modal } from '../components/Modal';
import { setFlash } from '../flash';
import { money, saveFile } from '../format';
import { live, useLiveEvent, useLiveLost, useLiveOpen } from '../live';
import { Link, navigate } from '../router';
import { CatchupPanel } from '../room/Catchup';
import { Composer } from '../room/Composer';
import { HostTools } from '../room/Host';
import { Nearby } from '../room/Nearby';
import { ChatPanel, ModelOptions, NotesPanel, SettingsPanel } from '../room/Panels';
import { RolePicker, SetupPanel } from '../room/Setup';
import { ScheduleBar } from '../room/Schedule';
import { CharacterSheet, CluesPanel } from '../room/Sheet';
import { StoryLog as StoryLogView } from '../room/Story';
import { HighlightsPanel, loadOlderUntil, useHighlights } from '../room/Highlights';
import { ReportDialog } from '../room/ReportDialog';
import { speechTextOf, useSpeech } from '../speech';
import { RateForm } from '../components/Stars';
import { RoomSubmit } from '../components/Submit';
import { currentGameMinutes, useNow } from '../room/time';
import { formatGameTime } from '../../../shared/game';

// 对局页面。左边是故事（准备阶段是开团准备），下面是行动和对白的输入框；
// 右边是「聊天」（成员和场外聊天）、「角色」「线索」「笔记」，房主和管理员多「设置」「主持」。
// 不是成员的人（公开对局的观看者、管理员）只看得到大家都看得到的故事。

type Tab = 'chat' | 'sheet' | 'clues' | 'notes' | 'highlights' | 'settings' | 'host';
const TAB_LABEL: Record<Tab, string> = { chat: '聊天', sheet: '角色', clues: '线索', notes: '笔记', highlights: '名场面', settings: '设置', host: '主持' };

const StoryLog = memo(StoryLogView);

function tabsOf(detail: RoomDetail): Tab[] {
  const { viewer, room } = detail;
  const member = viewer.role !== null;
  const preparing = room.status === 'preparing';
  const tabs: Tab[] = ['chat'];
  if (member && !preparing) tabs.push('sheet', 'clues');
  if (member) tabs.push('notes');
  // 名场面（V0.8.0）：成员收藏的条目
  if (member && !preparing) tabs.push('highlights');
  if (viewer.manager && room.status !== 'ended') tabs.push('settings');
  if (viewer.manager && !preparing) tabs.push('host');
  return tabs;
}

/** 两段记录合在一起：按编号排好，去掉重复的。 */
function mergeEntries(a: LogEntry[], b: LogEntry[]): LogEntry[] {
  const byId = new Map<number, LogEntry>();
  for (const e of a) byId.set(e.id, e);
  for (const e of b) byId.set(e.id, e);
  return [...byId.values()].sort((x, y) => x.id - y.id);
}

/** 场外聊天（问主持人的问题和回答也是场外的，但跟着行动放在故事那边）。 */
const isChat = (e: LogEntry) => e.kind === 'ooc' && e.data?.type !== 'question' && e.data?.type !== 'answer';

const lastChatIdOf = (list: LogEntry[]) => list.reduce((m, e) => (isChat(e) && e.id > m ? e.id : m), 0);

export function RoomPage({ id }: { id: number }) {
  const { user } = useAuth();
  const meId = user?.id ?? 0;
  const [rawDetail, setDetail] = useState<RoomDetail | null>(null);
  // 在线情况以推送为准：连上时服务器马上推一次，之后谁上线、下线都会推（页面信息可能是连上之前拉的，会过时）
  const [livePresence, setLivePresence] = useState<Presence | null>(null);
  const wentOffline = useRef(new Map<number, number>());
  const detail = useMemo(() => {
    if (!rawDetail || !livePresence) return rawDetail;
    return {
      ...rawDetail,
      presence: livePresence,
      members: rawDetail.members.map((m) => ({
        ...m,
        online: livePresence.online.includes(m.userId),
        lastSeenAt: wentOffline.current.get(m.userId) ?? m.lastSeenAt,
      })),
    };
  }, [rawDetail, livePresence]);
  const [game, setGame] = useState<GameState | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [gameFetchedAt, setGameFetchedAt] = useState(0);
  // 朗读（V0.6.0）：叙述旁边的按钮念一段；开了「自动朗读」的，新来的叙述自动念
  const speech = useSpeech(game?.style.language ?? 'zh');
  const speechRef = useRef(speech);
  speechRef.current = speech;
  const [error, setError] = useState('');
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const entriesRef = useRef<LogEntry[]>([]);
  entriesRef.current = entries;
  const [hasMore, setHasMore] = useState(false);
  const [tab, setTab] = useState<Tab | null>(null);
  /** 从记录里点了「告诉别人」的线索。 */
  const [clueFocus, setClueFocus] = useState<string | null>(null);
  /** 看到的最后一条场外聊天：比它新的、别人发的算未读。 */
  const [chatSeen, setChatSeen] = useState(0);
  const [confirming, setConfirming] = useState<'end' | 'delete' | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [asking, setAsking] = useState(false);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);
  const [catchup, setCatchup] = useState<Catchup | null>(null);
  const [catchupDismissed, setCatchupDismissed] = useState(false);
  const [jumpToSeen, setJumpToSeen] = useState(0);
  const [scenarioJob, setScenarioJob] = useState<ScenarioJobView | null>(null);

  // 新的任务、同一个任务的新进度才换上去，晚到的旧推送不管
  const applyJob = useCallback((job: ScenarioJobView | null) => {
    setScenarioJob((current) => (!job || !current || job.id >= current.id ? job : current));
  }, []);
  const loadJob = useCallback(async () => {
    try {
      applyJob((await api<{ job: ScenarioJobView | null }>('GET', `/api/rooms/${id}/scenario/job`)).job);
    } catch {
      // 拿不到进度不影响别的，下次推送时再更新
    }
  }, [id, applyJob]);

  // 对局被删掉以后回到大厅。自己删的和收到推送的可能同时发生，只走一次
  const deletingRef = useRef(false);
  const left = useRef(false);
  const leaveDeleted = useCallback((name: string, by: string) => {
    if (left.current) return;
    left.current = true;
    setFlash(deletingRef.current ? `已删除「${name}」` : `${by}删除了「${name}」`);
    navigate('/', { replace: true });
  }, []);

  const loadDetail = useCallback(async () => {
    try {
      setDetail(await api<RoomDetail>('GET', `/api/rooms/${id}`));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id]);

  const applyGame = useCallback((g: GameState) => {
    setGame(g);
    setServerOffset(g.now - Date.now());
    setGameFetchedAt(Date.now());
  }, []);

  const loadGame = useCallback(async () => {
    try {
      applyGame(await api<GameState>('GET', `/api/rooms/${id}/game`));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id, applyGame]);

  // 推送里的“成员变了”可能一下来好几个，合并成一次重新拉取
  const detailTimer = useRef<number | undefined>(undefined);
  const scheduleDetail = useCallback(() => {
    window.clearTimeout(detailTimer.current);
    detailTimer.current = window.setTimeout(() => void loadDetail(), 150);
  }, [loadDetail]);
  useEffect(() => () => window.clearTimeout(detailTimer.current), []);

  // 推送里的“状态变了”可能一下来好几个，合并成一次重新拉取
  const gameTimer = useRef<number | undefined>(undefined);
  const scheduleGame = useCallback(() => {
    window.clearTimeout(gameTimer.current);
    gameTimer.current = window.setTimeout(() => void loadGame(), 120);
  }, [loadGame]);
  useEffect(() => () => window.clearTimeout(gameTimer.current), []);

  /** 最新的一页记录。replace：整个换掉（身份变了，能看到的不一样了）；否则和已有的合在一起（重连以后补上错过的）。 */
  const loadLatestLog = useCallback(
    async (replace: boolean) => {
      try {
        const r = await api<{ entries: LogEntry[]; hasMore: boolean }>('GET', `/api/rooms/${id}/log`);
        if (replace) {
          setEntries(r.entries);
          setHasMore(r.hasMore);
          setChatSeen(lastChatIdOf(r.entries));
          return;
        }
        // 还什么都没有（刚打开页面）：“还有更早的”和“看到哪条聊天”按这一页算
        if (!entriesRef.current.length) {
          setHasMore(r.hasMore);
          setChatSeen((seen) => seen || lastChatIdOf(r.entries));
        }
        setEntries((list) => mergeEntries(list, r.entries));
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [id],
  );

  const isMember = detail ? detail.viewer.role !== null : false;
  const loadSharedNotes = useCallback(async () => {
    try {
      setSharedNotes((await api<{ notes: SharedNote[] }>('GET', `/api/rooms/${id}/shared-notes`)).notes);
    } catch {
      // 拿不到别人分享的笔记不影响玩，下次推送或重连时再拉
    }
  }, [id]);

  useEffect(() => {
    void loadDetail();
    void loadGame();
    void loadJob();
    void loadLatestLog(false);
  }, [loadDetail, loadGame, loadJob, loadLatestLog]);

  // 成员才有：别人分享的笔记、上次离开以后发生的事（页面一打开就拉，之后不再变，下次离开时才重新算）
  useEffect(() => {
    if (!isMember) return;
    void loadSharedNotes();
    api<Catchup>('GET', `/api/rooms/${id}/catchup`)
      .then(setCatchup)
      .catch(() => setCatchup(null));
  }, [isMember, id, loadSharedNotes]);

  // 打开对局页面就连这一局的推送：成员连着就算“在这一局在线”。离开时换回全站的推送
  useEffect(() => {
    live.use(`/api/rooms/${id}/events`);
    return () => {
      if (live.current) live.useLobby();
    };
  }, [id]);

  const name = detail?.room.name;
  useEffect(() => {
    if (name) document.title = `${name} - 龙娘跑团`;
  }, [name]);

  const addEntry = useCallback((entry: LogEntry) => {
    const fresh = !entriesRef.current.some((x) => x.id === entry.id);
    setEntries((list) => (list.some((x) => x.id === entry.id) ? list : [...list, entry]));
    const s = speechRef.current;
    if (fresh && s.auto && s.speak) {
      const text = speechTextOf(entry);
      if (text) s.speak(text, true);
    }
    if (entry.data?.type === 'answer' || (entry.kind === 'system' && entry.private && entry.text.startsWith('主持人暂时回答不了'))) {
      setAsking(false);
    }
  }, []);

  const presenceRef = useRef<Presence | null>(null);
  useLiveEvent<Presence>('presence', (p) => {
    if (p.roomId !== id) return;
    // 刚下线的人：“上次在线”写成现在
    for (const userId of presenceRef.current?.online ?? []) if (!p.online.includes(userId)) wentOffline.current.set(userId, Date.now());
    presenceRef.current = p;
    setLivePresence(p);
  });
  useLiveEvent<LogEntry>('log', addEntry);
  // 房主或管理员撤回了一次结算：那次的叙述从记录里去掉
  useLiveEvent<{ ids: number[] }>('log-removed', ({ ids }) => setEntries((list) => list.filter((x) => !ids.includes(x.id))));
  useLiveEvent<{ roomId?: number }>('members', (data) => {
    if (data?.roomId === undefined || data.roomId === id) scheduleDetail();
  });
  useLiveEvent('game', () => scheduleGame());
  useLiveEvent<{ roomId?: number; status: RoomStatus; isPublic?: boolean; untimed?: boolean }>('room', (data) => {
    if (data.roomId !== undefined && data.roomId !== id) return;
    // 在观看的人：这一局取消了公开，就看不了了，回大厅
    if (data.isPublic === false && detail?.viewer.watching && !detail.viewer.manager && !left.current) {
      left.current = true;
      setFlash(`「${detail.room.name}」取消了公开，不能再观看了`);
      navigate('/', { replace: true });
      return;
    }
    setDetail((d) => d && { ...d, room: { ...d.room, status: data.status, isPublic: data.isPublic ?? d.room.isPublic, untimed: data.untimed ?? d.room.untimed } });
    scheduleGame();
  });
  useLiveEvent<{ roomId?: number; name: string; by?: string }>('deleted', (data) => {
    if (data.roomId !== undefined && data.roomId !== id) return;
    leaveDeleted(data.name, data.by ?? '房主');
  });
  useLiveEvent<{ afterId: number; untilId: number; summary: string | null }>('catchup', (data) => {
    setCatchup((c) => (c && c.afterId === data.afterId && c.untilId === data.untilId ? { ...c, summary: data.summary, summarizing: false } : c));
  });
  useLiveEvent<SharedNote>('shared-note', (note) => setSharedNotes((list) => [note, ...list.filter((n) => n.author.id !== note.author.id)]));
  useLiveEvent<{ authorId: number }>('shared-note-removed', ({ authorId }) => setSharedNotes((list) => list.filter((n) => n.author.id !== authorId)));
  useLiveEvent<ScenarioJobView>('scenario-job', applyJob);
  // 服务器不让连这一局了（取消了公开、管理员被收回了权限）：重新拉一次，看不了就显示原因；还能看就重新连（隔一会儿才再试）
  const lastRetry = useRef(0);
  useLiveLost(() => {
    api<RoomDetail>('GET', `/api/rooms/${id}`)
      .then((d) => {
        setDetail(d);
        if (Date.now() - lastRetry.current < 10_000) return;
        lastRetry.current = Date.now();
        live.restart();
      })
      .catch((err) => {
        setError(errorMessage(err));
        setDetail(null);
      });
  });
  // 连上、断线重连以后补上错过的
  useLiveOpen(() => {
    scheduleGame();
    void loadDetail();
    void loadJob();
    void loadLatestLog(false);
    if (isMember) void loadSharedNotes();
  });

  const loadOlder = useCallback(async () => {
    const first = entries[0];
    if (!first) return;
    try {
      const r = await api<{ entries: LogEntry[]; hasMore: boolean }>('GET', `/api/rooms/${id}/log?before=${first.id}`);
      setEntries((list) => mergeEntries(r.entries, list));
      setHasMore(r.hasMore);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [entries, id]);

  // 摘要在后台写，写好会推过来；推送可能赶在页面连上之前发出，所以也每隔几秒问一次，最多问两分钟
  const waitingSummary = catchup?.summarizing && !catchup.summary ? catchup.untilId : null;
  useEffect(() => {
    if (waitingSummary === null) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      api<Catchup>('GET', `/api/rooms/${id}/catchup?until=${waitingSummary}`)
        .then((next) => {
          if (!next.summary && next.summarizing && tries < 40) return;
          setCatchup((c) => (c && c.untilId === next.untilId && c.afterId === next.afterId ? { ...c, summary: next.summary, summarizing: false } : c));
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(timer);
  }, [waitingSummary, id]);

  // “在记录里看”：分界线那一段还没加载的话，先往前加载到那里（最多20页），再收起“你不在的时候”跳过去
  const afterId = catchup?.afterId ?? null;
  const jumpToSeenEntry = useCallback(async () => {
    if (afterId === null) return;
    let older: LogEntry[] = [];
    let first = entries[0]?.id ?? null;
    let more = hasMore;
    try {
      for (let i = 0; i < 20 && more && first !== null && first > afterId; i++) {
        const r = await api<{ entries: LogEntry[]; hasMore: boolean }>('GET', `/api/rooms/${id}/log?before=${first}`);
        older = [...r.entries, ...older];
        more = r.hasMore;
        first = r.entries[0]?.id ?? null;
      }
    } catch (err) {
      setError(errorMessage(err));
      return;
    }
    if (older.length) {
      setEntries((list) => mergeEntries(older, list));
      setHasMore(more);
    }
    setCatchupDismissed(true);
    setJumpToSeen((n) => n + 1);
  }, [afterId, entries, hasMore, id]);

  // 场外聊天单独放在「聊天」里；准备阶段左边是开团准备，系统消息（谁选好了身份）也放在聊天里
  const preparing = detail?.room.status === 'preparing';
  const storyEntries = useMemo(() => entries.filter((e) => !isChat(e)), [entries]);
  const chatEntries = useMemo(() => entries.filter((e) => isChat(e) || (preparing && e.kind === 'system')), [entries, preparing]);
  const lastChatId = useMemo(() => lastChatIdOf(entries), [entries]);

  // 名场面（V0.8.0）：记录里的星标、右边的列表；点一条跳到记录里那一条（没加载到的先往前加载）
  const highlights = useHighlights(id, isMember && !preparing, setActionError);
  const [focusEntry, setFocusEntry] = useState<{ id: number; seq: number } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const jumpToEntry = useCallback(
    async (logId: number) => {
      try {
        const r = await loadOlderUntil(id, entries, hasMore, logId);
        if (r.older.length) {
          setEntries((list) => mergeEntries(r.older, list));
          setHasMore(r.more);
        }
        if (r.found) setFocusEntry((f) => ({ id: logId, seq: (f?.seq ?? 0) + 1 }));
        return r.found;
      } catch (err) {
        setActionError(errorMessage(err));
        return false;
      }
    },
    [id, entries, hasMore],
  );

  const tabs = detail ? tabsOf(detail) : [];
  const defaultTab: Tab = isMember && !preparing ? 'sheet' : 'chat';
  const currentTab: Tab = tab && tabs.includes(tab) ? tab : defaultTab;
  useEffect(() => {
    if (currentTab === 'chat') setChatSeen((seen) => Math.max(seen, lastChatId));
  }, [currentTab, lastChatId]);
  const unreadChat = currentTab === 'chat' ? 0 : entries.filter((e) => isChat(e) && e.id > chatSeen && e.author?.id !== meId).length;

  const shareClue = useCallback((key: string) => {
    setClueFocus(key);
    setTab('clues');
  }, []);

  async function changeStatus(next: Exclude<RoomStatus, 'preparing'>) {
    setActionBusy(true);
    setActionError('');
    try {
      const r = await api<{ status: RoomStatus }>('POST', `/api/rooms/${id}/status`, { status: next });
      setDetail((d) => d && { ...d, room: { ...d.room, status: r.status } });
      setConfirming(null);
      void loadGame();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setActionBusy(false);
    }
  }

  const [exporting, setExporting] = useState(false);
  async function exportLog() {
    setExporting(true);
    setActionError('');
    try {
      const r = await api<{ filename: string; content: string }>('GET', `/api/rooms/${id}/export`);
      saveFile(r.filename, r.content, 'text/markdown;charset=utf-8');
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  async function deleteRoom(roomName: string) {
    setActionBusy(true);
    setActionError('');
    deletingRef.current = true;
    try {
      await api('DELETE', `/api/rooms/${id}`);
      leaveDeleted(roomName, '');
    } catch (err) {
      deletingRef.current = false;
      setActionError(errorMessage(err));
      setActionBusy(false);
    }
  }

  /** 加入了（房主同意了申请、房主邀请过直接进来）：按成员的身份重新连推送、重新拉记录。 */
  const becomeMember = useCallback(async () => {
    live.restart();
    await Promise.all([loadDetail(), loadGame(), loadLatestLog(true)]);
  }, [loadDetail, loadGame, loadLatestLog]);

  /** 观看的人申请加入这一局（公开的对局，房主同意了才进来）；再点一次撤回申请。 */
  async function joinGame(cancel = false) {
    setActionBusy(true);
    setActionError('');
    try {
      if (cancel) {
        await api('DELETE', `/api/hall/${id}/join`);
        await loadDetail();
      } else {
        const r = await api<{ requested?: boolean; alreadyMember?: boolean }>('POST', `/api/hall/${id}/join`);
        if (r.requested) await loadDetail();
        else await becomeMember();
      }
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setActionBusy(false);
    }
  }

  // 房主处理了我的加入申请：同意了就按成员进来，拒绝了申请的按钮换回来
  useLiveEvent<{ kind: string; data: { roomId?: number; approved?: boolean } }>('notification', (n) => {
    if (n.kind !== 'join_result' || n.data.roomId !== id) return;
    if (n.data.approved) void becomeMember();
    else void loadDetail();
  });

  if (!detail || !game) {
    return error ? (
      <div className="page-error">
        <p className="form-error" role="alert">
          {error}
        </p>
        <Link to="/">回到大厅</Link>
      </div>
    ) : (
      <p className="muted">正在加载……</p>
    );
  }

  const { room, members, presence, viewer } = detail;
  const watching = viewer.role === null;
  const manager = viewer.manager;
  const me = game.me;
  const live_ = room.status === 'running' || room.status === 'paused';
  const emptyText = watching ? '故事还没开始，或者还没有大家都看得到的内容。' : '故事会从这里开始。';

  const hasCatchup = !!catchup && catchup.items.length > 0 && !preparing;
  const showCatchup = hasCatchup && !catchupDismissed;
  // 收起“你不在的时候”以后，记录里的分界线还留着，直到离开这个页面
  const seenUntil = hasCatchup ? catchup.afterId : null;
  // “上次看到这里”那条分界线已经在加载出来的记录里
  const boundaryLoaded =
    seenUntil !== null && storyEntries.some((e) => e.id > seenUntil) && (!hasMore || storyEntries.some((e) => e.id <= seenUntil));
  const canPickRole = !watching && !me && !!game.scenario && live_;
  // AI 演的身份（V0.8.0）开局以后可以接替，也算还有身份可选
  const rolesLeft = game.scenario ? game.scenario.roles.some((r) => !r.takenBy || game.companions.some((c) => c.roleKey === r.key)) : false;

  return (
    // room-story：开局以后左边是正文（V1.0.2，正文区域有最小高度，见 room.css）
    <div className={preparing ? 'room' : 'room room-story'}>
      <header className="room-head">
        <Link to="/" className="back">
          大厅
        </Link>
        <div className="room-title-row">
          <h1 className="room-title">{room.name}</h1>
          <Stamp status={room.status} />
          {game.scenario && <span className="room-scenario">《{game.scenario.title}》</span>}
          {watching && <span className="tag tag-watch">观看中</span>}
          {/* 约团（V0.8.0）：下次的时间、正在约的；成员才有，结束了的不显示 */}
          {!watching && room.status !== 'ended' && <ScheduleBar roomId={id} isHost={room.isHost} />}
        </div>
        <div className="room-facts">
          {!preparing && room.status !== 'ended' && <ModeBadge presence={presence} />}
          {game.clock && <GameClock clock={game.clock} fetchedAt={gameFetchedAt} />}
          <span className="fact" title="这一局的主持 AI 用的模型">
            主持：{modelName(game.dmModel.current, game.dmModel.options)}
          </span>
          <span className="fact">
            {members.length}/{room.maxPlayers} 人
          </span>
          {game.cost !== null && (
            <span className="fact" title="这一局到现在的 AI 费用">
              这一局已花费 {money(game.cost)}
            </span>
          )}
          {!watching && !game.credit.unlimited && (
            <span
              className={game.credit.remaining !== null && game.credit.remaining <= 0 ? 'fact fact-alert' : 'fact'}
              title={`你的 AI 额度：已用 ${money(game.credit.spent)}，共 ${money(game.credit.total)}`}
            >
              {game.credit.remaining !== null && game.credit.remaining <= 0 ? '你的 AI 额度用完了' : `你的额度剩 ${money(game.credit.remaining ?? 0)}`}
            </span>
          )}
          {!preparing && !watching && (
            <button type="button" className="btn btn-small btn-quiet" disabled={exporting} onClick={() => void exportLog()} title="存成 Markdown 文件">
              {exporting ? '正在导出……' : '导出团录'}
            </button>
          )}
          {!preparing && !watching && (
            <button type="button" className="btn btn-small btn-quiet" onClick={() => setReportOpen(true)}>
              战报
            </button>
          )}
          {!preparing && speech.supported && (
            <button
              type="button"
              className={speech.auto ? 'btn btn-small btn-quiet is-on' : 'btn btn-small btn-quiet'}
              aria-pressed={speech.auto}
              onClick={() => speech.setAuto(!speech.auto)}
              title="新来的叙述自动念出来"
            >
              {speech.auto ? '自动朗读中' : '自动朗读'}
            </button>
          )}
          {speech.speaking && (
            <button type="button" className="btn btn-small btn-quiet" onClick={speech.stop}>
              停止朗读
            </button>
          )}
          {manager && (
            <ManagerControls
              status={room.status}
              busy={actionBusy}
              by={viewer.role === 'host' ? null : viewer.by}
              onStart={() => setStartOpen(true)}
              onChange={(next) => (next === 'ended' ? setConfirming('end') : void changeStatus(next))}
              onDelete={() => setConfirming('delete')}
            />
          )}
        </div>
        {confirming && (
          <div className="confirm-bar" role="alertdialog" aria-labelledby="confirm-text">
            <p id="confirm-text">
              {confirming === 'delete'
                ? `删除「${room.name}」？聊天记录、笔记和所有进度会一起删掉，所有成员都看不到了，不能恢复。`
                : `结束「${room.name}」？结束以后不能再继续，记录会保留。`}
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-small btn-danger-solid"
                disabled={actionBusy}
                onClick={() => void (confirming === 'delete' ? deleteRoom(room.name) : changeStatus('ended'))}
              >
                {confirming === 'delete' ? '确认删除' : '确认结束'}
              </button>
              <button type="button" className="btn btn-small btn-quiet" onClick={() => setConfirming(null)} autoFocus>
                取消
              </button>
            </div>
          </div>
        )}
        {actionError && (
          <p className="form-error" role="alert">
            {actionError}
          </p>
        )}
        {!game.ai.ready && room.status !== 'ended' && !watching && (
          <p className="ai-warning" role="status">
            {game.ai.message}
          </p>
        )}
        {room.frozen && room.status !== 'ended' && (
          <p className="ai-warning" role="status">
            这一局有成员被封号了，冻结到他解封以后才能继续。
          </p>
        )}
      </header>

      <div className="room-body">
        <section className={preparing ? 'story setup-column' : 'story'} aria-label={preparing ? '开团准备' : '故事'}>
          {watching && (
            <WatchBanner detail={detail} guest={!!user?.isGuest} busy={actionBusy} onJoin={() => void joinGame()} onCancel={() => void joinGame(true)} />
          )}
          {preparing ? (
            <SetupPanel
              roomId={id}
              detail={detail}
              game={game}
              onGame={applyGame}
              onStart={() => setStartOpen(true)}
              job={scenarioJob}
              onJob={applyJob}
            />
          ) : (
            <>
              {showCatchup && <CatchupPanel catchup={catchup} onDismiss={() => setCatchupDismissed(true)} onJump={() => void jumpToSeenEntry()} />}
              <StoryLog
                entries={storyEntries}
                hasMore={hasMore}
                onLoadMore={loadOlder}
                resolving={game.resolving}
                emptyText={emptyText}
                seenUntil={boundaryLoaded ? seenUntil : null}
                jump={jumpToSeen}
                meId={meId}
                canReport={!user?.isGuest}
                onShareClue={!watching && me && !me.dead && live_ ? shareClue : null}
                speak={speech.speak}
                label="故事"
                highlight={highlights.tools}
                focus={focusEntry}
              />
              {me && live_ && !me.dead && <Nearby roomId={id} game={game} onChanged={() => void loadGame()} />}
              {me && room.status === 'ended' && game.scenario?.source === 'builtin' && <Replay roomId={id} dungeon={!!game.scenario.dungeon} />}
              {me && room.status === 'ended' && game.scenario?.source === 'builtin' && <EndingRating scenarioKey={game.scenario.key} title={game.scenario.title} />}
              {/* 自己玩了一遍 AI 生成、导入的剧本（V0.9.2）：结束以后一键投稿 */}
              {room.isHost && room.status === 'ended' && game.scenario && game.scenario.source !== 'builtin' && (
                <RoomSubmit roomId={id} scenario={game.scenario} variant="ending" />
              )}
              {me ? (
                <Composer
                  roomId={id}
                  status={room.status}
                  game={game}
                  serverOffset={serverOffset}
                  asking={asking}
                  onAsked={() => setAsking(true)}
                  onChanged={() => void loadGame()}
                />
              ) : (
                canPickRole && (
                  <div className="late-join">
                    {rolesLeft ? (
                      <>
                        <p>你还没有角色。</p>
                        <button type="button" className="btn btn-primary" onClick={() => setPickOpen(true)}>
                          选身份加入
                        </button>
                      </>
                    ) : (
                      <p>这个剧本的身份都有人选了。</p>
                    )}
                  </div>
                )
              )}
            </>
          )}
        </section>

        <aside className="side">
          <div className="tabs" role="tablist" aria-label="对局信息">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                id={`tab-${t}`}
                aria-selected={currentTab === t}
                aria-controls={`panel-${t}`}
                className="tab"
                onClick={() => {
                  setTab(t);
                  if (t !== 'clues') setClueFocus(null);
                }}
              >
                {TAB_LABEL[t]}
                {t === 'chat' && unreadChat > 0 && (
                  <span className="tab-count tab-count-new" title="新的场外聊天">
                    {unreadChat > 99 ? '99+' : unreadChat}
                  </span>
                )}
                {t === 'clues' && game.clues.length > 0 && <span className="tab-count">{game.clues.length}</span>}
                {t === 'settings' && detail.joinRequests.length > 0 && (
                  <span className="tab-count tab-count-new" title="申请加入的人">
                    {detail.joinRequests.length}
                  </span>
                )}
                {t === 'notes' && sharedNotes.length > 0 && (
                  <span className="tab-count" title="别人分享给你的笔记">
                    {sharedNotes.length}
                  </span>
                )}
                {t === 'highlights' && highlights.items.length > 0 && <span className="tab-count">{highlights.items.length}</span>}
              </button>
            ))}
          </div>
          {tabs.map((t) => (
            <div
              key={t}
              className={t === 'chat' ? 'tab-panel tab-panel-chat' : 'tab-panel'}
              role="tabpanel"
              id={`panel-${t}`}
              aria-labelledby={`tab-${t}`}
              hidden={currentTab !== t}
            >
              {t === 'chat' && (
                <ChatPanel
                  detail={detail}
                  game={game}
                  meId={meId}
                  entries={chatEntries}
                  hasMore={hasMore}
                  onLoadMore={loadOlder}
                  onSent={addEntry}
                  canChat={!watching}
                />
              )}
              {t === 'sheet' && <CharacterSheet game={game} roomId={id} canGive={room.status === 'running'} onChanged={() => void loadGame()} />}
              {t === 'clues' && (
                <CluesPanel
                  roomId={id}
                  clues={game.clues}
                  hasCharacter={!!me}
                  others={game.others.filter((o) => !o.dead)}
                  canShare={live_ && !!me && !me.dead}
                  focusKey={clueFocus}
                />
              )}
              {t === 'notes' && <NotesPanel roomId={id} members={members} meId={meId} sharedNotes={sharedNotes} />}
              {t === 'highlights' && <HighlightsPanel items={highlights.items} onJump={jumpToEntry} onRemove={highlights.remove} />}
              {t === 'settings' && currentTab === 'settings' && <SettingsPanel detail={detail} game={game} onDetail={setDetail} onGame={applyGame} />}
              {t === 'host' && currentTab === 'host' && (
                <HostTools
                  roomId={id}
                  full={watching}
                  status={room.status}
                  clock={game.clock ? currentGameMinutes(game.clock, gameFetchedAt, Date.now()) : null}
                  stressRule={game.scenario?.stress ?? false}
                  refreshKey={gameFetchedAt}
                />
              )}
            </div>
          ))}
        </aside>
      </div>

      {startOpen && (
        <StartDialog
          detail={detail}
          game={game}
          onClose={() => setStartOpen(false)}
          onStarted={(status) => {
            setStartOpen(false);
            setDetail((d) => d && { ...d, room: { ...d.room, status } });
            void loadGame();
          }}
        />
      )}
      {reportOpen && <ReportDialog roomId={id} onClose={() => setReportOpen(false)} />}
      {pickOpen && game.scenario && (
        <Modal open onClose={() => setPickOpen(false)} title="选身份加入故事" wide>
          <RolePicker
            roomId={id}
            game={game}
            late
            onSaved={(g) => {
              applyGame(g);
              setPickOpen(false);
              void loadDetail();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

/** 不在这一局里、只是在看：说明看得到什么；公开的对局可以直接加入。 */
function WatchBanner({
  detail,
  guest,
  busy,
  onJoin,
  onCancel,
}: {
  detail: RoomDetail;
  guest: boolean;
  busy: boolean;
  onJoin: () => void;
  onCancel: () => void;
}) {
  const { room } = detail;
  const full = detail.members.length >= room.maxPlayers;
  const open = room.isPublic && room.status !== 'ended';
  return (
    <div className="watch-banner" role="note">
      <div className="watch-banner-text">
        <p>
          <strong>你在观看这一局。</strong>
        </p>
        {!guest && open && full && <p className="hint">这一局人满了。</p>}
      </div>
      {!guest && open && !full && detail.viewer.requested && (
        <div className="watch-banner-actions">
          <span className="muted">已经申请加入，等房主同意</span>
          <button type="button" className="btn btn-quiet" disabled={busy} onClick={onCancel}>
            撤回申请
          </button>
        </div>
      )}
      {!guest && open && !full && !detail.viewer.requested && (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onJoin}>
          申请加入
        </button>
      )}
    </div>
  );
}

/** 开局：看看谁准备好了，选这一局的主持模型。 */
function StartDialog({
  detail,
  game,
  onClose,
  onStarted,
}: {
  detail: RoomDetail;
  game: GameState;
  onClose: () => void;
  onStarted: (status: RoomStatus) => void;
}) {
  const [model, setModel] = useState(game.dmModel.chosen ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ready = detail.members.filter((m) => m.characterName);
  const waiting = detail.members.filter((m) => !m.characterName);
  const players = game.scenario?.players ?? null;
  // 交给 AI 演的身份（V0.8.0）也算在人数里
  const companions = game.companions ?? [];
  const below = players !== null && ready.length > 0 && ready.length + companions.length < players.min;

  async function start() {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ status: RoomStatus }>('POST', `/api/rooms/${detail.room.id}/status`, { status: 'running', dmModel: model || null });
      onStarted(r.status);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`开始「${detail.room.name}」`}>
      <div className="start-dialog">
        {!game.scenario ? (
          <p className="form-error">还没选剧本，选好剧本才能开始。</p>
        ) : ready.length === 0 ? (
          <p className="form-error">还没有人选身份，至少要有一个角色才能开始。</p>
        ) : (
          <p>
            {ready.length} 个角色准备好了：{ready.map((m) => `${m.characterName}（${m.displayName}）`).join('、')}。
          </p>
        )}
        {game.scenario && companions.length > 0 && (
          <p>AI 来演：{companions.map((c) => (c.name === c.roleName ? c.name : `${c.name}（${c.roleName}）`)).join('、')}。</p>
        )}
        {waiting.length > 0 && <p className="hint">{waiting.map((m) => m.displayName).join('、')}还没选身份。</p>}
        {below && players && (
          <p className="start-warning">
            剧本建议 {players.min === players.max ? players.min : `${players.min}～${players.max}`} 人，现在只有 {ready.length} 个角色
            {companions.length > 0 && `和 ${companions.length} 个 AI 队友`}。
          </p>
        )}
        <h3 className="start-dialog-title">这一局的主持模型</h3>
        <ModelOptions name="start-model" options={game.dmModel.options} siteDefault={game.dmModel.siteDefault} value={model} disabled={busy} onChange={setModel} />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn-primary" disabled={busy || !game.scenario || ready.length === 0} onClick={() => void start()}>
            {busy ? '正在开始……' : '开始对局'}
          </button>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </Modal>
  );
}

function GameClock({ clock, fetchedAt }: { clock: NonNullable<GameState['clock']>; fetchedAt: number }) {
  const now = useNow(clock.running ? 1000 : null);
  const minutes = currentGameMinutes(clock, fetchedAt, now);
  return (
    <span className="game-clock" title={clock.running ? '游戏时间跟着现实时间走' : '游戏时间现在停着（回合模式、暂停或已结束）'}>
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="6.2" />
        <path d="M8 4.6V8l2.4 1.6" />
      </svg>
      {formatGameTime(minutes)}
      {!clock.running && <span className="visually-hidden">（时间停着）</span>}
    </span>
  );
}

function ModeBadge({ presence }: { presence: Presence }) {
  if (presence.mode === 'timed') return <span className="mode mode-timed">有人不在线：计时模式</span>;
  if (presence.untimed && !presence.allOnline) return <span className="mode mode-round">不计时：人不齐也照样结算</span>;
  return <span className="mode mode-round">全员在线：回合模式</span>;
}

/** 房主和管理员的按钮：开始、暂停、继续、结束、删除。by：不是房主时，以什么身份在管（管理员、站长）。 */
function ManagerControls({
  status,
  busy,
  by,
  onStart,
  onChange,
  onDelete,
}: {
  status: RoomStatus;
  busy: boolean;
  by: string | null;
  onStart: () => void;
  onChange: (next: Exclude<RoomStatus, 'preparing'>) => void;
  onDelete: () => void;
}) {
  return (
    <span className="host-controls">
      {by && (
        <span className="tag">
          {by}
        </span>
      )}
      {status === 'preparing' && (
        <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={onStart}>
          开始对局
        </button>
      )}
      {status === 'running' && (
        <button type="button" className="btn btn-small" disabled={busy} onClick={() => onChange('paused')}>
          暂停
        </button>
      )}
      {status === 'paused' && (
        <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => onChange('running')}>
          继续
        </button>
      )}
      {status !== 'ended' && status !== 'preparing' && (
        <button type="button" className="btn btn-small btn-danger" disabled={busy} onClick={() => onChange('ended')}>
          结束对局
        </button>
      )}
      <button type="button" className="btn btn-small btn-quiet btn-danger-text" disabled={busy} onClick={onDelete}>
        删除对局
      </button>
    </span>
  );
}

/** 一局结束了：玩完的人给剧本大厅里的这个剧本打分、写一句短评（V0.6.0）。不能评的（没算玩完）不显示。 */
/** 「再刷一次」（V0.7.0）：同一个剧本、同样的设置再开一局，这一局的其他人都收到邀请。 */
function Replay({ roomId, dungeon }: { roomId: number; dungeon: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function replay() {
    setBusy(true);
    setError('');
    try {
      const detail = await api<{ room: { id: number } }>('POST', `/api/rooms/${roomId}/replay`);
      navigate(`/room/${detail.room.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }
  return (
    <div className="replay-bar">
      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void replay()}>
        {dungeon ? '再刷一次' : '用这个剧本再开一局'}
      </button>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

function EndingRating({ scenarioKey, title }: { scenarioKey: string; title: string }) {
  const [detail, setDetail] = useState<ScenarioDetail | null>(null);
  useEffect(() => {
    api<ScenarioDetail>('GET', `/api/scenario-hall/${encodeURIComponent(scenarioKey)}`)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [scenarioKey]);
  if (!detail?.canRate) return null;
  return (
    <section className="ending-rating" aria-label={`给《${title}》打分`}>
      <p className="ending-rating-title">给《{title}》打个分</p>
      <RateForm scenarioKey={scenarioKey} mine={detail.mine} onSaved={setDetail} compact />
    </section>
  );
}
