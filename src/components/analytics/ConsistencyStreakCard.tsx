import { Flame } from 'lucide-react';
import type { ConsistencyStats } from '@/hooks/useLongitudinalAnalytics';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Practice consistency card for Dashboard bento grid.
 * Shows last 7 days heatmap, current streak, and monthly total.
 * Self-hides if user has never practiced.
 */
export function ConsistencyStreakCard({ consistency }: { consistency: ConsistencyStats }) {
  if (consistency.totalActiveDays === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wide mb-4">
        Practice Consistency
      </h3>

      {/* Last 7 days */}
      <div className="flex items-center justify-between gap-1.5 mb-5">
        {consistency.last7Days.map((active, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full aspect-square rounded-lg ${
                active
                  ? 'bg-teal-500'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
            <span className="text-[10px] text-slate-500 font-bold">
              {DAY_LABELS[idx]}
            </span>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
          <Flame size={20} className="text-teal-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white leading-none">
            {consistency.currentStreak}
          </p>
          <p className="text-xs text-slate-400">
            {consistency.currentStreak === 1 ? 'day streak' : 'day streak'}
          </p>
        </div>
        {consistency.longestStreak > consistency.currentStreak && (
          <p className="text-xs text-slate-500 ml-auto">
            Best: {consistency.longestStreak}
          </p>
        )}
      </div>

      {/* Monthly summary */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <p className="text-xs text-slate-400">Last 30 days</p>
        <p className="text-sm font-bold text-white">
          {consistency.last30DaysActive} <span className="text-slate-500 font-bold text-xs">active days</span>
        </p>
      </div>
    </div>
  );
}
