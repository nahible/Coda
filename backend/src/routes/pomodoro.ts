import { Router } from "express";
import { getSessionUserId } from "../lib/session.js";
import { supabase } from "../lib/supabase.js";

const router = Router();

// GET all pomodoro sessions for the logged-in user
router.get("/", async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { data, error } = await supabase
    .from("pomodoro_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pomodoro sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
    return;
  }

  res.json(data);
});

// POST a new pomodoro session
router.post("/", async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { duration_secs, session_type, status } = req.body;

  if (typeof duration_secs !== "number") {
    res.status(400).json({ error: "Missing or invalid duration_secs" });
    return;
  }

  const { data, error } = await supabase
    .from("pomodoro_sessions")
    .insert([
      {
        user_id: userId,
        duration_secs,
        session_type: session_type || "work",
        status: status || "completed", // Accept interrupted flag
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating pomodoro session:", error);
    res.status(500).json({ error: "Failed to create session" });
    return;
  }

  res.status(201).json(data);
});

// PUT (update) an existing session - just in case we need it later
router.put("/:id", async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const sessionId = req.params.id;
  const { duration_secs, session_type } = req.body;

  const { data, error } = await supabase
    .from("pomodoro_sessions")
    .update({ duration_secs, session_type })
    .eq("id", sessionId)
    .eq("user_id", userId) // Ensure they own it
    .select()
    .single();

  if (error) {
    console.error("Error updating pomodoro session:", error);
    res.status(500).json({ error: "Failed to update session" });
    return;
  }

  res.json(data);
});

// DELETE a session
router.delete("/:id", async (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const sessionId = req.params.id;

  const { error } = await supabase
    .from("pomodoro_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId); // Ensure they own it

  if (error) {
    console.error("Error deleting pomodoro session:", error);
    res.status(500).json({ error: "Failed to delete session" });
    return;
  }

  res.status(204).send();
});

export default router;
