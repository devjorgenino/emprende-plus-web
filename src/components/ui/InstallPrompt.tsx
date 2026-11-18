import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setCanInstall(true);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if already cached
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        // App is installed or can be installed
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setCanInstall(false);
        setDeferredPrompt(null);
      }
    }
  };

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 mx-4 p-4 bg-surface border border-border rounded-xl shadow-lg flex items-center justify-between">
      <div>
        <h3 className="font-medium text-text">Instalar Emprende+</h3>
        <p className="text-sm text-textSecondary">
          {isOnline ? 'Accede sin conexión y sin instalar' : 'Modo offline disponible'}
        </p>
      </div>
      <Button onClick={handleInstall} size="sm">
        <Download className="w-4 h-4 mr-1" />
        Instalar
      </Button>
    </div>
  );
}