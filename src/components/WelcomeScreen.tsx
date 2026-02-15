import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Headphones, TrendingUp, Clock } from 'lucide-react';
import { hapticSelection } from '@/lib/haptics';
import { Button } from '@/components/primitives';

interface WelcomeScreenProps {
  /** Auth gate mode — opens sign-in/sign-up modal */
  onSignIn?: () => void;
  /** First-visit mode — starts first exercise */
  onStart?: () => void;
  /** First-visit mode — dismisses welcome, shows Dashboard */
  onSkip?: () => void;
  /** Whether the user is authenticated (determines which CTA to show) */
  isAuthenticated?: boolean;
}

const VALUE_PROPS = [
  {
    icon: Headphones,
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
    title: 'Personalized practice',
    description: 'Choose your voice, set your pace',
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    title: 'Track your progress',
    description: 'See your improvement over time',
  },
  {
    icon: Clock,
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
    title: 'Quick sessions',
    description: 'Most exercises take just 2\u20133 minutes',
  },
];

export function WelcomeScreen({ onSignIn, onStart, onSkip, isAuthenticated }: WelcomeScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Atmospheric orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-slate-500/[0.08] rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Logo */}
        <motion.img
          src="/logo.png"
          alt=""
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.05, duration: prefersReducedMotion ? 0 : 0.5 }}
          className="w-20 h-20 rounded-2xl mx-auto mb-6"
        />

        {/* Heading */}
        <motion.h1
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.1, duration: prefersReducedMotion ? 0 : 0.5 }}
          className="text-4xl font-bold text-white tracking-tight text-center mb-4"
        >
          Welcome to SoundSteps
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: prefersReducedMotion ? 0 : 0.5 }}
          className="text-lg text-slate-400 leading-relaxed text-center mb-10"
        >
          Train your listening with short, daily exercises — designed for real progress at your own pace.
        </motion.p>

        {/* Value props card */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.35, duration: prefersReducedMotion ? 0 : 0.5 }}
          className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 mb-10 space-y-5"
        >
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl ${prop.iconBg} flex items-center justify-center flex-shrink-0`}>
                <prop.icon className={prop.iconColor} size={20} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{prop.title}</p>
                <p className="text-slate-400 text-sm">{prop.description}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA — switches based on auth state */}
        <AnimatePresence mode="wait">
          {isAuthenticated ? (
            <motion.div
              key="first-visit"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
            >
              <motion.button
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                onClick={() => { hapticSelection(); onStart?.(); }}
                className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg rounded-full py-5 shadow-[0_0_20px_rgba(0,143,134,0.3)] transition-colors cursor-pointer"
              >
                Start Your First Exercise
              </motion.button>
              <p className="text-slate-500 text-sm text-center mt-3">
                About 2 minutes
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="block mx-auto mt-4 text-slate-500"
              >
                Skip for now
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="auth-gate"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.5, duration: prefersReducedMotion ? 0 : 0.5 }}
            >
              <motion.button
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                onClick={() => { hapticSelection(); onSignIn?.(); }}
                className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg rounded-full py-5 shadow-[0_0_20px_rgba(0,143,134,0.3)] transition-colors cursor-pointer"
              >
                Get Started
              </motion.button>
              <p className="text-slate-500 text-sm text-center mt-3">
                Free account required
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
