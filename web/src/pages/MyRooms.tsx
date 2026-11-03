import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScheduleMine } from '../../../shared/schedule';
import { api, errorMessage, type RoomSummary } from '../api';
import { useAuth } from '../auth';
import { GuestNote } from '../components/GuestNote';
import { useLiveEvent, useLiveOpen } from '../live';
import { MyRoomSchedule } from '../room/Schedule';
import { Link } from '../router';
import { JoinRoomForm, MyRooms } from './Lobby';

// 我的对局：我在的每一局、要我做的事、我的行动还要等多久、我不在时的新进展。「新建对局」在剧本大厅里（V0.5.0）。
// V0.7.1：游客也能打开（游客不能开局、加入，所以是空的）。

type Panel = 'none' | 'join';

export function MyRoomsPage() {
  const { user } = useAuth();
  const guest = !!user?.isGuest;
  const [rooms, setRooms] = useState<RoomSummary[] | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<Panel>('none');

  const load = useCallback(async () => {
    try {
      const r = await api<{ now: number; rooms: RoomSummary[] }>('GET', '/api/rooms');
      setRooms(r.rooms);
      setServerOffset(r.now - Date.now());
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    document.title = '我的对局 - 龙娘跑团';
    void load();
  }, [load]);

  // 推送：各局在线人数、有了新动静、加入或离开了对局。几条一起来的，稍等一下合并成一次刷新
  const timer = useRef<number | undefined>(undefined);
  const soon = () => {
    if (timer.current !== undefined) return;
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      void load();
    }, 400);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useLiveEvent<{ roomId: number; onlineCount: number }>('room-presence', (data) =>
    setRooms((list) => list?.map((r) => (r.id === data.roomId ? { ...r, onlineCount: data.onlineCount } : r)) ?? list),
  );
  useLiveEvent('rooms-changed', soon);
  useLiveEvent('room-activity', soon);
  useLiveOpen(() => void load());

  // 约团（V0.8.0）：每一局下次定下的时间、有没有要我勾的，一次拿全；约团变了、对局变了再拉
  const [schedule, setSchedule] = useState<Map<number, ScheduleMine>>(new Map());
  const loadSchedule = useCallback(async () => {
    if (guest) return;
    try {
      const r = await api<{ rooms: ScheduleMine[] }>('GET', '/api/schedule/mine');
      setSchedule(new Map(r.rooms.map((x) => [x.roomId, x])));
    } catch {
      // 拿不到约团不影响别的，下次推送时再拉
    }
  }, [guest]);
  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);
  // 推送来的变化：等半秒再拉，这半秒里来的几条合成一次
  const scheduleTimer = useRef<number | undefined>(undefined);
  const scheduleSoon = () => {
    if (scheduleTimer.current !== undefined) return;
    scheduleTimer.current = window.setTimeout(() => {
      scheduleTimer.current = undefined;
      void loadSchedule();
    }, 500);
  };
  useEffect(() => () => window.clearTimeout(scheduleTimer.current), []);
  useLiveEvent('schedule', scheduleSoon);
  useLiveEvent('rooms-changed', scheduleSoon);
  useLiveOpen(() => void loadSchedule());

  const toggle = (next: Panel) => setPanel((current) => (current === next ? 'none' : next));

  return (
    <div className="my-rooms">
      <div className="page-head">
        <h1>我的对局</h1>
        <div className="actions">
          <button type="button" className="btn" disabled={guest} aria-expanded={panel === 'join'} onClick={() => toggle('join')}>
            用对局码加入
          </button>
        </div>
      </div>
      {panel === 'join' && !guest && <JoinRoomForm onCancel={() => setPanel('none')} />}
      {guest && <GuestNote what="开局、加入对局" />}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {rooms === null ? (
        <p className="muted">正在加载……</p>
      ) : rooms.length === 0 ? (
        guest ? (
          <p className="empty">
            还没有对局。<Link to="/">去游戏大厅看公开的对局</Link>
          </p>
        ) : (
          <p className="empty">
            还没有对局。<Link to="/scenarios">去剧本大厅挑一个剧本开局</Link>
          </p>
        )
      ) : (
        <MyRooms rooms={rooms} serverOffset={serverOffset} extra={(r) => r.status !== 'ended' && <MyRoomSchedule info={schedule.get(r.id)} />} />
      )}
    </div>
  );
}
