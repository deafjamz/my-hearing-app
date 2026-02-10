import { useState } from 'react';
import type { PhonemeMasteryData } from '@/hooks/usePhonemeAnalytics';

const MIN_PAIRS = 3;
const MIN_TRIALS = 5;

function cellColor(accuracy: number, dark: boolean): string {
  if (accuracy >= 80) return dark ? 'bg-teal-600' : 'bg-teal-500';
  if (accuracy >= 70) return dark ? 'bg-teal-800' : 'bg-teal-300';
  if (accuracy >= 50) return dark ? 'bg-amber-700' : 'bg-amber-400';
  return dark ? 'bg-red-800' : 'bg-red-400';
}

export function PhonemeMasteryGrid({ data }: { data: PhonemeMasteryData }) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  // Only show pairs with enough trials
  const viablePairs = data.pairs.filter(p => p.trials >= MIN_TRIALS);
  if (viablePairs.length < MIN_PAIRS) return null;

  // Build lookup: "target|contrast" → accuracy + trials
  const lookup = new Map<string, { accuracy: number; trials: number }>();
  for (const p of viablePairs) {
    lookup.set(`${p.target}|${p.contrast}`, { accuracy: p.accuracy, trials: p.trials });
    lookup.set(`${p.contrast}|${p.target}`, { accuracy: p.accuracy, trials: p.trials });
  }

  // Filter phonemes to only those with viable pair data
  const activePhonemes = new Set<string>();
  for (const p of viablePairs) {
    activePhonemes.add(p.target);
    activePhonemes.add(p.contrast);
  }
  const phonemes = Array.from(activePhonemes).sort();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 print:text-black">
        Sound Pattern Mastery
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 print:text-slate-600">
        Each square shows how often you get a sound pair right
      </p>

      {/* Tooltip */}
      {tooltip && (
        <div className="text-xs text-slate-600 dark:text-slate-300 mb-2 font-medium">
          {tooltip}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div
          className="inline-grid gap-1"
          style={{
            gridTemplateColumns: `2rem repeat(${phonemes.length}, minmax(2rem, 1fr))`,
          }}
        >
          {/* Header row: empty corner + phoneme labels */}
          <div />
          {phonemes.map(p => (
            <div key={`h-${p}`} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center truncate">
              {p}
            </div>
          ))}

          {/* Data rows */}
          {phonemes.map((rowPhoneme, ri) => (
            <>
              {/* Row label */}
              <div key={`l-${rowPhoneme}`} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center justify-end pr-1">
                {rowPhoneme}
              </div>

              {/* Cells */}
              {phonemes.map((colPhoneme, ci) => {
                // Diagonal = same phoneme
                if (ri === ci) {
                  return (
                    <div
                      key={`${rowPhoneme}-${colPhoneme}`}
                      className="w-full aspect-square rounded bg-slate-100 dark:bg-slate-800"
                    />
                  );
                }

                // Only render upper-right triangle (avoid duplicates)
                if (ri > ci) {
                  return <div key={`${rowPhoneme}-${colPhoneme}`} />;
                }

                const pair = lookup.get(`${rowPhoneme}|${colPhoneme}`);
                if (!pair) {
                  return (
                    <div
                      key={`${rowPhoneme}-${colPhoneme}`}
                      className="w-full aspect-square rounded bg-slate-50 dark:bg-slate-800/50"
                    />
                  );
                }

                return (
                  <button
                    key={`${rowPhoneme}-${colPhoneme}`}
                    aria-label={`${rowPhoneme} versus ${colPhoneme}: ${pair.accuracy}% correct, ${pair.trials} exercises`}
                    className={`w-full aspect-square rounded ${cellColor(pair.accuracy, true)} hover:ring-2 hover:ring-teal-400 transition-all cursor-pointer flex items-center justify-center`}
                    onMouseEnter={() => setTooltip(`${rowPhoneme} vs ${colPhoneme}: ${pair.accuracy}% correct (${pair.trials} exercises)`)}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => setTooltip(`${rowPhoneme} vs ${colPhoneme}: ${pair.accuracy}% correct (${pair.trials} exercises)`)}
                  >
                    <span className="text-[9px] font-bold text-white/80">
                      {pair.accuracy}
                    </span>
                  </button>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-[10px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-500" /> 80%+</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-300 dark:bg-teal-800" /> 70%+</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 dark:bg-amber-700" /> 50%+</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 dark:bg-red-800" /> &lt;50%</span>
      </div>
    </div>
  );
}
