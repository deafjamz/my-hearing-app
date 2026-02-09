import { Link } from 'react-router-dom';
import { Zap, Volume2, Ear, Target, Flame } from 'lucide-react';
import type { Recommendation } from '@/hooks/useRecommendations';

const MIN_RECS = 1;

const TYPE_ICONS: Record<string, typeof Zap> = {
  phoneme: Volume2,
  erber_level: Zap,
  voice: Ear,
  noise: Target,
  position: Target,
  consistency: Flame,
};

/**
 * Smart practice recommendations card for Dashboard.
 * Shows 1-3 data-driven suggestions based on user's training patterns.
 * Self-hides when no recommendations are available.
 */
export function RecommendationCard({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length < MIN_RECS) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wide mb-4">
        Practice Recommendations
      </h3>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const Icon = TYPE_ICONS[rec.type] || Zap;

          return (
            <div
              key={rec.id}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                idx === 0
                  ? 'bg-teal-500/10 border border-teal-500/20'
                  : 'bg-slate-800/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                idx === 0 ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-400'
              }`}>
                <Icon size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{rec.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{rec.description}</p>
              </div>

              {rec.actionPath && rec.actionLabel && (
                <Link
                  to={rec.actionPath}
                  className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors flex-shrink-0 self-center"
                >
                  {rec.actionLabel} →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
