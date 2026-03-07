const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

/**
 * Fetch all data for the currently authenticated user.
 *
 * @param token - The auth token from login.
 * @returns The user data object from the backend.
 */
export async function fetchUserData(token: string) {
  const res = await fetch(`${API_BASE}/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "Failed to fetch user data");
  }

  return res.json();
}
