import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Bell, Trash2, TestTube2, Smartphone, Wifi, Download, Upload, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNavigation } from '@/components/BottomNavigation';
import { EmailNotificationSettings } from '@/components/EmailNotificationSettings';
import { useMedications } from '@/hooks/useMedications';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
  isIOS,
  NotificationSettings as NotificationSettingsType
} from '@/utils/notifications';

const Settings = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportMedications, importMedications } = useMedications();
  const [settings, setSettings] = useState<NotificationSettingsType>(getNotificationSettings());
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    isNotificationSupported() ? Notification.permission : 'denied'
  );
  const [swStatus, setSwStatus] = useState<'active' | 'installing' | 'waiting' | 'none'>('none');
  const [cacheSize, setCacheSize] = useState<string>('Berechne...');

  useEffect(() => {
    checkServiceWorkerStatus();
    checkCacheSize();
  }, []);

  const checkServiceWorkerStatus = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        if (registration.active) setSwStatus('active');
        else if (registration.installing) setSwStatus('installing');
        else if (registration.waiting) setSwStatus('waiting');
      }
    }
  };

  const checkCacheSize = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
      setCacheSize(`${usedMB} MB`);
    } else {
      setCacheSize('Nicht verfügbar');
    }
  };

  const handleSettingsChange = (key: keyof NotificationSettingsType, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    toast.success('Einstellungen gespeichert');
  };

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      toast.success('Benachrichtigungen aktiviert');
    } else {
      toast.error('Benachrichtigungen abgelehnt');
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      toast.success('Test-Benachrichtigung gesendet');
    } else {
      toast.error('Fehler beim Senden der Test-Benachrichtigung');
    }
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      toast.success('Cache geleert');
      checkCacheSize();
    }
  };

  const handleExport = () => {
    exportMedications();
    toast.success('Export erfolgreich', {
      description: 'Medikamentenliste wurde heruntergeladen.',
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
          toast.success('Import erfolgreich', {
            description: 'Medikamentenliste wurde importiert.',
          });
        } else {
          toast.error('Import fehlgeschlagen', {
            description: 'Die Datei konnte nicht gelesen werden.',
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

  const getPermissionBadge = () => {
    switch (notificationPermission) {
      case 'granted':
        return <span className="text-green-600 text-sm">✓ Aktiviert</span>;
      case 'denied':
        return <span className="text-red-600 text-sm">✗ Blockiert</span>;
      default:
        return <span className="text-yellow-600 text-sm">⚠ Ausstehend</span>;
    }
  };

  const getSWStatusBadge = () => {
    switch (swStatus) {
      case 'active':
        return <span className="text-green-600 text-sm">✓ Aktiv</span>;
      case 'installing':
        return <span className="text-yellow-600 text-sm">⏳ Installiert...</span>;
      case 'waiting':
        return <span className="text-yellow-600 text-sm">⏸ Wartet</span>;
      default:
        return <span className="text-red-600 text-sm">✗ Nicht installiert</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Einstellungen</h1>
            <p className="text-muted-foreground">PillBuddy Konfiguration</p>
          </div>
        </div>

        {/* App Functions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              App-Funktionen
            </CardTitle>
            <CardDescription>
              Daten verwalten und Email-Einstellungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleExport}
              variant="outline"
              className="w-full justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Medikamentenliste
            </Button>
            
            <Button
              onClick={handleImportClick}
              variant="outline"
              className="w-full justify-start"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Medikamentenliste
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />

            <Separator />

            <Button
              onClick={() => setShowEmailSettings(!showEmailSettings)}
              variant="outline"
              className="w-full justify-start border-primary/30 text-primary hover:bg-primary/5"
            >
              <Mail className="h-4 w-4 mr-2" />
              {showEmailSettings ? 'Email-Setup schließen' : 'Email-Setup öffnen'}
            </Button>

            {showEmailSettings && (
              <div className="mt-4">
                <EmailNotificationSettings />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Benachrichtigungen
            </CardTitle>
            <CardDescription>
              Erinnerungen für niedrige Medikamentenvorräte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* iOS Warning */}
            {isIOS() && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm">
                <p className="font-medium mb-1">ℹ️ iOS Einschränkung</p>
                <p className="text-muted-foreground">
                  Push-Benachrichtigungen sind auf iOS eingeschränkt. Verwenden Sie Email-Erinnerungen als Alternative.
                </p>
              </div>
            )}

            {/* Permission Status */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Benachrichtigungs-Berechtigung</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Status: {getPermissionBadge()}
                </p>
              </div>
              {notificationPermission !== 'granted' && (
                <Button onClick={handleRequestPermission} size="sm">
                  Aktivieren
                </Button>
              )}
            </div>

            <Separator />

            {/* Enable/Disable Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications-enabled">Benachrichtigungen aktivieren</Label>
                <p className="text-sm text-muted-foreground">
                  Erinnerungen bei niedrigem Vorrat
                </p>
              </div>
              <Switch
                id="notifications-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => handleSettingsChange('enabled', checked)}
              />
            </div>

            {/* Thresholds */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warning-threshold">Warnschwelle (Tage)</Label>
                <Input
                  id="warning-threshold"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.warningThreshold}
                  onChange={(e) => handleSettingsChange('warningThreshold', parseInt(e.target.value) || 7)}
                  className="w-32"
                />
                <p className="text-sm text-muted-foreground">
                  Benachrichtigung bei ≤ {settings.warningThreshold} Tagen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgent-threshold">Dringend-Schwelle (Tage)</Label>
                <Input
                  id="urgent-threshold"
                  type="number"
                  min="0"
                  max="10"
                  value={settings.urgentThreshold}
                  onChange={(e) => handleSettingsChange('urgentThreshold', parseInt(e.target.value) || 3)}
                  className="w-32"
                />
                <p className="text-sm text-muted-foreground">
                  Dringende Benachrichtigung bei ≤ {settings.urgentThreshold} Tagen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="critical-threshold">Kritische Schwelle (Tage)</Label>
                <Input
                  id="critical-threshold"
                  type="number"
                  min="0"
                  max="5"
                  value={settings.criticalThreshold}
                  onChange={(e) => handleSettingsChange('criticalThreshold', parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <p className="text-sm text-muted-foreground">
                  Kritische Benachrichtigung bei ≤ {settings.criticalThreshold} Tagen
                </p>
              </div>
            </div>

            <Separator />

            {/* Test Notification */}
            <Button
              onClick={handleTestNotification}
              variant="outline"
              className="w-full"
              disabled={notificationPermission !== 'granted'}
            >
              <TestTube2 className="h-4 w-4 mr-2" />
              Test-Benachrichtigung senden
            </Button>
          </CardContent>
        </Card>

        {/* PWA Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              PWA Status
            </CardTitle>
            <CardDescription>
              Progressive Web App Informationen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Service Worker</Label>
                <p className="font-medium mt-1">{getSWStatusBadge()}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Installiert</Label>
                <p className="font-medium mt-1">
                  {window.matchMedia('(display-mode: standalone)').matches ? (
                    <span className="text-green-600 text-sm">✓ Ja</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Nein</span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Cache Größe</Label>
                <p className="font-medium mt-1">{cacheSize}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Online Status</Label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  {navigator.onLine ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            <Separator />

            <Button
              onClick={handleClearCache}
              variant="outline"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cache leeren
            </Button>
          </CardContent>
        </Card>

        {/* Debug Info (Development only) */}
        {import.meta.env.DEV && (
          <Card>
            <CardHeader>
              <CardTitle>🔧 Debug Information</CardTitle>
              <CardDescription>
                Nur in Entwicklungsumgebung sichtbar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-mono">
              <div>
                <strong>Notification API:</strong> {isNotificationSupported() ? '✓' : '✗'}
              </div>
              <div>
                <strong>Service Worker:</strong> {'serviceWorker' in navigator ? '✓' : '✗'}
              </div>
              <div>
                <strong>iOS Device:</strong> {isIOS() ? '✓' : '✗'}
              </div>
              <div>
                <strong>User Agent:</strong> {navigator.userAgent}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Settings;
