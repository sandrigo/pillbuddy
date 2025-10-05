import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Medication } from '@/types/medication';
import { Pill } from 'lucide-react';

interface IntakeDialogProps {
  medication: Medication;
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number, note?: string) => void;
}

export const IntakeDialog: React.FC<IntakeDialogProps> = ({
  medication,
  open,
  onClose,
  onConfirm,
}) => {
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    if (amount > 0 && amount <= medication.currentAmount) {
      onConfirm(amount, note.trim() || undefined);
      // Reset form
      setAmount(1);
      setNote('');
      onClose();
    }
  };

  const handleCancel = () => {
    setAmount(1);
    setNote('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            Einnahme erfassen
          </DialogTitle>
          <DialogDescription>
            {medication.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Anzahl *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                min="1"
                max={medication.currentAmount}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">Tablette(n)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Verfügbar: {medication.currentAmount} Tablette(n)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Notiz (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. Kopfschmerzen, Fieber..."
              rows={3}
            />
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            <p>⏰ Zeitpunkt: Jetzt ({new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={amount < 1 || amount > medication.currentAmount}
            className="bg-success hover:bg-success/90"
          >
            Bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
