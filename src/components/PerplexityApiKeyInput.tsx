import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Info } from 'lucide-react';

export const PerplexityApiKeyInput = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('perplexity_api_key') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('perplexity_api_key', apiKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleRemove = () => {
    localStorage.removeItem('perplexity_api_key');
    setApiKey('');
    setSaved(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Perplexity API Einstellungen
        </CardTitle>
        <CardDescription>
          Für die automatische PZN-Suche wird ein Perplexity API Key benötigt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Ihren Perplexity API Key eingeben..."
          />
        </div>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Erhalten Sie Ihren kostenlosen API Key auf{' '}
            <a 
              href="https://www.perplexity.ai/settings/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline text-primary hover:text-primary/80"
            >
              perplexity.ai/settings/api
            </a>
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={!apiKey.trim()}
            className="flex-1"
          >
            Speichern
          </Button>
          {apiKey && (
            <Button 
              variant="outline" 
              onClick={handleRemove}
            >
              Entfernen
            </Button>
          )}
        </div>

        {saved && (
          <Alert>
            <AlertDescription className="text-green-600">
              API Key erfolgreich gespeichert!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};