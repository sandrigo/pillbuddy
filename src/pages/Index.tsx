import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useMedications } from '@/hooks/useMedications';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { MedicationCard } from '@/components/MedicationCard';
import { MedicationForm } from '@/components/MedicationForm';
import { EmailNotificationSettings } from '@/components/EmailNotificationSettings';
import { PillsEasterEgg } from '@/components/PillsEasterEgg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Heart, Plus, AlertCircle, Settings as SettingsIcon, Info } from 'lucide-react';
import { Medication } from '@/types/medication';
import pillbuddyLogo from '@/assets/pillbuddy-logo.png';
import { InstallPWA } from '@/components/InstallPWA';
import { OnlineStatus } from '@/components/OnlineStatus';
import { checkMedicationLevels } from '@/utils/notifications';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Link } from 'react-router-dom';

const Index = () => {
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'stocked' | 'refill'>('all');
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const { medications, addMedication, deleteMedication, updateMedication, updateCurrentAmount, getDaysRemaining, needsRefill, recordIntake, getLastIntake } = useMedications();
  const { toast } = useToast();
  const formInputRef = useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    setLogoClickCount((prev) => {
      const newCount = prev + 1;
      if (newCount === 7) {
        setShowEasterEgg(true);
        return 0; // Reset counter
      }
      return newCount;
    });
  };

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
    if (window.confirm(`Medikament "${medication?.name}" wirklich löschen?`)) {
      deleteMedication(id);
      toast({
        title: "Medikament gelöscht",
        description: `${medication?.name} wurde aus Ihrer Liste entfernt.`,
      });
    }
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

  const handleRecordIntake = (id: string, amount: number, note?: string) => {
    const medication = medications.find(med => med.id === id);
    recordIntake(id, amount, note);
    toast({
      title: "Einnahme erfasst ✓",
      description: `${medication?.name}: ${amount} Tablette${amount !== 1 ? 'n' : ''} entnommen${note ? ` (${note})` : ''}.`,
    });
  };

  // Apply filters
  let filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply status filter
  if (statusFilter === 'stocked') {
    filteredMedications = filteredMedications.filter(med => !needsRefill(med));
  } else if (statusFilter === 'refill') {
    filteredMedications = filteredMedications.filter(med => needsRefill(med));
  }

  const refillNeeded = medications.filter(med => needsRefill(med));

  const handleFilterClick = (filter: 'all' | 'stocked' | 'refill') => {
    setStatusFilter(statusFilter === filter ? 'all' : filter);
  };

  // Auto-check for PWA notifications
  useEffect(() => {
    if (medications.length > 0) {
      checkMedicationLevels(medications, getDaysRemaining);
    }
  }, [medications.length]);

  // Check URL parameter to open form
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === 'true') {
      setShowForm(true);
    }
  }, [location]);

  // Focus and scroll to form when it opens
  useEffect(() => {
    if (showForm && formInputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        formInputRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        // Additional delay for focus after scroll starts
        setTimeout(() => {
          formInputRef.current?.focus();
        }, 300);
      }, 100);
    }
  }, [showForm]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Kompakt */}
      <header className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={pillbuddyLogo} 
                alt="PillBuddy Logo" 
                onClick={handleLogoClick}
                className="w-10 h-10 rounded-full shadow-gentle cursor-pointer hover:scale-110 transition-transform"
              />
              <h1 className="text-2xl font-bold text-foreground">PillBuddy</h1>
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Stats - Klickbar zum Filtern */}
        {medications.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div 
              onClick={() => handleFilterClick('all')}
              className={`bg-card rounded-lg p-5 shadow-gentle border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 ${
                statusFilter === 'all' ? 'border-primary border-2 ring-2 ring-primary/20' : 'border-border/50 hover:border-primary/50'
              }`}
            >
              <div className="text-2xl font-bold text-primary">{medications.length}</div>
              <div className="text-xs text-muted-foreground">Gesamt</div>
            </div>
            <div 
              onClick={() => handleFilterClick('stocked')}
              className={`bg-card rounded-lg p-5 shadow-gentle border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 ${
                statusFilter === 'stocked' ? 'border-success border-2 ring-2 ring-success/20' : 'border-border/50 hover:border-success/50'
              }`}
            >
              <div className="text-2xl font-bold text-success">{medications.length - refillNeeded.length}</div>
              <div className="text-xs text-muted-foreground">Vorrätig</div>
            </div>
            <div 
              onClick={() => handleFilterClick('refill')}
              className={`bg-card rounded-lg p-5 shadow-gentle border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 ${
                statusFilter === 'refill' ? 'border-warning border-2 ring-2 ring-warning/20' : 'border-border/50 hover:border-warning/50'
              }`}
            >
              <div className="text-2xl font-bold text-warning">{refillNeeded.length}</div>
              <div className="text-xs text-muted-foreground">Nachschub</div>
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-gentle"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Abbrechen' : 'Hinzufügen'}
          </Button>
        </div>

        {/* Add Medication Form */}
        {showForm && (
          <MedicationForm ref={formInputRef} onSubmit={handleAddMedication} />
        )}

        {/* Medications List */}
        {medications.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-primary/5 rounded-full w-fit mx-auto mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Willkommen bei PillBuddy!</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Fügen Sie Ihr erstes Medikament hinzu, um mit der smarten Verwaltung Ihrer Gesundheit zu beginnen.
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
          <div className="space-y-6 transition-all duration-300">
            {filteredMedications.map((medication) => (
              <div key={medication.id} className="animate-in fade-in slide-in-from-top-2 duration-200">
                <MedicationCard
                  medication={medication}
                  daysRemaining={getDaysRemaining(medication)}
                  needsRefill={needsRefill(medication)}
                  onDelete={handleDeleteMedication}
                  onUpdateAmount={handleUpdateAmount}
                  onUpdateMedication={handleUpdateMedication}
                  onRecordIntake={handleRecordIntake}
                  lastIntake={getLastIntake(medication)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating "Über PillBuddy" Button */}
      <Link to="/about">
        <Button
          className="fixed bottom-20 right-5 rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90 z-40"
          size="icon"
        >
          <Info className="h-5 w-5" />
        </Button>
      </Link>

      {/* PWA Install Prompt */}
      <InstallPWA />
      
      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Easter Egg - Bouncing Pills */}
      <PillsEasterEgg 
        active={showEasterEgg} 
        onComplete={() => setShowEasterEgg(false)} 
      />
    </div>
  );
};

export default Index;
