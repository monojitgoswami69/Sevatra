import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { NavbarProvider } from './context/NavbarContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <NavbarProvider>
        <App />
      </NavbarProvider>
    </ThemeProvider>
  </React.StrictMode>
);

