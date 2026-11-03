import type { AdminPermission, Identity } from '../../shared/admin';
import type { Condition, Credit, LogData, ModelOption, RoomTodo, ScenarioCategory, ScenarioSummary } from '../../shared/game';
import { rememberApiError } from './errors';

export type * from '../../shared/game';
export type * from '../../shared/works';
export type * from '../../shared/pets';
export type * from '../../shared/achievements';
export type * from '../../shared/events';
export type * from '../../shared/guide';
export type * from '../../shared/review';
export type * from '../../shared/announce';
export type * from '../../shared/cards';
export type * from '../../shared/groups';
export type { GearView } from '../../shared/gear2';
import type { AiReviewView } from '../../shared/review';
import type { HallScenario } from '../../shared/works';
import type { AdminPetSummary, PublicPet } from '../../shared/pets';
import type { ProfileCollection } from '../../shared/achievements';
import type { PublicCard } from '../../shared/cards';
import type { PublicCard5e } from '../../shared/5e/types';
export type { AdminPermission, Identity } from '../../shared/admin';
export { ADMIN_PERMISSIONS, IDENTITY_LABEL, PERMISSION_LABEL } from '../../shared/admin';

/**
 * 登录的人。identity：游客、普通用户、管理员、站长；permissions：管理员的权限（站长是全部）。
 * rulesAgreed：同意过使用规则，没同意的账号要先同意才能用别的功能。
 */
export type User = {
  id: number;
  /** 登录用的用户名：只有本人和管理员看得到。 */
  username: string;
  /** 公开编号：个人主页、头像的网址用它。 */
  publicId: string;
  displayName: string;
  isAdmin: boolean;
  isOwner: boolean;
  isGuest: boolean;
  identity: Identity;
  permissions: AdminPermission[];
  /** 头像图片的地址，没有头像是 null。 */
  avatar: string | null;
  /** 戴着的头像框（V0.7.0，没戴是 null）。 */
  frame: string | null;
  rulesAgreed: boolean;
};

/** 网页上显示一个人用的简单信息。publicId：公开编号，个人主页、头像的网址用它；里面没有用户名。frame：戴着的头像框。 */
export type UserBrief = { publicId: string; displayName: string; avatar: string | null; identity: Identity; frame: string | null };

export type Relation = 'self' | 'friends' | 'pending-out' | 'pending-in' | 'none';

/**
 * 各处的未读数。铃铛 = notifications + announcements；好友 = messages + friendRequests；
 * 管理 = admin（adminReports 没处理的举报和反馈 + adminViolations 没处理的违规记录 + adminSubmissions 等审核的投稿）。
 */
export type Badges = {
  notifications: number;
  announcements: number;
  messages: number;
  /** 没读的群消息（V0.7.0）。 */
  groups: number;
  friendRequests: number;
  admin: number;
  adminReports: number;
  adminViolations: number;
  adminSubmissions: number;
};

export type NotificationKind =
  | 'friend_request'
  | 'friend_accepted'
  | 'room_invite'
  | 'room_started'
  | 'join_request'
  | 'join_result'
  | 'violation_warning'
  | 'report_reply'
  | 'new_report'
  | 'submission_result'
  | 'new_work'
  | 'pet_job_done'
  | 'pet_trip_done'
  | 'pet_diary'
  | 'pet_visit'
  | 'pet_note'
  | 'achievement'
  | 'author_reward'
  | 'work_review'
  | 'work_feedback'
  | 'feedback_reply'
  | 'card_growth'
  | 'chest'
  | 'legendary'
  | 'duel'
  // 5E 模组走到结局（V0.9.0）
  | 'card5e_done'
  | 'group_added'
  | 'item_grant'
  // 约团（V0.8.0）：列了时间、定下了、取消了、快开始了
  | 'schedule_poll'
  | 'schedule_confirmed'
  | 'schedule_cancelled'
  | 'schedule_reminder';

