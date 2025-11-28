import { stories } from '@/data/stories';
import { scenarios } from '@/data/scenarios';
import { ActivityData } from '@/types/activity';

const allActivities = [...stories, ...scenarios];

export function useActivityData(id: string | undefined): ActivityData | null {
  if (!id) return null;
  return allActivities.find(a => a.id === id) || null;
}

export function useActivitiesByType(type: 'stories' | 'scenarios' | 'sentences') {
  if (type === 'stories') return stories;
  if (type === 'scenarios') return scenarios;
  return []; // Sentences not yet implemented
}