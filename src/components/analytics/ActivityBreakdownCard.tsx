import type { ActivityBreakdown } from '@/hooks/useAnalytics';

const MIN_TRIALS = 5;

function accuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'bg-teal-500';
  if (accuracy >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function ActivityBreakdownCard({ data }: { data: ActivityBreakdown[] }) {
  const filtered = data.filter(d => d.trials >= MIN_TRIALS);
  if (filtered.length === 0) return null;

  const maxTrials = Math.max(...filtered.map(d => d.trials));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 print:text-black">
        Accuracy by Activity
      </h3>
      <div className="space-y-3">
        {filtered.map(item => (
          <div key={item.activityType}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 print:text-black">
                {item.label}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                {item.accuracy}%
                <span className="text-xs font-normal text-slate-400 ml-1">({item.trials})</span>
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${accuracyColor(item.accuracy)}`}
                style={{ width: `${(item.trials / maxTrials) * (item.accuracy / 100) * 100}%`, minWidth: '4px' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
