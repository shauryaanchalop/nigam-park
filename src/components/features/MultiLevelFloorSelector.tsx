import React, { useState } from 'react';
import { Building2, ChevronUp, ChevronDown, Car, Accessibility } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

interface Floor {
  level: number;
  name: string;
  nameHi: string;
  totalSlots: number;
  occupiedSlots: number;
  hasAccessibility: boolean;
  hasEVCharging: boolean;
}

const mockFloors: Floor[] = [
  { level: 3, name: 'Level 3 (Roof)', nameHi: 'स्तर 3 (छत)', totalSlots: 50, occupiedSlots: 15, hasAccessibility: false, hasEVCharging: true },
  { level: 2, name: 'Level 2', nameHi: 'स्तर 2', totalSlots: 80, occupiedSlots: 65, hasAccessibility: false, hasEVCharging: true },
  { level: 1, name: 'Level 1', nameHi: 'स्तर 1', totalSlots: 80, occupiedSlots: 78, hasAccessibility: true, hasEVCharging: false },
  { level: 0, name: 'Ground Floor', nameHi: 'भूतल', totalSlots: 60, occupiedSlots: 58, hasAccessibility: true, hasEVCharging: true },
  { level: -1, name: 'Basement 1', nameHi: 'तहखाना 1', totalSlots: 100, occupiedSlots: 45, hasAccessibility: true, hasEVCharging: false },
  { level: -2, name: 'Basement 2', nameHi: 'तहखाना 2', totalSlots: 100, occupiedSlots: 30, hasAccessibility: false, hasEVCharging: false },
];

export function MultiLevelFloorSelector() {
  const { isHindi } = useLanguage();
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  const getOccupancyColor = (occupied: number, total: number) => {
    const percentage = (occupied / total) * 100;
    if (percentage >= 95) return 'bg-destructive';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-success';
  };

  const getOccupancyLabel = (occupied: number, total: number) => {
    const available = total - occupied;
    const percentage = (occupied / total) * 100;
    if (percentage >= 95) return { label: isHindi ? 'भरा' : 'Full', variant: 'destructive' as const };
    if (percentage >= 75) return { label: isHindi ? 'सीमित' : 'Limited', variant: 'warning' as const };
    return { label: `${available} ${isHindi ? 'उपलब्ध' : 'free'}`, variant: 'success' as const };
  };

  const totalAvailable = mockFloors.reduce((sum, floor) => sum + (floor.totalSlots - floor.occupiedSlots), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          {isHindi ? 'मंजिल चयनकर्ता' : 'Floor Selector'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? `कुल ${totalAvailable} स्लॉट उपलब्ध`
            : `${totalAvailable} total slots available`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Building Visualization */}
          <div className="space-y-2">
            {mockFloors.map((floor, index) => {
              const occupancy = getOccupancyLabel(floor.occupiedSlots, floor.totalSlots);
              const percentage = (floor.occupiedSlots / floor.totalSlots) * 100;
              const isSelected = selectedFloor === floor.level;
              
              return (
                <div
                  key={floor.level}
                  onClick={() => setSelectedFloor(isSelected ? null : floor.level)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {isHindi ? floor.nameHi : floor.name}
                      </span>
                      {floor.hasAccessibility && (
                        <Accessibility className="w-4 h-4 text-blue-500" />
                      )}
                      {floor.hasEVCharging && (
                        <Badge variant="outline" className="text-xs px-1">EV</Badge>
                      )}
                    </div>
                    <Badge variant={occupancy.variant === 'success' ? 'default' : occupancy.variant === 'warning' ? 'secondary' : 'destructive'}>
                      {occupancy.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Progress 
                      value={percentage} 
                      className={`h-2 flex-1 ${getOccupancyColor(floor.occupiedSlots, floor.totalSlots)}`}
                    />
                    <span className="text-sm text-muted-foreground w-20 text-right">
                      {floor.totalSlots - floor.occupiedSlots}/{floor.totalSlots}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2">
                      <Button size="sm" className="gap-1">
                        <Car className="w-3 h-3" />
                        {isHindi ? 'इस मंजिल पर पार्क करें' : 'Park Here'}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1">
                        {isHindi ? 'स्लॉट देखें' : 'View Slots'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full">
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-success" />
            <span>{isHindi ? 'उपलब्ध' : 'Available'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-warning" />
            <span>{isHindi ? 'सीमित' : 'Limited'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span>{isHindi ? 'भरा' : 'Full'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Accessibility className="w-3 h-3 text-blue-500" />
            <span>{isHindi ? 'सुलभ' : 'Accessible'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
