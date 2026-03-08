import React, { useState, useEffect } from "react";
import { User, Palette, Timer, Upload, Check } from "lucide-react";

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

  // Apply Appearance instantly
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);
    localStorage.setItem("coda_theme", activeTheme);
  }, [activeTheme]);

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
