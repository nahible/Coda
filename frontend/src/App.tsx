import { useEffect, useState } from "react";
import { getCurrentUser, logout, type AuthUser } from "./api/auth";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((fetchedUser) => {
        setUser(fetchedUser);
      })
      .catch((err) => console.error("Failed to fetch user:", err))
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#c9bfd6]">
        <div className="text-[#1a1a1a] font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <HomePage user={user} onLogout={handleLogout} />;
}
