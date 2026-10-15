import { StrictMode } from 'react';

import App from '@/app/App';

import { createRoot } from 'react-dom/client';

import './globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
