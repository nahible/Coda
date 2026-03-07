const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export type AuthUser = {
  email: string;
  googleId: string;
  id: number;
  name: string;
};

export const getGoogleAuthUrl = () => `${API_BASE_URL}/auth/google`;

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch current user.");
  }

  const payload = (await response.json()) as { user: AuthUser };
  return payload.user;
};

export const logout = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to log out.");
  }
};
