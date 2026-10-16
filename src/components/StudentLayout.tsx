import { ReactNode, useEffect, useState } from 'react';
import Logo from './Logo';
import { View } from '../types';
import ThemeToggle from './ThemeToggle';
import { authAPI, notificationsAPI } from '../services/api';
import { formatColomboDateTime } from '../utils/dateFormatter';
import StudentSupportAssistant from './StudentSupportAssistant';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  };

  const strokeProps = {
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'layout':
      return <svg {...common}><path {...strokeProps} d="M4 5a2 2 0 0 1 2-2h4v8H4V5ZM14 3h4a2 2 0 0 1 2 2v4h-6V3ZM4 15h6v6H6a2 2 0 0 1-2-2v-4ZM14 13h6v6a2 2 0 0 1-2 2h-4v-8Z" /></svg>;
    case 'book-open':
      return <svg {...common}><path {...strokeProps} d="M12 6.5A6 6 0 0 0 6 4H4v15h2a6 6 0 0 1 6 2.5m0-15A6 6 0 0 1 18 4h2v15h-2a6 6 0 0 0-6 2.5m0-15v15" /></svg>;
    case 'graduation':
      return <svg {...common}><path {...strokeProps} d="m3 8 9-4 9 4-9 4-9-4Z" /><path {...strokeProps} d="M7 10.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5" /><path {...strokeProps} d="M21 8v5" /></svg>;
    case 'assessment':
      return <svg {...common}><path {...strokeProps} d="M9 11l2 2 4-5" /><path {...strokeProps} d="M20 12a8 8 0 1 1-4.7-7.3" /><path {...strokeProps} d="M20 4v5h-5" /></svg>;
    case 'calendar':
      return <svg {...common}><path {...strokeProps} d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>;
    case 'megaphone':
      return <svg {...common}><path {...strokeProps} d="M4 13h3l9 4V5L7 9H4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2Z" /><path {...strokeProps} d="M7 13v5a2 2 0 0 0 2 2h1" /><path {...strokeProps} d="M19 9.5a3 3 0 0 1 0 3" /></svg>;
    case 'books':
      return <svg {...common}><path {...strokeProps} d="M5 4h5v16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path {...strokeProps} d="M10 4h4v16h-4" /><path {...strokeProps} d="m17 5 4 14-4 1-4-14 4-1Z" /></svg>;
    case 'package':
      return <svg {...common}><path {...strokeProps} d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path {...strokeProps} d="m4.5 8 7.5 4 7.5-4" /><path {...strokeProps} d="M12 12v9" /></svg>;
    case 'card':
      return <svg {...common}><path {...strokeProps} d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><path {...strokeProps} d="M2 10h20M6 15h4" /></svg>;
    case 'user':
      return <svg {...common}><path {...strokeProps} d="M20 21a8 8 0 0 0-16 0" /><path {...strokeProps} d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" /></svg>;
    case 'bell':
      return <svg {...common}><path {...strokeProps} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path {...strokeProps} d="M10 21h4" /></svg>;
    case 'cart':
      return <svg {...common}><path {...strokeProps} d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H8.2a2 2 0 0 1-2-1.6L5 3H2" /><path {...strokeProps} d="M9 20h.01M18 20h.01" /></svg>;
    case 'search':
      return <svg {...common}><path {...strokeProps} d="m21 21-4.3-4.3" /><path {...strokeProps} d="M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z" /></svg>;
    case 'menu':
      return <svg {...common}><path {...strokeProps} d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case 'logout':
      return <svg {...common}><path {...strokeProps} d="M10 17l5-5-5-5" /><path {...strokeProps} d="M15 12H3" /><path {...strokeProps} d="M13 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /></svg>;
    case 'check':
      return <svg {...common}><path {...strokeProps} d="m5 12 4 4L19 6" /></svg>;
    default:
      return null;
  }
}

