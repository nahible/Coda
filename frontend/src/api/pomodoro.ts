const API_BASE_URL = "http://localhost:5001/auth/pomodoro";

export interface PomodoroSession {
  id: string; // UUID
  user_id: number;
  duration_secs: number;
  session_type: "work" | "break";
  status: "completed" | "interrupted";
  created_at: string;
}

export async function fetchSessions(): Promise<PomodoroSession[]> {
  const res = await fetch(API_BASE_URL, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch pomodoro sessions");
  return res.json();
}

export async function createSession(
  duration_secs: number, 
  session_type: "work" | "break" = "work",
  status: "completed" | "interrupted" = "completed"
): Promise<PomodoroSession> {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ duration_secs, session_type, status }),
  });
  if (!res.ok) throw new Error("Failed to create pomodoro session");
  return res.json();
}

export async function updateSession(id: string, duration_secs: number, session_type: "work" | "break"): Promise<PomodoroSession> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ duration_secs, session_type }),
  });
  if (!res.ok) throw new Error("Failed to update pomodoro session");
  return res.json();
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete pomodoro session");
}
