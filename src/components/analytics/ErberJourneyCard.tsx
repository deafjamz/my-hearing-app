import { CheckCircle, Circle, Lock } from 'lucide-react';
import type { ErberJourney } from '@/hooks/useLongitudinalAnalytics';

const MIN_TOTAL_TRIALS = 5;

const LEVELS = [
  { key: 'detection' as const, label: 'Detection', desc: 'Hear sounds' },
  { key: 'discrimination' as const, label: 'Discrimination', desc: 'Tell sounds apart' },
  { key: 'identification' as const, label: 'Identification', desc: 'Recognize words' },
  { key: 'comprehension' as const, label: 'Comprehension', desc: 'Understand meaning' },
];

/**
 * 4-level Erber progression card showing mastery status at each level.
 * Self-hides if total trials across all levels < 5.
 */
export function ErberJourneyCard({ journey }: { journey: ErberJourney }) {
  const totalTrials = Object.values(journey).reduce((s, l) => s + l.trials, 0);
  if (totalTrials < MIN_TOTAL_TRIALS) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 print:text-black">
        Training Journey
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 print:text-slate-600">
        Your path through 4 levels of listening
      </p>

      {/* Horizontal journey */}
      <div className="flex items-start justify-between gap-1">
        {LEVELS.map((level, idx) => {
          const stats = journey[level.key];
          const hasData = stats.trials > 0;
          const mastered = stats.mastered;

          return (
            <div key={level.key} className="flex-1 flex flex-col items-center text-center">
              {/* Connector line (before node, except first) */}
              <div className="flex items-center w-full mb-2">
                {idx > 0 && (
                  <div className={`flex-1 h-0.5 ${
                    journey[LEVELS[idx - 1].key].mastered ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
                {idx === 0 && <div className="flex-1" />}

                {/* Node */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  mastered
                    ? 'bg-teal-500 text-white'
                    : hasData
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-2 border-amber-300 dark:border-amber-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {mastered ? <CheckCircle size={20} /> : hasData ? <Circle size={20} /> : <Lock size={14} />}
                </div>

                {idx < LEVELS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${
                    mastered ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
                {idx === LEVELS.length - 1 && <div className="flex-1" />}
              </div>

              {/* Label */}
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 print:text-black leading-tight">
                {level.label}
              </p>

              {/* Stats */}
              {hasData ? (
                <div className="mt-1">
                  <p className={`text-sm font-bold ${
                    mastered ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    {stats.accuracy}%
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {stats.trials} trials
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Not started
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
