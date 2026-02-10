import type { ReplayStats } from '@/hooks/useAnalytics';

const MIN_DATA = 5; // Need enough replay data to be meaningful

export function ReplayInsightCard({ data, totalTrials }: { data: ReplayStats; totalTrials: number }) {
  if (totalTrials < MIN_DATA || data.avgReplays === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 print:text-black">
        Does Replaying Help?
      </h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white print:text-black">
        {data.avgReplays} <span className="text-sm font-medium text-slate-400">avg replays per exercise</span>
      </p>
      <div className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400 print:text-slate-600">
        <p>
          First try: <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">{data.zeroReplayAccuracy}%</span> correct
        </p>
        <p>
          After replaying: <span className="font-bold text-slate-700 dark:text-slate-300 print:text-black">{data.multiReplayAccuracy}%</span> correct
        </p>
      </div>
    </div>
  );
}
