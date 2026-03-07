import { getVoiceGender } from '@/lib/voiceGender';

export type TrainingLanguage = 'en' | 'es';

export function normalizeTrainingLanguage(value: string | null | undefined): TrainingLanguage {
  return value === 'es' ? 'es' : 'en';
}

export function getAudioVoiceKey(preferredVoice: string | null | undefined, language: TrainingLanguage): string {
  if (language === 'es') {
    return getVoiceGender(preferredVoice || undefined) === 'male' ? 'sergio' : 'roma';
  }

  return preferredVoice || 'sarah';
}

export function getScenarioComboKey(preferredVoice: string | null | undefined, language: TrainingLanguage): string {
  if (language === 'es') {
    return 'sergio_roma';
  }

  return 'multi';
}

export function applyClinicalMetadataLanguageFilter<T extends {
  filter: (column: string, operator: string, value: string) => T;
  or: (filters: string) => T;
}>(query: T, language: TrainingLanguage): T {
  if (language === 'es') {
    return query.filter('clinical_metadata->>content_language', 'eq', 'es');
  }

  // English launch content predates explicit language tagging.
  return query.or('clinical_metadata->>content_language.is.null,clinical_metadata->>content_language.eq.en');
}

export function slugifyAudioToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64) || 'item';
}
