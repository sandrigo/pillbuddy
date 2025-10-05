import { useState, useEffect } from 'react';
import { Medication, MedicationFormData } from '@/types/medication';

const STORAGE_KEY = 'medications';
const LAST_UPDATE_KEY = 'medications_last_update';

export const useMedications = () => {
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const medicationsWithDates = parsed.map((med: any) => ({
        ...med,
        createdAt: new Date(med.createdAt),
        lastRefilled: med.lastRefilled ? new Date(med.lastRefilled) : undefined
      }));
      
      // Check if we need to auto-decrement daily amounts
      const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
      const today = new Date().toDateString();
      
      if (lastUpdate && lastUpdate !== today) {
        const updatedMedications = medicationsWithDates.map((med: Medication) => {
          // "Bei Bedarf" Medikamente werden NICHT automatisch reduziert
          if (med.interval === 'as-needed') {
            return med;
          }
          
          const dailyUsage = med.dailyDosage * (
            med.interval === 'twice-daily' ? 2 :
            med.interval === 'three-times-daily' ? 3 :
            med.interval === 'weekly' ? 1/7 : 1
          );
          
          return {
            ...med,
            currentAmount: Math.max(0, med.currentAmount - dailyUsage)
          };
        });
        
        setMedications(updatedMedications);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMedications));
        localStorage.setItem(LAST_UPDATE_KEY, today);
      } else {
        setMedications(medicationsWithDates);
        localStorage.setItem(LAST_UPDATE_KEY, today);
      }
    } else {
      localStorage.setItem(LAST_UPDATE_KEY, new Date().toDateString());
    }
  }, []);

  const saveMedications = (newMedications: Medication[]) => {
    setMedications(newMedications);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMedications));
  };

  const addMedication = async (data: MedicationFormData) => {
    const newMedication: Medication = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    // Lade Medikamenteninfo wenn PZN vorhanden ist (standardmäßig aktiviert)
    if (data.pzn) {
      const { getMedicationInfo } = await import('@/utils/medicationDatabase');
      const info = await getMedicationInfo(data.pzn);
      if (info) {
        newMedication.description = info.description;
        newMedication.activeIngredient = info.activeIngredient;
        newMedication.indication = info.indication;
        // Falls kein Name eingegeben wurde, verwende den aus der Datenbank
        if (!newMedication.name.trim()) {
          newMedication.name = info.name;
        }
      }
    }
    
    saveMedications([...medications, newMedication]);
  };

  const deleteMedication = (id: string) => {
    saveMedications(medications.filter(med => med.id !== id));
  };

  const updateMedication = async (id: string, updates: Partial<Medication>) => {
    // Lade Medikamenteninfo wenn PZN aktualisiert wird und nicht manuell überschrieben
    if (updates.pzn && !updates.manualInfoOverride) {
      const currentMed = medications.find(m => m.id === id);
      if (!currentMed?.manualInfoOverride) {
        const { getMedicationInfo } = await import('@/utils/medicationDatabase');
        const info = await getMedicationInfo(updates.pzn);
        if (info) {
          updates.description = info.description;
          updates.activeIngredient = info.activeIngredient;
          updates.indication = info.indication;
        }
      }
    }
    
    saveMedications(medications.map(med => 
      med.id === id ? { ...med, ...updates } : med
    ));
  };

  const updateCurrentAmount = (id: string, newAmount: number) => {
    updateMedication(id, { currentAmount: newAmount });
  };

  const getDaysRemaining = (medication: Medication): number => {
    // "Bei Bedarf" hat keine "Tage verbleibend" Berechnung
    if (medication.interval === 'as-needed') {
      return -1; // Spezialwert für "Bei Bedarf"
    }
    
    const dailyUsage = medication.dailyDosage * (
      medication.interval === 'twice-daily' ? 2 :
      medication.interval === 'three-times-daily' ? 3 :
      medication.interval === 'weekly' ? 1/7 : 1
    );
    
    return Math.floor(medication.currentAmount / dailyUsage);
  };

  const needsRefill = (medication: Medication): boolean => {
    // "Bei Bedarf" Warnung nur bei niedrigem Vorrat (< 10 Tabletten)
    if (medication.interval === 'as-needed') {
      return medication.currentAmount < 10;
    }
    return getDaysRemaining(medication) <= medication.reminderThresholdDays;
  };

  const recordIntake = (id: string, amount: number, note?: string) => {
    const medication = medications.find(m => m.id === id);
    if (!medication) return;

    const intake = {
      date: new Date(),
      amount,
      note
    };

    const updatedIntakeLog = [...(medication.intakeLog || []), intake];
    const newAmount = Math.max(0, medication.currentAmount - amount);

    updateMedication(id, {
      intakeLog: updatedIntakeLog,
      currentAmount: newAmount
    });
  };

  const getLastIntake = (medication: Medication): Date | null => {
    if (!medication.intakeLog || medication.intakeLog.length === 0) {
      return null;
    }
    const sortedLog = [...medication.intakeLog].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return new Date(sortedLog[0].date);
  };

  const exportMedications = () => {
    const dataStr = JSON.stringify(medications, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pillbuddy-medikamente-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importMedications = (jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        const medicationsWithDates = imported.map((med: any) => ({
          ...med,
          id: med.id || Date.now().toString() + Math.random(),
          createdAt: med.createdAt ? new Date(med.createdAt) : new Date(),
          lastRefilled: med.lastRefilled ? new Date(med.lastRefilled) : undefined
        }));
        saveMedications(medicationsWithDates);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    medications,
    addMedication,
    deleteMedication,
    updateMedication,
    updateCurrentAmount,
    getDaysRemaining,
    needsRefill,
    recordIntake,
    getLastIntake,
    exportMedications,
    importMedications
  };
};