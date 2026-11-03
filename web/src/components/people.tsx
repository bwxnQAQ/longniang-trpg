import type { CSSProperties } from 'react';
import type { Identity, UserBrief } from '../api';
import { Link } from '../router';

// 显示一个人：头像（戴着头像框的画一圈框，V0.7.0）、名字（点了去个人主页）、身份标记。

/** 个人主页的地址：用公开编号（不带用户名）。 */
export function profilePath(publicId: string): string {
  return `/u/${encodeURIComponent(publicId)}`;
}

/** 没有头像时用名字的第一个字，底色按公开编号固定在几种颜色里挑一种。 */
const TINTS = ['ink', 'seal', 'gold', 'jade', 'blue', 'plum'] as const;

function tintOf(key: string): (typeof TINTS)[number] {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return TINTS[h % TINTS.length];
}

/**
 * 头像。frame：戴着的头像框（frame-ink……），在头像外面画一圈（styles.css 的 .avatar-frame-…）；
 * 框的粗细跟着头像的大小走（--ring）。
 */
export function Avatar({ user, size = 32 }: { user: Pick<UserBrief, 'publicId' | 'displayName' | 'avatar'> & { frame?: string | null }; size?: number }) {
  const framed = user.frame ? ` avatar-framed avatar-${user.frame}` : '';
  const ring = user.frame ? ({ '--ring': `${Math.min(5, Math.max(2, Math.round(size / 16)))}px` } as CSSProperties) : undefined;
  if (user.avatar) {
    return (
      <img className={`avatar${framed}`} style={ring} src={user.avatar} width={size} height={size} alt="" aria-hidden="true" loading="lazy" decoding="async" />
    );
  }
  const first = [...user.displayName.trim()][0] ?? '?';
  return (
    <span
      className={`avatar avatar-letter avatar-${tintOf(user.publicId)}${framed}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.46), ...ring }}
      aria-hidden="true"
    >
      {first}
    </span>
  );
}

const IDENTITY_TAG: Partial<Record<Identity, string>> = { guest: '游客', admin: '管理员', owner: '站长' };

/** 游客、管理员、站长名字旁边的小标记（普通用户不标）。 */
export function IdentityTag({ identity }: { identity: Identity }) {
  const label = IDENTITY_TAG[identity];
  return label ? <span className={`tag tag-identity tag-${identity}`}>{label}</span> : null;
}

/** 头像加名字，点了去个人主页。 */
export function UserChip({ user, size = 28, tag = true }: { user: UserBrief; size?: number; tag?: boolean }) {
  return (
    <Link to={profilePath(user.publicId)} className="user-chip">
      <Avatar user={user} size={size} />
      <span className="user-chip-name">{user.displayName}</span>
      {tag && <IdentityTag identity={user.identity} />}
    </Link>
  );
}

export function OnlineDot({ online, label = true }: { online: boolean; label?: boolean }) {
  return (
    <span className={online ? 'presence is-on' : 'presence'}>
      <span className="dot" aria-hidden="true" />
      {label ? (online ? '在线' : '不在线') : <span className="visually-hidden">{online ? '在线' : '不在线'}</span>}
    </span>
  );
}
