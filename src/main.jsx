import React from 'react'
import ReactDOM from 'react-dom/client'
import { useProgress } from '@react-three/drei'
import App from './App.jsx'
import './index.css'

useProgress.getState()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
