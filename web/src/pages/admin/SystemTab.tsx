import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, type BackupKind, type SystemInfo } from '../../api';
import { formatDateTime, isoTime, pad } from '../../format';
import { ErrorLine } from './common';

// ==================== 版本和数据 ====================

const BACKUP_KIND_LABEL: Record<BackupKind, string> = {
  upgrade: '升级前自动备份',
  import: '复制数据前的备份',
  manual: '手动备份',
  reset: '清空数据前的备份',
  daily: '每天自动',
};

/** 服务器开了多久：3 天 4 小时、5 小时 12 分钟、8 分钟。 */
function uptimeText(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} 天 ${hours % 24} 小时`;
  if (hours > 0) return `${hours} 小时 ${minutes % 60} 分钟`;
  return minutes > 0 ? `${minutes} 分钟` : '不到 1 分钟';
}

/** 错误的时间：带上秒（一分钟里可能有好几条）。 */
function errorTime(ms: number): string {
  return `${formatDateTime(ms)}:${pad(new Date(ms).getSeconds())}`;
}

/** 错误的第一行（折起来时显示）。 */
function firstLine(text: string): string {
  return text.trim().split('\n')[0] ?? '';
}

function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function countsText(c: NonNullable<SystemInfo['importedFrom']>['counts']): string {
  if (!c) return '';
  const parts = [
    c.users !== null ? `账号 ${c.users} 个` : '',
    c.rooms !== null ? `对局 ${c.rooms} 局` : '',
    c.scenarios !== null ? `AI 生成和导入的剧本 ${c.scenarios} 个` : '',
  ].filter(Boolean);
  return parts.join('，');
}

export function SystemTab() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState('');
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState('');

  const load = useCallback(async () => {
    try {
      setInfo(await api<SystemInfo>('GET', '/api/admin/system'));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function backup() {
    setBusy(true);
    setError('');
    setCreated('');
    try {
      const r = await api<SystemInfo & { created: string }>('POST', '/api/admin/backup', {});
      setInfo(r);
      setCreated(r.created);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  /** 清空「最近的错误」（只清服务器内存里的列表，日志文件不动）。 */
  async function clearErrors() {
    setClearing(true);
    setClearError('');
    try {
      setInfo(await api<SystemInfo>('DELETE', '/api/admin/system/errors'));
    } catch (err) {
      setClearError(errorMessage(err));
    } finally {
      setClearing(false);
    }
  }

  if (!info) return <ErrorLine error={error} />;
  const from = info.importedFrom;
  return (
    <>
      <section className="section" aria-label="版本和数据">
        <dl className="facts">
          <dt>版本</dt>
          <dd>
            V{info.version}
            <span className="hint block-hint">作者 {info.author}</span>
          </dd>
          <dt>数据</dt>
          <dd>
            {info.dbFile ? (
              <>
                <span className="path">{info.dbFile}</span>
                <span className="hint block-hint">
                  {fileSize(info.dbSize)}，数据库第 {info.schemaVersion} 版
                </span>
              </>
            ) : (
              '数据库不在文件里'
            )}
          </dd>
          <dt>来历</dt>
          <dd>
            {from ? (
              <>
                {formatDateTime(from.at)} 从{from.version ? ` V${from.version} ` : '更早的版本'}复制过来
                <span className="path block-hint">{from.from}</span>
                {(countsText(from.counts) || from.scenarioFiles.length > 0) && (
                  <span className="hint block-hint">
                    {[countsText(from.counts), from.scenarioFiles.length ? `自己加的剧本文件 ${from.scenarioFiles.join('、')}` : '']
                      .filter(Boolean)
                      .join('；')}
                  </span>
                )}
              </>
            ) : (
              '在这个文件夹里新建的，不是从旧版本复制来的'
            )}
          </dd>
          <dt>运行</dt>
          <dd>
            {uptimeText(info.runtime.uptimeSeconds)}
            <span className="hint block-hint">内存 {info.runtime.rssMb} MB</span>
          </dd>
        </dl>
      </section>

      <section className="section" aria-labelledby="backup-title">
        <h2 id="backup-title">备份</h2>
        <div className="actions">
          <button type="button" className="btn" disabled={busy || !info.dbFile} onClick={() => void backup()}>
            {busy ? '正在备份……' : '现在备份一份'}
          </button>
        </div>
        {info.dbFile && (
          <p className="hint">
            最近一次每天自动备份：{info.runtime.lastDailyBackupAt === null ? '还没有' : formatDateTime(info.runtime.lastDailyBackupAt)}
          </p>
        )}
        {created && (
          <p className="hint" role="status">
            备份好了：{created}
          </p>
        )}
        <ErrorLine error={error} />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">时间</th>
                <th scope="col">种类</th>
                <th scope="col">大小</th>
                <th scope="col">文件名</th>
              </tr>
            </thead>
            <tbody>
              {info.backups.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    还没有备份。
                  </td>
                </tr>
              )}
              {info.backups.map((b) => (
                <tr key={b.name}>
                  <td className="nowrap">{formatDateTime(b.createdAt)}</td>
                  <td className="nowrap">{BACKUP_KIND_LABEL[b.kind]}</td>
                  <td className="nowrap">{fileSize(b.size)}</td>
                  <td>
                    <span className="path">{b.name}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {info.backupDir && (
          <p className="hint">
            备份放在 <span className="path">{info.backupDir}</span>
          </p>
        )}
      </section>

      <section className="section" aria-labelledby="errors-title">
        <div className="section-head">
          <h2 id="errors-title">最近的错误</h2>
          {info.runtime.errors.length > 0 && (
            <button type="button" className="btn btn-small btn-quiet" disabled={clearing} onClick={() => void clearErrors()}>
              清空
            </button>
          )}
        </div>
        <ErrorLine error={clearError} />
        {info.runtime.errors.length === 0 ? (
          <p className="muted">没有。</p>
        ) : (
          <ol className="error-log">
            {info.runtime.errors.map((e, i) => (
              <li key={`${e.at}-${i}`}>
                <details>
                  <summary>
                    <time className="error-log-time" dateTime={isoTime(e.at)}>
                      {errorTime(e.at)}
                    </time>
                    <span className="error-log-first">{firstLine(e.text)}</span>
                  </summary>
                  <pre className="error-log-text">{e.text}</pre>
                </details>
              </li>
            ))}
          </ol>
        )}
        {info.runtime.logDir && (
          <p className="hint">
            日志放在 <span className="path">{info.runtime.logDir}</span>
          </p>
        )}
      </section>
    </>
  );
}
