import { CURRENCY_LABEL, setCurrency, useCurrency, type Currency } from '../currency';

// 人民币、美元切换：看额度的地方（大厅左边、账号设置、管理页）都有，选了以后整个网站的金额都按它显示，记在这台浏览器上。

const ORDER: Currency[] = ['CNY', 'USD'];

export function CurrencySwitch() {
  const currency = useCurrency();
  return (
    <span className="segmented currency-switch" role="group" aria-label="金额用什么显示">
      {ORDER.map((c) => (
        <button key={c} type="button" className={currency === c ? 'segment is-on' : 'segment'} aria-pressed={currency === c} onClick={() => setCurrency(c)}>
          {CURRENCY_LABEL[c]}
        </button>
      ))}
    </span>
  );
}

/** 填金额时选填的是哪种钱（默认跟着显示用的那种）。 */
export function CurrencySelect({ id, value, onChange }: { id?: string; value: Currency; onChange: (c: Currency) => void }) {
  return (
    <select id={id} className="currency-select" value={value} onChange={(e) => onChange(e.target.value as Currency)} aria-label="币种">
      {ORDER.map((c) => (
        <option key={c} value={c}>
          {CURRENCY_LABEL[c]}
        </option>
      ))}
    </select>
  );
}
