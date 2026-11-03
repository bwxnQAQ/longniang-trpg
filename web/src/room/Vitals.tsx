import type { Character2View, DungeonView, GearView, LootView } from '../api';
import { checkBonuses, gearEffectText, gearTotals } from '../../../shared/gear2';
import { ATTRIBUTE2_NAME, ATTRIBUTES2, CONSUMABLES, EQUIP_SLOT_PART, EQUIP_SLOTS, GEAR_PART_LABEL, RARITY_LABEL, SIZE_LABEL, TIER_LABEL, type Attributes2 } from '../../../shared/rules2';
import { sign } from '../format';

// 规则第二版（V0.7.0）的角色状态：七项属性、生命值和精神值、装备、技能、道具、这一局捡到的东西；地下城的难度和战斗。

export function Attributes2Grid({ attributes }: { attributes: Attributes2 }) {
  return (
    <dl className="attr-grid attr-grid-7">
      {ATTRIBUTES2.map((a) => (
        <div key={a.key} className="attr" title={a.covers}>
          <dt>{a.name}</dt>
          <dd>{sign(attributes[a.key] ?? 0)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 一条细细的血条：value / max。 */
export function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'hp' | 'mp' | 'enemy' }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`meter meter-${tone}${value <= 0 ? ' is-empty' : value <= max / 3 ? ' is-low' : ''}`}>
      <span className="meter-label">{label}</span>
      <span className="meter-bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <span className="meter-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="meter-value">
        {value}/{max}
      </span>
    </div>
  );
}

export function gearText(g: GearView): string {
  return `${RARITY_LABEL[g.rarity]} · ${gearEffectText(g)}`;
}

/** 人物栏的部位顺序（头部……主手、副手）：全部装备按这个排。 */
const PART_ORDER = [...new Set(EQUIP_SLOTS.map((s) => EQUIP_SLOT_PART[s]))];

/** 身上的装备合起来：主手、减伤、每一项属性的检定加值，传奇的本事；全部的点开看。 */
function GearSummary({ gear }: { gear: GearView[] }) {
  const t = gearTotals(gear);
  const checks = checkBonuses(t);
  const special = gear.filter((g) => g.ability);
  const all = [...gear].sort((a, b) => PART_ORDER.indexOf(a.part) - PART_ORDER.indexOf(b.part));
  return (
    <div className="gear-summary">
      <p className="vitals-line">
        <span className="sheet-label-inline">主手</span>
        {t.weapon ? (
          <>
            <span className={`gear-name rarity-${t.weapon.rarity}`}>{t.weapon.name}</span>
            <span className="gear-meta">{gearEffectText(t.weapon)}</span>
          </>
        ) : (
          <span className="muted">空着</span>
        )}
      </p>
      <p className="vitals-line">
        <span className="sheet-label-inline">减伤</span>
        {t.reduction}
        <span className="gear-meta">护甲 {t.armor}</span>
      </p>
      {checks.length > 0 && (
        <p className="vitals-line">
          <span className="sheet-label-inline">检定</span>
          {checks.map((c) => `${ATTRIBUTE2_NAME[c.attribute]} +${c.gear.bonus}`).join('、')}
        </p>
      )}
      {special.length > 0 && (
        <ul className="gear-list">
          {special.map((g) => (
            <li key={`${g.part}-${g.base}`} className={`gear gear-${g.rarity}`}>
              <span className="gear-name">{g.name}</span>
              <span className="gear-ability">{g.ability}</span>
            </li>
          ))}
        </ul>
      )}
      <details className="gear-all">
        <summary>全部 {gear.length} 件</summary>
        <ul className="gear-list">
          {all.map((g) => (
            <li key={`${g.part}-${g.base}-${g.id}`} className={`gear gear-${g.rarity}`} title={g.ability ?? g.use}>
              <span className="gear-meta">{GEAR_PART_LABEL[g.part]}</span>
              <span className="gear-name">{g.name}</span>
              <span className="gear-meta">{gearText(g)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function lootText(l: LootView): string {
  if (l.kind === 'gear') return `${l.gear.name}（${RARITY_LABEL[l.gear.rarity]}）`;
  if (l.kind === 'item') return `${l.name}×${l.count}`;
  if (l.kind === 'manual') return l.name;
  return `${l.amount} 龙晶`;
}

/** 自己角色的生命值、精神值、装备、技能、道具、捡到的东西。 */
export function VitalsBlock({ v2, inDungeon }: { v2: Character2View; inDungeon: boolean }) {
  const bag = CONSUMABLES.filter((c) => (v2.bag[c.key] ?? 0) > 0);
  return (
    <section className="vitals">
      <Meter label="生命" value={v2.hp} max={v2.hpMax} tone="hp" />
      <Meter label="精神" value={v2.mp} max={v2.mpMax} tone="mp" />
      <p className="vitals-line">
        <span className="sheet-label-inline">防御</span>
        {v2.defense}
        {v2.boost > 0 && <span className="chip">下一次 +{v2.boost}</span>}
        {v2.ward > 0 && <span className="chip">护身 +{v2.ward}</span>}
      </p>
      {v2.dying !== null && <p className="form-error">倒地濒死：再过 {v2.dying} 次行动没人救就会死</p>}
      {v2.lostControl && <p className="form-error">心神失守：下一次行动会失控</p>}

      {v2.gear.length > 0 && (
        <>
          <h3 className="sheet-label">装备</h3>
          <GearSummary gear={v2.gear} />
        </>
      )}

      {v2.skills.length > 0 && (
        <>
          <h3 className="sheet-label">技能</h3>
          <ul className="skill-list">
            {v2.skills.map((s) => (
              <li key={s.key}>
                <span className="skill-name">{s.name}</span>
                <span className="skill-cost">精神 {s.cost}</span>
                <span className="skill-text">{s.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {inDungeon && (
        <>
          <h3 className="sheet-label">带着的道具</h3>
          {bag.length ? (
            <ul className="sheet-tags">
              {bag.map((c) => (
                <li key={c.key} className="chip" title={c.effect}>
                  {c.name} ×{v2.bag[c.key]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">没带道具</p>
          )}
          {v2.loot.length > 0 && (
            <>
              <h3 className="sheet-label">这一局捡到的</h3>
              <ul className="sheet-tags">
                {v2.loot.map((l, i) => (
                  <li key={i} className={`chip${l.kind === 'gear' ? ` chip-${l.gear.rarity}` : ''}`}>
                    {lootText(l)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}

/** 地下城的难度、小型大型、检定一共减多少。 */
export function DungeonBadge({ dungeon }: { dungeon: DungeonView }) {
  if (!dungeon.isDungeon) return null;
  return (
    <p className="dungeon-badge">
      <span className="dungeon-level">难度 {dungeon.level}</span>
      <span>{SIZE_LABEL[dungeon.size]}地下城</span>
      {dungeon.penalty < 0 && <span className="muted">检定 {sign(dungeon.penalty)}</span>}
      {!dungeon.ranked && <span className="tag">不算成绩</span>}
    </p>
  );
}

/** 和自己在同一个地点正在打的仗：先后手、敌人还剩多少生命。 */
export function CombatPanel({ dungeon }: { dungeon: DungeonView }) {
  const combat = dungeon.combat;
  if (!combat) return null;
  return (
    <section className="combat" aria-label="战斗">
      <h3 className="sheet-label">战斗</h3>
      <ol className="combat-order">
        {combat.order.map((o, i) => (
          <li key={`${o.name}-${i}`} className={o.side === 'enemy' ? 'is-enemy' : 'is-ally'}>
            {o.name}
            <span className="muted"> {o.initiative}</span>
          </li>
        ))}
      </ol>
      <ul className="combat-enemies">
        {combat.enemies.map((e) => (
          <li key={e.id} className={e.defeated ? 'is-down' : ''}>
            <span className="enemy-name">
              {e.name}
              <span className="enemy-tier">{TIER_LABEL[e.tier]}</span>
              {e.shielded && <span className="chip chip-harm">护盾</span>}
              {e.defeated && <span className="muted">{e.fled ? '逃走了' : '倒下了'}</span>}
            </span>
            {!e.defeated && <Meter label="生命" value={e.hp} max={e.hpMax} tone="enemy" />}
          </li>
        ))}
      </ul>
    </section>
  );
}
