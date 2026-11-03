import fs from 'node:fs';
import path from 'node:path';
import { BUILTIN_SCENARIO_FILES, RETIRED_SCENARIO_FILES } from '../../scripts/builtin-scenarios.mjs';
import type { DB } from '../db';
import { HttpError } from '../http';
import { getSetting, setSetting } from '../settings';
import type { ScenarioSummary } from '../../shared/game';
import { validateScenario, type Scenario } from './scenario';

// 现成的剧本（scenarios 文件夹里的 JSON 文件）：管理页上架、下架、查看、上传、删除。
// 每个版本自带的几个只能下架（删了升级时又会回来）；上传的、自己放进去的可以删除，升级时会复制到新版本。

/** 剧本文件名（不带 .json）：小写字母、数字、短横线。 */
export const SCENARIO_KEY_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;

/** 下架的剧本（建对局时选不到）存在设置里。 */
const HIDDEN_SETTING = 'scenarios_hidden';

export function isBuiltinScenario(key: string): boolean {
  return BUILTIN_SCENARIO_FILES.includes(`${key}.json`);
}

/**
 * 算成绩的地下城（V0.7.0）：剧本大厅里的（自带的、管理员上传的、投稿通过的）。玩家自己导入的、让 AI 写的地下城
 * 照样能带卡进去玩，但不给成长点、带出来的东西和宝箱，也不进通关记录（难度、宝物都是写剧本的人自己定的）。
 */
export function rankedDungeon(stored: { source: string }): boolean {
  return stored.source === 'builtin';
}

/** 以前的版本自带、后来去掉的剧本的文件名：升级时不复制这些文件，所以上传的剧本不能用这些名字（升级会丢）。 */
export function isRetiredScenario(key: string): boolean {
  return RETIRED_SCENARIO_FILES.includes(`${key}.json`);
}

export const RETIRED_NAME_MESSAGE = '这个文件名是以前的版本自带的测试剧本用过的（升级时不会复制），换一个文件名';

export function hiddenScenarios(db: DB): Set<string> {
  try {
    const value = JSON.parse(getSetting(db, HIDDEN_SETTING) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((k): k is string => typeof k === 'string') : []);
  } catch {
    return new Set();
  }
}

export function setScenarioHidden(db: DB, key: string, hidden: boolean) {
  const set = hiddenScenarios(db);
  if (hidden) set.add(key);
  else set.delete(key);
  setSetting(db, HIDDEN_SETTING, JSON.stringify([...set].sort()));
}

export function summarizeScenario(key: string, s: Scenario): ScenarioSummary {
  return {
    key,
    title: s.title,
    genre: s.genre,
    tone: s.tone,
    players: s.players,
    expectedDays: s.expectedDays,
    relation: s.relation,
    stress: s.stress,
    startLabel: s.start.label,
    category: s.category ?? null,
    intro: s.intro ?? '',
    author: s.author ?? '',
    endingCount: s.endings.length,
    dungeon: s.dungeon ? { level: s.dungeon.level, size: s.dungeon.size } : null,
    rules: s.rules ?? 1,
    module5e: s.rules === '5e' ? { level: s.level ?? 1 } : null,
  };
}

/** 一个文件现在的样子：大小、修改时间、inode（替换成新文件也认得出来）。读不到是 null。 */
function fileStamp(file: string): string | null {
  try {
    const st = fs.statSync(file);
    return `${st.size}:${st.mtimeMs}:${st.ino}`;
  } catch {
    return null;
  }
}

/**
 * 剧本文件夹现在的样子：每个 .json 文件的名字和 fileStamp，加上下架的设置。两次一样，读出来的剧本列表就一样
 * （Works.listedScenarios 用它判断要不要重新读：每次都把所有剧本文件解析、检查一遍很慢）。
 */
export function scenarioFolderStamp(db: DB, dir: string): string {
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  } catch {
    files = [];
  }
  const parts = files.map((f) => `${f}:${fileStamp(path.join(dir, f)) ?? '?'}`);
  return `${getSetting(db, HIDDEN_SETTING) ?? ''}\n${parts.join('\n')}`;
}

/** 读过的剧本文件：文件没变（fileStamp 一样）就不再解析、检查一遍。最多记这么多个文件。 */
const FILE_CACHE_MAX = 200;
const fileCache = new Map<string, { stamp: string; result: { scenario: Scenario | null; errors: string[] } }>();

