import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { withStreamlitConnection } from "streamlit-component-lib"

const StreamlitApp = withStreamlitConnection(App)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StreamlitApp />
  </StrictMode>,
)
