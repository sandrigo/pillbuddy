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
    // Entferne Leerzeichen und führende Nullen
    const cleanPzn = pzn.replace(/\s/g, '').replace(/^0+/, '');
    
    // Prüfe zuerst Mock-Datenbank für Demo-Zwecke
    const mockInfo = medicationDatabase[cleanPzn] || medicationDatabase[pzn];
    if (mockInfo) {
      return mockInfo;
    }
    
    // Versuche Informationen von öffentlichen Quellen zu laden
    try {
      // Verwende CORS-Proxy für Web-Scraping von gelbe-liste.de
      const proxyUrl = 'https://api.allorigins.win/get?url=';
      const targetUrl = `https://www.gelbe-liste.de/suche?q=${encodeURIComponent(pzn)}`;
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      const data = await response.json();
      
      if (data.contents) {
        const htmlContent = data.contents;
        
        // Einfache HTML-Parsing für Medikamentenname
        const nameMatch = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                         htmlContent.match(/<title>([^<]+)\s*-\s*gelbe liste/i);
        
        const descriptionMatch = htmlContent.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        
        if (nameMatch && nameMatch[1]) {
          let name = nameMatch[1].trim();
          let activeIngredient = 'Nicht verfügbar';
          let indication = 'Siehe Packungsbeilage';
          let description = descriptionMatch ? descriptionMatch[1] : `Medikament mit PZN ${pzn}`;
          
          // Versuche Wirkstoff aus dem Namen zu extrahieren
          const ingredientMatch = name.match(/\b(Ibuprofen|Paracetamol|Aspirin|ASS|Metformin|Levothyroxin|Thyroxin|Amoxicillin|Diclofenac|Omeprazol|Pantoprazol|Bisoprolol|Ramipril|Simvastatin|Atorvastatin)\b/i);
          if (ingredientMatch) {
            activeIngredient = ingredientMatch[1];
          }
          
          return {
            name: name,
            activeIngredient: activeIngredient,
            indication: indication,
            description: description
          };
        }
      }
    } catch (webError) {
      console.log('Web-Scraping fehlgeschlagen, verwende Fallback');
    }
    
    // Erweiterte Mock-Datenbank als Fallback
    const extendedDatabase: Record<string, MedicationInfo> = {
      ...medicationDatabase,
      // Häufige Medikamente hinzufügen
      'ibuprofen': {
        name: 'Ibuprofen 400mg',
        activeIngredient: 'Ibuprofen',
        indication: 'Schmerzen und Entzündungen',
        description: 'Nicht-steroidales Antirheumatikum zur Behandlung von Schmerzen, Fieber und Entzündungen.'
      },
      'paracetamol': {
        name: 'Paracetamol 500mg',
        activeIngredient: 'Paracetamol',
        indication: 'Schmerzen und Fieber',
        description: 'Schmerzstillender und fiebersenkender Wirkstoff.'
      },
      'aspirin': {
        name: 'Aspirin 500mg',
        activeIngredient: 'Acetylsalicylsäure',
        indication: 'Schmerzen, Fieber, Entzündungen',
        description: 'Schmerzstillend, fiebersenkend und entzündungshemmend.'
      }
    };
    
    // Suche nach ähnlichen Namen in der erweiterten Datenbank
    const searchTerm = cleanPzn.toLowerCase();
    const similarMatch = Object.entries(extendedDatabase).find(([key, value]) => 
      key.toLowerCase().includes(searchTerm) || 
      value.name.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(key.toLowerCase())
    );
    
    if (similarMatch) {
      return similarMatch[1];
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
    
    // Fallback bei Fehler
    return {
      name: 'Unbekanntes Medikament',
      activeIngredient: 'Nicht verfügbar', 
      indication: 'Keine Information verfügbar',
      description: `Medikament mit PZN ${pzn}. Weitere Informationen können beim Arzt oder Apotheker erfragt werden.`
    };
  }
};