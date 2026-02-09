import type { PositionBreakdown } from '@/hooks/useAnalytics';

const MIN_TRIALS = 5;
const POSITION_ORDER = ['initial', 'medial', 'final'];
const POSITION_LABELS: Record<string, string> = {
  initial: 'Initial',
  medial: 'Medial',
  final: 'Final',
};

export function PositionAnalysisCard({ data }: { data: PositionBreakdown[] }) {
  const filtered = data.filter(d => d.trials >= MIN_TRIALS);
  if (filtered.length === 0) return null;

  const sorted = [...filtered].sort(
    (a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 print:text-black">
        Phoneme Position
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {sorted.map(item => (
          <div key={item.position} className="text-center">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 print:text-slate-600">
              {POSITION_LABELS[item.position] || item.position}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white print:text-black">
              {item.accuracy}%
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{item.trials} trials</p>
          </div>
        ))}
      </div>
    </div>
  );
}
