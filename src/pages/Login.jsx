import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const { loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  // If already logged in, redirect
  if (currentUser) {
    navigate(from, { replace: true });
    return null;
  }

  async function handleLogin() {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      // The redirect is handled in the onAuthStateChanged listener in AuthContext
      // If it succeeds, the AuthProvider will re-render and ProtectedRoutes will pass
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError("Failed to log in. Please ensure you use an @skcet.ac.in account and are registered.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="max-w-md w-full p-8 bg-white card-shadow rounded-lg border border-gray-100 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Kurukshetra Expense Tracker</h1>
        <p className="text-sm text-slate-500 mb-8">Shared expense tracker & dues management for Kurukshetra Season 4.</p>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-6 border border-red-100 text-left">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[var(--color-primary)] hover:bg-opacity-90 text-white font-medium py-3 px-4 rounded transition-colors disabled:opacity-70"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        <p className="text-xs text-slate-400 mt-6">
          Access restricted to @skcet.ac.in accounts and registered members.
        </p>
      </div>
    </div>
  );
}
