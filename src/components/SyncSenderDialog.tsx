import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, Smartphone } from 'lucide-react';
import { useWebRTCSync } from '@/hooks/useWebRTCSync';
import { Medication } from '@/types/medication';
import { formatPairingCode } from '@/utils/pairingCode';

interface SyncSenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medications: Medication[];
}

export const SyncSenderDialog = ({ open, onOpenChange, medications }: SyncSenderDialogProps) => {
  const { status, pairingCode, error, progress, timeRemaining, startSender, cancel } = useWebRTCSync();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = async () => {
    setHasStarted(true);
    await startSender(medications);
  };

  const handleClose = () => {
    cancel();
    setHasStarted(false);
    onOpenChange(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'generating-code':
        return 'Code wird generiert...';
      case 'waiting':
        return 'Warte auf Verbindung...';
      case 'connecting':
        return 'Verbinde...';
      case 'connected':
        return 'Verbunden!';
      case 'transferring':
        return 'Übertrage Daten...';
      case 'completed':
        return 'Erfolgreich übertragen!';
      case 'error':
        return 'Fehler';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Daten teilen
          </DialogTitle>
          <DialogDescription>
            Teile deine Medikamente sicher mit einem anderen Gerät
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!hasStarted ? (
            <>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  Es werden <strong>{medications.length} Medikamente</strong> übertragen.
                </p>
                <p>
                  Nach dem Start erhältst du einen 6-stelligen Code, den du auf dem
                  Empfängergerät eingeben musst.
                </p>
              </div>
              <Button onClick={handleStart} className="w-full">
                Code generieren
              </Button>
            </>
          ) : (
            <>
              {pairingCode && status !== 'completed' && status !== 'error' && (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Dein Pairing-Code:
                    </p>
                    <div className="bg-primary/10 rounded-lg p-6">
                      <div className="text-5xl font-bold tracking-widest font-mono text-primary">
                        {formatPairingCode(pairingCode)}
                      </div>
                    </div>
                  </div>

                  {timeRemaining > 0 && (
                    <div className="text-center text-sm text-muted-foreground">
                      Code läuft ab in: <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    {status === 'waiting' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{getStatusText()}</span>
                      </>
                    )}
                    {(status === 'connecting' || status === 'connected') && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-blue-500">{getStatusText()}</span>
                      </>
                    )}
                    {status === 'transferring' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                        <span className="text-green-500">{getStatusText()}</span>
                      </>
                    )}
                  </div>

                  {status === 'transferring' && (
                    <Progress value={progress} className="w-full" />
                  )}
                </div>
              )}

              {status === 'completed' && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <Check className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Daten wurden erfolgreich übertragen!
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                {status === 'completed' ? (
                  <Button onClick={handleClose} className="w-full">
                    Schließen
                  </Button>
                ) : (
                  <Button onClick={handleClose} variant="outline" className="w-full">
                    Abbrechen
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
