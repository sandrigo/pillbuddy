export interface Medication {
  id: string;
  name: string;
  pzn?: string;
  description?: string;
  activeIngredient?: string;
  indication?: string;
  currentAmount: number;
  dailyDosage: number;
  interval: 'daily' | 'twice-daily' | 'three-times-daily' | 'weekly' | 'as-needed';
  reminderThresholdDays: number;
  createdAt: Date;
  lastRefilled?: Date;
  manualInfoOverride?: boolean; // Deaktiviert automatische PZN-Suche
  personalNotes?: string; // Persönliche Notizen
}

export interface MedicationFormData {
  name: string;
  pzn?: string;
  currentAmount: number;
  dailyDosage: number;
  interval: Medication['interval'];
  reminderThresholdDays: number;
}