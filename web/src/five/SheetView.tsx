// 5E 角色卡（V0.9.0）的样子：六项属性、豁免、技能、攻击、法术、能力、特性、物品。「5E 角色」页和做卡的预览共用。
import { ABILITIES, ABILITY_NAME, DAMAGE_NAME, SKILL_KEYS, SKILL_NAME, SPELL_LEVEL_LABEL, formatMoney, signed, type Abilities, type Ability } from '../../../shared/5e/core';
import { itemName } from '../../../shared/5e/sheet';
import type { Card5eData, RulesData, Sheet5e } from '../../../shared/5e/types';
import { spellOf } from './rules';

const RECOVER_LABEL: Record<string, string> = { short: '短休回满', long: '长休回满', 'short-one': '短休回一次' };
const PROF_MARK: Record<number, string> = { 0: '', 0.5: '半', 1: '熟', 2: '精' };

/** 六项属性：大字是调整值，小字是属性值。 */
export function AbilityBoxes({ abilities, mods, saves }: { abilities: Abilities; mods: Abilities; saves?: Ability[] }) {
  return (
    <ul className="five-abilities">
      {ABILITIES.map((a) => (
        <li key={a} className={saves?.includes(a) ? 'five-ability is-save' : 'five-ability'}>
          <span className="five-ability-name">{ABILITY_NAME[a]}</span>
          <span className="five-ability-mod">{signed(mods[a])}</span>
          <span className="five-ability-score">{abilities[a]}</span>
        </li>
      ))}
    </ul>
  );
}

/** 一行数值：生命、AC、先攻、速度、熟练加值、被动察觉。 */
export function VitalsLine({ sheet }: { sheet: Sheet5e }) {
  return (
    <dl className="five-vitals">
      <div>
        <dt>生命值</dt>
        <dd>{sheet.hpMax}</dd>
      </div>
      <div title={sheet.acNote}>
        <dt>AC</dt>
        <dd>{sheet.ac}</dd>
      </div>
      <div>
        <dt>先攻</dt>
        <dd>{signed(sheet.initiative)}</dd>
      </div>
      <div>
        <dt>速度</dt>
        <dd>{sheet.speed} 尺</dd>
      </div>
      <div>
        <dt>熟练加值</dt>
        <dd>+{sheet.pb}</dd>
      </div>
      <div>
        <dt>被动察觉</dt>
        <dd>{sheet.passivePerception}</dd>
      </div>
    </dl>
  );
}

