import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { ActivityList } from '@/pages/ActivityList';
import { RapidFire } from '@/pages/RapidFire';
import { StoryList } from '@/pages/StoryList';
import { Player } from '@/pages/Player';
import { AudioQA } from '@/pages/AudioQA';
import { Settings } from '@/pages/Settings';
import { QualityControl } from '@/pages/QualityControl';
import { ScenarioPlayer } from '@/pages/ScenarioPlayer';
import { ScenarioList } from '@/pages/ScenarioList';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/practice',
        element: <ActivityList />,
      },
      {
        path: '/practice/rapid-fire',
        element: <RapidFire />,
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
        path: '/practice/:category',
        element: <ActivityList />,
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
        path: '/qc',
        element: <QualityControl />,
      },
      {
        path: '/qa',
        element: <AudioQA />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
