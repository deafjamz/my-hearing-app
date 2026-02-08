import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Headphones, TrendingUp, Clock } from 'lucide-react';

interface WelcomeScreenProps {
  onSkip: () => void;
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
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
    title: 'Quick sessions',
    description: 'Most exercises take just 2\u20133 minutes',
  },
];

export function WelcomeScreen({ onSkip }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const handleStart = () => {
    localStorage.setItem('soundsteps_welcomed', 'true');
    navigate('/practice/detection');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Atmospheric orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-violet-500/[0.08] rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        className="max-w-md w-full relative z-10"
      >
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

        {/* CTA button */}
        <motion.button
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.5, duration: prefersReducedMotion ? 0 : 0.5 }}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          onClick={handleStart}
          className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg rounded-full py-5 shadow-[0_0_20px_rgba(0,167,157,0.3)] transition-colors cursor-pointer"
        >
          Start Your First Exercise
        </motion.button>

        {/* Subtext */}
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.55, duration: prefersReducedMotion ? 0 : 0.4 }}
          className="text-slate-500 text-sm text-center mt-3"
        >
          About 2 minutes
        </motion.p>

        {/* Skip link */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.6, duration: prefersReducedMotion ? 0 : 0.4 }}
          className="text-center mt-6"
        >
          <button
            onClick={onSkip}
            className="text-slate-500 hover:text-slate-400 text-sm font-medium transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
