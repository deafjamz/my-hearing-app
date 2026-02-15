import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Mail, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/primitives';

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthView = 'sign-in' | 'sign-up' | 'magic-link' | 'forgot-password' | 'check-email';
type EmailType = 'confirmation' | 'magic-link' | 'password-reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  dismissible?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AuthModal({ isOpen, onClose, dismissible = true }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('sign-up');
  const [emailType, setEmailType] = useState<EmailType>('confirmation');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetError = () => setError(null);

  const goTo = (next: AuthView) => {
    resetError();
    setView(next);
  };

  // ─── OAuth (Google / Apple) ──────────────────────────────────────────────

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    resetError();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      // Browser redirects to provider — no further action needed
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`);
      setLoading(false);
    }
  };

  // ─── Email + Password ────────────────────────────────────────────────────

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetError();

    try {
      if (view === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // No session = email confirmation required
        if (!data.session) {
          setEmailType('confirmation');
          setView('check-email');
          return;
        }
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message === 'Invalid login credentials') {
            // Auto-switch to sign-up with email preserved
            setView('sign-up');
            setLoading(false);
            setError('No account found — create one below.');
            return;
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and confirm your account first.');
          }
          throw error;
        }
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Magic Link (passwordless) ───────────────────────────────────────────

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetError();

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setEmailType('magic-link');
      setView('check-email');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send sign-in link');
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot Password ────────────────────────────────────────────────────

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetError();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setEmailType('password-reset');
      setView('check-email');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Check Email (shared confirmation screen) ────────────────────────────

  if (view === 'check-email') {
    const copy: Record<EmailType, { title: string; body: string }> = {
      confirmation: {
        title: 'Check Your Email',
        body: 'Click the confirmation link to activate your account.',
      },
      'magic-link': {
        title: 'Check Your Email',
        body: 'Click the sign-in link to log in — no password needed.',
      },
      'password-reset': {
        title: 'Reset Link Sent',
        body: 'Click the link to set a new password.',
      },
    };

    const { title, body } = copy[emailType];

    return (
      <Backdrop>
        <Card>
          <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 text-center">{title}</h2>
          <p className="text-slate-400 text-sm mb-2 text-center">
            We sent an email to <span className="text-white font-medium">{email}</span>.
          </p>
          <p className="text-slate-400 text-sm mb-8 text-center">{body}</p>
          <button
            onClick={() => { goTo('sign-in'); setEmail(''); setPassword(''); }}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
          >
            Back to Sign In
          </button>
        </Card>
      </Backdrop>
    );
  }

  // ─── Magic Link View ─────────────────────────────────────────────────────

  if (view === 'magic-link') {
    return (
      <Backdrop>
        <Card>
          <BackButton onClick={() => goTo('sign-in')} />

          <div className="text-center mb-8 pt-2">
            <h2 className="text-2xl font-bold text-white mb-2">Email Sign-In Link</h2>
            <p className="text-slate-400 text-sm">No password needed — we'll email you a link.</p>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-4">
            <EmailField email={email} setEmail={setEmail} />
            <ErrorMessage error={error} />
            <SubmitButton loading={loading} label="Send Sign-In Link" />
          </form>
        </Card>
      </Backdrop>
    );
  }

  // ─── Forgot Password View ────────────────────────────────────────────────

  if (view === 'forgot-password') {
    return (
      <Backdrop>
        <Card>
          <BackButton onClick={() => goTo('sign-in')} />

          <div className="text-center mb-8 pt-2">
            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-slate-400 text-sm">Enter your email and we'll send a reset link.</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <EmailField email={email} setEmail={setEmail} />
            <ErrorMessage error={error} />
            <SubmitButton loading={loading} label="Send Reset Link" />
          </form>
        </Card>
      </Backdrop>
    );
  }

  // ─── Main Auth View (Sign In / Sign Up) ──────────────────────────────────

  const isSignUp = view === 'sign-up';

  return (
    <Backdrop>
      <Card>
        {dismissible && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isSignUp
              ? 'Start your hearing journey today.'
              : 'Sign in to track your progress.'}
          </p>
        </div>

        {/* ── Social OAuth Buttons ── */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 border border-slate-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            onClick={() => handleOAuth('apple')}
            disabled={loading}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 border border-slate-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <AppleIcon />
            Continue with Apple
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* ── Email / Password Form ── */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <EmailField email={email} setEmail={setEmail} />

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
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
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          <ErrorMessage error={error} />
          <SubmitButton loading={loading} label={isSignUp ? 'Sign Up' : 'Sign In'} />
        </form>

        {/* ── Secondary Actions (sign-in only) ── */}
        {!isSignUp && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => goTo('magic-link')}
              className="text-xs text-slate-500 hover:text-teal-400 transition-colors"
            >
              Use email link instead
            </button>
            <button
              onClick={() => goTo('forgot-password')}
              className="text-xs text-slate-500 hover:text-teal-400 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* ── Toggle Sign In / Sign Up ── */}
        <div className="mt-5 text-center">
          <button
            onClick={() => goTo(isSignUp ? 'sign-in' : 'sign-up')}
            className="text-sm text-slate-500 hover:text-teal-400 transition-colors font-medium"
          >
            {isSignUp
              ? <>Already have an account? <span className="font-bold">Sign In</span></>
              : <>Don't have an account? <span className="font-bold">Sign Up</span></>}
          </button>
        </div>
      </Card>
    </Backdrop>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared UI Primitives
// ═══════════════════════════════════════════════════════════════════════════════

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-800 p-8 relative">
      {children}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-200 transition-colors"
      aria-label="Go back"
    >
      <ArrowLeft size={20} />
    </button>
  );
}

function EmailField({ email, setEmail }: { email: string; setEmail: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
      <div className="relative">
        <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-white placeholder:text-slate-500"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>
    </div>
  );
}

function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded-lg border border-red-900/30">
      {error}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={loading}
      className="shadow-lg shadow-teal-500/30 active:scale-[0.98] rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-teal-500"
    >
      {loading ? <Loader2 className="animate-spin" size={20} /> : label}
    </Button>
  );
}

// ─── Inline SVG Icons (avoids external dependencies) ─────────────────────────

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
