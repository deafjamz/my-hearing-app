import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

/**
 * ResetPassword — handles the redirect from Supabase's password reset email.
 *
 * Flow:
 * 1. User clicks "Forgot password?" in AuthModal
 * 2. Supabase sends a reset email with a link to /reset-password
 * 3. The link includes a recovery token that Supabase client detects automatically
 * 4. This page shows a form to enter a new password
 * 5. Calls supabase.auth.updateUser({ password }) to save it
 */
export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  // Wait for Supabase to parse the recovery token from the URL
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setHasSession(true);
        setChecking(false);
      }
    });

    // Also check if a session was already established (e.g., fast URL parse)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
      // Give the auth listener a moment to fire PASSWORD_RECOVERY
      setTimeout(() => setChecking(false), 1500);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // ─── Success ──────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-slate-900 w-full max-w-md rounded-[2rem] border border-slate-800 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Password Updated</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your password has been changed successfully. You're now signed in.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading / Checking Token ─────────────────────────────────────────────

  if (checking) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // ─── Invalid / Expired Link ───────────────────────────────────────────────

  if (!hasSession) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-slate-900 w-full max-w-md rounded-[2rem] border border-slate-800 p-8 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Invalid Reset Link</h2>
          <p className="text-slate-400 text-sm mb-6">
            This link may have expired or already been used. Please request a new password reset.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // ─── New Password Form ────────────────────────────────────────────────────

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="bg-slate-900 w-full max-w-md rounded-[2rem] border border-slate-800 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">Set New Password</h2>
          <p className="text-slate-400 text-sm">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-white placeholder:text-slate-500"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-white placeholder:text-slate-500"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded-lg border border-red-900/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
