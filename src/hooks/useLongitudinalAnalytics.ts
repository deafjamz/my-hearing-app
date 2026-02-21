import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store/UserContext';
import { format, startOfWeek, differenceInCalendarDays, subDays } from 'date-fns';

// --- Exported types ---

export interface WeeklyPoint {
  week: string;   // yyyy-MM-dd (start of week)
  accuracy: number;
  trials: number;
}

export interface MonthlyPoint {
  month: string;  // yyyy-MM
  accuracy: number;
  trials: number;
}

export interface SNRPoint {
  date: string;   // yyyy-MM-dd
  snr: number;
}

export interface ConsistencyStats {
  totalActiveDays: number;
  currentStreak: number;
  longestStreak: number;
  last30DaysActive: number;
  /** Last 7 days as booleans (index 0 = 6 days ago, index 6 = today) */
  last7Days: boolean[];
}

export interface FatigueProfile {
  earlyAccuracy: number;    // trials 1-3
  midAccuracy: number;      // trials 4-6
  lateAccuracy: number;     // trials 7-10
  showsFatigue: boolean;    // late > 10% lower than early
}

export interface ErberLevelStats {
  trials: number;
  accuracy: number;
  mastered: boolean;  // 80%+ with 20+ trials
}

export interface ErberJourney {
  detection: ErberLevelStats;
  discrimination: ErberLevelStats;
  identification: ErberLevelStats;
  comprehension: ErberLevelStats;
}

export interface LongitudinalData {
  weeklyTrend: WeeklyPoint[];
  monthlyTrend: MonthlyPoint[];
  snrProgression: SNRPoint[];
  consistency: ConsistencyStats;
  fatigue: FatigueProfile;
  erberJourney: ErberJourney;
}

// --- Raw row shape ---

interface RawRow {
  result: string;
  content_tags: Record<string, unknown> | null;
  response_time_ms: number | null;
  created_at: string;
}

// --- Erber level mapping ---

const ERBER_MAP: Record<string, keyof ErberJourney> = {
  detection: 'detection',
  rapid_fire: 'discrimination',
  gross_discrimination: 'discrimination',
  category_practice: 'identification',
  phoneme_drill: 'identification',
  session_player: 'identification',
  sentence_training: 'comprehension',
  conversation: 'comprehension',
  environmental_sound: 'detection',
  story: 'comprehension',
  scenario: 'comprehension',
  placement: 'detection', // Placement assessment — map to detection as baseline
};

// --- Hook ---

/**
 * Longitudinal analytics — lifetime data for trends, streaks, fatigue, and Erber journey.
 * Single Supabase query with no time window (all-time data).
 */
