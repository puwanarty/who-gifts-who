import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/mali/500.css'
import '@fontsource/mali/700.css'
import './styles/global.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
