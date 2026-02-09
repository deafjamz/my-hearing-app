import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { WeeklyPoint, MonthlyPoint } from '@/hooks/useLongitudinalAnalytics';

interface Props {
  weeklyTrend: WeeklyPoint[];
  monthlyTrend: MonthlyPoint[];
}

/**
 * Accuracy trend over weeks or months, with toggle.
 * Uses recharts LineChart (already in bundle).
 * Self-hides if less than 2 data points.
 */
export function WeeklyTrendCard({ weeklyTrend, monthlyTrend }: Props) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

  const data = view === 'weekly' ? weeklyTrend : monthlyTrend;

  if (data.length < 2) return null;

  const chartData = data.map(d => ({
    ...d,
    label: view === 'weekly'
      ? (d as WeeklyPoint).week.slice(5) // MM-DD
      : (d as MonthlyPoint).month,       // yyyy-MM
  }));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider print:text-black">
            Progress Over Time
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 print:text-slate-600">
            Your accuracy trend
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 print:hidden">
          <button
            onClick={() => setView('weekly')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
              view === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
              view === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
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
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={{ fill: '#14b8a6', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
