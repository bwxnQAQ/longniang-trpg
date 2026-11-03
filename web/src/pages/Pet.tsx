import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ATTRIBUTE_KEYS, ATTRIBUTE_NAME, type AttributeKey } from '../../../shared/rules';
import { JOB_TIERS, PET_DESCRIPTION_MAX, PET_JOBS, PET_NAME_MAX, PET_STAT_MAX, TRIPS, type DiaryEntry, type PetJobKey, type PetPage, type TripKind } from '../../../shared/pets';
import { api, errorMessage } from '../api';
import { useAuth } from '../auth';
import { Field } from '../components/bits';
import { GuestNote } from '../components/GuestNote';
import { PetFigure } from '../components/PetFigure';
import { formatDateTime } from '../format';
import { useLiveEvent } from '../live';
import { formatRemaining, useNow } from '../room/time';
import { Link } from '../router';
import { squareImage } from './Account';

// 宠物（V0.5.0）：养一只、看它的属性和状态；打工挣龙晶；记录。
// V0.6.0：远行（带回龙晶和明信片）、日记。
// V0.7.0：买东西在「商城」，喂吃的、改名卡在「我的背包」，装扮在「装扮」（V0.8.1 起叫「我的装扮」，和「我的宠物」一起在头像菜单里）；龙晶不在宠物页显示；宠物不再有称号；
// 宠物排行去掉了（「排行」页是作品、作者、角色）。

type Tab = 'jobs' | 'trip' | 'diary' | 'records';
const TABS: { key: Tab; label: string }[] = [
  { key: 'jobs', label: '打工' },
  { key: 'trip', label: '远行' },
  { key: 'diary', label: '日记' },
  { key: 'records', label: '记录' },
];

/** 这几种通知来了，宠物页要刷新。 */
const REFRESH_ON = new Set(['pet_job_done', 'pet_trip_done', 'pet_diary', 'pet_visit', 'achievement']);

export function PetPageView() {
  // 游客也能打开看看（V0.7.1）：没有宠物，养的表单是灰的
  const guest = !!useAuth().user?.isGuest;
  const [page, setPage] = useState<PetPage | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('jobs');
  /** 日记有新的了（远行回来、写完日记）：日记分页重新拉。 */
  const [diaryVersion, setDiaryVersion] = useState(0);

  const load = useCallback(async () => {
    try {
      setPage(await api<PetPage>('GET', '/api/pet'));
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '我的宠物 - 龙娘跑团';
    void load();
  }, [load]);

  useLiveEvent<{ kind: string }>('notification', (n) => {
    if (!REFRESH_ON.has(n.kind)) return;
    void load();
    if (n.kind === 'pet_trip_done' || n.kind === 'pet_diary') setDiaryVersion((v) => v + 1);
  });

  /** 做一件事：成功以后用返回的新状态。 */
  async function act(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) {
    setBusy(true);
    setError('');
    try {
      setPage(await api<PetPage>(method, path, body));
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!page) {
    return error ? (
      <p className="form-error" role="alert">
        {error}
      </p>
    ) : (
      <p className="muted">正在加载……</p>
    );
  }

  return (
    <div className="pet-page">
      <div className="page-head">
        <h1>我的宠物</h1>
        {page.pet && (
          <Link to="/bag" className="btn btn-small btn-quiet">
            我的背包
          </Link>
        )}
      </div>
      {guest && <GuestNote what="养宠物" />}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!page.pet ? (
        <AdoptForm page={page} busy={busy} disabled={guest} onAdopt={(name, description) => act('POST', '/api/pet', { name, description })} />
      ) : (
        <>
          <PetCard page={page} busy={busy} act={act} />
          <div className="picker-tabs pet-tabs" role="tablist" aria-label="宠物">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" className="picker-tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'jobs' && <Jobs page={page} busy={busy} act={act} />}
          {tab === 'trip' && <Trips page={page} busy={busy} act={act} />}
          {tab === 'diary' && <Diary version={diaryVersion} />}
          {tab === 'records' && <Records page={page} />}
        </>
      )}
    </div>
  );
}

type Act = (method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) => Promise<boolean>;

/** 养一只。disabled：游客看得到表单，但不能填。 */
function AdoptForm({
  page,
  busy,
  disabled = false,
  onAdopt,
}: {
  page: PetPage;
  busy: boolean;
  disabled?: boolean;
  onAdopt: (name: string, description: string) => Promise<boolean>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const grown = ATTRIBUTE_KEYS.filter((k) => page.growth[k] > 0);
  return (
    <form
      className="panel form pet-adopt"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!disabled) void onAdopt(name, description);
      }}
      noValidate
    >
      <h2>养一只宠物</h2>
      <Field label="名字" htmlFor="pet-name">
        <input id="pet-name" maxLength={PET_NAME_MAX} value={name} disabled={disabled} onChange={(e) => setName(e.target.value)} autoFocus={!disabled} />
      </Field>
      <Field label="介绍（选填）" htmlFor="pet-desc">
        <textarea
          id="pet-desc"
          rows={3}
          maxLength={PET_DESCRIPTION_MAX}
          value={description}
          disabled={disabled}
          placeholder="它是什么、长什么样、什么脾气"
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      {grown.length > 0 && <p className="muted">玩完剧本攒下的属性：{grown.map((k) => `${ATTRIBUTE_NAME[k]} ${page.growth[k]}`).join('、')}</p>}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={disabled || busy || !name.trim()}>
          {busy ? '正在……' : '就是它了'}
        </button>
      </div>
    </form>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="pet-meter">
      <span className="pet-meter-label">{label}</span>
      <span className="pet-meter-bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={PET_STAT_MAX} aria-valuenow={value}>
        <span className={value < 20 ? 'pet-meter-fill is-low' : 'pet-meter-fill'} style={{ width: `${(value / PET_STAT_MAX) * 100}%` }} />
      </span>
      <span className="pet-meter-value">{value}</span>
    </div>
  );
}

