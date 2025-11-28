import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dailyGoal');
      return saved ? parseInt(saved, 10) : 25;
    }
    return 25;
  });

  useEffect(() => {
    localStorage.setItem('dailyGoal', dailyGoal.toString());
  }, [dailyGoal]);

  return (
    <UserContext.Provider value={{ dailyGoal, setDailyGoal }}>
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
