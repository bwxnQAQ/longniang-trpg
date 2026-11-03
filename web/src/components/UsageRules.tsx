import { USAGE_RULES } from '../../../shared/usage-rules';

/** 使用规则的条文。注册页、同意规则页、规则页都用这一份。 */
export function UsageRulesList() {
  return (
    <ol className="usage-rules">
      {USAGE_RULES.map((r) => (
        <li key={r.title}>
          <strong>{r.title}</strong>
          {r.fresh && (
            <>
              {' '}
              <span className="tag">新</span>
            </>
          )}
          <p>{r.text}</p>
        </li>
      ))}
    </ol>
  );
}
