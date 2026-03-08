import React, { useState, useEffect } from "react";
import { User, Palette, Timer, Upload, Check, Disc, Disc3, Image, Pipette } from "lucide-react";

type SettingsProps = {
  // We will pass the user and options here later
  onClose?: () => void;
};

const COLOR_THEMES = [
  { id: "green", name: "Pastel Green", hex: "#a8e6cf" },
  { id: "pink", name: "Pastel Pink", hex: "#ffb3ba" },
  { id: "purple", name: "Purple", hex: "#c8bedc" },
  { id: "blue", name: "Pastel Blue", hex: "#bae1ff" },
  { id: "yellow", name: "Butter Yellow", hex: "#f5e6a3" },
  { id: "orange", name: "Pastel Orange", hex: "#fad6a5" },
  { id: "bw", name: "Black & White", hex: "#e0e0e0" },
];

export default function Settings({ onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<"appearance" | "timer" | "profile">("appearance");
  
  // Appearance State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("coda_dark_mode") === "true";
  });
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("coda_theme") || "purple";
  });
  const [customColor, setCustomColor] = useState(() => {
    return localStorage.getItem("coda_custom_color") || "#c8bedc";
  });

  // Helper to derive lighter/darker shades from a hex color
  function hexToHSL(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hslToHex(h: number, s: number, l: number) {
    const sl = s / 100, ll = l / 100;
    const a = sl * Math.min(ll, 1 - ll);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const c = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  // Apply Appearance instantly
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);
    localStorage.setItem("coda_theme", activeTheme);

    if (activeTheme === "custom") {
      const { h, s } = hexToHSL(customColor);
      const isDark = document.documentElement.classList.contains('dark');
      const root = document.documentElement;
      root.style.setProperty('--theme-accent', customColor);
      root.style.setProperty('--theme-accent-strong', customColor);
      root.style.setProperty('--theme-accent-muted', hslToHex(h, Math.max(s - 15, 10), isDark ? 22 : 88));
      root.style.setProperty('--theme-check-bg', customColor);
      root.style.setProperty('--theme-ring-work', customColor);
      root.style.setProperty('--theme-user-bubble', `hsla(${h}, ${s}%, ${isDark ? 35 : 75}%, ${isDark ? 0.3 : 0.7})`);
      root.style.setProperty('--theme-tag-bg', `hsla(${h}, ${s}%, ${isDark ? 35 : 75}%, 0.6)`);
    } else {
      // Clear any inline custom properties when using a preset theme
      const root = document.documentElement;
      root.style.removeProperty('--theme-accent');
      root.style.removeProperty('--theme-accent-strong');
      root.style.removeProperty('--theme-accent-muted');
      root.style.removeProperty('--theme-check-bg');
      root.style.removeProperty('--theme-ring-work');
      root.style.removeProperty('--theme-user-bubble');
      root.style.removeProperty('--theme-tag-bg');
    }
  }, [activeTheme, customColor, isDarkMode]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("coda_dark_mode", String(isDarkMode));
    window.dispatchEvent(new Event("coda_dark_mode_changed"));
  }, [isDarkMode]);
  
  // Timer State
  const [workTime, setWorkTime] = useState(() => {
    return parseFloat(localStorage.getItem("coda_work_mins") || "25");
  });
  const [breakTime, setBreakTime] = useState(() => {
    return parseFloat(localStorage.getItem("coda_break_mins") || "5");
  });

  const handleTimerPreset = (work: number, breakMins: number) => {
    setWorkTime(work);
    setBreakTime(breakMins);
  };

  useEffect(() => {
    localStorage.setItem("coda_work_mins", workTime.toString());
    window.dispatchEvent(new Event("coda_timer_updated"));
  }, [workTime]);

  useEffect(() => {
    localStorage.setItem("coda_break_mins", breakTime.toString());
    window.dispatchEvent(new Event("coda_timer_updated"));
  }, [breakTime]);

  // Album display mode
  const [albumDisplayMode, setAlbumDisplayMode] = useState<"cover" | "cd" | "vinyl">(() => {
    return (localStorage.getItem("coda_album_display") as "cover" | "cd" | "vinyl") || "cd";
  });

  useEffect(() => {
    localStorage.setItem("coda_album_display", albumDisplayMode);
    window.dispatchEvent(new Event("coda_album_display_changed"));
  }, [albumDisplayMode]);

  // Profile State
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    return localStorage.getItem("coda_profile_pic");
  });

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Max size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setProfilePic(b64);
      localStorage.setItem("coda_profile_pic", b64);
      window.dispatchEvent(new Event("coda_profile_updated"));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePic = () => {
    setProfilePic(null);
    localStorage.removeItem("coda_profile_pic");
    window.dispatchEvent(new Event("coda_profile_updated"));
  };

  const handleSave = () => {
    // Optional save logic, settings are now auto-saved via useEffect when changed
    // We could add a toast notification here later
    if (onClose) onClose();
  };

  return (
    <div className="w-full h-full flex flex-col pt-2 text-ink">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-ink-muted mt-1">
            Customize your dashboard experience.
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-accent hover:bg-accent-strong text-white px-4 py-2 rounded-xl transition-colors shadow-sm font-medium text-sm"
        >
          <Check size={16} /> Done
        </button>
      </div>

      <div className="flex flex-1 gap-8 min-h-0">
        {/* Settings Sidebar navigation */}
        <div className="w-56 shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-panel-inner text-ink shadow-sm ring-1 ring-border-soft' : 'text-ink-muted hover:bg-panel-inner/50 cursor-pointer'}`}
          >
             <Palette size={18} /> Appearance
          </button>
          <button
            onClick={() => setActiveTab("timer")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'timer' ? 'bg-panel-inner text-ink shadow-sm ring-1 ring-border-soft' : 'text-ink-muted hover:bg-panel-inner/50 cursor-pointer'}`}
          >
             <Timer size={18} /> Timer Presets
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-panel-inner text-ink shadow-sm ring-1 ring-border-soft' : 'text-ink-muted hover:bg-panel-inner/50 cursor-pointer'}`}
          >
             <User size={18} /> Profile
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-panel-inner rounded-[24px] border border-border-soft/60 p-8 overflow-y-auto">
          {activeTab === "appearance" && (
            <div className="space-y-8 animate-[fadeIn_0.3s_ease_forwards]">
              <section>
                <h3 className="text-base font-semibold text-ink mb-4">Color Theme</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setActiveTheme(theme.id)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-[16px] border-2 transition-all ${activeTheme === theme.id ? 'border-accent bg-panel' : 'border-transparent hover:bg-panel bg-panel/40'}`}
                    >
                      <div 
                        className="w-12 h-12 rounded-full shadow-inner ring-1 ring-black/5 flex items-center justify-center text-white/90"
                        style={{ backgroundColor: theme.hex }}
                      >
                         {activeTheme === theme.id && <Check size={20} strokeWidth={3} />}
                      </div>
                      <span className="text-sm font-medium text-ink-secondary">{theme.name}</span>
                    </button>
                  ))}
                  {/* Custom Color Picker */}
                  <button
                    onClick={() => setActiveTheme("custom")}
                    className={`flex flex-col items-center gap-3 p-4 rounded-[16px] border-2 transition-all ${activeTheme === 'custom' ? 'border-accent bg-panel' : 'border-transparent hover:bg-panel bg-panel/40'}`}
                  >
                    <label className="w-12 h-12 rounded-full shadow-inner ring-1 ring-black/5 flex items-center justify-center cursor-pointer relative overflow-hidden"
                      style={{ background: `conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b)` }}
                    >
                      {activeTheme === 'custom' ? (
                        <Check size={20} strokeWidth={3} className="text-white z-10" />
                      ) : (
                        <Pipette size={18} strokeWidth={2} className="text-white z-10" />
                      )}
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => {
                          setCustomColor(e.target.value);
                          localStorage.setItem("coda_custom_color", e.target.value);
                          setActiveTheme("custom");
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                    <span className="text-sm font-medium text-ink-secondary">Custom</span>
                  </button>
                </div>
              </section>

              <div className="h-px bg-border-soft w-full my-6" />

              <section>
                 <h3 className="text-base font-semibold text-ink mb-4">Dark Mode</h3>
                 <div className="flex items-center justify-between p-4 bg-panel rounded-[16px] border border-border-soft/50">
                    <div>
                      <div className="font-medium text-ink">Enable Dark Mode</div>
                      <div className="text-sm text-ink-muted mt-0.5">Switch the entire dashboard to a darker color palette</div>
                    </div>
                    {/* Toggle Switch */}
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`w-12 h-6 rounded-full p-1 border transition-colors flex ${isDarkMode ? 'bg-accent border-accent justify-end' : 'bg-border-soft border-border-soft justify-start'}`}
                    >
                       <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                 </div>
              </section>

              <div className="h-px bg-border-soft w-full my-6" />

              <section>
                 <h3 className="text-base font-semibold text-ink mb-4">Music Player Style</h3>
                 <div className="grid grid-cols-3 gap-4">
                   <button
                     onClick={() => setAlbumDisplayMode("cover")}
                     className={`flex flex-col items-center gap-3 p-5 rounded-[16px] border-2 transition-all cursor-pointer ${albumDisplayMode === 'cover' ? 'border-accent bg-panel shadow-sm' : 'border-border-soft bg-panel-alt hover:bg-panel'}`}
                   >
                     <Image size={28} className="text-ink-muted" />
                     <span className="text-sm font-medium text-ink">Album Cover</span>
                   </button>
                   <button
                     onClick={() => setAlbumDisplayMode("cd")}
                     className={`flex flex-col items-center gap-3 p-5 rounded-[16px] border-2 transition-all cursor-pointer ${albumDisplayMode === 'cd' ? 'border-accent bg-panel shadow-sm' : 'border-border-soft bg-panel-alt hover:bg-panel'}`}
                   >
                     <Disc size={28} className="text-ink-muted" />
                     <span className="text-sm font-medium text-ink">Spinning CD</span>
                   </button>
                   <button
                     onClick={() => setAlbumDisplayMode("vinyl")}
                     className={`flex flex-col items-center gap-3 p-5 rounded-[16px] border-2 transition-all cursor-pointer ${albumDisplayMode === 'vinyl' ? 'border-accent bg-panel shadow-sm' : 'border-border-soft bg-panel-alt hover:bg-panel'}`}
                   >
                     <Disc3 size={28} className="text-ink-muted" />
                     <span className="text-sm font-medium text-ink">Vinyl</span>
                   </button>
                 </div>
              </section>
            </div>
          )}

          {activeTab === "timer" && (
            <div className="space-y-8 animate-[fadeIn_0.3s_ease_forwards]">
               <section>
                <h3 className="text-base font-semibold text-ink mb-4">Timer Presets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                   <button 
                     onClick={() => handleTimerPreset(20, 5)} 
                     className={`p-4 rounded-[16px] border-2 transition-all text-left ${workTime === 20 && breakTime === 5 ? 'border-accent bg-panel shadow-sm' : 'border-border-soft bg-panel-alt hover:bg-panel'}`}
                   >
                     <div className="font-semibold text-ink mb-1">Default</div>
                     <div className="text-sm text-ink-muted">20m Work / 5m Break</div>
                   </button>
                   <button 
                     onClick={() => handleTimerPreset(45, 10)} 
                     className={`p-4 rounded-[16px] border-2 transition-all text-left ${workTime === 45 && breakTime === 10 ? 'border-accent bg-panel shadow-sm' : 'border-border-soft bg-panel-alt hover:bg-panel'}`}
                   >
                     <div className="font-semibold text-ink mb-1">Study</div>
                     <div className="text-sm text-ink-muted">45m Work / 10m Break</div>
                   </button>
                   <button 
                     onClick={() => handleTimerPreset(60, 15)} 
                     className={`p-4 rounded-[16px] border-2 transition-all text-left ${workTime === 60 && breakTime === 15 ? 'border-accent bg-panel shadow-sm' : 'border-border-soft bg-panel-alt hover:bg-panel'}`}
                   >
                     <div className="font-semibold text-ink mb-1">Overkill</div>
                     <div className="text-sm text-ink-muted">1h Work / 15m Break</div>
                   </button>
                   <button 
                     onClick={() => handleTimerPreset(5 / 60, 3 / 60)} 
                     className={`p-4 rounded-[16px] border-2 transition-all text-left ${Math.abs(workTime - (5/60)) < 0.001 && Math.abs(breakTime - (3/60)) < 0.001 ? 'border-accent-strong bg-panel shadow-[0_0_10px_rgba(160,140,200,0.3)]' : 'border-border-soft bg-panel-alt hover:bg-panel'}`}
                   >
                     <div className="font-semibold text-accent-strong flex items-center gap-2">Demo <span className="px-1.5 py-0.5 rounded text-[0.6rem] bg-accent-strong text-white uppercase font-bold">Fast</span></div>
                     <div className="text-sm text-ink-muted">5s Work / 3s Break</div>
                   </button>
                </div>

                <div className="p-5 bg-panel border gap-6 border-border-soft rounded-[20px] shadow-sm flex flex-col md:flex-row items-center justify-between">
                   <div className="flex-1 w-full">
                     <label className="block text-sm font-semibold text-ink mb-2">Custom Work Duration (Minutes)</label>
                     <input type="number" min="1" max="120" value={workTime < 1 ? workTime * 60 : workTime} onChange={(e) => setWorkTime(e.target.valueAsNumber)} className="w-full bg-panel-inner border border-border-soft px-4 py-2.5 rounded-xl outline-none focus:ring-2 ring-accent/50 transition-all font-medium text-ink" />
                     {workTime < 1 && <span className="text-xs text-accent mt-1 block">Displaying in seconds for Demo mode.</span>}
                   </div>
                   <div className="flex-1 w-full">
                     <label className="block text-sm font-semibold text-ink mb-2">Custom Break Duration (Minutes)</label>
                     <input type="number" min="1" max="60" value={breakTime < 1 ? breakTime * 60 : breakTime} onChange={(e) => setBreakTime(e.target.valueAsNumber)} className="w-full bg-panel-inner border border-border-soft px-4 py-2.5 rounded-xl outline-none focus:ring-2 ring-accent/50 transition-all font-medium text-ink" />
                   </div>
                </div>
               </section>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-8 animate-[fadeIn_0.3s_ease_forwards]">
               <section>
                 <h3 className="text-base font-semibold text-ink mb-6">Profile Picture</h3>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-panel border-2 border-border-soft shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                       {profilePic ? (
                         <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                         <User size={36} className="text-ink-muted" />
                       )}
                    </div>
                    <div className="flex flex-col gap-3">
                       <div className="flex flex-wrap items-center gap-3">
                         <label className="bg-ink text-panel px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-ink-secondary transition-colors inline-block">
                           <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleProfileUpload} />
                           <div className="flex items-center gap-2"><Upload size={16} /> Upload New Picture</div>
                         </label>
                         {profilePic && (
                           <button 
                             onClick={handleRemoveProfilePic}
                             className="px-4 py-2 rounded-xl text-sm font-medium text-ink-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                           >
                             Remove
                           </button>
                         )}
                       </div>
                       <p className="text-xs text-ink-faint">Recommended size: 256x256px. Max file size: 2MB.</p>
                    </div>
                 </div>
               </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
