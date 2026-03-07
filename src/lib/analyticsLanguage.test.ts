import { describe, expect, it } from 'vitest';
import { getProgressContentLanguage, matchesAnalyticsLanguage } from '@/lib/analyticsLanguage';

describe('analyticsLanguage', () => {
  it('defaults missing language metadata to english', () => {
    expect(getProgressContentLanguage(null)).toBe('en');
    expect(getProgressContentLanguage(undefined)).toBe('en');
    expect(getProgressContentLanguage({})).toBe('en');
  });

  it('returns spanish for explicit spanish metadata', () => {
    expect(getProgressContentLanguage({ contentLanguage: 'es' })).toBe('es');
  });

  it('matches all rows when filter is all', () => {
    expect(matchesAnalyticsLanguage({}, 'all')).toBe(true);
    expect(matchesAnalyticsLanguage({ contentLanguage: 'es' }, 'all')).toBe(true);
  });

  it('filters english legacy rows and spanish rows correctly', () => {
    expect(matchesAnalyticsLanguage({}, 'en')).toBe(true);
    expect(matchesAnalyticsLanguage({ contentLanguage: 'es' }, 'en')).toBe(false);
    expect(matchesAnalyticsLanguage({ contentLanguage: 'es' }, 'es')).toBe(true);
  });
});
