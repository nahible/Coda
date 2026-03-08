import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, BellOff } from 'lucide-react';
import { fetchSessions, createSession } from '../api/pomodoro';

const WORK_SECS = 5;
const BREAK_SECS = 3;
const CIRCUMFERENCE = 2 * Math.PI * 54;

export default function PomodoroTimer() {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [remaining, setRemaining] = useState(WORK_SECS);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
      alarmRef.current = null;
    }
    setIsAlarmPlaying(false);
  }, []);

  const playAlarm = useCallback((src: string, vol: number = 0.8) => {
    stopAlarm();
    const sound = new Audio(src);
    sound.volume = vol;
    sound.onended = stopAlarm;
    alarmRef.current = sound;
    setIsAlarmPlaying(true);
    sound.play().catch(console.error);
  }, [stopAlarm]);

  const total = mode === 'work' ? WORK_SECS : BREAK_SECS;
  const pct = remaining / total;
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  const switchMode = useCallback((newMode: 'work' | 'break') => {
    setMode(newMode);
    setRemaining(newMode === 'work' ? WORK_SECS : BREAK_SECS);
    setRunning(false);
  }, []);

  // Fetch today's work sessions on mount
  useEffect(() => {
    fetchSessions().then((data) => {
      const today = new Date().setHours(0, 0, 0, 0);
      const todaysWork = data.filter((s) => {
        if (s.session_type !== 'work') return false;
        const sessionDate = new Date(s.created_at).setHours(0, 0, 0, 0);
        return sessionDate === today;
      });
      setSessions(todaysWork.length);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (mode === 'work') {
              setSessions((s) => s + 1);
              createSession(WORK_SECS, 'work').catch(console.error); // Save to DB
              playAlarm('/break-over-alarm.wav', 0.8);
              switchMode('break');
            }
            else {
              createSession(BREAK_SECS, 'break').catch(console.error); // Save break too
              playAlarm('/break-over-alarm.wav', 0.8);
              switchMode('work');
            }
            return 0;
          }
          if (mode === 'work' && prev === 301) {
            // Trigger 5-minute warning chime
            playAlarm('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg', 0.7);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) { clearInterval(intervalRef.current); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, switchMode]);

  function reset() {
    stopAlarm();
    if (intervalRef.current) clearInterval(intervalRef.current);

    // If we're resetting a work session that actually had some progress, log it as interrupted
    if (mode === 'work' && remaining < WORK_SECS) {
      createSession(WORK_SECS - remaining, 'work', 'interrupted').catch(console.error);
    }

    setRunning(false);
    setRemaining(mode === 'work' ? WORK_SECS : BREAK_SECS);
  }

  const handleToggle = () => {
    stopAlarm();
    setRunning(!running);
  };
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div
      className="flex flex-col items-center justify-between h-full w-full @container"
      id="pomodoro-timer"
      style={{ containerType: 'size' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full h-[15cqh] max-h-12 min-h-8">
        <h3 className="text-[clamp(0.7rem,3.5cqmin,1rem)] font-semibold text-ink-muted uppercase tracking-widest">
          Pomodoro
        </h3>
        <div className="flex gap-1 bg-panel-inner rounded-full p-[3px]">
          <button
            className={`text-[clamp(0.6rem,3cqmin,0.85rem)] font-medium px-[clamp(0.5rem,3cqw,1rem)] py-1 rounded-full transition-all duration-200 cursor-pointer
              ${mode === 'work' ? 'bg-accent-muted text-ink shadow-[0_1px_6px_rgba(120,100,160,0.1)]' : 'text-ink-faint hover:text-ink-muted'}`}
            onClick={() => switchMode('work')} id="pomodoro-work-btn"
          >Work</button>
          <button
            className={`text-[clamp(0.6rem,3cqmin,0.85rem)] font-medium px-[clamp(0.5rem,3cqw,1rem)] py-1 rounded-full transition-all duration-200 cursor-pointer
              ${mode === 'break' ? 'bg-accent-muted text-ink shadow-[0_1px_6px_rgba(120,100,160,0.1)]' : 'text-ink-faint hover:text-ink-muted'}`}
            onClick={() => switchMode('break')} id="pomodoro-break-btn"
          >Break</button>
        </div>
      </div>

      {/* Ring */}
      <div className="relative w-[clamp(110px,65cqmin,400px)] aspect-square flex items-center justify-center flex-shrink-0 my-auto">
        <svg className="rotate-[-90deg] w-full h-full drop-shadow-sm" viewBox="0 0 120 120">
          <circle className="ring-track" cx="60" cy="60" r="54" />
          <circle
            className="ring-progress"
            cx="60" cy="60" r="54"
            stroke={mode === 'work' ? 'var(--color-ring-work)' : 'var(--color-ring-break)'}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute text-[clamp(1.5rem,15cqmin,4rem)] font-bold tracking-wider text-ink drop-shadow-sm">
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-[clamp(1rem,5cqw,2.5rem)] h-[20cqh] max-h-16 min-h-12 mt-[clamp(1.5rem,10cqh,4rem)] w-full px-4">
        {isAlarmPlaying ? (
          <button
            className="w-full h-full max-h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-rose-200/50 transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer group"
            onClick={stopAlarm}
          >
            <BellOff size={18} className="group-hover:animate-shake" /> Stop Alarm
          </button>
        ) : (
          <>
            <button className="w-[clamp(32px,12cqmin,48px)] aspect-square flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-panel-inner transition-all duration-200 cursor-pointer transform active:scale-95" onClick={reset} title="Reset" id="pomodoro-reset">
              <RotateCcw size={18} strokeWidth={1.4} className="w-[45%] h-[45%]" />
            </button>
            <button className="w-[clamp(38px,15cqmin,56px)] aspect-square flex items-center justify-center rounded-full bg-accent-strong text-ink-on-accent shadow-[0_3px_12px_rgba(120,100,160,0.18)] hover:shadow-[0_5px_18px_rgba(120,100,160,0.25)] transition-all duration-200 cursor-pointer transform active:scale-95 shrink-0" onClick={handleToggle} title={running ? 'Pause' : 'Start'} id="pomodoro-play">
              {running ? <Pause strokeWidth={1.4} className="w-[45%] h-[45%]" /> : <Play strokeWidth={1.4} className="w-[45%] h-[45%] ml-[2px]" />}
            </button>
            <div className="w-[clamp(32px,12cqmin,48px)] aspect-square opacity-0 pointer-events-none" aria-hidden="true" />
          </>
        )}
      </div>

      {/* Sessions — stays at bottom */}
      <div className="text-[clamp(0.6rem,3cqmin,0.8rem)] text-ink-faint flex items-center gap-3 mt-2 h-[10cqh] max-h-8 min-h-6">
        Sessions completed
        <span className="bg-tag-bg px-2.5 py-0.5 rounded-full font-semibold text-ink-secondary text-[clamp(0.6rem,3cqmin,0.8rem)]">{sessions}</span>
      </div>
    </div>
  );
}
