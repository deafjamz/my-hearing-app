import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store/UserContext';

// --- Exported types ---

export interface PhonemePairStats {
  target: string;
  contrast: string;
  trials: number;
  correct: number;
  accuracy: number;
  /** User picked the target word when contrast was correct */
  confusedAsTarget: number;
  /** User picked the contrast word when target was correct */
  confusedAsContrast: number;
}

export interface PhonemeMasteryData {
  /** All phoneme pairs with stats */
  pairs: PhonemePairStats[];
  /** Pairs with >=80% accuracy and 20+ trials */
  masteredPairs: PhonemePairStats[];
  /** Pairs with <60% accuracy and 10+ trials */
  strugglingPairs: PhonemePairStats[];
  /** Phoneme pairs broken down by position (initial/medial/final) */
  byPosition: Record<string, PhonemePairStats[]>;
  /** Sorted unique phoneme list (for grid axes) */
  uniquePhonemes: string[];
}

// --- Raw DB row shape ---

interface RawRow {
  result: string;
  user_response: string | null;
  correct_response: string | null;
  content_tags: Record<string, unknown> | null;
  created_at: string;
}

// --- Hook ---

/**
 * Phoneme-pair mastery analytics — lifetime data from phoneme contrast trials
 * (Word Pairs + Drill Packs).
 *
 * Queries user_progress where activityType is 'rapid_fire' or 'phoneme_drill'.
 * Computes per-phoneme-pair accuracy, confusion direction, mastery status,
 * and position breakdowns.
 */
export function usePhonemeAnalytics() {
  const { user } = useUser();
  const [data, setData] = useState<PhonemeMasteryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Single query — lifetime phoneme contrast data (Word Pairs + Drill Packs)
        const { data: rows, error } = await supabase
          .from('user_progress')
          .select('result, user_response, correct_response, content_tags, created_at')
          .eq('user_id', user.id)
          .or('content_tags->>activityType.eq.rapid_fire,content_tags->>activityType.eq.phoneme_drill');

        if (error || !rows || rows.length === 0) {
          setData(null);
          setLoading(false);
          return;
        }

        setData(aggregate(rows as RawRow[]));
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  return { data, loading };
}

// --- Aggregation ---

function aggregate(rows: RawRow[]): PhonemeMasteryData {
  // Pair key → accumulated stats
  const pairMap = new Map<string, {
    target: string;
    contrast: string;
    trials: number;
    correct: number;
    confusedAsTarget: number;
    confusedAsContrast: number;
  }>();

  // Position → pair key → stats (same shape)
  const positionMap = new Map<string, Map<string, {
    target: string;
    contrast: string;
    trials: number;
    correct: number;
    confusedAsTarget: number;
    confusedAsContrast: number;
  }>>();

  const phonemeSet = new Set<string>();

  for (const row of rows) {
    const tags = row.content_tags;
    if (!tags) continue;

    const target = (tags.targetPhoneme as string)?.trim();
    const contrast = (tags.contrastPhoneme as string)?.trim();
    if (!target || !contrast) continue;

    const isCorrect = row.result === 'correct';
    const position = (tags.position as string) || 'unknown';

    // Normalize pair key so "p|b" and "b|p" map to the same pair
    // Always use alphabetically smaller phoneme first for consistency
    const [first, second] = [target, contrast].sort();
    const pairKey = `${first}|${second}`;

    phonemeSet.add(first);
    phonemeSet.add(second);

    // --- Global pair stats ---
    if (!pairMap.has(pairKey)) {
      pairMap.set(pairKey, {
        target: first,
        contrast: second,
        trials: 0,
        correct: 0,
        confusedAsTarget: 0,
        confusedAsContrast: 0,
      });
    }
    const entry = pairMap.get(pairKey)!;
    entry.trials++;
    if (isCorrect) {
      entry.correct++;
    } else {
      // Confusion direction: compare user_response to correct_response
      // to figure out which phoneme the user actually heard
      trackConfusion(entry, row, target, contrast, first, second);
    }

    // --- Position-level stats ---
    if (!positionMap.has(position)) {
      positionMap.set(position, new Map());
    }
    const posPairMap = positionMap.get(position)!;
    if (!posPairMap.has(pairKey)) {
      posPairMap.set(pairKey, {
        target: first,
        contrast: second,
        trials: 0,
        correct: 0,
        confusedAsTarget: 0,
        confusedAsContrast: 0,
      });
    }
    const posEntry = posPairMap.get(pairKey)!;
    posEntry.trials++;
    if (isCorrect) {
      posEntry.correct++;
    } else {
      trackConfusion(posEntry, row, target, contrast, first, second);
    }
  }

  const pct = (correct: number, trials: number) =>
    trials > 0 ? Math.round((correct / trials) * 100) : 0;

  // Build pairs array
  const pairs: PhonemePairStats[] = Array.from(pairMap.values())
    .map(e => ({
      ...e,
      accuracy: pct(e.correct, e.trials),
    }))
    .sort((a, b) => b.trials - a.trials);

  // Mastered: 80%+ with 20+ trials
  const masteredPairs = pairs.filter(p => p.accuracy >= 80 && p.trials >= 20);

  // Struggling: <60% with 10+ trials
  const strugglingPairs = pairs.filter(p => p.accuracy < 60 && p.trials >= 10);

  // Position breakdown
  const byPosition: Record<string, PhonemePairStats[]> = {};
  for (const [pos, posPairs] of positionMap.entries()) {
    byPosition[pos] = Array.from(posPairs.values())
      .map(e => ({
        ...e,
        accuracy: pct(e.correct, e.trials),
      }))
      .sort((a, b) => b.trials - a.trials);
  }

  const uniquePhonemes = Array.from(phonemeSet).sort();

  return { pairs, masteredPairs, strugglingPairs, byPosition, uniquePhonemes };
}

/**
 * Track confusion direction when user answered incorrectly.
 *
 * If the user picked the word associated with the "first" phoneme (alphabetically sorted),
 * that's confusedAsTarget. If they picked the "second", that's confusedAsContrast.
 * This is a heuristic — we compare user_response against correct_response.
 * When user picked the wrong word, they heard the other phoneme's word instead.
 */
function trackConfusion(
  entry: { confusedAsTarget: number; confusedAsContrast: number },
  row: RawRow,
  originalTarget: string,
  originalContrast: string,
  first: string,
  second: string,
) {
  // If user_response === correct_response, something's off — skip
  if (!row.user_response || !row.correct_response) return;
  if (row.user_response === row.correct_response) return;

  // The user picked the wrong word. The correct answer's phoneme is what
  // they should have heard. The user's response corresponds to the other phoneme.
  // Map: which phoneme does the correct_response belong to?
  // In RapidFire, correct_response is the target word.
  // user_response is the distractor word (the other phoneme's word).
  // So the user confused the target phoneme as the contrast phoneme.
  if (originalTarget === first) {
    // Target maps to "first" (alphabetically). User picked contrast word.
    entry.confusedAsContrast++;
  } else {
    // Target maps to "second". User picked the first phoneme's word.
    entry.confusedAsTarget++;
  }
}
