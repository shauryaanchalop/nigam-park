import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  GitCompare, MapPin, Star, Car, Zap, Shield, Clock, IndianRupee, 
  ArrowUpDown, Check, X, Umbrella, Camera, Wifi, Coffee, ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const translations = {
  en: {
    title: "Parking Lot Comparison",
    description: "Compare prices, amenities, ratings, and real-time availability across nearby parking lots to make the best choice.",
    selectLots: "Select lots to compare",
    compare: "Compare Selected",
    clearAll: "Clear All",
    distance: "Distance",
    price: "Price/Hour",
    rating: "Rating",
    availability: "Availability",
    amenities: "Amenities",
    evCharging: "EV Charging",
    covered: "Covered Parking",
    security: "24/7 Security",
    cctv: "CCTV",
    wifi: "Free WiFi",
    cafe: "Café Nearby",
    valet: "Valet Service",
    handicap: "Accessible",
    bestValue: "Best Value",
    closest: "Closest",
    highestRated: "Top Rated",
    mostAvailable: "Most Available",
    spotsAvailable: "spots available",
    reviews: "reviews",
    selectToCompare: "Select 2-4 lots to compare",
    comparisonView: "Comparison View",
    backToSelection: "Back to Selection",
    winner: "Best Choice",
    recommended: "Recommended",
    book: "Book Now"
  },
  hi: {
    title: "पार्किंग लॉट तुलना",
    description: "सर्वोत्तम विकल्प चुनने के लिए आस-पास के पार्किंग लॉट में कीमतों, सुविधाओं, रेटिंग और रियल-टाइम उपलब्धता की तुलना करें।",
    selectLots: "तुलना के लिए लॉट चुनें",
    compare: "चयनित की तुलना करें",
    clearAll: "सभी साफ़ करें",
    distance: "दूरी",
    price: "मूल्य/घंटा",
    rating: "रेटिंग",
    availability: "उपलब्धता",
    amenities: "सुविधाएं",
    evCharging: "ईवी चार्जिंग",
    covered: "कवर्ड पार्किंग",
    security: "24/7 सुरक्षा",
    cctv: "सीसीटीवी",
    wifi: "मुफ्त वाईफाई",
    cafe: "पास में कैफे",
    valet: "वैलेट सेवा",
    handicap: "सुलभ",
    bestValue: "सर्वोत्तम मूल्य",
    closest: "सबसे नजदीक",
    highestRated: "सर्वश्रेष्ठ रेटेड",
    mostAvailable: "सबसे अधिक उपलब्ध",
    spotsAvailable: "स्पॉट उपलब्ध",
    reviews: "समीक्षाएं",
    selectToCompare: "तुलना के लिए 2-4 लॉट चुनें",
    comparisonView: "तुलना दृश्य",
    backToSelection: "चयन पर वापस",
    winner: "सर्वोत्तम विकल्प",
    recommended: "अनुशंसित",
    book: "अभी बुक करें"
  }
};

interface ParkingLot {
  id: string;
  name: string;
  zone: string;
  distance: number;
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  availableSpots: number;
  totalSpots: number;
  amenities: {
    evCharging: boolean;
    covered: boolean;
    security: boolean;
    cctv: boolean;
    wifi: boolean;
    cafe: boolean;
    valet: boolean;
    handicap: boolean;
  };
  badges: ('bestValue' | 'closest' | 'highestRated' | 'mostAvailable')[];
}

const mockParkingLots: ParkingLot[] = [
  {
    id: '1',
    name: 'Central Market Parking',
    zone: 'Connaught Place',
    distance: 0.3,
    pricePerHour: 40,
    rating: 4.5,
    reviewCount: 234,
    availableSpots: 45,
    totalSpots: 150,
    amenities: { evCharging: true, covered: true, security: true, cctv: true, wifi: true, cafe: true, valet: true, handicap: true },
    badges: ['bestValue', 'highestRated']
  },
  {
    id: '2',
    name: 'Metro Station Parking',
    zone: 'Rajiv Chowk',
    distance: 0.1,
    pricePerHour: 30,
    rating: 4.2,
    reviewCount: 189,
    availableSpots: 12,
    totalSpots: 80,
    amenities: { evCharging: true, covered: false, security: true, cctv: true, wifi: false, cafe: false, valet: false, handicap: true },
    badges: ['closest']
  },
  {
    id: '3',
    name: 'Mall Underground Parking',
    zone: 'Connaught Place',
    distance: 0.5,
    pricePerHour: 60,
    rating: 4.8,
    reviewCount: 456,
    availableSpots: 120,
    totalSpots: 300,
    amenities: { evCharging: true, covered: true, security: true, cctv: true, wifi: true, cafe: true, valet: true, handicap: true },
    badges: ['mostAvailable', 'highestRated']
  },
  {
    id: '4',
    name: 'Street Side Parking',
    zone: 'Barakhamba Road',
    distance: 0.4,
    pricePerHour: 20,
    rating: 3.8,
    reviewCount: 67,
    availableSpots: 8,
    totalSpots: 25,
    amenities: { evCharging: false, covered: false, security: false, cctv: true, wifi: false, cafe: false, valet: false, handicap: false },
    badges: ['bestValue']
  },
  {
    id: '5',
    name: 'Premium Tower Parking',
    zone: 'Janpath',
    distance: 0.6,
    pricePerHour: 80,
    rating: 4.9,
    reviewCount: 312,
    availableSpots: 35,
    totalSpots: 100,
    amenities: { evCharging: true, covered: true, security: true, cctv: true, wifi: true, cafe: true, valet: true, handicap: true },
    badges: ['highestRated']
  }
];

