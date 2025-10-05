import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Trash2, Pill, Calendar, AlertCircle, Edit3, Check, X, Settings, CalendarDays, StickyNote, ChevronDown, ChevronUp, CheckCircle, History } from 'lucide-react';
import { MedicationEditForm } from './MedicationEditForm';
import { IntakeDialog } from './IntakeDialog';
import { Medication } from '@/types/medication';
import { getRelativeTimeString } from '@/utils/timeUtils';

interface MedicationCardProps {
  medication: Medication;
  daysRemaining: number;
  needsRefill: boolean;
  onDelete: (id: string) => void;
  onUpdateAmount: (id: string, newAmount: number) => void;
  onUpdateMedication: (id: string, updates: Partial<Medication>) => void;
  onRecordIntake?: (id: string, amount: number, note?: string) => void;
  lastIntake?: Date | null;
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

export const MedicationCard = ({ medication, daysRemaining, needsRefill, onDelete, onUpdateAmount, onUpdateMedication, onRecordIntake, lastIntake }: MedicationCardProps) => {
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isEditingMedication, setIsEditingMedication] = useState(false);
  const [showMedicationInfo, setShowMedicationInfo] = useState(false);
  const [showIntakeDialog, setShowIntakeDialog] = useState(false);
  const [showIntakeHistory, setShowIntakeHistory] = useState(false);
  const [editAmount, setEditAmount] = useState(medication.currentAmount);
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(`med-expanded-${medication.id}`);
    return saved === null ? true : saved === 'true';
  });

  const isAsNeeded = medication.interval === 'as-needed';

  // Save expansion state to localStorage
  useEffect(() => {
    localStorage.setItem(`med-expanded-${medication.id}`, isExpanded.toString());
  }, [isExpanded, medication.id]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

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

  const handleRecordIntake = (amount: number, note?: string) => {
    if (onRecordIntake) {
      onRecordIntake(medication.id, amount, note);
    }
  };

  const getBorderColor = () => {
    // Bei Bedarf Medikamente in hellem Blau - Resttage sind hier nicht relevant
    if (medication.interval === 'as-needed') return 'border-l-blue-400';
    
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
        <div className="flex items-start justify-between gap-2">
          <div 
            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={toggleExpanded}
          >
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold">{medication.name}</CardTitle>
              {medication.pzn && (
                <p className="text-xs text-muted-foreground">PZN: {medication.pzn}</p>
              )}
            </div>
          </div>
          {/* Nur Auf-/Zuklapp-Button */}
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="text-muted-foreground hover:text-primary h-9 w-9 p-0"
              aria-label={isExpanded ? "Einklappen" : "Ausklappen"}
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Kompaktansicht - nur wenn NICHT aufgeklappt */}
        {!isExpanded && (
          <>
            {isAsNeeded ? (
              // Kompaktansicht für "Bei Bedarf" Medikamente
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Vorrat:</span>
                  <span className="font-semibold">{medication.currentAmount} Tablette{medication.currentAmount !== 1 ? 'n' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Letzte Einnahme:</span>
                  <span className="font-medium">
                    {lastIntake ? getRelativeTimeString(lastIntake) : 'Noch nicht verwendet'}
                  </span>
                </div>
                <Button 
                  onClick={() => setShowIntakeDialog(true)}
                  className="w-full bg-success hover:bg-success/90 text-white"
                  disabled={medication.currentAmount === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Einnahme erfassen
                </Button>
              </div>
            ) : (
              // Kompaktansicht für reguläre Medikamente
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Vorrat für:</span>
                  <span className="font-semibold">{daysRemaining} Tag{daysRemaining !== 1 ? 'e' : ''}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all ${getProgressColor()}`}
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Leer am:</span>
                  <span>{getZeroDate()}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Erweiterte Ansicht - nur wenn isExpanded */}
        {isExpanded && (
          <>
            {/* Prominente Anzeige - unterschiedlich für "Bei Bedarf" vs regulär */}
            {isAsNeeded ? (
          <div className="bg-primary/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">
                Vorrat: {medication.currentAmount} Tablette{medication.currentAmount !== 1 ? 'n' : ''}
              </span>
            </div>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary w-full justify-center py-1.5 text-sm">
              📊 Bei Bedarf
            </Badge>
            
            {/* Einnahme erfassen Button */}
            <Button 
              onClick={() => setShowIntakeDialog(true)}
              className="w-full bg-success hover:bg-success/90 text-white"
              disabled={medication.currentAmount === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Einnahme erfassen
            </Button>

            {/* Letzter Gebrauch */}
            <div className="text-sm text-muted-foreground pt-2 border-t">
              {lastIntake ? (
                <p>Letzter Gebrauch: {getRelativeTimeString(lastIntake)}</p>
              ) : (
                <p>Noch nicht verwendet</p>
              )}
            </div>

            {/* Warnung bei niedrigem Vorrat */}
            {medication.currentAmount < 10 && medication.currentAmount > 0 && (
              <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                <span>Niedriger Vorrat: Nur noch {medication.currentAmount} Tablette{medication.currentAmount !== 1 ? 'n' : ''}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {needsRefill ? (
                  <AlertCircle className="h-5 w-5 text-warning" />
                ) : (
                  <Calendar className="h-5 w-5 text-success" />
                )}
                <span className="tracking-tight text-lg font-semibold">
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
        )}

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
        
        {/* Medikamenteninfo - immer ausgeklappt wenn vorhanden */}
        {(medication.description || medication.activeIngredient || medication.indication) && (
          <div className="p-3 bg-muted/30 rounded-lg border">
            <h4 className="text-sm font-semibold mb-2 text-foreground">Medikamenteninfo</h4>
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

        {/* Einnahme-Historie für "Bei Bedarf" Medikamente */}
        {isAsNeeded && medication.intakeLog && medication.intakeLog.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowIntakeHistory(!showIntakeHistory)}
              className="w-full justify-between text-primary hover:bg-primary/5"
            >
              <span className="font-semibold flex items-center gap-2">
                <History className="h-4 w-4" />
                📋 Einnahme-Historie
              </span>
              {showIntakeHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {showIntakeHistory && (
              <div className="mt-2 p-3 bg-muted/30 rounded-lg border space-y-2">
                {medication.intakeLog
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, showIntakeHistory ? undefined : 3)
                  .map((log, index) => (
                    <div key={index} className="text-sm pb-2 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {getRelativeTimeString(new Date(log.date))} - {log.amount} Tablette{log.amount !== 1 ? 'n' : ''}
                          </p>
                          {log.note && (
                            <p className="text-xs text-muted-foreground italic mt-1">"{log.note}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

            {needsRefill && !isAsNeeded && (
              <Badge variant="outline" className="border-warning text-warning-foreground w-full justify-center py-2">
                Nachschub benötigt
              </Badge>
            )}

            {/* Action Buttons - Nur in Vollansicht am unteren Rand */}
            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingMedication(true)}
                className="text-muted-foreground hover:text-primary hover:border-primary"
              >
                <Settings className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(medication.id)}
                className="text-muted-foreground hover:text-destructive hover:border-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* Einnahme-Dialog */}
      <IntakeDialog
        medication={medication}
        open={showIntakeDialog}
        onClose={() => setShowIntakeDialog(false)}
        onConfirm={handleRecordIntake}
      />
    </Card>
  );
};
