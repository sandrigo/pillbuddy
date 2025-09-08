import { useState, useEffect } from 'react';
import { Medication, MedicationFormData } from '@/types/medication';

const STORAGE_KEY = 'medications';

export const useMedications = () => {
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setMedications(parsed.map((med: any) => ({
        ...med,
        createdAt: new Date(med.createdAt),
        lastRefilled: med.lastRefilled ? new Date(med.lastRefilled) : undefined
      })));
    }
  }, []);

  const saveMedications = (newMedications: Medication[]) => {
    setMedications(newMedications);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMedications));
  };

  const addMedication = (data: MedicationFormData) => {
    const newMedication: Medication = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    saveMedications([...medications, newMedication]);
  };

  const deleteMedication = (id: string) => {
    saveMedications(medications.filter(med => med.id !== id));
  };

  const updateMedication = (id: string, updates: Partial<Medication>) => {
    saveMedications(medications.map(med => 
      med.id === id ? { ...med, ...updates } : med
    ));
  };

  const updateCurrentAmount = (id: string, newAmount: number) => {
    updateMedication(id, { currentAmount: newAmount });
  };

  const getDaysRemaining = (medication: Medication): number => {
    const dailyUsage = medication.dailyDosage * (
      medication.interval === 'twice-daily' ? 2 :
      medication.interval === 'three-times-daily' ? 3 :
      medication.interval === 'weekly' ? 1/7 :
      medication.interval === 'as-needed' ? 0.5 : 1
    );
    
    return Math.floor(medication.currentAmount / dailyUsage);
  };

  const needsRefill = (medication: Medication): boolean => {
    return getDaysRemaining(medication) <= medication.reminderThresholdDays;
  };

  return {
    medications,
    addMedication,
    deleteMedication,
    updateMedication,
    updateCurrentAmount,
    getDaysRemaining,
    needsRefill
  };
};