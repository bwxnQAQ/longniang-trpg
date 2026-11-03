import { useEffect, useMemo, useRef, useState } from 'react';
import { api, errorMessage } from '../api';
import logoUrl from '../assets/logo.webp';
import { Modal } from '../components/Modal';
import { defaultReportPicks, REPORT_HIGHLIGHTS, type ReportData } from '../../../shared/highlights';
import { drawReportCard, reportFileName, saveCard, siteFonts } from './report-card';

// 战报（V0.8.0）：预览一张战报图，选放哪几条名场面、放不放结局，存成 PNG。图在浏览器里画（report-card.ts）。

let logoPromise: Promise<HTMLImageElement | null> | null = null;

/** 网站的标志（画在战报右下角）；加载不出来就不画。 */
function loadLogo(): Promise<HTMLImageElement | null> {
  logoPromise ??= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = logoUrl;
  });
  return logoPromise;
}

export function ReportDialog({ roomId, onClose }: { roomId: number; onClose: () => void }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const [showEnding, setShowEnding] = useState(false);
  const [picks, setPicks] = useState<number[]>([]);
  /** undefined：标志还在加载。 */
  const [logo, setLogo] = useState<HTMLImageElement | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let live = true;
    api<ReportData>('GET', `/api/rooms/${roomId}/report`)
      .then((d) => {
        if (!live) return;
        setData(d);
        setPicks(defaultReportPicks(d.highlights));
      })
      .catch((err) => live && setError(errorMessage(err)));
    void loadLogo().then((img) => live && setLogo(img));
    return () => {
      live = false;
    };
  }, [roomId]);

  const chosen = useMemo(() => (data ? data.highlights.filter((h) => picks.includes(h.logId)) : []), [data, picks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || logo === undefined) return;
    drawReportCard(canvas, { data, showEnding, highlights: chosen, fonts: siteFonts(), logo, today: Date.now() });
  }, [data, showEnding, chosen, logo]);

  function toggle(logId: number) {
    setPicks((list) => (list.includes(logId) ? list.filter((x) => x !== logId) : list.length >= REPORT_HIGHLIGHTS ? list : [...list, logId]));
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveCard(canvas, reportFileName(data.room.name));
    } catch {
      setSaveError('图片没存下来，再试一次');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="战报" wide>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : !data ? (
        <p className="muted">正在准备……</p>
      ) : (
        <div className="zhanbao">
          <div className="zhanbao-preview">
            <canvas ref={canvasRef} className="zhanbao-canvas" role="img" aria-label={`「${data.room.name}」的战报`} />
          </div>
          <div className="zhanbao-options">
            {data.ending && (
              <label className="zhanbao-check">
                <input type="checkbox" checked={showEnding} onChange={(e) => setShowEnding(e.target.checked)} />
                放上结局（剧透）
              </label>
            )}
            <fieldset className="zhanbao-picks">
              <legend>
                名场面 <span className="muted">{chosen.length}/{REPORT_HIGHLIGHTS}</span>
              </legend>
              {data.highlights.length === 0 ? (
                <p className="placeholder">还没有收藏的名场面。</p>
              ) : (
                <ul>
                  {data.highlights.map((h) => {
                    const on = picks.includes(h.logId);
                    return (
                      <li key={h.logId}>
                        <label className={on ? 'zhanbao-pick is-on' : 'zhanbao-pick'}>
                          <input type="checkbox" checked={on} disabled={!on && picks.length >= REPORT_HIGHLIGHTS} onChange={() => toggle(h.logId)} />
                          <span className="zhanbao-pick-text">
                            <span className="zhanbao-pick-label">
                              {h.label}
                              {h.onlyMe && <span className="private-mark">只有你知道</span>}
                              {h.whisper && <span className="private-mark">悄悄话</span>}
                            </span>
                            <span className="zhanbao-pick-snippet">{h.text}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>
          </div>
          <div className="zhanbao-save">
            {saveError && (
              <p className="form-error" role="alert">
                {saveError}
              </p>
            )}
            <button type="button" className="btn btn-primary" disabled={saving || logo === undefined} onClick={() => void save()}>
              {saving ? '正在保存……' : '保存图片'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
