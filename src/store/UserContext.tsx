import React, { createContext, useContext, useState, useEffect } from 'react';

interface DailyStats {
  date: string; // ISO date string YYYY-MM-DD
  minutes: number;
}

interface UserContextType {
  dailyGoal: number;
  setDailyGoal: (minutes: number) => void;
  dailyProgress: number;
  setDailyProgress: (minutes: number) => void;
  weeklyHistory: DailyStats[]; // Mocked for now
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Default to 20 minutes (Clinical standard)
  const [dailyGoal, setDailyGoalState] = useState(20);
  const [dailyProgress, setDailyProgress] = useState(12); // Mock: 12 mins done today

  // Load from local storage
  useEffect(() => {
    const savedGoal = localStorage.getItem('dailyGoal');
    if (savedGoal) {
      setDailyGoalState(parseInt(savedGoal, 10));
    }
  }, []);

  const setDailyGoal = (minutes: number) => {
    setDailyGoalState(minutes);
    localStorage.setItem('dailyGoal', minutes.toString());
  };

  // Mock Data for the chart
  const weeklyHistory: DailyStats[] = [
    { date: 'Mon', minutes: 10 },
    { date: 'Tue', minutes: 25 }, // Beat goal
    { date: 'Wed', minutes: 0 },
    { date: 'Thu', minutes: dailyProgress }, // Today
    { date: 'Fri', minutes: 0 },
    { date: 'Sat', minutes: 0 },
    { date: 'Sun', minutes: 0 },
  ];

  return (
    <UserContext.Provider value={{ 
      dailyGoal, 
      setDailyGoal, 
      dailyProgress, 
      setDailyProgress, 
      weeklyHistory 
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
}import { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  dailyProgress: number;
  setDailyProgress: (progress: number) => void;
  weeklyHistory: number[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('dailyGoal');
    return saved ? parseInt(saved, 10) : 25;
  });

  const [dailyProgress, setDailyProgress] = useState(13); // Example progress
  const [weeklyHistory] = useState([15, 20, 25, 18, 22, 30, 13]); // Example data

  useEffect(() => {
    localStorage.setItem('dailyGoal', dailyGoal.toString());
  }, [dailyGoal]);

  return (
    <UserContext.Provider value={{
      dailyGoal,
      setDailyGoal,
      dailyProgress,
      setDailyProgress,
      weeklyHistory,
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
