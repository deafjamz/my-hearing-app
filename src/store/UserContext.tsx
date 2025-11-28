import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DailyRecord {
  date: string;
  minutes: number;
}

interface UserContextType {
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  voice: string;
  setVoice: (voice: string) => void;
  history: DailyRecord[];
  todayMinutes: number;
  addToHistory: (minutes: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Goal State
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dailyGoal');
      return saved ? parseInt(saved, 10) : 25;
    }
    return 25;
  });

  // Voice State
  const [voice, setVoice] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('voice') || 'sarah';
    }
    return 'sarah';
  });

  // History State
  const [history, setHistory] = useState<DailyRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('practiceHistory');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Calculate today's minutes
  const todayMinutes = history.find(
    record => record.date === new Date().toISOString().split('T')[0]
  )?.minutes || 0;

  // Add minutes to history
  const addToHistory = (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    setHistory(current => {
      const existingIndex = current.findIndex(record => record.date === today);
      
      if (existingIndex >= 0) {
        // Update existing record
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          minutes: updated[existingIndex].minutes + minutes
        };
        return updated;
      } else {
        // Add new record
        return [...current, { date: today, minutes }];
      }
    });
  };

  // Persist changes
  useEffect(() => {
    localStorage.setItem('dailyGoal', dailyGoal.toString());
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem('voice', voice);
  }, [voice]);

  useEffect(() => {
    localStorage.setItem('practiceHistory', JSON.stringify(history));
  }, [history]);

  return (
    <UserContext.Provider value={{
      dailyGoal,
      setDailyGoal,
      voice,
      setVoice,
      history,
      todayMinutes,
      addToHistory
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
