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
}