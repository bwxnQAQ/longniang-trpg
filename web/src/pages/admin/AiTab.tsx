import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, type AiAdminStatus, type AiRoleKey, type ModelGroup } from '../../api';
import { useAuth } from '../../auth';
import { Field } from '../../components/bits';
import { money } from '../../format';
import { ErrorLine } from './common';

// ==================== AI ====================

export function AiTab() {
  const [status, setStatus] = useState<AiAdminStatus | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const load = useCallback(async () => {
    try {
      setStatus(await api<AiAdminStatus>('GET', '/api/admin/ai'));
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function set(enabled: boolean) {
    setBusy(true);
    setError('');
    try {
      await api('PUT', '/api/admin/ai', { enabled });
      setConfirming(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function setModel(role: AiRoleKey, model: string | null, label: string) {
    setBusy(true);
    setError('');
    setSaved('');
    try {
      setStatus(await api<AiAdminStatus>('PUT', '/api/admin/ai/models', { models: { [role]: model } }));
      setSaved(`${label}已经改好，马上生效`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!status) return <ErrorLine error={error} />;
  const nameOf = (model: string) => status.options.find((o) => o.model === model)?.name ?? model;
  return (
    <section className="section" aria-label="AI">
      <div className={status.enabled ? 'ai-switch' : 'ai-switch is-off'}>
        <p className="ai-switch-state">{status.enabled ? 'AI 正常运行' : 'AI 已经关掉了'}</p>
        {status.enabled ? (
          confirming ? (
            <div className="confirm-bar" role="alertdialog" aria-labelledby="ai-off-text">
              <p id="ai-off-text">关掉全站的 AI？正在进行的结算会停在半路，打开以后重新结算。</p>
              <div className="confirm-actions">
                <button type="button" className="btn btn-small btn-danger-solid" disabled={busy} onClick={() => void set(false)}>
                  确认关掉
                </button>
                <button type="button" className="btn btn-small btn-quiet" onClick={() => setConfirming(false)} autoFocus>
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
              紧急关掉 AI
            </button>
          )
        ) : (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void set(true)}>
            打开 AI
          </button>
        )}
      </div>
      <ErrorLine error={error} />

      <h2 className="section-title">用哪个模型</h2>
      <div className="model-table">
        {status.roles.map((r) => {
          const current = status.models[r.key];
          const isDefault = !status.chosen[r.key];
          return (
            <div key={r.key} className="model-row">
              <label htmlFor={`model-${r.key}`} className="model-role">
                {r.label}
              </label>
              <select
                id={`model-${r.key}`}
                value={current}
                disabled={busy}
                onChange={(e) => void setModel(r.key, e.target.value, r.label)}
              >
                {status.options.map((o) => (
                  <option key={o.model} value={o.model} disabled={!o.available && o.model !== current}>
                    {o.name}
                    {o.available ? (o.price ? `（输入 $${o.price.input} / 输出 $${o.price.output}）` : '') : '（没设置密钥）'}
                  </option>
                ))}
                {!status.options.some((o) => o.model === current) && <option value={current}>{current}</option>}
              </select>
              <span className="muted model-source">
                {isDefault ? '默认的（.env 里设的）' : `网页上选的；默认是 ${nameOf(status.defaults[r.key])}`}
              </span>
              {!isDefault && (
                <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void setModel(r.key, null, r.label)}>
                  恢复默认
                </button>
              )}
            </div>
          );
        })}
      </div>
      {saved && (
        <p className="hint" role="status">
          {saved}
        </p>
      )}
      <ul className="plain-list model-notes">
        {status.options.map((o) => (
          <li key={o.model}>
            <strong>{o.name}</strong>：{o.note}
            {o.price && (
              <span className="muted">
                （每百万 token 输入 ${o.price.input}、输出 ${o.price.output}）
              </span>
            )}
          </li>
        ))}
      </ul>

      <DmModelGroups status={status} onSaved={setStatus} />

      {status.openrouter && <OpenRouterModels models={status.openrouter.models} onSaved={setStatus} />}

      <dl className="facts">
        <dt>API 密钥</dt>
        <dd>
          {status.provider === 'fake'
            ? '测试用的假主持人（AI_PROVIDER=fake）'
            : status.providers.map((p) => (
                <span key={p.name} className="block-hint">
                  {p.label}：{p.ready ? '已经设置' : '还没设置'}
                </span>
              ))}
        </dd>
        <dt>花费</dt>
        <dd>
          最近 24 小时 {money(status.cost.day)}，最近 7 天 {money(status.cost.week)}，一共 {money(status.cost.total)}
        </dd>
      </dl>
    </section>
  );
}

const MODEL_GROUPS: ModelGroup[] = ['user', 'admin'];
const MODEL_GROUP_LABEL: Record<ModelGroup, string> = { user: '普通用户', admin: '管理员' };

/**
 * 开局能选的主持模型，按这一局房主的身份分：站长都能选；普通用户、管理员各自能选哪些由站长勾。
 * 普通用户开的局，「跟随网站设置」的模型不在勾选范围里时，自动换成 DeepSeek 的小模型。
 */
function DmModelGroups({ status, onSaved }: { status: AiAdminStatus; onSaved: (s: AiAdminStatus) => void }) {
  const { user } = useAuth();
  const canEdit = !!user?.isOwner;
  const saved = status.dmModelGroups;
  const [draft, setDraft] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => setDraft(saved), [saved]);
  const order = status.options.map((o) => o.model);
  const dirty = MODEL_GROUPS.some((g) => draft[g].join() !== saved[g].join());

  function toggle(group: ModelGroup, model: string) {
    setDraft((d) => {
      const on = d[group].includes(model);
      return { ...d, [group]: order.filter((m) => (m === model ? !on : d[group].includes(m))) };
    });
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      onSaved(await api<AiAdminStatus>('PUT', '/api/admin/ai/dm-model-groups', draft));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2 className="section-title">开局能选的主持模型</h2>
      <div className="table-wrap">
        <table className="table dm-model-groups">
          <thead>
            <tr>
              <th scope="col">模型</th>
              {MODEL_GROUPS.map((g) => (
                <th key={g} scope="col">
                  {MODEL_GROUP_LABEL[g]}
                </th>
              ))}
              <th scope="col">站长</th>
            </tr>
          </thead>
          <tbody>
            {status.options.map((o) => (
              <tr key={o.model}>
                <th scope="row">{o.name}</th>
                {MODEL_GROUPS.map((g) => (
                  <td key={g}>
                    <input
                      type="checkbox"
                      checked={draft[g].includes(o.model)}
                      disabled={!canEdit || busy}
                      aria-label={`${MODEL_GROUP_LABEL[g]}能选${o.name}`}
                      onChange={() => toggle(g, o.model)}
                    />
                  </td>
                ))}
                <td>
                  <input type="checkbox" checked disabled aria-label={`站长能选${o.name}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && dirty && (
        <div className="form-actions">
          <button type="button" className="btn btn-small btn-primary" disabled={busy || MODEL_GROUPS.some((g) => !draft[g].length)} onClick={() => void save()}>
            {busy ? '正在保存……' : '保存'}
          </button>
          <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => setDraft(saved)}>
            取消
          </button>
        </div>
      )}
      <ErrorLine error={error} />
    </>
  );
}

/** OpenRouter 上要用的模型：一行一个，存好以后就能在上面给各项选。正在用的删不掉。 */
function OpenRouterModels({ models, onSaved }: { models: string[]; onSaved: (status: AiAdminStatus) => void }) {
  const joined = models.join('\n');
  const [text, setText] = useState(joined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  useEffect(() => setText(joined), [joined]);
  const list = text
    .split(/[\n,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const dirty = list.join('\n') !== joined;

  async function save() {
    setBusy(true);
    setError('');
    setSaved('');
    try {
      onSaved(await api<AiAdminStatus>('PUT', '/api/admin/ai/openrouter-models', { models: list }));
      setSaved('已经存好，上面可以选了。');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="openrouter-models">
      <h2 className="section-title">OpenRouter 的模型</h2>
      <Field label="一行一个，照 OpenRouter 上的写法" htmlFor="openrouter-models">
        <textarea id="openrouter-models" rows={4} value={text} spellCheck={false} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div className="actions">
        <button type="button" className="btn btn-small" disabled={busy || !dirty} onClick={() => void save()}>
          {busy ? '正在保存……' : '保存'}
        </button>
        {saved && (
          <span className="muted" role="status">
            {saved}
          </span>
        )}
      </div>
      <ErrorLine error={error} />
    </div>
  );
}
