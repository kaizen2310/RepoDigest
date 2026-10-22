import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import { schedulePosthogInitialization } from './lib/posthog.js'
import App from './App.jsx'

schedulePosthogInitialization()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="repodigest-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