/** 好友申请、对局邀请现在的状态：pending 还没处理；friends 已经是好友；joined 已经加入；gone 已经失效。 */
export type NotificationState = 'pending' | 'friends' | 'joined' | 'gone';

export type NotificationItem = {
  id: number;
  kind: NotificationKind;
  data: Record<string, any>;
  createdAt: number;
  read: boolean;
  state?: NotificationState;
};

export type Announcement = { id: number; title: string; body: string; at: number; by: string | null; read: boolean };

export type Profile = {
  /** username：只有自己的主页、管理员看的时候有。 */
  user: UserBrief & { username?: string; bio: string; joinedAt: number; lastSeenAt: number | null; online: boolean; banned: boolean };
  relation: Relation;
  /** 我屏蔽了他。 */
  blocked: boolean;
  /** 自己的主页才有：展示不展示自己的对局。 */
  showRooms: boolean | null;
  /** 四个数（V0.8.2）：玩完的剧本（剧本大厅的，重复玩也算）、通关的地下城（重复刷也算）、达成的结局、成就。本人选了不展示对局和战绩时别人看到的是 null。 */
  stats: { scenarios: number; dungeons: number; endings: number; achievements: number } | null;
  rooms:
    | {
        id: number;
        name: string;
        status: RoomStatus;
        isPublic: boolean;
        role: 'host' | 'player';
        characterName: string | null;
        roleName: string | null;
        scenarioTitle: string | null;
        canOpen: boolean;
      }[]
    | null;
  /** 剧本大厅里他的作品（V0.5.0）。 */
  works: HallScenario[];
  /** 关注他的人数；我关注了没有。 */
  followers: number;
  following: boolean;
  /** 他的宠物（没养是 null）。 */
  pet: PublicPet | null;
  /** 戴着的称号（V0.6.0）。 */
  title: string | null;
  /** 成就、达成的结局数；能戴的称号只有自己的主页有（V0.6.0）。游客是 null。 */
  collection: ProfileCollection | null;
  /** 他在主页上展示的角色卡（V0.8.1）。 */
  cards: PublicCard[];
  /** 他在主页上展示的 5E 角色（V0.9.0）。 */
  cards5e: PublicCard5e[];
  /** 封号、解封要的（V0.8.1）：只有有封号权限的管理员看的时候有。 */
  moderation: ProfileModeration | null;
};

/** 主页上给管理员的：账号编号、封着没有、能不能封他（自己、站长、管理员不能封）。 */
export type ProfileModeration = {
  id: number;
  banned: { at: number; reason: string; until: number | null } | null;
  canBan: boolean;
};

export type Friend = UserBrief & {
  online: boolean;
  lastSeenAt: number | null;
  since: number;
  unread: number;
  last: { text: string; at: number; mine: boolean } | null;
};

export type FriendsList = {
  friends: Friend[];
  incoming: (UserBrief & { at: number })[];
  outgoing: (UserBrief & { at: number })[];
  blocked: UserBrief[];
};

export type DirectMessage = { id: number; mine: boolean; text: string; at: number; read: boolean };

/** 大厅聊天的一句话。deleted：撤回了（byAdmin：是管理员撤回的）。 */
export type LobbyMessage = { id: number; user: UserBrief; title: string | null; text: string; deleted: boolean; byAdmin: boolean; at: number };

export type ReportKind = 'report' | 'feedback' | 'bug';

/** 举报的是哪条内容（V0.7.0 去掉了宠物留言）。 */
export type ReportTarget = { type: 'lobby' | 'dm' | 'room' | 'rating' | 'feedback' | 'group'; id: number };

export type MyReport = {
  id: number;
  kind: ReportKind;
  body: string;
  steps: string;
  about: UserBrief | null;
  target: { type: string } | null;
  at: number;
  handledAt: number | null;
  outcome: string | null;
  reply: string;
};

