import { useState, useEffect } from 'react';
import {
  CalendarDays,
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
  { id: 'canvas', icon: CalendarDays, label: 'Canvas' },
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
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("coda_dark_mode") === "true";
  });
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

  // Sync dark mode from Settings changes
  useEffect(() => {
    const syncDark = () => {
      const dark = localStorage.getItem("coda_dark_mode") === "true";
      setIsDark(dark);
    };
    window.addEventListener("storage", syncDark);
    // Also listen for in-tab changes from Settings
    const handleSettingsDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("coda_dark_mode_changed", handleSettingsDark);
    return () => {
      window.removeEventListener("storage", syncDark);
      window.removeEventListener("coda_dark_mode_changed", handleSettingsDark);
    };
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("coda_dark_mode", String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new Event("coda_dark_mode_changed"));
  };

  const userInitial = user.name.trim().charAt(0).toUpperCase() || 'C';

  return (
    <aside
      className="flex w-[68px] shrink-0 h-full flex-col items-center rounded-[24px] border border-border-soft bg-panel py-8 shadow-panel backdrop-blur-[12px] animate-[fadeInUp_0.5s_ease_forwards]"
      id="sidebar"
    >
      {/* Logo — inset from top */}
      <img
        src="/coda-icon.svg"
        alt="Coda"
        className="h-10 w-10 rounded-[14px] shadow-[0_2px_10px_rgba(120,100,160,0.18)]"
      />

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
