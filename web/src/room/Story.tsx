import { createContext, Fragment, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import type { LogData, LogEntry, RollCard } from '../api';
import { D20Dice, Dice } from '../components/Dice';
import { openFeedback } from '../components/Feedback';
import { formatTime, isoTime } from '../format';
import { formatGameTime } from '../../../shared/game';
import { highlightTypeOf } from '../../../shared/highlights';
import { OUTCOME_LABEL, type Outcome } from '../../../shared/rules';
import type { HighlightTools } from './Highlights';

// 对局记录：开场、身份、行动的结算（骰子卡片、线索）、对白、交给别人东西、私密信息、结局、场外问答。
// 场外聊天在右边的「聊天」里，用同一个组件，只是放的记录不一样。

/**
 * 记录里的按钮要用到的：我是谁、能不能举报、点线索旁边的「告诉别人」做什么；
 * animateAfter：编号比它大的记录是打开页面以后新来的，里面的骰子要滚一下（V0.6.0）；speak：朗读一段（浏览器不支持是 null）。
 */
type LogTools = {
  meId: number | null;
  canReport: boolean;
  onShareClue: ((key: string) => void) | null;
  animateAfter: number;
  speak: ((text: string) => void) | null;
  /** 名场面（V0.8.0）：叙述、对白旁边的星标；不能收藏的（观看的人、场外聊天）是 null。 */
  highlight: HighlightTools | null;
};
const ToolsContext = createContext<LogTools>({ meId: null, canReport: false, onShareClue: null, animateAfter: Infinity, speak: null, highlight: null });

export function StoryLog({
  entries,
  hasMore,
  onLoadMore,
  resolving,
  emptyText,
  compact = false,
  seenUntil = null,
  jump = 0,
  meId = null,
  canReport = false,
  onShareClue = null,
  speak = null,
  label = '对局记录',
  highlight = null,
  focus = null,
}: {
  entries: LogEntry[];
  hasMore: boolean;
  onLoadMore: () => void;
  /** 主持人正在结算谁的行动。 */
  resolving: string[];
  emptyText: string;
  compact?: boolean;
  /** 上次离开时看到的最后一条：在它后面画一条“上次看到这里”。 */
  seenUntil?: number | null;
  /** 每加一，滚到“上次看到这里”。 */
  jump?: number;
  meId?: number | null;
  /** 能举报别人写的对白、聊天（游客、观看的人不行）。 */
  canReport?: boolean;
  /** 结算里拿到的线索旁边放一个「告诉别人」。 */
  onShareClue?: ((key: string) => void) | null;
  /** 朗读一段叙述（V0.6.0）。 */
  speak?: ((text: string) => void) | null;
  label?: string;
  /** 名场面的星标（V0.8.0）。 */
  highlight?: HighlightTools | null;
  /** 跳到这一条（名场面里点的）：seq 每次加一。 */
  focus?: { id: number; seq: number } | null;
}) {
  const firstNew = seenUntil === null ? -1 : entries.findIndex((e) => e.id > seenUntil);
  const ref = useRef<HTMLDivElement>(null);
  // 第一次拿到的记录里最新的一条：比它新的是打开页面以后才来的
  const animateAfter = useRef<number | null>(null);
  if (animateAfter.current === null && entries.length) animateAfter.current = Math.max(...entries.map((e) => e.id));
  const stickToBottom = useRef(true);
  const lastHeight = useRef(0);

  // 新消息进来时，如果本来就在底部，就跟着滚到底；在往上翻旧记录时不打扰
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [entries, resolving.length]);

  // 跳到“上次看到这里”：之后有新消息也不自动滚到底，免得刚跳过去又被拉走
  useLayoutEffect(() => {
    const el = ref.current;
    const divider = el?.querySelector('#log-seen-divider');
    if (!el || !jump || !divider) return;
    stickToBottom.current = false;
    el.scrollTop += divider.getBoundingClientRect().top - el.getBoundingClientRect().top - 12;
  }, [jump]);

  // 跳到名场面里点的那一条（V0.8.0）：滚过去、闪一下；之后有新消息也不自动滚到底
  useLayoutEffect(() => {
    const el = ref.current;
    const target = focus ? el?.querySelector(`[data-log-id="${focus.id}"]`)?.closest('li.entry') : null;
    if (!el || !(target instanceof HTMLElement)) return;
    stickToBottom.current = false;
    target.scrollIntoView({ block: 'center' });
    target.classList.add('is-focused');
    const timer = window.setTimeout(() => target.classList.remove('is-focused'), 1800);
    return () => {
      window.clearTimeout(timer);
      target.classList.remove('is-focused');
    };
  }, [focus]);

  // 下面的输入框变高、窗口变小时，记录区会变矮：原来在底部的，继续贴着底部
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    lastHeight.current = el.clientHeight;
    const observer = new ResizeObserver(() => {
      if (el.clientHeight === lastHeight.current) return;
      lastHeight.current = el.clientHeight;
      if (stickToBottom.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <ToolsContext.Provider value={{ meId, canReport, onShareClue, animateAfter: animateAfter.current ?? Infinity, speak, highlight }}>
    <div
      className={compact ? 'log log-compact' : 'log'}
      ref={ref}
      role="log"
      aria-label={label}
      onScroll={() => {
        const el = ref.current;
        if (!el) return;
        // 高度变化引起的滚动（浏览器自动调整）不算玩家自己往上翻
        if (el.clientHeight !== lastHeight.current) {
          lastHeight.current = el.clientHeight;
          if (stickToBottom.current) el.scrollTop = el.scrollHeight;
          return;
        }
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
    >
      {hasMore ? (
        <p className="log-more">
          <button type="button" className="btn btn-small btn-quiet" onClick={onLoadMore}>
            看更早的记录
          </button>
        </p>
      ) : (
        entries.length === 0 && <p className="story-opening">{emptyText}</p>
      )}
      <ol className="entries">
        {entries.map((entry, i) => (
          <Fragment key={entry.id}>
            {i === firstNew && (
              <li className="log-divider" id="log-seen-divider">
                <span>上次看到这里</span>
              </li>
            )}
            <LogItem entry={entry} />
          </Fragment>
        ))}
      </ol>
      {resolving.length > 0 && (
        <p className="thinking" role="status">
          <span className="thinking-dot" aria-hidden="true" />
          主持人正在写{resolving.join('、')}的行动结果……
        </p>
      )}
    </div>
    </ToolsContext.Provider>
  );
}

/** 别人写的对白、聊天旁边的「举报」。 */
function ReportLink({ entry }: { entry: LogEntry }) {
  const { meId, canReport } = useContext(ToolsContext);
  if (!canReport || !entry.author || entry.author.id === meId) return null;
  const author = entry.data?.type === 'say' ? `${entry.data.speaker}（${entry.author.displayName}）` : entry.author.displayName;
  return (
    <button
      type="button"
      className="linklike entry-report"
      onClick={() => openFeedback({ kind: 'report', target: { type: 'room', id: entry.id, preview: entry.text, author } })}
    >
      举报
    </button>
  );
}

/** 收藏成名场面的星标（V0.8.0）：只有叙述和对白有；data-log-id 给「跳到这一条」找位置用。 */
function HighlightStar({ entry }: { entry: LogEntry }) {
  const { highlight } = useContext(ToolsContext);
  if (!highlight || !highlightTypeOf(entry)) return null;
  const on = highlight.ids.has(entry.id);
  return (
    <button
      type="button"
      className={on ? 'hl-star is-on' : 'hl-star'}
      aria-label={on ? '取消收藏' : '收藏'}
      title={on ? '取消收藏' : '收藏'}
      data-log-id={entry.id}
      onClick={() => highlight.toggle(entry)}
    >
      {on ? '★' : '☆'}
    </button>
  );
}

/** 朗读这一段（V0.6.0）。 */
function SpeakButton({ text }: { text: string }) {
  const { speak } = useContext(ToolsContext);
  if (!speak || !text.trim()) return null;
  return (
    <button type="button" className="linklike entry-speak" onClick={() => speak(text)}>
      朗读
    </button>
  );
}

function Time({ entry }: { entry: LogEntry }) {
  return (
    <time dateTime={isoTime(entry.createdAt)} className="entry-time">
      {formatTime(entry.createdAt)}
    </time>
  );
}

function LogItem({ entry }: { entry: LogEntry }) {
  const data = entry.data;
  if (entry.kind === 'system') {
    return (
      <li className={entry.private ? 'entry entry-system is-private' : 'entry entry-system'}>
        <span>{entry.text}</span>
        <Time entry={entry} />
      </li>
    );
  }
  if (entry.kind === 'ooc') {
    if (data?.type === 'question' || data?.type === 'answer') {
      return (
        <li className={`entry entry-qa entry-${data.type}`}>
          <div className="entry-head">
            <span className="who">{data.type === 'question' ? '你问主持人' : '主持人（场外）'}</span>
            <span className="private-mark">其他玩家看不到</span>
            <Time entry={entry} />
          </div>
          <p>{entry.text}</p>
        </li>
      );
    }
    return (
      <li className="entry entry-ooc">
        <div className="entry-head">
          <span className="who">{entry.author?.displayName ?? '有人'}</span>
          <Time entry={entry} />
          <ReportLink entry={entry} />
        </div>
        <p>{entry.text}</p>
      </li>
    );
  }
  return <Narration entry={entry} data={data} />;
}

function Narration({ entry, data }: { entry: LogEntry; data: LogData | null }) {
  if (data?.type === 'opening') {
    return (
      <li className="entry entry-opening">
        <p className="opening-label">
          <HighlightStar entry={entry} />
          开场{entry.gameTime !== null && ` · ${formatGameTime(entry.gameTime)}`} <SpeakButton text={`${data.background}${data.situation}`} />
        </p>
        <h2 className="opening-title">{data.title}</h2>
        <p className="opening-background">{data.background}</p>
        <p className="story-text">{data.situation}</p>
        {data.known.length > 0 && (
          <div className="opening-known">
            <h3>大家都知道的事</h3>
            <ul>
              {data.known.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  }
  if (data?.type === 'role') {
    return (
      <li className="entry entry-letter">
        <p className="letter-label">
          <HighlightStar entry={entry} />
          你的身份 <span className="private-mark">其他玩家看不到</span>
        </p>
        <p className="story-text">{entry.text}</p>
      </li>
    );
  }
  if (data?.type === 'private') {
    return (
      <li className="entry entry-letter">
        <p className="letter-label">
          <HighlightStar entry={entry} />
          {entry.gameTime !== null && `${formatGameTime(entry.gameTime)} · `}只有你察觉到 <span className="private-mark">其他玩家看不到</span> <SpeakButton text={entry.text} />
        </p>
        <p className="story-text">{entry.text}</p>
      </li>
    );
  }
  if (data?.type === 'share') {
    return (
      <li className="entry entry-share">
        <span>
          {entry.gameTime !== null && `${formatGameTime(entry.gameTime)} · `}
          {entry.text}
          <span className="private-mark">其他玩家看不到</span>
        </span>
        <Time entry={entry} />
      </li>
    );
  }
  if (data?.type === 'say') {
    return (
      <li className={data.to ? 'entry entry-say is-whisper' : 'entry entry-say'}>
        <div className="entry-head">
          <span className="who">{data.speaker}</span>
          {data.to ? <span className="private-mark">悄悄对{data.to}说</span> : <span className="muted">说</span>}
          {entry.gameTime !== null && <span className="entry-time">{formatGameTime(entry.gameTime)}</span>}
          <ReportLink entry={entry} />
          <HighlightStar entry={entry} />
        </div>
        <p className="say-text">「{entry.text}」</p>
      </li>
    );
  }
  // 站位（V1.0.x）：身边的人看到的小动作（两个人在说悄悄话）
  if (data?.type === 'aside') {
    return (
      <li className="entry entry-give">
        <span>
          {entry.gameTime !== null && `${formatGameTime(entry.gameTime)} · `}
          {entry.text}
          <span className="private-mark">身边的人才看得到</span>
        </span>
        <Time entry={entry} />
      </li>
    );
  }
  if (data?.type === 'give') {
    return (
      <li className="entry entry-give">
        <span>
          {entry.gameTime !== null && `${formatGameTime(entry.gameTime)} · `}
          {entry.text}
        </span>
        <Time entry={entry} />
      </li>
    );
  }
  if (data?.type === 'ending') {
    return (
      <li className="entry entry-ending">
        <p className="opening-label">
          <HighlightStar entry={entry} />
          结局 <SpeakButton text={`${data.title}。${data.epilogue}`} />
        </p>
        <h2 className="opening-title">{data.title}</h2>
        <p className="story-text">{data.epilogue}</p>
        <details className="truth">
          <summary>揭晓真相</summary>
          <p>{data.truth}</p>
        </details>
      </li>
    );
  }
  if (data?.type === 'resolution') {
    return (
      <li className="entry entry-turn">
        <div className="turn-head">
          <span className="turn-time">{formatGameTime(data.gameEnd)}</span>
          <span className="turn-actor">{data.actor}</span>
          {data.secret && <span className="tag">悄悄做</span>}
          <SpeakButton text={entry.text} />
          <HighlightStar entry={entry} />
        </div>
        <p className="turn-action">{data.action}</p>
        {/* AI 角色（V1.1.0）一起交的行动 */}
        {data.companions?.map((c, i) => (
          <p key={`ai-${i}`} className="turn-companion">
            <span className="turn-companion-name">
              <span className="tag ai-tag">AI</span>
              {c.name}
            </span>
            <span className="turn-action">{c.action}</span>
          </p>
        ))}
        {data.rolls.map((roll, i) => (
          <RollView key={i} roll={roll} entryId={entry.id} />
        ))}
        {data.events && data.events.length > 0 && (
          <ul className="turn-events">
            {data.events.map((e, i) => (
              <li key={i} className={e.startsWith('〔奇遇〕') ? 'is-qiyu' : ''}>
                {e}
              </li>
            ))}
          </ul>
        )}
        <p className="story-text">{entry.text}</p>
        {(data.clues.length > 0 || data.changes.length > 0) && (
          <ul className="turn-chips">
            {data.clues.map((c) => (
              <li key={c.key} className="chip chip-clue">
                线索：{c.title}
                <ShareClueLink clueKey={c.key} />
              </li>
            ))}
            {data.changes.map((c, i) => (
              <li key={`change-${i}`} className={c.startsWith('伤势') || c === '死亡' || c.startsWith('心智') || c.startsWith('生命值') || c.startsWith('精神值') ? 'chip chip-harm' : 'chip'}>
                {c}
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }
  return (
    <li className="entry entry-narration">
      <p className="story-text">{entry.text}</p>
      <SpeakButton text={entry.text} />
      <HighlightStar entry={entry} />
    </li>
  );
}

/** 拿到线索的那段记录里：点一下就打开「线索」，把这条告诉别人。 */
function ShareClueLink({ clueKey }: { clueKey: string }) {
  const { onShareClue } = useContext(ToolsContext);
  if (!onShareClue) return null;
  return (
    <button type="button" className="linklike chip-action" onClick={() => onShareClue(clueKey)}>
      告诉别人
    </button>
  );
}

const OUTCOME_TONE: Record<Outcome, string> = {
  critical: 'good',
  success: 'good',
  partial: 'mixed',
  failure: 'bad',
  fumble: 'bad',
};

const D20_KIND: Record<NonNullable<RollCard['d20']>['kind'], string> = {
  check: '检定',
  save: '豁免',
  attack: '攻击',
  death: '死亡豁免',
  contest: '对抗',
  initiative: '先攻',
};

/** 5E 的骰子卡片（V0.9.0）：d20，成没成、命中没有、伤害，优势劣势写在下面。 */
function Roll5eView({ roll, d20, rolling }: { roll: RollCard; d20: NonNullable<RollCard['d20']>; rolling: boolean }) {
  const kind = D20_KIND[d20.kind];
  const reason = roll.reason && roll.reason !== kind ? roll.reason : '';
  const c = roll.combat;
  let outcome: { text: string; tone: string } | null = null;
  if (c) {
    const dmg = c.damage ? `，${c.kind === 'enemy' ? `${c.target} ` : ''}−${c.damage}` : '';
    outcome = c.hit
      ? { text: `${d20.crit ? '重击！' : ''}打中${c.target}${dmg}`, tone: c.kind === 'attack' ? 'good' : 'bad' }
      : { text: `没打中${c.target}`, tone: c.kind === 'attack' ? 'bad' : 'good' };
  } else if (d20.kind === 'death') {
    outcome = roll.dice[0] === 20 ? { text: '掷出 20，醒了过来', tone: 'good' } : roll.dice[0] === 1 ? { text: '掷出 1，算两次失败', tone: 'bad' } : d20.success ? { text: '成功', tone: 'good' } : { text: '失败', tone: 'bad' };
  } else if (d20.success !== null && !roll.versus) {
    outcome = d20.success ? { text: '成功', tone: 'good' } : { text: '失败', tone: 'bad' };
  }
  const target = d20.target !== null ? `${d20.kind === 'attack' ? 'AC' : 'DC'} ${d20.target}` : '';
  return (
    <div className="roll roll-5e">
      <p className="roll-reason">
        {roll.who} · {kind}
        {reason && ` · ${reason}`}
      </p>
      <div className="roll-line">
        <span className="roll-who">{roll.versus ? roll.who : null}</span>
        <D20Dice rolls={d20.rolls.length ? d20.rolls : [roll.dice[0]]} kept={roll.dice[0]} skin={roll.skin ?? null} rolling={rolling} />
        <span className="roll-math">
          {roll.parts.slice(1).map((p, i) => (
            <span key={i}>
              {p.label} {p.value >= 0 ? `+${p.value}` : `−${-p.value}`}
            </span>
          ))}
          <span className="roll-total">= {roll.total}</span>
          {target && <span className="muted">对 {target}</span>}
        </span>
        {outcome && <span className={`roll-outcome is-${outcome.tone}`}>{outcome.text}</span>}
      </div>
      {d20.damage && !c?.damage && (
        <p className="roll-note">
          伤害 {d20.damage.total}（{d20.damage.type}）
        </p>
      )}
      {roll.versus && (
        <>
          <div className="roll-line">
            <span className="roll-who">{roll.versus.who}</span>
            <D20Dice rolls={[roll.versus.dice[0]]} kept={roll.versus.dice[0]} skin={roll.versus.skin ?? null} rolling={rolling} />
            <span className="roll-math">
              {roll.versus.parts.slice(1).map((p, i) => (
                <span key={i}>
                  {p.label} {p.value >= 0 ? `+${p.value}` : `−${-p.value}`}
                </span>
              ))}
              <span className="roll-total">= {roll.versus.total}</span>
            </span>
          </div>
          <p className={`roll-outcome is-${roll.winner === 'a' ? 'good' : roll.winner === 'b' ? 'bad' : 'mixed'}`}>
            {roll.winner === 'a' ? `${roll.who}占了上风` : roll.winner === 'b' ? `${roll.versus.who}占了上风` : '平局，维持原状'}
          </p>
        </>
      )}
      {d20.note && <p className="roll-note">{d20.note}</p>}
    </div>
  );
}

function RollView({ roll, entryId }: { roll: RollCard; entryId: number }) {
  const { animateAfter } = useContext(ToolsContext);
  const rolling = entryId > animateAfter;
  if (roll.d20) return <Roll5eView roll={roll} d20={roll.d20} rolling={rolling} />;
  const modifiers = roll.parts.slice(1);
  const first = roll.petHelp?.first;
  return (
    <div className="roll">
      <p className="roll-reason">
        {roll.attribute}
        {roll.reason && ` · ${roll.reason}`}
      </p>
      {roll.petHelp && first && (
        <div className="roll-line roll-first">
          <span className="roll-who">{roll.versus ? roll.who : null}</span>
          <Dice dice={first.dice} skin={roll.skin ?? null} />
          <span className="roll-math">
            <span className="roll-total">= {first.total}</span>
          </span>
          <span className="roll-outcome is-bad">{first.winner ? (first.winner === 'b' ? '输了' : '平局') : OUTCOME_LABEL[first.outcome]}</span>
          <span className="roll-pet">{roll.petHelp.pet}扑上去帮了一把，重掷：</span>
        </div>
      )}
      <div className="roll-line">
        <span className="roll-who">{roll.versus ? roll.who : null}</span>
        <Dice dice={roll.dice} skin={roll.skin ?? null} rolling={rolling} />
        <span className="roll-math">
          {/* 加减值的名字会重复（身上有两个状态时，两项都叫「状态」），key 用位置；一次检定的加减值不会变 */}
          {modifiers.map((p, i) => (
            <span key={i}>
              {p.label} {p.value >= 0 ? `+${p.value}` : `−${-p.value}`}
            </span>
          ))}
          <span className="roll-total">= {roll.total}</span>
        </span>
        {!roll.versus && !roll.combat && <span className={`roll-outcome is-${OUTCOME_TONE[roll.outcome]}`}>{OUTCOME_LABEL[roll.outcome]}</span>}
        {roll.combat && (
          <span className={`roll-outcome is-${(roll.combat.kind === 'attack') === roll.combat.hit ? 'good' : 'bad'}`}>
            {roll.combat.hit
              ? `打中${roll.combat.kind === 'attack' ? roll.combat.target : ''}${roll.combat.damage !== null ? `，${roll.combat.damage ? `${roll.combat.kind === 'enemy' ? `${roll.combat.target} ` : ''}−${roll.combat.damage}` : '没破防'}` : ''}`
              : `没打中${roll.combat.kind === 'enemy' ? roll.combat.target : ''}`}
            <span className="muted">（防御 {roll.combat.defense}{roll.combat.armor ? `，护甲挡了 ${roll.combat.armor}` : ''}{roll.combat.weakness ? '，用上弱点' : ''}）</span>
          </span>
        )}
      </div>
      {roll.versus && (
        <>
          <div className="roll-line">
            <span className="roll-who">{roll.versus.who}</span>
            <Dice dice={roll.versus.dice} skin={roll.versus.skin ?? null} rolling={rolling} />
            <span className="roll-math">
              {roll.versus.parts.slice(1).map((p, i) => (
                <span key={i}>
                  {p.label} {p.value >= 0 ? `+${p.value}` : `−${-p.value}`}
                </span>
              ))}
              <span className="roll-total">= {roll.versus.total}</span>
            </span>
          </div>
          <p className={`roll-outcome is-${roll.winner === 'a' ? 'good' : roll.winner === 'b' ? 'bad' : 'mixed'}`}>
            {roll.winner === 'a' ? `${roll.who}占了上风` : roll.winner === 'b' ? `${roll.versus.who}占了上风` : '平局，僵持不下'}
          </p>
        </>
      )}
    </div>
  );
}
