import { useParams, Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { useActivitiesByType } from '@/hooks/useActivityData';

export function ActivityList() {
  const { category } = useParams<{ category: 'stories' | 'scenarios' }>();
  const activities = useActivitiesByType(category || 'stories');

  const title = category === 'stories' ? 'Interactive Stories' : 'Everyday Scenarios';

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 capitalize">{title}</h1>
        <p className="text-gray-500">Select an item to practice.</p>
      </header>

      <div className="grid gap-3">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={`/player/${activity.id}`}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-primary-300 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">
                {activity.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                {activity.transcript?.substring(0, 50)}...
              </p>
            </div>
            <PlayCircle className="text-gray-300 group-hover:text-primary-500 w-6 h-6" />
          </Link>
        ))}
      </div>
    </div>
  );
}import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ActivityList() {
  const activities = [
    { id: 1, title: 'Coffee Shop', level: 'Beginner', duration: '5 min' },
    { id: 2, title: 'Doctor Visit', level: 'Intermediate', duration: '8 min' },
    // ... more activities
  ];

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-slate-900 dark:text-white text-2xl font-black tracking-tight mb-6">
        Activities
      </h1>
      
      <div className="space-y-3">
        {activities.map((activity) => (
          <Link key={activity.id} to={`/practice/${activity.id}`}>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-purple-200 dark:hover:border-purple-700 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-bold">
                    {activity.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {activity.level} • {activity.duration}
                  </p>
                </div>
                <ChevronRight className="text-slate-300 dark:text-slate-600" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
