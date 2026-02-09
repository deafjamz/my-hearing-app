import type { NoiseComparison } from '@/hooks/useAnalytics';

const MIN_TRIALS = 5;

export function NoiseEffectivenessCard({ data }: { data: NoiseComparison }) {
  if (data.quiet.trials < MIN_TRIALS && data.noise.trials < MIN_TRIALS) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 print:text-black">
        Quiet vs. Noise
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <ConditionStat label="Quiet" trials={data.quiet.trials} accuracy={data.quiet.accuracy} />
        <ConditionStat label="With Noise" trials={data.noise.trials} accuracy={data.noise.accuracy} />
      </div>
    </div>
  );
}

function ConditionStat({ label, trials, accuracy }: { label: string; trials: number; accuracy: number }) {
  if (trials < MIN_TRIALS) {
    return (
      <div className="text-center">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm text-slate-400">Not enough data</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 print:text-slate-600">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white print:text-black">
        {accuracy}%
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{trials} trials</p>
    </div>
  );
}
