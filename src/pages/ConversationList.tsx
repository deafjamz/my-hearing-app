import { Link } from 'react-router-dom';
import { ChevronLeft, MessageCircle, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/primitives';
import { useConversationData } from '@/hooks/useConversationData';

/**
 * Conversation List - Browse conversation practice by category
 * Each category groups everyday exchanges for keyword identification
 */

export function ConversationList() {
  const { categories, loading } = useConversationData();
  const prefersReducedMotion = useReducedMotion();

  if (loading) {
    return <LoadingSpinner message="Loading conversations..." />;
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
            <div className="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center">
              <MessageCircle className="h-7 w-7 text-pink-400" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Conversations</h1>
              <p className="text-slate-400 text-sm mt-1">Identify keywords in everyday exchanges</p>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.category}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : idx * 0.04, duration: prefersReducedMotion ? 0 : undefined }}
            >
              <Link
                to={`/player/conversation/${encodeURIComponent(cat.category)}`}
                className="block group"
              >
                <Card className="relative overflow-hidden border-2 hover:border-pink-700 rounded-3xl transition-all">
                  <div className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-6 w-6 text-pink-400" strokeWidth={2.5} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Category Name */}
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-pink-400 transition-colors truncate capitalize">
                        {cat.category}
                      </h3>

                      {/* Count + time */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="px-3 py-1 bg-slate-800 rounded-full">
                          <span className="text-slate-300 text-xs font-medium">
                            {cat.total_conversations} conversations
                          </span>
                        </div>
                        <div className="px-3 py-1 bg-slate-800 rounded-full">
                          <span className="text-slate-300 text-xs font-medium">
                            ~2 min
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-pink-400 transition-colors shrink-0 mt-1" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-500 mb-4">No conversation categories found</div>
            <p className="text-slate-600 text-sm">
              Conversation data needs to be loaded into the database first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
