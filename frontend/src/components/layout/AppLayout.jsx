import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  ClipboardCheck, 
  Users, 
  Database, 
  FileSpreadsheet, 
  BarChart3, 
  ShieldAlert, 
  Bell, 
  Search, 
  LogOut, 
  User as UserIcon, 
  Plus, 
  ChevronRight,
  Sparkles,
  Layers,
  Menu,
  X,
  Shield,
  Activity,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../ui/StatusBadge';
import { formatLocalTime, formatRelativeTime } from '../../utils/date';
import api from '../../api/client';

export const AppLayout = () => {
  const { user, roleCode, isAdmin, isManager, isReviewer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notificationRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unread_count);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=8');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications on clicking outside / other side
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  const handleOpenNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      fetchRecentNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setUnreadCount(0);
      fetchRecentNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/repository?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { to: '/decisions', label: 'Decisions Registry', icon: FolderKanban, show: true },
    { to: '/reviews', label: 'Assigned Reviews', icon: CheckSquare, show: isReviewer || isAdmin },
    { to: '/approvals', label: 'Pending Approvals', icon: ClipboardCheck, show: isManager || isAdmin },
    { to: '/teams', label: 'My Teams', icon: Layers, show: true },
    { to: '/repository', label: 'Knowledge Repository', icon: Database, show: true },
    { to: '/reports', label: 'Reports & Export', icon: FileSpreadsheet, show: true },
    { to: '/analytics', label: 'System Analysis & Analytics', icon: BarChart3, show: true },
    { to: '/admin/users', label: 'User Directory', icon: Users, show: isAdmin },
    { to: '/admin/audit', label: 'Audit & Compliance', icon: ShieldAlert, show: isAdmin },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50/70 antialiased font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 h-full bg-slate-950 text-slate-300 border-r border-slate-800/90 flex-shrink-0 select-none shadow-xl z-30">
        {/* Brand Header with Glowing Accent */}
        <div className="h-20 px-6 py-4.5 flex items-center gap-3.5 bg-slate-950/90 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-100 text-sm tracking-tight leading-tight">
              Expert Decision
            </h1>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <span>Replay Platform</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <Link
            to="/decisions/new"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Decision Case</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-1">
          {navLinks.filter(n => n.show).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-xs'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-xs shadow-blue-400" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Footer Card */}
        <div className="p-3.5 m-3 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-blue-500/30">
              {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">
                {user?.profile?.full_name || user?.email}
              </p>
              <div className="mt-1">
                <RoleBadge roleCode={roleCode} />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navigation Bar with Glassmorphism */}
        <header className="h-16 flex-shrink-0 bg-white/90 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between px-6 z-20 shadow-xs">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleGlobalSearch} className="max-w-md w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search decisions, rationales, case files... (Enter)"
                className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 pl-9 pr-14 py-2.5 rounded-xl border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder:text-slate-400"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </form>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell Dropdown with Outside-Click Handler */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={handleOpenNotifications}
                className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[9.5px] font-extrabold flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />

                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                        >
                          View all
                        </Link>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <CheckCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">No new notifications.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 text-xs hover:bg-slate-50 transition-colors ${
                              !n.read_at ? 'bg-blue-50/40 font-medium' : 'text-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900">{n.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatRelativeTime(n.created_at)}
                              </span>
                            </div>
                            {n.body && <p className="mt-1 text-slate-600 line-clamp-2 leading-relaxed">{n.body}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200"></div>

            {/* Profile Link */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-1 ring-blue-500/20">
                {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:inline font-bold text-xs text-slate-800">{user?.profile?.full_name || user?.email}</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 text-slate-300 p-4 border-b border-slate-800 space-y-1 animate-in slide-in-from-top-4 duration-150">
            {navLinks.filter(n => n.show).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl w-full mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
