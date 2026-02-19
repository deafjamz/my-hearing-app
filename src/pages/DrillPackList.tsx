import { Link } from 'react-router-dom';
import { ChevronLeft, Target, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/primitives';
import { useDrillPackData } from '@/hooks/useDrillPackData';

/**
 * Drill Pack List - Browse phoneme drill packs by contrast type
 * Each pack focuses on a specific phoneme contrast (e.g., /p/ vs /b/)
 */

export function DrillPackList() {
  const { packs, loading } = useDrillPackData();
  const prefersReducedMotion = useReducedMotion();

  if (loading) {
    return <LoadingSpinner message="Loading drill packs..." />;
  }

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
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Target className="h-7 w-7 text-purple-400" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Phoneme Drills</h1>
              <p className="text-slate-400 text-sm mt-1">Practice hearing specific sound contrasts</p>
            </div>
          </div>
        </div>

        {/* Pack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packs.map((pack, idx) => (
            <motion.div
              key={pack.drill_pack_id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : idx * 0.04, duration: prefersReducedMotion ? 0 : undefined }}
            >
              <Link
                to={`/practice/drills/${encodeURIComponent(pack.drill_pack_id)}`}
                className="block group"
              >
                <Card className="relative overflow-hidden border-2 hover:border-purple-700 rounded-3xl transition-all">
                  <div className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Target className="h-6 w-6 text-purple-400" strokeWidth={2.5} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Pack Name */}
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors truncate">
                        {pack.pack_name}
                      </h3>

                      {/* Phoneme contrast */}
                      <p className="text-purple-400 text-sm font-mono mb-2">
                        {pack.target_phoneme} vs {pack.contrast_phoneme}
                      </p>

                      {/* Contrast type */}
                      {pack.contrast_type && (
                        <p className="text-slate-400 text-sm mb-3 leading-relaxed">
                          {pack.contrast_type}
                        </p>
                      )}

                      {/* Session info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="px-3 py-1 bg-slate-800 rounded-full">
                          <span className="text-slate-300 text-xs font-medium">
                            {pack.total_pairs} pairs
                          </span>
                        </div>
                        <div className="px-3 py-1 bg-slate-800 rounded-full">
                          <span className="text-slate-300 text-xs font-medium">
                            ~2 min
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-purple-400 transition-colors shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {packs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-500 mb-4">No drill packs found</div>
            <p className="text-slate-600 text-sm">
              Drill packs need to be loaded into the database first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
