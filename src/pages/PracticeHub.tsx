import { BookOpen, Coffee, Mic2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const activities = [
  {
    id: 'rapid-fire',
    title: 'Rapid Fire',
    description: 'Train your ear with fast-paced minimal pairs.',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-600',
    path: '/practice/rapid-fire'
  },
  {
    id: 'stories',
    title: 'Interactive Stories',
    description: 'Follow narratives with comprehension checks.',
    icon: BookOpen,
    color: 'bg-purple-100 text-purple-600',
    path: '/practice/stories'
  },
  {
    id: 'scenarios',
    title: 'Everyday Scenarios',
    description: 'Practice coffee shop orders, appointments, and more.',
    icon: Coffee,
    color: 'bg-orange-100 text-orange-600',
    path: '/practice/scenarios'
  },
  {
    id: 'sentences',
    title: 'Sentence Training',
    description: 'Quick-fire sentence recognition drills.',
    icon: Mic2,
    color: 'bg-blue-100 text-blue-600',
    path: '/practice/sentences'
  }
];

export function PracticeHub() {
  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Practice Hub</h1>
        <p className="text-gray-500">Select an activity to begin.</p>
      </header>

      <div className="grid gap-4">
        {activities.map((activity) => (
          <Link 
            key={activity.id} 
            to={activity.path}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className={`p-3 rounded-lg ${activity.color}`}>
              <activity.icon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{activity.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}