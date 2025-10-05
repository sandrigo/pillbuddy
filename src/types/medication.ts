export interface IntakeLog {
  date: Date;
  amount: number;
  note?: string;
}

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
  manualInfoOverride?: boolean;
  personalNotes?: string;
  intakeLog?: IntakeLog[]; // Einnahme-Historie für "Bei Bedarf" Medikamente
}

export interface MedicationFormData {
  name: string;
  pzn?: string;
  currentAmount: number;
  dailyDosage: number;
  interval: Medication['interval'];
  reminderThresholdDays: number;
  activeIngredient?: string;
  indication?: string;
  description?: string;
  personalNotes?: string;
}
