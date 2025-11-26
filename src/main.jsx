import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { preloadCriticalImages } from './utils/assetPath';
import './index.css';

// Clear browser cache on app start to prevent stale content
if ('caches' in window) {
  caches.keys().then(names => {
    const appVersion = Date.now();
    console.log('🔄 Checking cache freshness...');
    names.forEach(name => {
      // Keep only recent caches (within last 5 minutes)
      const cacheTime = parseInt(name.split('-v')[1]);
      if (isNaN(cacheTime) || (appVersion - cacheTime) > 300000) {
        console.log('🗑️ Deleting old cache:', name);
        caches.delete(name);
      }
    });
  });
}

// Force reload service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.update(); // Check for updates immediately
    });
  });
}

// PERFORMANCE: Preload images for INSTANT PDF generation
preloadCriticalImages().then(() => {
  console.log('⚡ PDF images ready - generation will be FAST!');
}).catch(err => {
  console.warn('⚠️ Some images failed to preload:', err);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(error => {
        console.log('SW registration failed: ', error);
      });
  });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install button if needed
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.style.display = 'block';
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installBtn.style.display = 'none';
      }
    });
  }
});

// Track installation
window.addEventListener('appinstalled', () => {
  console.log('HEALit Lab PWA was installed');
  deferredPrompt = null;
});
