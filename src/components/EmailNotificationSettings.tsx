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
  const [tempWebhookUrl, setTempWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { webhookUrl, saveWebhookUrl, checkAndSendNotifications } = useEmailNotifications();
  const { medications, getDaysRemaining } = useMedications();
  const { toast } = useToast();

  const handleSaveWebhook = () => {
    if (!tempWebhookUrl.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine gültige Zapier Webhook URL ein",
        variant: "destructive",
      });
      return;
    }

    saveWebhookUrl(tempWebhookUrl.trim());
    setTempWebhookUrl('');
    toast({
      title: "Webhook gespeichert",
      description: "Zapier Webhook URL wurde erfolgreich gespeichert",
    });
  };

  const handleTestNotifications = async () => {
    if (!webhookUrl) {
      toast({
        title: "Fehler",
        description: "Bitte konfigurieren Sie zunächst die Zapier Webhook URL",
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
        {/* Webhook Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Zapier Webhook Status</Label>
            {webhookUrl ? (
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
          
          {!webhookUrl ? (
            <div className="space-y-2">
              <Label htmlFor="webhook">Zapier Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook"
                  type="url"
                  value={tempWebhookUrl}
                  onChange={(e) => setTempWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="flex-1"
                />
                <Button onClick={handleSaveWebhook} variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Erstellen Sie einen Zap mit "Webhooks by Zapier" als Trigger und einem Email-Service als Action.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Webhook konfiguriert: {webhookUrl.substring(0, 40)}...
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  saveWebhookUrl('');
                  toast({ title: "Webhook entfernt", description: "Zapier Webhook wurde entfernt" });
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
            disabled={!webhookUrl || isLoading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Sende...' : 'Benachrichtigungen jetzt prüfen'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('https://zapier.com/apps/webhooks/integrations', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Zapier Webhook erstellen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};