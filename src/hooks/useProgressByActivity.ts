import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store/UserContext';
import { subDays } from 'date-fns';
import type { ContentType } from '@/types/database.types';

/**
 * Activity-level statistics for analytics dashboard
 */
export interface ActivityStats {
  contentType: ContentType;
  erberLevel: 'detection' | 'discrimination' | 'identification' | 'comprehension' | null;
  trials: number;
  correct: number;
  accuracy: number;
  avgResponseTimeMs: number;
  lastPlayed: string | null;
}

/**
 * Conversion funnel metrics
 */
export interface FunnelMetrics {
  visits: number;        // Page views (would need separate tracking)
  signups: number;       // Registered users
  firstTrial: number;    // Users who completed at least 1 trial
  tenTrials: number;     // Users who completed 10+ trials
  paidConversion: number; // Users who upgraded (requires payment tracking)
}

/**
 * Session duration by activity
 */
export interface SessionMetrics {
  totalSessions: number;
  totalMinutes: number;
  avgSessionMinutes: number;
  byActivity: {
    [key in ContentType]?: {
      sessions: number;
      minutes: number;
    };
  };
}

/**
 * useProgressByActivity - Analytics hook for activity-level tracking
 *
 * Provides:
 * - Accuracy breakdown by content type
 * - Accuracy breakdown by erber level
 * - Response time analytics
 * - Trend detection (improving/stable/declining)
 */
