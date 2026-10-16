import { ReactNode, useEffect, useState } from 'react';
import Logo from './Logo';
import { View } from '../types';
import ThemeToggle from './ThemeToggle';
import { authAPI, notificationsAPI } from '../services/api';
import { formatColomboDateTime } from '../utils/dateFormatter';
import { Button, Input } from './ui';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
  const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'dashboard':
      return <svg {...common}><path {...stroke} d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-3H4v3Z" /></svg>;
    case 'students':
      return <svg {...common}><path {...stroke} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path {...stroke} d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path {...stroke} d="M22 21v-2a4 4 0 0 0-3-3.87" /><path {...stroke} d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'enrollments':
      return <svg {...common}><path {...stroke} d="m3 8 9-4 9 4-9 4-9-4Z" /><path {...stroke} d="M7 10.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5" /><path {...stroke} d="M21 8v6" /></svg>;
    case 'courses':
      return <svg {...common}><path {...stroke} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path {...stroke} d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>;
    case 'promotions':
      return <svg {...common}><path {...stroke} d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" /><path {...stroke} d="M2 7h20v5H2z" /><path {...stroke} d="M12 22V7" /><path {...stroke} d="M12 7H7.5a2.5 2.5 0 1 1 2.05-3.93L12 7Z" /><path {...stroke} d="M12 7h4.5a2.5 2.5 0 1 0-2.05-3.93L12 7Z" /></svg>;
    case 'classes':
      return <svg {...common}><path {...stroke} d="M3 21h18M5 21V7l7-4 7 4v14" /><path {...stroke} d="M9 21v-6h6v6M9 10h.01M15 10h.01" /></svg>;
    case 'teachers':
      return <svg {...common}><path {...stroke} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><path {...stroke} d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path {...stroke} d="M18 8h4M20 6v4" /></svg>;
    case 'books':
      return <svg {...common}><path {...stroke} d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" /><path {...stroke} d="M5 4.5A2.5 2.5 0 0 0 7.5 7H20" /></svg>;
    case 'orders':
      return <svg {...common}><path {...stroke} d="m21 8-9-5-9 5 9 5 9-5Z" /><path {...stroke} d="M3 8v8l9 5 9-5V8" /><path {...stroke} d="M12 13v8" /></svg>;
    case 'payments':
      return <svg {...common}><path {...stroke} d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><path {...stroke} d="M2 10h20M6 15h4" /></svg>;
    case 'announcements':
      return <svg {...common}><path {...stroke} d="m3 11 18-5v12L3 13v-2Z" /><path {...stroke} d="M7 14v5a2 2 0 0 0 2 2h1" /></svg>;
    case 'assessments':
      return <svg {...common}><path {...stroke} d="M9 11l2 2 4-5" /><path {...stroke} d="M20 12a8 8 0 1 1-4.7-7.3" /><path {...stroke} d="M20 4v5h-5" /></svg>;
    case 'reports':
      return <svg {...common}><path {...stroke} d="M4 19V5M9 19v-8M14 19v-5M19 19V8" /><path {...stroke} d="M3 19h18" /></svg>;
    case 'menu':
      return <svg {...common}><path {...stroke} d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case 'bell':
      return <svg {...common}><path {...stroke} d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path {...stroke} d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case 'logout':
      return <svg {...common}><path {...stroke} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path {...stroke} d="M16 17l5-5-5-5M21 12H9" /></svg>;
    case 'chevron':
      return <svg {...common}><path {...stroke} d="m6 9 6 6 6-6" /></svg>;
    default:
      return null;
  }
}

