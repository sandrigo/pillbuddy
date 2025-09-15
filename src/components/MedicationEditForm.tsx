import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Medication, MedicationFormData } from '@/types/medication';
import { Pill, Save, X } from 'lucide-react';

interface MedicationEditFormProps {
  medication: Medication;
  onSubmit: (id: string, data: Partial<Medication>) => void;
  onCancel: () => void;
}

export const MedicationEditForm = ({ medication, onSubmit, onCancel }: MedicationEditFormProps) => {
  const [formData, setFormData] = useState<MedicationFormData>({
    name: medication.name,
    currentAmount: medication.currentAmount,
    dailyDosage: medication.dailyDosage,
    interval: medication.interval,
    reminderThresholdDays: medication.reminderThresholdDays,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(medication.id, formData);
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Pill className="h-4 w-4 text-primary" />
          </div>
          Medikament bearbeiten
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Medikamentenname</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Ibuprofen 400mg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentAmount">Aktueller Vorrat</Label>
              <Input
                id="currentAmount"
                type="number"
                min="0"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="dailyDosage">Dosierung pro Einnahme</Label>
              <Input
                id="dailyDosage"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.dailyDosage}
                onChange={(e) => setFormData({ ...formData, dailyDosage: parseFloat(e.target.value) || 1 })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="interval">Einnahmeintervall</Label>
            <Select value={formData.interval} onValueChange={(value: Medication['interval']) => setFormData({ ...formData, interval: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">1x täglich</SelectItem>
                <SelectItem value="twice-daily">2x täglich</SelectItem>
                <SelectItem value="three-times-daily">3x täglich</SelectItem>
                <SelectItem value="weekly">1x wöchentlich</SelectItem>
                <SelectItem value="as-needed">Bei Bedarf</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reminderThresholdDays">Warnung ab (Tage)</Label>
            <Input
              id="reminderThresholdDays"
              type="number"
              min="1"
              max="30"
              value={formData.reminderThresholdDays}
              onChange={(e) => setFormData({ ...formData, reminderThresholdDays: parseInt(e.target.value) || 7 })}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Warnung wird angezeigt, wenn weniger als diese Anzahl Tage Vorrat vorhanden ist
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};