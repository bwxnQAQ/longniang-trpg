import { createContext, Fragment, useContext, useState, type CSSProperties, type ReactNode } from 'react';
import { fieldId, isObj, listAdd, listMove, listRemove, text, type KeyKind, type Obj, type Path } from './doc';

// 剧本编辑器的表单零件：每个输入框对着剧本里的一个位置（path），改了就交给编辑页（ops）改整份剧本。

export type Ops = {
  /** 把 path 处改成 value（undefined 是删掉这一项）。 */
  set: (path: Path, value: unknown) => void;
  /** 按原来的值算出新的值。 */
  edit: (path: Path, fn: (old: unknown) => unknown) => void;
  /** 改标识（引用它的地方跟着改）。 */
  renameKey: (kind: KeyKind, index: number, key: string) => void;
  /** 整份换掉（换规则、换分区这种要连带改好几处的）。 */
  replace: (fn: (doc: Obj) => Obj) => void;
};

export const OpsContext = createContext<Ops | null>(null);

export function useOps(): Ops {
  const ops = useContext(OpsContext);
  if (!ops) throw new Error('useOps 要在编辑页里面用');
  return ops;
}

export type Option = { value: unknown; label: string };

/** 没写（undefined）的当成「没选」：和值是 null 或者空字符串的选项一样。 */
const same = (option: unknown, value: unknown) => Object.is(option, value) || ((option === null || option === '') && value === undefined);

/** 下拉框里没有现在的值（引用了不存在的地点、写错了的值）时显示的那一项。 */
const unknownLabel = (value: unknown) => (value === '' || value === undefined || value === null ? '（没选）' : `（没有这一项：${text(value)}）`);

export function TextInput({ path, value, rows, label }: { path: Path; value: unknown; rows?: number; label?: string }) {
  const ops = useOps();
  const id = fieldId(path);
  const onChange = (v: string) => ops.set(path, v);
  return rows ? (
    <textarea id={id} rows={rows} style={{ '--rows': rows } as CSSProperties} value={text(value)} aria-label={label} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <input id={id} value={text(value)} aria-label={label} autoComplete="off" onChange={(e) => onChange(e.target.value)} />
  );
}

export function TextField({ path, value, label, rows }: { path: Path; value: unknown; label: string; rows?: number }) {
  return (
    <div className="field ed-field">
      <label htmlFor={fieldId(path)}>{label}</label>
      <TextInput path={path} value={value} rows={rows} />
    </div>
  );
}

/** 整数：输到一半还不是数的（比如只打了个负号）先不改剧本，离开输入框时恢复成剧本里的数。 */
export function NumberInput({ path, value, min, max, label }: { path: Path; value: unknown; min: number; max: number; label?: string }) {
  const ops = useOps();
  const [typing, setTyping] = useState<string | null>(null);
  return (
    <input
      id={fieldId(path)}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={1}
      aria-label={label}
      value={typing ?? text(value)}
      onChange={(e) => {
        const raw = e.target.value;
        const n = Number(raw);
        if (raw.trim() !== '' && Number.isFinite(n)) {
          setTyping(null);
          ops.set(path, n);
        } else {
          setTyping(raw);
        }
      }}
      onBlur={() => setTyping(null)}
    />
  );
}

export function NumberField({ path, value, label, min, max }: { path: Path; value: unknown; label: string; min: number; max: number }) {
  return (
    <div className="field ed-field ed-field-short">
      <label htmlFor={fieldId(path)}>{label}</label>
      <NumberInput path={path} value={value} min={min} max={max} />
    </div>
  );
}

