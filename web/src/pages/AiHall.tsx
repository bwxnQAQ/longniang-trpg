import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { api, errorMessage, type PersonaInviteRoom, type PersonaSort, type PersonaView } from '../api';
import { useAuth } from '../auth';
import { openFeedback } from '../components/Feedback';
import { GuestNote } from '../components/GuestNote';
import { Modal } from '../components/Modal';
import { Avatar, profilePath } from '../components/people';
import { Link, navigate, useLocation } from '../router';
import { PERSONA_INTRO_MAX, PERSONA_NAME_MAX, PERSONA_PROMPT_MAX, PERSONAS_MAX } from '../../../shared/personas';

// AI 大厅（V1.1.0）：大家做的 AI 角色（陪玩的 AI）。每个像一张名帖：名字、一句简介、作者、几个人请过，展开看人设。
// 「我的 AI 角色」里新建、改、删，选公开还是不公开；「请进对局」请进自己当房主、还在开团准备的一局，演一个没人选的身份。
// 游客能看，做和请要正式账号。

type Tab = 'hall' | 'mine';

const SORTS: { key: PersonaSort; label: string }[] = [
  { key: 'popular', label: '请的人多' },
  { key: 'new', label: '最新' },
];

export function AiHallPage() {
  const { user } = useAuth();
  const guest = !!user?.isGuest;
  const { query } = useLocation();
  const [tab, setTab] = useState<Tab>(query.get('tab') === 'mine' && !guest ? 'mine' : 'hall');
  const [sort, setSort] = useState<PersonaSort>('popular');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [hall, setHall] = useState<PersonaView[] | null>(null);
  const [more, setMore] = useState(false);
  const [mine, setMine] = useState<PersonaView[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<PersonaView | 'new' | null>(null);
  const [inviting, setInviting] = useState<PersonaView | null>(null);
  const [detail, setDetail] = useState<PersonaView | null>(null);
  const shown = query.get('persona');

  const loadHall = useCallback(
    async (offset = 0) => {
      try {
        const params = new URLSearchParams({ scope: 'hall', sort, offset: String(offset) });
        if (search) params.set('q', search);
        const r = await api<{ personas: PersonaView[]; more: boolean }>('GET', `/api/ai-personas?${params}`);
        setHall((h) => (offset && h ? [...h, ...r.personas.filter((p) => !h.some((x) => x.id === p.id))] : r.personas));
        setMore(r.more);
        setError('');
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [sort, search],
  );

  const loadMine = useCallback(async () => {
    if (guest) return setMine([]);
    try {
      setMine((await api<{ personas: PersonaView[] }>('GET', '/api/ai-personas?scope=mine')).personas);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [guest]);

  useEffect(() => {
    document.title = 'AI 大厅 - 龙娘跑团';
  }, []);
  useEffect(() => void loadHall(0), [loadHall]);
  useEffect(() => void loadMine(), [loadMine]);

  // 找名字、简介：停一会儿再找
  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // 从对局里点进来看某一个（?persona=编号）
  useEffect(() => {
    if (!shown || !/^\d+$/.test(shown)) return setDetail(null);
    api<{ persona: PersonaView }>('GET', `/api/ai-personas/${shown}`)
      .then((r) => setDetail(r.persona))
      .catch((err) => setError(errorMessage(err)));
  }, [shown]);

  function saved(p: PersonaView) {
    setEditing(null);
    setTab('mine');
    void loadMine();
    void loadHall(0);
    setDetail((d) => (d?.id === p.id ? p : d));
  }

  async function remove(p: PersonaView) {
    if (!window.confirm(p.mine ? `删掉「${p.name}」？已经请进对局的照旧演完。` : `下架「${p.name}」？作者那边也会删掉，没结束的对局里改由主持人顺带演。`)) return;
    try {
      await api('DELETE', `/api/ai-personas/${p.id}`);
      setMine((m) => m?.filter((x) => x.id !== p.id) ?? m);
      setHall((h) => h?.filter((x) => x.id !== p.id) ?? h);
      if (detail?.id === p.id) closeDetail();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function closeDetail() {
    setDetail(null);
    navigate('/ai-hall', { replace: true });
  }

  const canTakeDown = !!user?.isAdmin && !!user.permissions.includes('reports');
  const cardProps = {
    guest,
    canTakeDown,
    onInvite: setInviting,
    onEdit: (p: PersonaView) => setEditing(p),
    onDelete: (p: PersonaView) => void remove(p),
  };
  const list = tab === 'hall' ? hall : mine;
  const full = (mine?.length ?? 0) >= PERSONAS_MAX;

  return (
    <div className="ai-hall">
      <div className="page-head">
        <h1>AI 大厅</h1>
        {!guest && (
          <button type="button" className="btn btn-small btn-primary" disabled={full} onClick={() => setEditing('new')}>
            新建 AI 角色
          </button>
        )}
      </div>

      <div className="shelf-tabs" role="tablist" aria-label="AI 角色">
        <button type="button" role="tab" className="shelf-tab" aria-selected={tab === 'hall'} onClick={() => setTab('hall')}>
          <span className="shelf-tab-name">大厅</span>
        </button>
        <button type="button" role="tab" className="shelf-tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>
          <span className="shelf-tab-name">我的 AI 角色</span>
          {!guest && mine !== null && (
            <span className="shelf-tab-sub">
              {mine.length}/{PERSONAS_MAX}
            </span>
          )}
        </button>
      </div>

      {tab === 'hall' && (
        <div className="persona-tools">
          <label htmlFor="persona-search" className="visually-hidden">
            找 AI 角色
          </label>
          <input id="persona-search" type="search" maxLength={40} value={q} placeholder="找名字、简介" onChange={(e) => setQ(e.target.value)} />
          <div className="persona-sort" role="group" aria-label="排序">
            {SORTS.map((s) => (
              <button key={s.key} type="button" className="persona-sort-option" aria-pressed={sort === s.key} onClick={() => setSort(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {tab === 'mine' && guest ? (
        <GuestNote what="做自己的 AI 角色、把 AI 角色请进对局。" />
      ) : list === null ? (
        !error && <p className="muted">正在加载……</p>
      ) : list.length === 0 ? (
        <p className="empty">{tab === 'mine' ? '你还没有做 AI 角色。' : search ? '没有找到。' : '大厅里还没有 AI 角色。'}</p>
      ) : (
        <ul className="persona-grid">
          {list.map((p) => (
            <PersonaCard key={p.id} persona={p} {...cardProps} />
          ))}
        </ul>
      )}
      {tab === 'hall' && more && hall && (
        <p className="persona-more">
          <button type="button" className="btn btn-small" onClick={() => void loadHall(hall.length)}>
            再看一些
          </button>
        </p>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? '新建 AI 角色' : '编辑 AI 角色'} wide>
        {editing !== null && <PersonaForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} onSaved={saved} onCancel={() => setEditing(null)} />}
      </Modal>
      <Modal open={inviting !== null} onClose={() => setInviting(null)} title={inviting ? `请「${inviting.name}」进对局` : '请进对局'} wide>
        {inviting && <InviteRooms persona={inviting} />}
      </Modal>
      <Modal open={detail !== null} onClose={closeDetail} title="AI 角色" wide>
        {detail && (
          <ul className="persona-grid persona-single">
            <PersonaCard persona={detail} {...cardProps} open />
          </ul>
        )}
      </Modal>
    </div>
  );
}

/** 一张名帖：名字、作者和几个人请过、一句简介，展开看人设。 */
function PersonaCard({
  persona: p,
  guest,
  canTakeDown,
  onInvite,
  onEdit,
  onDelete,
  open: initiallyOpen = false,
}: {
  persona: PersonaView;
  guest: boolean;
  canTakeDown: boolean;
  onInvite: (p: PersonaView) => void;
  onEdit: (p: PersonaView) => void;
  onDelete: (p: PersonaView) => void;
  open?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const promptId = `persona-prompt-${p.id}`;
  return (
    <li className={p.public ? 'persona-card' : 'persona-card is-private'}>
      <div className="persona-head">
        <span className="persona-mark" aria-hidden="true">
          {[...p.name][0] ?? '?'}
        </span>
        <div className="persona-title">
          <h2 className="persona-name">{p.name}</h2>
          <p className="persona-by">
            <Avatar user={p.author} size={18} />
            <Link to={profilePath(p.author.publicId)}>{p.author.displayName}</Link>
            {p.invites > 0 && <span className="persona-invites">{p.invites} 人请过</span>}
          </p>
        </div>
        {p.mine && <span className={p.public ? 'tag persona-state is-public' : 'tag persona-state'}>{p.public ? '公开' : '不公开'}</span>}
      </div>
      {p.intro && <p className="persona-intro">{p.intro}</p>}
      {open && p.prompt && (
        <div className="persona-prompt" id={promptId}>
          {p.prompt}
        </div>
      )}
      <div className="persona-actions">
        <button type="button" className="btn btn-small btn-primary" disabled={guest} onClick={() => onInvite(p)}>
          请进对局
        </button>
        {p.prompt && (
          <button type="button" className="linklike" aria-expanded={open} aria-controls={promptId} onClick={() => setOpen((o) => !o)}>
            {open ? '收起人设' : '看人设'}
          </button>
        )}
        <span className="persona-actions-end">
          {p.mine ? (
            <>
              <button type="button" className="btn btn-small" onClick={() => onEdit(p)}>
                编辑
              </button>
              <button type="button" className="btn btn-small btn-quiet" onClick={() => onDelete(p)}>
                删除
              </button>
            </>
          ) : (
            <>
              {!guest && (
                <button
                  type="button"
                  className="linklike persona-report"
                  onClick={() => openFeedback({ kind: 'report', target: { type: 'persona', id: p.id, preview: p.intro || p.name, author: p.author.displayName } })}
                >
                  举报
                </button>
              )}
              {canTakeDown && (
                <button type="button" className="btn btn-small btn-danger" onClick={() => onDelete(p)}>
                  下架
                </button>
              )}
            </>
          )}
        </span>
      </div>
    </li>
  );
}

/** 新建、编辑：名字、简介、人设，公开不公开。保存时先检查内容。 */
function PersonaForm({ initial, onSaved, onCancel }: { initial: PersonaView | null; onSaved: (p: PersonaView) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [intro, setIntro] = useState(initial?.intro ?? '');
  const [prompt, setPrompt] = useState(initial?.prompt ?? '');
  const [isPublic, setPublic] = useState(initial?.public ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => first.current?.focus(), []);
  const promptLength = [...prompt].length;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('给 AI 角色起个名字');
    if (!prompt.trim()) return setError('写一下人设');
    if (promptLength > PERSONA_PROMPT_MAX) return setError(`人设最多${PERSONA_PROMPT_MAX}个字`);
    setBusy(true);
    try {
      const body = { name: name.trim(), intro: intro.trim(), prompt, public: isPublic };
      const r = initial
        ? await api<{ persona: PersonaView }>('PUT', `/api/ai-personas/${initial.id}`, body)
        : await api<{ persona: PersonaView }>('POST', '/api/ai-personas', body);
      onSaved(r.persona);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form persona-form" onSubmit={(e) => void submit(e)} noValidate>
      <div className="field">
        <label htmlFor="persona-name">名字</label>
        <input id="persona-name" ref={first} maxLength={PERSONA_NAME_MAX} value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="persona-intro">简介</label>
        <input id="persona-intro" maxLength={PERSONA_INTRO_MAX} value={intro} disabled={busy} onChange={(e) => setIntro(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="persona-prompt">
          人设{' '}
          <span className={promptLength > PERSONA_PROMPT_MAX ? 'persona-count is-over' : 'persona-count'}>
            {promptLength}/{PERSONA_PROMPT_MAX}
          </span>
        </label>
        <textarea id="persona-prompt" rows={10} value={prompt} disabled={busy} onChange={(e) => setPrompt(e.target.value)} />
      </div>
      <label className="choice">
        <input type="checkbox" checked={isPublic} disabled={busy} onChange={(e) => setPublic(e.target.checked)} />
        <span>公开到 AI 大厅</span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? '正在检查……' : '保存'}
        </button>
        <button type="button" className="btn btn-quiet" disabled={busy} onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

/** 请进对局：自己当房主、还在开团准备的对局，挑一个没人选的身份让它演。 */
function InviteRooms({ persona }: { persona: PersonaView }) {
  const [rooms, setRooms] = useState<PersonaInviteRoom[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ roomId: number; room: string; role: string } | null>(null);

  useEffect(() => {
    api<{ rooms: PersonaInviteRoom[] }>('GET', `/api/ai-personas/${persona.id}/rooms`)
      .then((r) => setRooms(r.rooms))
      .catch((err) => setError(errorMessage(err)));
  }, [persona.id]);

  async function invite(room: PersonaInviteRoom, role: PersonaInviteRoom['roles'][number]) {
    setBusy(true);
    setError('');
    try {
      await api('PUT', `/api/rooms/${room.roomId}/ai-seats/${encodeURIComponent(role.key)}`, { personaId: persona.id });
      setDone({ roomId: room.roomId, room: room.name, role: role.name });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="invite-done">
        <p>
          「{persona.name}」会在「{done.room}」里演「{done.role}」。
        </p>
        <Link to={`/room/${done.roomId}`} className="btn btn-primary">
          去开团准备
        </Link>
      </div>
    );
  }
  return (
    <div className="invite-rooms">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {rooms === null ? (
        !error && <p className="muted">正在找你的对局……</p>
      ) : rooms.length === 0 ? (
        <p className="empty">
          没有能请它进去的对局。<Link to="/scenarios">去开一局</Link>
        </p>
      ) : (
        <ul className="invite-room-list">
          {rooms.map((room) => (
            <li key={room.roomId} className="invite-room">
              <p className="invite-room-name">
                {room.name}
                <span className="muted">《{room.scenarioTitle}》</span>
              </p>
              <ul className="invite-role-list">
                {room.roles.map((role) => (
                  <li key={role.key} className="invite-role">
                    <span className="invite-role-text">
                      <strong>{role.name}</strong>
                      {role.ai && <span className="muted">现在：{role.ai}</span>}
                      <span className="invite-role-public">{role.public}</span>
                    </span>
                    <button type="button" className="btn btn-small" disabled={busy} onClick={() => void invite(room, role)}>
                      {role.ai ? '换它来演' : '请它演'}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
