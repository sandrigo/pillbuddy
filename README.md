# PillBuddy

V1.1 Changes 04.10.2025: 
### 1. Header kompakter (80px statt 200px)

- Logo von 64px auf 40px verkleinert
- Tagline "Ihr digitaler Medikamenten-Assistent" entfernt
- "Gesund bleiben leicht gemacht" Text entfernt
- Kompaktes Layout mit nur Logo + Name + Online-Status + Settings-Icon

### 2. Buttons aufgeräumt

- Export, Import und Email-Setup aus Hauptseite entfernt
- Nur "Hinzufügen" Button bleibt sichtbar
- Alle 3 Funktionen ins Settings-Menü unter "App-Funktionen" verschoben

### 3. "Über PillBuddy" Feature

- Neue About-Seite mit vollständigem Inhalt erstellt (Herzensprojekt, Tech Stack, Kontakte)
- Floating Button (ℹ️) unten rechts auf Hauptseite (80px vom Rand)
- Alle Links funktional (wagehals.media, Instagram, Email, Lovable)
- Route `/about` hinzugefügt

### 4. Medikamenten-Karten verbessert

- __Prominente Tage-Anzeige__: "Vorrat für X Tage" groß und fett

- __Fortschrittsbalken__: Visueller Progress-Bar mit Farbcodierung

- __Farbiger linker Border__ (4px):

  - Grün: > 14 Tage
  - Gelb: 7-14 Tage
  - Orange: 3-7 Tage
  - Rot: < 3 Tage

- __Medikamenteninfo eingeklappt__: Click auf Button zum Aufklappen (▼/▲)

- Mehr Abstand zwischen Karten (24px statt 16px)

### 5. Löschen-Bestätigung

- Bestätigungs-Dialog: "Medikament '[Name]' wirklich löschen?"
- Toast-Nachricht: "Medikament gelöscht" nach Bestätigung

### 6. PZN-Suche komplett entfernt

- Kein PZN-Lookup Button mehr
- Kein "Medikamenteninfo manuell bearbeiten" Toggle
- Alle Felder (Wirkstoff, Anwendungsgebiet, Beschreibung, Notizen) sind IMMER editierbar
- Alle optionalen Felder klar markiert mit "(optional)"
- Vereinfachtes Formular

### 7. Spacing optimiert

- Stats-Karten: 3 Spalten, kompakter (gap-3 statt gap-4)
- Text kürzer: "Gesamt", "Vorrätig", "Nachschub"
- Medikamenten-Liste: space-y-6 für besseren Abstand
- Bottom padding: pb-24 für Bottom Navigation

### 8. Bottom Navigation

- Neue Komponente mit 3 Tabs: 🏠 Home, ➕ Hinzufügen, ⚙️ Settings
- Fixed am unteren Rand (z-50)
- Aktiver Tab in Grün (#4FD1C5)
- In allen Pages integriert (Index, Settings, About)
- Hinzufügen-Tab öffnet ?add=true Parameter

### 9. Weitere Verbesserungen

- Types erweitert: MedicationFormData enthält alle neuen Felder
- MedicationEditForm: Felder immer editierbar
- Progress-Bar: Custom Implementation für Farbcodierung
- Alle Pages: pb-24 für Bottom Navigation Platz

## 📱 Mobile-First Design

Die App ist nun deutlich kompakter und übersichtlicher auf mobilen Geräten:

- Header: 80px (vorher ~200px)
- Wichtige Infos prominent (Vorrat für X Tage)
- Floating Button für Über-Seite
- Bottom Navigation für schnelle Navigation
- Touch-optimierte Buttons und Icons


