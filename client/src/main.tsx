import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import { Lobby } from './components/Lobby.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Lobby />
  </StrictMode>,
)