export type AdminReport = {
  id: number;
  kind: ReportKind;
  /** 管理员看得到用户名。 */
  from: (UserBrief & { username: string }) | null;
  about: (UserBrief & { username: string }) | null;
  aboutUserId: number | null;
  aboutBanned: boolean;
  target: Record<string, any>;
  body: string;
  steps: string;
  context: Record<string, any>;
  at: number;
  handledAt: number | null;
  handler: string | null;
  outcome: string | null;
  outcomeLabel: string | null;
  reply: string;
  /** AI 审核的意见（V0.6.0，只有举报有；最新的一次）。 */
  aiReview: AiReviewView | null;
};

export type AdminAnnouncement = { id: number; title: string; body: string; audience: string; audienceLabel: string; at: number; by: string | null; reads: number };

export type AuditEntry = { id: number; action: string; detail: string; at: number; by: string };

export type RoomStatus = 'preparing' | 'running' | 'paused' | 'ended';
export type RoomModel = 'claude' | 'deepseek';

export type RoomSummary = {
  id: number;
  name: string;
  status: RoomStatus;
  model: RoomModel;
  maxPlayers: number;
  memberCount: number;
  onlineCount: number;
  isHost: boolean;
  isPublic: boolean;
  scenarioTitle: string | null;
  lastActivityAt: number;
  /** 这一局要你处理的事和新进展。 */
  todo: RoomTodo;
};

export type Member = {
  userId: number;
  /** 公开编号（个人主页的地址用它）。 */
  publicId: string;
  displayName: string;
  avatar: string | null;
  role: 'host' | 'player';
  online: boolean;
  lastSeenAt: number | null;
  characterName: string | null;
};

/** untimed：这一局不计时（人不齐也是回合模式，在线的人照样一轮一轮结算）。 */
export type Presence = { roomId: number; online: number[]; allOnline: boolean; untimed: boolean; mode: 'round' | 'timed' };

export type RoomDetail = {
  room: {
    id: number;
    name: string;
    status: RoomStatus;
    model: RoomModel;
    maxPlayers: number;
    /** 不计时：人不齐也照样一轮一轮结算。 */
    untimed: boolean;
    /** 在大厅里公开：谁都能直接加入。 */
    isPublic: boolean;
    /** 有成员被封号，冻结到他解封：不能开局、不能继续。 */
    frozen: boolean;
    createdAt: number;
    isHost: boolean;
    joinCode: string | null;
  };
  /** 我和这一局的关系：成员的身份（观看时是 null）、能不能管（房主、管理员）、是不是只在观看、在大厅里申请加入了没有。 */
  viewer: { role: 'host' | 'player' | null; manager: boolean; watching: boolean; by: string; requested: boolean };
  members: Member[];
  /** 发出去还没回应的邀请（只给能管的人）。 */
  invites: (UserBrief & { at: number })[];
  /** 在大厅里申请加入、等着同意的人（只给能管的人）。 */
  joinRequests: (UserBrief & { at: number })[];
  presence: Presence;
};

/** 大厅里的一局：公开的、还没结束的。 */
export type HallRoom = {
  id: number;
  name: string;
  status: RoomStatus;
  host: string;
  members: number;
  /** 最多几个人（选了剧本以后不超过剧本的上限）。 */
  limit: number;
  full: boolean;
  /** 我已经在这一局里了。 */
  joined: boolean;
  /** 我在大厅里申请加入了，等房主同意。 */
  requested: boolean;
  online: number;
  untimed: boolean;
  createdAt: number;
  lastActivityAt: number;
  scenario: {
    title: string;
    genre: string;
    tone: string;
    players: { min: number; max: number };
    expectedDays: number;
    relation: 'coop' | 'secrets' | 'versus';
    stress: boolean;
    category: ScenarioCategory | null;
    dungeon: { level: number; size: 'small' | 'large' } | null;
  } | null;
  /** AI 正在写剧本。 */
  generating: boolean;
};

