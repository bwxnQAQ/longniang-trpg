// 做 5E 卡、升级（V0.9.0）：一步一步选，右边是算出来的角色卡；每一步还有什么没选、哪里选错了，标在步骤上。
import { useMemo, useState, type FormEvent } from 'react';
import { SRD_ATTRIBUTION, SRD_NOTE } from '../../../shared/5e/core';
import { expertiseCount } from '../../../shared/5e/class-rules';
import { quickCard } from '../../../shared/5e/quick';
import { cardIssues, classOf, computeSheet, type CardIssue, type CardSection } from '../../../shared/5e/sheet';
import type { Card5eData, RulesData, Sheet5e } from '../../../shared/5e/types';
import { CARD2_APPEARANCE_MAX, CARD2_BACKGROUND_MAX, CARD2_NAME_MAX } from '../../../shared/rules2';
import { CardSheet } from './SheetView';
import { castsSpells, hasFeatureChoices, withStartingGear } from './draft';
import { AbilitiesStep, BackgroundStep, ClassStep, EquipmentStep, FeaturesStep, SkillsStep, SpeciesStep, SpellsStep, type StepProps } from './steps';

type Step = CardSection | 'name';

const STEP_LABEL: Record<Step, string> = {
  class: '职业',
  species: '种族',
  background: '背景',
  abilities: '属性',
  skills: '技能',
  features: '职业特性',
  spells: '法术',
  equipment: '装备',
  name: '名字',
};

export type CardMeta = { name: string; appearance: string; background: string };

/**
 * mode：create 做新卡，remake 重新做（没打过模组的 1 级卡），levelup 升一级（old 是升级前的卡，start 已经是新的等级）。
 */
