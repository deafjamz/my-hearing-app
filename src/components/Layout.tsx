import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Headphones, Settings, Activity, User as UserIcon, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser } from '@/store/UserContext';
import { hapticSelection } from '@/lib/haptics';
import { AuthModal } from '@/components/auth/AuthModal';

interface LayoutProps {
  className?: string;
}

export function Layout({ className }: LayoutProps) {
  const location = useLocation();
  const { user, loading } = useUser();
  const [showAuth, setShowAuth] = useState(false);

  // Show nav on all pages except the landing page (which has its own layout)
  const isLandingPage = location.pathname === '/';
  const showChrome = !isLandingPage;

  const navItems = [
    { icon: Headphones, label: 'Practice', path: '/practice' },
    { icon: Activity, label: 'Progress', path: '/progress' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className={cn("min-h-screen flex flex-col bg-slate-950", className)}>

      {/* Global Atmospheric Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px]" />
      </div>
      
      {/* Auth Modal */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

      {/* Top Bar (Mobile Header) */}
      {showChrome && (
        <div className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex justify-between items-center pointer-events-none">
           <Link
              to="/practice"
              className="pointer-events-auto"
           >
               <img src="/logo.png" alt="SoundSteps" className="w-8 h-8 rounded-lg" />
           </Link>
           {user ? (
             <Link
                to="/settings"
                onClick={() => hapticSelection()}
                aria-label="Settings"
                className="pointer-events-auto bg-slate-900/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-slate-800 hover:scale-105 transition-all"
             >
                 <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center">
                     <UserIcon size={18} />
                 </div>
             </Link>
           ) : !loading && (
             <button
                onClick={() => { hapticSelection(); setShowAuth(true); }}
                aria-label="Sign In"
                className="pointer-events-auto bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm flex items-center gap-2 transition-all"
             >
                 <LogIn size={16} />
                 Sign In
             </button>
           )}
        </div>
      )}

      {/* Main Content */}
      <main className={cn("flex-1 relative", showChrome ? "pb-28 pt-16" : "pb-0 pt-0")}>
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

      {/* Bottom Navigation Bar — only for authenticated users */}
      {showChrome && (
        <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 w-full z-50 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md">
          <div className="flex justify-between items-center max-w-md mx-auto px-6 py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/practice'
                ? (location.pathname === '/practice' || location.pathname.startsWith('/practice/') || location.pathname.startsWith('/categories'))
                : location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => hapticSelection()}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all duration-300 py-1 px-2 rounded-lg",
                    isActive
                      ? "text-teal-400 bg-teal-500/20"
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
      )}
    </div>
  );
}