export type LogEntry = {
  id: number;
  kind: 'narration' | 'ooc' | 'system';
  text: string;
  /** 私密的：其他玩家看不到（只有自己、或者在场的人知道）。 */
  private: boolean;
  author: { id: number; displayName: string } | null;
  createdAt: number;
  /** 发生时的游戏时间（从第1天0点起的分钟数）。 */
  gameTime: number | null;
  data: LogData | null;
};

/** 别人分享给我的笔记（只能看，不能改）。 */
export type SharedNote = {
  author: { id: number; displayName: string; characterName: string | null };
  content: string;
  updatedAt: number;
};

export type Invite = {
  id: number;
  code: string;
  note: string;
  createdAt: number;
  expiresAt: number | null;
  usedAt: number | null;
  usedBy: { username: string; displayName: string } | null;
  status: 'unused' | 'used' | 'expired';
};

/**
 * 额度兑换码。reusable：可重复（每个人各能兑换一次）；不是的话只能被一个人兑换一次。
 * status：active 还能兑换；used 单次的已经被用了；expired 过期了。usedBy：兑换过的人（最早的 20 个）。
 */
export type CreditCode = {
  id: number;
  code: string;
  amount: number;
  reusable: boolean;
  note: string;
  expiresAt: number;
  createdAt: number;
  by: string | null;
  uses: number;
  usedBy: string[];
  status: 'active' | 'used' | 'expired';
};

/** 管理页剧本列表的一行：scenarios 文件夹里的一个剧本文件。 */
export type AdminScenario = {
  key: string;
  /** 这个版本自带的：只能上架、下架。 */
  builtin: boolean;
  /** 下架了：建对局时选不到。 */
  hidden: boolean;
  /** 用过这个剧本的对局有几局。 */
  usedBy: number;
  /** 文件有错时是 null，错在哪写在 errors 里。 */
  summary: ScenarioSummary | null;
  errors: string[];
  updatedAt: number;
};

export type AdminUser = {
  id: number;
  /** 正式账号用空着的最小的号，游客是随机的 8 位数；只有管理员看得到。删掉的账号没有。 */
  uid: number | null;
  username: string;
  /** 公开编号：个人主页的地址用它。 */
  publicId: string;
  displayName: string;
  avatar: string | null;
  identity: Identity;
  identityLabel: string;
  isAdmin: boolean;
  isOwner: boolean;
  isGuest: boolean;
  permissions: AdminPermission[];
  /** 后台备注。 */
  note: string;
  lastSeenAt: number | null;
  online: boolean;
  createdAt: number;
  /** 管理员在管理页新建的账号：是谁建的（显示名）；自己注册的是 null。 */
  createdBy: string | null;
  locked: boolean;
  /** until：到这个时间自动解封；null 是一直封着，等管理员解封。 */
  banned: { at: number; reason: string; until: number | null } | null;
  /** 怎么注册的；withheld 是开放注册时没送初始额度的原因。管理员新建的、V0.4.5 以前注册的是 null。 */
  signup: { via: 'invite' | 'open'; withheld: string | null } | null;
  rulesAgreed: boolean;
  credit: Credit;
  /** 在几局里。 */
  rooms: number;
};

export type Violation = {
  id: number;
  at: number;
  /** isOwner：站长的记录只有站长能处理。 */
  user: { id: number; username: string; displayName: string; isOwner: boolean } | null;
  room: { id: number; name: string } | null;
  /** precheck 发给 AI 之前检查出来的；refusal 被 AI 拒绝的。 */
  kind: 'precheck' | 'refusal';
  source: string;
  sourceLabel: string;
  content: string;
  category: string;
  reason: string;
  /** banned 封号了（第二次）；warned 警告了（第一次）；flagged 只记下来给管理员看；blocked 拦下了没警告（管理员自己）。 */
  outcome: 'banned' | 'warned' | 'flagged' | 'blocked';
  reviewedAt: number | null;
  reviewer: string | null;
  /** 管理员标成了误判：不算这个人的违规次数。 */
  dismissed: boolean;
};

