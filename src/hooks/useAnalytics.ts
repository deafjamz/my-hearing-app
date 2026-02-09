import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store/UserContext';
import { subDays, format } from 'date-fns';

/** Friendly labels for activityType values logged by Sprint 1 */
export const ACTIVITY_LABELS: Record<string, string> = {
  detection: 'Sound Detection',
  gross_discrimination: 'Word Basics',
  rapid_fire: 'Word Pairs',
  category_practice: 'Category Practice',
  sentence_training: 'Sentences',
  story: 'Stories',
  scenario: 'Scenarios',
  session_player: 'Program Sessions',
};

export interface ActivityBreakdown {
  activityType: string;
  label: string;
  trials: number;
  correct: number;
  accuracy: number;
}

export interface VoiceBreakdown {
  voiceGender: 'male' | 'female';
  trials: number;
  accuracy: number;
}

export interface PositionBreakdown {
  position: string;
  trials: number;
  accuracy: number;
}

export interface NoiseComparison {
  quiet: { trials: number; accuracy: number };
  noise: { trials: number; accuracy: number };
}

export interface ReplayStats {
  avgReplays: number;
  zeroReplayAccuracy: number;
  multiReplayAccuracy: number;
}

export interface ResponseTimeTrendPoint {
  date: string;
  avgMs: number;
}

export interface AnalyticsData {
  byActivity: ActivityBreakdown[];
  byVoice: VoiceBreakdown[];
  byPosition: PositionBreakdown[];
  noiseComparison: NoiseComparison;
  replayStats: ReplayStats;
  responseTimeTrend: ResponseTimeTrendPoint[];
}

interface RawEntry {
  result: string;
  content_tags: Record<string, unknown> | null;
  response_time_ms: number | null;
  created_at: string;
}

export function useAnalytics(days: number = 30) {
  const { user } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const cutoff = subDays(new Date(), days).toISOString();
        const { data: rows, error } = await supabase
          .from('user_progress')
          .select('result, content_tags, response_time_ms, created_at')
          .eq('user_id', user.id)
          .gte('created_at', cutoff);

        if (error || !rows || rows.length === 0) {
          setData(null);
          setLoading(false);
          return;
        }

        setData(aggregate(rows as RawEntry[]));
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user?.id, days]);

  return { data, loading };
}

function aggregate(rows: RawEntry[]): AnalyticsData {
  // --- byActivity ---
  const actMap = new Map<string, { trials: number; correct: number }>();
  // --- byVoice ---
  const voiceMap = new Map<string, { trials: number; correct: number }>();
  // --- byPosition ---
  const posMap = new Map<string, { trials: number; correct: number }>();
  // --- noise ---
  const noiseAcc = { quiet: { trials: 0, correct: 0 }, noise: { trials: 0, correct: 0 } };
  // --- replays ---
  let replaySum = 0;
  let replayCount = 0;
  let zeroReplay = { trials: 0, correct: 0 };
  let multiReplay = { trials: 0, correct: 0 };
  // --- response time ---
  const rtMap = new Map<string, { sum: number; count: number }>();

  for (const row of rows) {
    const tags = row.content_tags;
    const isCorrect = row.result === 'correct';
    const actType = (tags?.activityType as string) || null;
    const voiceGender = (tags?.voiceGender as string) || null;
    const position = (tags?.position as string) || null;
    const noiseEnabled = tags?.noiseEnabled as boolean | undefined;
    const replayCountVal = tags?.replayCount as number | undefined;

    // Activity breakdown
    if (actType) {
      const entry = actMap.get(actType) || { trials: 0, correct: 0 };
      entry.trials++;
      if (isCorrect) entry.correct++;
      actMap.set(actType, entry);
    }

    // Voice breakdown
    if (voiceGender === 'male' || voiceGender === 'female') {
      const entry = voiceMap.get(voiceGender) || { trials: 0, correct: 0 };
      entry.trials++;
      if (isCorrect) entry.correct++;
      voiceMap.set(voiceGender, entry);
    }

    // Position breakdown
    if (position) {
      const entry = posMap.get(position) || { trials: 0, correct: 0 };
      entry.trials++;
      if (isCorrect) entry.correct++;
      posMap.set(position, entry);
    }

    // Noise comparison (only when noiseEnabled is explicitly set)
    if (typeof noiseEnabled === 'boolean') {
      const bucket = noiseEnabled ? noiseAcc.noise : noiseAcc.quiet;
      bucket.trials++;
      if (isCorrect) bucket.correct++;
    }

    // Replay stats
    if (typeof replayCountVal === 'number') {
      replaySum += replayCountVal;
      replayCount++;
      if (replayCountVal === 0) {
        zeroReplay.trials++;
        if (isCorrect) zeroReplay.correct++;
      } else {
        multiReplay.trials++;
        if (isCorrect) multiReplay.correct++;
      }
    }

    // Response time trend
    if (row.response_time_ms && row.response_time_ms > 0) {
      const date = format(new Date(row.created_at), 'yyyy-MM-dd');
      const entry = rtMap.get(date) || { sum: 0, count: 0 };
      entry.sum += row.response_time_ms;
      entry.count++;
      rtMap.set(date, entry);
    }
  }

  const pct = (correct: number, trials: number) =>
    trials > 0 ? Math.round((correct / trials) * 100) : 0;

  const byActivity: ActivityBreakdown[] = Array.from(actMap.entries())
    .map(([activityType, s]) => ({
      activityType,
      label: ACTIVITY_LABELS[activityType] || activityType,
      trials: s.trials,
      correct: s.correct,
      accuracy: pct(s.correct, s.trials),
    }))
    .sort((a, b) => b.trials - a.trials);

  const byVoice: VoiceBreakdown[] = Array.from(voiceMap.entries()).map(([voiceGender, s]) => ({
    voiceGender: voiceGender as 'male' | 'female',
    trials: s.trials,
    accuracy: pct(s.correct, s.trials),
  }));

  const byPosition: PositionBreakdown[] = Array.from(posMap.entries()).map(([position, s]) => ({
    position,
    trials: s.trials,
    accuracy: pct(s.correct, s.trials),
  }));

  const noiseComparison: NoiseComparison = {
    quiet: { trials: noiseAcc.quiet.trials, accuracy: pct(noiseAcc.quiet.correct, noiseAcc.quiet.trials) },
    noise: { trials: noiseAcc.noise.trials, accuracy: pct(noiseAcc.noise.correct, noiseAcc.noise.trials) },
  };

  const replayStats: ReplayStats = {
    avgReplays: replayCount > 0 ? Math.round((replaySum / replayCount) * 10) / 10 : 0,
    zeroReplayAccuracy: pct(zeroReplay.correct, zeroReplay.trials),
    multiReplayAccuracy: pct(multiReplay.correct, multiReplay.trials),
  };

  const responseTimeTrend: ResponseTimeTrendPoint[] = Array.from(rtMap.entries())
    .map(([date, s]) => ({ date, avgMs: Math.round(s.sum / s.count) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { byActivity, byVoice, byPosition, noiseComparison, replayStats, responseTimeTrend };
}
