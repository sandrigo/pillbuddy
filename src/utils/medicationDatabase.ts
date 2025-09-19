export interface MedicationInfo {
  name: string;
  activeIngredient: string;
  indication: string;
  description: string;
}

// Mock database für Demonstration - in der Realität würde man eine echte Pharma-API verwenden
const medicationDatabase: Record<string, MedicationInfo> = {
  '02532876': {
    name: 'L-Thyroxin Henning 100',
    activeIngredient: 'Levothyroxin-Natrium',
    indication: 'Schilddrüsenunterfunktion',
    description: 'Schilddrüsenhormon zur Behandlung von Hypothyreose und Schilddrüsenvergrößerung.'
  },
  '00265043': {
    name: 'Ibuprofen AL 400',
    activeIngredient: 'Ibuprofen',
    indication: 'Schmerzen und Entzündungen',
    description: 'Nicht-steroidales Antirheumatikum zur Behandlung von Schmerzen, Fieber und Entzündungen.'
  },
  '11160671': {
    name: 'Metformin STADA 1000mg',
    activeIngredient: 'Metformin',
    indication: 'Diabetes mellitus Typ 2',
    description: 'Antidiabetikum zur Senkung des Blutzuckerspiegels bei Typ-2-Diabetes.'
  },
  '09999999': {
    name: 'Aspirin protect 100mg',
    activeIngredient: 'Acetylsalicylsäure',
    indication: 'Thromboseprophylaxe',
    description: 'Niedrigdosierte ASS zur Vorbeugung von Herzinfarkt und Schlaganfall.'
  }
};

export const getMedicationInfo = async (pzn: string): Promise<MedicationInfo | null> => {
  try {
    // Simuliere API-Aufruf
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Entferne Leerzeichen und führende Nullen
    const cleanPzn = pzn.replace(/\s/g, '').replace(/^0+/, '');
    
    // Suche in Mock-Datenbank
    const info = medicationDatabase[cleanPzn] || medicationDatabase[pzn];
    
    if (info) {
      return info;
    }
    
    // Fallback für unbekannte PZN
    return {
      name: 'Unbekanntes Medikament',
      activeIngredient: 'Nicht verfügbar',
      indication: 'Keine Information verfügbar',
      description: `Medikament mit PZN ${pzn}. Weitere Informationen können beim Arzt oder Apotheker erfragt werden.`
    };
    
  } catch (error) {
    console.error('Fehler beim Laden der Medikamenteninfo:', error);
    return null;
  }
};