export function useProgressByActivity(days: number = 30) {
  const { user } = useUser();
  const [activityStats, setActivityStats] = useState<ActivityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        // Guest mode - limited analytics from localStorage
        setActivityStats([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const startDate = subDays(new Date(), days).toISOString();

        // Fetch all progress data for the period
        const { data, error: fetchError } = await supabase
          .from('user_progress')
          .select('content_type, result, response_time_ms, content_tags, created_at')
          .eq('user_id', user.id)
          .gte('created_at', startDate);

        if (fetchError) {
          throw fetchError;
        }

        if (!data || data.length === 0) {
          setActivityStats([]);
          setLoading(false);
          return;
        }

        // Group by content_type
        const byActivity = new Map<ContentType, {
          trials: number;
          correct: number;
          responseTimes: number[];
          erberLevels: Set<string>;
          lastPlayed: string;
        }>();

        interface ActivityEntry {
          content_type: string;
          result: string;
          response_time_ms: number | null;
          content_tags: { erberLevel?: string } | null;
          created_at: string;
        }

        (data as ActivityEntry[]).forEach((entry) => {
          const contentType = entry.content_type as ContentType;
          const isCorrect = entry.result === 'correct';
          const responseTime = entry.response_time_ms || 0;
          const erberLevel = entry.content_tags?.erberLevel || null;

          if (!byActivity.has(contentType)) {
            byActivity.set(contentType, {
              trials: 0,
              correct: 0,
              responseTimes: [],
              erberLevels: new Set(),
              lastPlayed: entry.created_at,
            });
          }

          const stats = byActivity.get(contentType)!;
          stats.trials++;
          if (isCorrect) stats.correct++;
          if (responseTime > 0) stats.responseTimes.push(responseTime);
          if (erberLevel) stats.erberLevels.add(erberLevel);
          if (entry.created_at > stats.lastPlayed) {
            stats.lastPlayed = entry.created_at;
          }
        });

        // Convert to array format
        const statsArray: ActivityStats[] = Array.from(byActivity.entries()).map(
          ([contentType, stats]) => ({
            contentType,
            erberLevel: inferErberLevel(contentType),
            trials: stats.trials,
            correct: stats.correct,
            accuracy: stats.trials > 0 ? Math.round((stats.correct / stats.trials) * 100) : 0,
            avgResponseTimeMs: stats.responseTimes.length > 0
              ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
              : 0,
            lastPlayed: stats.lastPlayed,
          })
        );

        // Sort by most recent activity
        statsArray.sort((a, b) => {
          if (!a.lastPlayed) return 1;
          if (!b.lastPlayed) return -1;
          return new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime();
        });

        setActivityStats(statsArray);
      } catch (err) {
        console.error('Failed to fetch activity stats:', err);
        setError('Failed to load activity statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, days]);

  // Computed: Overall accuracy
  const overallAccuracy = activityStats.length > 0
    ? Math.round(
        activityStats.reduce((sum, s) => sum + s.correct, 0) /
        activityStats.reduce((sum, s) => sum + s.trials, 0) * 100
      )
    : 0;

  // Computed: Weakest activity (lowest accuracy with 10+ trials)
  const weakestActivity = activityStats
    .filter(s => s.trials >= 10)
    .sort((a, b) => a.accuracy - b.accuracy)[0] || null;

  // Computed: Strongest activity
  const strongestActivity = activityStats
    .filter(s => s.trials >= 10)
    .sort((a, b) => b.accuracy - a.accuracy)[0] || null;

  // Computed: Recommended next activity based on performance
  const recommendedActivity = getRecommendedActivity(activityStats);

  return {
    activityStats,
    overallAccuracy,
    weakestActivity,
    strongestActivity,
    recommendedActivity,
    loading,
    error,
    isGuest: !user,
  };
}

/**
 * Infer Erber level from content type
 */
function inferErberLevel(contentType: ContentType): ActivityStats['erberLevel'] {
  switch (contentType) {
    case 'word':
      return 'discrimination';
    case 'sentence':
      return 'identification';
    case 'story':
    case 'scenario':
    case 'conversation':
      return 'comprehension';
    case 'environmental':
      return 'detection';
    default:
      return null;
  }
}

/**
 * Smart recommendation for next activity
 *
 * Logic:
 * 1. If struggling at current level (<60%), suggest stepping down
 * 2. If mastering current level (>85%), suggest stepping up
 * 3. Otherwise, continue current level
 */
function getRecommendedActivity(stats: ActivityStats[]): {
  activity: ContentType;
  reason: string;
} | null {
  if (stats.length === 0) {
    return {
      activity: 'word',
      reason: 'Start with word pairs to build your foundation',
    };
  }

  // Find current level based on most recent activity
  const mostRecent = stats[0];

  // If struggling (<60%) with word pairs, recommend detection
  if (mostRecent.contentType === 'word' && mostRecent.accuracy < 60 && mostRecent.trials >= 10) {
    return {
      activity: 'environmental', // Detection level - easier
      reason: 'Let\'s build confidence with sound detection first',
    };
  }

  // If mastering words (>85%), suggest sentences
  if (mostRecent.contentType === 'word' && mostRecent.accuracy > 85 && mostRecent.trials >= 20) {
    return {
      activity: 'sentence',
      reason: 'Great progress! Ready for sentence training',
    };
  }

  // If mastering sentences, suggest stories
  if (mostRecent.contentType === 'sentence' && mostRecent.accuracy > 85 && mostRecent.trials >= 20) {
    return {
      activity: 'story',
      reason: 'Excellent! Time for comprehension practice',
    };
  }

  // Default: continue with current activity
  return {
    activity: mostRecent.contentType,
    reason: 'Keep practicing to improve',
  };
}

/**
 * Hook for tracking conversion funnel (simplified)
 * Note: Full funnel tracking requires additional infrastructure
 */
export function useConversionMetrics() {
  const { user } = useUser();
  const [metrics, setMetrics] = useState<{
    hasCompletedFirstTrial: boolean;
    hasCompletedTenTrials: boolean;
    totalTrials: number;
  }>({
    hasCompletedFirstTrial: false,
    hasCompletedTenTrials: false,
    totalTrials: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;

      const { count } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setMetrics({
        hasCompletedFirstTrial: (count || 0) >= 1,
        hasCompletedTenTrials: (count || 0) >= 10,
        totalTrials: count || 0,
      });
    };

    fetchMetrics();
  }, [user]);

  return metrics;
}
