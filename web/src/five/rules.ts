// 5E 规则（V0.9.0）在网页上：规则数据（职业、种族、背景、法术……）从服务器拿一次，整个页面共用。
import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api';
import type { RulesData, SpellData } from '../../../shared/5e/types';

let cache: Promise<RulesData> | null = null;

/** 拿规则数据（第一次从服务器拿，之后用同一份；拿失败了下次再拿）。 */
export function loadRules5e(): Promise<RulesData> {
  cache ??= api<RulesData>('GET', '/api/5e/rules').catch((err) => {
    cache = null;
    throw err;
  });
  return cache;
}

export function useRules5e(): { rules: RulesData | null; error: string } {
  const [rules, setRules] = useState<RulesData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    loadRules5e()
      .then((r) => alive && setRules(r))
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, []);
  return { rules, error };
}

export function spellOf(rules: RulesData, key: string): SpellData | null {
  return rules.spells.find((s) => s.key === key) ?? null;
}

export function spellName(rules: RulesData, key: string): string {
  return spellOf(rules, key)?.name ?? key;
}

export function featureText(rules: RulesData, key: string): { name: string; text: string } | null {
  return rules.features[key] ?? rules.traits[key] ?? null;
}
