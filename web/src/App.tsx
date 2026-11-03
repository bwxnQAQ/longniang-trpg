import type { ReactNode } from 'react';
import { useAuth } from './auth';
import { FeedbackHost } from './components/Feedback';
import { GuideHost } from './components/Guide';
import { useCurrency } from './currency';
import { SiteFooter } from './components/SiteFooter';
import { TopBar } from './components/TopBar';
import { AccountPage } from './pages/Account';
import { AdminPage } from './pages/Admin';
import { AdminRoomPage } from './pages/AdminRoom';
import { AgreeRulesPage } from './pages/AgreeRules';
import { BagPageView } from './pages/Bag';
import { CharactersPage } from './pages/Characters';
import { CollectionPage } from './pages/Collection';
import { DungeonHallPage } from './pages/DungeonHall';
import { ModuleHallPage } from './pages/ModuleHall';
import { EditorListPage, EditorPage } from './pages/Editor';
import { FriendsPage } from './pages/Friends';
import { HallPage } from './pages/Hall';
import { LoginPage } from './pages/Login';
import { JoinPage, NotFoundPage } from './pages/misc';
import { MyRoomsPage } from './pages/MyRooms';
import { NotificationsPage } from './pages/Notifications';
import { ProfilePage } from './pages/Profile';
import { RegisterPage } from './pages/Register';
import { RoomPage } from './pages/Room';
import { PetPageView } from './pages/Pet';
import { RankingsPage } from './pages/Rankings';
import { RulesPage } from './pages/Rules';
import { ScenarioHallPage } from './pages/ScenarioHall';
import { ShopPageView } from './pages/Shop';
import { TermsPage } from './pages/Terms';
import { WardrobePageView } from './pages/Wardrobe';
import { Link, matchPath, Redirect, safeNext, useLocation } from './router';
import { SiteDownBanner } from './components/SiteDown';

