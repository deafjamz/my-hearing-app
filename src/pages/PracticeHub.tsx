import { BookOpen, Coffee, Mic2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const activities = [
  {
    id: 'rapid-fire',
    title: 'Rapid Fire',
    description: 'Train your ear with fast-paced minimal pairs.',
    icon: Zap,
    color: 'bg-yellow-500/20 text-yellow-400',
    path: '/practice/rapid-fire'
  },
  {
    id: 'stories',
    title: 'Interactive Stories',
    description: 'Follow narratives with comprehension checks.',
    icon: BookOpen,
    color: 'bg-purple-500/20 text-purple-400',
    path: '/practice/stories'
  },
  {
    id: 'scenarios',
    title: 'Everyday Scenarios',
    description: 'Practice coffee shop orders, appointments, and more.',
    icon: Coffee,
    color: 'bg-orange-500/20 text-orange-400',
    path: '/practice/scenarios'
  },
  {
    id: 'sentences',
    title: 'Sentence Training',
    description: 'Quick-fire sentence recognition drills.',
    icon: Mic2,
    color: 'bg-blue-500/20 text-blue-400',
    path: '/practice/sentences'
  }
];

export function PracticeHub() {
  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Practice Hub</h1>
        <p className="text-slate-400">Select an activity to begin.</p>
      </header>

      <div className="grid gap-4">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={activity.path}
            className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-4"
          >
            <div className={`p-3 rounded-lg ${activity.color}`}>
              <activity.icon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{activity.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{activity.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}