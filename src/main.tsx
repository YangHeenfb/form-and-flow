import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import './style.css'

createRoot(document.querySelector<HTMLDivElement>('#root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
