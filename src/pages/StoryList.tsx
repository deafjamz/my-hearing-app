import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useStoriesList } from '@/hooks/useActivityData'; // Import the new hook
import { ActivityHeader } from '@/components/ui/ActivityHeader'; // Import ActivityHeader

export function StoryList() {
  const { stories, loading } = useStoriesList(); // Use the hook

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading stories...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        <ActivityHeader title="Interactive Stories" backPath="/practice" /> {/* Using ActivityHeader */}
      </header>

      <main className="max-w-lg mx-auto w-full px-6 py-8 flex-1">
        <div className="grid gap-4">
          {stories.length === 0 ? (
            <p className="text-center text-slate-500">No stories available.</p>
          ) : (
            stories.map((story) => (
              <Link
                key={story.id}
                to={`/player/story/${story.id}`}
                className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 hover:border-teal-200 dark:hover:border-teal-800"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">
                      {story.transcript}
                    </p>
                  </div>
                  <ChevronRight 
                    className="text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors mt-1" 
                    size={20} 
                  />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
