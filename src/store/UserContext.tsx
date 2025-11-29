import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface DailyRecord { date: string; seconds: number; }

interface UserContextType {
  // Auth State
  user: User | null;
  session: Session | null;
  loading: boolean;

  // Settings & Progress
  dailyGoalMinutes: number;
  setDailyGoalMinutes: (goal: number) => void;
  voice: string;
  setVoice: (v: string) => void;
  history: DailyRecord[];
  
  // Active Engagement Tracking
  sessionSeconds: number;
  isPracticing: boolean;
  startPracticeSession: () => void;
  endPracticeSession: () => void;
  
  currentStreak: number;
  incrementStreak: () => void;
  resetStreak: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Local State
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() => parseInt(localStorage.getItem('dailyGoalMinutes') || '25'));
  const [voice, setVoice] = useState<string>(() => (localStorage.getItem('voice') || 'sarah'));
  const [history, setHistory] = useState<DailyRecord[]>(() => JSON.parse(localStorage.getItem('history') || '[]'));
  const [currentStreak, setCurrentStreak] = useState<number>(() => parseInt(localStorage.getItem('currentStreak') || '0'));
  
  // Active Engagement State
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isPracticing, setIsPracticing] = useState(false);
  const practiceInterval = useRef<NodeJS.Timeout | null>(null);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persist Local State
  useEffect(() => { localStorage.setItem('dailyGoalMinutes', dailyGoalMinutes.toString()); }, [dailyGoalMinutes]);
  useEffect(() => { localStorage.setItem('voice', voice); }, [voice]);
  useEffect(() => { localStorage.setItem('history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('currentStreak', currentStreak.toString()); }, [currentStreak]);

  const startPracticeSession = () => {
    if (isPracticing || practiceInterval.current) return; 
    
    setIsPracticing(true);
    practiceInterval.current = setInterval(() => {
      setSessionSeconds(prev => prev + 1); 
    }, 1000);
  };
  
  const endPracticeSession = () => {
    if (!isPracticing || !practiceInterval.current) return;
    
    setIsPracticing(false);
    clearInterval(practiceInterval.current);
    practiceInterval.current = null;
    
    if (sessionSeconds > 0) {
        const today = new Date().toISOString().split('T')[0];
        setHistory(prev => {
          const existing = prev.find(r => r.date === today);
          return existing 
            ? prev.map(r => r.date === today ? { ...r, seconds: r.seconds + sessionSeconds } : r)
            : [...prev, { date: today, seconds: sessionSeconds }];
        });
    }
    setSessionSeconds(0); 
  };
  
  const incrementStreak = () => setCurrentStreak(s => s + 1);
  const resetStreak = () => setCurrentStreak(0);

  return (
    <UserContext.Provider value={{ 
      user, session, loading,
      dailyGoalMinutes, setDailyGoalMinutes, 
      voice, setVoice, 
      history,
      sessionSeconds, isPracticing, startPracticeSession, endPracticeSession,
      currentStreak, incrementStreak, resetStreak 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}