export type AdminUserDetail = {
  user: AdminUser;
  /** 可能是同一个人的账号：用同一个浏览器登录过的、在同一个网络注册的。 */
  related: { id: number; uid: number | null; username: string; displayName: string; how: string[] }[];
  grants: { amount: number; note: string; at: number; by: string | null }[];
  usage: {
    byPurpose: { purpose: string; calls: number; cost: number }[];
    recent: { at: number; purpose: string; model: string; cost: number; shared: boolean; stopReason: string | null; error: string | null; room: { id: number; name: string } | null }[];
  };
  violations: Violation[];
  rooms: { id: number; name: string; status: RoomStatus; role: 'host' | 'player' }[];
  /** 宠物和龙晶（游客是 null）。 */
  pets: AdminPetSummary | null;
};

export type AiRoleKey = 'dm' | 'scenario' | 'misc' | 'guard' | 'guide' | 'review';

export type AiAdminStatus = {
  enabled: boolean;
  provider: string;
  ready: boolean;
  message: string | null;
  /** 各家的 API 密钥设置了没有。 */
  providers: { name: string; label: string; ready: boolean; message: string | null }[];
  /** 现在用的模型（网页上选过的优先）。 */
  models: Record<AiRoleKey, string>;
  /** .env 里设的（没设就是默认的）。 */
  defaults: Record<AiRoleKey, string>;
  /** 哪几项是在网页上选过的。 */
  chosen: Record<AiRoleKey, boolean>;
  roles: { key: AiRoleKey; label: string }[];
  options: ModelOption[];
  effort: Record<string, string>;
  cost: { total: number; day: number; week: number };
  /** OpenRouter 上要用的模型；没设 OpenRouter 的密钥时是 null。fromEnv：还是 .env 里写的，没在网页上改过。 */
  openrouter: { models: string[]; fromEnv: boolean } | null;
  /** 开局能选的主持模型，按房主的身份分（站长都能选，只有站长能改）。 */
  dmModelGroups: Record<ModelGroup, string[]>;
};

/** 开局选主持模型时按哪种身份限制（站长不限）。 */
export type ModelGroup = 'user' | 'admin';

/** daily：服务器开着时每天自动备份（V0.8.0）。 */
export type BackupKind = 'upgrade' | 'import' | 'manual' | 'reset' | 'daily';

export type SystemInfo = {
  version: string;
  author: string;
  /** 数据库是第几版（执行过几次升级） */
  schemaVersion: number;
  dbFile: string | null;
  dbSize: number;
  backupDir: string | null;
  /** 这份数据是从旧版本复制过来的（start.bat 第一次启动时） */
  importedFrom: {
    from: string;
    version: string | null;
    at: number;
    counts: { users: number | null; rooms: number | null; scenarios: number | null } | null;
    scenarioFiles: string[];
  } | null;
  backups: { name: string; kind: BackupKind; size: number; createdAt: number }[];
  /** 服务器的运行情况（V0.8.0）。 */
  runtime: {
    /** 服务器这次开了多少秒。 */
    uptimeSeconds: number;
    /** 占的内存（RSS），MB。 */
    rssMb: number;
    /** 最近一次每天自动备份的时间；还没有是 null。 */
    lastDailyBackupAt: number | null;
    /** 错误日志的文件夹；没写日志文件时是 null。 */
    logDir: string | null;
    /** 最近的错误（内存里最近 100 条，已经脱敏），新的在前。 */
    errors: { at: number; text: string }[];
  };
};

export type AdminRoomRow = {
  id: number;
  name: string;
  status: RoomStatus;
  host: { id: number; displayName: string } | null;
  members: number;
  characters: number;
  online: number;
  createdAt: number;
  lastActivityAt: number;
  cost: number;
  scenarioTitle: string | null;
  /** 在大厅里公开。 */
  isPublic: boolean;
};

