import React, { useState, useEffect } from 'react';
import { Brain, MapPin, Clock, TrendingUp, Star, Zap, Car, Navigation, Sparkles, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface ParkingRecommendation {
  id: string;
  lotName: string;
  lotNameHi: string;
  zone: string;
  matchScore: number;
  distance: string;
  distanceHi: string;
  travelTime: string;
  travelTimeHi: string;
  price: number;
  availability: number;
  reasons: { en: string; hi: string }[];
  trafficStatus: 'light' | 'moderate' | 'heavy';
  isFrequent?: boolean;
  hasEV?: boolean;
  nearDestination?: boolean;
}

const mockRecommendations: ParkingRecommendation[] = [
  {
    id: '1',
    lotName: 'Connaught Place Central',
    lotNameHi: 'कनॉट प्लेस सेंट्रल',
    zone: 'Zone A',
    matchScore: 95,
    distance: '1.2 km',
    distanceHi: '1.2 कि.मी.',
    travelTime: '8 min',
    travelTimeHi: '8 मिनट',
    price: 40,
    availability: 45,
    reasons: [
      { en: 'Your most visited location', hi: 'आपका सबसे अधिक देखा गया स्थान' },
      { en: 'Light traffic on route', hi: 'मार्ग पर हल्का ट्रैफिक' },
      { en: 'Close to your destination', hi: 'आपके गंतव्य के पास' },
    ],
    trafficStatus: 'light',
    isFrequent: true,
    nearDestination: true,
  },
  {
    id: '2',
    lotName: 'Janpath Parking',
    lotNameHi: 'जनपथ पार्किंग',
    zone: 'Zone A',
    matchScore: 88,
    distance: '0.8 km',
    distanceHi: '0.8 कि.मी.',
    travelTime: '12 min',
    travelTimeHi: '12 मिनट',
    price: 35,
    availability: 23,
    reasons: [
      { en: 'Lower price than usual spots', hi: 'सामान्य स्थानों से कम कीमत' },
      { en: 'EV charging available', hi: 'ईवी चार्जिंग उपलब्ध' },
    ],
    trafficStatus: 'moderate',
    hasEV: true,
  },
  {
    id: '3',
    lotName: 'Palika Bazaar',
    lotNameHi: 'पालिका बाजार',
    zone: 'Zone B',
    matchScore: 75,
    distance: '1.5 km',
    distanceHi: '1.5 कि.मी.',
    travelTime: '18 min',
    travelTimeHi: '18 मिनट',
    price: 30,
    availability: 67,
    reasons: [
      { en: 'High availability', hi: 'उच्च उपलब्धता' },
      { en: 'Best price option', hi: 'सबसे अच्छा मूल्य विकल्प' },
    ],
    trafficStatus: 'heavy',
  },
];

export function SmartParkingRecommendations() {
  const { isHindi } = useLanguage();
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ParkingRecommendation[]>([]);

  const getRecommendations = () => {
    setIsLoading(true);
    // Simulate AI recommendation fetch
    setTimeout(() => {
      setRecommendations(mockRecommendations);
      setIsLoading(false);
      toast.success(isHindi ? 'सिफारिशें तैयार!' : 'Recommendations ready!');
    }, 1500);
  };

  const getTrafficBadge = (status: ParkingRecommendation['trafficStatus']) => {
    switch (status) {
      case 'light':
        return <Badge className="bg-success text-xs">{isHindi ? 'हल्का ट्रैफिक' : 'Light Traffic'}</Badge>;
      case 'moderate':
        return <Badge className="bg-warning text-xs">{isHindi ? 'मध्यम' : 'Moderate'}</Badge>;
      case 'heavy':
        return <Badge variant="destructive" className="text-xs">{isHindi ? 'भारी' : 'Heavy'}</Badge>;
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          {isHindi ? 'स्मार्ट पार्किंग सिफारिशें' : 'Smart Parking Recommendations'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? 'AI-संचालित सिफारिशें आपके इतिहास और ट्रैफिक के आधार पर'
            : 'AI-powered recommendations based on your history and traffic'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Feature Description */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <p className="text-xs text-muted-foreground">
            {isHindi 
              ? '🧠 AI आपके पार्किंग इतिहास, गंतव्य, और रीयल-टाइम ट्रैफिक डेटा का विश्लेषण करके सबसे उपयुक्त पार्किंग खोजता है।'
              : '🧠 AI analyzes your parking history, destination, and real-time traffic data to find the most suitable parking spots.'}
          </p>
        </div>

        {/* Destination Input */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <Input 
              placeholder={isHindi ? 'अपना गंतव्य दर्ज करें...' : 'Enter your destination...'}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="flex-1"
            />
            <Button onClick={getRecommendations} disabled={isLoading} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {isLoading ? (isHindi ? 'खोज रहा है...' : 'Finding...') : (isHindi ? 'खोजें' : 'Find')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Connaught Place', 'India Gate', 'Saket Mall'].map((place) => (
              <Button 
                key={place}
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setDestination(place)}
              >
                {place}
              </Button>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              {isHindi ? 'आपके लिए सर्वोत्तम विकल्प' : 'Best options for you'}
            </div>

            {recommendations.map((rec, index) => (
              <div 
                key={rec.id}
                className={`p-4 rounded-lg border transition-colors hover:bg-accent/50 ${
                  index === 0 ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {isHindi ? rec.lotNameHi : rec.lotName}
                      </span>
                      {index === 0 && (
                        <Badge className="bg-primary text-xs">
                          {isHindi ? 'सर्वोत्तम' : 'Best Match'}
                        </Badge>
                      )}
                      {rec.isFrequent && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          {isHindi ? 'पसंदीदा' : 'Frequent'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {rec.zone} • {isHindi ? rec.distanceHi : rec.distance}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getMatchColor(rec.matchScore)}`}>
                      {rec.matchScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isHindi ? 'मैच' : 'match'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span>{isHindi ? rec.travelTimeHi : rec.travelTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Car className="w-3 h-3 text-muted-foreground" />
                    <span>{rec.availability} {isHindi ? 'खाली' : 'free'}</span>
                  </div>
                  <div className="font-medium text-success">₹{rec.price}/hr</div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {getTrafficBadge(rec.trafficStatus)}
                  {rec.hasEV && (
                    <Badge variant="outline" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      EV
                    </Badge>
                  )}
                  {rec.nearDestination && (
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {isHindi ? 'गंतव्य के पास' : 'Near Destination'}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {rec.reasons.slice(0, 2).map((reason, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ThumbsUp className="w-3 h-3 text-success" />
                      {isHindi ? reason.hi : reason.en}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1 gap-1">
                    <Navigation className="w-3 h-3" />
                    {isHindi ? 'नेविगेट करें' : 'Navigate'}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    {isHindi ? 'बुक करें' : 'Reserve'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {recommendations.length === 0 && !isLoading && (
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{isHindi ? 'गंतव्य दर्ज करें और सिफारिशें प्राप्त करें' : 'Enter a destination to get recommendations'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
