import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { ActivityList } from '@/pages/ActivityList';
import { RapidFire } from '@/pages/RapidFire';
import { Settings } from '@/pages/Settings';
import { Player } from '@/pages/Player';
import { AudioQA } from '@/pages/AudioQA';

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
        path: '/practice/:category',
        element: <ActivityList />,
      },
      {
        path: '/player/:id',
        element: <Player />,
      },
      {
        path: '/settings',
        element: <Settings />,
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
