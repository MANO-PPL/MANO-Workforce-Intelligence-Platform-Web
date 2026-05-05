import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'material-icons/iconfont/material-icons.css'
import App from './App.jsx'
import './index.css';

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>
  // </StrictMode>,
)
