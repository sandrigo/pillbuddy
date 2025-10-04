import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Mail, Instagram, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNavigation } from '@/components/BottomNavigation';

const About = () => {
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
            <h1 className="text-3xl font-bold">Über PillBuddy 💊</h1>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                PillBuddy ist mein Herzensprojekt, das ich mithilfe von <strong>Lovable</strong> und <strong>Claude</strong> realisiert habe.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Die Idee entstand aus dem persönlichen Bedürfnis, nie wieder zu vergessen, rechtzeitig Medikamente nachzubestellen. Was als kleine Idee begann, ist zu einer vollständigen PWA geworden, die offline funktioniert und Push-Benachrichtigungen unterstützt.
              </p>
            </div>

            <div className="pt-4">
              <h2 className="text-xl font-semibold mb-4 text-primary">Entwickelt mit ❤️</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dieses Projekt zeigt, wie moderne No-Code/Low-Code Tools in Kombination mit KI-Assistenten innovative Lösungen ermöglichen.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <p className="font-semibold">Entwickelt von: Sandrigo</p>
              <div className="flex flex-col gap-3">
                <a 
                  href="https://wagehals.media" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  wagehals.media
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a 
                  href="https://instagram.com/sandrigo87/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Instagram className="h-4 w-4" />
                  @sandrigo87
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a 
                  href="mailto:hallo@wagehals.media"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  hallo@wagehals.media
                </a>
              </div>
            </div>

            <div className="pt-4">
              <h2 className="text-xl font-semibold mb-4 text-primary">Tech Stack</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">🚀</span>
                  <div>
                    <a 
                      href="https://lovable.dev/invite/9d5b0a8f-892a-4415-a972-12f154a9d4f5" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Lovable
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-muted-foreground"> - Development Platform</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">🤖</span>
                  <span className="text-muted-foreground">Claude (AI Assistant)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">📱</span>
                  <span className="text-muted-foreground">Progressive Web App (PWA)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">🔔</span>
                  <span className="text-muted-foreground">Push Notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">💾</span>
                  <span className="text-muted-foreground">Offline-First</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span><strong>Version:</strong> 1.0</span>
                <span><strong>Letzte Aktualisierung:</strong> Oktober 2025</span>
              </div>
            </div>

            <div className="pt-4 text-center">
              <p className="text-muted-foreground mb-2">Vielen Dank, dass du PillBuddy nutzt! 🙏</p>
              <p className="text-sm text-muted-foreground">
                Schreib mir gern bei Fragen oder Feedback:{' '}
                <a href="mailto:hallo@wagehals.media" className="text-primary hover:underline">
                  hallo@wagehals.media
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default About;
