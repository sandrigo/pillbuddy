import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export const OnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success('Verbindung wiederhergestellt', {
          description: 'Sie sind wieder online'
        });
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.warning('Keine Verbindung', {
        description: 'Sie sind offline - gespeicherte Daten sind weiterhin verfügbar'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs">
      {isOnline ? (
        <>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <Wifi className="h-3 w-3" />
          <span className="hidden sm:inline">Online</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <WifiOff className="h-3 w-3" />
          <span className="hidden sm:inline">Offline</span>
        </>
      )}
    </div>
  );
};
