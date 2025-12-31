import React, { useState, useEffect } from 'react';
import { Navigation, Volume2, VolumeX, MapPin, ArrowUp, ArrowRight, ArrowLeft, RotateCw, Check, Car, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface NavigationStep {
  id: number;
  instruction: string;
  instructionHi: string;
  direction: 'straight' | 'left' | 'right' | 'uturn' | 'arrive';
  distance: string;
  distanceHi: string;
  landmark?: string;
  landmarkHi?: string;
}

const mockNavigationSteps: NavigationStep[] = [
  { 
    id: 1, 
    instruction: 'Enter from Gate 2 and proceed straight', 
    instructionHi: 'गेट 2 से प्रवेश करें और सीधे चलें',
    direction: 'straight', 
    distance: '50m', 
    distanceHi: '50 मीटर',
    landmark: 'Security Booth',
    landmarkHi: 'सुरक्षा बूथ'
  },
  { 
    id: 2, 
    instruction: 'Turn left at the first intersection', 
    instructionHi: 'पहले चौराहे पर बाएं मुड़ें',
    direction: 'left', 
    distance: '30m', 
    distanceHi: '30 मीटर',
    landmark: 'EV Charging Zone',
    landmarkHi: 'ईवी चार्जिंग जोन'
  },
  { 
    id: 3, 
    instruction: 'Continue straight past the elevator', 
    instructionHi: 'लिफ्ट के आगे सीधे जाएं',
    direction: 'straight', 
    distance: '40m', 
    distanceHi: '40 मीटर',
    landmark: 'Elevator Block A',
    landmarkHi: 'लिफ्ट ब्लॉक A'
  },
  { 
    id: 4, 
    instruction: 'Turn right into Row C', 
    instructionHi: 'रो C में दाएं मुड़ें',
    direction: 'right', 
    distance: '20m', 
    distanceHi: '20 मीटर'
  },
  { 
    id: 5, 
    instruction: 'Your spot C-15 is on the left', 
    instructionHi: 'आपका स्लॉट C-15 बाईं ओर है',
    direction: 'arrive', 
    distance: '10m', 
    distanceHi: '10 मीटर'
  },
];

export function VoiceNavigation() {
  const { isHindi } = useLanguage();
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasReservation] = useState(true);

  const speakInstruction = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined') return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const startNavigation = () => {
    setIsNavigating(true);
    setCurrentStep(0);
    const step = mockNavigationSteps[0];
    speakInstruction(isHindi ? step.instructionHi : step.instruction);
    toast.success(isHindi ? 'नेविगेशन शुरू' : 'Navigation started', {
      description: isHindi ? 'वॉइस गाइड सक्रिय है' : 'Voice guidance is active',
    });
  };

  const nextStep = () => {
    if (currentStep < mockNavigationSteps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      const step = mockNavigationSteps[next];
      speakInstruction(isHindi ? step.instructionHi : step.instruction);
    } else {
      setIsNavigating(false);
      speakInstruction(isHindi ? 'आप अपने पार्किंग स्थान पर पहुंच गए हैं' : 'You have arrived at your parking spot');
      toast.success(isHindi ? 'आप पहुंच गए!' : 'You have arrived!');
    }
  };

  const getDirectionIcon = (direction: NavigationStep['direction']) => {
    switch (direction) {
      case 'straight': return <ArrowUp className="w-8 h-8" />;
      case 'left': return <ArrowLeft className="w-8 h-8" />;
      case 'right': return <ArrowRight className="w-8 h-8" />;
      case 'uturn': return <RotateCw className="w-8 h-8" />;
      case 'arrive': return <Check className="w-8 h-8" />;
    }
  };

  const progress = ((currentStep + 1) / mockNavigationSteps.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          {isHindi ? 'वॉइस नेविगेशन' : 'Voice Navigation'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? 'अपने आरक्षित पार्किंग स्थान तक आवाज-निर्देशित मार्गदर्शन'
            : 'Voice-guided directions to your reserved parking spot'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Feature Description */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <p className="text-xs text-muted-foreground">
            {isHindi 
              ? '🗣️ पार्किंग लॉट के अंदर टर्न-बाय-टर्न वॉइस निर्देश प्राप्त करें। यह सुविधा आपको सीधे आपके आरक्षित स्थान तक ले जाती है।'
              : '🗣️ Get turn-by-turn voice directions inside the parking lot. This feature guides you directly to your reserved spot.'}
          </p>
        </div>

        {!hasReservation ? (
          <div className="text-center py-6 text-muted-foreground">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{isHindi ? 'कोई सक्रिय आरक्षण नहीं' : 'No active reservation'}</p>
            <Button className="mt-3" size="sm">
              {isHindi ? 'अभी बुक करें' : 'Book Now'}
            </Button>
          </div>
        ) : !isNavigating ? (
          <div className="space-y-4">
            {/* Reservation Info */}
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{isHindi ? 'आपका आरक्षित स्थान' : 'Your Reserved Spot'}</span>
                <Badge className="bg-success">C-15</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <MapPin className="w-3 h-3 inline mr-1" />
                {isHindi ? 'कनॉट प्लेस पार्किंग, मंजिल 2' : 'Connaught Place Parking, Floor 2'}
              </div>
            </div>

            {/* Voice Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                {voiceEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm">{isHindi ? 'आवाज मार्गदर्शन' : 'Voice Guidance'}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
              >
                {voiceEnabled ? (isHindi ? 'बंद करें' : 'Disable') : (isHindi ? 'चालू करें' : 'Enable')}
              </Button>
            </div>

            <Button className="w-full gap-2" onClick={startNavigation}>
              <Compass className="w-4 h-4" />
              {isHindi ? 'नेविगेशन शुरू करें' : 'Start Navigation'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{isHindi ? 'प्रगति' : 'Progress'}</span>
              <span>{currentStep + 1}/{mockNavigationSteps.length}</span>
            </div>
            <Progress value={progress} className="h-2" />

            {/* Current Instruction */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  mockNavigationSteps[currentStep].direction === 'arrive' 
                    ? 'bg-success text-success-foreground' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {getDirectionIcon(mockNavigationSteps[currentStep].direction)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {isHindi 
                      ? mockNavigationSteps[currentStep].instructionHi 
                      : mockNavigationSteps[currentStep].instruction}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isHindi 
                      ? mockNavigationSteps[currentStep].distanceHi 
                      : mockNavigationSteps[currentStep].distance}
                    {mockNavigationSteps[currentStep].landmark && (
                      <span> • {isHindi 
                        ? mockNavigationSteps[currentStep].landmarkHi 
                        : mockNavigationSteps[currentStep].landmark}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Upcoming Steps */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">
                {isHindi ? 'आगे' : 'Coming Up'}
              </p>
              {mockNavigationSteps.slice(currentStep + 1, currentStep + 3).map((step) => (
                <div key={step.id} className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm">
                  <div className="p-1.5 rounded bg-muted">
                    {getDirectionIcon(step.direction)}
                  </div>
                  <span className="text-muted-foreground">
                    {isHindi ? step.instructionHi : step.instruction}
                  </span>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsNavigating(false)}
              >
                {isHindi ? 'रोकें' : 'Stop'}
              </Button>
              <Button 
                className="flex-1 gap-2"
                onClick={nextStep}
              >
                {currentStep < mockNavigationSteps.length - 1 
                  ? (isHindi ? 'अगला' : 'Next') 
                  : (isHindi ? 'पहुंच गए' : 'Arrived')}
              </Button>
            </div>

            {/* Voice Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
              {voiceEnabled 
                ? (isHindi ? 'आवाज बंद करें' : 'Mute Voice') 
                : (isHindi ? 'आवाज चालू करें' : 'Enable Voice')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
