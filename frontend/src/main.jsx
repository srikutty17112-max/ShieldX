import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { VoiceProvider } from './context/VoiceContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <VoiceProvider>
        <App />
      </VoiceProvider>
    </AuthProvider>
  </React.StrictMode>,
)
