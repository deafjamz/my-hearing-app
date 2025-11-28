import { useTheme } from '../../store/ThemeContext';

interface ProgressData {
  day: string;
  minutes: number;
}

interface ProgressHistoryProps {
  data?: ProgressData[]; // Optional prop
  goal?: number;         // Optional prop
  className?: string;
}

export function ProgressHistory({ 
  data = [], 
  goal = 25,
  className = "" 
}: ProgressHistoryProps) {
  
  // Safe default: Ensure we always have 7 days even if data is empty
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // If data is empty, generate zero-data for safety
  const safeData = weekDays.map(day => {
    const found = data.find(d => d.day === day);
    return found || { day, minutes: 0 };
  });

  const maxVal = Math.max(goal, ...safeData.map(d => d.minutes), 1); // Avoid div by zero

  return (
    <div className={`w-full ${className}`}>
      {/* Chart Grid */}
      <div className="grid grid-cols-7 gap-2 h-32 items-end mb-2 relative">
        {/* Goal Line */}
        <div 
          className="absolute w-full border-t border-dashed border-red-300 dark:border-red-800 z-0 opacity-50"
          style={{ bottom: `${(goal / maxVal) * 100}%` }}
        />

        {/* Bars with Tooltips */}
        {safeData.map((item, index) => {
          const heightPercent = Math.min((item.minutes / maxVal) * 100, 100);
          return (
            <div key={item.day} className="flex flex-col items-center justify-end h-full z-10">
              <div 
                className="w-full rounded-t-md transition-all duration-500 ease-out bg-purple-500/50 dark:bg-purple-600/60"
                style={{ height: `${heightPercent}%`, minHeight: item.minutes > 0 ? '4px' : '0' }}
              />
            </div>
          );
        })}
      </div>

      {/* X-Axis Labels */}
      <div className="grid grid-cols-7 gap-2">
        {safeData.map((item) => (
          <div key={item.day} className="text-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {item.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
