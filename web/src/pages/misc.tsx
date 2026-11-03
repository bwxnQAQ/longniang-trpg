import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api';
import { Link, navigate } from '../router';

export function JoinPage({ code }: { code: string }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api<{ roomId: number }>('POST', '/api/rooms/join', { code })
      .then((r) => {
        if (!cancelled) navigate(`/room/${r.roomId}`, { replace: true });
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return error ? (
    <div className="page-error">
      <p className="form-error" role="alert">
        {error}
      </p>
      <Link to="/">回到大厅</Link>
    </div>
  ) : (
    <p className="muted">正在加入对局……</p>
  );
}

export function NotFoundPage() {
  useEffect(() => {
    document.title = '页面不存在 - 龙娘跑团';
  }, []);
  return (
    <div className="page-error">
      <h1>页面不存在</h1>
      <p>
        <Link to="/">回到大厅</Link>
      </p>
    </div>
  );
}
