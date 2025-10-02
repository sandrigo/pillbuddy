import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Über PillBuddy</h1>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Hero Section */}
            <div className="text-center space-y-3 pb-6 border-b border-border">
              <div className="flex items-center justify-center gap-2 text-4xl">
                <Pill className="h-10 w-10 text-primary" />
                <Heart className="h-8 w-8 text-destructive animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold">Über PillBuddy 💊</h2>
            </div>

            {/* Main Content */}
            <div className="space-y-4 text-muted-foreground">
              <p>
                PillBuddy ist mein Herzensprojekt, das ich mithilfe von{' '}
                <strong className="text-foreground">Lovable</strong> und{' '}
                <strong className="text-foreground">Claude</strong> realisiert habe.
              </p>

              <p>
                Die Idee entstand aus dem persönlichen Bedürfnis, nie wieder zu vergessen, 
                rechtzeitig Medikamente nachzubestellen. Was als kleine Idee begann, ist zu 
                einer vollständigen PWA geworden, die offline funktioniert und Push-Benachrichtigungen 
                unterstützt.
              </p>
            </div>

            {/* Developer Section */}
            <div className="bg-primary/5 rounded-lg p-6 space-y-3 border border-primary/20">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                Entwickelt mit <Heart className="h-5 w-5 text-destructive" />
              </h3>
              <p className="text-sm text-muted-foreground">
                Dieses Projekt zeigt, wie moderne No-Code/Low-Code Tools in Kombination mit 
                KI-Assistenten innovative Lösungen ermöglichen.
              </p>
              
              <div className="pt-3 space-y-2 text-sm">
                <div>
                  <strong className="text-foreground">Entwickelt von:</strong> Sandrigo
                </div>
                <div>
                  <strong className="text-foreground">Website:</strong>{' '}
                  <a 
                    href="https://wagehals.media" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    wagehals.media
                  </a>
                </div>
                <div>
                  <strong className="text-foreground">Instagram:</strong>{' '}
                  <a 
                    href="https://instagram.com/sandrigo87" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @sandrigo87
                  </a>
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Tech Stack</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-primary">🚀</span>
                  <span>Lovable (Development Platform)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">🤖</span>
                  <span>Claude (AI Assistant)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">📱</span>
                  <span>Progressive Web App (PWA)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">🔔</span>
                  <span>Push Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">💾</span>
                  <span>Offline-First</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-border text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span><strong>Version:</strong> 1.0</span>
                <span><strong>Letzte Aktualisierung:</strong> Oktober 2024</span>
              </div>
            </div>

            {/* Thank You */}
            <div className="text-center pt-4">
              <p className="text-lg font-medium">
                Vielen Dank, dass du PillBuddy nutzt! 🙏
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Bei Fragen oder Feedback kannst du mich gerne über meine Website oder Instagram kontaktieren.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;