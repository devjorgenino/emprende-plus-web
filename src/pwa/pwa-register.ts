// PWA Installation Handler & Service Worker Manager
let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function registerSW(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Every hour

        // Handle controller change (new SW activated)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        // Register periodic sync for exchange rate (if supported)
        if ('periodicSync' in registration) {
          (registration as any).periodicSync.register('sync-rate', { minInterval: 6 * 60 * 60 * 1000 })
            .catch(() => console.log('Periodic sync not supported or denied'));
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

export function setupBeforeInstallPrompt(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    const event = e as BeforeInstallPromptEvent;
    event.preventDefault();
    deferredPrompt = event;
    window.dispatchEvent(new CustomEvent('beforeinstallprompt'));
  });

  // Handle app installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('appinstalled'));
  });
}

export function promptInstall(): Promise<void> | null {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    return deferredPrompt.userChoice.then((value) => {
      console.log('install event', value);
      deferredPrompt = null;
    });
  }
  return null;
}

// Background Sync helpers
export function registerBackgroundSync(tag: string): void {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      (registration as any).sync.register(tag).catch((err: any) => {
        console.log('Background sync registration failed:', err);
      });
    });
  }
}

export function registerSyncForSales(): void {
  registerBackgroundSync('sync-sales');
}

export function registerSyncForExpenses(): void {
  registerBackgroundSync('sync-expenses');
}

export function registerSyncForInventory(): void {
  registerBackgroundSync('sync-inventory');
}

export function registerSyncAll(): void {
  registerBackgroundSync('sync-all');
}

// Check if app is running in standalone mode (installed)
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// Check online status
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen for online/offline events
export function setupOnlineListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      ),
    });
    return subscription;
  } catch (err) {
    console.log('Push subscription failed:', err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}