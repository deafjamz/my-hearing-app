import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ProgressDataPoint } from '@/hooks/useProgressData';
import { Card } from '@/components/primitives';

interface ProgressChartProps {
  data: ProgressDataPoint[];
}

/**
 * ProgressChart - SNR progression over time
 *
 * Clinical Note: Y-Axis is INVERTED
 * - Lower SNR (-5 dB) = Harder/Better = Higher on chart
 * - Higher SNR (+20 dB) = Easier = Lower on chart
 *
 * Design: Aura Teal (#008F86) per 20_DESIGN_TOKENS.md
 */
export function ProgressChart({ data }: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <Card variant="subtle" padding="p-0" className="flex items-center justify-center h-64 rounded-xl">
        <p className="text-slate-400 text-sm">No progress data yet. Complete some trials to see your progress!</p>
      </Card>
    );
  }

  // Invert SNR for display (lower SNR should appear higher on chart)
  const chartData = data.map(point => ({
    ...point,
    displaySNR: -point.snr, // Invert: -5 becomes +5, +20 becomes -20
    formattedDate: format(new Date(point.date), 'MMM d')
  }));

  return (
    <Card variant="subtle" className="rounded-xl">
      <h3 className="text-white font-semibold mb-4">SNR Progress (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

          <XAxis
            dataKey="formattedDate"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />

          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            domain={[-20, 10]} // Inverted domain
            ticks={[-20, -15, -10, -5, 0, 5, 10]}
            tickFormatter={(value) => `${-value} dB`} // Display original SNR value
            label={{
              value: 'SNR (dB)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#94a3b8', fontSize: '12px' }
            }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f2f2f7'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'displaySNR') {
                return [`${-value} dB`, 'SNR'];
              }
              if (name === 'accuracy') {
                return [`${value}%`, 'Accuracy'];
              }
              return [`${value}`, name];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />

          <Line
            type="monotone"
            dataKey="displaySNR"
            stroke="#008F86" // Aura Teal
            strokeWidth={3}
            dot={{ fill: '#008F86', r: 4 }}
            activeDot={{ r: 6, fill: '#008F86' }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-slate-400 text-center">
        ↑ Higher = More Difficult (Lower SNR) | ↓ Lower = Easier (Higher SNR)
      </div>
    </Card>
  );
}
