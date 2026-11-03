// 5E 模组的对局里（V0.9.0）：自己的 5E 角色（生命值、AC、法术位、能力、状态、带着的东西）和所在地点正在打的仗。
import type { Character5eView, Fight5eView } from '../api';
import { ABILITY_NAME, CONDITION_NAME, DAMAGE_NAME, SKILL_NAME, formatMoney, signed } from '../../../shared/5e/core';
import { Meter } from '../room/Vitals';
import { AbilityBoxes } from './SheetView';

const RECOVER_LABEL: Record<string, string> = { short: '短休回满', long: '长休回满', 'short-one': '短休回一次' };

/** 对局里自己的 5E 角色。 */
export function Sheet5eBlock({ v5 }: { v5: Character5eView }) {
  const sp = v5.spell;
  return (
    <div className="five-room">
      <p className="five-sheet-who">
        {v5.speciesName}
        {v5.className} {v5.level} 级{v5.subclassName ? `（${v5.subclassName}）` : ''} · {v5.backgroundName}
      </p>
      <Meter label={v5.tempHp ? `生命（临时 ${v5.tempHp}）` : '生命'} value={v5.hp} max={v5.hpMax} tone="hp" />
      {v5.death && (
        <p className="five-death" aria-label="死亡豁免">
          <span className="five-label">死亡豁免</span>
          <span className="five-pips is-good">{'●'.repeat(v5.death.success) + '○'.repeat(3 - v5.death.success)}</span>
          <span className="muted">成功</span>
          <span className="five-pips is-bad">{'●'.repeat(v5.death.failure) + '○'.repeat(3 - v5.death.failure)}</span>
          <span className="muted">失败</span>
        </p>
      )}
      {v5.stable && <p className="muted">倒地昏迷，已经稳定下来了</p>}
      <dl className="five-vitals">
        <div>
          <dt>AC</dt>
          <dd>{v5.ac}</dd>
        </div>
        <div>
          <dt>先攻</dt>
          <dd>{signed(v5.initiative)}</dd>
        </div>
        <div>
          <dt>速度</dt>
          <dd>{v5.speed} 尺</dd>
        </div>
        <div>
          <dt>熟练</dt>
          <dd>+{v5.pb}</dd>
        </div>
        <div>
          <dt>被动察觉</dt>
          <dd>{v5.passivePerception}</dd>
        </div>
        <div>
          <dt>生命骰</dt>
          <dd>
            {v5.hitDice.left}/{v5.hitDice.max}
            <small> d{v5.hitDice.die}</small>
          </dd>
        </div>
      </dl>

      {(v5.conditions.length > 0 || v5.exhaustion > 0 || v5.effects.length > 0 || v5.inspiration || v5.bardicDie || v5.wildShape || v5.concentration) && (
        <ul className="sheet-tags">
          {v5.wildShape && <li className="chip chip-five">荒野变形：{v5.wildShape}</li>}
          {v5.concentration && <li className="chip chip-five">专注：{v5.concentration}</li>}
          {v5.conditions.map((c, i) => (
            <li key={`c${i}`} className="chip chip-harm" title={c.note}>
              {CONDITION_NAME[c.key]}
            </li>
          ))}
          {v5.exhaustion > 0 && <li className="chip chip-harm">力竭 {v5.exhaustion} 级</li>}
          {v5.effects.map((e, i) => (
            <li key={`e${i}`} className="chip" title={e.note}>
              {e.name}
            </li>
          ))}
          {v5.inspiration && <li className="chip chip-clue">英雄激励</li>}
          {v5.bardicDie && <li className="chip chip-clue">诗人激励 d{v5.bardicDie}</li>}
        </ul>
      )}

      <AbilityBoxes abilities={v5.abilities} mods={v5.mods} saves={v5.saves} />
      <p className="five-line">
        <span className="five-label">豁免熟练</span>
        {v5.saves.map((a) => `${ABILITY_NAME[a]} ${signed(v5.mods[a] + v5.pb)}`).join('、') || '无'}
      </p>
      <p className="five-line">
        <span className="five-label">技能</span>
        {v5.skills
          .filter((s) => s.prof >= 1)
          .map((s) => `${SKILL_NAME[s.key]} ${signed(s.mod)}`)
          .join('、') || '无'}
        {v5.stealthDis && `；穿着${v5.stealthDis}，隐匿检定劣势`}
      </p>
      <details className="five-more">
        <summary>全部技能</summary>
        <ul className="five-skill-grid">
          {v5.skills.map((s) => (
            <li key={s.key} className={s.prof ? 'is-prof' : undefined}>
              <span>{SKILL_NAME[s.key]}</span>
              <span className="five-prof">{s.prof === 2 ? '精' : s.prof === 1 ? '熟' : s.prof === 0.5 ? '半' : ''}</span>
              <span>{signed(s.mod)}</span>
            </li>
          ))}
        </ul>
      </details>

      <h3 className="sheet-label">攻击</h3>
      <ul className="five-attacks">
        {v5.attacks.map((a) => (
          <li key={a.key}>
            <span className="five-attack-name">{a.name}</span>
            <span>{a.kind === 'spell' && a.note.includes('豁免') ? a.note : `命中 ${signed(a.toHit)}`}</span>
            <span>
              {a.damage} {DAMAGE_NAME[a.damageType]}
            </span>
          </li>
        ))}
      </ul>

      {sp && (
        <>
          <h3 className="sheet-label">法术</h3>
          <p className="five-line">
            豁免 DC {sp.dc} · 法术攻击 {signed(sp.attack)}
          </p>
          {(sp.slots.length > 0 || sp.pact) && (
            <p className="five-line five-slots-left">
              {sp.slots.map((s) => (
                <span key={s.level}>
                  {s.level} 环
                  <span className="five-pips">{'●'.repeat(s.left) + '○'.repeat(Math.max(0, s.max - s.left))}</span>
                </span>
              ))}
              {sp.pact && (
                <span>
                  契约 {sp.pact.level} 环<span className="five-pips">{'●'.repeat(sp.pact.left) + '○'.repeat(Math.max(0, sp.pact.max - sp.pact.left))}</span>
                </span>
              )}
            </p>
          )}
          {sp.cantrips.length > 0 && (
            <p className="five-line">
              <span className="five-label">戏法</span>
              {sp.cantrips.map((c) => c.name).join('、')}
            </p>
          )}
          {sp.prepared.length > 0 && (
            <p className="five-line">
              <span className="five-label">准备的</span>
              {sp.prepared.map((p) => `${p.name}（${p.level} 环）`).join('、')}
            </p>
          )}
          {sp.free.length > 0 && (
            <p className="five-line">
              <span className="five-label">免费施放</span>
              {sp.free.map((f) => `${f.name}${f.max >= 99 ? '（随意）' : ` ${f.left}/${f.max}`}`).join('、')}
            </p>
          )}
        </>
      )}

      {v5.resources.length > 0 && (
        <>
          <h3 className="sheet-label">能力</h3>
          <ul className="five-resources">
            {v5.resources.map((r) => (
              <li key={r.key}>
                <span>{r.name}</span>
                <span className="five-pips">{r.max <= 6 ? '●'.repeat(r.left) + '○'.repeat(Math.max(0, r.max - r.left)) : `${r.left}/${r.max}`}</span>
                <span className="muted">{RECOVER_LABEL[r.recover]}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="sheet-label">带着</h3>
      <p className="five-line">
        {v5.inventory.map((i) => `${i.name}${i.qty > 1 ? `×${i.qty}` : ''}${i.equipped ? '（穿着拿着）' : ''}`).join('、') || '什么都没有'}
      </p>
      <p className="five-line">
        <span className="five-label">钱</span>
        {formatMoney(v5.money)}
      </p>
      {(v5.gained.length > 0 || v5.gainedMoney > 0) && (
        <p className="five-line">
          <span className="five-label">这一局得到的</span>
          {[...v5.gained.map((g) => `${g.name}${g.qty > 1 ? `×${g.qty}` : ''}`), ...(v5.gainedMoney > 0 ? [formatMoney(v5.gainedMoney)] : [])].join('、')}
        </p>
      )}
      {v5.features.length > 0 && (
        <details className="five-more">
          <summary>特性（{v5.features.length}）</summary>
          <p className="five-line">{v5.features.map((f) => f.name).join('、')}</p>
        </details>
      )}
    </div>
  );
}

/** 所在地点正在打的仗：第几轮、先攻（这一轮谁行动过了）、敌人的生命值和状态。 */
export function Fight5ePanel({ fight }: { fight: Fight5eView }) {
  return (
    <section className="combat" aria-label="战斗">
      <h3 className="sheet-label">战斗 · 第 {fight.round} 轮</h3>
      <ol className="combat-order">
        {fight.order.map((o, i) => (
          <li key={`${o.name}-${i}`} className={`${o.side === 'enemy' ? 'is-enemy' : 'is-ally'}${o.acted ? ' is-acted' : ''}${o.down ? ' is-down' : ''}`}>
            {o.name}
            <span className="muted"> {o.initiative}</span>
          </li>
        ))}
      </ol>
      <ul className="combat-enemies">
        {fight.monsters.map((m) => (
          <li key={m.id} className={m.defeated ? 'is-down' : ''}>
            <span className="enemy-name">
              {m.name}
              {m.conditions.map((c) => (
                <span key={c} className="chip chip-harm">
                  {c}
                </span>
              ))}
              {m.defeated && <span className="muted">{m.fled ? '逃走了' : '倒下了'}</span>}
            </span>
            {!m.defeated && <Meter label="生命" value={m.hp} max={m.hpMax} tone="enemy" />}
          </li>
        ))}
      </ul>
    </section>
  );
}
