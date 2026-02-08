import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import {
  migrateGuestData,
  pullProgress,
  syncOfflineData,
  hasOfflineData,
  setAudioCachingEnabled,
} from '@/lib/syncService';

interface DailyRecord { date: string; seconds: number; }

// Define the user's profile, including subscription tier
interface Profile {
  id: string;
  subscription_tier: 'Free' | 'Standard' | 'Premium';
  // Add other profile fields as needed
}

interface UserContextType {
  // Auth State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;

  // Tier Access Utility
  hasAccess: (requiredTier: 'Standard' | 'Premium') => boolean;

  // Settings & Progress
  dailyGoalMinutes: number;
  setDailyGoalMinutes: (goal: number) => void;
  voice: string;
  setVoice: (v: string) => void;
  hardMode: boolean;
  setHardMode: (v: boolean) => void;
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
  const [profile, setProfile] = useState<Profile | null>(null); // Add profile state
  const [loading, setLoading] = useState(true);

  // Local State
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() => parseInt(localStorage.getItem('dailyGoalMinutes') || '25'));
  const [voice, setVoice] = useState<string>(() => (localStorage.getItem('voice') || 'sarah'));
  const [hardMode, setHardMode] = useState<boolean>(() => localStorage.getItem('hardMode') === 'true');
  const [history, setHistory] = useState<DailyRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('history') || '[]');
    } catch (e) {
      console.error('Corrupted history in localStorage, resetting:', e);
      localStorage.removeItem('history');
      return [];
    }
  });
  const [currentStreak, setCurrentStreak] = useState<number>(() => parseInt(localStorage.getItem('currentStreak') || '0'));
  
  // Active Engagement State
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isPracticing, setIsPracticing] = useState(false);
  const practiceInterval = useRef<NodeJS.Timeout | null>(null);

  // Auth Listener and Profile Fetcher
  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(userProfile);
        }
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userId = session.user.id;

        // Handle SIGNED_IN event - migrate guest data
        if (event === 'SIGNED_IN') {
          if (import.meta.env.DEV) console.log('User signed in, checking for guest data migration...');
          const result = await migrateGuestData(userId);
          if (result.success && result.mergedData) {
            if (import.meta.env.DEV) console.log('Guest data migrated:', result.mergedData);
          }
        }

        // Handle TOKEN_REFRESHED - sync any offline data
        if (event === 'TOKEN_REFRESHED' && hasOfflineData()) {
          if (import.meta.env.DEV) console.log('Token refreshed, syncing offline data...');
          const syncResult = await syncOfflineData(userId);
          if (syncResult.synced > 0) {
            if (import.meta.env.DEV) console.log(`Synced ${syncResult.synced} offline entries`);
          }
        }

        // Fetch profile
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile on auth change:', error);
        } else {
          setProfile(userProfile);

          // Enable audio caching for premium users
          if (userProfile.subscription_tier === 'Premium' || userProfile.subscription_tier === 'Standard') {
            setAudioCachingEnabled(true);
          }

          // Pull cloud data and update local state
          const cloudData = await pullProgress(userId);
          if (cloudData.success && cloudData.data) {
            setVoice(cloudData.data.preferences.voice);
            setDailyGoalMinutes(cloudData.data.preferences.dailyGoalMinutes);
            setHistory(cloudData.data.history);
            setCurrentStreak(cloudData.data.stats.streak);
          }
        }
      } else {
        // Handle SIGNED_OUT - clear sensitive data
        if (event === 'SIGNED_OUT') {
          setAudioCachingEnabled(false);
          // Keep guest data in localStorage for offline use
        }
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persist Local State
  useEffect(() => { localStorage.setItem('dailyGoalMinutes', dailyGoalMinutes.toString()); }, [dailyGoalMinutes]);
  useEffect(() => { localStorage.setItem('voice', voice); }, [voice]);
  useEffect(() => { localStorage.setItem('hardMode', hardMode.toString()); }, [hardMode]);
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

  const hasAccess = (requiredTier: 'Standard' | 'Premium'): boolean => {
    const userTier = profile?.subscription_tier?.toLowerCase();
    const required = requiredTier.toLowerCase();

    if (!userTier) return false;

    if (userTier === 'premium') return true;
    if (userTier === 'standard' && required === 'standard') return true;

    return false;
  };

  return (
    <UserContext.Provider value={{ 
      user, session, profile, loading, hasAccess,
      dailyGoalMinutes, setDailyGoalMinutes,
      voice, setVoice,
      hardMode, setHardMode,
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