import { useEffect, useState } from "react";
import { getCurrentUser, logout, type AuthUser } from "./api/auth";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (!isActive) {
          return;
        }

        setUser(currentUser);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error(error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      isActive = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base text-ink">
        <div className="rounded-3xl bg-panel px-8 py-6 shadow-panel backdrop-blur-lg">
          Checking your session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <HomePage user={user} onLogout={handleLogout} />;
}
