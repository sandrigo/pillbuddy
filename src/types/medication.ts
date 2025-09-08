export interface Medication {
  id: string;
  name: string;
  currentAmount: number;
  dailyDosage: number;
  interval: 'daily' | 'twice-daily' | 'three-times-daily' | 'weekly' | 'as-needed';
  reminderThresholdDays: number;
  createdAt: Date;
  lastRefilled?: Date;
}

export interface MedicationFormData {
  name: string;
  currentAmount: number;
  dailyDosage: number;
  interval: Medication['interval'];
  reminderThresholdDays: number;
}