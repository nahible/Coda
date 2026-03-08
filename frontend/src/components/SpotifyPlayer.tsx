import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';

interface Track {
  title: string;
  artist: string;
  duration: number;
}

const mockPlaylist: Track[] = [
  { title: 'Blinding Lights', artist: 'The Weeknd', duration: 200 },
  { title: 'Starboy', artist: 'The Weeknd', duration: 230 },
  { title: 'Levitating', artist: 'Dua Lipa', duration: 203 },
  { title: 'Save Your Tears', artist: 'The Weeknd', duration: 216 },
];

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function SpotifyPlayer() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const track = mockPlaylist[trackIdx];

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= track.duration - 1) {
            skipNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, trackIdx]);

  function skipNext() {
    setTrackIdx((index) => (index + 1) % mockPlaylist.length);
    setElapsed(0);
  }

  function skipPrev() {
    if (elapsed > 3) {
      setElapsed(0);
      return;
    }

    setTrackIdx((index) => (index - 1 + mockPlaylist.length) % mockPlaylist.length);
    setElapsed(0);
  }

  const pct = (elapsed / track.duration) * 100;

  return (
    <div className="flex flex-col justify-between h-full" id="spotify-player">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[0.78rem] font-semibold text-ink-muted uppercase tracking-widest">
          Now Playing
        </h3>
        <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-green-dot px-3 py-1 rounded-full bg-[rgba(142,207,160,0.12)]">
          <span className="w-[5px] h-[5px] rounded-full bg-green-dot animate-[pulse_2s_ease_infinite]" />
          Spotify
        </div>
      </div>

      {/* Track */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-accent-strong to-accent-muted flex items-center justify-center text-ink-on-accent shrink-0 shadow-[0_4px_16px_rgba(120,100,160,0.15)]">
          <Music size={22} strokeWidth={1.4} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[0.92rem] font-semibold text-ink truncate">{track.title}</div>
          <div className="text-[0.76rem] text-ink-muted mt-1.5 truncate">{track.artist}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2 pb-5">
        <div
          className="w-full h-[5px] bg-panel-inner rounded-full overflow-hidden cursor-pointer"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setElapsed(Math.floor(((event.clientX - rect.left) / rect.width) * track.duration));
          }}
        >
          <div
            className="h-full bg-accent-strong rounded-full transition-[width] duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[0.65rem] text-ink-faint">
          <span>{fmt(elapsed)}</span>
          <span>{fmt(track.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-panel-inner transition-all duration-200 cursor-pointer"
          onClick={skipPrev}
          id="spotify-prev"
          title="Previous"
        >
          <SkipBack size={17} strokeWidth={1.4} />
        </button>
        <button
          className="w-12 h-12 flex items-center justify-center rounded-full bg-accent-strong text-ink-on-accent shadow-[0_3px_12px_rgba(120,100,160,0.18)] hover:shadow-[0_5px_18px_rgba(120,100,160,0.25)] transition-all duration-200 cursor-pointer"
          onClick={() => setPlaying(!playing)}
          id="spotify-play"
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={18} strokeWidth={1.4} /> : <Play size={18} strokeWidth={1.4} />}
        </button>
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-panel-inner transition-all duration-200 cursor-pointer"
          onClick={skipNext}
          id="spotify-next"
          title="Next"
        >
          <SkipForward size={17} strokeWidth={1.4} />
        </button>
      </div>
    </div>
  );
}
