import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PracticeHub } from './pages/PracticeHub';
import { ActivityList } from './pages/ActivityList';
import { Settings } from './pages/Settings';
import { Player } from './pages/Player';
import { RapidFire } from './pages/RapidFire';
import { AudioQA } from './pages/AudioQA';
import { VoiceProvider } from '@/store/VoiceContext';
import { UserProvider } from '@/store/UserContext';
import { ThemeProvider } from '@/store/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <VoiceProvider>
          <Router>
            <Routes>
              <Route element={<Layout className="bg-brand-background dark:bg-brand-dark" />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/practice" element={<PracticeHub />} />
                <Route path="/practice/rapid-fire" element={<RapidFire />} />
                <Route path="/practice/:category" element={<ActivityList />} />
                <Route path="/player/:id" element={<Player />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/qa" element={<AudioQA />} />
              </Route>
            </Routes>
          </Router>
        </VoiceProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;