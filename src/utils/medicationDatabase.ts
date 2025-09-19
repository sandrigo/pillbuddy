export interface MedicationInfo {
  name: string;
  activeIngredient: string;
  indication: string;
  description: string;
  imageUrl?: string;
}

// Mock database für Demonstration - in der Realität würde man eine echte Pharma-API verwenden
const medicationDatabase: Record<string, MedicationInfo> = {
  '02532876': {
    name: 'L-Thyroxin Henning 100',
    activeIngredient: 'Levothyroxin-Natrium',
    indication: 'Schilddrüsenunterfunktion',
    description: 'Schilddrüsenhormon zur Behandlung von Hypothyreose und Schilddrüsenvergrößerung.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&h=150&fit=crop'
  },
  '00265043': {
    name: 'Ibuprofen AL 400',
    activeIngredient: 'Ibuprofen',
    indication: 'Schmerzen und Entzündungen',
    description: 'Nicht-steroidales Antirheumatikum zur Behandlung von Schmerzen, Fieber und Entzündungen.',
    imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951aa8dc2?w=150&h=150&fit=crop'
  },
  '11160671': {
    name: 'Metformin STADA 1000mg',
    activeIngredient: 'Metformin',
    indication: 'Diabetes mellitus Typ 2',
    description: 'Antidiabetikum zur Senkung des Blutzuckerspiegels bei Typ-2-Diabetes.',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=150&h=150&fit=crop'
  },
  '09999999': {
    name: 'Aspirin protect 100mg',
    activeIngredient: 'Acetylsalicylsäure',
    indication: 'Thromboseprophylaxe',
    description: 'Niedrigdosierte ASS zur Vorbeugung von Herzinfarkt und Schlaganfall.',
    imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=150&h=150&fit=crop'
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
      description: `Medikament mit PZN ${pzn}. Weitere Informationen können beim Arzt oder Apotheker erfragt werden.`,
      imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=150&h=150&fit=crop'
    };
    
  } catch (error) {
    console.error('Fehler beim Laden der Medikamenteninfo:', error);
    return null;
  }
};

export const searchMedicationImage = async (pzn: string): Promise<string | null> => {
  const info = await getMedicationInfo(pzn);
  return info?.imageUrl || null;
};