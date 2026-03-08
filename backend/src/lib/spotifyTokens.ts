import { supabase } from "./supabase.js";

type SpotifyTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: string; // ISO string
};

export const upsertSpotifyTokens = async (
  userId: number,
  accessToken: string,
  refreshToken: string,
  expiresInSeconds: number
) => {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return supabase
    .from("user_spotify_tokens")
    .upsert(
      {
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();
};

export const getSpotifyTokens = async (userId: number) => {
  return supabase
    .from("user_spotify_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
};

export const updateSpotifyAccessToken = async (
  userId: number,
  newAccessToken: string,
  expiresInSeconds: number
) => {
    // some spotify token refreshes don't return a new refresh token, so we only update the access token and expiration.
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return supabase
    .from("user_spotify_tokens")
    .update({
      access_token: newAccessToken,
      expires_at: expiresAt,
    })
    .eq("user_id", userId)
    .select()
    .single();
};