export type AdminLogEntry = {
  id: number;
  kind: 'narration' | 'ooc' | 'system';
  text: string;
  private: boolean;
  /** 私密的记录有谁看得到（角色名、账号名）。 */
  to: string[];
  author: string | null;
  createdAt: number;
  gameTime: number | null;
  data: Record<string, any> | null;
};

export type AdminRoomDetail = {
  room: {
    id: number;
    name: string;
    status: RoomStatus;
    model: RoomModel;
    maxPlayers: number;
    untimed: boolean;
    joinCode: string;
    createdAt: number;
    host: { userId: number; displayName: string } | null;
    clock: number | null;
    roundNo: number;
    timeRatio: number;
    waits: { min: number; max: number };
    costLimit: number | null;
    mode: 'round' | 'timed';
    cost: number;
  };
  members: {
    userId: number;
    username: string;
    displayName: string;
    role: 'host' | 'player';
    joinedAt: number;
    lastSeenAt: number | null;
    online: boolean;
    banned: boolean;
    credit: Credit;
  }[];
  characters: {
    id: number;
    name: string;
    playerName: string;
    roleName: string;
    roleSecret: string;
    roleGoal: string;
    attributes: Record<string, number>;
    specialties: string[];
    appearance: string;
    goal: string;
    wounds: number;
    stress: number;
    conditions: Condition[];
    items: string[];
    locationName: string | null;
    visitedNames: string[];
    dead: boolean;
  }[];
  /** 交给 AI 演的身份（V0.8.0）：npcKey 是主持 AI 那份剧本里的 NPC key。 */
  companions: { roleKey: string; roleName: string; name: string; npcKey: string }[];
  scenario: { source: string; key: string | null; revealed: boolean; data: Record<string, any> } | null;
  world: { npcs: Record<string, any>; events: Record<string, { happened: boolean; note: string; at: number }>; ending: { title: string; epilogue: string } | null };
  storySummary: { text: string; untilLogId: number };
  actions: {
    id: number;
    character: string;
    content: string;
    status: string;
    mode: string;
    round: number | null;
    submittedAt: number;
    dueAt: number | null;
    gameMinutes: number | null;
    estimateNote: string | null;
    attempts: number;
    error: string | null;
    refused: boolean;
    resolvedAt: number | null;
  }[];
  ai: {
    byPurpose: { purpose: string; calls: number; cost: number }[];
    recent: {
      at: number;
      purpose: string;
      model: string;
      user: string | null;
      input: number;
      output: number;
      cacheRead: number;
      cacheWrite: number;
      cost: number;
      durationMs: number;
      stopReason: string | null;
      requestId: string | null;
      error: string | null;
    }[];
  };
  notes: { author: string; content: string; sharedWith: string[]; updatedAt: number }[];
  jobs: { id: number; kind: string; status: string; step: string | null; input: unknown; error: string | null; by: string | null; createdAt: number; finishedAt: number | null }[];
  violations: Violation[];
};

// ---------- 房主工具（管理员加 ?full=1 用同样的接口） ----------

/** action：行动的内容；房主不在场、没看到这次结算时是 null。 */
export type LastResolution = { actionId: number; actor: string; action: string | null; resolvedAt: number | null; ended: boolean; blocked: string | null };

export type HostCharacterState = {
  wounds: number;
  stress: number;
  conditions: Condition[];
  items: string[];
  location: { key: string; name: string } | null;
  places: { key: string; name: string }[];
  /** 5E 角色的生命值（V0.9.0）；别的剧本是 null。 */
  hp5e: { hp: number; hpMax: number } | null;
};

/** state：别人的角色要先点“查看”才有（记录里会告诉大家）；自己的、管理员看的直接有。 */
export type HostCharacter = {
  id: number;
  name: string;
  playerName: string;
  roleName: string;
  dead: boolean;
  mine: boolean;
  state: HostCharacterState | null;
};

