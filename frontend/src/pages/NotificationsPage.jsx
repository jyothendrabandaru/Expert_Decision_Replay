import { Bell, Check, CheckCheck } from 'lucide-react';
import { formatLocalDateTime, formatRelativeTime } from '../utils/date';
import api from '../api/client';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      await fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = notifications.filter(n => filter === 'all' ? true : !n.read_at);
  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Bell className="w-5 h-5" />
            </span>
            <span>Notifications Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Track reviews, approvals, and decisions requiring your attention</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filter === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors border border-blue-200/80 cursor-pointer shadow-xs"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No {filter === 'unread' ? 'unread ' : ''}notifications in your inbox.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                !n.read_at ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-slate-50/70'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                  {!n.read_at && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  )}
                </div>
                {n.body && <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono font-medium">
                    {formatLocalDateTime(n.created_at)}
                  </span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
              </div>

              {!n.read_at && (
                <button
                  onClick={() => handleMarkOneRead(n.id)}
                  className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-100/50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
