import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './store/ThemeContext'
import { UserProvider } from './store/UserContext'
import { VoiceProvider } from '@/store/VoiceContext'

// Register Service Worker for PWA support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        // SW registered successfully
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });
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
