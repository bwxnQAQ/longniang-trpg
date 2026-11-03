import { useEffect } from 'react';
import type { User } from '../api';
import { useAuth } from '../auth';
import { CurrencySwitch } from '../components/CurrencySwitch';
import { useBadges } from '../live';
import { navigate, useLocation } from '../router';
import { has } from './admin/common';
import { UsersTab } from './admin/UsersTab';
import { AdminsTab } from './admin/AdminsTab';
import { ReportsTab } from './admin/ReportsTab';
import { ViolationsTab } from './admin/ViolationsTab';
import { AnnounceTab } from './admin/AnnounceTab';
import { RoomsTab } from './admin/RoomsTab';
import { ChatsTab } from './admin/ChatsTab';
import { ScenariosTab } from './admin/ScenariosTab';
import { AiTab } from './admin/AiTab';
import { InvitesTab, RegistrationPanel } from './admin/InvitesTab';
import { CreditCodesTab } from './admin/CreditCodesTab';
import { CrystalsTab } from './admin/CrystalsTab';
import { ShopPricesTab } from './admin/ShopPricesTab';
import { ItemsTab } from './admin/ItemsTab';
import { EventsTab } from './admin/EventsTab';
import { AuditTab } from './admin/AuditTab';
import { SystemTab } from './admin/SystemTab';

// 管理页。站长什么都能做，只有站长能任命管理员、下发权限；其他管理员按权限只看到、只能做自己那几项。
// 账号（UID、身份、备注、额度、封号、批量处理）、管理员、举报和反馈、违规记录、公告、所有对局、剧本、AI、邀请码、兑换码、龙晶换额度、
// 活动（V0.6.0）、聊天记录（V0.7.0：所有的群聊和私信）、商城的上架下架和发物品（V0.7.1）、操作记录、版本和数据。
// 每个分页的代码在 admin/ 下面，一个分页一个文件；几个分页共用的小东西在 admin/common.tsx。

type Tab = 'users' | 'admins' | 'reports' | 'violations' | 'announce' | 'rooms' | 'chats' | 'scenarios' | 'ai' | 'invites' | 'codes' | 'crystals' | 'shop' | 'items' | 'events' | 'audit' | 'system';

const TABS: { id: Tab; label: string; can: (u: User) => boolean }[] = [
  { id: 'users', label: '账号', can: (u) => has(u, 'users', 'credit', 'ban') },
  { id: 'admins', label: '管理员', can: (u) => u.isOwner },
  { id: 'reports', label: '举报和反馈', can: (u) => has(u, 'reports') },
  { id: 'violations', label: '违规记录', can: (u) => has(u, 'ban') },
  { id: 'announce', label: '公告', can: (u) => has(u, 'announce') },
  { id: 'rooms', label: '所有对局', can: (u) => has(u, 'rooms') },
  { id: 'chats', label: '聊天记录', can: (u) => has(u, 'reports') },
  { id: 'scenarios', label: '剧本', can: (u) => has(u, 'scenarios') },
  { id: 'ai', label: 'AI', can: (u) => has(u, 'ai') },
  { id: 'invites', label: '注册', can: (u) => has(u, 'invites', 'credit') },
  { id: 'codes', label: '兑换码', can: (u) => has(u, 'credit') },
  { id: 'crystals', label: '龙晶', can: (u) => has(u, 'credit') },
  { id: 'shop', label: '商城', can: (u) => has(u, 'credit') },
  { id: 'items', label: '物品', can: (u) => has(u, 'credit') },
  { id: 'events', label: '活动', can: (u) => has(u, 'credit') },
  { id: 'audit', label: '操作记录', can: (u) => has(u, 'audit') },
  { id: 'system', label: '版本和数据', can: (u) => has(u, 'system') },
];

export function AdminPage() {
  const { user } = useAuth();
  const { query } = useLocation();
  const badges = useBadges();
  const tabs = user ? TABS.filter((t) => t.can(user)) : [];
  const raw = query.get('tab');
  const tab: Tab | null = tabs.find((t) => t.id === raw)?.id ?? tabs[0]?.id ?? null;

  useEffect(() => {
    document.title = '管理 - 龙娘跑团';
  }, []);

  if (!user) return null;
  return (
    <div className="admin">
      <div className="page-head">
        <h1>管理</h1>
        <CurrencySwitch />
      </div>
      <div className="picker-tabs admin-tabs" role="tablist" aria-label="管理">
        {tabs.map((t) => {
          const count =
            t.id === 'reports' ? badges.adminReports : t.id === 'violations' ? badges.adminViolations : t.id === 'scenarios' ? badges.adminSubmissions : 0;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              className="picker-tab"
              aria-selected={tab === t.id}
              onClick={() => navigate(`/admin?tab=${t.id}`, { replace: true })}
            >
              {t.label}
              {count > 0 && <span className="tab-count tab-count-new">{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="admin-body">
        {tab === null && <p className="placeholder">站长还没给你开通管理权限。</p>}
        {tab === 'users' && <UsersTab me={user} initialQuery={query.get('q') ?? ''} />}
        {tab === 'admins' && <AdminsTab me={user} />}
        {tab === 'reports' && <ReportsTab me={user} />}
        {tab === 'violations' && <ViolationsTab me={user} />}
        {tab === 'announce' && <AnnounceTab />}
        {tab === 'rooms' && <RoomsTab />}
        {tab === 'chats' && <ChatsTab initialGroup={Number(query.get('group')) || null} />}
        {tab === 'scenarios' && <ScenariosTab />}
        {tab === 'ai' && <AiTab />}
        {tab === 'invites' && (
          <>
            <RegistrationPanel me={user} />
            {has(user, 'invites') && <InvitesTab />}
          </>
        )}
        {tab === 'codes' && <CreditCodesTab />}
        {tab === 'crystals' && <CrystalsTab />}
        {tab === 'shop' && <ShopPricesTab />}
        {tab === 'items' && <ItemsTab />}
        {tab === 'events' && <EventsTab />}
        {tab === 'audit' && <AuditTab />}
        {tab === 'system' && <SystemTab />}
      </div>
    </div>
  );
}
