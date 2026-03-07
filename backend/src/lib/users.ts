import { supabase } from "./supabase.js";

type GoogleUserInput = {
  email: string;
  googleId: string;
  name: string;
};

export const upsertGoogleUser = async ({ email, googleId, name }: GoogleUserInput) =>
  supabase
    .from("users")
    .upsert(
      {
        google_id: googleId,
        email,
        name,
      },
      { onConflict: "google_id" }
    )
    .select("id, email, name, google_id")
    .single();

export const findUserById = async (id: number) =>
  supabase
    .from("users")
    .select("id, email, name, google_id")
    .eq("id", id)
    .maybeSingle();
