/**
 * Smart Coach Feedback Component
 * Visual feedback shown between batches of 10 trials
 */

import { TrendingUp, TrendingDown, Minus, Sparkles, Volume2, ArrowDownCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SmartCoachFeedbackProps {
  message: string;
  action: 'Increase' | 'Decrease' | 'Keep' | 'Enable Noise' | 'Step Down';
  accuracy: number;
  currentSNR: number;
  nextSNR: number;
  onContinue: () => void;
  onEnableNoise?: () => void; // Callback to enable noise (for "Enable Noise" action)
  stepDownPath?: string; // Path to easier activity (for "Step Down" action)
}

export function SmartCoachFeedback({
  message,
  action,
  accuracy,
  currentSNR,
  nextSNR,
  onContinue,
  onEnableNoise,
  stepDownPath,
}: SmartCoachFeedbackProps) {
  // Aura color scheme based on action
  const getColorScheme = () => {
    switch (action) {
      case 'Decrease': // Increasing difficulty (success)
        return {
          bg: 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
          border: 'border-teal-200 dark:border-teal-800',
          icon: 'text-teal-600 dark:text-teal-400',
          glow: 'shadow-teal-200/50 dark:shadow-teal-900/50',
          badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
          title: 'text-teal-900 dark:text-teal-100',
        };
      case 'Increase': // Decreasing difficulty (supportive)
        return {
          bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          icon: 'text-amber-600 dark:text-amber-400',
          glow: 'shadow-amber-200/50 dark:shadow-amber-900/50',
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
          title: 'text-amber-900 dark:text-amber-100',
        };
      case 'Enable Noise': // Mastery achieved, invite to level up
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
          border: 'border-purple-200 dark:border-purple-800',
          icon: 'text-purple-600 dark:text-purple-400',
          glow: 'shadow-purple-200/50 dark:shadow-purple-900/50',
          badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
          title: 'text-purple-900 dark:text-purple-100',
        };
      case 'Step Down': // Suggest easier activity (supportive, not discouraging)
        return {
          bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
          border: 'border-emerald-200 dark:border-emerald-800',
          icon: 'text-emerald-600 dark:text-emerald-400',
          glow: 'shadow-emerald-200/50 dark:shadow-emerald-900/50',
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
          title: 'text-emerald-900 dark:text-emerald-100',
        };
      default: // Keep (neutral)
        return {
          bg: 'bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/30 dark:to-zinc-950/30',
          border: 'border-slate-200 dark:border-slate-800',
          icon: 'text-slate-600 dark:text-slate-400',
          glow: 'shadow-slate-200/50 dark:shadow-slate-900/50',
          badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
          title: 'text-slate-900 dark:text-slate-100',
        };
    }
  };

  const colors = getColorScheme();

  const getIcon = () => {
    switch (action) {
      case 'Decrease':
        return <TrendingUp size={48} className={colors.icon} />;
      case 'Increase':
        return <TrendingDown size={48} className={colors.icon} />;
      case 'Enable Noise':
        return <Volume2 size={48} className={colors.icon} />;
      case 'Step Down':
        return <ArrowDownCircle size={48} className={colors.icon} />;
      default:
        return <Minus size={48} className={colors.icon} />;
    }
  };

  const getTitle = () => {
    switch (action) {
      case 'Decrease':
        return 'Leveling Up!';
      case 'Increase':
        return 'Adjusting Difficulty';
      case 'Enable Noise':
        return 'Mastery Achieved!';
      case 'Step Down':
        return 'Let\'s Build Confidence';
      default:
        return 'Keep Going!';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`max-w-md w-full rounded-2xl border-2 ${colors.border} ${colors.bg} shadow-2xl ${colors.glow} p-8 space-y-6 animate-in fade-in zoom-in duration-300`}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-white/50 dark:bg-black/20">
            {getIcon()}
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={20} className={colors.icon} />
            <h2 className={`text-2xl font-bold ${colors.title}`}>{getTitle()}</h2>
            <Sparkles size={20} className={colors.icon} />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">{message}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${colors.badge} rounded-lg p-4 text-center`}>
            <p className="text-sm opacity-80 mb-1">Accuracy</p>
            <p className="text-2xl font-bold">{Math.round(accuracy)}%</p>
          </div>
          <div className={`${colors.badge} rounded-lg p-4 text-center`}>
            <p className="text-sm opacity-80 mb-1">Next SNR</p>
            <p className="text-2xl font-bold">
              {nextSNR > 0 ? '+' : ''}
              {nextSNR} dB
            </p>
          </div>
        </div>

        {/* SNR Change Indicator */}
        {action !== 'Keep' && action !== 'Enable Noise' && (
          <div className="text-center text-sm opacity-70">
            <p>
              {currentSNR > 0 ? '+' : ''}
              {currentSNR} dB → {nextSNR > 0 ? '+' : ''}
              {nextSNR} dB
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {action === 'Step Down' && stepDownPath ? (
          <div className="space-y-3">
            <Link
              to={stepDownPath}
              className="block w-full py-4 px-6 rounded-xl font-semibold text-white text-center transition-all shadow-lg hover:shadow-xl bg-emerald-600 hover:bg-emerald-700"
            >
              Try Easier Exercises
            </Link>
            <button
              onClick={onContinue}
              className="w-full py-3 px-6 rounded-xl font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Keep Practicing Here
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (action === 'Enable Noise' && onEnableNoise) {
                onEnableNoise(); // Enable noise
              }
              onContinue(); // Continue training
            }}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl ${
              action === 'Decrease'
                ? 'bg-teal-600 hover:bg-teal-700'
                : action === 'Increase'
                ? 'bg-amber-600 hover:bg-amber-700'
                : action === 'Enable Noise'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-slate-600 hover:bg-slate-700'
            }`}
          >
            {action === 'Enable Noise' ? 'Enable Background Noise' : 'Continue Training'}
          </button>
        )}
      </div>
    </div>
  );
}