/** 整张卡：卡上的选择算出来的数值（不含对局里的状态）。compact：做卡时右边的预览，少一些细节。 */
export function CardSheet({ rules, data, sheet, compact = false, who = true }: { rules: RulesData; data: Card5eData; sheet: Sheet5e; compact?: boolean; who?: boolean }) {
  const saves = ABILITIES.filter((a) => sheet.saves[a].prof);
  const skills = SKILL_KEYS.filter((k) => sheet.skills[k].prof > 0);
  const eq = data.equipped;
  const worn = new Set([eq.armor, eq.shield, eq.main, eq.off].filter((k): k is string => !!k));
  const sp = sheet.spell;
  return (
    <div className={compact ? 'five-sheet is-compact' : 'five-sheet'}>
      <p className="five-sheet-who">
        {who && `${sheet.speciesName}${sheet.className} ${sheet.level} 级${sheet.subclassName ? `（${sheet.subclassName}）` : ''} · `}背景：{sheet.backgroundName}
        {sheet.darkvision ? ` · 黑暗视觉 ${sheet.darkvision} 尺` : ''}
      </p>
      <VitalsLine sheet={sheet} />
      <AbilityBoxes abilities={sheet.abilities} mods={sheet.mods} saves={saves} />
      <p className="five-line">
        <span className="five-label">豁免熟练</span>
        {saves.map((a) => `${ABILITY_NAME[a]} ${signed(sheet.saves[a].mod)}`).join('、') || '无'}
      </p>
      <p className="five-line">
        <span className="five-label">技能</span>
        {skills.map((k) => `${SKILL_NAME[k]} ${signed(sheet.skills[k].mod)}${sheet.skills[k].prof === 2 ? '（专精）' : ''}`).join('、') || '无'}
        {sheet.stealthDis && `；穿着${sheet.stealthDis}，隐匿检定劣势`}
      </p>
      {!compact && (
        <details className="five-more">
          <summary>全部技能</summary>
          <ul className="five-skill-grid">
            {SKILL_KEYS.map((k) => (
              <li key={k} className={sheet.skills[k].prof ? 'is-prof' : undefined}>
                <span>{SKILL_NAME[k]}</span>
                <span className="five-prof">{PROF_MARK[sheet.skills[k].prof]}</span>
                <span>{signed(sheet.skills[k].mod)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <h4 className="five-sub">攻击</h4>
      <ul className="five-attacks">
        {sheet.attacks.map((a) => (
          <li key={a.key}>
            <span className="five-attack-name">{a.name}</span>
            <span>{a.kind === 'spell' && a.note.includes('豁免') ? a.note : `命中 ${signed(a.toHit)}`}</span>
            <span>
              {a.damage} {DAMAGE_NAME[a.damageType]}
            </span>
            {!compact && <span className="muted">{[a.range, a.mastery ? `精通：${rules.masteries.find((m) => m.key === a.mastery)?.name ?? a.mastery}` : '', a.kind !== 'spell' ? a.note : ''].filter(Boolean).join('，')}</span>}
          </li>
        ))}
      </ul>

      {sp && (
        <>
          <h4 className="five-sub">法术</h4>
          <p className="five-line">
            法术豁免 DC {sp.dc} · 法术攻击 {signed(sp.attack)}
            {sp.slots.some((n) => n) && ` · 法术位：${sp.slots.map((n, i) => (n ? `${i + 1} 环 ${n}` : '')).filter(Boolean).join('、')}`}
            {sp.pact && ` · 契约魔法：${sp.pact.count} 个 ${sp.pact.level} 环（短休回满）`}
          </p>
          <SpellList rules={rules} label="戏法" keys={sp.cantrips} />
          <SpellList rules={rules} label="准备的法术" keys={sp.prepared} always={sp.always} free={sp.free} />
          {sp.spellbook && !compact && <SpellList rules={rules} label="法术书" keys={sp.spellbook} />}
        </>
      )}

      {sheet.resources.length > 0 && (
        <p className="five-line">
          <span className="five-label">能力</span>
          {sheet.resources.map((r) => `${r.name} ${r.max} 次（${RECOVER_LABEL[r.recover]}）`).join('、')}
        </p>
      )}
      {!compact && <Features rules={rules} sheet={sheet} />}
      {!compact && (
        <p className="five-line">
          <span className="five-label">熟练</span>
          {[...sheet.proficiencies.armor, ...sheet.proficiencies.weapons, ...sheet.proficiencies.tools].join('、') || '无'}
        </p>
      )}
      {sheet.resist.length > 0 && (
        <p className="five-line">
          <span className="five-label">抗性</span>
          {sheet.resist.map((t) => DAMAGE_NAME[t]).join('、')}
        </p>
      )}
      <p className="five-line">
        <span className="five-label">带着</span>
        {data.inventory.map((i) => `${itemName(rules, i.key)}${i.qty > 1 ? `×${i.qty}` : ''}${worn.has(i.key) ? '（穿着拿着）' : ''}`).join('、') || '什么都没有'}
      </p>
      <p className="five-line">
        <span className="five-label">钱</span>
        {formatMoney(data.money)}
      </p>
    </div>
  );
}

/** 一串法术：名字（环级、专注、仪式），点开看说明。 */
export function SpellList({ rules, label, keys, always = [], free = {} }: { rules: RulesData; label: string; keys: string[]; always?: string[]; free?: Record<string, number> }) {
  if (!keys.length) return null;
  return (
    <div className="five-spells">
      <span className="five-label">{label}</span>
      <ul>
        {keys.map((k) => {
          const s = spellOf(rules, k);
          if (!s) return <li key={k}>{k}</li>;
          const tags = [s.level ? SPELL_LEVEL_LABEL[s.level] : '', s.concentration ? '专注' : '', s.ritual ? '仪式' : '', always.includes(k) ? '总是准备好' : '', free[k] ? (free[k] >= 99 ? '随意施放' : `免费 ${free[k]} 次`) : '']
            .filter(Boolean)
            .join('，');
          return (
            <li key={k}>
              <details>
                <summary>
                  {s.name}
                  {tags && <span className="muted">（{tags}）</span>}
                </summary>
                <p className="five-spell-meta">
                  {s.castingTime} · {s.range} · {s.components} · {s.duration}
                </p>
                <p className="five-text">{s.text}</p>
                {s.higher && <p className="five-text muted">升环：{s.higher}</p>}
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** 特性：名字，点开看说明。 */
function Features({ rules, sheet }: { rules: RulesData; sheet: Sheet5e }) {
  if (!sheet.features.length) return null;
  return (
    <div className="five-spells">
      <span className="five-label">特性</span>
      <ul>
        {sheet.features.map((f) => {
          const text = rules.features[f.key]?.text ?? rules.traits[f.key]?.text ?? rules.feats.find((x) => x.key === f.key)?.text ?? '';
          return (
            <li key={`${f.source}-${f.key}`}>
              {text ? (
                <details>
                  <summary>
                    {f.name}
                    <span className="muted">（{f.source}）</span>
                  </summary>
                  <p className="five-text">{text}</p>
                </details>
              ) : (
                <>
                  {f.name}
                  <span className="muted">（{f.source}）</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
