import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Car, Zap, Accessibility, ChevronUp, ChevronDown, RotateCcw, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const translations = {
  en: {
    title: "3D Parking Slot Map",
    description: "Real-time visualization of parking availability with floor-by-floor view. Navigate through floors to find the perfect spot instantly.",
    floor: "Floor",
    available: "Available",
    occupied: "Occupied",
    reserved: "Reserved",
    evCharging: "EV Charging",
    handicap: "Accessible",
    selectFloor: "Select Floor",
    basement: "Basement",
    ground: "Ground Floor",
    firstFloor: "1st Floor",
    secondFloor: "2nd Floor",
    rooftop: "Rooftop",
    legend: "Legend",
    totalSpots: "Total Spots",
    availableSpots: "Available",
    occupancyRate: "Occupancy",
    resetView: "Reset View",
    liveUpdates: "Live Updates",
    clickToReserve: "Click any available spot to reserve"
  },
  hi: {
    title: "3D पार्किंग स्लॉट मैप",
    description: "फ्लोर-बाय-फ्लोर व्यू के साथ पार्किंग उपलब्धता का रियल-टाइम विज़ुअलाइज़ेशन। तुरंत सही स्पॉट खोजने के लिए फ्लोर नेविगेट करें।",
    floor: "मंज़िल",
    available: "उपलब्ध",
    occupied: "व्यस्त",
    reserved: "आरक्षित",
    evCharging: "ईवी चार्जिंग",
    handicap: "सुलभ",
    selectFloor: "मंज़िल चुनें",
    basement: "तहखाना",
    ground: "भूतल",
    firstFloor: "पहली मंज़िल",
    secondFloor: "दूसरी मंज़िल",
    rooftop: "छत",
    legend: "लेजेंड",
    totalSpots: "कुल स्पॉट",
    availableSpots: "उपलब्ध",
    occupancyRate: "अधिभोग",
    resetView: "व्यू रीसेट करें",
    liveUpdates: "लाइव अपडेट",
    clickToReserve: "आरक्षित करने के लिए किसी भी उपलब्ध स्पॉट पर क्लिक करें"
  }
};

interface ParkingSpot {
  id: string;
  status: 'available' | 'occupied' | 'reserved';
  type: 'regular' | 'ev' | 'handicap';
  vehicleNumber?: string;
}

interface FloorData {
  id: string;
  name: { en: string; hi: string };
  spots: ParkingSpot[];
  rows: number;
  cols: number;
}

const generateFloorData = (): FloorData[] => {
  const floors = [
    { id: 'B1', name: { en: 'Basement 1', hi: 'तहखाना 1' }, rows: 4, cols: 10 },
    { id: 'G', name: { en: 'Ground Floor', hi: 'भूतल' }, rows: 5, cols: 12 },
    { id: '1', name: { en: '1st Floor', hi: 'पहली मंज़िल' }, rows: 5, cols: 12 },
    { id: '2', name: { en: '2nd Floor', hi: 'दूसरी मंज़िल' }, rows: 4, cols: 10 },
    { id: 'R', name: { en: 'Rooftop', hi: 'छत' }, rows: 3, cols: 8 },
  ];

  return floors.map(floor => {
    const spots: ParkingSpot[] = [];
    const totalSpots = floor.rows * floor.cols;
    
    for (let i = 0; i < totalSpots; i++) {
      const random = Math.random();
      let status: 'available' | 'occupied' | 'reserved' = 'available';
      if (random > 0.6) status = 'occupied';
      else if (random > 0.5) status = 'reserved';
      
      let type: 'regular' | 'ev' | 'handicap' = 'regular';
      if (i % 15 === 0) type = 'ev';
      else if (i % 20 === 0) type = 'handicap';
      
      spots.push({
        id: `${floor.id}-${i + 1}`,
        status,
        type,
        vehicleNumber: status === 'occupied' ? `DL${Math.floor(Math.random() * 99)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9999)}` : undefined
      });
    }
    
    return { ...floor, spots };
  });
};

