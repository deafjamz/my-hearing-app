import type { LanguageBreakdown } from '@/hooks/useAnalytics';

export function LanguageBreakdownCard({
  data,
  activeFilter,
}: {
  data: LanguageBreakdown[];
  activeFilter: 'all' | 'en' | 'es';
}) {
  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 print:text-black">
        English vs. Spanish
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 print:text-slate-600">
        Launch analytics split by training language
      </p>
      <div className="grid grid-cols-2 gap-4">
        {data.map((item) => {
          const isActive = activeFilter === 'all' || activeFilter === item.language;
          return (
            <div
              key={item.language}
              className={`rounded-xl border p-4 ${
                isActive
                  ? 'border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-900/10'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {item.accuracy}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.trials} trials
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
