import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * 对话框：用浏览器自带的 <dialog>（打开时页面别的地方点不了，Esc 关闭，焦点自动进去）。点对话框外面也关闭。
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={wide ? 'modal modal-wide' : 'modal'}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // 点的是对话框外面的那层（::backdrop 也算 dialog 本身）
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="modal-body">
          <div className="modal-head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
