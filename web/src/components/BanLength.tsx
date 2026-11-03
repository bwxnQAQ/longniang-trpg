import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { BAN_MAX_HOURS, BAN_PRESETS, banLengthText } from '../../../shared/admin';
import { Field } from './bits';

// 封多久：几个常用的时长、永久，或者自己填几小时、几天。账号详情里封号、批量封号都用它。
// 封号的表单（原因、封多久、封号按钮）账号详情和个人主页（V0.8.1）共用。

export type BanLength = { choice: string; amount: string; unit: 'hour' | 'day' };

/** 一开始选的是永久（和以前一样，一直封着，等管理员解封）。 */
export const DEFAULT_BAN_LENGTH: BanLength = { choice: 'forever', amount: '', unit: 'day' };

const keyOf = (hours: number | null) => (hours === null ? 'forever' : String(hours));

/** 选的时长换成小时数：永久是 null；自己填的数不对（不是正整数、超过一年）是 undefined。 */
export function banHours(v: BanLength): number | null | undefined {
  if (v.choice !== 'custom') return BAN_PRESETS.find((p) => keyOf(p.hours) === v.choice)?.hours ?? null;
  const n = Number(v.amount);
  if (!v.amount.trim() || !Number.isInteger(n) || n < 1) return undefined;
  const hours = v.unit === 'day' ? n * 24 : n;
  return hours <= BAN_MAX_HOURS ? hours : undefined;
}

/** 自己填的数不对时说一句（还没填不说）。 */
function customError(v: BanLength): string {
  if (v.choice !== 'custom' || !v.amount.trim() || banHours(v) !== undefined) return '';
  const n = Number(v.amount);
  return Number.isInteger(n) && n >= 1 ? '最长 365 天，再长就选永久' : '要填 1 以上的整数';
}

export function BanLengthPicker({ id, value, onChange, disabled }: { id: string; value: BanLength; onChange: (v: BanLength) => void; disabled?: boolean }) {
  const error = customError(value);
  return (
    <span className="ban-length">
      <select id={id} value={value.choice} disabled={disabled} onChange={(e) => onChange({ ...value, choice: e.target.value })}>
        {BAN_PRESETS.map((p) => (
          <option key={keyOf(p.hours)} value={keyOf(p.hours)}>
            {p.label}
          </option>
        ))}
        <option value="custom">自定义</option>
      </select>
      {value.choice === 'custom' && (
        <>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className="input-short ban-length-amount"
            aria-label="封多久"
            value={value.amount}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, amount: e.target.value })}
          />
          <select aria-label="单位" value={value.unit} disabled={disabled} onChange={(e) => onChange({ ...value, unit: e.target.value as BanLength['unit'] })}>
            <option value="hour">小时</option>
            <option value="day">天</option>
          </select>
        </>
      )}
      {error && <span className="form-error ban-length-error">{error}</span>}
    </span>
  );
}

/**
 * 封一个人：原因（选填）、封多久，点「封号」先确认再封。
 * run 包着请求（忙着、出错、封完重新加载由外面管）；封成功了表单清空，再调 onBanned。
 */
export function BanForm({
  userId,
  displayName,
  busy,
  run,
  onBanned,
}: {
  userId: number;
  displayName: string;
  busy: boolean;
  run: (work: () => Promise<unknown>) => unknown;
  onBanned?: () => void;
}) {
  const [reason, setReason] = useState('');
  const [length, setLength] = useState<BanLength>(DEFAULT_BAN_LENGTH);
  return (
    <form
      className="inline-form"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const hours = banHours(length);
        if (hours === undefined) return;
        const what = hours === null ? `永久封禁 ${displayName}` : `封禁 ${displayName} ${banLengthText(hours)}`;
        if (!window.confirm(`${what}？他的登录会马上失效，还在等的行动会撤回。`)) return;
        void run(async () => {
          await api('POST', `/api/admin/users/${userId}/ban`, { reason, hours });
          setReason('');
          setLength(DEFAULT_BAN_LENGTH);
          onBanned?.();
        });
      }}
    >
      <Field label="原因（选填）" htmlFor={`ban-${userId}`}>
        <input id={`ban-${userId}`} maxLength={100} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="封号的原因" />
      </Field>
      <Field label="封多久" htmlFor={`ban-length-${userId}`}>
        <BanLengthPicker id={`ban-length-${userId}`} value={length} onChange={setLength} disabled={busy} />
      </Field>
      <button className="btn btn-small btn-danger" disabled={busy || banHours(length) === undefined}>
        封号
      </button>
    </form>
  );
}