export function ParkingSlot3DMap() {
  const { language } = useLanguage();
  const t = translations[language];
  const [floors] = useState<FloorData[]>(generateFloorData);
  const [selectedFloor, setSelectedFloor] = useState('G');
  const [rotateX, setRotateX] = useState(45);
  const [rotateZ, setRotateZ] = useState(-15);
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);

  const currentFloor = floors.find(f => f.id === selectedFloor) || floors[1];
  const stats = {
    total: currentFloor.spots.length,
    available: currentFloor.spots.filter(s => s.status === 'available').length,
    occupied: currentFloor.spots.filter(s => s.status === 'occupied').length,
    reserved: currentFloor.spots.filter(s => s.status === 'reserved').length,
  };

  const getSpotColor = (spot: ParkingSpot) => {
    if (spot.status === 'occupied') return 'bg-destructive/80';
    if (spot.status === 'reserved') return 'bg-warning/80';
    if (spot.type === 'ev') return 'bg-success/80 ring-2 ring-success';
    if (spot.type === 'handicap') return 'bg-primary/80 ring-2 ring-primary';
    return 'bg-success/60 hover:bg-success/80';
  };

  const getSpotIcon = (spot: ParkingSpot) => {
    if (spot.status === 'occupied') return <Car className="w-3 h-3 text-destructive-foreground" />;
    if (spot.type === 'ev') return <Zap className="w-3 h-3 text-success-foreground" />;
    if (spot.type === 'handicap') return <Accessibility className="w-3 h-3 text-primary-foreground" />;
    return null;
  };

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 animate-pulse">
            <Eye className="w-3 h-3 mr-1" />
            {t.liveUpdates}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t.selectFloor} />
            </SelectTrigger>
            <SelectContent>
              {floors.map(floor => (
                <SelectItem key={floor.id} value={floor.id}>
                  {floor.name[language]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotateX(prev => Math.min(prev + 10, 70))}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotateX(prev => Math.max(prev - 10, 20))}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setRotateX(45); setRotateZ(-15); }}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              {t.resetView}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">{t.totalSpots}</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </div>
          <div className="bg-success/10 rounded-lg p-2 text-center">
            <p className="text-xs text-success">{t.available}</p>
            <p className="text-lg font-bold text-success">{stats.available}</p>
          </div>
          <div className="bg-destructive/10 rounded-lg p-2 text-center">
            <p className="text-xs text-destructive">{t.occupied}</p>
            <p className="text-lg font-bold text-destructive">{stats.occupied}</p>
          </div>
          <div className="bg-warning/10 rounded-lg p-2 text-center">
            <p className="text-xs text-warning">{t.occupancyRate}</p>
            <p className="text-lg font-bold text-warning">{Math.round((stats.occupied / stats.total) * 100)}%</p>
          </div>
        </div>

        {/* 3D Visualization */}
        <div className="relative bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-4 overflow-hidden min-h-[300px]">
          <div 
            className="w-full flex items-center justify-center"
            style={{ perspective: '1000px' }}
          >
            <div
              className="transition-transform duration-500 ease-out"
              style={{
                transform: `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Floor plate */}
              <div className="relative bg-card/80 border-2 border-border rounded-lg p-3 shadow-2xl"
                style={{
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                {/* Grid of spots */}
                <div 
                  className="grid gap-1"
                  style={{ 
                    gridTemplateColumns: `repeat(${currentFloor.cols}, minmax(0, 1fr))` 
                  }}
                >
                  {currentFloor.spots.map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => spot.status === 'available' && setSelectedSpot(spot.id)}
                      disabled={spot.status !== 'available'}
                      className={`
                        relative w-6 h-8 md:w-8 md:h-10 rounded-sm transition-all duration-200
                        ${getSpotColor(spot)}
                        ${selectedSpot === spot.id ? 'ring-2 ring-primary scale-110 z-10' : ''}
                        ${spot.status === 'available' ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                      `}
                      style={{
                        transform: 'translateZ(2px)',
                        boxShadow: spot.status === 'occupied' ? 'inset 0 -2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        {getSpotIcon(spot)}
                      </div>
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[6px] font-mono opacity-60">
                        {spot.id.split('-')[1]}
                      </span>
                    </button>
                  ))}
                </div>
                
                {/* Floor label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                  {currentFloor.name[language]}
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating floors indicator */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            {floors.map((floor, index) => (
              <button
                key={floor.id}
                onClick={() => setSelectedFloor(floor.id)}
                className={`w-8 h-6 rounded text-[10px] font-medium transition-all ${
                  selectedFloor === floor.id 
                    ? 'bg-primary text-primary-foreground scale-110' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
                style={{ transform: `translateY(${(floors.length - 1 - index) * -2}px)` }}
              >
                {floor.id}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-success/60 rounded-sm"></div>
            <span>{t.available}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-destructive/80 rounded-sm"></div>
            <span>{t.occupied}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-warning/80 rounded-sm"></div>
            <span>{t.reserved}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-success/80 ring-2 ring-success rounded-sm flex items-center justify-center">
              <Zap className="w-2 h-2" />
            </div>
            <span>{t.evCharging}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-primary/80 ring-2 ring-primary rounded-sm flex items-center justify-center">
              <Accessibility className="w-2 h-2" />
            </div>
            <span>{t.handicap}</span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {t.clickToReserve}
        </p>
      </CardContent>
    </Card>
  );
}
