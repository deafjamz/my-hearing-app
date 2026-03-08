import type { TrainingLanguage } from './trainingLanguage';

export type LaunchActivityId =
  | 'detection'
  | 'gross-discrimination'
  | 'rapid-fire'
  | 'word-pairs'
  | 'categories'
  | 'sentences'
  | 'phoneme-drills'
  | 'conversations'
  | 'stories'
  | 'environmental-sounds'
  | 'scenarios'
  | 'placement';

const SPANISH_UNSUPPORTED = new Set<LaunchActivityId>([
  'placement',
  'gross-discrimination',
  'rapid-fire',
  'word-pairs',
  'categories',
  'stories',
]);

export function isActivitySupportedInLanguage(
  activityId: LaunchActivityId,
  language: TrainingLanguage,
): boolean {
  if (language === 'es') {
    return !SPANISH_UNSUPPORTED.has(activityId);
  }

  return true;
}

export function shouldUsePlacementAssessment(language: TrainingLanguage): boolean {
  return language === 'en';
}
