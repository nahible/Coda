import { useState } from 'react';
import {
  LayoutDashboard,
  LogOut,
  Music,
  Timer,
  ListTodo,
  MessageSquare,
  Settings,
  Zap,
} from 'lucide-react';
import type { AuthUser } from '../api/auth';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'music', icon: Music, label: 'Music' },
  { id: 'timer', icon: Timer, label: 'Timer' },
  { id: 'tasks', icon: ListTodo, label: 'Tasks' },
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

type SidebarProps = {
  onLogout: () => void | Promise<void>;
  user: AuthUser;
};

export default function Sidebar({ onLogout, user }: SidebarProps) {
  const [active, setActive] = useState('dashboard');
  const userInitial = user.name.trim().charAt(0).toUpperCase() || 'C';

  return (
    <aside
      className="sidebar-glass flex flex-col items-center self-center w-[68px] shrink-0 anim-in"
      id="sidebar"
    >
      {/* Logo — inset from top */}
      <div
        className="w-10 h-10 flex items-center justify-center bg-accent-strong rounded-[14px] text-ink-on-accent shadow-[0_2px_10px_rgba(120,100,160,0.18)]"
      >
        <Zap size={18} strokeWidth={1.4} />
      </div>

      {/* Spacer */}
      <div className="h-[40px]" />

      {/* Nav — vertically centered */}
      <nav className="flex flex-col items-center gap-5 flex-1 justify-center">
        {navItems.map((item) => (
          <button
            key={item.id}
            id={`sidebar-${item.id}`}
            className={`w-11 h-11 flex items-center justify-center rounded-[14px] transition-all duration-200 cursor-pointer
              ${active === item.id
                ? 'bg-accent-muted text-ink shadow-[0_2px_8px_rgba(120,100,160,0.12)]'
                : 'text-ink-muted hover:bg-panel-inner hover:text-ink-secondary'
              }`}
            onClick={() => setActive(item.id)}
            title={item.label}
          >
            <item.icon size={19} strokeWidth={1.4} />
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="h-8" />

      <div className="flex flex-col items-center gap-3 pb-1">
        <button
          className="w-11 h-11 flex items-center justify-center rounded-[14px] text-ink-muted hover:bg-panel-inner hover:text-ink-secondary transition-all duration-200 cursor-pointer"
          onClick={() => void onLogout()}
          title="Log out"
        >
          <LogOut size={19} strokeWidth={1.4} />
        </button>
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-strong to-accent-muted flex items-center justify-center text-ink-on-accent font-semibold text-[0.75rem]"
          title={user.email}
        >
          {userInitial}
        </div>
      </div>
    </aside>
  );
}
