import { useEffect, useState } from 'react';
import { getCurrentUser, logout, type AuthUser } from './api/auth';
import HomePage from './pages/HomePage';
import Login from './pages/Login';

export default function App() {
  const [authError, setAuthError] = useState<string | null>(null);
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
        setAuthError('Unable to verify your session right now.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

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
      <div className="min-h-screen flex items-center justify-center bg-[#c9bfd6] text-[#1a1a1a]">
        <div className="rounded-3xl bg-white/70 px-8 py-6 shadow-lg backdrop-blur-lg">
          Checking your session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login errorMessage={authError} />;
  }

  return <HomePage user={user} onLogout={handleLogout} />;
}
