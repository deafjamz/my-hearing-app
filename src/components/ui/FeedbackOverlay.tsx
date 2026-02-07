import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

interface FeedbackOverlayProps {
  type: 'correct' | 'incorrect' | null;
}

export function FeedbackOverlay({ type }: FeedbackOverlayProps) {
  return (
    <AnimatePresence>
      {type === 'correct' && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-green-500/90 backdrop-blur-sm pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-white flex flex-col items-center"
          >
            <CheckCircle size={120} strokeWidth={3} aria-hidden="true" />
            <h2 className="text-4xl font-bold mt-4">Correct!</h2>
          </motion.div>
        </motion.div>
      )}
      {type === 'incorrect' && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-red-500/90 backdrop-blur-sm pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-white flex flex-col items-center"
          >
            <XCircle size={120} strokeWidth={3} aria-hidden="true" />
            <h2 className="text-4xl font-bold mt-4">Not quite</h2>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}