/** 读一个剧本文件并检查格式。文件没变时用上次读的结果（同一份，调用的地方不要改它）。 */
export function readScenarioFile(dir: string, key: string): { scenario: Scenario | null; errors: string[] } {
  const file = path.join(dir, `${key}.json`);
  const stamp = fileStamp(file);
  const cached = stamp === null ? undefined : fileCache.get(file);
  if (cached && cached.stamp === stamp) return cached.result;
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  } catch (err) {
    // 没读出来（文件没了、读的时候出错）：不记，下次再读
    fileCache.delete(file);
    return { scenario: null, errors: [err instanceof Error ? err.message : String(err)] };
  }
  let result: { scenario: Scenario | null; errors: string[] };
  try {
    const checked = validateScenario(JSON.parse(text));
    result = { scenario: checked.scenario, errors: checked.errors };
  } catch (err) {
    result = { scenario: null, errors: [err instanceof Error ? err.message : String(err)] };
  }
  if (stamp !== null) {
    fileCache.delete(file);
    fileCache.set(file, { stamp, result });
    // 记得太多了：丢掉最早记的
    if (fileCache.size > FILE_CACHE_MAX) fileCache.delete(fileCache.keys().next().value!);
  }
  return result;
}

export function scenarioFileExists(dir: string, key: string): boolean {
  return SCENARIO_KEY_RE.test(key) && fs.existsSync(path.join(dir, `${key}.json`));
}

/** 管理页的剧本列表：每个文件一行（格式有错的也列出来，写明错在哪）。 */
export type LibraryEntry = {
  key: string;
  /** 这个版本自带的（只能下架，不能删除）。 */
  builtin: boolean;
  /** 下架了：建对局时选不到。 */
  hidden: boolean;
  /** 用过这个剧本的对局有几局。 */
  usedBy: number;
  summary: ScenarioSummary | null;
  errors: string[];
  updatedAt: number;
};

export function scenarioLibrary(db: DB, dir: string): LibraryEntry[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
  const hidden = hiddenScenarios(db);
  const used = db.prepare("SELECT COUNT(*) AS n FROM scenarios WHERE source = 'builtin' AND scenario_key = ?");
  return files
    .map((file) => path.basename(file, '.json'))
    .filter((key) => SCENARIO_KEY_RE.test(key))
    .map((key) => {
      const { scenario, errors } = readScenarioFile(dir, key);
      let updatedAt = 0;
      try {
        updatedAt = fs.statSync(path.join(dir, `${key}.json`)).mtimeMs;
      } catch {
        updatedAt = 0;
      }
      return {
        key,
        builtin: isBuiltinScenario(key),
        hidden: hidden.has(key),
        usedBy: (used.get(key) as { n: number }).n,
        summary: scenario ? summarizeScenario(key, scenario) : null,
        errors: scenario ? [] : errors.slice(0, 5),
        updatedAt: Math.floor(updatedAt),
      };
    })
    .sort((a, b) => Number(b.builtin) - Number(a.builtin) || (a.summary?.title ?? a.key).localeCompare(b.summary?.title ?? b.key, 'zh'));
}

/** 上传的剧本存成文件。key 已经有自带的剧本时不行；已经有上传的，要 replace 才覆盖。 */
export function writeScenarioFile(dir: string, key: string, scenario: Scenario, replace: boolean) {
  if (!SCENARIO_KEY_RE.test(key)) throw new HttpError(400, '剧本的文件名只能用小写字母、数字和短横线');
  if (isBuiltinScenario(key)) throw new HttpError(409, '和自带的剧本重名了，换一个文件名');
  if (isRetiredScenario(key)) throw new HttpError(409, RETIRED_NAME_MESSAGE);
  const file = path.join(dir, `${key}.json`);
  if (fs.existsSync(file) && !replace) throw new HttpError(409, '已经有同名的剧本了');
  fs.mkdirSync(dir, { recursive: true });
  // 先写到临时文件再改名：写到一半出错不会留下坏文件
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(scenario, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
}

export function deleteScenarioFile(db: DB, dir: string, key: string) {
  if (!scenarioFileExists(dir, key)) throw new HttpError(404, '没有这个剧本');
  if (isBuiltinScenario(key)) throw new HttpError(409, '自带的剧本不能删除，可以下架');
  fs.unlinkSync(path.join(dir, `${key}.json`));
  setScenarioHidden(db, key, false);
}