/** 宠物的卡片：图、名字、介绍（改名字要用背包里的改名卡）、属性、饱食度和精力。 */
function PetCard({ page, busy, act }: { page: PetPage; busy: boolean; act: Act }) {
  const pet = page.pet!;
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(pet.description);
  const [imageError, setImageError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const now = useNow(pet.job || pet.trip ? 30_000 : null);

  async function pickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageError('');
    try {
      await act('PUT', '/api/pet/image', { image: await squareImage(file, 320) });
    } catch (err) {
      setImageError(errorMessage(err));
    }
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await act('PUT', '/api/pet', { description })) setEditing(false);
  }

  const away = pet.job
    ? `正在「${pet.job.name}」，${pet.job.endsAt - now > 0 ? formatRemaining(pet.job.endsAt - now) : '马上回来'}`
    : pet.trip
      ? `去「${pet.trip.name}」了，${pet.trip.endsAt - now > 0 ? formatRemaining(pet.trip.endsAt - now) : '马上回来'}`
      : null;

  return (
    <section className="pet-card" aria-label={pet.name}>
      <div className="pet-portrait">
        <PetFigure name={pet.name} image={pet.image} outfit={pet.outfit} size="large" />
        <div className="pet-portrait-actions">
          <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => fileRef.current?.click()}>
            {pet.image ? '换图' : '上传图'}
          </button>
          {pet.image && (
            <button type="button" className="btn btn-small btn-quiet" disabled={busy} onClick={() => void act('DELETE', '/api/pet/image')}>
              去掉图
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void pickImage(e)} />
        </div>
        {imageError && <p className="form-error">{imageError}</p>}
      </div>
      <div className="pet-info">
        <h2 className="pet-name">{pet.name}</h2>
        {editing ? (
          <form className="form" onSubmit={(e) => void save(e)} noValidate>
            <Field label="介绍" htmlFor="pet-redesc">
              <textarea id="pet-redesc" rows={3} maxLength={PET_DESCRIPTION_MAX} value={description} onChange={(e) => setDescription(e.target.value)} autoFocus />
            </Field>
            <div className="form-actions">
              <button className="btn btn-primary btn-small" disabled={busy}>
                保存
              </button>
              <button
                type="button"
                className="btn btn-small btn-quiet"
                onClick={() => {
                  setEditing(false);
                  setDescription(pet.description);
                }}
              >
                取消
              </button>
            </div>
          </form>
        ) : (
          <>
            {pet.description && <p className="pet-desc">{pet.description}</p>}
            <button
              type="button"
              className="btn btn-small btn-quiet pet-edit"
              onClick={() => {
                setDescription(pet.description);
                setEditing(true);
              }}
            >
              改介绍
            </button>
          </>
        )}
        {away && <p className="pet-away">{away}</p>}
        <dl className="pet-attrs">
          {ATTRIBUTE_KEYS.map((k) => (
            <div key={k}>
              <dt>{ATTRIBUTE_NAME[k]}</dt>
              <dd>{pet.attributes[k]}</dd>
            </div>
          ))}
        </dl>
        <div className="pet-meters">
          <Meter label="饱食度" value={pet.satiety} />
          <Meter label="精力" value={pet.energy} />
        </div>
      </div>
    </section>
  );
}

