/**
 * Shared audio URL utilities.
 *
 * All audio is stored in Supabase Storage under the `audio` bucket.
 * These helpers centralize URL construction so storage path changes
 * only need updating in one place.
 *
 * See: docs/VOICE_LIBRARY.md
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/[\n\r\s]+/g, '').trim();

/**
 * Build a full public URL for any audio file in Supabase Storage.
 *
 * @param storagePath — path relative to the `audio` bucket root
 *   e.g. "words_v2/sarah/bat.mp3" or "sentences_v1/emma/s001.mp3"
 */
export function getStorageUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/audio/${storagePath}`;
}

/**
 * Build a public URL for a word audio file with normalization.
 *
 * Pattern: audio/words_v2/{voice}/{word}.mp3
 *
 * @param voice — voice name (e.g. "sarah", "bill")
 * @param word  — the word (will be lowercased, spaces → underscores)
 */
export function buildWordAudioUrl(voice: string, word: string): string {
  const normalized = word.toLowerCase().replace(/\s+/g, '_');
  return `${SUPABASE_URL}/storage/v1/object/public/audio/words_v2/${voice}/${normalized}.mp3`;
}
