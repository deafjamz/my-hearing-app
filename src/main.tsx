import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './store/ThemeContext'
import { UserProvider } from './store/UserContext'
import { VoiceProvider } from '@/store/VoiceContext'

// Register Service Worker with update detection
// See docs/SW_DEPLOYMENT_GUIDE.md for cache-busting strategy
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let isReloading = false; // Guard against infinite reload loops

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates every 60 seconds
        setInterval(() => registration.update(), 60_000);

        // Detect when a new SW is waiting to activate
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              if (!isReloading) {
                isReloading = true;
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });
  });

  // If the SW controller changes (new SW took over), reload once
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isReloading) {
      isReloading = true;
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <UserProvider>
        <VoiceProvider>
          <App />
        </VoiceProvider>
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
