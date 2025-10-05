import { useState, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pill, Search } from 'lucide-react';
import { MedicationFormData, Medication } from '@/types/medication';

interface MedicationFormProps {
  onSubmit: (data: MedicationFormData) => void;
}

export const MedicationForm = forwardRef<HTMLInputElement, MedicationFormProps>(({ onSubmit }, ref) => {
  const [formData, setFormData] = useState<MedicationFormData>({
    name: '',
    pzn: '',
    currentAmount: 0,
    dailyDosage: 1,
    interval: 'daily',
    reminderThresholdDays: 14,
    activeIngredient: '',
    indication: '',
    description: '',
    personalNotes: ''
  });

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
        reminderThresholdDays: 14,
        activeIngredient: '',
        indication: '',
        description: '',
        personalNotes: ''
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
            <Label htmlFor="name">Medikament Name *</Label>
            <Input
              ref={ref}
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
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const pzn = formData.pzn?.trim();
                  if (pzn) {
                    window.open(`https://www.google.com/search?q=pzn+${pzn}`, '_blank');
                  }
                }}
                disabled={!formData.pzn?.trim()}
                className="whitespace-nowrap"
              >
                <Search className="h-4 w-4 mr-1" />
                PZN Suche (Google)
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="activeIngredient">Wirkstoff (optional)</Label>
            <Input
              id="activeIngredient"
              type="text"
              value={formData.activeIngredient || ''}
              onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
              placeholder="z.B. Ibuprofen"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="indication">Anwendungsgebiet (optional)</Label>
            <Input
              id="indication"
              type="text"
              value={formData.indication || ''}
              onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
              placeholder="z.B. Schmerzen und Entzündungen"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Weitere Informationen zum Medikament..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personalNotes">Persönliche Notizen (optional)</Label>
            <Textarea
              id="personalNotes"
              value={formData.personalNotes || ''}
              onChange={(e) => setFormData({ ...formData, personalNotes: e.target.value })}
              placeholder="Ihre persönlichen Notizen..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Aktueller Vorrat *</Label>
              <Input
                id="currentAmount"
                type="number"
                min="1"
                value={formData.currentAmount || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setFormData({ ...formData, currentAmount: '' as any });
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      setFormData({ ...formData, currentAmount: numValue });
                    }
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '' || parseInt(e.target.value) < 1) {
                    setFormData({ ...formData, currentAmount: 0 });
                  }
                }}
                placeholder="Anzahl Tabletten"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dailyDosage">Dosierung pro Einnahme *</Label>
              <Input
                id="dailyDosage"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.dailyDosage || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setFormData({ ...formData, dailyDosage: '' as any });
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      setFormData({ ...formData, dailyDosage: numValue });
                    }
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '' || parseFloat(e.target.value) < 0.25) {
                    setFormData({ ...formData, dailyDosage: 1 });
                  }
                }}
                placeholder="z.B. 1, 0.5..."
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interval">Einnahme-Intervall *</Label>
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
            <Label htmlFor="reminderThreshold">Erinnerung bei (Tage vor Aufbrauchen) *</Label>
            <Input
              id="reminderThreshold"
              type="number"
              min="1"
              max="30"
              value={formData.reminderThresholdDays || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setFormData({ ...formData, reminderThresholdDays: '' as any });
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    setFormData({ ...formData, reminderThresholdDays: numValue });
                  }
                }
              }}
              onBlur={(e) => {
                if (e.target.value === '' || parseInt(e.target.value) < 1) {
                  setFormData({ ...formData, reminderThresholdDays: 14 });
                }
              }}
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
});

MedicationForm.displayName = 'MedicationForm';
