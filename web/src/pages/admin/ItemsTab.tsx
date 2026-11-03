import { useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../../api';
import { Field } from '../../components/bits';
import { BUNDLE_MAX, type AdminItemOptions, type ItemGrantResult, type ItemPick } from '../../../../shared/shop-admin';
import { ErrorLine } from './common';

// ==================== 物品（V0.7.1） ====================
// 给一个账号、一批账号（用户名、UID 或公开编号，一行一个或者用空格、逗号隔开）或者所有正式账号发东西。
// 规矩在服务器（server/item-grants.ts）：和发龙晶一样，管理员不能给自己发，管理员的账号只有站长能发，游客、删掉的账号跳过；
// 攒满了的、一个就够的已经有了的也跳过。发完列出几个人拿到了、谁没拿到、为什么。

type Group = 'supplies' | 'consumables' | 'manuals' | 'chest' | 'gear' | 'legendary' | 'frames' | 'dice' | 'outfits' | 'titles';

const GROUPS: { key: Group; label: string; stack: boolean }[] = [
  { key: 'consumables', label: '地下城道具', stack: true },
  { key: 'supplies', label: '吃的用的', stack: true },
  { key: 'manuals', label: '秘籍', stack: true },
  { key: 'chest', label: '宝箱', stack: true },
  { key: 'gear', label: '装备', stack: false },
  { key: 'legendary', label: '传奇装备', stack: false },
  { key: 'frames', label: '头像框', stack: false },
  { key: 'dice', label: '骰子', stack: false },
  { key: 'outfits', label: '宠物装扮', stack: false },
  { key: 'titles', label: '称号', stack: false },
];

/** 一组里能选的东西（宝箱、装备另外选）。 */
function picksOf(options: AdminItemOptions, group: Group): ItemPick[] {
  switch (group) {
    case 'chest':
    case 'gear':
      return [];
    default:
      return options[group];
  }
}

export function ItemsTab() {
  const [options, setOptions] = useState<AdminItemOptions | null>(null);
  const [error, setError] = useState('');
  const [group, setGroup] = useState<Group>('consumables');
  const [pick, setPick] = useState('');
  const [base, setBase] = useState('');
  const [rarity, setRarity] = useState('');
  const [count, setCount] = useState('1');
  const [all, setAll] = useState(false);
  const [accounts, setAccounts] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ItemGrantResult | null>(null);

  useEffect(() => {
    api<{ options: AdminItemOptions }>('GET', '/api/admin/items')
      .then((r) => {
        setOptions(r.options);
        setPick(r.options.consumables[0]?.key ?? '');
        setBase(r.options.gear[0]?.key ?? '');
        setRarity(r.options.rarities[0]?.key ?? '');
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (!options) return <ErrorLine error={error} />;
  const groups = GROUPS.filter((g) => g.key !== 'legendary' || options.legendary.length > 0);
  const stack = GROUPS.find((g) => g.key === group)!.stack;
  const picks = picksOf(options, group);
  const item = group === 'chest' ? 'chest' : group === 'gear' ? `gear:${base}:${rarity}` : group === 'legendary' ? `gear:${pick}:legendary` : pick;
  const itemName =
    group === 'chest'
      ? '宝箱'
      : group === 'gear'
        ? `${options.gear.find((g) => g.key === base)?.name ?? ''}（${options.rarities.find((r) => r.key === rarity)?.name ?? ''}）`
        : (picks.find((p) => p.key === pick)?.name ?? '');
  const n = Number(count);
  const refs = accounts
    .split(/[\s,，、;；]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const ready = (group === 'chest' || group === 'gear' || !!pick) && (!stack || (Number.isInteger(n) && n >= 1 && n <= BUNDLE_MAX)) && (all || refs.length > 0);

  function chooseGroup(g: Group) {
    setGroup(g);
    setPick(picksOf(options!, g)[0]?.key ?? '');
    setResult(null);
  }

  async function grant(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready || busy) return;
    if (all && !window.confirm(`给所有正式账号发「${itemName}」${stack && n > 1 ? `每人 ${n} 个` : ''}？`)) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await api<ItemGrantResult>('POST', '/api/admin/items/grant', { item, ...(stack ? { count: n } : {}), ...(all ? { all: true } : { accounts: refs }) }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section items-tab" aria-label="发物品">
      <form className="form item-grant" onSubmit={grant}>
        <div className="inline-form">
          <Field label="发什么" htmlFor="grant-group">
            <select id="grant-group" value={group} onChange={(e) => chooseGroup(e.target.value as Group)}>
              {groups.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
          </Field>
          {group === 'gear' ? (
            <>
              <Field label="装备" htmlFor="grant-base">
                <select id="grant-base" value={base} onChange={(e) => setBase(e.target.value)}>
                  {options.gear.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="稀有度" htmlFor="grant-rarity">
                <select id="grant-rarity" value={rarity} onChange={(e) => setRarity(e.target.value)}>
                  {options.rarities.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : (
            group !== 'chest' && (
              <Field label={GROUPS.find((g) => g.key === group)!.label} htmlFor="grant-item">
                <select id="grant-item" value={pick} onChange={(e) => setPick(e.target.value)}>
                  {picks.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            )
          )}
          {stack && (
            <div className="field field-narrow">
              <label htmlFor="grant-count">每人几个</label>
              <input id="grant-count" type="number" min="1" max={BUNDLE_MAX} step="1" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
          )}
        </div>
        <fieldset className="field">
          <legend>发给</legend>
          <div className="audience-list">
            <label className="choice">
              <input type="radio" name="grant-to" checked={!all} onChange={() => setAll(false)} />
              <span>指定账号</span>
            </label>
            <label className="choice">
              <input type="radio" name="grant-to" checked={all} onChange={() => setAll(true)} />
              <span>所有正式账号</span>
            </label>
          </div>
        </fieldset>
        {!all && (
          <Field label="账号" htmlFor="grant-accounts">
            <textarea id="grant-accounts" rows={4} value={accounts} onChange={(e) => setAccounts(e.target.value)} placeholder="用户名、UID 或公开编号" />
          </Field>
        )}
        <ErrorLine error={error} />
        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy || !ready}>
            {busy ? '正在发……' : '发'}
          </button>
        </div>
      </form>
      {result && <GrantResult result={result} />}
    </section>
  );
}

/** 发完了列出几个拿到的人（多了只列前面的）。 */
const GRANT_NAMES_SHOWN = 30;

/** 发完了：几个账号拿到了、是谁；攒满了只拿到一部分的；没拿到的和原因。 */
function GrantResult({ result: r }: { result: ItemGrantResult }) {
  return (
    <div className="grant-result" role="status">
      <p>
        {r.item}
        {r.count > 1 && ` × ${r.count}`}：发给了 <strong>{r.granted}</strong> 个账号
      </p>
      {r.recipients.length > 0 && (
        <p className="muted">
          {r.recipients.slice(0, GRANT_NAMES_SHOWN).join('、')}
          {r.recipients.length > GRANT_NAMES_SHOWN && ` 等 ${r.recipients.length} 个`}
        </p>
      )}
      {r.capped.length > 0 && <p className="muted">只发了一部分：{r.capped.map((c) => `${c.name}（${c.count} 个）`).join('、')}</p>}
      {r.skipped.length > 0 && (
        <>
          <h3 className="grant-skipped-title">没发的 {r.skipped.length} 个</h3>
          <ul className="plain-list grant-skipped">
            {r.skipped.map((s, i) => (
              <li key={i}>
                {s.name}
                <span className="muted">：{s.reason}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
