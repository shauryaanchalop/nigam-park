import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accessibility, Eye, Ear, Brain, Heart, MapPin, Phone, CheckCircle2, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AccessibleFeature {
  id: string;
  name: string;
  nameHi: string;
  icon: React.ReactNode;
  available: number;
  total: number;
  description: string;
  descriptionHi: string;
}

const accessibleFeatures: AccessibleFeature[] = [
  { 
    id: 'wheelchair', 
    name: 'Wheelchair Accessible', 
    nameHi: 'व्हीलचेयर सुलभ', 
    icon: <Accessibility className="w-5 h-5" />, 
    available: 8, 
    total: 10,
    description: 'Wide parking spaces with ramp access',
    descriptionHi: 'रैंप एक्सेस के साथ चौड़े पार्किंग स्थान'
  },
  { 
    id: 'visual', 
    name: 'Visually Impaired', 
    nameHi: 'दृष्टिबाधित', 
    icon: <Eye className="w-5 h-5" />, 
    available: 5, 
    total: 6,
    description: 'Tactile paths and audio guidance',
    descriptionHi: 'स्पर्श पथ और ऑडियो मार्गदर्शन'
  },
  { 
    id: 'hearing', 
    name: 'Hearing Impaired', 
    nameHi: 'श्रवण बाधित', 
    icon: <Ear className="w-5 h-5" />, 
    available: 12, 
    total: 12,
    description: 'Visual alerts and sign language support',
    descriptionHi: 'विज़ुअल अलर्ट और सांकेतिक भाषा सहायता'
  },
  { 
    id: 'cognitive', 
    name: 'Cognitive Support', 
    nameHi: 'संज्ञानात्मक सहायता', 
    icon: <Brain className="w-5 h-5" />, 
    available: 4, 
    total: 5,
    description: 'Simple signage and attendant assistance',
    descriptionHi: 'सरल साइनेज और परिचर सहायता'
  },
];

export function AccessibleParkingFeatures() {
  const { isHindi } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Accessibility className="w-5 h-5 text-blue-500" />
          </div>
          {isHindi ? 'सुलभ पार्किंग' : 'Accessible Parking'}
          <Badge variant="outline" className="ml-auto text-xs gap-1 border-blue-500/30 text-blue-500">
            <CheckCircle2 className="w-3 h-3" />
            {isHindi ? 'प्रमाणित' : 'Certified'}
          </Badge>
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? 'दिव्यांगजनों के लिए विशेष सुविधाएं और सहायता'
            : 'Special facilities and assistance for persons with disabilities'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-2xl font-bold text-blue-500">29</p>
            <p className="text-xs text-muted-foreground">{isHindi ? 'उपलब्ध स्थान' : 'Available Spots'}</p>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
            <p className="text-2xl font-bold text-success">24/7</p>
            <p className="text-xs text-muted-foreground">{isHindi ? 'सहायता' : 'Assistance'}</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          {accessibleFeatures.map((feature) => (
            <div key={feature.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{isHindi ? feature.nameHi : feature.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {feature.available}/{feature.total}
                    </Badge>
                  </div>
                  <Progress value={(feature.available / feature.total) * 100} className="h-1.5 mb-1" />
                  <p className="text-xs text-muted-foreground">{isHindi ? feature.descriptionHi : feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Info */}
        <div className="p-4 bg-gradient-to-r from-blue-500/10 to-primary/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-6 h-6 text-blue-500" />
            <div>
              <p className="font-medium text-sm">{isHindi ? 'सहायता की आवश्यकता है?' : 'Need Assistance?'}</p>
              <p className="text-xs text-muted-foreground">{isHindi ? 'हमारे प्रशिक्षित कर्मचारी मदद के लिए तैयार हैं' : 'Our trained staff are ready to help'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <Phone className="w-3 h-3" />
              1800-XXX-XXXX
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              <MapPin className="w-3 h-3" />
              {isHindi ? 'प्रवेश द्वार पर' : 'At Entry Gate'}
            </Badge>
          </div>
        </div>

        {/* Certifications */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline" className="text-[10px]">
            {isHindi ? 'RPwD अधिनियम 2016' : 'RPwD Act 2016'}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {isHindi ? 'सुगम्य भारत' : 'Sugamya Bharat'}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            WCAG 2.1 AA
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
