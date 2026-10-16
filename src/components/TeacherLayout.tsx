import { ReactNode, useState } from 'react';
import Logo from './Logo';
import { View } from '../types';
import ThemeToggle from './ThemeToggle';
import { authAPI } from '../services/api';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
  const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'dashboard':
      return <svg {...common}><path {...stroke} d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-3H4v3Z" /></svg>;
    case 'graduation':
      return <svg {...common}><path {...stroke} d="m3 8 9-4 9 4-9 4-9-4Z" /><path {...stroke} d="M7 10.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5" /><path {...stroke} d="M21 8v5" /></svg>;
    case 'megaphone':
      return <svg {...common}><path {...stroke} d="M4 13h3l9 4V5L7 9H4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2Z" /><path {...stroke} d="M7 13v5a2 2 0 0 0 2 2h1" /><path {...stroke} d="M19 9.5a3 3 0 0 1 0 3" /></svg>;
    case 'bell':
      return <svg {...common}><path {...stroke} d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path {...stroke} d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case 'menu':
      return <svg {...common}><path {...stroke} d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case 'logout':
      return <svg {...common}><path {...stroke} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path {...stroke} d="M16 17l5-5-5-5M21 12H9" /></svg>;
    default:
      return null;
  }
}

const navItems = [
  { view: 'teacher-dashboard', label: 'Dashboard', icon: 'dashboard' },
  { view: 'teacher-classes', label: 'My Classes', icon: 'graduation' },
  { view: 'teacher-announcements', label: 'Announcements', icon: 'megaphone' },
];

interface Props {
  children: ReactNode;
  currentView: View;
  navigate: (view: View) => void;
}

export default function TeacherLayout({ children, currentView, navigate }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const confirmLogout = () => {
    if (window.confirm('Do you want to continue logging out? Choose OK for Yes or Cancel for No.')) {
      authAPI.logout();
      navigate('landing');
    }
  };

  return (
    <div className="flex h-full bg-[#F8FAFC]">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 z-40 h-full w-64 bg-[#12304A] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:flex`}>
        <div className="p-5 border-b border-white/10">
          <Logo size="sm" className="[&_span]:text-white [&_.text-slate-500]:text-white/60" />
          <div className="mt-1 ml-10"><span className="text-xs font-medium text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-md">Teacher Portal</span></div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => { navigate(item.view as View); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${currentView === item.view ? 'bg-[#C2660A] text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white/85">
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-xl bg-white/10">
            <div className="w-8 h-8 rounded-full bg-[#C2660A] flex items-center justify-center text-white text-sm font-bold">T</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">Teacher Account</p><p className="text-xs text-white/50">English Faculty</p></div>
          </div>
          <button onClick={confirmLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-white/10 font-medium">
            <Icon name="logout" className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <button className="lg:hidden grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm" onClick={() => setSidebarOpen(true)}>
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="hidden lg:flex items-center gap-2"><span className="text-sm text-slate-500">Good morning,</span><span className="text-sm font-semibold text-slate-800">Teacher</span></div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Notifications"
              className="relative grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-[#1E6BB8]/30 hover:bg-blue-50 hover:text-[#1E6BB8]"
            >
              <Icon name="bell" className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>
            <button
              type="button"
              aria-label="Teacher account"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D37512] to-[#9D4E05] text-sm font-black text-white shadow-[0_10px_24px_rgba(194,102,10,0.24)] ring-1 ring-orange-200/70"
            >
              T
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

    </div>
  );
}
