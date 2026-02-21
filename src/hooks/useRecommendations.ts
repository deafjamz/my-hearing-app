import { useMemo } from 'react';
import type { PhonemeMasteryData } from './usePhonemeAnalytics';
import type { AnalyticsData } from './useAnalytics';

// --- Exported types ---

export interface Recommendation {
  id: string;
  priority: 1 | 2 | 3;
  type: 'phoneme' | 'erber_level' | 'voice' | 'noise' | 'position' | 'consistency' | 'activity_diversity';
  title: string;
  description: string;
  actionPath?: string;
  actionLabel?: string;
  metric?: number;
}

export interface LongitudinalDataForRecs {
  erberJourney?: {
    detection: { trials: number; accuracy: number; mastered: boolean };
    discrimination: { trials: number; accuracy: number; mastered: boolean };
    identification: { trials: number; accuracy: number; mastered: boolean };
    comprehension: { trials: number; accuracy: number; mastered: boolean };
  };
  consistency?: {
    currentStreak: number;
    last30DaysActive: number;
  };
}

const MAX_RECS = 3;

/**
 * Smart recommendation engine — pure computation, no DB query.
 *
 * Generates 1-3 prioritized practice recommendations from analytics data.
 * Returns empty array when insufficient data (new users).
 */
export function useRecommendations(
  phonemeData: PhonemeMasteryData | null,
  analyticsData: AnalyticsData | null,
  longitudinalData: LongitudinalDataForRecs | null,
): { recommendations: Recommendation[] } {
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];

    // 1. Weakest phoneme pair (<70% accuracy, 10+ trials)
    if (phonemeData?.strugglingPairs.length) {
      const weakest = phonemeData.strugglingPairs[0];
      recs.push({
        id: 'phoneme-weakest',
        priority: 1,
        type: 'phoneme',
        title: `Practice "${weakest.target}" vs "${weakest.contrast}"`,
        description: `You're getting this right ${weakest.accuracy}% of the time — a little extra practice will help!`,
        actionPath: '/practice/rapid-fire',
        actionLabel: 'Start Word Pairs',
        metric: weakest.accuracy,
      });
    }

    // 2. Erber level advancement
    if (longitudinalData?.erberJourney) {
      const journey = longitudinalData.erberJourney;
      const levels = [
        { key: 'detection', label: 'Sound Detection', next: 'Sound Awareness', nextPath: '/practice/sounds', data: journey.detection },
        { key: 'discrimination', label: 'Word Pairs', next: 'Sound Contrast Drills', nextPath: '/practice/drills', data: journey.discrimination },
        { key: 'identification', label: 'Identification', next: 'Conversations', nextPath: '/practice/conversations', data: journey.identification },
      ] as const;

      for (const level of levels) {
        if (level.data.mastered && !recs.some(r => r.type === 'erber_level')) {
          // Check if next level is NOT mastered
          const nextLevelKey = levels[levels.indexOf(level) + 1]?.key;
          const nextLevel = nextLevelKey
            ? journey[nextLevelKey as keyof typeof journey]
            : journey.comprehension;

          if (nextLevel && !nextLevel.mastered) {
            recs.push({
              id: 'erber-advance',
              priority: 2,
              type: 'erber_level',
              title: `Ready for ${level.next}`,
              description: `You've mastered ${level.label}. Time to level up!`,
              actionPath: level.nextPath,
              actionLabel: 'Try It',
            });
            break;
          }
        }
      }
    }

    // 3. Voice diversity (>15% gap between male/female accuracy)
    if (analyticsData?.byVoice.length === 2) {
      const male = analyticsData.byVoice.find(v => v.voiceGender === 'male');
      const female = analyticsData.byVoice.find(v => v.voiceGender === 'female');
      if (male && female && male.trials >= 10 && female.trials >= 10) {
        const gap = Math.abs(male.accuracy - female.accuracy);
        if (gap > 15) {
          const weaker = male.accuracy < female.accuracy ? 'male' : 'female';
          recs.push({
            id: 'voice-diversity',
            priority: 2,
            type: 'voice',
            title: `Try ${weaker} voices`,
            description: `Your accuracy with ${weaker} voices is ${gap}% lower. Variety builds stronger listening skills.`,
            actionPath: '/settings',
            actionLabel: 'Change Voice',
            metric: gap,
          });
        }
      }
    }

    // 4. Noise readiness (quiet >=85%, noise not tried or <70%)
    if (analyticsData?.noiseComparison) {
      const { quiet, noise } = analyticsData.noiseComparison;
      if (quiet.trials >= 20 && quiet.accuracy >= 85) {
        if (noise.trials < 5) {
          recs.push({
            id: 'noise-ready',
            priority: 2,
            type: 'noise',
            title: 'Ready for background noise?',
            description: `Your quiet accuracy is ${quiet.accuracy}%. Training with noise builds real-world listening skills.`,
            actionPath: '/practice/rapid-fire',
            actionLabel: 'Try With Noise',
          });
        } else if (noise.accuracy < 70) {
          recs.push({
            id: 'noise-practice',
            priority: 3,
            type: 'noise',
            title: 'Build noise tolerance',
            description: `Quiet: ${quiet.accuracy}% vs Noise: ${noise.accuracy}%. Keep practicing in noise to close the gap.`,
            actionPath: '/practice/rapid-fire',
            actionLabel: 'Practice in Noise',
          });
        }
      }
    }

    // 5. Position weakness (<65% at any position with 10+ trials)
    if (analyticsData?.byPosition.length) {
      const weakPosition = analyticsData.byPosition
        .filter(p => p.trials >= 10 && p.accuracy < 65)
        .sort((a, b) => a.accuracy - b.accuracy)[0];

      if (weakPosition && !recs.some(r => r.type === 'phoneme')) {
        const posLabel = weakPosition.position === 'final' ? 'word-ending'
          : weakPosition.position === 'initial' ? 'word-starting'
          : 'mid-word';
        recs.push({
          id: 'position-weak',
          priority: 3,
          type: 'position',
          title: `Focus on ${posLabel} sounds`,
          description: `You're at ${weakPosition.accuracy}% for sounds at the ${posLabel} of words — some focused practice here will help!`,
          actionPath: '/practice/drills',
          actionLabel: 'Practice Drills',
          metric: weakPosition.accuracy,
        });
      }
    }

    // 6. Consistency nudge (no practice in 3+ days)
    if (longitudinalData?.consistency) {
      const { currentStreak, last30DaysActive } = longitudinalData.consistency;
      if (currentStreak === 0 && last30DaysActive < 20) {
        recs.push({
          id: 'consistency',
          priority: 3,
          type: 'consistency',
          title: 'Keep your streak going',
          description: 'A few minutes of daily practice makes a big difference. Jump in today!',
          actionPath: '/',
          actionLabel: 'Start Practicing',
        });
      }
    }

    // 7. Targeted drill recommendation (struggling phoneme pairs)
    if (phonemeData?.strugglingPairs && phonemeData.strugglingPairs.length >= 2
        && !recs.some(r => r.id === 'phoneme-weakest')) {
      recs.push({
        id: 'drill-targeted',
        priority: 2,
        type: 'activity_diversity',
        title: 'Try Sound Contrast Drills',
        description: `You have ${phonemeData.strugglingPairs.length} phoneme pairs that need focused practice.`,
        actionPath: '/practice/drills',
        actionLabel: 'Open Drills',
      });
    }

    // 8. Environmental sound awareness (detection level needs work)
    if (longitudinalData?.erberJourney) {
      const detection = longitudinalData.erberJourney.detection;
      if (detection.trials < 20 && !detection.mastered) {
        recs.push({
          id: 'environmental-awareness',
          priority: 2,
          type: 'activity_diversity',
          title: 'Build Sound Awareness',
          description: 'Identifying everyday sounds strengthens your listening foundation.',
          actionPath: '/practice/sounds',
          actionLabel: 'Try Sounds',
        });
      }
    }

    // 9. Conversation readiness (sentences strong but conversations untried)
    if (analyticsData?.byActivity) {
      const sentenceActivity = analyticsData.byActivity.find(a => a.activityType === 'sentence_training');
      const conversationActivity = analyticsData.byActivity.find(a => a.activityType === 'conversation');
      if (sentenceActivity && sentenceActivity.accuracy >= 80 && sentenceActivity.trials >= 20
          && (!conversationActivity || conversationActivity.trials < 10)) {
        recs.push({
          id: 'conversation-ready',
          priority: 2,
          type: 'activity_diversity',
          title: 'Ready for Conversations',
          description: `Your sentence accuracy is ${sentenceActivity.accuracy}%. Conversations are the next step!`,
          actionPath: '/practice/conversations',
          actionLabel: 'Try Conversations',
        });
      }
    }

    // Return top MAX_RECS, sorted by priority
    return recs
      .sort((a, b) => a.priority - b.priority)
      .slice(0, MAX_RECS);
  }, [phonemeData, analyticsData, longitudinalData]);

  return { recommendations };
}
