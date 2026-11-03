import { useEffect } from 'react';
import { UsageRulesList } from '../components/UsageRules';
import { USAGE_RULES_TITLE } from '../../../shared/usage-rules';

/** 网站的使用规则：注册时同意的那些。玩法规则在「规则」页。 */
export function TermsPage() {
  useEffect(() => {
    document.title = `${USAGE_RULES_TITLE} - 龙娘跑团`;
  }, []);
  return (
    <article className="terms">
      <div className="page-head">
        <h1>{USAGE_RULES_TITLE}</h1>
      </div>
      <p className="rules-lead">注册时同意的就是这些。违反的内容会被拦下，账号可能被封禁。</p>
      <UsageRulesList />
    </article>
  );
}
