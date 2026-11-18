import { useState, useEffect } from 'react';

interface PWAInstallProps {
  canInstall: boolean;
  installApp: () => Promise<void>;
  isOnline: boolean;
}

export function usePWAInstall(): PWAInstallProps {
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if already cached
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        // App is installed or can be installed
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if ('promptInstall' in window) {
      const result = await (window as any).promptInstall();
      if (result?.outcome === 'accepted') {
        setCanInstall(false);
      }
    }
  };

  return { canInstall, installApp, isOnline };
}