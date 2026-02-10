import { ArrowRight } from 'lucide-react';
import type { PhonemePairStats } from '@/hooks/usePhonemeAnalytics';

const MIN_TRIALS = 10;

/**
 * Shows the top 3 most confused phoneme pairs — sounds the user
 * struggles to distinguish. Self-hides if all pairs are above 80%.
 */
export function ConfusionPatternCard({ pairs }: { pairs: PhonemePairStats[] }) {
  // Filter to pairs that are struggling (<80% accuracy with enough data)
  const confused = pairs
    .filter(p => p.trials >= MIN_TRIALS && p.accuracy < 80)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  if (confused.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 print:text-black">
        Focus Areas
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 print:text-slate-600">
        These sounds are easy to mix up — practice makes them clearer
      </p>

      <div className="space-y-4">
        {confused.map(pair => {
          const totalErrors = pair.trials - pair.correct;
          const dominantDirection = pair.confusedAsTarget >= pair.confusedAsContrast
            ? { from: pair.contrast, to: pair.target, count: pair.confusedAsTarget }
            : { from: pair.target, to: pair.contrast, count: pair.confusedAsContrast };

          return (
            <div key={`${pair.target}|${pair.contrast}`}>
              {/* Confusion direction */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                  "{pair.target}"
                </span>
                <ArrowRight size={14} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                  "{pair.contrast}"
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                  {pair.accuracy}% correct
                </span>
              </div>

              {/* Detail line */}
              {dominantDirection.count > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  "{dominantDirection.from}" heard as "{dominantDirection.to}" — {dominantDirection.count} of {totalErrors} mix-ups
                </p>
              )}

              {/* Accuracy bar */}
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${
                    pair.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${pair.accuracy}%`, minWidth: '4px' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
