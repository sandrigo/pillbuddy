import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Medication } from '@/types/medication';
import { useState } from 'react';

export type MergeStrategy = 'merge' | 'replace';

interface SyncMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCount: number;
  incomingCount: number;
  onConfirm: (strategy: MergeStrategy) => void;
}

export const SyncMergeDialog = ({
  open,
  onOpenChange,
  existingCount,
  incomingCount,
  onConfirm,
}: SyncMergeDialogProps) => {
  const [strategy, setStrategy] = useState<MergeStrategy>('merge');

  const handleConfirm = () => {
    onConfirm(strategy);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Daten zusammenführen</AlertDialogTitle>
          <AlertDialogDescription>
            Du hast bereits <strong>{existingCount} Medikament{existingCount !== 1 ? 'e' : ''}</strong> gespeichert.
            Es werden <strong>{incomingCount} Medikament{incomingCount !== 1 ? 'e' : ''}</strong> empfangen.
            <br /><br />
            Wie möchtest du fortfahren?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup value={strategy} onValueChange={(value) => setStrategy(value as MergeStrategy)}>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="merge" id="merge" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="merge" className="text-base font-semibold cursor-pointer">
                  Zusammenführen (empfohlen)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Neue Medikamente hinzufügen, bestehende behalten. Duplikate werden nicht hinzugefügt.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="replace" id="replace" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="replace" className="text-base font-semibold cursor-pointer">
                  Komplett ersetzen
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Alle bestehenden Daten löschen und nur die neuen Medikamente übernehmen.
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>

        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Fortfahren
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * Merge medications based on strategy
 */
export const mergeMedications = (
  existing: Medication[],
  incoming: Medication[],
  strategy: MergeStrategy
): Medication[] => {
  if (strategy === 'replace') {
    return incoming;
  }

  // Merge strategy: Add new medications, avoid duplicates
  const existingNames = new Set(
    existing.map(med => `${med.name.toLowerCase()}-${med.dailyDosage}-${med.interval}`)
  );

  const uniqueIncoming = incoming.filter(med => {
    const key = `${med.name.toLowerCase()}-${med.dailyDosage}-${med.interval}`;
    return !existingNames.has(key);
  });

  // Generate new IDs for incoming medications to avoid conflicts
  const incomingWithNewIds = uniqueIncoming.map(med => ({
    ...med,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    createdAt: new Date(med.createdAt),
    lastRefilled: med.lastRefilled ? new Date(med.lastRefilled) : undefined,
  }));

  return [...existing, ...incomingWithNewIds];
};
