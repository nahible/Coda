const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

/**
 * Redirect the browser to the backend's Google OAuth login route.
 * The backend is responsible for generating the Google consent URL
 * and redirecting the user there.
 */
export function loginWithGoogle(): void {
  window.location.href = `${API_BASE}/auth/google`;
}

/**
 * Exchange the Google OAuth callback code for a session / JWT.
 *
 * After Google redirects the user back to your app with a `code` query
 * parameter, call this function to send that code to your backend,
 * which will verify it with Google and return a token.
 *
 * @param code - The authorization code from Google's OAuth callback.
 * @returns The JSON response from your backend (e.g. `{ token, user }`).
 */
export async function handleGoogleCallback(code: string) {
  const res = await fetch(`${API_BASE}/auth/google/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "Google authentication failed");
  }

  return res.json(); // e.g. { token: "...", user: { id, name, email, avatar } }
}

/**
 * (Optional) Log the user out by hitting the backend logout endpoint.
 */
export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
}
