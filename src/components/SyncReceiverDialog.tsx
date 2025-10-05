import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, Download } from 'lucide-react';
import { useWebRTCSync } from '@/hooks/useWebRTCSync';
import { Medication } from '@/types/medication';
import { isValidPairingCode } from '@/utils/pairingCode';

interface SyncReceiverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataReceived: (medications: Medication[]) => void;
}

export const SyncReceiverDialog = ({ 
  open, 
  onOpenChange, 
  onDataReceived 
}: SyncReceiverDialogProps) => {
  const { status, error, progress, startReceiver, cancel } = useWebRTCSync();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow alphanumeric characters
    const sanitized = value.toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, '');
    
    if (sanitized.length > 1) {
      // Paste handling
      const chars = sanitized.split('').slice(0, 6);
      const newCode = [...code];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else if (sanitized.length === 1) {
      const newCode = [...code];
      newCode[index] = sanitized;
      setCode(newCode);
      
      // Auto-focus next input
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (value === '') {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleConnect = useCallback(async () => {
    const fullCode = code.join('');
    if (!isValidPairingCode(fullCode)) {
      return;
    }

    await startReceiver(fullCode, onDataReceived);
  }, [code, startReceiver, onDataReceived]);

  const handleClose = () => {
    cancel();
    setCode(['', '', '', '', '', '']);
    onOpenChange(false);
  };

  const isCodeComplete = code.every(char => char !== '');

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Verbinde mit Sender...';
      case 'connected':
        return 'Verbunden!';
      case 'transferring':
        return 'Empfange Daten...';
      case 'completed':
        return 'Erfolgreich empfangen!';
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
            <Download className="h-5 w-5" />
            Daten empfangen
          </DialogTitle>
          <DialogDescription>
            Gib den 6-stelligen Code vom Sendergerät ein
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === 'idle' && (
            <>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground text-center">
                  Code eingeben:
                </div>
                
                <div className="flex gap-2 justify-center">
                  {code.map((char, index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength={6}
                      value={char}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold font-mono uppercase"
                      autoComplete="off"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  Der Code besteht aus 6 Zeichen (Buchstaben und Zahlen)
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleConnect}
                  disabled={!isCodeComplete}
                  className="flex-1"
                >
                  Verbinden
                </Button>
                <Button onClick={handleClose} variant="outline">
                  Abbrechen
                </Button>
              </div>
            </>
          )}

          {(status === 'connecting' || status === 'connected' || status === 'transferring') && (
            <>
              <div className="flex items-center gap-2 text-sm justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-blue-500">{getStatusText()}</span>
              </div>

              {status === 'transferring' && (
                <Progress value={progress} className="w-full" />
              )}
            </>
          )}

          {status === 'completed' && (
            <>
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <Check className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Daten wurden erfolgreich empfangen!
                </AlertDescription>
              </Alert>

              <Button onClick={handleClose} className="w-full">
                Schließen
              </Button>
            </>
          )}

          {status === 'error' && error && (
            <>
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    cancel();
                    setCode(['', '', '', '', '', '']);
                  }} 
                  className="flex-1"
                >
                  Erneut versuchen
                </Button>
                <Button onClick={handleClose} variant="outline">
                  Abbrechen
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
