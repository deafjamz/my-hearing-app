import { Play } from 'lucide-react';
import { Button, Card } from '@/components/primitives';

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
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-3">{title}</h1>
        <p className="text-lg text-slate-300 mb-8 leading-relaxed">{description}</p>

        <Card variant="subtle" className="bg-slate-900/80 mb-8 text-left space-y-3">
          <p className="text-base font-semibold text-white">How it works</p>
          <p className="text-base text-slate-300 leading-relaxed">{instructions}</p>
          <p className="text-sm text-slate-400 pt-3 border-t border-slate-800">{sessionInfo}</p>
        </Card>

        <Button
          size="lg"
          onClick={onStart}
          className="shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 rounded-xl"
        >
          <Play size={22} fill="currentColor" />
          Begin
        </Button>
      </div>
    </div>
  );
}