const navItems = [
  { view: 'admin-dashboard', label: 'Dashboard', icon: 'dashboard' },
  { view: 'admin-students', label: 'Students', icon: 'students' },
  { view: 'admin-enrollments', label: 'Enrollments', icon: 'enrollments' },
  { view: 'admin-courses', label: 'Courses', icon: 'courses' },
  { view: 'admin-promotions', label: 'Promotions', icon: 'promotions' },
  { view: 'admin-classes', label: 'Classes', icon: 'classes' },
  { view: 'admin-teachers', label: 'Teachers', icon: 'teachers' },
  { view: 'admin-books', label: 'Books', icon: 'books' },
  { view: 'admin-orders', label: 'Orders', icon: 'orders' },
  { view: 'admin-payments', label: 'Payments', icon: 'payments' },
  { view: 'admin-announcements', label: 'Announcements', icon: 'announcements' },
  { view: 'admin-assessments', label: 'Assessments', icon: 'assessments' },
  { view: 'admin-reports', label: 'Reports', icon: 'reports' },
];

interface Props {
  children: ReactNode;
  currentView: View;
  navigate: (view: View) => void;
  user?: any;
}

const emptyPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function AdminLayout({ children, currentView, navigate, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountTab, setAccountTab] = useState<'profile' | 'password'>('profile');
  const [adminUser, setAdminUser] = useState(user);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [accountMessage, setAccountMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const displayName = `${adminUser?.firstName || 'Admin'} ${adminUser?.lastName || ''}`.trim();
  const initials = `${adminUser?.firstName?.[0] || 'A'}${adminUser?.lastName?.[0] || ''}`.toUpperCase();

  useEffect(() => {
    if (!user) return;
    setAdminUser(user);
    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  }, [user]);

  useEffect(() => {
    if (!accountOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [accountOpen]);

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

  const confirmLogout = () => {
    if (window.confirm('Do you want to continue logging out? Choose OK for Yes or Cancel for No.')) {
      authAPI.logout();
      navigate('landing');
    }
  };

  const openAccountSettings = () => {
    setAccountMessage(null);
    setAccountOpen(true);
  };

  const saveProfile = async () => {
    setAccountMessage(null);
    setSavingProfile(true);
    try {
      const response = await authAPI.updateProfile(profileForm);
      const updatedUser = response?.user || { ...adminUser, ...profileForm };
      setAdminUser(updatedUser);
      setProfileForm({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
      });
      setAccountMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error: any) {
      setAccountMessage({ type: 'error', text: error?.message || 'Unable to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setAccountMessage(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAccountMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      await authAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm(emptyPasswordForm);
      setAccountMessage({ type: 'success', text: 'Password changed successfully.' });
    } catch (error: any) {
      setAccountMessage({ type: 'error', text: error?.message || 'Unable to change password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex h-full bg-[#F7FAFC]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 z-40 flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-200/40 transition-transform duration-300 lg:static lg:flex lg:translate-x-0 lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-slate-100 p-5">
          <Logo size="sm" />
          <div className="ml-10 mt-2">
            <span className="rounded-full border border-[#1E6BB8]/20 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1E6BB8]">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map(item => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => {
                  navigate(item.view as View);
                  setSidebarOpen(false);
                }}
                className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#1E6BB8] text-white shadow-lg shadow-blue-700/20'
                    : 'text-slate-500 hover:bg-blue-50 hover:text-[#1E6BB8]'
                }`}
              >
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${isActive ? 'bg-white/15' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#1E6BB8]'}`}>
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Signed in as</p>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#C2660A] text-sm font-extrabold text-white">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900">{displayName}</p>
                <p className="text-xs font-semibold text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
          <button
            onClick={confirmLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
          >
            <Icon name="logout" className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-[80] flex flex-shrink-0 items-center justify-between border-b border-slate-200/70 bg-white px-6 py-3.5">
          <div className="flex min-w-0 items-center gap-4">
            <button className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-600 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="hidden items-center gap-2 lg:flex">
                <span className="text-sm font-semibold text-slate-500">Good morning,</span>
                <span className="text-sm font-extrabold text-slate-900">{displayName}</span>
              </div>
              <p className="hidden text-xs font-semibold text-slate-400 lg:block">Operations workspace · live institute data</p>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={notificationOpen}
              onClick={() => setNotificationOpen(open => !open)}
              className="relative grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Icon name="bell" className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>
            {notificationOpen && (
              <div className="fixed right-4 top-16 z-[120] w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-6">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Notifications</h2>
                    <p className="text-xs font-semibold text-slate-400">{unreadCount} unread updates</p>
                  </div>
                  {unreadCount > 0 && <button type="button" onClick={markAllNotificationsRead} className="text-xs font-bold text-[#1E6BB8] hover:underline">Mark all read</button>}
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm font-semibold text-slate-400">No new notifications</p>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map(notification => (
                      <button
                        key={notification._id}
                        type="button"
                        onClick={() => markNotificationRead(notification._id)}
                        className="block w-full px-4 py-3 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="block text-sm font-extrabold text-slate-900">{notification.title}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-500">{notification.message}</span>
                        <time className="mt-2 block text-[11px] text-slate-400">{formatColomboDateTime(notification.createdAt)}</time>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button type="button" onClick={openAccountSettings} aria-label="Open admin account settings" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pl-2 shadow-sm transition-colors hover:bg-slate-50">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#C2660A] text-sm font-extrabold text-white">{initials}</div>
              <Icon name="chevron" className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {accountOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-account-title">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#D37512] to-[#9D4E05] text-lg font-black text-white shadow-lg shadow-orange-900/15">{initials}</div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E6BB8]">Admin Account</p>
                  <h2 id="admin-account-title" className="mt-1 text-xl font-black text-slate-950">{displayName}</h2>
                  <p className="text-sm font-medium text-slate-500">{adminUser?.email || 'Administrator profile'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setAccountOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close account settings">×</button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 px-6 py-3">
              <button type="button" onClick={() => { setAccountTab('profile'); setAccountMessage(null); }} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${accountTab === 'profile' ? 'bg-white text-[#1E6BB8] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>Profile Details</button>
              <button type="button" onClick={() => { setAccountTab('password'); setAccountMessage(null); }} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${accountTab === 'password' ? 'bg-white text-[#1E6BB8] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>Change Password</button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {accountMessage && (
                <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${accountMessage.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {accountMessage.text}
                </div>
              )}

              {accountTab === 'profile' ? (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input label="First name" value={profileForm.firstName} onChange={value => setProfileForm(current => ({ ...current, firstName: value }))} required />
                    <Input label="Last name" value={profileForm.lastName} onChange={value => setProfileForm(current => ({ ...current, lastName: value }))} required />
                    <Input label="Email address" type="email" value={profileForm.email} onChange={value => setProfileForm(current => ({ ...current, email: value }))} autoComplete="email" required />
                    <Input label="Phone number" value={profileForm.phone} onChange={value => setProfileForm(current => ({ ...current, phone: value.replace(/\D/g, '').slice(0, 10) }))} inputMode="tel" maxLength={10} hint="Use 10 digits, e.g. 0711234567" />
                  </div>
                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                    <Button variant="ghost" onClick={() => setAccountOpen(false)}>Close</Button>
                    <Button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Profile'}</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    Use at least 8 characters with one uppercase letter, one number, and one special character.
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Input label="Current password" type="password" value={passwordForm.currentPassword} onChange={value => setPasswordForm(current => ({ ...current, currentPassword: value }))} autoComplete="current-password" required />
                    <Input label="New password" type="password" value={passwordForm.newPassword} onChange={value => setPasswordForm(current => ({ ...current, newPassword: value }))} autoComplete="new-password" required />
                    <Input label="Confirm new password" type="password" value={passwordForm.confirmPassword} onChange={value => setPasswordForm(current => ({ ...current, confirmPassword: value }))} autoComplete="new-password" required />
                  </div>
                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                    <Button variant="ghost" onClick={() => setAccountOpen(false)}>Close</Button>
                    <Button onClick={savePassword} disabled={savingPassword}>{savingPassword ? 'Changing...' : 'Change Password'}</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
