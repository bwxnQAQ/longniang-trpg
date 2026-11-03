import { useCallback, useEffect, useRef, useState } from 'react';
import { DIFFICULTY_LABEL, LANGUAGE_LABEL, VOICE_LABEL, type RoomStyle, type StyleDifficulty, type StyleLanguage, type StyleVoice } from '../../../shared/game';
import {
  api,
  errorMessage,
  modelName,
  type Companion,
  type FriendsList,
  type GameState,
  type LogEntry,
  type Member,
  type RoomDetail,
  type SharedNote,
} from '../api';
import { RoomSubmit } from '../components/Submit';
import { CopyButton } from '../components/bits';
import { Avatar, profilePath } from '../components/people';
import { formatDateTime, formatTime } from '../format';
import { Link } from '../router';
import { ChatComposer } from './Composer';
import { AiTag } from './Setup';
import { StoryLog } from './Story';

// 右侧的「聊天」（成员和场外聊天）、「设置」（邀请好友、对局码、公开、不计时、主持模型、主持风格）和「笔记」。

/** 成员：头像、名字（点了去个人主页）、房主、角色、在线。 */
function MembersList({ detail, game, meId }: { detail: RoomDetail; game: GameState | null; meId: number }) {
  const roles = new Map((game?.others ?? []).map((c) => [c.userId, c] as const));
  return (
    <ul className="member-list">
      {detail.members.map((m) => (
        <MemberRow
          key={m.userId}
          member={m}
          isMe={m.userId === meId}
          role={
            m.userId === meId
              ? game?.me
                ? `${game.me.roleName}${game.me.v5 ? ` · ${game.me.v5.speciesName}${game.me.v5.className} ${game.me.v5.level} 级` : ''}`
                : null
              : roles.get(m.userId)
                ? `${roles.get(m.userId)!.roleName}${roles.get(m.userId)!.class5e ? ` · ${roles.get(m.userId)!.class5e}` : ''}`
                : null
          }
          dead={m.userId === meId ? !!game?.me?.dead : !!roles.get(m.userId)?.dead}
        />
      ))}
      {(game?.companions ?? []).map((c) => (
        <CompanionRow key={`ai-${c.roleKey}`} companion={c} />
      ))}
    </ul>
  );
}

/** 交给 AI 演的身份（V0.8.0 AI 补位）：主持人顺带演的队友，跟在成员后面，带一个「AI」小标记。 */
function CompanionRow({ companion }: { companion: Companion }) {
  return (
    <li className="member member-ai">
      <span className="member-avatar">
        <span className="avatar avatar-letter ai-avatar" style={{ width: 28, height: 28, fontSize: 13 }} aria-hidden="true">
          {[...companion.name][0] ?? '?'}
        </span>
      </span>
      <span className="member-name">{companion.name}</span>
      <AiTag />
      {companion.name !== companion.roleName && <span className="member-state">{companion.roleName}</span>}
    </li>
  );
}

function MemberRow({ member, isMe, role, dead }: { member: Member; isMe: boolean; role: string | null; dead: boolean }) {
  return (
    <li className={member.online ? 'member is-online' : 'member'}>
      <span className="member-avatar">
        <Avatar user={member} size={28} />
        {member.online && <span className="avatar-online" aria-hidden="true" />}
      </span>
      <Link to={profilePath(member.publicId)} className="member-name">
        {member.displayName}
        {isMe && <span className="you">（你）</span>}
      </Link>
      {member.role === 'host' && <span className="tag">房主</span>}
      <span className="member-state">
        {member.characterName ? `${member.characterName}${role ? `，${role}` : ''}${dead ? '，已死亡' : ''}；` : '还没选身份；'}
        {member.online ? '在线' : member.lastSeenAt ? `上次在线 ${formatDateTime(member.lastSeenAt)}` : '还没来过'}
      </span>
    </li>
  );
}

