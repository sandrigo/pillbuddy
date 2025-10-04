import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Trash2, Pill, Calendar, AlertCircle, Edit3, Check, X, Settings, CalendarDays, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { MedicationEditForm } from './MedicationEditForm';
import { Medication } from '@/types/medication';

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
  const [showMedicationInfo, setShowMedicationInfo] = useState(false);
  const [editAmount, setEditAmount] = useState(medication.currentAmount);

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

  const getBorderColor = () => {
    if (daysRemaining <= 3) return 'border-l-red-500';
    if (daysRemaining <= 7) return 'border-l-orange-500';
    if (daysRemaining <= 14) return 'border-l-yellow-500';
    return 'border-l-green-500';
  };

  const getProgressPercentage = () => {
    const maxDays = medication.reminderThresholdDays || 14;
    const percentage = (daysRemaining / maxDays) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const getProgressColor = () => {
    if (daysRemaining <= 3) return 'bg-red-500';
    if (daysRemaining <= 7) return 'bg-orange-500';
    if (daysRemaining <= 14) return 'bg-yellow-500';
    return 'bg-green-500';
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
    <Card className={`shadow-gentle hover:shadow-soft transition-all duration-200 border-l-4 ${getBorderColor()} ${needsRefill ? 'border-warning/30 bg-warning/5' : ''}`}>
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
              className="text-muted-foreground hover:text-primary"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(medication.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Prominente Tage-Anzeige */}
        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {needsRefill ? (
                <AlertCircle className="h-5 w-5 text-warning" />
              ) : (
                <Calendar className="h-5 w-5 text-success" />
              )}
              <span className="text-2xl font-bold">
                Vorrat für {daysRemaining} Tag{daysRemaining !== 1 ? 'e' : ''}
              </span>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all ${getProgressColor()}`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Leer am: {getZeroDate()}
          </p>
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
        
        {/* Medikamenteninfo - Eingeklappt */}
        {(medication.description || medication.activeIngredient || medication.indication) && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMedicationInfo(!showMedicationInfo)}
              className="w-full justify-between text-primary hover:bg-primary/5"
            >
              <span className="font-semibold">Medikamenteninfo</span>
              {showMedicationInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {showMedicationInfo && (
              <div className="mt-2 p-3 bg-muted/30 rounded-lg border">
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
            )}
          </div>
        )}

        {/* Persönliche Notizen */}
        {medication.personalNotes && (
          <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <h4 className="text-sm font-semibold mb-2 text-accent-foreground flex items-center gap-2">
              <StickyNote className="h-3 w-3" />
              Persönliche Notizen
            </h4>
            <p className="text-xs text-accent-foreground">{medication.personalNotes}</p>
          </div>
        )}
        {needsRefill && (
          <Badge variant="outline" className="border-warning text-warning-foreground w-full justify-center py-2">
            Nachschub benötigt
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
