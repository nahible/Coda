import { Router, Request, Response } from "express";
import { getSessionUserId } from "../lib/session.js";
import {
  upsertSpotifyTokens,
  getSpotifyTokens,
  updateSpotifyAccessToken,
} from "../lib/spotifyTokens.js";

const router = Router();
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI || "http://localhost:5001/spotify/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Helper: Ensure the user is logged in
 */
const requireAuth = (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
};

/**
 * Helper: Gets a valid Spotify access token, refreshing it if expired.
 */
const getValidAccessToken = async (userId: number): Promise<string | null> => {
  const { data: tokens, error } = await getSpotifyTokens(userId);

  if (error || !tokens) return null;

  const expiresAt = new Date(tokens.expires_at).getTime();
  const now = Date.now();

  // If token is still valid (with a 5-minute buffer)
  if (expiresAt > now + 5 * 60 * 1000) {
    return tokens.access_token;
  }

  // Token is expired, refresh it
  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    });

    const basicAuth = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const refreshRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: params,
    });

    const data = await refreshRes.json();

    if (!refreshRes.ok || !data.access_token) {
      console.error("Failed to refresh Spotify token:", data);
      return null;
    }

    // Update in DB (sometimes Spotify returns a new refresh_token, sometimes not)
    if (data.refresh_token) {
      await upsertSpotifyTokens(
        userId,
        data.access_token,
        data.refresh_token,
        data.expires_in
      );
    } else {
      await updateSpotifyAccessToken(userId, data.access_token, data.expires_in);
    }

    return data.access_token;
  } catch (err) {
    console.error("Error refreshing Spotify token:", err);
    return null;
  }
};

// ==========================================
// OAuth Flow
// ==========================================

import crypto from "crypto";
// Temporary store to cross the localhost -> 127.0.0.1 domain gap.
// Maps a random state string -> userId
const authStateMap = new Map<string, number>();

// 1. Redirect to Spotify Auth
router.get("/auth", (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const scope = "user-read-currently-playing user-modify-playback-state";
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  
  // Generate a random state so we can securely track the user across the domain gap
  const state = crypto.randomUUID();
  authStateMap.set(state, userId);

  authUrl.searchParams.set("client_id", SPOTIFY_CLIENT_ID!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  res.redirect(authUrl.toString());
});

// 2. Spotify Auth Callback
router.get("/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  
  if (!code || !state) {
    res.status(400).send("No code or state provided.");
    return;
  }

  // Retrieve user ID from the state map and delete it
  const userId = authStateMap.get(state);
  if (!userId) {
    res.status(401).send("Invalid or expired authentication state. Please try logging in again.");
    return;
  }
  authStateMap.delete(state);

  try {
    const basicAuth = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Spotify token error:", tokens);
      res.redirect(`${FRONTEND_URL}?spotify_error=true`);
      return;
    }

    await upsertSpotifyTokens(
      userId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in
    );

    res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error("Callback error:", err);
    res.status(500).send("Authentication failed");
  }
});

// 3. Status (Check if connected)
router.get("/status", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const token = await getValidAccessToken(userId);
  res.json({ connected: !!token });
});

// ==========================================
// Proxy Endpoints
// ==========================================

router.get("/now-playing", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const token = await getValidAccessToken(userId);
  if (!token) {
    res.status(403).json({ error: "Spotify not connected or token expired" });
    return;
  }

  const spotifyRes = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (spotifyRes.status === 204 || spotifyRes.status > 400) {
    res.status(204).send(); // Nothing playing
    return;
  }

  const data = await spotifyRes.json();
  if (!data?.item) {
    res.status(204).send();
    return;
  }

  res.json({
    title: data.item.name,
    artist: data.item.artists.map((a: any) => a.name).join(", "),
    duration_ms: data.item.duration_ms,
    progress_ms: data.progress_ms,
    is_playing: data.is_playing,
    album_image_url: data.item.album?.images?.[0]?.url || "",
  });
});

router.post("/play", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const token = await getValidAccessToken(userId);
  if (!token) return;

  await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  res.sendStatus(200);
});

router.post("/pause", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const token = await getValidAccessToken(userId);
  if (!token) return;

  await fetch("https://api.spotify.com/v1/me/player/pause", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  res.sendStatus(200);
});

router.post("/next", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const token = await getValidAccessToken(userId);
  if (!token) return;

  await fetch("https://api.spotify.com/v1/me/player/next", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  res.sendStatus(200);
});

router.post("/previous", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const token = await getValidAccessToken(userId);
  if (!token) return;

  await fetch("https://api.spotify.com/v1/me/player/previous", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  res.sendStatus(200);
});

export default router;
