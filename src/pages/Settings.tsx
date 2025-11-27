import { useVoice } from '@/store/VoiceContext';
import { Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Settings() {
  const { currentVoice, setVoice, availableVoices } = useVoice();

  return (
    <div className="p-6 max-w-md mx-auto space-y-8 bg-brand-background dark:bg-brand-dark min-h-screen">
      <header>
        <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-light">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Customize your hearing experience.</p>
      </header>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-brand-dark dark:text-brand-light flex items-center gap-3">
          <div className="bg-brand-background dark:bg-brand-dark shadow-neumo-concave dark:shadow-dark-neumo-concave p-2 rounded-full">
            <User size={24} className="text-brand-primary" />
          </div>
          Preferred Voice
        </h2>
        
        <div className="grid grid-cols-1 gap-3">
          {availableVoices.map((voice) => {
            const isSelected = currentVoice === voice.id;
            return (
              <button
                key={voice.id}
                onClick={() => setVoice(voice.id)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 transform active:scale-[0.98]",
                  isSelected
                    ? "bg-brand-background dark:bg-brand-dark shadow-neumo-convex dark:shadow-dark-neumo-convex border-brand-primary text-brand-dark dark:text-brand-light transform scale-[1.01]"
                    : "bg-brand-background dark:bg-brand-dark shadow-neumo-concave dark:shadow-dark-neumo-concave hover:shadow-neumo-convex dark:hover:shadow-dark-neumo-convex border-transparent text-gray-700 dark:text-gray-300"
                )}
              >
                <div className="text-left">
                  <p className={cn("font-semibold", "text-brand-dark dark:text-brand-light")}>
                    {voice.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{voice.description}</p>
                </div>
                {isSelected && <Check className="text-brand-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}