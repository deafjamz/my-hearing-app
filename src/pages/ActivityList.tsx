import { Link } from 'react-router-dom';
import { ChevronRight, Zap, BookOpen, Coffee, Mic, LayoutGrid, Headphones } from 'lucide-react';

export function ActivityList() {
  const activities = [
    { 
      id: 'rapid-fire', 
      title: 'Word Pairs', 
      description: 'Hear the difference between similar words.', 
      icon: Zap, 
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400', 
      path: '/practice/rapid-fire' 
    },
    { 
      id: 'stories', 
      title: 'Stories', 
      description: 'Follow along with short stories.', 
      icon: BookOpen, 
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', 
      path: '/practice/stories' 
    },
    { 
      id: 'scenarios', 
      title: 'Background Noise', 
      description: 'Focus on speech in noisy places.', 
      icon: Coffee, 
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', 
      path: '/practice/scenarios' 
    },
    { 
      id: 'sentences', 
      title: 'Sentences', 
      description: 'Practice listening to full phrases.', 
      icon: Mic, 
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', 
      path: '/practice/sentences' 
    },
  ];

  return (
    <div className="p-6 max-w-md mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
          <Headphones size={20} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Practice Hub</h1>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={activity.path}
            className="group flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm hover:border-purple-200 dark:hover:border-purple-800 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-full ${activity.color} flex items-center justify-center mr-4 shadow-sm shrink-0`}>
              <activity.icon size={24} strokeWidth={2.5} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight mb-1">
                {activity.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed">
                {activity.description}
              </p>
            </div>

            <ChevronRight 
              className="text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors ml-4 shrink-0" 
              size={20} 
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
