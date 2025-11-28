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
}import { cn } from '@/lib/utils';

interface ProgressHistoryProps {
  data?: { day: string; minutes: number }[];
  goal?: number;
  className?: string;
}

export function ProgressHistory({ 
  data = [], 
  goal = 25,
  className 
}: ProgressHistoryProps) {
  // Ensure we have data to work with
  const safeData = data || [];
  const maxValue = Math.max(goal, ...safeData.map(d => d.minutes));

  // Default data if none provided
  if (safeData.length === 0) {
    safeData.push(
      ...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
        day,
        minutes: 0
      }))
    );
  }

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {/* Chart Container */}
      <div className="grid grid-cols-7 gap-2 w-full h-[160px] relative">
        {/* Goal Line */}
        <div 
          className="absolute w-full border-t-2 border-dashed border-red-300/50 dark:border-red-500/30"
          style={{ 
            top: `${Math.max(0, 100 - (goal / maxValue) * 100)}%`,
            transition: 'top 0.3s ease-out'
          }}
        />
        
        {/* Bars */}
        {safeData.map((item, index) => (
          <div key={index} className="flex flex-col justify-end h-full">
            <div 
              className="w-full bg-purple-500/90 dark:bg-purple-400/90 rounded-t-lg transition-all duration-300"
              style={{ 
                height: `${(item.minutes / maxValue) * 100}%`,
                minHeight: item.minutes > 0 ? '4px' : '0'
              }}
            />
          </div>
        ))}
      </div>

      {/* X-axis Labels */}
      <div className="grid grid-cols-7 gap-2 w-full mt-2">
        {safeData.map((item, index) => (
          <div key={index} className="text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
            {item.day}
          </div>
        ))}
      </div>
    </div>
  );
}
