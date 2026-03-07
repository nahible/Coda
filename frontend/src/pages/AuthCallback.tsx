import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * This page handles the redirect back from the backend after Google OAuth.
 * The backend redirects here with token and user info as query params.
 */
const AuthCallback = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // Sometimes OAuth providers pass the token in the hash instead of query string
    // Try checking the hash if it's not in the query string
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const finalToken = token || hashParams.get('id_token') || hashParams.get('access_token');

    if (finalToken) {
      // The AuthContext now decodes this token automatically to extract user name, email, etc.
      login(finalToken);
      navigate('/', { replace: true });
    } else {
      // No token — something went wrong, go back to login
      navigate('/login', { replace: true });
    }
  }, [login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#c9bfd6]">
      <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg px-12 py-14 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-3 border-[#a899ca] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#4a4358] text-sm font-medium">Signing you in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
