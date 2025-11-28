import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DailyRecord { date: string; minutes: number; }

interface UserContextType {
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  voice: string;
  setVoice: (v: string) => void;
  history: DailyRecord[];
  addToHistory: (mins: number) => void;
  // NEW: Accuracy Streak
  currentStreak: number;
  incrementStreak: () => void;
  resetStreak: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [dailyGoal, setDailyGoal] = useState<number>(() => parseInt(typeof window !== 'undefined' ? localStorage.getItem('dailyGoal') || '25' : '25'));
  const [voice, setVoice] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem('voice') || 'sarah' : 'sarah'));
  const [history, setHistory] = useState<DailyRecord[]>(() => JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('history') || '[]' : '[]'));
  
  // NEW: Streak State
  const [currentStreak, setCurrentStreak] = useState<number>(() => parseInt(typeof window !== 'undefined' ? localStorage.getItem('currentStreak') || '0' : '0'));

  // Persist Effects
  useEffect(() => { localStorage.setItem('dailyGoal', dailyGoal.toString()); }, [dailyGoal]);
  useEffect(() => { localStorage.setItem('voice', voice); }, [voice]);
  useEffect(() => { localStorage.setItem('history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('currentStreak', currentStreak.toString()); }, [currentStreak]);

  const addToHistory = (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    setHistory(prev => {
      const existing = prev.find(r => r.date === today);
      return existing 
        ? prev.map(r => r.date === today ? { ...r, minutes: r.minutes + minutes } : r)
        : [...prev, { date: today, minutes }];
    });
  };

  const incrementStreak = () => setCurrentStreak(s => s + 1);
  const resetStreak = () => setCurrentStreak(0);

  return (
    <UserContext.Provider value={{ dailyGoal, setDailyGoal, voice, setVoice, history, addToHistory, currentStreak, incrementStreak, resetStreak }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}
