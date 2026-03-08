import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Music } from "lucide-react";
import {
  connectSpotify,
  fetchSpotifyStatus,
  fetchNowPlaying,
  playSpotify,
  pauseSpotify,
  skipNextSpotify,
  skipPrevSpotify,
  type SpotifyTrack,
} from "../api/spotify";
import { FastAverageColor } from "fast-average-color";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SpotifyPlayer() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [localProgress, setLocalProgress] = useState(0);
  const [isShortLayout, setIsShortLayout] = useState(false);
  const [albumColor, setAlbumColor] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Extract dominant color from album artwork
  useEffect(() => {
    if (track?.album_image_url) {
      const fac = new FastAverageColor();
      fac
        .getColorAsync(track.album_image_url, { crossOrigin: "anonymous" })
        .then((color) => {
          setAlbumColor(color.hex);
        })
        .catch((e) => {
          console.warn("Could not extract album color:", e);
          setAlbumColor(null);
        });
    } else {
      setAlbumColor(null);
    }
  }, [track?.album_image_url]);

  // 0. Resize Observer for dynamic "banner" layout mode
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsShortLayout(entry.contentRect.height < 240);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 1. Check if Spotify is connected on mount
  useEffect(() => {
    fetchSpotifyStatus()
      .then(setIsConnected)
      .catch(() => setIsConnected(false));
  }, []);

  // 2. Poll for currently playing track every 3 seconds if connected
  useEffect(() => {
    if (isConnected) {
      const poll = () => {
        fetchNowPlaying()
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
  }, [isConnected]);

  // 3. Local tick to advance progress bar smoothly between network polls
  useEffect(() => {
    if (track?.is_playing) {
      localTickRef.current = setInterval(() => {
        setLocalProgress((prev) =>
          Math.min(prev + 1, track.duration_ms / 1000),
        );
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
    if (!track) return;
    try {
      if (track.is_playing) {
        setTrack({ ...track, is_playing: false }); // Optimistic UI update
        await pauseSpotify();
      } else {
        setTrack({ ...track, is_playing: true });
        await playSpotify();
      }
    } catch (e) {
      console.error(e);
      setTrack(track); // Revert on failure
    }
  };

  const handleSkipNext = async () => {
    await skipNextSpotify();
    setTimeout(() => {
      fetchNowPlaying().then(setTrack);
    }, 500); // Update after skip
  };

  const handleSkipPrev = async () => {
    await skipPrevSpotify();
    setTimeout(() => {
      fetchNowPlaying().then(setTrack);
    }, 500);
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
          <h3 className="font-semibold text-ink text-base">Spotify</h3>
          <p className="text-ink-muted text-[0.8rem] mt-1 max-w-[200px]">
            Connect your account to control music directly from Coda.
          </p>
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
    <>
      {/* Blurred Album Background Overlay */}
      {track?.album_image_url && (
        <div
          className="absolute inset-[-24px] z-0 bg-cover bg-center blur-2xl opacity-[0.22] saturate-[1.5] pointer-events-none transition-all duration-[2s] ease-in-out"
          style={{ backgroundImage: `url(${track.album_image_url})` }}
        />
      )}

      <div
        ref={containerRef}
        className="relative z-10 flex flex-col justify-center gap-3 h-full @container"
        id="spotify-player"
        style={{ containerType: "size" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-[0.78rem] font-semibold text-ink-muted uppercase tracking-widest drop-shadow-sm">
            Now Playing
          </h3>
          <div className="flex items-center justify-center gap-3 px-8 py-3.5 shrink-0 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20 shadow-sm backdrop-blur-md">
            {track && track.is_playing ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1DB954]"></span>
              </span>
            ) : null}
            <span className="text-[0.65rem] font-bold text-[#14833b] lowercase tracking-widest block leading-none shrink-0">
              spotify
            </span>
          </div>
        </div>

        {/* Track */}
        {track ? (
          <div
            className={`flex-1 min-h-[0px] w-full flex items-center justify-start gap-[clamp(1.5rem,5cqw,2.5rem)] py-[clamp(1rem,4cqh,2.5rem)] overflow-hidden ${isShortLayout ? "pr-4" : ""}`}
          >
            {!isShortLayout &&
              (track.album_image_url ? (
                <img
                  src={track.album_image_url}
                  alt="Album Art"
                  className="h-full max-w-[40%] aspect-square rounded-[clamp(1rem,2.5cqmin,1.5rem)] object-cover shadow-[0_12px_32px_rgba(0,0,0,0.2)] ring-[1.5px] ring-white/40 transition-transform duration-500 hover:scale-[1.03] shrink-0"
                />
              ) : (
                <div className="h-full max-w-[40%] aspect-square rounded-[clamp(1rem,2.5cqmin,1.5rem)] bg-gradient-to-br from-[#1DB954] to-[#1ed760] flex items-center justify-center text-white shrink-0 shadow-[0_12px_32px_rgba(29,185,84,0.3)] ring-[1.5px] ring-white/40">
                  <Music size={48} strokeWidth={1.4} />
                </div>
              ))}
            <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
              <div className="text-[clamp(1.2rem,6cqw,3rem)] font-extrabold text-ink truncate drop-shadow-sm leading-tight tracking-tight">
                {track.title}
              </div>
              <div className="text-[clamp(0.9rem,3.5cqw,1.6rem)] font-semibold text-ink-muted/90 mt-[clamp(0.1rem,1cqh,0.5rem)] truncate drop-shadow-sm">
                {track.artist}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-[0px] w-full flex items-center justify-start gap-[clamp(1.5rem,5cqw,2.5rem)] py-[clamp(1rem,4cqh,2.5rem)] overflow-hidden">
            {!isShortLayout && (
              <div className="h-full max-w-[40%] aspect-square rounded-[clamp(1rem,2.5cqmin,1.5rem)] bg-white/40 border border-white/40 backdrop-blur-md flex items-center justify-center text-ink-muted/60 shrink-0 shadow-inner">
                <Music size={48} strokeWidth={1.4} />
              </div>
            )}
            <div className="flex-1 min-w-0 text-ink-muted text-[clamp(0.9rem,3.5cqw,1.6rem)] italic font-medium">
              Nothing is playing on Spotify...
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="flex flex-col gap-2 flex-shrink-0 max-h-min mt-1 relative z-20">
          <div className="w-full h-[6px] bg-black/5 rounded-full overflow-hidden shadow-inner border border-white/20 backdrop-blur-sm">
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ease-linear relative overflow-hidden ${!albumColor ? "bg-gradient-to-r from-accent-strong to-accent" : ""}`}
              style={{
                width: `${Math.min(100, Math.max(0, pct))}%`,
                backgroundColor: albumColor || undefined,
              }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30" />
            </div>
          </div>
          <div className="flex justify-between text-[0.65rem] font-medium text-ink-faint">
            <span>{fmt(localProgress)}</span>
            <span>{fmt(durationSecs)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-7 flex-shrink-0 relative z-20 pb-2">
          <button
            className="w-[clamp(32px,10cqh,40px)] h-[clamp(32px,10cqh,40px)] flex items-center justify-center rounded-full hover:bg-white/40 hover:shadow-sm border border-transparent hover:border-white/40 backdrop-blur-sm transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transform active:scale-95"
            onClick={handleSkipPrev}
            disabled={!track}
            id="spotify-prev"
            title="Previous"
            style={{ color: albumColor || "currentColor" }}
          >
            <SkipBack size={18} strokeWidth={1.6} />
          </button>

          <button
            className={`w-[clamp(40px,15cqh,52px)] h-[clamp(40px,15cqh,52px)] flex items-center justify-center rounded-full text-white shadow-[0_8px_20px_rgba(168,153,202,0.35)] ring-1 ring-white/50 hover:shadow-[0_12px_28px_rgba(168,153,202,0.5)] transform hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${!albumColor ? "bg-gradient-to-br from-accent-strong to-accent" : ""}`}
            onClick={handlePlayPause}
            disabled={!track}
            id="spotify-play"
            title={track?.is_playing ? "Pause" : "Play"}
            style={
              albumColor
                ? {
                    backgroundColor: albumColor,
                    boxShadow: `0 8px 20px ${albumColor}60`,
                  }
                : undefined
            }
          >
            {track?.is_playing ? (
              <Pause size={22} strokeWidth={1.6} className="fill-current" />
            ) : (
              <Play
                size={22}
                strokeWidth={1.6}
                className="fill-current ml-0.5"
              />
            )}
          </button>

          <button
            className="w-[clamp(32px,10cqh,40px)] h-[clamp(32px,10cqh,40px)] flex items-center justify-center rounded-full hover:bg-white/40 hover:shadow-sm border border-transparent hover:border-white/40 backdrop-blur-sm transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transform active:scale-95"
            onClick={handleSkipNext}
            disabled={!track}
            id="spotify-next"
            title="Next"
            style={{ color: albumColor || "currentColor" }}
          >
            <SkipForward size={18} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </>
  );
}
