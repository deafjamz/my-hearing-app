import { Link } from 'react-router-dom';
import { ChevronLeft, AudioLines, ChevronRight, ShieldAlert } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/primitives';
import { useEnvironmentalData } from '@/hooks/useEnvironmentalData';

/**
 * Environmental Sound List - Browse sound awareness practice by category
 * Safety-critical sounds are highlighted with a badge
 */

export function EnvironmentalSoundList() {
  const { categories, loading } = useEnvironmentalData();
  const prefersReducedMotion = useReducedMotion();

  if (loading) {
    return <LoadingSpinner message="Loading sounds..." />;
  }

  // Sort: safety-critical categories first
  const sorted = [...categories].sort((a, b) => {
    if (a.has_safety_critical && !b.has_safety_critical) return -1;
    if (!a.has_safety_critical && b.has_safety_critical) return 1;
    return a.category.localeCompare(b.category);
  });

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/practice"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Practice Hub</span>
          </Link>

          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
              <AudioLines className="h-7 w-7 text-green-400" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Sound Awareness</h1>
              <p className="text-slate-400 text-sm mt-1">Identify everyday sounds around you</p>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((cat, idx) => (
            <motion.div
              key={cat.category}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : idx * 0.04, duration: prefersReducedMotion ? 0 : undefined }}
            >
              <Link
                to={`/player/sound/${encodeURIComponent(cat.category)}`}
                className="block group"
              >
                <Card className="relative overflow-hidden border-2 hover:border-green-700 rounded-3xl transition-all">
                  <div className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                      <AudioLines className="h-6 w-6 text-green-400" strokeWidth={2.5} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Category Name */}
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-400 transition-colors truncate capitalize">
                        {cat.category}
                      </h3>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {cat.has_safety_critical && (
                          <div className="px-3 py-1 bg-amber-900/30 border border-amber-700/40 rounded-full flex items-center gap-1.5">
                            <ShieldAlert size={12} className="text-amber-400" />
                            <span className="text-amber-300 text-xs font-medium">Safety</span>
                          </div>
                        )}
                        <div className="px-3 py-1 bg-slate-800 rounded-full">
                          <span className="text-slate-300 text-xs font-medium">
                            {cat.total_sounds} sounds
                          </span>
                        </div>
                        <div className="px-3 py-1 bg-slate-800 rounded-full">
                          <span className="text-slate-300 text-xs font-medium">
                            ~2 min
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-green-400 transition-colors shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-500 mb-4">No sound categories found</div>
            <p className="text-slate-600 text-sm">
              Environmental sound data needs to be loaded into the database first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
