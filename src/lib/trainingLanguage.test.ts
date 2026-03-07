import { describe, expect, it, vi } from 'vitest';
import {
  applyClinicalMetadataLanguageFilter,
  getAudioVoiceKey,
  normalizeTrainingLanguage,
  slugifyAudioToken,
} from './trainingLanguage';

vi.mock('@/lib/voiceGender', () => ({
  getVoiceGender: (voice?: string) => (voice === 'marcus' ? 'male' : 'female'),
}));

describe('trainingLanguage', () => {
  it('normalizes unknown values to english', () => {
    expect(normalizeTrainingLanguage(undefined)).toBe('en');
    expect(normalizeTrainingLanguage(null)).toBe('en');
    expect(normalizeTrainingLanguage('fr')).toBe('en');
    expect(normalizeTrainingLanguage('es')).toBe('es');
  });

  it('maps spanish voices to benchmarked spanish keys', () => {
    expect(getAudioVoiceKey('marcus', 'es')).toBe('sergio');
    expect(getAudioVoiceKey('sarah', 'es')).toBe('roma');
  });

  it('keeps english voices unchanged', () => {
    expect(getAudioVoiceKey('marcus', 'en')).toBe('marcus');
    expect(getAudioVoiceKey(undefined, 'en')).toBe('sarah');
  });

  it('applies spanish and english metadata filters correctly', () => {
    const filter = vi.fn().mockReturnThis();
    const or = vi.fn().mockReturnThis();
    const query = { filter, or };

    applyClinicalMetadataLanguageFilter(query, 'es');
    expect(filter).toHaveBeenCalledWith('clinical_metadata->>content_language', 'eq', 'es');

    filter.mockClear();
    or.mockClear();

    applyClinicalMetadataLanguageFilter(query, 'en');
    expect(or).toHaveBeenCalledWith(
      'clinical_metadata->>content_language.is.null,clinical_metadata->>content_language.eq.en'
    );
  });

  it('slugifies accented spanish drill tokens safely', () => {
    expect(slugifyAudioToken('camión')).toBe('camion');
    expect(slugifyAudioToken(' sí / no ')).toBe('si_no');
  });
});
