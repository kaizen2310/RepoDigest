import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { schedulePosthogInitialization } from './lib/posthog.js'
import App from './App.jsx'

schedulePosthogInitialization()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
