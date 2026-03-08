import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  LogOut,
  Music,
  Timer,
  ListTodo,
  MessageSquare,
  Settings,
  Sun,
  Moon,
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
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onLogout: () => void | Promise<void>;
  onResetLayout?: () => void;
  user: AuthUser;
};

export default function Sidebar({
  activeTab,
  onTabChange,
  onLogout,
  onResetLayout,
  user,
}: SidebarProps) {
  const [isDark, setIsDark] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    return localStorage.getItem("coda_profile_pic");
  });

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfilePic(localStorage.getItem("coda_profile_pic"));
    };
    window.addEventListener("coda_profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("coda_profile_updated", handleProfileUpdate);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const userInitial = user.name.trim().charAt(0).toUpperCase() || 'C';

  return (
    <aside
      className="flex w-[68px] shrink-0 h-full flex-col items-center rounded-[24px] border border-border-soft bg-panel py-8 shadow-panel backdrop-blur-[12px] animate-[fadeInUp_0.5s_ease_forwards]"
      id="sidebar"
    >
      {/* Logo — inset from top */}
      <div
        className="w-10 h-10 flex items-center justify-center bg-accent-strong rounded-[14px] text-ink-on-accent shadow-[0_2px_10px_rgba(120,100,160,0.18)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* The Outer Oval (Thick) */}
          <ellipse cx="12" cy="12" rx="6" ry="8" strokeWidth="2.5" />
          {/* Vertical and Horizontal lines (Thin) */}
          <line x1="12" y1="2" x2="12" y2="22" strokeWidth="1.5" />
          <line x1="4" y1="12" x2="20" y2="12" strokeWidth="1.5" />
        </svg>
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
              ${
                activeTab === item.id
                  ? "bg-accent-muted text-ink shadow-[0_2px_8px_rgba(120,100,160,0.12)]"
                  : "text-ink-muted hover:bg-panel-inner hover:text-ink-secondary"
              }`}
            onClick={() => {
              onTabChange(item.id);
              if (item.id === 'dashboard' && onResetLayout) {
                onResetLayout();
              }
            }}
            title={item.id === 'dashboard' ? 'Reset Dashboard Layout' : item.label}
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
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Moon size={19} strokeWidth={1.4} /> : <Sun size={19} strokeWidth={1.4} />}
        </button>
        <button
          className="w-11 h-11 flex items-center justify-center rounded-[14px] text-ink-muted hover:bg-panel-inner hover:text-ink-secondary transition-all duration-200 cursor-pointer"
          onClick={() => void onLogout()}
          title="Log out"
        >
          <LogOut size={19} strokeWidth={1.4} />
        </button>
        {profilePic ? (
          <div 
            className="w-9 h-9 rounded-full bg-panel-alt overflow-hidden border border-border-soft shadow-sm shrink-0"
            title={user.email}
          >
            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-strong to-accent-muted flex items-center justify-center text-ink-on-accent font-semibold text-[0.75rem]"
            title={user.email}
          >
            {userInitial}
          </div>
        )}
      </div>
    </aside>
  );
}