/** 「聊天」：上面是成员，下面是场外聊天。观看的人只看得到成员。 */
export function ChatPanel({
  detail,
  game,
  meId,
  entries,
  hasMore,
  onLoadMore,
  onSent,
  canChat,
}: {
  detail: RoomDetail;
  game: GameState | null;
  meId: number;
  entries: LogEntry[];
  hasMore: boolean;
  onLoadMore: () => void;
  onSent: (entry: LogEntry) => void;
  canChat: boolean;
}) {
  const { room, presence } = detail;
  const [membersOpen, setMembersOpen] = useState(true);
  return (
    <div className={canChat ? 'chat-panel' : 'chat-panel is-members-only'}>
      <section className="chat-members">
        <button type="button" className="chat-members-head" aria-expanded={membersOpen} onClick={() => setMembersOpen((v) => !v)}>
          成员 {detail.members.length}/{room.maxPlayers}
          <span className="muted">，{presence.online.length} 人在线</span>
        </button>
        {membersOpen && <MembersList detail={detail} game={game} meId={meId} />}
        {!detail.viewer.manager && room.isPublic && room.status !== 'ended' && <p className="hint">这一局在大厅里公开。</p>}
      </section>
      {canChat && (
        <section className="chat-room" aria-label="场外聊天">
          <StoryLog
            entries={entries}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            resolving={[]}
            emptyText="还没有人说话。"
            compact
            meId={meId}
            canReport
            label="场外聊天"
          />
          <ChatComposer roomId={room.id} status={room.status} onSent={onSent} />
        </section>
      )}
    </div>
  );
}

/** 「设置」（房主和管理员）：邀请好友、对局码、在大厅里公开、不计时、这一局的主持模型。 */
export function SettingsPanel({
  detail,
  game,
  onDetail,
  onGame,
}: {
  detail: RoomDetail;
  game: GameState;
  onDetail: (d: RoomDetail) => void;
  onGame: (g: GameState) => void;
}) {
  const { room } = detail;
  const inviteLink = room.joinCode ? `${location.origin}/join/${room.joinCode}` : '';
  const ended = room.status === 'ended';
  return (
    <div className="settings">
      {!ended && detail.joinRequests.length > 0 && <JoinRequests detail={detail} onDetail={onDetail} />}
      {!ended && <InviteFriends detail={detail} onDetail={onDetail} />}
      {room.joinCode && !ended && (
        <section className="settings-section">
          <h2>对局码</h2>
          <p>
            <span className="code">{room.joinCode}</span>
          </p>
          <div className="invite-actions">
            <CopyButton text={inviteLink} label="复制邀请链接" />
            <CopyButton text={room.joinCode} label="复制对局码" className="btn btn-small btn-quiet" />
          </div>
        </section>
      )}
      {!ended && (
        <section className="settings-section">
          <h2>大厅</h2>
          <RoomSwitch roomId={room.id} path="public" label="在大厅里公开" checked={room.isPublic} confirmOn={PUBLIC_CONFIRM} onDetail={onDetail} />
        </section>
      )}
      {!ended && (
        <section className="settings-section">
          <h2>计时</h2>
          <RoomSwitch roomId={room.id} path="untimed" label="不计时" checked={room.untimed} onDetail={onDetail} />
        </section>
      )}
      {!ended && <ModelPicker roomId={room.id} game={game} onGame={onGame} />}
      {!ended && <StylePicker roomId={room.id} game={game} onGame={onGame} />}
      {ended && <p className="placeholder">这一局已经结束了。</p>}
      {game.scenario && <RoomSubmit roomId={room.id} scenario={game.scenario} variant="settings" />}
    </div>
  );
}

