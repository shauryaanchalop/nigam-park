import React from 'react';
import { Car, Truck, Bike, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface ParkingSlot {
  id: string;
  number: string;
  size: 'compact' | 'regular' | 'xl';
  isOccupied: boolean;
  floor: number;
}

const mockSlots: ParkingSlot[] = [
  { id: '1', number: 'A-01', size: 'compact', isOccupied: false, floor: 1 },
  { id: '2', number: 'A-02', size: 'compact', isOccupied: true, floor: 1 },
  { id: '3', number: 'A-03', size: 'regular', isOccupied: false, floor: 1 },
  { id: '4', number: 'A-04', size: 'regular', isOccupied: false, floor: 1 },
  { id: '5', number: 'A-05', size: 'xl', isOccupied: true, floor: 1 },
  { id: '6', number: 'B-01', size: 'compact', isOccupied: false, floor: 2 },
  { id: '7', number: 'B-02', size: 'regular', isOccupied: true, floor: 2 },
  { id: '8', number: 'B-03', size: 'xl', isOccupied: false, floor: 2 },
];

export function VehicleSizeDetection() {
  const { isHindi } = useLanguage();

  const getSizeInfo = (size: ParkingSlot['size']) => {
    switch (size) {
      case 'compact':
        return {
          icon: <Bike className="w-4 h-4" />,
          label: isHindi ? 'छोटा' : 'Compact',
          color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          description: isHindi ? 'बाइक / छोटी कार' : 'Bikes / Small cars',
        };
      case 'regular':
        return {
          icon: <Car className="w-4 h-4" />,
          label: isHindi ? 'नियमित' : 'Regular',
          color: 'bg-success/10 text-success border-success/20',
          description: isHindi ? 'सेडान / हैचबैक' : 'Sedan / Hatchback',
        };
      case 'xl':
        return {
          icon: <Truck className="w-4 h-4" />,
          label: isHindi ? 'बड़ा (XL)' : 'XL',
          color: 'bg-warning/10 text-warning border-warning/20',
          description: isHindi ? 'SUV / वैन' : 'SUV / Van',
        };
    }
  };

  const compactAvailable = mockSlots.filter(s => s.size === 'compact' && !s.isOccupied).length;
  const regularAvailable = mockSlots.filter(s => s.size === 'regular' && !s.isOccupied).length;
  const xlAvailable = mockSlots.filter(s => s.size === 'xl' && !s.isOccupied).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          {isHindi ? 'वाहन आकार के अनुसार पार्किंग' : 'Parking by Vehicle Size'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? 'अपने वाहन के आकार के अनुसार स्लॉट खोजें'
            : 'Find slots suitable for your vehicle size'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Feature Description */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <p className="text-xs text-muted-foreground">
            {isHindi 
              ? '🚗 AI आधारित वाहन आकार पहचान - अपने वाहन के आकार के अनुसार सही पार्किंग स्लॉट खोजें। बाइक, कार, और बड़े वाहनों के लिए अलग-अलग स्लॉट।'
              : '🚗 AI-based vehicle size detection - Find the right parking slot for your vehicle size. Separate slots for bikes, cars, and large vehicles.'}
          </p>
        </div>

        {/* Size Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { size: 'compact' as const, available: compactAvailable },
            { size: 'regular' as const, available: regularAvailable },
            { size: 'xl' as const, available: xlAvailable },
          ].map(item => {
            const info = getSizeInfo(item.size);
            return (
              <div key={item.size} className={`p-3 rounded-lg border ${info.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  {info.icon}
                  <span className="font-medium">{info.label}</span>
                </div>
                <div className="text-2xl font-bold">{item.available}</div>
                <div className="text-xs opacity-80">{isHindi ? 'उपलब्ध' : 'Available'}</div>
              </div>
            );
          })}
        </div>

        {/* Slot Grid */}
        <div className="space-y-4">
          {[1, 2].map(floor => (
            <div key={floor}>
              <div className="text-sm font-medium mb-2 text-muted-foreground">
                {isHindi ? `मंजिल ${floor}` : `Floor ${floor}`}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {mockSlots.filter(s => s.floor === floor).map(slot => {
                  const info = getSizeInfo(slot.size);
                  return (
                    <div
                      key={slot.id}
                      className={`p-2 rounded-lg border text-center transition-colors ${
                        slot.isOccupied 
                          ? 'bg-muted/50 opacity-50 cursor-not-allowed' 
                          : 'hover:bg-accent cursor-pointer'
                      }`}
                    >
                      <div className="text-xs font-medium">{slot.number}</div>
                      <div className="flex justify-center my-1">
                        {info.icon}
                      </div>
                      <div className="flex justify-center">
                        {slot.isOccupied ? (
                          <X className="w-3 h-3 text-destructive" />
                        ) : (
                          <Check className="w-3 h-3 text-success" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-3 text-xs">
          {(['compact', 'regular', 'xl'] as const).map(size => {
            const info = getSizeInfo(size);
            return (
              <div key={size} className="flex items-center gap-1">
                {info.icon}
                <span>{info.description}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