export function ParkingLotComparison() {
  const { language } = useLanguage();
  const t = translations[language];
  const [selectedLots, setSelectedLots] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating' | 'availability'>('distance');

  const toggleLot = (id: string) => {
    setSelectedLots(prev => 
      prev.includes(id) 
        ? prev.filter(l => l !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const getBadgeVariant = (badge: string) => {
    switch (badge) {
      case 'bestValue': return 'bg-success/20 text-success border-success/30';
      case 'closest': return 'bg-primary/20 text-primary border-primary/30';
      case 'highestRated': return 'bg-warning/20 text-warning border-warning/30';
      case 'mostAvailable': return 'bg-accent/20 text-accent-foreground border-accent/30';
      default: return '';
    }
  };

  const sortedLots = [...mockParkingLots].sort((a, b) => {
    switch (sortBy) {
      case 'distance': return a.distance - b.distance;
      case 'price': return a.pricePerHour - b.pricePerHour;
      case 'rating': return b.rating - a.rating;
      case 'availability': return b.availableSpots - a.availableSpots;
      default: return 0;
    }
  });

  const comparedLots = mockParkingLots.filter(lot => selectedLots.includes(lot.id));
  const bestChoice = comparedLots.length > 0 
    ? comparedLots.reduce((best, lot) => {
        const score = (lot.rating * 20) + (lot.availableSpots / lot.totalSpots * 30) - (lot.pricePerHour / 2) - (lot.distance * 10);
        const bestScore = (best.rating * 20) + (best.availableSpots / best.totalSpots * 30) - (best.pricePerHour / 2) - (best.distance * 10);
        return score > bestScore ? lot : best;
      })
    : null;

  const amenityIcons = {
    evCharging: <Zap className="w-4 h-4" />,
    covered: <Umbrella className="w-4 h-4" />,
    security: <Shield className="w-4 h-4" />,
    cctv: <Camera className="w-4 h-4" />,
    wifi: <Wifi className="w-4 h-4" />,
    cafe: <Coffee className="w-4 h-4" />,
    valet: <Car className="w-4 h-4" />,
    handicap: <MapPin className="w-4 h-4" />
  };

  const amenityLabels = {
    evCharging: t.evCharging,
    covered: t.covered,
    security: t.security,
    cctv: t.cctv,
    wifi: t.wifi,
    cafe: t.cafe,
    valet: t.valet,
    handicap: t.handicap
  };

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent/20 rounded-lg">
            <GitCompare className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">{t.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {!showComparison ? (
          <div className="space-y-4">
            {/* Sort Options */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{t.selectLots}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortBy(prev => {
                    const options: typeof sortBy[] = ['distance', 'price', 'rating', 'availability'];
                    const idx = options.indexOf(prev);
                    return options[(idx + 1) % options.length];
                  })}
                >
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  {t[sortBy]}
                </Button>
              </div>
            </div>

            {/* Lot Cards */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {sortedLots.map(lot => (
                <div
                  key={lot.id}
                  onClick={() => toggleLot(lot.id)}
                  className={`
                    p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedLots.includes(lot.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={selectedLots.includes(lot.id)} 
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm truncate">{lot.name}</h4>
                        {lot.badges.map(badge => (
                          <Badge 
                            key={badge} 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 ${getBadgeVariant(badge)}`}
                          >
                            {t[badge]}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{lot.zone}</p>
                      
                      <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>{lot.distance} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3 text-muted-foreground" />
                          <span>₹{lot.pricePerHour}/hr</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-warning fill-warning" />
                          <span>{lot.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Car className="w-3 h-3 text-success" />
                          <span className="text-success">{lot.availableSpots}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {selectedLots.length}/4 {t.selectToCompare}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedLots([])}
                  disabled={selectedLots.length === 0}
                >
                  {t.clearAll}
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setShowComparison(true)}
                  disabled={selectedLots.length < 2}
                >
                  {t.compare}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Comparison Header */}
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowComparison(false)}
              >
                ← {t.backToSelection}
              </Button>
              <Badge variant="outline">{t.comparisonView}</Badge>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="min-w-[600px]">
                {/* Headers */}
                <div className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${comparedLots.length}, 1fr)` }}>
                  <div></div>
                  {comparedLots.map(lot => (
                    <div 
                      key={lot.id} 
                      className={`text-center p-3 rounded-t-lg ${
                        bestChoice?.id === lot.id ? 'bg-success/10 border-2 border-success border-b-0' : 'bg-muted/50'
                      }`}
                    >
                      {bestChoice?.id === lot.id && (
                        <Badge className="bg-success text-success-foreground mb-2">{t.winner}</Badge>
                      )}
                      <h4 className="font-medium text-sm">{lot.name}</h4>
                      <p className="text-xs text-muted-foreground">{lot.zone}</p>
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {[
                  { key: 'distance', icon: <MapPin className="w-4 h-4" />, render: (lot: ParkingLot) => `${lot.distance} km` },
                  { key: 'price', icon: <IndianRupee className="w-4 h-4" />, render: (lot: ParkingLot) => `₹${lot.pricePerHour}/hr` },
                  { key: 'rating', icon: <Star className="w-4 h-4 text-warning" />, render: (lot: ParkingLot) => (
                    <div className="flex items-center justify-center gap-1">
                      <span>{lot.rating}</span>
                      <span className="text-xs text-muted-foreground">({lot.reviewCount})</span>
                    </div>
                  )},
                  { key: 'availability', icon: <Car className="w-4 h-4" />, render: (lot: ParkingLot) => (
                    <div className="space-y-1">
                      <span className="text-success font-medium">{lot.availableSpots}/{lot.totalSpots}</span>
                      <Progress value={(lot.availableSpots / lot.totalSpots) * 100} className="h-1" />
                    </div>
                  )}
                ].map(row => (
                  <div 
                    key={row.key}
                    className="grid gap-2 border-b" 
                    style={{ gridTemplateColumns: `120px repeat(${comparedLots.length}, 1fr)` }}
                  >
                    <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                      {row.icon}
                      {t[row.key as keyof typeof t]}
                    </div>
                    {comparedLots.map(lot => (
                      <div 
                        key={lot.id} 
                        className={`flex items-center justify-center py-3 text-sm ${
                          bestChoice?.id === lot.id ? 'bg-success/5 border-x-2 border-success' : ''
                        }`}
                      >
                        {row.render(lot)}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Amenities */}
                <div className="py-3 border-b">
                  <div className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${comparedLots.length}, 1fr)` }}>
                    <div className="text-sm text-muted-foreground font-medium">{t.amenities}</div>
                    {comparedLots.map(lot => (
                      <div key={lot.id} className={bestChoice?.id === lot.id ? 'bg-success/5 border-x-2 border-success' : ''}></div>
                    ))}
                  </div>
                  
                  {Object.entries(amenityLabels).map(([key, label]) => (
                    <div 
                      key={key}
                      className="grid gap-2 py-1" 
                      style={{ gridTemplateColumns: `120px repeat(${comparedLots.length}, 1fr)` }}
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {amenityIcons[key as keyof typeof amenityIcons]}
                        {label}
                      </div>
                      {comparedLots.map(lot => (
                        <div 
                          key={lot.id} 
                          className={`flex items-center justify-center ${
                            bestChoice?.id === lot.id ? 'bg-success/5 border-x-2 border-success' : ''
                          }`}
                        >
                          {lot.amenities[key as keyof typeof lot.amenities] 
                            ? <Check className="w-4 h-4 text-success" />
                            : <X className="w-4 h-4 text-muted-foreground/30" />
                          }
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Book Buttons */}
                <div className="grid gap-2 pt-3" style={{ gridTemplateColumns: `120px repeat(${comparedLots.length}, 1fr)` }}>
                  <div></div>
                  {comparedLots.map(lot => (
                    <div 
                      key={lot.id} 
                      className={`px-2 ${bestChoice?.id === lot.id ? 'bg-success/5 border-x-2 border-b-2 border-success rounded-b-lg pb-3' : ''}`}
                    >
                      <Button 
                        className="w-full"
                        variant={bestChoice?.id === lot.id ? 'default' : 'outline'}
                      >
                        {t.book}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
