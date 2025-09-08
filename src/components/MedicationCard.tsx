import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Pill, Calendar, AlertCircle } from 'lucide-react';
import { Medication } from '@/types/medication';

interface MedicationCardProps {
  medication: Medication;
  daysRemaining: number;
  needsRefill: boolean;
  onDelete: (id: string) => void;
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

export const MedicationCard = ({ medication, daysRemaining, needsRefill, onDelete }: MedicationCardProps) => {
  return (
    <Card className={`shadow-soft transition-all duration-200 hover:shadow-medium ${needsRefill ? 'border-warning' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">{medication.name}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(medication.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Vorrat:</span>
            <span className="font-medium">{medication.currentAmount}</span>
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
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {needsRefill ? (
              <AlertCircle className="h-4 w-4 text-warning" />
            ) : (
              <Calendar className="h-4 w-4 text-success" />
            )}
            <span className="text-sm font-medium">
              {daysRemaining} Tag{daysRemaining !== 1 ? 'e' : ''} verbleibend
            </span>
          </div>
          
          {needsRefill && (
            <Badge variant="outline" className="border-warning text-warning-foreground">
              Nachschub benötigt
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};