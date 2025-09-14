import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useMedications } from '@/hooks/useMedications';
import { Mail, Send, Settings, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export const EmailNotificationSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState({
    serviceId: '',
    templateId: '',
    publicKey: '',
    toEmail: ''
  });
  const { smtpConfig, saveSMTPConfig, checkAndSendNotifications } = useEmailNotifications();
  const { medications, getDaysRemaining } = useMedications();
  const { toast } = useToast();

  const handleSaveConfig = () => {
    if (!tempConfig.serviceId || !tempConfig.templateId || !tempConfig.publicKey || !tempConfig.toEmail) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive",
      });
      return;
    }

    if (!tempConfig.toEmail.includes('@')) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
        variant: "destructive",
      });
      return;
    }

    saveSMTPConfig(tempConfig);
    setShowConfig(false);
    setTempConfig({ serviceId: '', templateId: '', publicKey: '', toEmail: '' });
    toast({
      title: "SMTP konfiguriert",
      description: "E-Mail-Einstellungen wurden erfolgreich gespeichert",
    });
  };

  const handleTestNotifications = async () => {
    if (!smtpConfig) {
      toast({
        title: "Fehler",
        description: "Bitte konfigurieren Sie zunächst die E-Mail-Einstellungen",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const results = await checkAndSendNotifications(medications, getDaysRemaining);
      const sentCount = results.filter(r => r.success).length;
      
      if (sentCount > 0) {
        toast({
          title: "Benachrichtigungen gesendet",
          description: `${sentCount} Email-Benachrichtigung${sentCount !== 1 ? 'en' : ''} wurde${sentCount !== 1 ? 'n' : ''} gesendet`,
        });
      } else {
        toast({
          title: "Keine Benachrichtigungen",
          description: "Alle Medikamente haben ausreichend Vorrat oder wurden bereits benachrichtigt",
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim Senden der Benachrichtigungen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const lowStockMedications = medications.filter(med => {
    const days = getDaysRemaining(med);
    return days <= 14;
  });

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-medical">
            <Mail className="h-4 w-4 text-white" />
          </div>
          Email-Benachrichtigungen
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* SMTP Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">E-Mail Status</Label>
            {smtpConfig ? (
              <Badge variant="outline" className="border-success text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Konfiguriert
              </Badge>
            ) : (
              <Badge variant="outline" className="border-warning text-warning">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Nicht konfiguriert
              </Badge>
            )}
          </div>
          
          {!smtpConfig ? (
            !showConfig ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Konfigurieren Sie EmailJS für kostenlose E-Mail-Benachrichtigungen
                </p>
                <Button onClick={() => setShowConfig(true)} variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  E-Mail konfigurieren
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="serviceId">Service ID</Label>
                    <Input
                      id="serviceId"
                      value={tempConfig.serviceId}
                      onChange={(e) => setTempConfig({...tempConfig, serviceId: e.target.value})}
                      placeholder="service_xxxxxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateId">Template ID</Label>
                    <Input
                      id="templateId"
                      value={tempConfig.templateId}
                      onChange={(e) => setTempConfig({...tempConfig, templateId: e.target.value})}
                      placeholder="template_xxxxxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="publicKey">Public Key</Label>
                    <Input
                      id="publicKey"
                      value={tempConfig.publicKey}
                      onChange={(e) => setTempConfig({...tempConfig, publicKey: e.target.value})}
                      placeholder="xxxxxxxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="toEmail">Ihre E-Mail</Label>
                    <Input
                      id="toEmail"
                      type="email"
                      value={tempConfig.toEmail}
                      onChange={(e) => setTempConfig({...tempConfig, toEmail: e.target.value})}
                      placeholder="ihre@email.de"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveConfig} className="flex-1">
                    Speichern
                  </Button>
                  <Button onClick={() => setShowConfig(false)} variant="outline">
                    Abbrechen
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Erstellen Sie kostenlos einen Account bei EmailJS und konfigurieren Sie einen E-Mail-Service.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                E-Mail konfiguriert für: {smtpConfig.toEmail}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  saveSMTPConfig(null);
                  toast({ title: "E-Mail entfernt", description: "E-Mail-Konfiguration wurde entfernt" });
                }}
              >
                Neu konfigurieren
              </Button>
            </div>
          )}
        </div>

        {/* Notification Schedule */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Benachrichtigungs-Schema</Label>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• 14 Tage vorher: Erste Warnung</div>
            <div>• 7 Tage vorher: Zweite Warnung</div>
            <div>• 1-7 Tage: Tägliche Erinnerungen mit Countdown</div>
          </div>
        </div>

        {/* Current Status */}
        {lowStockMedications.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Aktuelle Warnungen</Label>
            <div className="space-y-1">
              {lowStockMedications.map(med => {
                const days = getDaysRemaining(med);
                const urgency = days <= 7 ? 'error' : 'warning';
                return (
                  <div key={med.id} className="flex justify-between items-center text-sm">
                    <span>{med.name}</span>
                    <Badge variant="outline" className={urgency === 'error' ? 'border-destructive text-destructive' : 'border-warning text-warning'}>
                      {days} Tag{days !== 1 ? 'e' : ''}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleTestNotifications}
            disabled={!smtpConfig || isLoading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Sende...' : 'Benachrichtigungen jetzt prüfen'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('https://www.emailjs.com', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            EmailJS Account erstellen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};