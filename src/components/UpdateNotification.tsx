import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export const UpdateNotification = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Listen for custom event from main.tsx
    const handleUpdateFound = (event: Event) => {
      const customEvent = event as CustomEvent;
      setRegistration(customEvent.detail.registration);
      setUpdateAvailable(true);
      showUpdateToast();
    };

    window.addEventListener('swUpdateFound', handleUpdateFound);

    return () => {
      window.removeEventListener('swUpdateFound', handleUpdateFound);
    };
  }, []);

  const showUpdateToast = () => {
    toast('Neue Version verfügbar! 🎉', {
      description: 'Eine neue Version von PillBuddy ist verfügbar.',
      duration: Infinity, // Toast bleibt bis User reagiert
      action: {
        label: 'Jetzt aktualisieren',
        onClick: handleUpdate,
      },
      cancel: {
        label: 'Später',
        onClick: () => {
          // User hat "Später" gewählt
          console.log('Update postponed by user');
        }
      },
      className: 'bg-primary/10 border-primary/20',
    });
  };

  const handleUpdate = () => {
    if (!registration?.waiting) {
      console.error('No waiting service worker found');
      return;
    }

    // Send SKIP_WAITING message to service worker
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // The page will reload automatically when the new SW takes control
    toast.loading('Aktualisierung wird durchgeführt...', {
      description: 'Die App wird neu geladen.',
    });
  };

  return null; // This component doesn't render anything visible
};
