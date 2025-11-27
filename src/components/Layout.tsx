import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Headphones, Settings, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  className?: string;
}

export function Layout({ className }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Headphones, label: 'Practice', path: '/practice' },
    { icon: Activity, label: 'Progress', path: '/progress' }, // Future feature
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className={cn("flex flex-col flex-1 bg-slate-100 dark:bg-slate-950", className)}>
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] -z-10" />
      {/* Main Content Area */}
      <main className="flex-1 pb-28">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 border-t border-gray-200 bg-white/90 backdrop-blur-md shadow-lg">
        <div className="flex justify-between items-center max-w-md mx-auto px-6 py-3">
          {navItems.map((item) => {
            // Temporarily exclude 'Progress' until implemented
            if (item.path === '/progress') return null;

            const Icon = item.icon;
            const isActive = location.pathname === item.path || (location.pathname.startsWith('/practice') && item.path === '/practice');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300 py-1 px-2 rounded-lg",
                  isActive
                    ? "text-brand-primary bg-brand-primary/5 shadow-neumo-convex dark:shadow-dark-neumo-convex transform scale-115"
                    : "text-gray-600 dark:text-gray-400 hover:text-brand-dark dark:hover:text-brand-light hover:shadow-neumo-flat"
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
