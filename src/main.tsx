import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import './style.css'
import './styles/tokens.css'
import './styles/platform-shell.css'
import './styles/visualization-workbench.css'
import './styles/lesson-controls.css'
import './styles/modules.css'
import './styles/explorer-chrome.css'

createRoot(document.querySelector<HTMLDivElement>('#root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
