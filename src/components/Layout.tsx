import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Headphones, Settings, Activity, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/store/UserContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { hapticSelection } from '@/lib/haptics';

interface LayoutProps {
  className?: string;
}

export function Layout({ className }: LayoutProps) {
  const location = useLocation();
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Headphones, label: 'Practice', path: '/practice' },
    { icon: Activity, label: 'Progress', path: '/progress' }, 
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className={cn("min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950", className)}>
      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Global Atmospheric Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px]" />
      </div>
      
      {/* Top Bar (Mobile Header) */}
      <div className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex justify-between items-center pointer-events-none">
         <div className="pointer-events-auto">
             {/* Logo or Title could go here */}
         </div>
         <button
            onClick={() => {
              hapticSelection();
              !user && setShowAuthModal(true);
            }}
            aria-label={user ? 'Account' : 'Sign in'}
            className="pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 hover:scale-105 transition-all"
         >
             {user ? (
                 <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                     {user.email?.[0].toUpperCase()}
                 </div>
             ) : (
                 <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
             )}
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-28 pt-16 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar */}
      <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 w-full z-50 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg">
        <div className="flex justify-between items-center max-w-md mx-auto px-6 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (location.pathname.startsWith('/practice') && item.path === '/practice');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => hapticSelection()}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300 py-1 px-2 rounded-lg",
                  isActive
                    ? "text-purple-400 bg-purple-500/20"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}