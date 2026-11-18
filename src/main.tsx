import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW, setupBeforeInstallPrompt, setupOnlineListeners, isOnline } from '@/pwa/pwa-register';

console.log('=== Emprende+ Starting ===');

try {
  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  console.log('Root element found:', !!root);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  console.log('=== App rendered successfully ===');
} catch (error) {
  console.error('=== FATAL ERROR ===', error);
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'padding:20px;font-family:sans-serif;background:#f0f0f0;';

  const h1 = document.createElement('h1');
  h1.textContent = 'Error al cargar la aplicación';
  errorDiv.appendChild(h1);

  const pre = document.createElement('pre');
  pre.style.cssText = 'background:#fff;padding:10px;border-radius:4px;';
  pre.textContent = String(error);
  errorDiv.appendChild(pre);

  const p = document.createElement('p');
  p.textContent = 'Abre la consola del navegador (F12) para más detalles.';
  errorDiv.appendChild(p);

  document.body.appendChild(errorDiv);
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  registerSW();
  setupBeforeInstallPrompt();

  // Setup online/offline listeners
  setupOnlineListeners(
    () => {
      console.log('App is online');
      // Trigger sync if there's pending data
      window.dispatchEvent(new CustomEvent('app-online'));
    },
    () => {
      console.log('App is offline');
      window.dispatchEvent(new CustomEvent('app-offline'));
    }
  );

  // Check for updates on focus
  let lastFocus = Date.now();
  window.addEventListener('focus', () => {
    if (Date.now() - lastFocus > 60000) { // More than 1 minute
      navigator.serviceWorker.ready.then(reg => reg.update());
    }
    lastFocus = Date.now();
  });
}