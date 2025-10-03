import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash2, Pill, Calendar, AlertCircle, Edit3, Check, X, Settings, StickyNote, ChevronDown, Clock } from 'lucide-react';
import { MedicationEditForm } from './MedicationEditForm';
import { Medication } from '@/types/medication';
import { cn } from '@/lib/utils';

interface MedicationCardProps {
  medication: Medication;
  daysRemaining: number;
  needsRefill: boolean;
  onDelete: (id: string) => void;
  onUpdateAmount: (id: string, newAmount: number) => void;
  onUpdateMedication: (id: string, updates: Partial<Medication>) => void;
}

const getIntervalText = (interval: Medication['interval']) => {
  switch (interval) {
    case 'daily': return '1x täglich';
    case 'twice-daily': return '2x täglich';
    case 'three-times-daily': return '3x täglich';
    case 'weekly': return '1x wöchentlich';
    case 'as-needed': return 'bei Bedarf';
    default: return interval;
  }
};

export const MedicationCard = ({ medication, daysRemaining, needsRefill, onDelete, onUpdateAmount, onUpdateMedication }: MedicationCardProps) => {
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isEditingMedication, setIsEditingMedication] = useState(false);
  const [editAmount, setEditAmount] = useState(medication.currentAmount);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSaveAmount = () => {
    if (editAmount > 0) {
      onUpdateAmount(medication.id, editAmount);
      setIsEditingAmount(false);
    }
  };

  const handleCancelEdit = () => {
    setEditAmount(medication.currentAmount);
    setIsEditingAmount(false);
  };

  const handleUpdateMedication = (id: string, updates: Partial<Medication>) => {
    onUpdateMedication(id, updates);
    setIsEditingMedication(false);
  };

  const getZeroDate = () => {
    const dailyUsage = medication.dailyDosage * (
      medication.interval === 'twice-daily' ? 2 :
      medication.interval === 'three-times-daily' ? 3 :
      medication.interval === 'weekly' ? 1/7 :
      medication.interval === 'as-needed' ? 0.5 : 1
    );
    
    const zeroDate = new Date();
    zeroDate.setDate(zeroDate.getDate() + Math.floor(medication.currentAmount / dailyUsage));
    
    return zeroDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getProgressPercentage = () => {
    const maxDays = medication.reminderThresholdDays * 2;
    return Math.min((daysRemaining / maxDays) * 100, 100);
  };

  const getBorderColor = () => {
    if (daysRemaining > 14) return 'border-l-success';
    if (daysRemaining > 7) return 'border-l-yellow-500';
    if (daysRemaining > 3) return 'border-l-orange-500';
    return 'border-l-destructive';
  };

  if (isEditingMedication) {
    return (
      <MedicationEditForm
        medication={medication}
        onSubmit={handleUpdateMedication}
        onCancel={() => setIsEditingMedication(false)}
      />
    );
  }

  return (
    <Card className={cn(
      "shadow-gentle hover:shadow-soft transition-all duration-200 border-l-4 mb-6",
      getBorderColor(),
      needsRefill ? 'border-warning/30 bg-warning/5' : 'border-border/50'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{medication.name}</CardTitle>
              {medication.pzn && (
                <p className="text-xs text-muted-foreground">PZN: {medication.pzn}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingMedication(true)}
              className="text-muted-foreground hover:text-primary min-w-[44px] min-h-[44px]"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-muted-foreground hover:text-destructive min-w-[44px] min-h-[44px]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Medikament wirklich löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Möchten Sie "{medication.name}" wirklich aus Ihrer Liste entfernen? Diese Aktion kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      onDelete(medication.id);
                      setShowDeleteDialog(false);
                    }}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Prominent Days Remaining */}
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">
                {daysRemaining} Tag{daysRemaining !== 1 ? 'e' : ''}
              </p>
              <p className="text-sm text-muted-foreground">Vorrat für {daysRemaining} Tag{daysRemaining !== 1 ? 'e' : ''}</p>
            </div>
            {needsRefill && (
              <Badge variant="outline" className="border-warning text-warning-foreground">
                Nachschub!
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Vorrat:</span>
            {isEditingAmount ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  type="number"
                  min="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                  className="h-6 w-16 text-xs"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveAmount}
                  className="h-6 w-6 p-0 text-success hover:text-success"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-medium">{medication.currentAmount}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingAmount(true)}
                  className="h-4 w-4 p-0 text-muted-foreground hover:text-primary"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-medical-green" />
            <span className="text-muted-foreground">Dosierung:</span>
            <span className="font-medium">{medication.dailyDosage}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Einnahme:</span>
          <span className="font-medium">{getIntervalText(medication.interval)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Leer am:</span>
          <span className="font-medium text-foreground">{getZeroDate()}</span>
        </div>
        
        {/* Medikamenteninfo - Collapsible */}
        {(medication.description || medication.activeIngredient || medication.indication) && (
          <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto hover:bg-muted/50"
              >
                <span className="text-sm font-semibold text-primary">Medikamenteninfo</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isInfoOpen && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 bg-muted/30 rounded-lg border mt-2">
                <div className="space-y-1 text-xs">
                  {medication.activeIngredient && (
                    <div>
                      <span className="font-medium">Wirkstoff:</span> {medication.activeIngredient}
                    </div>
                  )}
                  {medication.indication && (
                    <div>
                      <span className="font-medium">Anwendung:</span> {medication.indication}
                    </div>
                  )}
                  {medication.description && (
                    <div>
                      <span className="font-medium">Beschreibung:</span> {medication.description}
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Persönliche Notizen */}
        {medication.personalNotes && (
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
            <h4 className="text-sm font-semibold mb-2 text-accent-foreground flex items-center gap-2">
              <StickyNote className="h-3 w-3" />
              Persönliche Notizen
            </h4>
            <p className="text-xs text-accent-foreground">{medication.personalNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};