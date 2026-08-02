import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const { loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  if (currentUser) {
    navigate(from, { replace: true });
    return null;
  }

  async function handleLogin() {
    try {
      setError("");
      setLoading(true);
      
      if (Capacitor.isNativePlatform()) {
        // Native Android: Use @capacitor-firebase/authentication for Custom Tabs flow
        const result = await FirebaseAuthentication.signInWithGoogle();
        // Sync the native login with the Web JS SDK so Firestore and AuthContext work!
        if (result.credential?.idToken) {
           const credential = GoogleAuthProvider.credential(result.credential.idToken);
           await signInWithCredential(auth, credential);
        }
      } else {
        // Standard web browser flow
        await loginWithGoogle();
      }
    } catch (err) {
      console.error(err);
      setError("Login Error: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
      
      <div className="max-w-md w-full p-8 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 text-center relative z-10 shadow-2xl">
        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_-10px_rgba(79,70,229,1)]">
          <span className="text-3xl text-white">✦</span>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Kurukshetra</h1>
        <p className="text-sm font-medium text-slate-400 mb-8 uppercase tracking-widest">Expense Tracker</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 text-left font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full min-h-[56px] flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-bold py-3 px-4 rounded-2xl transition-all disabled:opacity-70 active:scale-[0.98] shadow-lg shadow-white/5"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "Authenticating..." : "Sign in with Google"}
        </button>

        <p className="text-xs font-medium text-slate-500 mt-8">
          Access restricted to @skcet.ac.in accounts.<br/>Authorized members only.
        </p>
      </div>
    </div>
  );
}
