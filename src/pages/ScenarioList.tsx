import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ChevronRight } from 'lucide-react';
import { ActivityHeader } from '@/components/ui/ActivityHeader';
import { supabase } from '@/lib/supabase';
import { Scenario } from '@/types/activity';

export function ScenarioList() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const { data, error } = await supabase
          .from('scenarios')
          .select('id, title, description, difficulty, tier')
          .order('title')
          .limit(50);

        if (error) {
          console.error("Error fetching scenarios:", error);
        } else if (data) {
          setScenarios(data as Scenario[]);
        }
      } catch (err) {
        console.error("Failed to fetch scenarios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        <ActivityHeader title="Everyday Scenarios" backPath="/practice" />
      </header>

      <main className="max-w-lg mx-auto w-full px-6 py-8 flex-1">
        {loading ? (
           <div className="text-center text-slate-500">Loading scenarios...</div>
        ) : (
          <div className="grid gap-4">
            {scenarios.map((scenario) => (
              <Link
                key={scenario.id}
                to={`/player/scenario/${scenario.id}`}
                className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 hover:border-orange-200 dark:hover:border-orange-800"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                    <Coffee size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {scenario.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">
                      {scenario.description}
                    </p>
                  </div>
                  <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-orange-500 transition-colors mt-1" />
                </div>
              </Link>
            ))}
            {scenarios.length === 0 && (
                <p className="text-center text-slate-400 mt-10">No scenarios found.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
