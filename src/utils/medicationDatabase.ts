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
    
    // Suche im Internet nach PZN-Informationen
    const searchQuery = `PZN ${pzn} Medikament Wirkstoff Anwendung site:gelbe-liste.de OR site:aponet.de OR site:apotheken-umschau.de`;
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getPerplexityApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Medikamenten-Experte. Gib IMMER eine strukturierte Antwort im JSON-Format zurück mit den Feldern: name, activeIngredient, indication, description. Antworte nur mit dem JSON-Objekt, ohne zusätzlichen Text.'
          },
          {
            role: 'user',
            content: `Finde Informationen zu PZN ${pzn}. Gib mir Name, Wirkstoff, Anwendungsgebiet und Beschreibung zurück.`
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 500,
        return_images: false,
        return_related_questions: false,
        search_domain_filter: ['gelbe-liste.de', 'aponet.de', 'apotheken-umschau.de'],
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.name && parsed.activeIngredient) {
            return {
              name: parsed.name,
              activeIngredient: parsed.activeIngredient,
              indication: parsed.indication || 'Keine Information verfügbar',
              description: parsed.description || `Medikament mit PZN ${pzn}`
            };
          }
        } catch (parseError) {
          console.error('Fehler beim Parsen der API-Antwort:', parseError);
        }
      }
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

// Hilfsfunktion für API-Key
const getPerplexityApiKey = (): string => {
  // In einer echten Anwendung sollte dieser Key aus den Umgebungsvariablen kommen
  // Für Demo-Zwecke verwenden wir einen Platzhalter
  const apiKey = localStorage.getItem('perplexity_api_key');
  if (!apiKey) {
    throw new Error('Perplexity API Key nicht gefunden. Bitte in den Einstellungen hinterlegen.');
  }
  return apiKey;
};