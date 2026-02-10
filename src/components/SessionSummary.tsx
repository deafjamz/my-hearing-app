import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, TrendingUp, Target, ArrowRight } from 'lucide-react';
import { useTodaysPlan } from '@/hooks/useTodaysPlan';

/**
 * Session Summary - Completion screen for program sessions
 */

interface NextActivity {
  label: string;       // e.g., "Word Basics"
  description: string; // e.g., "Tell apart very different words"
  path: string;        // e.g., "/practice/gross-discrimination"
}

interface SessionSummaryProps {
  sessionTitle: string;
  accuracy: number;
  totalItems: number;
  correctCount: number;
  onContinue: () => void;
  nextActivity?: NextActivity;
}

export function SessionSummary({
  sessionTitle,
  accuracy,
  totalItems,
  correctCount,
  onContinue,
  nextActivity,
}: SessionSummaryProps) {
  // Determine performance level — scale praise to session length
  const isShortSession = totalItems < 5;
  const getPerformanceMessage = () => {
    if (isShortSession) {
      // Muted praise for very short sessions — not enough data for strong claims
      if (accuracy >= 80) return { message: 'Good Start!', color: 'text-teal-400' };
      if (accuracy >= 50) return { message: 'Nice Try!', color: 'text-green-400' };
      return { message: 'Keep Going!', color: 'text-yellow-400' };
    }
    if (accuracy >= 90) return { message: 'Excellent Work!', color: 'text-teal-400' };
    if (accuracy >= 75) return { message: 'Great Progress!', color: 'text-green-400' };
    if (accuracy >= 60) return { message: 'Good Effort!', color: 'text-yellow-400' };
    return { message: 'Keep Practicing!', color: 'text-orange-400' };
  };

  const performance = getPerformanceMessage();
  const prefersReducedMotion = useReducedMotion();
  const { isInPlan, isLastStep } = useTodaysPlan();
  const isPlanComplete = isInPlan && isLastStep;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        className="max-w-lg w-full"
      >
        {/* Success Icon */}
        <motion.div
          initial={prefersReducedMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-teal-500/20 border-4 border-teal-500 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-teal-400" strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.3, duration: prefersReducedMotion ? 0 : undefined }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            {isPlanComplete ? 'Practice Complete!' : 'Session Complete!'}
          </h1>
          <p className="text-slate-400 text-lg">{sessionTitle}</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {/* Accuracy */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.4, duration: prefersReducedMotion ? 0 : undefined }}
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Accuracy</p>
                  <p className={`text-3xl font-bold ${performance.color}`}>
                    {Math.round(accuracy)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Score</p>
                <p className="text-xl font-bold text-white">
                  {correctCount} / {totalItems}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Performance Message */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.5, duration: prefersReducedMotion ? 0 : undefined }}
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Result</p>
                <p className={`text-xl font-bold ${performance.color}`}>
                  {performance.message}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.6, duration: prefersReducedMotion ? 0 : undefined }}
          className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl mb-8"
        >
          <p className="text-slate-400 text-center leading-relaxed">
            {isShortSession
              ? "Complete a full session for a better picture of your skills. Keep practicing!"
              : accuracy >= 90
              ? "Outstanding performance! You're mastering these skills with confidence."
              : accuracy >= 75
              ? "You're making great strides. Consistency is key to continued improvement."
              : accuracy >= 60
              ? "Solid effort! Regular practice will strengthen these listening skills."
              : "Every session builds your foundation. Keep practicing and you'll see progress."}
          </p>
        </motion.div>

        {/* What's Next — guided suggestion (hidden when plan is complete) */}
        {nextActivity && !isPlanComplete && (
          <motion.a
            href={nextActivity.path}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.7, duration: prefersReducedMotion ? 0 : undefined }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            className="block w-full p-6 bg-teal-500 hover:bg-teal-400 rounded-2xl transition-all shadow-xl mb-3 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium mb-1">Up Next</p>
                <p className="text-white font-bold text-lg">{nextActivity.label}</p>
                <p className="text-teal-100 text-sm mt-1">{nextActivity.description}</p>
              </div>
              <ArrowRight className="text-white flex-shrink-0 ml-4" size={24} />
            </div>
          </motion.a>
        )}

        {/* Continue / Back Button */}
        <motion.button
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : nextActivity && !isPlanComplete ? 0.8 : 0.7, duration: prefersReducedMotion ? 0 : undefined }}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          onClick={onContinue}
          className={`w-full p-6 rounded-2xl transition-all ${
            nextActivity && !isPlanComplete
              ? 'bg-slate-900 border border-slate-800 hover:bg-slate-800'
              : 'bg-teal-500 hover:bg-teal-400 shadow-xl'
          }`}
        >
          <p className={`font-bold text-lg ${nextActivity && !isPlanComplete ? 'text-slate-300' : 'text-white'}`}>
            {isPlanComplete
              ? 'Back to Practice Hub'
              : nextActivity
                ? 'Back to Practice Hub'
                : 'Continue Training'}
          </p>
        </motion.button>
      </motion.div>
    </div>
  );
}
