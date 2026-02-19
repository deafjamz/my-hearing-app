import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
const Dashboard = namedLazy(() => import('@/pages/Dashboard'), 'Dashboard');

// Inline page loader for Suspense fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
    </div>
  );
}

// Route-level error fallback — catches chunk load failures inside React Router
function RouteErrorFallback() {
  const error = useRouteError() as Error;
  const msg = error?.message || '';
  const isChunk =
    msg.includes('dynamically imported module') ||
    msg.includes('Failed to fetch') ||
    msg.includes('Loading chunk');

  if (isChunk) {
    const key = 'chunk_reload';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      window.location.reload();
      return null;
    }
    sessionStorage.removeItem(key);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">
          {isChunk ? 'App Updated' : 'Something went wrong'}
        </h1>
        <p className="text-slate-400">
          {isChunk
            ? 'A new version of SoundSteps is available. Please refresh to continue.'
            : 'The app ran into an unexpected error.'}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-400"
          >
            Refresh
          </button>
          <button
            onClick={() => window.location.assign('/')}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

// Retry wrapper for lazy imports — handles stale chunks after deploy
function lazyRetry<T extends { default: React.ComponentType }>(
  factory: () => Promise<T>
): React.LazyExoticComponent<T['default']> {
  return lazy(() =>
    factory().catch(() => {
      // Chunk failed to load (stale deploy) — reload once
      const key = 'chunk_reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return new Promise(() => {}); // Never resolves (page is reloading)
      }
      sessionStorage.removeItem(key);
      return factory(); // Second attempt after reload
    })
  );
}

// Named export adapter with retry
function namedLazy<M, K extends keyof M>(
  importFn: () => Promise<M>,
  name: K
) {
  return lazyRetry(() => importFn().then(m => ({ default: m[name] as React.ComponentType })));
}

// Lazy-loaded pages (named export adapter with stale-chunk retry)
const LandingPage = namedLazy(() => import('@/pages/LandingPage'), 'LandingPage');
const ActivityList = namedLazy(() => import('@/pages/ActivityList'), 'ActivityList');
const RapidFire = namedLazy(() => import('@/pages/RapidFire'), 'RapidFire');
const StoryList = namedLazy(() => import('@/pages/StoryList'), 'StoryList');
const Player = namedLazy(() => import('@/pages/Player'), 'Player');
const Settings = namedLazy(() => import('@/pages/Settings'), 'Settings');
const ScenarioPlayer = namedLazy(() => import('@/pages/ScenarioPlayer'), 'ScenarioPlayer');
const ScenarioList = namedLazy(() => import('@/pages/ScenarioList'), 'ScenarioList');
const StoryPlayer = namedLazy(() => import('@/pages/StoryPlayer'), 'StoryPlayer');
const SentenceTraining = namedLazy(() => import('@/pages/SentenceTraining'), 'SentenceTraining');
const Detection = namedLazy(() => import('@/pages/Detection'), 'Detection');
const GrossDiscrimination = namedLazy(() => import('@/pages/GrossDiscrimination'), 'GrossDiscrimination');
const ProgramLibrary = namedLazy(() => import('@/pages/ProgramLibrary'), 'ProgramLibrary');
const ProgramDetail = namedLazy(() => import('@/pages/ProgramDetail'), 'ProgramDetail');
const SessionPlayer = namedLazy(() => import('@/pages/SessionPlayer'), 'SessionPlayer');
const CategoryLibrary = namedLazy(() => import('@/pages/CategoryLibrary'), 'CategoryLibrary');
const CategoryPlayer = namedLazy(() => import('@/pages/CategoryPlayer'), 'CategoryPlayer');
const DrillPackList = namedLazy(() => import('@/pages/DrillPackList'), 'DrillPackList');
const DrillPackPlayer = namedLazy(() => import('@/pages/DrillPackPlayer'), 'DrillPackPlayer');
const ConversationList = namedLazy(() => import('@/pages/ConversationList'), 'ConversationList');
const ConversationPlayer = namedLazy(() => import('@/pages/ConversationPlayer'), 'ConversationPlayer');
const EnvironmentalSoundList = namedLazy(() => import('@/pages/EnvironmentalSoundList'), 'EnvironmentalSoundList');
const EnvironmentalSoundPlayer = namedLazy(() => import('@/pages/EnvironmentalSoundPlayer'), 'EnvironmentalSoundPlayer');
const PrivacyPolicy = namedLazy(() => import('@/pages/PrivacyPolicy'), 'PrivacyPolicy');
const TermsOfService = namedLazy(() => import('@/pages/TermsOfService'), 'TermsOfService');
const ProgressReport = namedLazy(() => import('@/pages/ProgressReport'), 'ProgressReport');
const ResetPassword = namedLazy(() => import('@/pages/ResetPassword'), 'ResetPassword');
const PlacementAssessment = namedLazy(() => import('@/pages/PlacementAssessment'), 'PlacementAssessment');

