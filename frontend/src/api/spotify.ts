const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

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
  window.location.href = `${API_BASE}/spotify/auth`;
}

/**
 * Checks if the current user has connected their Spotify account.
 */
export async function fetchSpotifyStatus(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/spotify/status`, {
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
  const res = await fetch(`${API_BASE}/spotify/now-playing`, {
    credentials: "include",
  });
  
  if (res.status === 204) return null; // No active device playing
  if (!res.ok) throw new Error("Failed to fetch currently playing track");
  
  return res.json();
}

/** Play Spotify */
export async function playSpotify() {
  await fetch(`${API_BASE}/spotify/play`, {
    method: "POST",
    credentials: "include",
  });
}

/** Pause Spotify */
export async function pauseSpotify() {
  await fetch(`${API_BASE}/spotify/pause`, {
    method: "POST",
    credentials: "include",
  });
}

/** Skip to Next Track */
export async function skipNextSpotify() {
  await fetch(`${API_BASE}/spotify/next`, {
    method: "POST",
    credentials: "include",
  });
}

/** Skip to Previous Track */
export async function skipPrevSpotify() {
  await fetch(`${API_BASE}/spotify/previous`, {
    method: "POST",
    credentials: "include",
  });
}
