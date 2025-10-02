import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { isIOS } from '@/utils/notifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      console.log('beforeinstallprompt event fired');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for appinstalled event
    const installedHandler = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', installedHandler);

    // Check if iOS
    if (isIOS() && !window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS()) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }

    // Show install prompt
    await deferredPrompt.prompt();

    // Wait for user choice
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if installed or dismissed
  if (isInstalled || !isInstallable || !isVisible) {
    return null;
  }

  // Check if dismissed recently (within 7 days)
  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime) {
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(dismissedTime) < sevenDaysInMs) {
      return null;
    }
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-card border rounded-lg shadow-lg p-4 max-w-sm flex items-center gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">📱 PillBuddy App installieren</h3>
            <p className="text-xs text-muted-foreground">
              Schneller Zugriff und Benachrichtigungen
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              Installieren
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* iOS Installation Instructions Dialog */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PillBuddy auf iOS installieren</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="space-y-2">
                <p className="font-medium">So installieren Sie PillBuddy auf Ihrem iPhone/iPad:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Tippen Sie auf das <strong>Teilen</strong>-Symbol (Quadrat mit Pfeil nach oben) in der Safari-Leiste</li>
                  <li>Scrollen Sie nach unten und wählen Sie <strong>"Zum Home-Bildschirm"</strong></li>
                  <li>Tippen Sie auf <strong>"Hinzufügen"</strong></li>
                </ol>
              </div>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">ℹ️ Hinweis zu Benachrichtigungen:</p>
                <p className="text-muted-foreground">
                  Push-Benachrichtigungen sind auf iOS eingeschränkt. Wir empfehlen die Verwendung von Email-Erinnerungen als Alternative.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};
