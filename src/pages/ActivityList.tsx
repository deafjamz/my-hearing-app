import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Zap, BookOpen, Coffee, Mic, Headphones, Ear, Volume2, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticSelection } from '@/lib/haptics';
import { useUser } from '@/store/UserContext';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthModal } from '@/components/auth/AuthModal';
import { TodaysPracticeCard } from '@/components/TodaysPracticeCard';
import { useTodaysPractice } from '@/hooks/useTodaysPractice';

interface Activity {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  color: string;
  path: string;
  badge?: string;
  requiredTier?: 'Standard' | 'Premium';
}

export function ActivityList() {
  const { user, hasAccess, loading: authLoading } = useUser();
  const navigate = useNavigate();
  const { plan: todaysPlan, loading: planLoading } = useTodaysPractice();
  const [upsellTier, setUpsellTier] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('soundsteps_welcomed');
  });

  // Auto-dismiss upsell after 3 seconds
  useEffect(() => {
    if (!upsellTier) return;
    const timer = setTimeout(() => setUpsellTier(null), 3000);
    return () => clearTimeout(timer);
  }, [upsellTier]);

  // Welcome / auth gate — first-timers and unauthenticated users
  if (!authLoading && showWelcome) {
    return (
      <>
        <WelcomeScreen
          isAuthenticated={!!user}
          onSignIn={() => setShowAuthModal(true)}
          onStart={() => {
            localStorage.setItem('soundsteps_welcomed', 'true');
            navigate('/practice/detection');
          }}
          onSkip={() => {
            localStorage.setItem('soundsteps_welcomed', 'true');
            setShowWelcome(false);
          }}
        />
        {!user && (
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} dismissible={false} />
        )}
      </>
    );
  }

  const onrampActivities: Activity[] = [
    {
      id: 'detection',
      title: 'Sound Detection',
      description: 'Did you hear a word? Yes or No.',
      icon: Ear,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      path: '/practice/detection',
      badge: 'Start Here'
    },
    {
      id: 'gross-discrimination',
      title: 'Word Basics',
      description: 'Distinguish between very different words.',
      icon: Volume2,
      color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
      path: '/practice/gross-discrimination',
      badge: 'Beginner'
    },
  ];

  const activities: Activity[] = [
    {
      id: 'word-pairs',
      title: 'Word Pairs',
      description: 'Hear the difference between similar words.',
      icon: Zap,
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
      path: '/categories'
    },
    {
      id: 'stories',
      title: 'Stories',
      description: 'Follow along with short stories.',
      icon: BookOpen,
      color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
      path: '/practice/stories',
      requiredTier: 'Standard'
    },
    {
      id: 'sentences',
      title: 'Sentences',
      description: 'Answer questions about what you heard.',
      icon: Mic,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      path: '/sentences',
      requiredTier: 'Standard'
    },
    {
      id: 'scenarios',
      title: 'Everyday Scenarios',
      description: 'Multi-speaker dialogue training with background noise.',
      icon: Coffee,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      path: '/scenarios',
      requiredTier: 'Premium'
    },
  ];

  const devUnlock = import.meta.env.VITE_DEV_UNLOCK_ALL === 'true';

  const renderCard = (activity: Activity, isOnramp: boolean) => {
    const canAccess = devUnlock || !activity.requiredTier || hasAccess(activity.requiredTier);

    const cardBase = isOnramp
      ? "group flex items-center p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/20 dark:to-cyan-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-[2rem] shadow-sm"
      : "group flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm";

    const interactiveClass = canAccess
      ? (isOnramp
          ? "hover:border-emerald-300 dark:hover:border-emerald-700 hover:scale-[1.02] transition-all cursor-pointer"
          : "hover:border-teal-200 dark:hover:border-teal-800 hover:scale-[1.02] transition-all cursor-pointer")
      : "opacity-60 cursor-pointer";

    const content = (
      <>
        <div className={`w-12 h-12 rounded-full ${activity.color} flex items-center justify-center mr-4 shadow-sm shrink-0 relative`}>
          <activity.icon size={24} strokeWidth={2.5} />
          {!canAccess && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center">
              <Lock size={10} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight">
              {activity.title}
            </h3>
            {activity.badge && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                {activity.badge}
              </span>
            )}
            {!canAccess && activity.requiredTier && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-600 text-slate-200">
                {activity.requiredTier}
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed">
            {activity.description}
          </p>
        </div>

        <ChevronRight
          className={`${isOnramp ? 'text-emerald-300 dark:text-emerald-700 group-hover:text-emerald-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-teal-500'} transition-colors ml-4 shrink-0`}
          size={20}
        />
      </>
    );

    if (canAccess) {
      return (
        <Link
          key={activity.id}
          to={activity.path}
          onClick={() => hapticSelection()}
          className={`${cardBase} ${interactiveClass}`}
        >
          {content}
        </Link>
      );
    }

    return (
      <div
        key={activity.id}
        onClick={() => {
          hapticSelection();
          setUpsellTier(activity.requiredTier || null);
        }}
        className={`${cardBase} ${interactiveClass}`}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto w-full px-6 pt-6 pb-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
          <Headphones size={20} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Practice Hub</h1>
      </div>

      {/* Today's Practice — hero card */}
      <TodaysPracticeCard plan={todaysPlan} loading={planLoading} />

      {/* Getting Started Section */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
          Getting Started
        </h2>
        <div className="space-y-3">
          {onrampActivities.map((activity) => renderCard(activity, true))}
        </div>
      </div>

      {/* Main Activities Section */}
      <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
        All Activities
      </h2>
      <div className="space-y-3">
        {activities.map((activity) => renderCard(activity, false))}
      </div>

      {/* Upsell Toast — auto-dismisses after 3s */}
      <AnimatePresence>
        {upsellTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="mt-6"
          >
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">{upsellTier} feature</p>
                <p className="text-slate-400 text-xs">Available with {upsellTier} plan</p>
              </div>
              <button
                onClick={() => setUpsellTier(null)}
                className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
