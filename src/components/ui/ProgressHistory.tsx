import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface DailyStat {
  date: string; // 'Mon', 'Tue' etc.
  minutes: number;
}

interface ProgressHistoryProps {
  data: DailyStat[];
  goal: number;
}

export function ProgressHistory({ data, goal }: ProgressHistoryProps) {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C5CE7" /> {/* Violet (Top) */}
              <stop offset="100%" stopColor="#FFD93D" /> {/* Sunshine (Bottom) */}
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            dy={10}
          />
          <Tooltip 
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <ReferenceLine y={goal} stroke="#FF6B6B" strokeDasharray="3 3" opacity={0.8} />
          <Bar dataKey="minutes" radius={[4, 4, 4, 4]} barSize={32}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.minutes >= goal ? 'url(#barGradient)' : '#e5e7eb'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}