export function SelectInput({
  path,
  value,
  options,
  label,
  onPick,
  disabled,
}: {
  path: Path;
  value: unknown;
  options: Option[];
  label?: string;
  /** 选了以后要连带改别处的（不传就是改 path 这一处）。 */
  onPick?: (value: unknown) => void;
  disabled?: boolean;
}) {
  const ops = useOps();
  const index = options.findIndex((o) => same(o.value, value));
  return (
    <select
      id={fieldId(path)}
      aria-label={label}
      disabled={disabled}
      value={index >= 0 ? String(index) : 'current'}
      onChange={(e) => {
        if (e.target.value === 'current') return;
        const picked = options[Number(e.target.value)].value;
        if (onPick) onPick(picked);
        else ops.set(path, picked);
      }}
    >
      {index < 0 && <option value="current">{unknownLabel(value)}</option>}
      {options.map((o, i) => (
        <option key={i} value={String(i)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SelectField(props: { path: Path; value: unknown; label: string; options: Option[]; onPick?: (value: unknown) => void; disabled?: boolean }) {
  return (
    <div className="field ed-field">
      <label htmlFor={fieldId(props.path)}>{props.label}</label>
      <SelectInput {...props} label={undefined} />
    </div>
  );
}

export function CheckField({ path, value, label }: { path: Path; value: unknown; label: string }) {
  const ops = useOps();
  const id = fieldId(path);
  return (
    <label className="choice ed-check" htmlFor={id}>
      <input id={id} type="checkbox" checked={value === true} onChange={(e) => ops.set(path, e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/** 24 小时制的时:分。 */
export function TimeField({ path, value, label }: { path: Path; value: unknown; label: string }) {
  const ops = useOps();
  const id = fieldId(path);
  return (
    <div className="field ed-field ed-field-short">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="time" value={typeof value === 'string' ? value : ''} onChange={(e) => ops.set(path, e.target.value)} />
    </div>
  );
}

/**
 * 标识（英文小写字母、数字、短横线）：离开输入框（或者按回车）时才改进剧本，
 * 这样引用它的地方能一次跟着改过去（一个字一个字改的话，改到一半可能撞上别的标识）。
 */
export function KeyField({ kind, index, value, path }: { kind: KeyKind; index: number; value: unknown; path: Path }) {
  const ops = useOps();
  const id = fieldId(path);
  const [typing, setTyping] = useState<string | null>(null);
  const commit = () => {
    if (typing === null) return;
    const next = typing.trim().toLowerCase();
    setTyping(null);
    if (next !== value) ops.renameKey(kind, index, next);
  };
  return (
    <div className="field ed-field ed-key">
      <label htmlFor={id}>标识</label>
      <input
        id={id}
        value={typing ?? text(value)}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        onChange={(e) => setTyping(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
      />
    </div>
  );
}

/** 上移、下移、删除。 */
export function RowTools({ path, index, count, confirmDelete }: { path: Path; index: number; count: number; confirmDelete?: string }) {
  const ops = useOps();
  return (
    <span className="ed-tools">
      <button type="button" className="ed-tool" aria-label="上移" title="上移" disabled={index === 0} onClick={() => ops.edit(path, (l) => listMove(l, index, -1))}>
        ↑
      </button>
      <button type="button" className="ed-tool" aria-label="下移" title="下移" disabled={index === count - 1} onClick={() => ops.edit(path, (l) => listMove(l, index, 1))}>
        ↓
      </button>
      <button
        type="button"
        className="ed-tool ed-tool-delete"
        aria-label="删除"
        title="删除"
        onClick={() => {
          if (confirmDelete && !window.confirm(confirmDelete)) return;
          ops.edit(path, (l) => listRemove(l, index));
        }}
      >
        ✕
      </button>
    </span>
  );
}

/** 格式不对、表单没法改的（只能在 JSON 里改）。 */
export function BadShape({ id, what }: { id?: string; what: string }) {
  return (
    <p className="form-error ed-bad" id={id}>
      {what}的格式不对，到 JSON 分区里改
    </p>
  );
}

/** 一串文字（大家都知道的事、可以调查的、知道什么……）：一条一行，能加、删、上下移。 */
export function StringListField({ path, value, label, rows }: { path: Path; value: unknown; label: string; rows?: number }) {
  const ops = useOps();
  const id = fieldId(path);
  if (value !== undefined && !Array.isArray(value)) return <BadShape id={id} what={label} />;
  const list = value ?? [];
  return (
    <fieldset className="field ed-field ed-strings" id={id}>
      <legend>{label}</legend>
      {list.map((item, i) => (
        <div key={i} className="ed-string">
          <TextInput path={[...path, i]} value={item} rows={rows} label={`${label} ${i + 1}`} />
          <RowTools path={path} index={i} count={list.length} />
        </div>
      ))}
      <button type="button" className="btn btn-small btn-quiet ed-add" onClick={() => ops.edit(path, (l) => listAdd(l, ''))}>
        添加一条
      </button>
    </fieldset>
  );
}

/** 列表里的一项（一个身份、一个地点……）：标题、上下移、删除，下面是它的字段。 */
export function ItemCard({ listPath, index, count, title, name, children }: { listPath: Path; index: number; count: number; title: string; name: string; children: ReactNode }) {
  return (
    <section className="ed-item" id={fieldId([...listPath, index])} aria-label={title}>
      <header className="ed-item-head">
        <h3 className="ed-item-title">{title}</h3>
        <RowTools path={listPath} index={index} count={count} confirmDelete={`删掉「${name}」？`} />
      </header>
      <div className="ed-item-body">{children}</div>
    </section>
  );
}

/** 一个列表：每项交给 render；不是对象的项只能删、到 JSON 里改；最下面「添加」。 */
export function ItemList({
  path,
  value,
  what,
  addLabel,
  onAdd,
  render,
}: {
  path: Path;
  value: unknown;
  what: string;
  addLabel: string;
  onAdd: () => void;
  render: (item: Obj, index: number, count: number) => ReactNode;
}) {
  const id = fieldId(path);
  if (value !== undefined && !Array.isArray(value)) return <BadShape id={id} what={what} />;
  const list = value ?? [];
  return (
    <div className="ed-items" id={id}>
      {list.map((item, i) =>
        isObj(item) ? (
          <Fragment key={i}>{render(item, i, list.length)}</Fragment>
        ) : (
          <section key={i} className="ed-item" id={fieldId([...path, i])}>
            <header className="ed-item-head">
              <h3 className="ed-item-title">
                {what} {i + 1}
              </h3>
              <RowTools path={path} index={i} count={list.length} />
            </header>
            <BadShape what={`第 ${i + 1} 项`} />
          </section>
        ),
      )}
      <button type="button" className="btn ed-add-item" onClick={onAdd}>
        {addLabel}
      </button>
    </div>
  );
}
