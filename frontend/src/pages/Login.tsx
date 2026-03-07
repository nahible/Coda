import { getGoogleAuthUrl } from "../api/auth";

type LoginProps = {
  errorMessage?: string | null;
};

const Login = ({ errorMessage }: LoginProps) => {
  const handleGoogleLogin = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#c9bfd6]">
      {/* Card */}
      <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg px-12 py-14 flex flex-col items-center gap-8 max-w-sm w-full mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7"
            >
              <circle cx="12" cy="8" r="3" />
              <circle cx="7" cy="16" r="2.5" />
              <circle cx="17" cy="16" r="2.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a1a] tracking-tight">
            Coda
          </h1>
          <p className="text-sm text-[#6b6b6b]">Your custom syllabus</p>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-full border border-[#d4d4d4] bg-white text-[#1a1a1a] text-[15px] font-medium cursor-pointer transition-all duration-200 hover:bg-[#f0edf3] hover:border-[#b0a4bd] hover:shadow-md active:scale-[0.98]"
        >
          {/* Google "G" icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
        {errorMessage ? (
          <p className="text-center text-sm text-[#b24c58]">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
};

export default Login;
