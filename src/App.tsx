import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { ActivityList } from '@/pages/ActivityList';
import { RapidFire } from '@/pages/RapidFire';
import { StoryList } from '@/pages/StoryList';
import { Player } from '@/pages/Player';
import { Settings } from '@/pages/Settings';
import { ScenarioPlayer } from '@/pages/ScenarioPlayer';
import { ScenarioList } from '@/pages/ScenarioList';
import { StoryPlayer } from '@/pages/StoryPlayer';
import { SentenceTraining } from '@/pages/SentenceTraining';
import { Detection } from '@/pages/Detection';
import { GrossDiscrimination } from '@/pages/GrossDiscrimination';
import { ProgramLibrary } from '@/pages/ProgramLibrary';
import { ProgramDetail } from '@/pages/ProgramDetail';
import { SessionPlayer } from '@/pages/SessionPlayer';
import { CategoryLibrary } from '@/pages/CategoryLibrary';
import { CategoryPlayer } from '@/pages/CategoryPlayer';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsOfService } from '@/pages/TermsOfService';

// Dev-only page imports - tree-shaken in production
import { AudioQA } from '@/pages/AudioQA';
import { QualityControl } from '@/pages/QualityControl';
import { DatabaseTest } from '@/pages/DatabaseTest';
import { SNRMixerTest } from '@/pages/SNRMixerTest';

// Production routes
const productionRoutes = [
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/practice',
    element: <ActivityList />,
  },
  {
    path: '/categories',
    element: <CategoryLibrary />,
  },
  {
    path: '/practice/category/:category',
    element: <CategoryPlayer />,
  },
  {
    path: '/practice/rapid-fire',
    element: <RapidFire />,
  },
  {
    path: '/practice/detection',
    element: <Detection />,
  },
  {
    path: '/practice/gross-discrimination',
    element: <GrossDiscrimination />,
  },
  {
    path: '/practice/stories',
    element: <StoryList />,
  },
  {
    path: '/practice/scenarios',
    element: <ScenarioList />,
  },
  {
    path: '/scenarios',
    element: <ScenarioPlayer />,
  },
  {
    path: '/sentences',
    element: <SentenceTraining />,
  },
  {
    path: '/programs',
    element: <ProgramLibrary />,
  },
  {
    path: '/programs/:programId',
    element: <ProgramDetail />,
  },
  {
    path: '/session/:sessionId',
    element: <SessionPlayer />,
  },
  {
    path: '/practice/:category',
    element: <ActivityList />,
  },
  {
    path: '/player/story/:id',
    element: <StoryPlayer />,
  },
  {
    path: '/player/:id',
    element: <Player />,
  },
  {
    path: '/player/scenario/:id',
    element: <ScenarioPlayer />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/terms',
    element: <TermsOfService />,
  },
];

// Dev-only routes (QA tools, test pages)
const devRoutes = import.meta.env.DEV ? [
  {
    path: '/qc',
    element: <QualityControl />,
  },
  {
    path: '/qa',
    element: <AudioQA />,
  },
  {
    path: '/db-test',
    element: <DatabaseTest />,
  },
  {
    path: '/snr-test',
    element: <SNRMixerTest />,
  },
] : [];

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [...productionRoutes, ...devRoutes],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
