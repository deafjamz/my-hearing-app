import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Mail, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  dismissible?: boolean;
}

export function AuthModal({ isOpen, onClose, dismissible = true }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) throw result.error;

      // Success! Close modal.
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 relative animate-in fade-in zoom-in-95 duration-200">
        {dismissible && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isSignUp 
              ? "Start your hearing journey today." 
              : "Sign in to track your progress."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-slate-900 dark:text-white"
                placeholder="you@example.com"
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-slate-900 dark:text-white"
                placeholder="••••••••"
                required 
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-slate-500 hover:text-teal-400 transition-colors font-medium"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
