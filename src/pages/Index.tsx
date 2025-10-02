import { useState, useEffect, useRef } from 'react';
import { useMedications } from '@/hooks/useMedications';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { MedicationCard } from '@/components/MedicationCard';
import { MedicationForm } from '@/components/MedicationForm';
import { EmailNotificationSettings } from '@/components/EmailNotificationSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Heart, Plus, AlertCircle, Mail, Settings as SettingsIcon, Download, Upload } from 'lucide-react';
import { Medication } from '@/types/medication';
import pillbuddyLogo from '@/assets/pillbuddy-logo.png';
import { InstallPWA } from '@/components/InstallPWA';
import { OnlineStatus } from '@/components/OnlineStatus';
import { checkMedicationLevels } from '@/utils/notifications';
import { Link } from 'react-router-dom';

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { medications, addMedication, deleteMedication, updateMedication, updateCurrentAmount, getDaysRemaining, needsRefill, exportMedications, importMedications } = useMedications();
  const { checkAndSendNotifications } = useEmailNotifications();
  const { toast } = useToast();

  const handleAddMedication = (data: any) => {
    addMedication(data);
    setShowForm(false);
    toast({
      title: "Medikament hinzugefügt",
      description: `${data.name} wurde erfolgreich zu Ihrer Liste hinzugefügt.`,
    });
  };

  const handleDeleteMedication = (id: string) => {
    const medication = medications.find(med => med.id === id);
    deleteMedication(id);
    toast({
      title: "Medikament entfernt",
      description: `${medication?.name} wurde aus Ihrer Liste entfernt.`,
      variant: "destructive",
    });
  };

  const handleUpdateAmount = (id: string, newAmount: number) => {
    const medication = medications.find(med => med.id === id);
    updateCurrentAmount(id, newAmount);
    toast({
      title: "Vorrat aktualisiert",
      description: `${medication?.name}: Neuer Vorrat ${newAmount} Tabletten.`,
    });
  };

  const handleUpdateMedication = (id: string, updates: Partial<Medication>) => {
    updateMedication(id, updates);
    toast({
      title: "Medikament aktualisiert",
      description: "Die Änderungen wurden gespeichert.",
    });
  };

  const handleExport = () => {
    exportMedications();
    toast({
      title: "Export erfolgreich",
      description: "Medikamentenliste wurde heruntergeladen.",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const success = importMedications(content);
        if (success) {
          toast({
            title: "Import erfolgreich",
            description: "Medikamentenliste wurde importiert.",
          });
        } else {
          toast({
            title: "Import fehlgeschlagen",
            description: "Die Datei konnte nicht gelesen werden.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const refillNeeded = filteredMedications.filter(med => needsRefill(med));

  // Auto-check for email notifications on app load and when medications change
  useEffect(() => {
    if (medications.length > 0) {
      checkAndSendNotifications(medications, getDaysRemaining);
    }
  }, [medications.length]); // Only trigger on medication count change, not on every update

  // Auto-check for PWA notifications
  useEffect(() => {
    if (medications.length > 0) {
      checkMedicationLevels(medications, getDaysRemaining);
    }
  }, [medications.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 border-b border-border/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4 flex-1 justify-center">
                <img 
                  src={pillbuddyLogo} 
                  alt="PillBuddy Logo" 
                  className="w-16 h-16 rounded-full shadow-gentle"
                />
                <div>
                  <h1 className="text-3xl font-bold text-foreground">PillBuddy</h1>
                  <p className="text-muted-foreground">Ihr digitaler Medikamenten-Assistent</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <OnlineStatus />
                <Link to="/settings">
                  <Button variant="ghost" size="icon">
                    <SettingsIcon className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-primary" />
              <span>Gesund bleiben leicht gemacht</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {medications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg p-4 shadow-gentle border border-border/50">
              <div className="text-2xl font-bold text-primary">{medications.length}</div>
              <div className="text-sm text-muted-foreground">Medikamente gesamt</div>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-gentle border border-border/50">
              <div className="text-2xl font-bold text-success">{medications.length - refillNeeded.length}</div>
              <div className="text-sm text-muted-foreground">Ausreichend vorrätig</div>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-gentle border border-border/50">
              <div className="text-2xl font-bold text-warning">{refillNeeded.length}</div>
              <div className="text-sm text-muted-foreground">Nachschub benötigt</div>
            </div>
          </div>
        )}

        {/* Refill Alerts */}
        {refillNeeded.length > 0 && (
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-warning-foreground">Nachschub benötigt</h3>
            </div>
            <div className="text-sm text-warning-foreground">
              {refillNeeded.map(med => med.name).join(', ')} - Bitte rechtzeitig nachbestellen!
            </div>
          </div>
        )}

        {/* Search Bar */}
        {medications.length > 0 && (
          <div className="relative">
            <Input
              type="text"
              placeholder="Medikament suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80"
            />
          </div>
        )}

        {/* Add Medication Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Meine Medikamente</h2>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleExport}
              size="sm"
              disabled={medications.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={handleImportClick}
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEmailSettings(!showEmailSettings)}
              className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Mail className="h-4 w-4" />
              {showEmailSettings ? 'Schließen' : 'Email-Setup'}
            </Button>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-gentle"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Abbrechen' : 'Hinzufügen'}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />

        {/* Email Notification Settings */}
        {showEmailSettings && (
          <EmailNotificationSettings />
        )}

        {/* Add Medication Form */}
        {showForm && (
          <MedicationForm onSubmit={handleAddMedication} />
        )}

        {/* Medications List */}
        {medications.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-primary/5 rounded-full w-fit mx-auto mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Willkommen bei PillBuddy!</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Fügen Sie Ihr erstes Medikament hinzu, um mit der sanften Verwaltung Ihrer Gesundheit zu beginnen.
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-gentle"
            >
              <Plus className="h-4 w-4 mr-2" />
              Erstes Medikament hinzufügen
            </Button>
          </div>
        ) : filteredMedications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Keine Medikamente gefunden für "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMedications.map((medication) => (
              <MedicationCard
                key={medication.id}
                medication={medication}
                daysRemaining={getDaysRemaining(medication)}
                needsRefill={needsRefill(medication)}
                onDelete={handleDeleteMedication}
                onUpdateAmount={handleUpdateAmount}
                onUpdateMedication={handleUpdateMedication}
              />
            ))}
          </div>
        )}
      </main>

      {/* PWA Install Prompt */}
      <InstallPWA />
    </div>
  );
};

export default Index;