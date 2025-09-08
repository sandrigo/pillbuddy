import { useState } from 'react';
import { useMedications } from '@/hooks/useMedications';
import { MedicationCard } from '@/components/MedicationCard';
import { MedicationForm } from '@/components/MedicationForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Heart, Plus, AlertCircle } from 'lucide-react';

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const { medications, addMedication, deleteMedication, getDaysRemaining, needsRefill } = useMedications();
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

  const refillNeeded = medications.filter(med => needsRefill(med));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-medical text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tabletten Tracker</h1>
              <p className="text-white/90">Ihre Medikamente im Überblick</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {medications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-lg p-4 shadow-soft">
              <div className="text-2xl font-bold text-primary">{medications.length}</div>
              <div className="text-sm text-muted-foreground">Medikamente gesamt</div>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-soft">
              <div className="text-2xl font-bold text-success">{medications.length - refillNeeded.length}</div>
              <div className="text-sm text-muted-foreground">Ausreichend vorrätig</div>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-soft">
              <div className="text-2xl font-bold text-warning">{refillNeeded.length}</div>
              <div className="text-sm text-muted-foreground">Nachschub benötigt</div>
            </div>
          </div>
        )}

        {/* Refill Alerts */}
        {refillNeeded.length > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-warning-foreground">Nachschub benötigt</h3>
            </div>
            <div className="text-sm text-warning-foreground">
              {refillNeeded.map(med => med.name).join(', ')} - Bitte rechtzeitig nachbestellen!
            </div>
          </div>
        )}

        {/* Add Medication Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Meine Medikamente</h2>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-medical hover:opacity-90 transition-opacity"
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
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Keine Medikamente hinzugefügt</h3>
            <p className="text-muted-foreground mb-4">
              Fügen Sie Ihr erstes Medikament hinzu, um mit dem Tracking zu beginnen.
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-medical hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4 mr-2" />
              Erstes Medikament hinzufügen
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {medications.map((medication) => (
              <MedicationCard
                key={medication.id}
                medication={medication}
                daysRemaining={getDaysRemaining(medication)}
                needsRefill={needsRefill(medication)}
                onDelete={handleDeleteMedication}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
