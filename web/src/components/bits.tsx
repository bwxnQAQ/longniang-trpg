import { useState, type ReactNode } from 'react';
import { STATUS_LABEL, type RoomStatus } from '../api';
import logoUrl from '../assets/logo.webp';
import logoSmallUrl from '../assets/logo-small.webp';

// 站点标志：龙娘趴在骰子上，下面写着「龙娘跑团」。整张图就是标志，用的时候不要裁切。
// 原图是白底，web/src/assets 里的版本把四周的白底变成了透明，深色模式下也能用。
// 浏览器标签页和手机桌面用的图标在 web/public 里，是同一张图的小尺寸。

export const APP_NAME = '龙娘跑团';

/** 顶栏里的小标志。旁边另外写着站名，所以这里不用读出来。 */
export function Logo({ size = 40 }: { size?: number }) {
  return <img className="logo" src={logoSmallUrl} width={size} height={size} alt="" aria-hidden="true" />;
}

/** 登录、注册页顶上的大标志，图里已经写着站名。 */
export function AuthBrand() {
  return (
    <div className="auth-brand">
      <img className="auth-logo" src={logoUrl} width={280} height={280} alt={APP_NAME} />
    </div>
  );
}

/** 对局状态像盖在卷宗上的戳。 */
export function Stamp({ status }: { status: RoomStatus }) {
  return <span className={`stamp stamp-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && (
        <p className="hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function CopyButton({ text, label, className = 'btn btn-small' }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = fallbackCopy(text);
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      window.prompt('复制下面的内容：', text);
    }
  }

  return (
    <button type="button" className={className} onClick={copy}>
      <span aria-live="polite">{copied ? '已复制' : label}</span>
    </button>
  );
}

// 不是 HTTPS 的地址上浏览器不给用剪贴板接口，退回到老办法
function fallbackCopy(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
