import { Link } from 'react-router-dom';
import { ArrowLeft, Printer, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useProgressData } from '@/hooks/useProgressData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePhonemeAnalytics } from '@/hooks/usePhonemeAnalytics';
import { useLongitudinalAnalytics } from '@/hooks/useLongitudinalAnalytics';
import { useUser } from '@/store/UserContext';
import { format } from 'date-fns';
import {
  ActivityBreakdownCard,
  VoiceComparisonCard,
  PositionAnalysisCard,
  NoiseEffectivenessCard,
  ReplayInsightCard,
  PhonemeMasteryGrid,
  ConfusionPatternCard,
  ErberJourneyCard,
  WeeklyTrendCard,
  SNRProgressionCard,
  FatigueAnalysisCard,
  ExportButton,
} from '@/components/analytics';

export function ProgressReport() {
  const { stats, loading, isGuest } = useProgressData();
  const { data: analytics, loading: analyticsLoading } = useAnalytics();
  const { data: phonemeData, loading: phonemeLoading } = usePhonemeAnalytics();
  const { data: longitudinalData, loading: longitudinalLoading } = useLongitudinalAnalytics();
  const { hasAccess } = useUser();

  const canPrint = hasAccess('Premium');

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400">Loading progress data...</div>
      </div>
    );
  }

  const chartData = stats.progressData.map(d => ({
    ...d,
    label: format(new Date(d.date), 'MMM d'),
  }));

  return (
    <div className="max-w-2xl mx-auto w-full px-6 pt-6 pb-32 print:pb-8 print:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 print:mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors print:hidden"
          >
            <ArrowLeft size={20} className="text-slate-500" />
          </Link>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight print:text-black">
            Progress Report
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton phonemePairs={phonemeData?.pairs} />
          <button
            onClick={canPrint ? handlePrint : undefined}
            disabled={!canPrint}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors print:hidden ${
              canPrint
                ? 'bg-teal-500 text-white hover:bg-teal-400'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
            title={canPrint ? 'Print / Save as PDF' : 'Premium feature'}
          >
            {canPrint ? <Printer size={16} /> : <Lock size={16} />}
            Share with Audiologist
          </button>
        </div>
      </div>

      {isGuest && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">
            Sign in to track your full progress history across sessions.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:mb-6">
        <SummaryCard label="Total Exercises" value={stats.totalTrials} />
        <SummaryCard label="Avg Accuracy" value={`${stats.avgAccuracy}%`} />
        <SummaryCard
          label="Current SNR"
          value={`${stats.currentSNR > 0 ? '+' : ''}${stats.currentSNR} dB`}
        />
        <SummaryCard label="Practice Time" value={`${stats.totalMinutes} min`} />
      </div>

      {/* Accuracy Over Time Chart */}
      <section className="mb-8 print:mb-6">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1 print:text-black">
          Accuracy Over Time
        </h2>

        {chartData.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 print:border-slate-300 print:shadow-none">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#f1f5f9',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Accuracy']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar dataKey="accuracy" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm">
              No practice data yet. Complete some exercises to see your progress here.
            </p>
          </div>
        )}
      </section>

      {/* Trials Per Day */}
      {chartData.length > 0 && (
        <section className="mb-8 print:mb-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1 print:text-black">
            Daily Activity
          </h2>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 print:border-slate-300 print:shadow-none">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#f1f5f9',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value: number) => [value, 'Trials']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar dataKey="trials" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Insights */}
      {!analyticsLoading && analytics && (
        <section className="mb-8 print:mb-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1 print:text-black">
            Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActivityBreakdownCard data={analytics.byActivity} />
            <VoiceComparisonCard data={analytics.byVoice} />
            <PositionAnalysisCard data={analytics.byPosition} />
            <NoiseEffectivenessCard data={analytics.noiseComparison} />
            <ReplayInsightCard data={analytics.replayStats} totalTrials={stats.totalTrials} />
          </div>
        </section>
      )}

      {/* Sound Pattern Mastery */}
      {!phonemeLoading && phonemeData && (
        <section className="mb-8 print:mb-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1 print:text-black">
            Sound Pattern Mastery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <PhonemeMasteryGrid data={phonemeData} />
            </div>
            <ConfusionPatternCard pairs={phonemeData.strugglingPairs} />
          </div>
        </section>
      )}

      {/* Training Journey */}
      {!longitudinalLoading && longitudinalData && (
        <section className="mb-8 print:mb-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1 print:text-black">
            Training Journey
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <ErberJourneyCard journey={longitudinalData.erberJourney} />
            </div>
            <WeeklyTrendCard weeklyTrend={longitudinalData.weeklyTrend} monthlyTrend={longitudinalData.monthlyTrend} />
            <SNRProgressionCard data={longitudinalData.snrProgression} />
          </div>
        </section>
      )}

      {/* Session Intelligence */}
      {!longitudinalLoading && longitudinalData && (
        <section className="mb-8 print:mb-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1 print:text-black">
            Session Intelligence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FatigueAnalysisCard fatigue={longitudinalData.fatigue} />
          </div>
        </section>
      )}

      {/* Print footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-slate-300 text-xs text-slate-500">
        <p>Generated by SoundSteps on {new Date().toLocaleDateString()}</p>
        <p className="mt-1">
          SoundSteps is designed for hearing training and practice. It is not intended to diagnose,
          treat, cure, or prevent any medical condition.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 print:border-slate-300">
      <p className="text-2xl font-black text-slate-900 dark:text-white print:text-black">{value}</p>
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-1 print:text-slate-600">
        {label}
      </p>
    </div>
  );
}