export function App() {
  const { user, loading } = useAuth();
  const { pathname, search, query } = useLocation();
  // 切换人民币、美元（或者汇率变了）时整个网页重画，金额都换过来
  useCurrency();

  if (loading) return <div className="boot" aria-busy="true" />;

  if (pathname === '/login') return user ? <Redirect to={safeNext(query.get('next'))} /> : withFooter(<LoginPage />);
  // 游客也能打开注册页（V0.7.1：各页的「注册以后才能……」）；注册好了原来的游客账号就删掉
  if (pathname === '/register') return user && !user.isGuest ? <Redirect to="/" /> : withFooter(<RegisterPage />);
  // 规则页、使用规则不登录也能看，方便朋友注册前先了解玩法
  if ((pathname === '/rules' || pathname === '/terms') && !user) {
    return withFooter(
      <main id="main" className="page page-bare">
        <p className="rules-back">
          <Link to="/login" className="back">
            回到登录
          </Link>
        </p>
        {pathname === '/rules' ? <RulesPage /> : <TermsPage />}
      </main>,
    );
  }
  if (!user) return <Redirect to={`/login?next=${encodeURIComponent(pathname + search)}`} />;
  // 以前注册的账号：先同意使用规则
  if (!user.rulesAgreed) return withFooter(<AgreeRulesPage />);

  let page: ReactNode;
  let width: 'normal' | 'wide' | 'full' = 'normal';
  let params: Record<string, string> | null;
  if (pathname === '/') {
    page = <HallPage />;
    width = 'full';
  } else if (pathname === '/hall') {
    page = <Redirect to="/" />;
  } else if (pathname === '/scenarios') {
    page = <ScenarioHallPage />;
    width = 'wide';
  } else if (pathname === '/dungeons') {
    // 地下城（V0.7.1）：从剧本大厅里单独拿出来
    page = <DungeonHallPage />;
    width = 'wide';
  } else if (pathname === '/modules') {
    // 模组（V1.0.0）：5E 模组从剧本大厅里单独拿出来
    page = <ModuleHallPage />;
    width = 'wide';
  } else if (pathname === '/editor') {
    // 网页剧本编辑器（V0.8.0）：草稿列表和新建。游客也能写、能检查、能导出，存不了草稿
    page = <EditorListPage />;
  } else if ((params = matchPath('/editor/:id', pathname)) && (params.id === 'new' || /^\d+$/.test(params.id))) {
    // /editor/new 是还没存过的；游客没有草稿，只能写新的
    page =
      user.isGuest && params.id !== 'new' ? <Redirect to="/editor" /> : <EditorPage id={params.id === 'new' ? null : Number(params.id)} from={query.get('from')} />;
    width = 'wide';
  } else if (pathname === '/pet') {
    // V0.7.1：顶栏的每一页游客都能打开看看（养、买、戴……这些要正式账号的事做不了）。
    // V0.8.1：宠物、装扮挪进头像菜单（我的宠物、我的装扮），游客照样能点进来看
    page = <PetPageView />;
    width = 'wide';
  } else if (pathname === '/collection') {
    page = <CollectionPage />;
    width = 'wide';
  } else if (pathname === '/shop') {
    // V0.7.0：商城、我的背包、装扮、我的角色；排行。游客看不了背包和我的角色（头像菜单里的），别的都能看
    page = <ShopPageView />;
    width = 'wide';
  } else if (pathname === '/bag') {
    page = user.isGuest ? <Redirect to="/" /> : <BagPageView />;
    width = 'wide';
  } else if (pathname === '/wardrobe') {
    page = <WardrobePageView />;
    width = 'wide';
  } else if (pathname === '/characters') {
    page = user.isGuest ? <Redirect to="/" /> : <CharactersPage />;
    width = 'wide';
  } else if (pathname === '/rankings') {
    page = <RankingsPage />;
    width = 'wide';
  } else if (pathname === '/rooms') {
    // 游客没有自己的对局，打开是空的
    page = <MyRoomsPage />;
  } else if ((params = matchPath('/room/:id', pathname)) && /^\d+$/.test(params.id)) {
    page = <RoomPage key={params.id} id={Number(params.id)} />;
    width = 'wide';
  } else if ((params = matchPath('/join/:code', pathname))) {
    page = <JoinPage code={params.code} />;
  } else if ((params = matchPath('/u/:username', pathname))) {
    page = <ProfilePage key={params.username} who={params.username} />;
  } else if ((params = matchPath('/friends/g/:groupId', pathname))) {
    // 群聊（V0.7.0）
    const groupId = Number(params.groupId);
    page = <FriendsPage chatWith={null} group={Number.isInteger(groupId) && groupId > 0 ? groupId : null} />;
  } else if (pathname === '/friends' || (params = matchPath('/friends/:username', pathname))) {
    page = <FriendsPage chatWith={pathname === '/friends' ? null : (params?.username ?? null)} />;
    width = 'wide';
  } else if (pathname === '/notifications') {
    page = <NotificationsPage />;
  } else if (pathname === '/admin' && user.isAdmin) {
    page = <AdminPage />;
    width = 'wide';
  } else if (user.permissions.includes('rooms') && (params = matchPath('/admin/rooms/:id', pathname)) && /^\d+$/.test(params.id)) {
    page = <AdminRoomPage key={params.id} id={Number(params.id)} />;
    width = 'wide';
  } else if (pathname === '/account') {
    page = <AccountPage />;
  } else if (pathname === '/rules') {
    page = <RulesPage />;
    width = 'wide';
  } else if (pathname === '/terms') {
    page = <TermsPage />;
  } else {
    page = <NotFoundPage />;
  }

  return (
    <>
      <a className="skip-link" href="#main">
        跳到正文
      </a>
      <TopBar />
      <SiteDownBanner />
      <main id="main" className={width === 'full' ? 'page page-full' : width === 'wide' ? 'page page-wide' : 'page'}>
        {page}
      </main>
      <SiteFooter />
      <FeedbackHost />
      {!user.isGuest && <GuideHost />}
    </>
  );
}

/** 没有顶栏的页面（登录、注册……）也在最下面显示作者和版本号。 */
function withFooter(page: ReactNode) {
  return (
    <>
      {page}
      <SiteFooter />
    </>
  );
}
