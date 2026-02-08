/**
 * Sync Service — Stub Implementation
 *
 * These are no-op stubs that unblock the build. Each function returns
 * a safe default so the app works in guest/offline mode.
 *
 * TODO: Replace with real cloud sync when ready.
 */

/** Migrate guest localStorage data to authenticated user's cloud profile */
export async function migrateGuestData(userId: string): Promise<{
  success: boolean;
  mergedData?: Record<string, unknown>;
}> {
  if (import.meta.env.DEV) console.log('[syncService] migrateGuestData stub called for', userId);
  return { success: false };
}

/** Pull progress data from Supabase for authenticated user */
export async function pullProgress(userId: string): Promise<{
  success: boolean;
  data?: {
    preferences: { voice: string; dailyGoalMinutes: number };
    history: { date: string; seconds: number }[];
    stats: { streak: number };
  };
}> {
  if (import.meta.env.DEV) console.log('[syncService] pullProgress stub called for', userId);
  return { success: false };
}

/** Sync any offline-queued data to the cloud */
export async function syncOfflineData(userId: string): Promise<{
  synced: number;
}> {
  if (import.meta.env.DEV) console.log('[syncService] syncOfflineData stub called for', userId);
  return { synced: 0 };
}

/** Check if there's offline data waiting to sync */
export function hasOfflineData(): boolean {
  return false;
}

/** Enable/disable audio caching for premium users */
export function setAudioCachingEnabled(enabled: boolean): void {
  if (import.meta.env.DEV) console.log('[syncService] Audio caching', enabled ? 'enabled' : 'disabled');
}
