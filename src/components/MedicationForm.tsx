import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pill, Search } from 'lucide-react';
import { MedicationFormData, Medication } from '@/types/medication';
import { getMedicationInfo } from '@/utils/medicationDatabase';

interface MedicationFormProps {
  onSubmit: (data: MedicationFormData) => void;
}

export const MedicationForm = ({ onSubmit }: MedicationFormProps) => {
  const [formData, setFormData] = useState<MedicationFormData>({
    name: '',
    pzn: '',
    currentAmount: 0,
    dailyDosage: 1,
    interval: 'daily',
    reminderThresholdDays: 14
  });
  
  const [isLoadingPzn, setIsLoadingPzn] = useState(false);

  
  const handlePznLookup = async () => {
    if (!formData.pzn) return;
    
    setIsLoadingPzn(true);
    try {
      const info = await getMedicationInfo(formData.pzn);
      if (info && !formData.name.trim()) {
        setFormData(prev => ({ ...prev, name: info.name }));
      }
    } catch (error) {
      console.error('Fehler beim Laden der PZN-Info:', error);
    } finally {
      setIsLoadingPzn(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.currentAmount > 0 && formData.dailyDosage > 0) {
      onSubmit(formData);
      setFormData({
        name: '',
        pzn: '',
        currentAmount: 0,
        dailyDosage: 1,
        interval: 'daily',
        reminderThresholdDays: 14
      });
    }
  };

  const intervalOptions: Array<{ value: Medication['interval']; label: string }> = [
    { value: 'daily', label: '1x täglich' },
    { value: 'twice-daily', label: '2x täglich' },
    { value: 'three-times-daily', label: '3x täglich' },
    { value: 'weekly', label: '1x wöchentlich' },
    { value: 'as-needed', label: 'Bei Bedarf' }
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-medical">
            <Plus className="h-4 w-4 text-white" />
          </div>
          Neues Medikament hinzufügen
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Medikament Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Aspirin, Ibuprofen..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pzn">PZN (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="pzn"
                type="text"
                value={formData.pzn || ''}
                onChange={(e) => setFormData({ ...formData, pzn: e.target.value })}
                placeholder="z.B. 02532876"
                maxLength={8}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePznLookup}
                disabled={!formData.pzn || isLoadingPzn}
                className="shrink-0"
              >
                {isLoadingPzn ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pharmazentralnummer für automatische Medikamenteninfo
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Aktueller Vorrat</Label>
              <Input
                id="currentAmount"
                type="number"
                min="1"
                value={formData.currentAmount || ''}
                onChange={(e) => setFormData({ ...formData, currentAmount: parseInt(e.target.value) || 0 })}
                placeholder="Anzahl Tabletten"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dailyDosage">Dosierung pro Einnahme</Label>
              <Input
                id="dailyDosage"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.dailyDosage || ''}
                onChange={(e) => setFormData({ ...formData, dailyDosage: parseFloat(e.target.value) || 1 })}
                placeholder="z.B. 1, 0.5..."
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interval">Einnahme-Intervall</Label>
            <Select value={formData.interval} onValueChange={(value: Medication['interval']) => setFormData({ ...formData, interval: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervalOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reminderThreshold">Erinnerung bei (Tage vor Aufbrauchen)</Label>
            <Input
              id="reminderThreshold"
              type="number"
              min="1"
              max="30"
              value={formData.reminderThresholdDays || ''}
              onChange={(e) => setFormData({ ...formData, reminderThresholdDays: parseInt(e.target.value) || 14 })}
              placeholder="14"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-medical hover:opacity-90 transition-opacity"
            disabled={!formData.name.trim() || formData.currentAmount <= 0 || formData.dailyDosage <= 0}
          >
            <Pill className="h-4 w-4 mr-2" />
            Medikament hinzufügen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};