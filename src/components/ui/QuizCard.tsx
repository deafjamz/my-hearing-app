import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Question, Choice } from '@/types/activity';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizCardProps {
  question: Question;
  onAnswer: (isCorrect: boolean, choiceText: string, correctText: string) => void;
  disabled?: boolean;
}

export function QuizCard({ question, onAnswer, disabled = false }: QuizCardProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelect = (choice: Choice) => {
    if (isSubmitted || disabled) return;

    setSelectedChoiceId(choice.id);
    setIsSubmitted(true);
    const correctChoice = question.choices.find(c => c.isCorrect);
    onAnswer(choice.isCorrect, choice.text, correctChoice?.text || '');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{question.text}</h3>
      
      <div className="grid gap-3">
        {question.choices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;
          let variantStyles = "border-gray-200 hover:border-primary-300 hover:bg-primary-50";
          
          if (disabled && !isSubmitted) {
            variantStyles = "opacity-50 cursor-not-allowed border-gray-100 bg-gray-50";
          } else if (isSubmitted) {
            if (isSelected && choice.isCorrect) {
              variantStyles = "border-green-500 bg-green-50 text-green-800";
            } else if (isSelected && !choice.isCorrect) {
              variantStyles = "border-red-500 bg-red-50 text-red-800";
            } else if (!isSelected && choice.isCorrect) {
              // Show the correct answer even if they missed it
              variantStyles = "border-green-200 bg-green-50/50 text-green-700 border-dashed";
            } else {
              variantStyles = "opacity-50 border-gray-100";
            }
          } else if (isSelected) {
            variantStyles = "border-primary-500 bg-primary-50 ring-1 ring-primary-500";
          }

          return (
            <motion.button
              key={choice.id}
              onClick={() => handleSelect(choice)}
              disabled={isSubmitted || disabled}
              whileHover={!isSubmitted && !disabled ? { scale: 1.02 } : {}}
              whileTap={!isSubmitted && !disabled ? { scale: 0.98 } : {}}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 flex items-center justify-between group",
                variantStyles
              )}
            >
              <span className="font-medium">{choice.text}</span>
              
              <AnimatePresence>
                {isSubmitted && isSelected && choice.isCorrect && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <CheckCircle className="text-green-500 w-5 h-5" />
                  </motion.div>
                )}
                {isSubmitted && isSelected && !choice.isCorrect && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <XCircle className="text-red-500 w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {isSubmitted && question.feedback && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg mt-4">
              <p className="font-semibold mb-1">Did you know?</p>
              {question.feedback}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}