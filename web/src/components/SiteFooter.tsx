import { useAuth } from '../auth';
import { Link } from '../router';
import { APP_AUTHOR, APP_QQ_GROUP, APP_STAGE, APP_VERSION_LABEL } from '../version';
import { openFeedback } from './Feedback';
import { openGuide } from './Guide';

// 每个页面最下面：作者和版本号；登录以后还有「反馈问题」「使用规则」，正式用户还有「向导」（V0.6.0）。一直钉在窗口最下面，不用往下滚。

export function SiteFooter() {
  const { user } = useAuth();
  return (
    <footer className="site-footer">
      <span className="site-footer-author">作者 {APP_AUTHOR}</span>
      <span className="site-footer-version">
        {APP_VERSION_LABEL}
        {APP_STAGE && <span className="site-footer-stage">{APP_STAGE}</span>}
        {APP_QQ_GROUP && (
          <span className="site-footer-qq">
            QQ群 <span className="site-footer-qq-number">{APP_QQ_GROUP}</span>
          </span>
        )}
      </span>
      {user?.rulesAgreed && (
        <>
          {/* 窄屏上从这里折到第二行（V0.9.0 加了 QQ 群号以后一行放不下） */}
          <span className="site-footer-break" aria-hidden="true" />
          {!user.isGuest && (
            <button type="button" className="linklike site-footer-link site-footer-guide" onClick={openGuide}>
              向导
            </button>
          )}
          <button type="button" className="linklike site-footer-link" onClick={() => openFeedback()}>
            反馈问题
          </button>
          <Link to="/terms" className="site-footer-link">
            使用规则
          </Link>
        </>
      )}
    </footer>
  );
}
