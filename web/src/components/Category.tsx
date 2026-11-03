import { ATTRIBUTE_NAME } from '../../../shared/rules';
import { CATEGORY_NAME, SCENARIO_CATEGORIES, type ScenarioCategory } from '../../../shared/game';

// 剧本分区：选分区的下拉框、剧本卡片上的分区标记。

/** 是不是一个剧本分区（网址里 ?c= 带的值之类）。 */
export const isCategory = (v: string | null): v is ScenarioCategory => SCENARIO_CATEGORIES.some((c) => c.key === v);

/** only：只列出哪些分区（投稿时地下城只能投「地下城」，别的剧本不能投「地下城」）。 */
export function CategorySelect({
  id,
  value,
  onChange,
  only,
}: {
  id: string;
  value: ScenarioCategory;
  onChange: (v: ScenarioCategory) => void;
  only?: (key: ScenarioCategory) => boolean;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as ScenarioCategory)}>
      {SCENARIO_CATEGORIES.filter((c) => !only || only(c.key)).map((c) => (
        <option key={c.key} value={c.key}>
          {c.name}（{ATTRIBUTE_NAME[c.attribute]}）
        </option>
      ))}
    </select>
  );
}

export function CategoryTag({ category }: { category: ScenarioCategory | null }) {
  if (!category) return null;
  return <span className={`category-tag category-${category}`}>{CATEGORY_NAME[category]}</span>;
}