const navItems = [
  { section: 'Learning', view: 'student-dashboard', label: 'Dashboard', icon: 'layout', helper: 'Overview' },
  { section: 'Learning', view: 'student-assessment', label: 'Level Check', icon: 'assessment', helper: 'Quiz & advice' },
  { section: 'Learning', view: 'student-courses', label: 'Courses', icon: 'book-open', helper: 'Browse classes' },
  { section: 'Learning', view: 'student-my-courses', label: 'My Enrollments', icon: 'graduation', helper: 'Approved courses' },
  { section: 'Learning', view: 'student-schedule', label: 'Class Schedule', icon: 'calendar', helper: 'Live sessions' },
  { section: 'Learning', view: 'student-announcements', label: 'Announcements', icon: 'megaphone', helper: 'Institute updates' },
  { section: 'Store', view: 'student-books', label: 'Books', icon: 'books', helper: 'Study materials' },
  { section: 'Store', view: 'student-orders', label: 'My Orders', icon: 'package', helper: 'Book orders' },
  { section: 'Store', view: 'student-payment-history', label: 'Payments', icon: 'card', helper: 'Receipts & fees' },
  { section: 'Account', view: 'student-profile', label: 'My Profile', icon: 'user', helper: 'Personal details' },
];

interface Props {
  children: ReactNode;
  currentView: View;
  navigate: (view: View) => void;
  cartCount?: number;
  user?: { firstName?: string; lastName?: string; grade?: string; profileImage?: string } | null;
  hasEnrolledCourses: boolean;
}