export function useLongitudinalAnalytics() {
  const { user } = useUser();
  const [data, setData] = useState<LongitudinalData | null>(null);
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
        const { data: rows, error } = await supabase
          .from('user_progress')
          .select('result, content_tags, response_time_ms, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

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

function aggregate(rows: RawRow[]): LongitudinalData {
  // Weekly buckets
  const weekMap = new Map<string, { correct: number; total: number }>();
  // Monthly buckets
  const monthMap = new Map<string, { correct: number; total: number }>();
  // SNR by date
  const snrMap = new Map<string, { sum: number; count: number }>();
  // Practice dates (for streaks)
  const practiceDates = new Set<string>();
  // Fatigue buckets
  const fatigueBuckets = { early: { correct: 0, total: 0 }, mid: { correct: 0, total: 0 }, late: { correct: 0, total: 0 } };
  // Erber levels
  const erber: Record<keyof ErberJourney, { correct: number; total: number }> = {
    detection: { correct: 0, total: 0 },
    discrimination: { correct: 0, total: 0 },
    identification: { correct: 0, total: 0 },
    comprehension: { correct: 0, total: 0 },
  };

  for (const row of rows) {
    const date = new Date(row.created_at);
    const dateStr = format(date, 'yyyy-MM-dd');
    const weekStr = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const monthStr = format(date, 'yyyy-MM');
    const isCorrect = row.result === 'correct';
    const tags = row.content_tags;

    // Practice dates
    practiceDates.add(dateStr);

    // Weekly
    const wEntry = weekMap.get(weekStr) || { correct: 0, total: 0 };
    wEntry.total++;
    if (isCorrect) wEntry.correct++;
    weekMap.set(weekStr, wEntry);

    // Monthly
    const mEntry = monthMap.get(monthStr) || { correct: 0, total: 0 };
    mEntry.total++;
    if (isCorrect) mEntry.correct++;
    monthMap.set(monthStr, mEntry);

    // SNR (from RapidFire only)
    if (tags && typeof tags.snr === 'number') {
      const sEntry = snrMap.get(dateStr) || { sum: 0, count: 0 };
      sEntry.sum += tags.snr as number;
      sEntry.count++;
      snrMap.set(dateStr, sEntry);
    }

    // Fatigue (bucket by trialNumber)
    if (tags && typeof tags.trialNumber === 'number') {
      const tn = tags.trialNumber as number;
      const bucket = tn <= 2 ? fatigueBuckets.early
        : tn <= 5 ? fatigueBuckets.mid
        : fatigueBuckets.late;
      bucket.total++;
      if (isCorrect) bucket.correct++;
    }

    // Erber journey
    if (tags && typeof tags.activityType === 'string') {
      const level = ERBER_MAP[tags.activityType as string];
      if (level) {
        erber[level].total++;
        if (isCorrect) erber[level].correct++;
      }
    }
  }

  const pct = (correct: number, total: number) =>
    total > 0 ? Math.round((correct / total) * 100) : 0;

  // Weekly trend
  const weeklyTrend: WeeklyPoint[] = Array.from(weekMap.entries())
    .map(([week, s]) => ({ week, accuracy: pct(s.correct, s.total), trials: s.total }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Monthly trend
  const monthlyTrend: MonthlyPoint[] = Array.from(monthMap.entries())
    .map(([month, s]) => ({ month, accuracy: pct(s.correct, s.total), trials: s.total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // SNR progression
  const snrProgression: SNRPoint[] = Array.from(snrMap.entries())
    .map(([date, s]) => ({ date, snr: Math.round(s.sum / s.count) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Consistency
  const consistency = computeStreaks(practiceDates);

  // Fatigue
  const earlyAcc = pct(fatigueBuckets.early.correct, fatigueBuckets.early.total);
  const midAcc = pct(fatigueBuckets.mid.correct, fatigueBuckets.mid.total);
  const lateAcc = pct(fatigueBuckets.late.correct, fatigueBuckets.late.total);
  const fatigue: FatigueProfile = {
    earlyAccuracy: earlyAcc,
    midAccuracy: midAcc,
    lateAccuracy: lateAcc,
    showsFatigue: fatigueBuckets.late.total >= 10 && earlyAcc - lateAcc > 10,
  };

  // Erber journey
  const erberJourney: ErberJourney = {
    detection: { trials: erber.detection.total, accuracy: pct(erber.detection.correct, erber.detection.total), mastered: erber.detection.total >= 20 && pct(erber.detection.correct, erber.detection.total) >= 80 },
    discrimination: { trials: erber.discrimination.total, accuracy: pct(erber.discrimination.correct, erber.discrimination.total), mastered: erber.discrimination.total >= 20 && pct(erber.discrimination.correct, erber.discrimination.total) >= 80 },
    identification: { trials: erber.identification.total, accuracy: pct(erber.identification.correct, erber.identification.total), mastered: erber.identification.total >= 20 && pct(erber.identification.correct, erber.identification.total) >= 80 },
    comprehension: { trials: erber.comprehension.total, accuracy: pct(erber.comprehension.correct, erber.comprehension.total), mastered: erber.comprehension.total >= 20 && pct(erber.comprehension.correct, erber.comprehension.total) >= 80 },
  };

  return { weeklyTrend, monthlyTrend, snrProgression, consistency, fatigue, erberJourney };
}

function computeStreaks(dates: Set<string>): ConsistencyStats {
  const sorted = Array.from(dates).sort();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Current streak (working backward from today)
  let currentStreak = 0;
  let checkDate = new Date();
  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (dates.has(dateStr)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let streak = 0;
  let prevDate: Date | null = null;
  for (const dateStr of sorted) {
    const date = new Date(dateStr);
    if (prevDate && differenceInCalendarDays(date, prevDate) === 1) {
      streak++;
    } else {
      streak = 1;
    }
    if (streak > longestStreak) longestStreak = streak;
    prevDate = date;
  }

  // Last 30 days active
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const last30 = sorted.filter(d => d >= thirtyDaysAgo);

  // Last 7 days as boolean array
  const last7Days: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
    last7Days.push(dates.has(dateStr));
  }

  return {
    totalActiveDays: sorted.length,
    currentStreak,
    longestStreak,
    last30DaysActive: last30.length,
    last7Days,
  };
}