/** 在大厅里申请加入的人：同意了就进来（满员了进不来），拒绝了会告诉他。 */
function JoinRequests({ detail, onDetail }: { detail: RoomDetail; onDetail: (d: RoomDetail) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function decide(who: string, decision: 'approve' | 'reject') {
    setBusy(who);
    setError('');
    try {
      onDetail(await api<RoomDetail>('POST', `/api/rooms/${detail.room.id}/join-requests/${encodeURIComponent(who)}/${decision}`));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="settings-section">
      <h2>申请加入</h2>
      <ul className="invite-list">
        {detail.joinRequests.map((r) => (
          <li key={r.publicId}>
            <Avatar user={r} size={24} />
            <span>{r.displayName}</span>
            <button type="button" className="btn btn-small btn-primary" disabled={busy !== null} onClick={() => void decide(r.publicId, 'approve')}>
              同意
            </button>
            <button type="button" className="btn btn-small btn-quiet" disabled={busy !== null} onClick={() => void decide(r.publicId, 'reject')}>
              拒绝
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** 邀请好友：好友在通知里点「加入」就能进来，不用对局码。 */
function InviteFriends({ detail, onDetail }: { detail: RoomDetail; onDetail: (d: RoomDetail) => void }) {
  const [friends, setFriends] = useState<FriendsList['friends'] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<FriendsList>('GET', '/api/friends')
      .then((r) => setFriends(r.friends))
      .catch(() => setFriends([]));
  }, []);

  async function call(method: 'POST' | 'DELETE', who: string) {
    setBusy(who);
    setError('');
    try {
      const path = method === 'POST' ? `/api/rooms/${detail.room.id}/invites` : `/api/rooms/${detail.room.id}/invites/${encodeURIComponent(who)}`;
      onDetail(await api<RoomDetail>(method, path, method === 'POST' ? { user: who } : undefined));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const members = new Set(detail.members.map((m) => m.publicId));
  const invited = new Set(detail.invites.map((i) => i.publicId));
  const candidates = (friends ?? []).filter((f) => !members.has(f.publicId) && !invited.has(f.publicId));
  return (
    <section className="settings-section">
      <h2>邀请好友</h2>
      {detail.invites.length > 0 && (
        <ul className="invite-list">
          {detail.invites.map((i) => (
            <li key={i.publicId}>
              <Avatar user={i} size={24} />
              <span>{i.displayName}</span>
              <span className="muted">等他回应</span>
              <button type="button" className="btn btn-small btn-quiet" disabled={busy !== null} onClick={() => void call('DELETE', i.publicId)}>
                撤回
              </button>
            </li>
          ))}
        </ul>
      )}
      {friends === null ? (
        <p className="muted">正在加载好友……</p>
      ) : candidates.length === 0 ? (
        <p className="hint">{friends.length ? '没有可以邀请的好友。' : '还没有好友。'}</p>
      ) : (
        <ul className="invite-list">
          {candidates.map((f) => (
            <li key={f.publicId}>
              <Avatar user={f} size={24} />
              <span>{f.displayName}</span>
              <span className={f.online ? 'presence is-on' : 'presence'}>
                <span className="dot" aria-hidden="true" />
                {f.online ? '在线' : '不在线'}
              </span>
              <button type="button" className="btn btn-small" disabled={busy !== null} onClick={() => void call('POST', f.publicId)}>
                {busy === f.publicId ? '正在邀请……' : '邀请'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** 公开之前确认：观看的人能看到各个地点发生的事，同一局的玩家另开账号观看就能知道别处的事。 */
const PUBLIC_CONFIRM = '公开以后，大厅里的人不用对局码就能直接加入；游客和不在这一局的人能观看故事，各个地点发生的事都看得到（悄悄做、悄悄话、场外聊天除外）。';

/** 对局的开关：在大厅里公开（public，发 isPublic）、不计时（untimed，发 untimed）。confirmOn：打开之前要确认的话。 */
function RoomSwitch({
  roomId,
  path,
  label,
  checked,
  confirmOn,
  onDetail,
}: {
  roomId: number;
  path: 'public' | 'untimed';
  label: string;
  checked: boolean;
  confirmOn?: string;
  onDetail: (d: RoomDetail) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function change(next: boolean) {
    if (next && confirmOn && !window.confirm(confirmOn)) return;
    setBusy(true);
    setError('');
    try {
      onDetail(await api<RoomDetail>('PUT', `/api/rooms/${roomId}/${path}`, path === 'public' ? { isPublic: next } : { untimed: next }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="public-toggle">
      <label className="choice">
        <input type="checkbox" checked={checked} disabled={busy} onChange={(e) => void change(e.target.checked)} />
        <span>
          <strong>{label}</strong>
        </span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** 这一局的主持用哪个模型。改了记录里会告诉大家。 */
function ModelPicker({ roomId, game, onGame }: { roomId: number; game: GameState; onGame: (g: GameState) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const m = game.dmModel;

  async function change(value: string) {
    setBusy(true);
    setError('');
    try {
      onGame(await api<GameState>('PUT', `/api/rooms/${roomId}/model`, { dmModel: value || null }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings-section">
      <h2>主持模型</h2>
      <ModelOptions name="room-model" options={m.options} siteDefault={m.siteDefault} value={m.chosen ?? ''} disabled={busy} onChange={(v) => void change(v)} />
      <p className="hint">现在用的是 {modelName(m.current, m.options)}。</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** 主持风格（V0.6.0）：文风、难度、角色会不会死、用什么语言主持。改了以后的结算按新的来，记录里写一句。 */
function StylePicker({ roomId, game, onGame }: { roomId: number; game: GameState; onGame: (g: GameState) => void }) {
  const [draft, setDraft] = useState<RoomStyle>(game.style);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const changed = JSON.stringify(draft) !== JSON.stringify(game.style);
  // 别人（另一个管理员）改了：没在改的时候跟上
  useEffect(() => {
    if (!busy) setDraft(game.style);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(game.style)]);

  async function save() {
    setBusy(true);
    setError('');
    try {
      onGame(await api<GameState>('PUT', `/api/rooms/${roomId}/style`, draft));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings-section style-picker">
      <h2>主持风格</h2>
      <div className="style-grid">
        <label htmlFor="style-voice">文风</label>
        <select id="style-voice" value={draft.voice} onChange={(e) => setDraft({ ...draft, voice: e.target.value as StyleVoice })}>
          {(Object.keys(VOICE_LABEL) as StyleVoice[]).map((k) => (
            <option key={k} value={k}>
              {VOICE_LABEL[k]}
            </option>
          ))}
        </select>
        <label htmlFor="style-difficulty">难度</label>
        <select id="style-difficulty" value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as StyleDifficulty })}>
          {(Object.keys(DIFFICULTY_LABEL) as StyleDifficulty[]).map((k) => (
            <option key={k} value={k}>
              {DIFFICULTY_LABEL[k]}
            </option>
          ))}
        </select>
        <label htmlFor="style-language">语言</label>
        <select id="style-language" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value as StyleLanguage })}>
          {(Object.keys(LANGUAGE_LABEL) as StyleLanguage[]).map((k) => (
            <option key={k} value={k}>
              {LANGUAGE_LABEL[k]}
            </option>
          ))}
        </select>
      </div>
      <label className="choice">
        <input type="checkbox" checked={draft.death} onChange={(e) => setDraft({ ...draft, death: e.target.checked })} />
        <span>角色会死</span>
      </label>
      <div className="form-actions">
        <button type="button" className="btn btn-small btn-primary" disabled={busy || !changed} onClick={() => void save()}>
          保存
        </button>
        {changed && (
          <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => setDraft(game.style)}>
            还原
          </button>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** 模型的单选：跟随网站设置，或者某一个模型（带说明和价格）。开局时、设置里都用它。 */
export function ModelOptions({
  name,
  options,
  siteDefault,
  value,
  disabled,
  onChange,
}: {
  name: string;
  options: GameState['dmModel']['options'];
  siteDefault: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="model-options" role="radiogroup" aria-label="主持模型">
      <label className="choice">
        <input type="radio" name={name} value="" checked={value === ''} disabled={disabled} onChange={() => onChange('')} />
        <span>
          <strong>跟随网站设置</strong>
          <small>现在是 {modelName(siteDefault, options)}</small>
        </span>
      </label>
      {options.map((o) => (
        <label key={o.model} className={o.available ? 'choice' : 'choice is-dim'}>
          <input
            type="radio"
            name={name}
            value={o.model}
            checked={value === o.model}
            disabled={disabled || (!o.available && value !== o.model)}
            onChange={() => onChange(o.model)}
          />
          <span>
            <strong>{o.name}</strong>
            <small>
              {o.available ? o.note : '没设置密钥'}
              {o.available && o.price && `；每百万 token 输入 $${o.price.input}、输出 $${o.price.output}`}
            </small>
          </span>
        </label>
      ))}
    </div>
  );
}

export function NotesPanel({
  roomId,
  members,
  meId,
  sharedNotes,
}: {
  roomId: number;
  members: Member[];
  meId: number;
  /** 别人分享给我的笔记。 */
  sharedNotes: SharedNote[];
}) {
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [sharedWith, setSharedWith] = useState<number[]>([]);
  const [shareError, setShareError] = useState('');
  const latest = useRef('');
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    api<{ content: string; updatedAt: number | null; sharedWith: number[] }>('GET', `/api/rooms/${roomId}/note`)
      .then((r) => {
        setContent(r.content);
        latest.current = r.content;
        setSavedAt(r.updatedAt);
        setSharedWith(r.sharedWith);
        setLoaded(true);
      })
      .catch(() => setStatus('error'));
  }, [roomId]);

  const save = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setStatus('saving');
    try {
      const r = await api<{ updatedAt: number }>('PUT', `/api/rooms/${roomId}/note`, { content: latest.current });
      setSavedAt(r.updatedAt);
      setStatus(dirty.current ? 'idle' : 'saved');
    } catch {
      dirty.current = true;
      setStatus('error');
      timer.current = window.setTimeout(() => void save(), 5000);
    }
  }, [roomId]);

  // 离开页面或关掉标签页前，把没保存的内容送出去
  useEffect(() => {
    const flush = () => {
      if (!dirty.current) return;
      void fetch(`/api/rooms/${roomId}/note`, {
        method: 'PUT',
        keepalive: true,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: latest.current }),
      });
      dirty.current = false;
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.clearTimeout(timer.current);
      flush();
    };
  }, [roomId]);

  async function toggleShare(userId: number) {
    const before = sharedWith;
    const next = before.includes(userId) ? before.filter((id) => id !== userId) : [...before, userId];
    setSharedWith(next);
    setShareError('');
    try {
      const r = await api<{ sharedWith: number[] }>('PUT', `/api/rooms/${roomId}/note/sharing`, { userIds: next });
      setSharedWith(r.sharedWith);
    } catch (err) {
      setSharedWith(before);
      setShareError(errorMessage(err));
    }
  }

  const others = members.filter((m) => m.userId !== meId);
  return (
    <div className="notes">
      <label htmlFor="note-text" className="visually-hidden">
        我的笔记
      </label>
      <textarea
        id="note-text"
        className="note-text"
        value={content}
        disabled={!loaded}
        placeholder="写给自己看的笔记"
        onChange={(e) => {
          setContent(e.target.value);
          latest.current = e.target.value;
          dirty.current = true;
          setStatus('idle');
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => void save(), 800);
        }}
      />
      <p className="note-status" aria-live="polite">
        {status === 'saving'
          ? '正在保存……'
          : status === 'error'
            ? '保存失败，过一会儿会自动重试'
            : status === 'idle' && dirty.current
              ? ''
              : savedAt
                ? `已保存 ${formatTime(savedAt)}`
                : ''}
      </p>

      {others.length > 0 && (
        <fieldset className="note-sharing" disabled={!loaded}>
          <legend>分享给</legend>
          <div className="note-sharing-list">
            {others.map((m) => (
              <label key={m.userId} className="choice">
                <input type="checkbox" checked={sharedWith.includes(m.userId)} onChange={() => void toggleShare(m.userId)} />
                <span>
                  <strong>{m.characterName ?? m.displayName}</strong>
                  {m.characterName && <small>{m.displayName}</small>}
                </span>
              </label>
            ))}
          </div>
          {shareError && (
            <p className="form-error" role="alert">
              {shareError}
            </p>
          )}
        </fieldset>
      )}

      {sharedNotes.length > 0 && (
        <section className="shared-notes" aria-labelledby="shared-notes-title">
          <h2 id="shared-notes-title">别人分享给你的笔记</h2>
          {sharedNotes.map((n) => (
            <article key={n.author.id} className="shared-note">
              <p className="shared-note-head">
                <strong>{n.author.characterName ?? n.author.displayName}</strong>
                {n.author.characterName && <span className="muted">{n.author.displayName}</span>}
                <span className="muted">更新于 {formatTime(n.updatedAt)}</span>
              </p>
              {n.content.trim() ? <p className="shared-note-text">{n.content}</p> : <p className="muted">还是空的</p>}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