export default function StudentLayout({ children, currentView, navigate, cartCount = 0, user, hasEnrolledCourses }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const displayName = `${user?.firstName || 'Student'} ${user?.lastName || ''}`.trim();
  const visibleNavItems = navItems.filter(item => item.view !== 'student-announcements' || hasEnrolledCourses);
  const navSections = Array.from(new Set(visibleNavItems.map(item => item.section)));

  useEffect(() => {
    let active = true;
    const refreshNotifications = async () => {
      try {
        const response = await notificationsAPI.getUnread();
        if (active) {
          setNotifications(response.data?.notifications || []);
          setUnreadCount(response.data?.count || 0);
        }
      } catch {
        if (active) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    refreshNotifications();
    const intervalId = window.setInterval(refreshNotifications, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const markNotificationRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(current => current.filter(notification => notification._id !== id));
      setUnreadCount(current => Math.max(0, current - 1));
    } catch {
      // Keep the notification visible if the update fails.
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // Keep unread notifications visible if the update fails.
    }
  };

  const toggleNotifications = async () => {
    const opening = !notificationOpen;
    setNotificationOpen(opening);
    if (!opening) return;

    try {
      const response = await notificationsAPI.getUnread();
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.count || 0);
    } catch {
      // Keep the most recently loaded notifications visible if refresh fails.
    }
  };

  const openNotification = async (notification: any) => {
    await markNotificationRead(notification._id);
    const destinations: Record<string, View> = {
      BOOK_ORDER: 'student-orders',
      ENROLLMENT: 'student-my-courses',
      PAYMENT: 'student-payment-history',
      SCHEDULE: 'student-schedule',
      ANNOUNCEMENT: 'student-announcements',
    };
    const destination = destinations[notification.type];
    setNotificationOpen(false);
    if (destination) navigate(destination);
  };

  const confirmLogout = () => {
    if (window.confirm('Do you want to continue logging out? Choose OK for Yes or Cancel for No.')) {
      authAPI.logout();
      navigate('landing');
    }
  };

  return (
    <div className="flex h-full bg-[#F8FAFC]">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-full w-[18.5rem] border-r border-slate-200/70 bg-white/95 shadow-[20px_0_60px_rgba(15,23,42,0.06)] backdrop-blur-xl flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:flex`}>
        <div className="border-b border-slate-100 px-5 py-5">
          <Logo size="sm" />
          <div className="mt-5 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1E6BB8]">Student Portal</p>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">Manage classes, books, schedules and payments.</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {navSections.map(section => (
            <div key={section}>
              <p className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{section}</p>
              <div className="space-y-1.5">
                {visibleNavItems.filter(item => item.section === section).map(item => {
                  const isActive = currentView === item.view;
                  const badge =
                    item.view === 'student-announcements'
                      ? unreadCount
                      : item.view === 'student-orders'
                        ? cartCount
                        : 0;

                  return (
                    <button
                      key={item.view}
                      onClick={() => { navigate(item.view as View); setSidebarOpen(false); }}
                      className={`group relative w-full rounded-2xl px-3 py-3 text-left transition-all ${
                        isActive
                          ? 'bg-[#1E6BB8] text-white shadow-[0_14px_30px_rgba(30,107,184,0.28)]'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                          isActive
                            ? 'bg-white/18 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#1E6BB8] group-hover:shadow-sm'
                        }`}>
                          <Icon name={item.icon} className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold">{item.label}</span>
                          <span className={`mt-0.5 block truncate text-xs font-semibold ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{item.helper}</span>
                        </span>
                        {badge > 0 && (
                          <span className={`ml-auto min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-extrabold ${
                            isActive ? 'bg-white text-[#1E6BB8]' : 'bg-red-500 text-white'
                          }`}>
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-3">
            {user?.profileImage ? <img src={user.profileImage} alt="Student profile" className="h-11 w-11 rounded-2xl object-cover" /> : <div className="flex h-11 w-11 rounded-2xl bg-[#1E6BB8] items-center justify-center text-white text-base font-extrabold">{(user?.firstName || 'S').charAt(0).toUpperCase()}</div>}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-800">{displayName}</p>
              <p className="text-xs font-semibold text-slate-400">{user?.grade || 'Student'}</p>
            </div>
          </div>
          <button
            onClick={confirmLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-extrabold text-red-500 hover:bg-red-50"
          >
            <Icon name="logout" className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <button
            className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" className="h-4 w-4" /></span>
              <input placeholder="Search courses, books..." className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#1E6BB8]" />
            </div>
          </div>
          <div className="relative flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={notificationOpen}
              onClick={toggleNotifications}
              className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border transition-all ${
                notificationOpen
                  ? 'border-[#1E6BB8]/30 bg-blue-50 text-[#1E6BB8] shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-[#1E6BB8]/30 hover:bg-blue-50 hover:text-[#1E6BB8]'
              }`}
            >
              <Icon name="bell" className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />}
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
            {notificationOpen && (
              <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
                <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1E6BB8] text-white shadow-[0_12px_26px_rgba(30,107,184,0.24)]">
                        <Icon name="bell" className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">Notifications</h2>
                        <p className="text-xs font-semibold text-slate-500">{unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'Everything is up to date'}</p>
                      </div>
                    </div>
                    {unreadCount > 0 && <button type="button" onClick={markAllNotificationsRead} className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#1E6BB8] shadow-sm hover:bg-blue-50">Mark read</button>}
                  </div>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                      <Icon name="check" className="h-7 w-7" />
                    </span>
                    <p className="mt-4 text-sm font-extrabold text-slate-800">No new notifications</p>
                    <p className="mt-1 text-xs font-medium text-slate-400">Course, payment and schedule updates will appear here.</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map(notification => (
                      <button
                        key={notification._id}
                        type="button"
                        onClick={() => openNotification(notification)}
                        className="block w-full px-5 py-4 text-left hover:bg-slate-50"
                      >
                        <span className="flex items-start gap-3">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1E6BB8]" />
                          <span className="min-w-0">
                            <span className="block text-sm font-extrabold text-slate-800">{notification.title}</span>
                            <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-500">{notification.message}</span>
                            <time className="mt-2 block text-[11px] font-semibold text-slate-400">{formatColomboDateTime(notification.createdAt)}</time>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => navigate('student-cart')}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
            >
              <Icon name="cart" className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </button>
            <button onClick={() => navigate('student-profile')} className="w-9 h-9 rounded-full bg-[#1E6BB8] flex items-center justify-center text-white text-sm font-bold overflow-hidden">
              {user?.profileImage ? <img src={user.profileImage} alt="Student profile" className="w-full h-full object-cover" /> : (user?.firstName || 'S').charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <StudentSupportAssistant
        currentView={currentView}
        navigate={navigate}
        displayName={displayName}
        cartCount={cartCount}
        hasEnrolledCourses={hasEnrolledCourses}
      />
    </div>
  );
}
