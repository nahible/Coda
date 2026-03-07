const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";
const SPOTIFY_API_BASE = `${API_BASE}/auth/spotify`;

export interface SpotifyTrack {
  title: string;
  artist: string;
  duration_ms: number;
  progress_ms: number;
  is_playing: boolean;
  album_image_url: string;
}

/**
 * Redirects the user to the backend to start the Spotify OAuth flow.
 */
export function connectSpotify(): void {
  window.location.href = `${SPOTIFY_API_BASE}/auth`;
}

/**
 * Checks if the current user has connected their Spotify account.
 */
export async function fetchSpotifyStatus(): Promise<boolean> {
  const res = await fetch(`${SPOTIFY_API_BASE}/status`, {
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.connected === true;
}

/**
 * Gets the track currently playing on the user's Spotify account.
 */
export async function fetchNowPlaying(): Promise<SpotifyTrack | null> {
  const res = await fetch(`${SPOTIFY_API_BASE}/now-playing`, {
    credentials: "include",
  });
  
  if (res.status === 204) return null; // No active device playing
  if (!res.ok) throw new Error("Failed to fetch currently playing track");
  
  return res.json();
}

/** Play Spotify */
export async function playSpotify() {
  await fetch(`${SPOTIFY_API_BASE}/play`, {
    method: "POST",
    credentials: "include",
  });
}

/** Pause Spotify */
export async function pauseSpotify() {
  await fetch(`${SPOTIFY_API_BASE}/pause`, {
    method: "POST",
    credentials: "include",
  });
}

/** Skip to Next Track */
export async function skipNextSpotify() {
  await fetch(`${SPOTIFY_API_BASE}/next`, {
    method: "POST",
    credentials: "include",
  });
}

/** Skip to Previous Track */
export async function skipPrevSpotify() {
  await fetch(`${SPOTIFY_API_BASE}/previous`, {
    method: "POST",
    credentials: "include",
  });
}