export function CardEditor({
  rules,
  mode,
  start,
  old = null,
  meta,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  rules: RulesData;
  mode: 'create' | 'remake' | 'levelup';
  start: Card5eData;
  old?: Card5eData | null;
  meta: CardMeta;
  busy: boolean;
  error: string;
  onSubmit: (data: Card5eData, meta: CardMeta) => void;
  onCancel: () => void;
}) {
  const levelUp = mode === 'levelup';
  const [card, setCard] = useState<Card5eData>(start);
  const [info, setInfo] = useState<CardMeta>(meta);
  const steps = useMemo<Step[]>(() => {
    const features: Step[] = hasFeatureChoices(card) ? ['features'] : [];
    if (!levelUp) return ['class', 'species', 'background', 'abilities', 'skills', ...features, ...(castsSpells(card, rules) ? (['spells'] as Step[]) : []), 'equipment', 'name'];
    const out: Step[] = [...features];
    if (card.level === 4) out.push('abilities');
    const newSkills = expertiseCount(card.class, card.level) > expertiseCount(card.class, card.level - 1) || (card.level === 3 && ['barbarian', 'bard'].includes(card.class));
    if (newSkills) out.push('skills');
    if (castsSpells(card, rules)) out.push('spells');
    out.push('name');
    return out;
  }, [levelUp, card, rules]);
  const [step, setStep] = useState<Step>(steps[0]);
  const issues = useMemo(() => cardIssues(card, rules), [card, rules]);
  const sheet = useMemo<Sheet5e | null>(() => {
    try {
      return computeSheet(card, rules);
    } catch {
      return null;
    }
  }, [card, rules]);
  const at = (s: Step) => issues.filter((i) => i.section === s);
  // 升级时不在步骤里的部分出的问题，算在最后一步
  const stray = issues.filter((i) => !steps.includes(i.section));
  const index = steps.indexOf(step);
  const set: StepProps['set'] = (fn) => setCard((c) => fn(c));
  const props: StepProps = { rules, card, set, levelUp, old };
  const cls = classOf(rules, card.class)!;
  const nameOk = info.name.trim().length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(card, { name: info.name.trim(), appearance: info.appearance.trim(), background: info.background.trim() });
  }

  return (
    <form className="five-editor" onSubmit={submit}>
      <header className="five-editor-head">
        <h2>{mode === 'levelup' ? `${info.name}：升到 ${card.level} 级` : mode === 'remake' ? `重新做「${info.name}」` : '做一张 5E 角色卡'}</h2>
        {!levelUp && (
          <button
            type="button"
            className="btn btn-small"
            onClick={() => setCard(withStartingGear(quickCard(rules, card.class, { species: card.species, background: card.background }), rules))}
          >
            按推荐填好（{cls.name}）
          </button>
        )}
      </header>

      <nav className="five-steps" aria-label="步骤">
        {steps.map((s, i) => {
          const list = s === 'name' ? [...at('name'), ...stray] : at(s);
          const state = list.some((x) => !x.todo) ? 'is-bad' : list.length ? 'is-todo' : 'is-done';
          return (
            <button key={s} type="button" className={`five-step-tab ${state}`} aria-current={step === s ? 'step' : undefined} onClick={() => setStep(s)}>
              <span className="five-step-no">{i + 1}</span>
              {STEP_LABEL[s]}
            </button>
          );
        })}
      </nav>

      <div className="five-editor-body">
        <div className="five-editor-main">
          <IssueList issues={step === 'name' ? [...at('name'), ...stray] : at(step)} />
          {step === 'class' && <ClassStep {...props} />}
          {step === 'species' && <SpeciesStep {...props} />}
          {step === 'background' && <BackgroundStep {...props} />}
          {step === 'abilities' && <AbilitiesStep {...props} />}
          {step === 'skills' && <SkillsStep {...props} />}
          {step === 'features' && <FeaturesStep {...props} />}
          {step === 'spells' && <SpellsStep {...props} />}
          {step === 'equipment' && <EquipmentStep {...props} />}
          {step === 'name' && (
            <div className="five-step">
              {!levelUp && (
                <>
                  <div className="field">
                    <label htmlFor="five-name">名字</label>
                    <input id="five-name" value={info.name} maxLength={CARD2_NAME_MAX} required onChange={(e) => setInfo({ ...info, name: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="five-look">外貌</label>
                    <textarea id="five-look" rows={2} maxLength={CARD2_APPEARANCE_MAX} value={info.appearance} onChange={(e) => setInfo({ ...info, appearance: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="five-story">背景故事</label>
                    <textarea id="five-story" rows={3} maxLength={CARD2_BACKGROUND_MAX} value={info.background} onChange={(e) => setInfo({ ...info, background: e.target.value })} />
                  </div>
                </>
              )}
              {sheet && <CardSheet rules={rules} data={card} sheet={sheet} />}
            </div>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions five-editor-actions">
            {index > 0 && (
              <button type="button" className="btn" onClick={() => setStep(steps[index - 1])}>
                上一步
              </button>
            )}
            {index < steps.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => setStep(steps[index + 1])}>
                下一步：{STEP_LABEL[steps[index + 1]]}
              </button>
            ) : (
              <button className="btn btn-primary" disabled={busy || issues.length > 0 || (!levelUp && !nameOk)}>
                {mode === 'levelup' ? `升到 ${card.level} 级` : mode === 'remake' ? '保存' : '做好了'}
              </button>
            )}
            <button type="button" className="btn btn-quiet" onClick={onCancel}>
              取消
            </button>
          </div>
        </div>
        {sheet && step !== 'name' && (
          <aside className="five-editor-preview" aria-label="角色卡预览">
            <h3>{info.name || '（还没起名字）'}</h3>
            <CardSheet rules={rules} data={card} sheet={sheet} compact />
          </aside>
        )}
      </div>
      <footer className="five-srd">
        <p>{SRD_NOTE}</p>
        <p lang="en">{SRD_ATTRIBUTION}</p>
      </footer>
    </form>
  );
}

function IssueList({ issues }: { issues: CardIssue[] }) {
  if (!issues.length) return null;
  return (
    <ul className="five-issues">
      {issues.map((i, k) => (
        <li key={k} className={i.todo ? 'is-todo' : 'is-bad'}>
          {i.text}
        </li>
      ))}
    </ul>
  );
}
