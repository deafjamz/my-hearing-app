import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { useUser } from '@/store/UserContext';
import { AuthModal } from '@/components/auth/AuthModal';

/**
 * Route guard that requires authentication before rendering children.
 * Shows a sign-in prompt for guest users instead of the activity.
 * Used to prevent the "do exercises then discover nothing saved" problem (F-010).
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [showAuth, setShowAuth] = useState(false);

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
          <Lock className="h-10 w-10 text-purple-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Sign in to start training
        </h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Create a free account so your progress is saved across sessions. It only takes a moment.
        </p>

        <button
          onClick={() => setShowAuth(true)}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all active:scale-[0.98] mb-4"
        >
          Sign In or Create Account
        </button>

        <Link
          to="/practice"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Practice Hub
        </Link>
      </div>
    </div>
  );
}
