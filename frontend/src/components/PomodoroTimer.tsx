import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const WORK_SECS = 25 * 60;
const BREAK_SECS = 5 * 60;
const CIRCUMFERENCE = 2 * Math.PI * 54;

export default function PomodoroTimer() {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [remaining, setRemaining] = useState(WORK_SECS);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = mode === 'work' ? WORK_SECS : BREAK_SECS;
  const pct = remaining / total;
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  const switchMode = useCallback((newMode: 'work' | 'break') => {
    setMode(newMode);
    setRemaining(newMode === 'work' ? WORK_SECS : BREAK_SECS);
    setRunning(false);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (mode === 'work') { setSessions((s) => s + 1); switchMode('break'); }
            else { switchMode('work'); }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) { clearInterval(intervalRef.current); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, switchMode]);

  function reset() { setRunning(false); setRemaining(mode === 'work' ? WORK_SECS : BREAK_SECS); }
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div
      className="flex flex-col items-center justify-between h-full"
      id="pomodoro-timer"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h3 className="text-[0.78rem] font-semibold text-ink-muted uppercase tracking-widest">
          Pomodoro
        </h3>
        <div className="flex gap-1 bg-panel-inner rounded-full p-[3px]">
          <button
            className={`text-[0.68rem] font-medium px-3 py-1 rounded-full transition-all duration-200 cursor-pointer
              ${mode === 'work' ? 'bg-accent-muted text-ink shadow-[0_1px_6px_rgba(120,100,160,0.1)]' : 'text-ink-faint hover:text-ink-muted'}`}
            onClick={() => switchMode('work')} id="pomodoro-work-btn"
          >Work</button>
          <button
            className={`text-[0.68rem] font-medium px-3 py-1 rounded-full transition-all duration-200 cursor-pointer
              ${mode === 'break' ? 'bg-accent-muted text-ink shadow-[0_1px_6px_rgba(120,100,160,0.1)]' : 'text-ink-faint hover:text-ink-muted'}`}
            onClick={() => switchMode('break')} id="pomodoro-break-btn"
          >Break</button>
        </div>
      </div>

      {/* Ring */}
      <div className="relative w-[130px] h-[130px] flex items-center justify-center flex-shrink-0">
        <svg className="rotate-[-90deg] w-[130px] h-[130px]" viewBox="0 0 120 120">
          <circle className="ring-track" cx="60" cy="60" r="54" />
          <circle
            className="ring-progress"
            cx="60" cy="60" r="54"
            stroke={mode === 'work' ? 'var(--color-ring-work)' : 'var(--color-ring-break)'}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute text-[1.7rem] font-bold tracking-wider text-ink">
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button className="w-10 h-10 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-panel-inner transition-all duration-200 cursor-pointer" onClick={reset} title="Reset" id="pomodoro-reset">
          <RotateCcw size={16} strokeWidth={1.4} />
        </button>
        <button className="w-12 h-12 flex items-center justify-center rounded-full bg-accent-strong text-ink-on-accent shadow-[0_3px_12px_rgba(120,100,160,0.18)] hover:shadow-[0_5px_18px_rgba(120,100,160,0.25)] transition-all duration-200 cursor-pointer" onClick={() => setRunning(!running)} title={running ? 'Pause' : 'Start'} id="pomodoro-play">
          {running ? <Pause size={18} strokeWidth={1.4} /> : <Play size={18} strokeWidth={1.4} />}
        </button>
      </div>

      {/* Sessions — stays at bottom */}
      <div className="text-[0.7rem] text-ink-faint flex items-center gap-3">
        Sessions completed
        <span className="bg-tag-bg px-2.5 py-0.5 rounded-full font-semibold text-ink-secondary text-[0.68rem]">{sessions}</span>
      </div>
    </div>
  );
}
