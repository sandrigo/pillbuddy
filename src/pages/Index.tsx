import { useState, useEffect } from 'react';
import { useMedications } from '@/hooks/useMedications';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { MedicationCard } from '@/components/MedicationCard';
import { MedicationForm } from '@/components/MedicationForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, AlertCircle, Heart, Info } from 'lucide-react';
import { Medication } from '@/types/medication';
import pillbuddyLogo from '@/assets/pillbuddy-logo.png';
import { InstallPWA } from '@/components/InstallPWA';
import { OnlineStatus } from '@/components/OnlineStatus';
import { BottomNav } from '@/components/BottomNav';
import { checkMedicationLevels } from '@/utils/notifications';
import { Link } from 'react-router-dom';

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { medications, addMedication, deleteMedication, updateMedication, updateCurrentAmount, getDaysRemaining, needsRefill } = useMedications();
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Kompakter */}
      <header className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={pillbuddyLogo} 
                alt="PillBuddy Logo" 
                className="w-10 h-10 rounded-full shadow-gentle"
              />
              <h1 className="text-xl font-bold text-foreground">PillBuddy</h1>
            </div>
            <OnlineStatus />
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
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-gentle min-w-[44px] min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Abbrechen' : 'Hinzufügen'}
          </Button>
        </div>

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

      {/* Bottom Navigation */}
      <BottomNav onAddClick={() => setShowForm(true)} />

      {/* Floating About Button */}
      <Link to="/about">
        <Button
          size="icon"
          className="fixed bottom-20 right-5 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          <Info className="h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
};

export default Index;