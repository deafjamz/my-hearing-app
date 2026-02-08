import { Play } from 'lucide-react';

interface ActivityBriefingProps {
  title: string;
  description: string;
  instructions: string;
  sessionInfo: string;
  onStart: () => void;
}

export function ActivityBriefing({ title, description, instructions, sessionInfo, onStart }: ActivityBriefingProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-3">{title}</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">{description}</p>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-8 text-left space-y-3">
          <p className="text-sm font-semibold text-slate-300">How it works</p>
          <p className="text-sm text-slate-400 leading-relaxed">{instructions}</p>
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-800">{sessionInfo}</p>
        </div>

        <button
          onClick={onStart}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <Play size={22} fill="currentColor" />
          Begin
        </button>
      </div>
    </div>
  );
}
