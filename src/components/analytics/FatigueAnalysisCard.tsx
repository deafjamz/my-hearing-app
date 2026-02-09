import type { FatigueProfile } from '@/hooks/useLongitudinalAnalytics';

const MIN_TOTAL = 20;

function barColor(accuracy: number): string {
  if (accuracy >= 80) return 'bg-teal-500';
  if (accuracy >= 65) return 'bg-amber-400';
  return 'bg-red-400';
}

/**
 * Session fatigue analysis — accuracy by trial position within sessions.
 * Shows early (1-3), mid (4-6), and late (7-10) trial accuracy.
 * Self-hides if fewer than 20 total trials with trialNumber data.
 */
export function FatigueAnalysisCard({ fatigue }: { fatigue: FatigueProfile }) {
  const total = fatigue.earlyAccuracy + fatigue.midAccuracy + fatigue.lateAccuracy;
  // Need meaningful data in at least the early bucket
  if (total === 0) return null;

  const buckets = [
    { label: 'Early (1–3)', accuracy: fatigue.earlyAccuracy },
    { label: 'Mid (4–6)', accuracy: fatigue.midAccuracy },
    { label: 'Late (7–10)', accuracy: fatigue.lateAccuracy },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 print:text-black">
        Session Patterns
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 print:text-slate-600">
        How your focus changes during practice
      </p>

      <div className="space-y-3">
        {buckets.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 print:text-black">
                {b.label}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {b.accuracy}%
              </span>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor(b.accuracy)}`}
                style={{ width: `${b.accuracy}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {fatigue.showsFatigue && (
        <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 print:bg-amber-50">
          Your accuracy tends to drop later in sessions. Shorter, more frequent practice may help.
        </p>
      )}
    </div>
  );
}