// Dev-only page imports
const AudioQA = namedLazy(() => import('@/pages/AudioQA'), 'AudioQA');
const QualityControl = namedLazy(() => import('@/pages/QualityControl'), 'QualityControl');
const DatabaseTest = namedLazy(() => import('@/pages/DatabaseTest'), 'DatabaseTest');
const SNRMixerTest = namedLazy(() => import('@/pages/SNRMixerTest'), 'SNRMixerTest');

// Helper to wrap lazy components in Suspense
function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// Production routes
const productionRoutes = [
  {
    path: '/',
    element: <S><LandingPage /></S>,
  },
  {
    path: '/practice',
    element: <S><ActivityList /></S>,
  },
  {
    path: '/dashboard',
    element: <S><Dashboard /></S>,
  },
  {
    path: '/categories',
    element: <S><CategoryLibrary /></S>,
  },
  {
    path: '/practice/category/:category',
    element: <S><RequireAuth><CategoryPlayer /></RequireAuth></S>,
  },
  {
    path: '/practice/rapid-fire',
    element: <S><RequireAuth><RapidFire /></RequireAuth></S>,
  },
  {
    path: '/placement',
    element: <S><RequireAuth><PlacementAssessment /></RequireAuth></S>,
  },
  {
    path: '/practice/detection',
    element: <S><RequireAuth><Detection /></RequireAuth></S>,
  },
  {
    path: '/practice/gross-discrimination',
    element: <S><RequireAuth><GrossDiscrimination /></RequireAuth></S>,
  },
  {
    path: '/practice/drills',
    element: <S><RequireAuth><DrillPackList /></RequireAuth></S>,
  },
  {
    path: '/practice/drills/:packId',
    element: <S><RequireAuth><DrillPackPlayer /></RequireAuth></S>,
  },
  {
    path: '/practice/conversations',
    element: <S><RequireAuth><ConversationList /></RequireAuth></S>,
  },
  {
    path: '/player/conversation/:category',
    element: <S><RequireAuth><ConversationPlayer /></RequireAuth></S>,
  },
  {
    path: '/practice/sounds',
    element: <S><RequireAuth><EnvironmentalSoundList /></RequireAuth></S>,
  },
  {
    path: '/player/sound/:category',
    element: <S><RequireAuth><EnvironmentalSoundPlayer /></RequireAuth></S>,
  },
  {
    path: '/practice/stories',
    element: <S><RequireAuth><StoryList /></RequireAuth></S>,
  },
  {
    path: '/practice/scenarios',
    element: <S><RequireAuth><ScenarioList /></RequireAuth></S>,
  },
  {
    path: '/scenarios',
    element: <S><RequireAuth><ScenarioPlayer /></RequireAuth></S>,
  },
  {
    path: '/sentences',
    element: <S><RequireAuth><SentenceTraining /></RequireAuth></S>,
  },
  {
    path: '/programs',
    element: <S><ProgramLibrary /></S>,
  },
  {
    path: '/programs/:programId',
    element: <S><ProgramDetail /></S>,
  },
  {
    path: '/session/:sessionId',
    element: <S><RequireAuth><SessionPlayer /></RequireAuth></S>,
  },
  {
    path: '/practice/:category',
    element: <S><ActivityList /></S>,
  },
  {
    path: '/player/story/:id',
    element: <S><RequireAuth><StoryPlayer /></RequireAuth></S>,
  },
  {
    path: '/player/:id',
    element: <S><RequireAuth><Player /></RequireAuth></S>,
  },
  {
    path: '/player/scenario/:id',
    element: <S><RequireAuth><ScenarioPlayer /></RequireAuth></S>,
  },
  {
    path: '/settings',
    element: <S><Settings /></S>,
  },
  {
    path: '/privacy',
    element: <S><PrivacyPolicy /></S>,
  },
  {
    path: '/terms',
    element: <S><TermsOfService /></S>,
  },
  {
    path: '/progress',
    element: <S><ProgressReport /></S>,
  },
  {
    path: '/reset-password',
    element: <S><ResetPassword /></S>,
  },
];

// Dev-only routes (QA tools, test pages)
const devRoutes = import.meta.env.DEV ? [
  {
    path: '/qc',
    element: <S><QualityControl /></S>,
  },
  {
    path: '/qa',
    element: <S><AudioQA /></S>,
  },
  {
    path: '/db-test',
    element: <S><DatabaseTest /></S>,
  },
  {
    path: '/snr-test',
    element: <S><SNRMixerTest /></S>,
  },
] : [];

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteErrorFallback />,
    children: [...productionRoutes, ...devRoutes],
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
