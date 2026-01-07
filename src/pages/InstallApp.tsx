import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GovHeader } from '@/components/ui/GovHeader';
import { Footer } from '@/components/Footer';
import { Download, Smartphone, Check, Wifi, Bell, Zap, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { isHindi } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: <Wifi className="w-6 h-6 text-primary" />,
      title: isHindi ? 'ऑफ़लाइन एक्सेस' : 'Offline Access',
      description: isHindi 
        ? 'बिना इंटरनेट के भी ऐप का उपयोग करें'
        : 'Use the app even without internet'
    },
    {
      icon: <Bell className="w-6 h-6 text-primary" />,
      title: isHindi ? 'पुश नोटिफिकेशन' : 'Push Notifications',
      description: isHindi
        ? 'पार्किंग अलर्ट और रिमाइंडर प्राप्त करें'
        : 'Get parking alerts and reminders'
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: isHindi ? 'तेज़ लोडिंग' : 'Fast Loading',
      description: isHindi
        ? 'नेटिव ऐप जैसी स्पीड और परफॉर्मेंस'
        : 'Native app-like speed and performance'
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader 
        title={isHindi ? 'ऐप इंस्टॉल करें' : 'Install App'}
        subtitle={isHindi ? 'NIGAM-Park अपने फोन पर' : 'NIGAM-Park on your phone'}
      />

      <main className="container mx-auto px-4 py-8 max-w-2xl flex-1">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {isHindi ? 'वापस' : 'Back'}
        </Button>

        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {isHindi ? 'NIGAM-Park इंस्टॉल करें' : 'Install NIGAM-Park'}
            </CardTitle>
            <CardDescription>
              {isHindi 
                ? 'अपने फोन की होम स्क्रीन पर ऐप जोड़ें'
                : 'Add the app to your home screen'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isInstalled ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <p className="text-success font-medium">
                  {isHindi ? 'ऐप पहले से इंस्टॉल है!' : 'App is already installed!'}
                </p>
              </div>
            ) : deferredPrompt ? (
              <Button size="lg" onClick={handleInstall} className="gap-2">
                <Download className="w-5 h-5" />
                {isHindi ? 'अभी इंस्टॉल करें' : 'Install Now'}
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {isHindi 
                    ? 'अपने ब्राउज़र मेनू से इंस्टॉल करें:'
                    : 'Install from your browser menu:'}
                </p>
                <div className="text-left bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="font-medium">{isHindi ? 'iPhone पर:' : 'On iPhone:'}</p>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                    <li>{isHindi ? 'Safari में शेयर बटन (⬆️) दबाएं' : 'Tap the Share button (⬆️) in Safari'}</li>
                    <li>{isHindi ? '"होम स्क्रीन में जोड़ें" चुनें' : 'Select "Add to Home Screen"'}</li>
                    <li>{isHindi ? '"जोड़ें" पर टैप करें' : 'Tap "Add"'}</li>
                  </ol>
                  
                  <p className="font-medium mt-4">{isHindi ? 'Android पर:' : 'On Android:'}</p>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                    <li>{isHindi ? 'Chrome में ⋮ मेनू दबाएं' : 'Tap the ⋮ menu in Chrome'}</li>
                    <li>{isHindi ? '"होम स्क्रीन में जोड़ें" चुनें' : 'Select "Add to Home Screen"'}</li>
                    <li>{isHindi ? '"इंस्टॉल करें" पर टैप करें' : 'Tap "Install"'}</li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <h2 className="text-lg font-semibold">
            {isHindi ? 'ऐप की विशेषताएं' : 'App Features'}
          </h2>
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
