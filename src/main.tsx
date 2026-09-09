import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './core/auth/AuthContext';
import './index.css';
import './theme.css';
import './features/features.css';

const root = document.getElementById('root');
if (!root) throw new Error('Adam root element is missing');
createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
