import { supabase } from "./supabase.js";

export type CanvasFeedRow = {
  created_at: string;
  feed_url: string;
  updated_at: string;
  user_id: number;
};

export const getCanvasFeedByUserId = async (userId: number) =>
  supabase
    .from("user_canvas_feeds")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<CanvasFeedRow>();

export const upsertCanvasFeedByUserId = async (userId: number, feedUrl: string) =>
  supabase
    .from("user_canvas_feeds")
    .upsert(
      {
        user_id: userId,
        feed_url: feedUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single<CanvasFeedRow>();
