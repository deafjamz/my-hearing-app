import { useMemo } from 'react';
import { useLongitudinalAnalytics, type ErberJourney } from './useLongitudinalAnalytics';
import { usePhonemeAnalytics } from './usePhonemeAnalytics';
import { useAnalytics } from './useAnalytics';
import { useRecommendations } from './useRecommendations';
import { useProgressData } from './useProgressData';
import { useUser } from '@/store/UserContext';
import { format } from 'date-fns';
import type { PlanStep } from './useTodaysPlan';

// --- Types ---

export interface TodaysPlan {
  steps: PlanStep[];
  todayTrials: number;
  dailyGoalMet: boolean;   // todayTrials >= 20
  streakDays: number;
  yesterdayAccuracy: number | null;
}

// --- Level-to-activity mapping ---

interface ActivityOption extends PlanStep {
  requiredTier?: 'Standard' | 'Premium';
}

const LEVEL_ACTIVITIES: Record<string, ActivityOption[]> = {
  detection: [
    { activityId: 'detection', path: '/practice/detection', label: 'Sound Detection', description: 'Did you hear a word?' },
  ],
  discrimination: [
    { activityId: 'rapid-fire', path: '/practice/rapid-fire', label: 'Word Pairs', description: 'Hear the difference between similar words' },
    { activityId: 'gross-discrimination', path: '/practice/gross-discrimination', label: 'Word Basics', description: 'Tell apart very different words' },
  ],
  identification: [
    { activityId: 'categories', path: '/categories', label: 'Word Categories', description: 'Practice with specific sound contrasts' },
    { activityId: 'sentences', path: '/sentences', label: 'Sentences', description: 'Answer questions about what you heard', requiredTier: 'Standard' },
  ],
  comprehension: [
    { activityId: 'sentences', path: '/sentences', label: 'Sentences', description: 'Answer questions about what you heard', requiredTier: 'Standard' },
    { activityId: 'stories', path: '/practice/stories', label: 'Stories', description: 'Follow along with short stories', requiredTier: 'Standard' },
    { activityId: 'scenarios', path: '/scenarios', label: 'Everyday Scenarios', description: 'Real-world dialogue with background noise', requiredTier: 'Premium' },
  ],
};

const ERBER_LEVELS = ['detection', 'discrimination', 'identification', 'comprehension'] as const;

const DAILY_GOAL = 20;

// --- Hook ---

export function useTodaysPractice(): { plan: TodaysPlan | null; loading: boolean } {
  const { hasAccess } = useUser();
  const { data: longitudinal, loading: longLoading } = useLongitudinalAnalytics();
  const { data: phonemeData, loading: phonemeLoading } = usePhonemeAnalytics();
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics();
  const { recommendations } = useRecommendations(phonemeData, analyticsData, longitudinal);
  const { stats, loading: statsLoading } = useProgressData();

  const loading = longLoading || phonemeLoading || analyticsLoading || statsLoading;

  const plan = useMemo(() => {
    if (loading) return null;

    // --- Today's trials ---
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayData = stats.progressData.find(p => p.date === today);
    const todayTrials = todayData?.trials ?? 0;
    const dailyGoalMet = todayTrials >= DAILY_GOAL;

    // --- Streak ---
    const streakDays = longitudinal?.consistency.currentStreak ?? 0;

    // --- Yesterday accuracy ---
    const progressData = stats.progressData;
    const yesterdayAccuracy = progressData.length >= 2
      ? progressData[progressData.length - 1].accuracy
      : progressData.length === 1
        ? progressData[0].accuracy
        : null;

    // --- Determine working Erber level ---
    const erber = longitudinal?.erberJourney;
    const workingLevel = getWorkingLevel(erber);

    // --- Build 2-step plan ---
    const step1 = pickActivity(workingLevel, hasAccess, recommendations);
    const stretchLevel = getStretchLevel(workingLevel);
    let step2 = pickActivity(stretchLevel, hasAccess, recommendations, step1.activityId);

    // If stretch couldn't find anything different, pick alternate at working level
    if (step2.activityId === step1.activityId) {
      step2 = pickAlternate(workingLevel, hasAccess, step1.activityId);
    }

    const steps: PlanStep[] = [
      { activityId: step1.activityId, path: step1.path, label: step1.label, description: step1.description },
      { activityId: step2.activityId, path: step2.path, label: step2.label, description: step2.description },
    ];

    return { steps, todayTrials, dailyGoalMet, streakDays, yesterdayAccuracy };
  }, [loading, longitudinal, stats, hasAccess, recommendations]);

  return { plan, loading };
}

// --- Helpers ---

function getWorkingLevel(erber: ErberJourney | undefined): string {
  // Before checking Erber journey, check placement assessment result
  const placementRaw = localStorage.getItem('soundsteps_placement');
  if (placementRaw && !erber) {
    try {
      const placement = JSON.parse(placementRaw);
      if (placement.level && ERBER_LEVELS.includes(placement.level)) {
        return placement.level;
      }
    } catch { /* fall through to default */ }
  }

  if (!erber) return 'detection';

  // Find highest level NOT yet mastered
  for (const level of ERBER_LEVELS) {
    const data = erber[level];
    if (!data.mastered) return level;
  }
  // All mastered — work on comprehension
  return 'comprehension';
}

function getStretchLevel(workingLevel: string): string {
  const idx = ERBER_LEVELS.indexOf(workingLevel as typeof ERBER_LEVELS[number]);
  if (idx < 0 || idx >= ERBER_LEVELS.length - 1) return workingLevel;
  return ERBER_LEVELS[idx + 1];
}

function pickActivity(
  level: string,
  hasAccess: (tier: 'Standard' | 'Premium') => boolean,
  recommendations: { actionPath?: string }[],
  excludeId?: string,
): ActivityOption {
  const options = LEVEL_ACTIVITIES[level] || LEVEL_ACTIVITIES.detection;

  // Filter to accessible activities
  const accessible = options.filter(o => {
    if (o.requiredTier && !hasAccess(o.requiredTier)) return false;
    if (excludeId && o.activityId === excludeId) return false;
    return true;
  });

  if (accessible.length === 0) {
    // Fall back to detection if nothing accessible
    return LEVEL_ACTIVITIES.detection[0];
  }

  // Prefer activity matching top recommendation
  if (recommendations.length > 0) {
    const recPath = recommendations[0].actionPath;
    const match = accessible.find(a => a.path === recPath);
    if (match) return match;
  }

  return accessible[0];
}

function pickAlternate(
  level: string,
  hasAccess: (tier: 'Standard' | 'Premium') => boolean,
  excludeId: string,
): ActivityOption {
  const options = LEVEL_ACTIVITIES[level] || LEVEL_ACTIVITIES.detection;
  const accessible = options.filter(o => {
    if (o.requiredTier && !hasAccess(o.requiredTier)) return false;
    if (o.activityId === excludeId) return false;
    return true;
  });

  if (accessible.length > 0) return accessible[0];

  // Try one level down for variety
  const idx = ERBER_LEVELS.indexOf(level as typeof ERBER_LEVELS[number]);
  if (idx > 0) {
    const lowerLevel = ERBER_LEVELS[idx - 1];
    const lowerOptions = LEVEL_ACTIVITIES[lowerLevel] || [];
    const lowerAccessible = lowerOptions.filter(o => {
      if (o.requiredTier && !hasAccess(o.requiredTier)) return false;
      if (o.activityId === excludeId) return false;
      return true;
    });
    if (lowerAccessible.length > 0) return lowerAccessible[0];
  }

  // Absolute fallback
  return LEVEL_ACTIVITIES.detection[0];
}
