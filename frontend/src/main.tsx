import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import OpeningPage from './OpeningPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OpeningPage/>
  </StrictMode>,
)