import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for Offline PWA Capabilities
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Adam AI] ServiceWorker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Adam AI] ServiceWorker registration failed:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Register in dev/preview as well to ensure testability
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Adam AI] ServiceWorker registered in dev mode:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Adam AI] ServiceWorker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

