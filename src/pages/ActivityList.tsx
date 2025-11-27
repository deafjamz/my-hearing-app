import { Link } from 'react-router-dom';
import { ChevronRight, Zap, BookOpen, Coffee, Mic } from 'lucide-react';

export function ActivityList() {
  const activities = [
    { 
      id: 'rapid-fire', 
      title: 'Rapid Fire', 
      description: 'Train your ear with fast-paced minimal pairs.', 
      icon: Zap, 
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400', 
      path: '/rapid-fire' 
    },
    { 
      id: 'stories', 
      title: 'Interactive Stories', 
      description: 'Follow narratives with comprehension checks.', 
      icon: BookOpen, 
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', 
      path: '/stories' 
    },
    { 
      id: 'scenarios', 
      title: 'Everyday Scenarios', 
      description: 'Practice coffee shop orders, appointments, and more.', 
      icon: Coffee, 
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', 
      path: '/scenarios' 
    },
    { 
      id: 'sentences', 
      title: 'Sentence Training', 
      description: 'Quick-fire sentence recognition drills.', 
      icon: Mic, 
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', 
      path: '/sentences' 
    },
  ];

  return (
    <div className="p-6 max-w-md mx-auto w-full">
      <h2 className="text-slate-900 dark:text-white text-2xl font-black tracking-tight mb-2">
        Practice Hub
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
        Select an activity to begin.
      </p>

      <div className="space-y-4">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={activity.path}
            className="group flex items-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
          >
            {/* Icon Container - keep existing color classes */}
            <div className={`w-14 h-14 rounded-2xl ${activity.color} flex items-center justify-center mr-4 shadow-sm shrink-0`}>
              <activity.icon size={24} strokeWidth={2.5} />
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight mb-1">
                {activity.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed opacity-90">
                {activity.description}
              </p>
            </div>

            {/* Chevron */}
            <ChevronRight 
              className="text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors ml-2 shrink-0" 
              size={24} 
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
