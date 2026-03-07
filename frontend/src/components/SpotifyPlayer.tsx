import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  connectSpotify,
  fetchSpotifyStatus,
  fetchNowPlaying,
  playSpotify,
  pauseSpotify,
  skipNextSpotify,
  skipPrevSpotify,
  type SpotifyTrack
} from '../api/spotify';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function SpotifyPlayer() {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [localProgress, setLocalProgress] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Check if Spotify is connected on mount
  useEffect(() => {
    if (!token) return;
    fetchSpotifyStatus(token).then(setIsConnected).catch(() => setIsConnected(false));
  }, [token]);

  // 2. Poll for currently playing track every 3 seconds if connected
  useEffect(() => {
    if (isConnected && token) {
      const poll = () => {
        fetchNowPlaying(token)
          .then((t) => {
            setTrack(t);
            if (t) setLocalProgress(t.progress_ms / 1000); // Sync local progress tracker
          })
          .catch(console.error);
      };

      poll(); // Fetch immediately
      pollIntervalRef.current = setInterval(poll, 3000); // Polling every 3s
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isConnected, token]);

  // 3. Local tick to advance progress bar smoothly between network polls
  useEffect(() => {
    if (track?.is_playing) {
      localTickRef.current = setInterval(() => {
        setLocalProgress((prev) => Math.min(prev + 1, track.duration_ms / 1000));
      }, 1000);
    } else if (localTickRef.current) {
      clearInterval(localTickRef.current);
    }
    return () => {
      if (localTickRef.current) clearInterval(localTickRef.current);
    };
  }, [track?.is_playing, track?.duration_ms]);

  // User Actions
  const handlePlayPause = async () => {
    if (!token || !track) return;
    try {
      if (track.is_playing) {
        setTrack({ ...track, is_playing: false }); // Optimistic UI update
        await pauseSpotify(token);
      } else {
        setTrack({ ...track, is_playing: true });
        await playSpotify(token);
      }
    } catch (e) {
      console.error(e);
      setTrack(track); // Revert on failure
    }
  };

  const handleSkipNext = async () => {
    if (!token) return;
    await skipNextSpotify(token);
    setTimeout(() => { if (token) fetchNowPlaying(token).then(setTrack); }, 500); // Update after skip
  };

  const handleSkipPrev = async () => {
    if (!token) return;
    await skipPrevSpotify(token);
    setTimeout(() => { if (token) fetchNowPlaying(token).then(setTrack); }, 500);
  };

  if (isConnected === null) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-ink-muted text-sm gap-3">
        <div className="w-5 h-5 border-2 border-accent-strong border-t-transparent rounded-full animate-spin" />
        Checking Spotify Connection...
      </div>
    );
  }

  if (isConnected === false) {
    return (
      <div className="flex flex-col justify-center items-center h-full gap-5">
        <div className="w-14 h-14 rounded-[16px] bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954] shrink-0 shadow-[0_4px_16px_rgba(29,185,84,0.15)]">
          <Music size={26} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-ink text-base">Spotify Integration</h3>
          <p className="text-ink-muted text-[0.8rem] mt-1 max-w-[200px]">Connect your account to control music directly from Coda.</p>
        </div>
        <button
          onClick={connectSpotify}
          className="bg-[#1DB954] hover:bg-[#1ed760] text-white text-[0.85rem] font-semibold py-2 px-6 rounded-full shadow-[0_4px_12px_rgba(29,185,84,0.3)] transition-all hover:-translate-y-0.5"
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  const durationSecs = track ? track.duration_ms / 1000 : 0;
  const pct = durationSecs > 0 ? (localProgress / durationSecs) * 100 : 0;

  return (
    <div className="flex flex-col justify-between h-full" id="spotify-player">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[0.78rem] font-semibold text-ink-muted uppercase tracking-widest">
          Now Playing
        </h3>
        <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-[#1DB954] px-3 py-1 rounded-full bg-[rgba(29,185,84,0.12)]">
          {track && track.is_playing && <span className="w-[5px] h-[5px] bg-[#1DB954] rounded-full anim-pulse" />}
          Spotify
        </div>
      </div>

      {/* Track */}
      {track ? (
        <div className="flex items-center gap-4">
          {track.album_image_url ? (
             <img src={track.album_image_url} alt="Album Art" className="w-14 h-14 rounded-[12px] object-cover shadow-[0_4px_16px_rgba(0,0,0,0.1)]" />
          ) : (
            <div className="w-14 h-14 rounded-[12px] bg-gradient-to-br from-[#1DB954] to-[#1ed760] flex items-center justify-center text-white shrink-0 shadow-[0_4px_16px_rgba(29,185,84,0.2)]">
              <Music size={22} strokeWidth={1.4} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[0.92rem] font-semibold text-ink truncate">{track.title}</div>
            <div className="text-[0.76rem] text-ink-muted mt-1.5 truncate">{track.artist}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 py-2">
          <div className="w-14 h-14 rounded-[12px] bg-panel-inner flex items-center justify-center text-ink-muted shrink-0">
            <Music size={22} strokeWidth={1.4} />
          </div>
          <div className="flex-1 min-w-0 text-ink-muted text-sm italic">
            Nothing is playing on Spotify...
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="flex flex-col gap-2 pb-5">
        <div className="w-full h-[5px] bg-panel-inner rounded-full overflow-hidden">
          <div className="h-full bg-accent-strong rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
        </div>
        <div className="flex justify-between text-[0.65rem] text-ink-faint">
          <span>{fmt(localProgress)}</span>
          <span>{fmt(durationSecs)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-panel-inner transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSkipPrev}
          disabled={!track}
          id="spotify-prev"
          title="Previous"
        >
          <SkipBack size={17} strokeWidth={1.4} />
        </button>
        <button
          className="w-12 h-12 flex items-center justify-center rounded-full bg-accent-strong text-ink-on-accent shadow-[0_3px_12px_rgba(120,100,160,0.18)] hover:shadow-[0_5px_18px_rgba(120,100,160,0.25)] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handlePlayPause}
          disabled={!track}
          id="spotify-play"
          title={track?.is_playing ? 'Pause' : 'Play'}
        >
          {track?.is_playing ? <Pause size={18} strokeWidth={1.4} /> : <Play size={18} strokeWidth={1.4} />}
        </button>
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-panel-inner transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSkipNext}
          disabled={!track}
          id="spotify-next"
          title="Next"
        >
          <SkipForward size={17} strokeWidth={1.4} />
        </button>
      </div>
    </div>
  );
}