export type HostClue = { key: string; title: string; content: string; found: boolean; holders: number[] };

/** clues 是 null：房主还没点“查看”，count 是已经找到了几条。 */
export type HostClues = { clues: HostClue[] | null; count: number };

export type HostView = { last: LastResolution | null; characters: HostCharacter[] };

export const PURPOSE_LABEL: Record<string, string> = {
  resolve: '结算行动',
  estimate: '估算耗时',
  answer: '场外问答',
  summary: '摘要和笔记',
  scenario: '写剧本',
  moderation: '内容检查',
};

/** 模型的名字（选项里有就用选项里的）。 */
export function modelName(model: string, options: ModelOption[] = []): string {
  return options.find((o) => o.model === model)?.name ?? model.replace(/^claude-/, '').replace(/-(\d+)-(\d+)$/, ' $1.$2');
}
export const STATUS_LABEL: Record<RoomStatus, string> = {
  preparing: '准备中',
  running: '进行中',
  paused: '已暂停',
  ended: '已结束',
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    rememberApiError(method, path, 0, '连不上服务器');
    window.dispatchEvent(new CustomEvent('site:down', { detail: 'network' }));
    throw new ApiError(0, '连不上服务器，请检查网络后再试');
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    // 连不上网站的电脑（V0.9.0）：Cloudflare 的错误页（不是网站回的 JSON），或者维护页 Worker 回的「正在升级维护」
    const body = data as { error?: string } | null;
    if ((!body && (res.status === 502 || res.status === 503 || res.status === 504 || (res.status >= 520 && res.status <= 530))) || (res.status === 503 && body?.error === SITE_MAINTENANCE)) {
      rememberApiError(method, path, res.status, SITE_MAINTENANCE);
      window.dispatchEvent(new CustomEvent('site:down', { detail: 'maintenance' }));
      throw new ApiError(res.status, SITE_MAINTENANCE);
    }
    // 登录过期了：通知界面回到登录页
    if (res.status === 401 && !path.startsWith('/api/auth/')) window.dispatchEvent(new Event('auth:expired'));
    const message = (data as { error?: string } | null)?.error ?? `出错了（${res.status}）`;
    rememberApiError(method, path, res.status, message);
    // 刚刚因为违规被封号：退出登录，登录页上说明原因
    if (res.status === 403 && message.includes('账号已被封禁') && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new CustomEvent('auth:banned', { detail: message }));
    }
    throw new ApiError(res.status, message);
  }
  return data as T;
}

/** 网站的电脑不在线时（升级、关机）的说明；和 cloudflare/maintenance-worker.js 里接口回的一样。 */
export const SITE_MAINTENANCE = '网站正在升级维护，过一会儿再来';

/** 浏览器没存下登录用的 Cookie 时的说明（比如用 http:// 打开了只许 HTTPS 登录的网站、App 里的浏览器不让存）。 */
export const SESSION_NOT_SAVED = '浏览器没有存下登录状态。请确认网址是 https:// 开头的；用 App 里自带的浏览器打开的话，换成系统的浏览器再试。';

/** 登录、注册、游客进入以后，确认浏览器真的存下了登录状态：存不下的话页面看着像没登录，再点只会白建账号。 */
export async function confirmSession(): Promise<void> {
  const r = await api<{ user: User | null }>('GET', '/api/auth/me');
  if (!r.user) throw new Error(SESSION_NOT_SAVED);
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : '出错了，请稍后再试';
}

/** 注册方式：invite 只能用邀请码；open 开放注册。paused：应急开关，暂停注册。 */
export type RegistrationMode = 'invite' | 'open';
export type RegistrationStatus = { mode: RegistrationMode; paused: boolean };

/** 管理页看到的注册设置：开放注册送的初始额度（美元）、每天最多送几份、今天已经送了几份。 */
export type RegistrationSettings = RegistrationStatus & { openStartCredit: number; openDailyTrials: number; trialsToday: number };
