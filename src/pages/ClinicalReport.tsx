import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store/UserContext';
import { ActivityHeader } from '@/components/ui/ActivityHeader';

// ... (StatCard and ConfusionMatrix components remain the same for now)

export function ClinicalReport() {
  const { user, currentStreak } = useUser(); // Get streak from context
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching progress data:', error);
      } else {
        setProgressData(data);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Memoize calculations to avoid re-computing on every render
  const clinicalStats = useMemo(() => {
    if (progressData.length === 0) {
      return {
        overallAccuracy: 0,
        confusionMatrix: {},
      };
    }

    // 1. Calculate Overall Accuracy
    const gradedData = progressData.filter(d => d.result === 'correct' || d.result === 'incorrect');
    const correctCount = gradedData.filter(d => d.result === 'correct').length;
    const overallAccuracy = gradedData.length > 0 ? Math.round((correctCount / gradedData.length) * 100) : 0;

    // 2. Process Data for Confusion Matrix
    const confusionMatrix: Record<string, Record<string, number>> = {};
    const wordErrors = progressData.filter(
      d => d.content_type === 'word' && d.result === 'incorrect' && d.correct_response && d.user_response
    );

    for (const error of wordErrors) {
      const correct = error.correct_response;
      const userChoice = error.user_response;
      
      // This is a simplified example. A real implementation would need to
      // map words back to their phonemic contrasts. 
      // For now, we'll just track word-level confusions.
      if (!confusionMatrix[correct]) {
        confusionMatrix[correct] = {};
      }
      if (!confusionMatrix[correct][userChoice]) {
        confusionMatrix[correct][userChoice] = 0;
      }
      confusionMatrix[correct][userChoice]++;
    }
    
    console.log("Processed Confusion Matrix Data:", confusionMatrix);

    return { overallAccuracy, confusionMatrix };
  }, [progressData]);

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Generating report...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 border-b border-slate-200/50 dark:border-slate-800/50">
        <ActivityHeader title="Clinical Report" backPath="/dashboard" />
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard title="Overall Accuracy" value={clinicalStats.overallAccuracy} unit="%" />
          <StatCard title="Exercises Completed" value={progressData.length} />
          <StatCard title="Current Streak" value={currentStreak} unit="days" /> 
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* The data is now processed and ready for a real chart */}
          <ConfusionMatrix data={clinicalStats.confusionMatrix} />
        </div>
      </main>
    </div>
  );
}
