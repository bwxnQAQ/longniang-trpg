import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import { formatDateTime } from '../format';
import { useAuth } from '../auth';
import { currentSubscription, disablePush, enablePush, endpointHash, pushSupport, syncThisDevice } from '../push';
import { PUSH_CATEGORIES, PUSH_CATEGORY_LABEL, type PushCategory, type PushDevice, type PushInfo } from '../../../shared/push';

// 账号设置里的「浏览器通知」（V0.8.0）：这台设备打开、关闭；推哪几类；收通知的设备；发一条试试。游客没有这一块。

type HereState = 'loading' | 'ok-on' | 'ok-off' | 'denied' | 'unsupported' | 'insecure' | 'ios-home';

const HERE_LABEL: Record<HereState, string> = {
  loading: '……',
  'ok-on': '已打开',
  'ok-off': '没打开',
  denied: '被浏览器拦了',
  unsupported: '这个浏览器不支持',
  insecure: '要用 https 打开网站',
  'ios-home': '',
};

/** 服务器说的照原样给（是中文）；浏览器自己的报错是英文，换成一句中文。 */
function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function PushSettings() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [info, setInfo] = useState<PushInfo | null>(null);
  const [here, setHere] = useState<HereState>('loading');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<PushCategory | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  /** 读服务器上的设置和设备；带上这台设备的推送地址，看它在不在我的设备里。 */
  const load = useCallback(async () => {
    const support = pushSupport();
    // 刚打开网站：先把这台设备的订阅绑到现在的登录上（登录以后本来就会做，这里等它做完再看）
    if (support === 'ok' && userId !== null) await syncThisDevice(userId, false);
    let endpoint: string | null = null;
    if (support === 'ok') endpoint = (await currentSubscription().catch(() => null))?.endpoint ?? null;
    // 只传推送地址的哈希（推送地址不进网址、不进访问日志）
    const device = endpoint ? await endpointHash(endpoint).catch(() => null) : null;
    const r = await api<PushInfo>('GET', device ? `/api/push?device=${device}` : '/api/push');
    setInfo(r);
    if (support !== 'ok') setHere(support);
    else if (Notification.permission === 'denied') setHere('denied');
    else setHere(r.devices.some((d) => d.current) ? 'ok-on' : 'ok-off');
  }, [userId]);

  useEffect(() => {
    load().catch((err) => setError(messageOf(err, '读不到通知的设置，刷新一下试试')));
  }, [load]);

  async function run(work: () => Promise<void>, fallback: string) {
    setBusy(true);
    setError('');
    setDone('');
    try {
      await work();
    } catch (err) {
      setError(messageOf(err, fallback));
    } finally {
      setBusy(false);
    }
  }

  const turnOn = () =>
    run(async () => {
      if (!info) return;
      const r = await enablePush(info.publicKey);
      if (r === 'denied') setHere('denied');
      else if (r === 'ok') await load();
    }, '这个浏览器现在打不开通知，过一会儿再试');

  const turnOff = () =>
    run(async () => {
      await disablePush();
      await load();
    }, '没关掉，过一会儿再试');

  const remove = (device: PushDevice) =>
    run(async () => {
      // 删的是这台：浏览器里的订阅也取消掉
      if (device.current) await disablePush();
      else await api('DELETE', `/api/push/devices/${device.id}`);
      await load();
    }, '没删掉，过一会儿再试');

  const test = () =>
    run(async () => {
      const r = await api<{ sent: number }>('POST', '/api/push/test');
      setDone(r.sent > 1 ? `发给了 ${r.sent} 台设备` : '发出去了');
    }, '没发出去，过一会儿再试');

  async function toggle(category: PushCategory, on: boolean) {
    if (!info) return;
    setSaving(category);
    setError('');
    setDone('');
    try {
      const r = await api<{ prefs: PushInfo['prefs'] }>('PUT', '/api/push/prefs', { [category]: on });
      setInfo({ ...info, prefs: r.prefs });
    } catch (err) {
      setError(messageOf(err, '没保存上，过一会儿再试'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="account-section push-settings" aria-labelledby="push-title">
      <h2 id="push-title">浏览器通知</h2>

      <div className="push-here">
        <span className="push-here-name">这台设备</span>
        <span className={`push-state is-${here}`} role="status">
          {here === 'ios-home' ? 'iPhone、iPad 要先在 Safari 里「添加到主屏幕」，从主屏幕打开以后才能收通知' : HERE_LABEL[here]}
        </span>
        {here === 'ok-off' && (
          <button type="button" className="btn btn-small btn-primary" disabled={busy || !info} onClick={() => void turnOn()}>
            打开
          </button>
        )}
        {here === 'ok-on' && (
          <button type="button" className="btn btn-small" disabled={busy} onClick={() => void turnOff()}>
            关闭
          </button>
        )}
      </div>

      {info && (
        <>
          <fieldset className="push-kinds">
            <legend>推哪几类</legend>
            {PUSH_CATEGORIES.map((c) => (
              <label key={c} className="choice">
                <input type="checkbox" checked={info.prefs[c]} disabled={saving !== null} onChange={(e) => void toggle(c, e.target.checked)} />
                <span>{PUSH_CATEGORY_LABEL[c]}</span>
              </label>
            ))}
          </fieldset>

          {info.devices.length > 0 && (
            <div className="push-devices">
              <h3>收通知的设备</h3>
              <ul>
                {info.devices.map((d) => (
                  <li key={d.id}>
                    <div className="push-device-main">
                      <span className="push-device-name">
                        {d.label}
                        {d.current && <span className="tag">这台</span>}
                      </span>
                      <span className="push-device-time">{d.lastOkAt ? `最近收到 ${formatDateTime(d.lastOkAt)}` : '还没收到过'}</span>
                    </div>
                    <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void remove(d)}>
                      删除
                    </button>
                  </li>
                ))}
              </ul>
              <div className="form-actions">
                <button type="button" className="btn btn-small" disabled={busy} onClick={() => void test()}>
                  发一条试试
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="form-ok" role="status">
          {done}
        </p>
      )}
    </section>
  );
}
