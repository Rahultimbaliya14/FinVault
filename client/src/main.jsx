import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import App from './App.jsx';

// Restores the real path after the 404.html GitHub Pages redirect trick.
// If 404.html stashed a path (because someone deep-linked or refreshed
// on a non-root URL), swap the browser's history to that real path
// BEFORE React Router mounts, so it renders the correct route on load
// instead of always landing on '/'.
const redirectPath = sessionStorage.getItem('spa-redirect-path');
if (redirectPath) {
  sessionStorage.removeItem('spa-redirect-path');
  const base = import.meta.env.BASE_URL.replace(/\/$/, ''); // strip trailing slash
  const fullPath = redirectPath.startsWith(base) ? redirectPath : base + redirectPath;
  window.history.replaceState(null, '', fullPath);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Registers the service worker so the browser can offer "Install app"
// on mobile/desktop. import.meta.env.BASE_URL respects whatever base
// path is set in vite.config.js (e.g. /FinVault/ on GitHub Pages).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`)
      .catch((err) => console.error('Service worker registration failed:', err));
  });
} 