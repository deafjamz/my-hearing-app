import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store/UserContext';
import { format, subDays } from 'date-fns';

export interface ProgressDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  snr: number; // Average SNR for that day
  trials: number; // Number of trials that day
  accuracy: number; // Percentage (0-100)
}

export interface DashboardStats {
  currentSNR: number;
  totalMinutes: number;
  totalTrials: number;
  avgAccuracy: number;
  progressData: ProgressDataPoint[];
}

/**
 * useProgressData - Abstracts data source for Dashboard
 *
 * Guest Mode: Returns data from localStorage (current SNR only)
 * Authenticated: Fetches historical data from Supabase user_progress
 */
export function useProgressData() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats>({
    currentSNR: 10,
    totalMinutes: 0,
    totalTrials: 0,
    avgAccuracy: 0,
    progressData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (!user) {
        // GUEST MODE: Read from localStorage
        const localSNR = localStorage.getItem('guest_current_snr');
        const localTrials = localStorage.getItem('guest_total_trials');

        setStats({
          currentSNR: localSNR ? parseInt(localSNR) : 10,
          totalMinutes: 0, // Can't track time for guests
          totalTrials: localTrials ? parseInt(localTrials) : 0,
          avgAccuracy: 0,
          progressData: []
        });
        setLoading(false);
        return;
      }

      // AUTHENTICATED MODE: Fetch from Supabase
      try {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

        const { data: progressData, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: true });

        if (error) {
          if (import.meta.env.DEV) console.warn('Failed to fetch progress data:', error);
          setStats({
            currentSNR: 10,
            totalMinutes: 0,
            totalTrials: 0,
            avgAccuracy: 0,
            progressData: []
          });
          setLoading(false);
          return;
        }

        if (!progressData || progressData.length === 0) {
          // No data yet - return defaults
          setStats({
            currentSNR: 10,
            totalMinutes: 0,
            totalTrials: 0,
            avgAccuracy: 0,
            progressData: []
          });
          setLoading(false);
          return;
        }

        // Process data
        const dailyData = new Map<string, {
          snrs: number[];
          trials: number;
          correct: number;
        }>();

        let totalCorrect = 0;
        let totalTrials = 0;
        const sessions = new Set<string>();

        interface ProgressEntry {
          created_at: string;
          condition_snr?: number;
          content_tags?: { snr?: number };
          is_correct?: boolean;
          result?: string;
          session_id?: string;
        }

        (progressData as ProgressEntry[]).forEach((entry) => {
          const date = format(new Date(entry.created_at), 'yyyy-MM-dd');

          // SCHEMA-AGNOSTIC: Support both v5 (user_trials) and current (user_progress)
          // v5 schema: condition_snr INTEGER (dedicated column)
          // current schema: content_tags.snr (JSONB nested)
          const snr = entry.condition_snr ?? entry.content_tags?.snr ?? 10;

          // Support both v5 (is_correct BOOLEAN) and current (result TEXT)
          const isCorrect = entry.is_correct ?? (entry.result === 'correct');

          if (!dailyData.has(date)) {
            dailyData.set(date, { snrs: [], trials: 0, correct: 0 });
          }

          const dayStats = dailyData.get(date)!;
          dayStats.snrs.push(snr);
          dayStats.trials++;
          if (isCorrect) dayStats.correct++;

          totalTrials++;
          if (isCorrect) totalCorrect++;
          if (entry.session_id) sessions.add(entry.session_id);
        });

        // Convert to chart data
        const chartData: ProgressDataPoint[] = Array.from(dailyData.entries()).map(([date, stats]) => ({
          date,
          snr: Math.round(stats.snrs.reduce((sum, val) => sum + val, 0) / stats.snrs.length),
          trials: stats.trials,
          accuracy: Math.round((stats.correct / stats.trials) * 100)
        }));

        // Get most recent SNR (schema-agnostic)
        const latestEntry = progressData[progressData.length - 1];
        const currentSNR = latestEntry?.condition_snr ?? latestEntry?.content_tags?.snr ?? 10;

        // Estimate minutes (10 trials ≈ 2-3 minutes)
        const estimatedMinutes = Math.round((totalTrials / 10) * 2.5);

        setStats({
          currentSNR,
          totalMinutes: estimatedMinutes,
          totalTrials,
          avgAccuracy: totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0,
          progressData: chartData
        });
      } catch (err) {
        console.error('Error fetching progress data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  return { stats, loading, isGuest: !user };
}
