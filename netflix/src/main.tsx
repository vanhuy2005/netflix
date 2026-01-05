import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Dev tools: Expose utilities to console
import './utils/clearAllCache.js'
import './utils/testCloudFunction.js'
import './utils/clearRecCache.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
