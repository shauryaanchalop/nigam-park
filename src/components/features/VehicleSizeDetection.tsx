import React, { useState } from 'react';
import { 
  Car, 
  Truck, 
  Bike, 
  Check, 
  X, 
  Ruler, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ParkingSlot {
  id: string;
  number: string;
  size: 'compact' | 'regular' | 'xl';
  isOccupied: boolean;
  floor: number;
  dimensions: string;
  maxHeight: string;
}

const mockSlots: ParkingSlot[] = [
  // Floor 1 (Clearance: 2.1m)
  { id: '1', number: 'A-01', size: 'compact', isOccupied: false, floor: 1, dimensions: '2.2m × 4.5m', maxHeight: '2.1m' },
  { id: '2', number: 'A-02', size: 'compact', isOccupied: true, floor: 1, dimensions: '2.2m × 4.5m', maxHeight: '2.1m' },
  { id: '3', number: 'A-03', size: 'regular', isOccupied: false, floor: 1, dimensions: '2.5m × 5.0m', maxHeight: '2.1m' },
  { id: '4', number: 'A-04', size: 'regular', isOccupied: true, floor: 1, dimensions: '2.5m × 5.0m', maxHeight: '2.1m' },
  { id: '5', number: 'A-05', size: 'xl', isOccupied: true, floor: 1, dimensions: '3.0m × 5.5m', maxHeight: '2.1m' },

  // Floor 2 (Clearance: 2.4m)
  { id: '6', number: 'B-01', size: 'compact', isOccupied: false, floor: 2, dimensions: '2.2m × 4.5m', maxHeight: '2.4m' },
  { id: '7', number: 'B-02', size: 'regular', isOccupied: false, floor: 2, dimensions: '2.5m × 5.0m', maxHeight: '2.4m' },
  { id: '8', number: 'B-03', size: 'xl', isOccupied: false, floor: 2, dimensions: '3.0m × 5.5m', maxHeight: '2.4m' },
  { id: '9', number: 'B-04', size: 'regular', isOccupied: true, floor: 2, dimensions: '2.5m × 5.0m', maxHeight: '2.4m' },

  // Floor 3 (Open Deck - Unlimited Height)
  { id: '10', number: 'C-01', size: 'xl', isOccupied: false, floor: 3, dimensions: '3.2m × 6.0m', maxHeight: 'No Limit' },
  { id: '11', number: 'C-02', size: 'xl', isOccupied: true, floor: 3, dimensions: '3.2m × 6.0m', maxHeight: 'No Limit' },
  { id: '12', number: 'C-03', size: 'regular', isOccupied: false, floor: 3, dimensions: '2.5m × 5.0m', maxHeight: 'No Limit' },
  { id: '13', number: 'C-04', size: 'compact', isOccupied: false, floor: 3, dimensions: '2.2m × 4.5m', maxHeight: 'No Limit' },
];

export function VehicleSizeDetection() {
  const { isHindi } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'compact' | 'regular' | 'xl'>('all');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);

  const getSizeInfo = (size: ParkingSlot['size']) => {
    switch (size) {
      case 'compact':
        return {
          icon: <Bike className="w-4 h-4" />,
          label: isHindi ? 'छोटा (Compact)' : 'Compact',
          color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          badgeColor: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
          description: isHindi ? 'बाइक / हैचबैक (लंबाई < 4.0m)' : 'Bikes / Small cars (< 4.0m)',
        };
      case 'regular':
        return {
          icon: <Car className="w-4 h-4" />,
          label: isHindi ? 'नियमित (Sedan)' : 'Regular',
          color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          badgeColor: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
          description: isHindi ? 'सेडान / कॉम्पैक्ट SUV (लंबाई 4.0m - 4.8m)' : 'Sedan / Crossover (4.0m - 4.8m)',
        };
      case 'xl':
        return {
          icon: <Truck className="w-4 h-4" />,
          label: isHindi ? 'बड़ा (SUV / XL)' : 'XL / SUV',
          color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          badgeColor: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
          description: isHindi ? 'फुल-साइज़ SUV / वैन / पिकअप (> 4.8m)' : 'Full-size SUV / Van / Pickup (> 4.8m)',
        };
    }
  };

  const handleReserveSlot = (slot: ParkingSlot) => {
    if (slot.isOccupied) {
      toast.error(isHindi ? `स्लॉट ${slot.number} वर्तमान में व्यस्त है` : `Slot ${slot.number} is currently occupied`);
      return;
    }
    toast.success(isHindi ? `स्लॉट ${slot.number} आरक्षित हो गया!` : `Slot ${slot.number} reserved successfully!`, {
      description: `${isHindi ? 'मंजिल' : 'Floor'} ${slot.floor} • ${slot.dimensions} (${slot.size.toUpperCase()})`,
    });
  };

  const compactAvailable = mockSlots.filter(s => s.size === 'compact' && !s.isOccupied).length;
  const regularAvailable = mockSlots.filter(s => s.size === 'regular' && !s.isOccupied).length;
  const xlAvailable = mockSlots.filter(s => s.size === 'xl' && !s.isOccupied).length;
  const totalAvailable = compactAvailable + regularAvailable + xlAvailable;

  const displayedSlots = mockSlots.filter(s => {
    const matchesFloor = s.floor === selectedFloor;
    const matchesFilter = selectedFilter === 'all' || s.size === selectedFilter;
    return matchesFloor && matchesFilter;
  });

  return (
    <Card className="w-full h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              {isHindi ? 'वाहन आकार के अनुसार पार्किंग' : 'Parking by Vehicle Size'}
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-medium">
              {totalAvailable} {isHindi ? 'उपलब्ध' : 'Available'}
            </Badge>
          </div>
          <CardDescription>
            {isHindi 
              ? 'AI आधारित सेंसर वाहन के आकार के अनुसार सही स्लॉट आवंटित करते हैं'
              : 'Automated 3D LiDAR profile scanning and custom bay allocation by dimensions'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Feature Description */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isHindi 
                ? '🚗 AI आधारित वाहन आकार पहचान - अपने वाहन के आकार के अनुसार सही पार्किंग स्लॉट खोजें। बाइक, कार, और बड़े वाहनों के लिए अलग-अलग स्लॉट।'
                : '🚗 AI-guided volumetric profiling ensures your vehicle fits comfortably with appropriate turning radius, width clearance, and ceiling height.'}
            </p>
          </div>

          {/* Size Category Filter Pills */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { size: 'compact' as const, available: compactAvailable, total: 4 },
              { size: 'regular' as const, available: regularAvailable, total: 5 },
              { size: 'xl' as const, available: xlAvailable, total: 4 },
            ].map(item => {
              const info = getSizeInfo(item.size);
              const isSelected = selectedFilter === item.size;
              return (
                <button
                  key={item.size}
                  type="button"
                  onClick={() => setSelectedFilter(isSelected ? 'all' : item.size)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                    info.color,
                    isSelected ? "ring-2 ring-primary border-primary shadow-xs" : "hover:opacity-90"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {info.icon}
                      <span className="truncate">{info.label}</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{item.available}</span>
                    <span className="text-xs opacity-75">/ {item.total} free</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Floor Navigation Pills */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[11px] font-medium mr-1">Floor:</span>
              {[1, 2, 3].map(floor => (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setSelectedFloor(floor)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                    selectedFloor === floor 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground"
                  )}
                >
                  {floor === 1 ? 'Floor 1 (2.1m)' : floor === 2 ? 'Floor 2 (2.4m)' : 'Floor 3 (Roof Open)'}
                </button>
              ))}
            </div>

            {selectedFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-2 text-primary"
                onClick={() => setSelectedFilter('all')}
              >
                Clear Filter
              </Button>
            )}
          </div>

          {/* Slot Grid for Selected Floor */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {displayedSlots.map(slot => {
                const info = getSizeInfo(slot.size);
                return (
                  <div
                    key={slot.id}
                    onClick={() => handleReserveSlot(slot)}
                    className={cn(
                      "p-2.5 rounded-xl border text-center transition-all relative flex flex-col justify-between select-none",
                      slot.isOccupied 
                        ? "bg-muted/40 border-border/40 opacity-60 cursor-not-allowed" 
                        : "bg-card border-border hover:border-primary/40 hover:bg-accent/40 cursor-pointer shadow-xs hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">{slot.number}</span>
                      <Badge variant="outline" className={cn("text-[9px] py-0 px-1 h-3.5 leading-none", info.badgeColor)}>
                        {slot.size.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex justify-center my-1.5 text-muted-foreground">
                      {info.icon}
                    </div>

                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {slot.dimensions}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-center gap-1 text-[11px]">
                      {slot.isOccupied ? (
                        <span className="text-rose-500 font-medium flex items-center gap-0.5">
                          <X className="w-3 h-3" /> Occupied
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Reserve
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </div>

      {/* Footer Area - Balances Height with SustainabilityDashboard */}
      <div className="px-6 pb-6 pt-2 space-y-3">
        {/* Dimension & Clearance Specifications */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/50 border border-border/40 text-center text-xs">
          <div>
            <span className="text-[11px] text-muted-foreground block">Compact Bays</span>
            <strong className="text-foreground text-sm font-semibold">2.2m × 4.5m</strong>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block">Sedan Bays</span>
            <strong className="text-foreground text-sm font-semibold">2.5m × 5.0m</strong>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block">SUV / XL Bays</span>
            <strong className="text-foreground text-sm font-semibold">3.2m × 6.0m</strong>
          </div>
        </div>

        {/* AI LiDAR Boom Barrier Status Notice */}
        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>
              {isHindi 
                ? 'प्रवेश द्वार पर ऑटोमैटिक 3D लेजर प्रोफाइलर सक्रिय है।'
                : 'Automated 3D LiDAR profile scanner active at Entry Barrier 1 & 2.'}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium shrink-0">
            Active
          </Badge>
        </div>
      </div>
    </Card>
  );
}
