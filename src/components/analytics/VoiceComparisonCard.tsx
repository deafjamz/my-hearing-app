import type { VoiceBreakdown } from '@/hooks/useAnalytics';

const MIN_TRIALS = 5;

export function VoiceComparisonCard({ data }: { data: VoiceBreakdown[] }) {
  const male = data.find(d => d.voiceGender === 'male');
  const female = data.find(d => d.voiceGender === 'female');

  if ((!male || male.trials < MIN_TRIALS) && (!female || female.trials < MIN_TRIALS)) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 print:text-black">
        Male vs. Female Voices
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 print:text-slate-600">
        Do you hear some voices more easily?
      </p>
      <div className="grid grid-cols-2 gap-4">
        <VoiceStat label="Male voices" data={male} />
        <VoiceStat label="Female voices" data={female} />
      </div>
    </div>
  );
}

function VoiceStat({ label, data }: { label: string; data: VoiceBreakdown | undefined }) {
  if (!data || data.trials < 5) {
    return (
      <div className="text-center">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm text-slate-400">Keep practicing to see results here</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 print:text-slate-600">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white print:text-black">
        {data.accuracy}%
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{data.trials} exercises</p>
    </div>
  );
}
