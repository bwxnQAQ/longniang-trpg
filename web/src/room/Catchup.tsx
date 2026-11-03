import type { Catchup, CatchupItem } from '../api';
import { formatTime } from '../format';
import { formatGameTime } from '../../../shared/game';

// “你不在的时候”：离开一阵子再打开对局，先看这段时间里你的角色知道的事。
// 事情少就直接列出来；多了由主持AI写成一段摘要，最近几件收在下面。

export function CatchupPanel({
  catchup,
  onDismiss,
  onJump,
}: {
  catchup: Catchup;
  onDismiss: () => void;
  /** 收起这一块，跳到记录里“上次看到这里”的位置。 */
  onJump: () => void;
}) {
  const total = catchup.items.length + catchup.more;
  const facts = [`发生了 ${total} 件事`];
  if (catchup.chatCount) facts.push(`还有 ${catchup.chatCount} 条场外聊天`);
  const many = catchup.more > 0 || !!catchup.summary || catchup.summarizing;
  return (
    <section className="catchup" aria-labelledby="catchup-title">
      <div className="catchup-head">
        <h2 id="catchup-title">你不在的时候</h2>
        <p className="catchup-facts">
          {catchup.since ? `你 ${formatTime(catchup.since)} 离开以后，` : ''}
          {facts.join('，')}
        </p>
        <button type="button" className="btn btn-small btn-quiet" onClick={onDismiss}>
          知道了
        </button>
      </div>
      {many ? (
        <>
          {catchup.summary ? (
            <p className="catchup-summary">{catchup.summary}</p>
          ) : (
            <p className="catchup-summary is-pending" role="status">
              <span className="thinking-dot" aria-hidden="true" />
              主持人在把这段时间发生的事写成摘要……
            </p>
          )}
          <details className="catchup-recent">
            <summary>最近 {catchup.items.length} 件事的原文</summary>
            <Items items={catchup.items} />
          </details>
        </>
      ) : (
        <Items items={catchup.items} />
      )}
      <button type="button" className="btn btn-small" onClick={onJump}>
        在记录里看
      </button>
    </section>
  );
}

function Items({ items }: { items: CatchupItem[] }) {
  return (
    <ol className="catchup-items">
      {items.map((item) => (
        <li key={item.id}>
          <p className="catchup-label">
            {item.gameTime !== null && <span className="catchup-time">{formatGameTime(item.gameTime)}</span>}
            {item.label}
          </p>
          {item.text && <p className="catchup-text">{item.text}</p>}
        </li>
      ))}
    </ol>
  );
}
