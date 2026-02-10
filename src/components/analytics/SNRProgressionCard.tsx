import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import type { SNRPoint } from '@/hooks/useLongitudinalAnalytics';

const MIN_POINTS = 3;

function snrLabel(snr: number): string {
  if (snr <= 0) return 'Advanced';
  if (snr <= 10) return 'Intermediate';
  return 'Beginner';
}

/**
 * SNR difficulty progression over time.
 * Lower SNR = harder = better (speech closer to noise floor).
 * Self-hides if fewer than 3 data points.
 */
export function SNRProgressionCard({ data }: { data: SNRPoint[] }) {
  if (data.length < MIN_POINTS) return null;

  const chartData = data.map(d => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 print:text-black">
        Difficulty Progression
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 print:text-slate-600">
        How the challenge level has changed
      </p>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            reversed
            domain={[-10, 20]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#f1f5f9',
              fontSize: '0.875rem',
            }}
            formatter={(value: number) => [`${snrLabel(value)} (${value > 0 ? '+' : ''}${value} dB)`, 'Difficulty Level']}
          />
          <defs>
            <linearGradient id="snrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="snr"
            stroke="#14b8a6"
            strokeWidth={2}
            fill="url(#snrGradient)"
            dot={{ fill: '#14b8a6', r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
