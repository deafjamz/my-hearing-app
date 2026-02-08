import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import { RequireAuth } from '@/components/RequireAuth';
import { Dashboard } from '@/pages/Dashboard';

// Inline page loader for Suspense fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
    </div>
  );
}

// Lazy-loaded pages (named export adapter)
const ActivityList = lazy(() => import('@/pages/ActivityList').then(m => ({ default: m.ActivityList })));
const RapidFire = lazy(() => import('@/pages/RapidFire').then(m => ({ default: m.RapidFire })));
const StoryList = lazy(() => import('@/pages/StoryList').then(m => ({ default: m.StoryList })));
const Player = lazy(() => import('@/pages/Player').then(m => ({ default: m.Player })));
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));
const ScenarioPlayer = lazy(() => import('@/pages/ScenarioPlayer').then(m => ({ default: m.ScenarioPlayer })));
const ScenarioList = lazy(() => import('@/pages/ScenarioList').then(m => ({ default: m.ScenarioList })));
const StoryPlayer = lazy(() => import('@/pages/StoryPlayer').then(m => ({ default: m.StoryPlayer })));
const SentenceTraining = lazy(() => import('@/pages/SentenceTraining').then(m => ({ default: m.SentenceTraining })));
const Detection = lazy(() => import('@/pages/Detection').then(m => ({ default: m.Detection })));
const GrossDiscrimination = lazy(() => import('@/pages/GrossDiscrimination').then(m => ({ default: m.GrossDiscrimination })));
const ProgramLibrary = lazy(() => import('@/pages/ProgramLibrary').then(m => ({ default: m.ProgramLibrary })));
const ProgramDetail = lazy(() => import('@/pages/ProgramDetail').then(m => ({ default: m.ProgramDetail })));
const SessionPlayer = lazy(() => import('@/pages/SessionPlayer').then(m => ({ default: m.SessionPlayer })));
const CategoryLibrary = lazy(() => import('@/pages/CategoryLibrary').then(m => ({ default: m.CategoryLibrary })));
const CategoryPlayer = lazy(() => import('@/pages/CategoryPlayer').then(m => ({ default: m.CategoryPlayer })));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('@/pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const ProgressReport = lazy(() => import('@/pages/ProgressReport').then(m => ({ default: m.ProgressReport })));
const ResetPassword = lazy(() => import('@/pages/ResetPassword').then(m => ({ default: m.ResetPassword })));

// Dev-only page imports - lazy loaded too
const AudioQA = lazy(() => import('@/pages/AudioQA').then(m => ({ default: m.AudioQA })));
const QualityControl = lazy(() => import('@/pages/QualityControl').then(m => ({ default: m.QualityControl })));
const DatabaseTest = lazy(() => import('@/pages/DatabaseTest').then(m => ({ default: m.DatabaseTest })));
const SNRMixerTest = lazy(() => import('@/pages/SNRMixerTest').then(m => ({ default: m.SNRMixerTest })));

// Helper to wrap lazy components in Suspense
function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// Production routes
const productionRoutes = [
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/practice',
    element: <S><ActivityList /></S>,
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
    path: '/practice/detection',
    element: <S><RequireAuth><Detection /></RequireAuth></S>,
  },
  {
    path: '/practice/gross-discrimination',
    element: <S><RequireAuth><GrossDiscrimination /></RequireAuth></S>,
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
