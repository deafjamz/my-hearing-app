import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './store/ThemeContext'
import { UserProvider } from './store/UserContext'
import { VoiceProvider } from '@/store/VoiceContext'

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
