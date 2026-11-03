import { Link } from '../router';

// 游客打开只有正式账号才能用的页面（V0.7.1：宠物、装扮、图鉴、社交、我的对局、地下城……）时看到的一句话：
// 「注册以后才能……」，「注册」点了去注册页。

export function GuestNote({ what }: { what: string }) {
  return (
    <p className="guest-note">
      <Link to="/register">注册</Link>以后才能{what}
    </p>
  );
}
