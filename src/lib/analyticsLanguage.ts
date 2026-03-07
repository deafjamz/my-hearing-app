export type AnalyticsLanguageFilter = 'all' | 'en' | 'es';

export function getProgressContentLanguage(tags: Record<string, unknown> | null | undefined): 'en' | 'es' {
  return tags?.contentLanguage === 'es' ? 'es' : 'en';
}

export function matchesAnalyticsLanguage(
  tags: Record<string, unknown> | null | undefined,
  filter: AnalyticsLanguageFilter,
): boolean {
  if (filter === 'all') {
    return true;
  }

  return getProgressContentLanguage(tags) === filter;
}
