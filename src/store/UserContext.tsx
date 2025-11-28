import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DailyRecord { date: string; minutes: number; }

interface UserContextType {
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  voice: string;
  setVoice: (voice: string) => void;
  history: DailyRecord[];
  addToHistory: (minutes: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // 1. Goal (Default 25)
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    if (typeof window !== 'undefined') return parseInt(localStorage.getItem('dailyGoal') || '25');
    return 25;
  });

  // 2. Voice (Default 'sarah')
  const [voice, setVoice] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('voice') || 'sarah';
    return 'sarah';
  });

  // 3. History (Array)
  const [history, setHistory] = useState<DailyRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Persist effects
  useEffect(() => { localStorage.setItem('dailyGoal', dailyGoal.toString()); }, [dailyGoal]);
  useEffect(() => { localStorage.setItem('voice', voice); }, [voice]);
  useEffect(() => { localStorage.setItem('history', JSON.stringify(history)); }, [history]);

  const addToHistory = (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    setHistory(prev => {
      const existing = prev.find(r => r.date === today);
      if (existing) {
        return prev.map(r => r.date === today ? { ...r, minutes: r.minutes + minutes } : r);
      }
      return [...prev, { date: today, minutes }];
    });
  };

  return (
    <UserContext.Provider value={{ dailyGoal, setDailyGoal, voice, setVoice, history, addToHistory }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}