function Jobs({ page, busy, act }: { page: PetPage; busy: boolean; act: Act }) {
  const pet = page.pet!;
  const now = useNow(pet.job ? 30_000 : null);
  if (pet.trip) return <p className="pet-section muted">{pet.name}出门了，回来才能打工。</p>;
  if (pet.job) {
    const left = pet.job.endsAt - now;
    return (
      <section className="pet-section pet-working">
        <p>
          {pet.name}正在<strong>「{pet.job.name}」</strong>，{left > 0 ? formatRemaining(left) : '马上回来'}，回来能挣 {pet.job.pay} 龙晶。
        </p>
        <button
          type="button"
          className="btn btn-small btn-quiet"
          disabled={busy}
          onClick={() => {
            if (window.confirm('不干了？没有工钱，花掉的精力和饱食度也不退。')) void act('DELETE', '/api/pet/job');
          }}
        >
          不干了
        </button>
      </section>
    );
  }
  return (
    <section className="pet-section">
      <div className="job-board">
        {ATTRIBUTE_KEYS.map((attr) => (
          <div key={attr} className="job-column">
            <h3>
              {ATTRIBUTE_NAME[attr]} <span className="muted">{pet.attributes[attr]}</span>
            </h3>
            <ul>
              {PET_JOBS.filter((j) => j.attribute === attr).map((j) => {
                const t = JOB_TIERS[j.tier];
                const locked = pet.attributes[attr] < t.need;
                const why = locked
                  ? `${ATTRIBUTE_NAME[attr]}到 ${t.need} 才能做`
                  : pet.energy < t.energy
                    ? '精力不够'
                    : pet.satiety < t.satiety
                      ? '太饿了'
                      : '';
                return (
                  <li key={j.key} className={locked ? 'job is-locked' : 'job'}>
                    <span className="job-name">{j.name}</span>
                    <span className="job-meta">
                      {t.hours} 小时 · 精力 {t.energy} · 饱食度 {t.satiety}
                    </span>
                    <span className="job-pay">挣 {t.pay}</span>
                    {why ? (
                      <span className="job-why">{why}</span>
                    ) : (
                      <button type="button" className="btn btn-small" disabled={busy} onClick={() => void act('POST', '/api/pet/job', { job: j.key as PetJobKey })}>
                        去做
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Trips({ page, busy, act }: { page: PetPage; busy: boolean; act: Act }) {
  const pet = page.pet!;
  const now = useNow(pet.trip ? 30_000 : null);
  if (pet.trip) {
    const left = pet.trip.endsAt - now;
    const t = TRIPS[pet.trip.kind];
    return (
      <section className="pet-section pet-working">
        <p>
          {pet.name}去<strong>「{pet.trip.name}」</strong>了，{left > 0 ? formatRemaining(left) : '马上回来'}。回来带 {t.crystals[0]}～{t.crystals[1]} 龙晶
          {t.food ? '、一份吃的' : ''}和一张明信片。
        </p>
        <button
          type="button"
          className="btn btn-small btn-quiet"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`把${pet.name}叫回来？什么也带不回来，花掉的精力和饱食度也不退。`)) void act('DELETE', '/api/pet/trip');
          }}
        >
          叫回来
        </button>
      </section>
    );
  }
  if (pet.job) return <p className="pet-section muted">{pet.name}在打工，回来才能出门。</p>;
  return (
    <section className="pet-section">
      <ul className="trip-list">
        {(Object.keys(TRIPS) as TripKind[]).map((kind) => {
          const t = TRIPS[kind];
          const why = pet.energy < t.energy ? '精力不够' : pet.satiety < t.satiety ? '太饿了' : '';
          return (
            <li key={kind} className="trip">
              <span className="trip-name">{t.name}</span>
              <span className="trip-meta">
                {t.hours} 小时 · 精力 {t.energy} · 饱食度 {t.satiety}
              </span>
              <span className="trip-gain">
                带回 {t.crystals[0]}～{t.crystals[1]} 龙晶{t.food ? '、一份吃的' : ''}、一张明信片
              </span>
              {why ? (
                <span className="job-why">{why}</span>
              ) : (
                <button type="button" className="btn btn-small" disabled={busy} onClick={() => void act('POST', '/api/pet/trip', { kind })}>
                  出发
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Diary({ version }: { version: number }) {
  const [entries, setEntries] = useState<DiaryEntry[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ entries: DiaryEntry[] }>('GET', '/api/pet/diary')
      .then((r) => setEntries(r.entries))
      .catch((err) => setError(errorMessage(err)));
  }, [version]);
  if (error) return <p className="form-error">{error}</p>;
  if (!entries) return <p className="muted pet-section">正在加载……</p>;
  if (entries.length === 0) return <p className="empty pet-section">还没有日记和明信片。</p>;
  return (
    <section className="pet-section">
      <ul className="diary-list">
        {entries.map((e) =>
          e.kind === 'postcard' ? (
            <li key={e.id} className="postcard">
              <span className="postcard-stamp" aria-hidden="true" />
              <h3 className="postcard-place">{e.title}</h3>
              <p className="postcard-text">{e.text}</p>
              <span className="postcard-date">{formatDateTime(e.at)}</span>
            </li>
          ) : (
            <li key={e.id} className="diary-page">
              <h3 className="diary-title">
                {e.title}
                <span className="muted">{formatDateTime(e.at)}</span>
              </h3>
              <p className="diary-text">{e.text}</p>
              {e.writing && <p className="muted">还在写……</p>}
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

/** 玩完的剧本（成长记录）。龙晶的进出在商城的「龙晶记录」里。 */
function Records({ page }: { page: PetPage }) {
  return (
    <section className="pet-section">
      <h3 className="pet-subhead">玩完的剧本</h3>
      {page.games.length === 0 ? (
        <p className="muted">还没有玩完的剧本。</p>
      ) : (
        <ul className="plain-list">
          {page.games.map((g, i) => (
            <li key={i}>
              《{g.title}》{g.attribute ? `，${ATTRIBUTE_NAME[g.attribute as AttributeKey]} +1` : ''} <span className="muted">{formatDateTime(g.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
