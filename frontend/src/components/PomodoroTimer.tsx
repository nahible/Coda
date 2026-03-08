import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, BellOff } from "lucide-react";
import { fetchSessions, createSession } from "../api/pomodoro";

const WORK_SECS = 5;
const BREAK_SECS = 3;
const WORK_MS = WORK_SECS * 1000;
const BREAK_MS = BREAK_SECS * 1000;
const CIRCUMFERENCE = 2 * Math.PI * 54;

export default function PomodoroTimer() {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [remainingMs, setRemainingMs] = useState(WORK_MS);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const remainingMsRef = useRef(WORK_MS);
  const hasPlayedWarningRef = useRef(false);

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
      alarmRef.current = null;
    }
    setIsAlarmPlaying(false);
  }, []);

  const playAlarm = useCallback(
    (src: string, vol: number = 0.8) => {
      stopAlarm();
      const sound = new Audio(src);
      sound.volume = vol;
      sound.onended = stopAlarm;
      alarmRef.current = sound;
      setIsAlarmPlaying(true);
      sound.play().catch(console.error);
    },
    [stopAlarm],
  );

  useEffect(() => {
    remainingMsRef.current = remainingMs;
  }, [remainingMs]);

  const total = mode === "work" ? WORK_MS : BREAK_MS;
  const pct = remainingMs / total;
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  const switchMode = useCallback((newMode: "work" | "break") => {
    setMode(newMode);
    setRemainingMs(newMode === "work" ? WORK_MS : BREAK_MS);
    hasPlayedWarningRef.current = false;
    setRunning(false);
  }, []);

  // Fetch today's work sessions on mount
  useEffect(() => {
    fetchSessions()
      .then((data) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const todaysWork = data.filter((s) => {
          if (s.session_type !== "work") return false;
          const sessionDate = new Date(s.created_at).setHours(0, 0, 0, 0);
          return sessionDate === today;
        });
        setSessions(todaysWork.length);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (running) {
      endTimeRef.current = Date.now() + remainingMsRef.current;

      const tick = () => {
        if (!endTimeRef.current) {
          return;
        }

        const nextRemainingMs = Math.max(0, endTimeRef.current - Date.now());

        if (
          mode === "work" &&
          !hasPlayedWarningRef.current &&
          nextRemainingMs <= 301000 &&
          nextRemainingMs > 300000
        ) {
          hasPlayedWarningRef.current = true;
          playAlarm(
            "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
            0.7,
          );
        }

        setRemainingMs(nextRemainingMs);

        if (nextRemainingMs > 0) {
          return;
        }

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        endTimeRef.current = null;

        if (mode === "work") {
          setSessions((s) => s + 1);
          createSession(WORK_SECS, "work").catch(console.error);
          playAlarm("/break-over-alarm.wav", 0.8);
          switchMode("break");
        } else {
          createSession(BREAK_SECS, "break").catch(console.error);
          playAlarm("/break-over-alarm.wav", 0.8);
          switchMode("work");
        }
      };

      tick();
      intervalRef.current = setInterval(() => {
        tick();
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, mode, playAlarm, switchMode]);

  function reset() {
    stopAlarm();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
    hasPlayedWarningRef.current = false;

    // If we're resetting a work session that actually had some progress, log it as interrupted
    const remainingSecs = Math.ceil(remainingMsRef.current / 1000);
    if (mode === "work" && remainingSecs < WORK_SECS) {
      createSession(WORK_SECS - remainingSecs, "work", "interrupted").catch(
        console.error,
      );
    }

    setRunning(false);
    setRemainingMs(mode === "work" ? WORK_MS : BREAK_MS);
  }

  const handleToggle = () => {
    stopAlarm();
    if (running && endTimeRef.current) {
      setRemainingMs(Math.max(0, endTimeRef.current - Date.now()));
      endTimeRef.current = null;
    }
    setRunning((prev) => !prev);
  };
  const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div
      className="flex flex-col items-center justify-between h-full w-full @container"
      id="pomodoro-timer"
      style={{ containerType: "size" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full h-[15cqh] max-h-12 min-h-8">
        <h3 className="text-[clamp(0.7rem,3.5cqmin,1rem)] font-semibold text-ink-muted uppercase tracking-widest">
          Pomodoro
        </h3>
        <div className="flex gap-1 bg-panel-inner rounded-full p-[3px]">
          <button
            className={`text-[clamp(0.6rem,3cqmin,0.85rem)] font-medium px-[clamp(0.5rem,3cqw,1rem)] py-1 rounded-full transition-[background-color,color,box-shadow] duration-200 cursor-pointer
              ${mode === "work" ? "bg-accent-muted text-ink shadow-[0_1px_6px_rgba(120,100,160,0.1)]" : "text-ink-faint hover:text-ink-muted"}`}
            onClick={() => switchMode("work")}
            id="pomodoro-work-btn"
          >
            Work
          </button>
          <button
            className={`text-[clamp(0.6rem,3cqmin,0.85rem)] font-medium px-[clamp(0.5rem,3cqw,1rem)] py-1 rounded-full transition-[background-color,color,box-shadow] duration-200 cursor-pointer
              ${mode === "break" ? "bg-accent-muted text-ink shadow-[0_1px_6px_rgba(120,100,160,0.1)]" : "text-ink-faint hover:text-ink-muted"}`}
            onClick={() => switchMode("break")}
            id="pomodoro-break-btn"
          >
            Break
          </button>
        </div>
      </div>

      {/* Ring */}
      <div className="relative w-[clamp(110px,65cqmin,400px)] aspect-square flex items-center justify-center flex-shrink-0 my-auto">
        <svg
          className="rotate-[-90deg] w-full h-full drop-shadow-sm"
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--color-ring-track)"
            strokeWidth={5}
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={
              mode === "work"
                ? "var(--color-ring-work)"
                : "var(--color-ring-break)"
            }
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 100ms linear, stroke 0.3s ease",
            }}
          />
        </svg>
        <div className="absolute text-[clamp(1.5rem,15cqmin,4rem)] font-bold tracking-wider text-ink drop-shadow-sm">
          {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-[clamp(1rem,5cqw,2.5rem)] h-[20cqh] max-h-16 min-h-12 mt-[clamp(1.5rem,10cqh,4rem)] w-full px-4">
        {isAlarmPlaying ? (
          <button
            className="group flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-200/50 transition-[background-color,box-shadow,transform] duration-200 hover:bg-rose-600 active:scale-95"
            onClick={stopAlarm}
          >
            <BellOff size={18} className="group-hover:animate-shake" /> Stop
            Alarm
          </button>
        ) : (
          <>
            <button
              className="flex aspect-square w-[clamp(32px,12cqmin,48px)] items-center justify-center rounded-full text-ink-muted transition-[background-color,color,transform] duration-200 hover:bg-panel-inner hover:text-ink active:scale-95"
              onClick={reset}
              title="Reset"
              id="pomodoro-reset"
            >
              <RotateCcw
                size={18}
                strokeWidth={1.4}
                className="w-[45%] h-[45%]"
              />
            </button>
            <button
              className="flex aspect-square w-[clamp(38px,15cqmin,56px)] shrink-0 items-center justify-center rounded-full bg-accent-strong text-ink-on-accent shadow-[0_3px_12px_rgba(120,100,160,0.18)] transition-[box-shadow,transform] duration-200 hover:shadow-[0_5px_18px_rgba(120,100,160,0.25)] active:scale-95"
              onClick={handleToggle}
              title={running ? "Pause" : "Start"}
              id="pomodoro-play"
            >
              {running ? (
                <Pause strokeWidth={1.4} className="w-[45%] h-[45%]" />
              ) : (
                <Play strokeWidth={1.4} className="w-[45%] h-[45%] ml-[2px]" />
              )}
            </button>
            <div
              className="w-[clamp(32px,12cqmin,48px)] aspect-square opacity-0 pointer-events-none"
              aria-hidden="true"
            />
          </>
        )}
      </div>

      {/* Sessions — stays at bottom */}
      <div className="text-[clamp(0.6rem,3cqmin,0.8rem)] text-ink-faint flex items-center gap-3 mt-2 h-[10cqh] max-h-8 min-h-6">
        Sessions completed
        <span className="bg-tag-bg px-2.5 py-0.5 rounded-full font-semibold text-ink-secondary text-[clamp(0.6rem,3cqmin,0.8rem)]">
          {sessions}
        </span>
      </div>
    </div>
  );
}
