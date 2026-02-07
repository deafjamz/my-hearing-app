import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp, Target } from 'lucide-react';

/**
 * Session Summary - Completion screen for program sessions
 */

interface SessionSummaryProps {
  sessionTitle: string;
  accuracy: number;
  totalItems: number;
  correctCount: number;
  onContinue: () => void;
}

export function SessionSummary({
  sessionTitle,
  accuracy,
  totalItems,
  correctCount,
  onContinue,
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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-teal-500/20 border-4 border-teal-500 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-teal-400" strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Session Complete!</h1>
          <p className="text-slate-400 text-lg">{sessionTitle}</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {/* Accuracy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-gradient-to-br from-teal-900/30 to-green-900/30 border border-teal-700/50 rounded-2xl"
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 bg-slate-900 border border-slate-800 rounded-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Assessment</p>
                <p className={`text-xl font-bold ${performance.color}`}>
                  {performance.message}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
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

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="w-full p-6 bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl hover:from-violet-500 hover:to-purple-600 transition-all shadow-lg"
        >
          <p className="text-white font-bold text-lg">Continue Training</p>
        </motion.button>

        {/* Secondary Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-center"
        >
          <button
            onClick={onContinue}
            className="text-slate-400 hover:text-slate-300 text-sm font-medium"
          >
            Return to Program
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
