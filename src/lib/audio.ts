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

export type SpeedRate = 'normal' | '1.2x' | '1.5x';

/**
 * Transform a storage path to its speed variant equivalent.
 *
 * Examples:
 *   getSpeedVariantPath("sentences_v1/sarah/sentence_1.mp3", "1.2x")
 *   → "sentences_speed/sarah/1.2x/sentence_1.mp3"
 *
 *   getSpeedVariantPath("stories/sarah/story_v3_dl_001.mp3", "1.5x")
 *   → "stories_speed/sarah/1.5x/story_v3_dl_001.mp3"
 *
 * @param storagePath — original path (e.g. "sentences_v1/sarah/sentence_1.mp3")
 * @param speed — speed rate ('normal', '1.2x', '1.5x')
 * @returns transformed path, or original if speed is 'normal'
 */
export function getSpeedVariantPath(storagePath: string, speed: SpeedRate): string {
  if (speed === 'normal') return storagePath;

  // Split: "sentences_v1/sarah/sentence_1.mp3" → ["sentences_v1", "sarah", "sentence_1.mp3"]
  const parts = storagePath.split('/');
  if (parts.length < 3) return storagePath;

  const [prefix, voice, ...rest] = parts;
  const filename = rest.join('/');

  // Map source prefix to speed variant prefix
  const speedPrefix = prefix.startsWith('sentences') ? 'sentences_speed'
    : prefix.startsWith('stories') ? 'stories_speed'
    : `${prefix}_speed`;

  // Rate key without 'x': "1.2x" → "1.2x" (keep the x for storage path)
  return `${speedPrefix}/${voice}/${speed}/${filename}`;
}
