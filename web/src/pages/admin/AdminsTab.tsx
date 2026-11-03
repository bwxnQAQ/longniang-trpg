import { useCallback, useEffect, useState } from 'react';
import { ADMIN_PERMISSIONS, api, errorMessage, PERMISSION_LABEL, type AdminPermission, type AdminUser, type User } from '../../api';
import { Avatar, OnlineDot } from '../../components/people';
import { ALL_PERMISSIONS, DEFAULT_PERMISSIONS } from '../../../../shared/admin';
import { ErrorLine } from './common';

// ==================== 管理员（只有站长） ====================

/** 任命管理员、改权限、撤销。只有站长能用。 */
export function RoleEditor({ user: u, onChanged, startOpen = false }: { user: AdminUser; onChanged: (u: AdminUser) => void; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen || u.isAdmin);
  const [perms, setPerms] = useState<AdminPermission[]>(u.isAdmin ? u.permissions : [...DEFAULT_PERMISSIONS]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [demoting, setDemoting] = useState(false);
  const changed = u.isAdmin && (perms.length !== u.permissions.length || perms.some((p) => !u.permissions.includes(p)));

  useEffect(() => {
    setPerms(u.isAdmin ? u.permissions : [...DEFAULT_PERMISSIONS]);
  }, [u.isAdmin, u.permissions]);

  async function save(role: 'user' | 'admin') {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ user: AdminUser }>('PUT', `/api/admin/users/${u.id}/role`, role === 'admin' ? { role, permissions: ALL_PERMISSIONS.filter((p) => perms.includes(p)) } : { role });
      setDemoting(false);
      onChanged(r.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="role-editor role-editor-closed">
        {u.banned ? null : (
          <button type="button" className="btn btn-small" onClick={() => setOpen(true)}>
            任命为管理员……
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="role-editor">
      <h3>{u.isAdmin ? `${u.displayName}的管理员权限` : `任命 ${u.displayName} 为管理员`}</h3>
      <fieldset className="perm-list" disabled={busy}>
        <legend className="visually-hidden">权限</legend>
        {ADMIN_PERMISSIONS.map((p) => (
          <label key={p.key} className="choice">
            <input
              type="checkbox"
              checked={perms.includes(p.key)}
              onChange={(e) => setPerms((list) => (e.target.checked ? [...list, p.key] : list.filter((x) => x !== p.key)))}
            />
            <span>
              <strong>{p.label}</strong>
            </span>
          </label>
        ))}
      </fieldset>
      <ErrorLine error={error} />
      <div className="form-actions">
        {u.isAdmin ? (
          <>
            <button type="button" className="btn btn-small btn-primary" disabled={busy || !changed} onClick={() => void save('admin')}>
              保存权限
            </button>
            {demoting ? (
              <span className="batch-confirm">
                <span>撤销 {u.displayName} 的管理员身份？他会变回普通用户，不限额度也会取消。</span>
                <button type="button" className="btn btn-small btn-danger-solid" disabled={busy} onClick={() => void save('user')}>
                  确认撤销
                </button>
                <button type="button" className="btn btn-small btn-quiet" onClick={() => setDemoting(false)}>
                  取消
                </button>
              </span>
            ) : (
              <button type="button" className="btn btn-small btn-quiet btn-danger-text" disabled={busy} onClick={() => setDemoting(true)}>
                撤销管理员
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" className="btn btn-small btn-primary" disabled={busy || u.banned !== null} onClick={() => void save('admin')}>
              任命为管理员
            </button>
            {!startOpen && (
              <button type="button" className="btn btn-small btn-quiet" onClick={() => setOpen(false)}>
                取消
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function AdminsTab({ me }: { me: User }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState('');
  const [pick, setPick] = useState('');
  const [editing, setEditing] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers((await api<{ users: AdminUser[] }>('GET', '/api/admin/users')).users);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!users) return <ErrorLine error={error} />;
  const owner = users.find((u) => u.isOwner) ?? null;
  const admins = users.filter((u) => u.isAdmin && !u.isOwner);
  const candidates = users.filter((u) => !u.isAdmin && !u.isOwner && !u.isGuest && !u.banned);
  const picked = candidates.find((u) => u.username === pick.trim()) ?? null;

  return (
    <section className="section" aria-label="管理员">
      <ErrorLine error={error} />
      {owner && (
        <div className="admin-card">
          <div className="admin-card-head">
            <Avatar user={owner} size={36} />
            <div>
              <p>
                <strong>{owner.displayName}</strong>
                <span className="muted"> {owner.username}，UID {owner.uid}</span>
                {owner.id === me.id && <span className="you">（你）</span>}
              </p>
              <p className="muted">站长：全部权限</p>
            </div>
          </div>
        </div>
      )}
      <h2 className="section-title">管理员（{admins.length}）</h2>
      {admins.length === 0 && <p className="empty">还没有别的管理员。</p>}
      {admins.map((u) => (
        <div key={u.id} className="admin-card">
          <div className="admin-card-head">
            <Avatar user={u} size={36} />
            <div>
              <p>
                <strong>{u.displayName}</strong>
                <span className="muted"> {u.username}，UID {u.uid}</span>
                <OnlineDot online={u.online} />
              </p>
              <p className="muted">{u.permissions.map((p) => PERMISSION_LABEL[p]).join('、') || '没有权限'}</p>
            </div>
            <button type="button" className="btn btn-small btn-quiet" aria-expanded={editing === u.id} onClick={() => setEditing(editing === u.id ? null : u.id)}>
              {editing === u.id ? '收起' : '改权限'}
            </button>
          </div>
          {editing === u.id && (
            <RoleEditor
              user={u}
              onChanged={() => {
                void load();
              }}
            />
          )}
        </div>
      ))}

      <h2 className="section-title">任命新的管理员</h2>
      <div className="field">
        <label htmlFor="appoint-user">用户名</label>
        <input id="appoint-user" list="appoint-candidates" value={pick} onChange={(e) => setPick(e.target.value)} placeholder="要任命的人的用户名" />
        <datalist id="appoint-candidates">
          {candidates.map((u) => (
            <option key={u.id} value={u.username}>
              {u.displayName}
            </option>
          ))}
        </datalist>
      </div>
      {pick.trim() && !picked && <p className="muted">没有找到这个用户名，或者他已经是管理员了。</p>}
      {picked && (
        <RoleEditor
          key={picked.id}
          user={picked}
          startOpen
          onChanged={() => {
            setPick('');
            void load();
          }}
        />
      )}
    </section>
  );
}
