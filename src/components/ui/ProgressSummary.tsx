import { useClinicalSummary } from '@/hooks/useActivityData';
import { cn } from '@/lib/utils';
import { TrendingUp, Award, Clock } from 'lucide-react';

export function ProgressSummary() {
  const { summary, loading } = useClinicalSummary();

  // For simplicity, let's just show stats for the most recent day if available
  const latestSummary = summary.length > 0 ? summary[0] : null;

  if (loading) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        Loading progress...
      </div>
    );
  }

  if (!latestSummary) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        No practice data yet. Start an activity!
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none p-6 rounded-[2rem] text-slate-900 dark:text-white",
      "flex flex-col gap-4"
    )}>
      <h2 className="text-xl font-bold tracking-tight">Your Recent Progress</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Total Exercises */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <Award size={20} className="text-blue-500" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Exercises Done</p>
            <p className="font-semibold text-lg">{latestSummary.total_exercises}</p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <TrendingUp size={20} className="text-green-500" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Accuracy</p>
            <p className="font-semibold text-lg">{latestSummary.accuracy_percentage}%</p>
          </div>
        </div>

        {/* Avg Reaction Time */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg col-span-2">
          <Clock size={20} className="text-purple-500" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg. Reaction Time</p>
            <p className="font-semibold text-lg">{latestSummary.avg_reaction_time?.toFixed(0)} ms</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
        Last updated: {new Date(latestSummary.practice_date).toLocaleDateString()}
      </p>
    </div>
  );
}
