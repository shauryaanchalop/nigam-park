import React from 'react';
import { MapPin, Car, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useParkingLots } from '@/hooks/useParkingLots';
import { cn } from '@/lib/utils';

export function ParkingMap() {
  const { data: lots, isLoading } = useParkingLots();

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 h-[400px] animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-full bg-muted rounded"></div>
      </div>
    );
  }

  const getOccupancyColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-success';
  };

  const getOccupancyStatus = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return 'Full';
    if (percentage >= 70) return 'Busy';
    return 'Available';
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Delhi Parking Zones</h3>
        </div>
        <Badge variant="outline">{lots?.length ?? 0} Active Lots</Badge>
      </div>
      
      {/* Stylized Map Placeholder */}
      <div className="relative h-[350px] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Parking Lot Markers */}
        <div className="absolute inset-0 p-4">
          {lots?.map((lot, index) => {
            // Position markers in a visually appealing way
            const positions = [
              { top: '15%', left: '25%' },
              { top: '25%', left: '55%' },
              { top: '45%', left: '15%' },
              { top: '35%', left: '75%' },
              { top: '65%', left: '45%' },
              { top: '75%', left: '70%' },
            ];
            const pos = positions[index % positions.length];
            
            return (
              <div
                key={lot.id}
                className="absolute group cursor-pointer transition-transform hover:scale-110"
                style={{ top: pos.top, left: pos.left }}
              >
                {/* Marker */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shadow-lg',
                  getOccupancyColor(lot.current_occupancy, lot.capacity)
                )}>
                  <Car className="w-5 h-5 text-primary-foreground" />
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
                    <p className="font-semibold text-sm text-foreground">{lot.name}</p>
                    <p className="text-xs text-muted-foreground">{lot.zone}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Occupancy</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-xs',
                          getOccupancyStatus(lot.current_occupancy, lot.capacity) === 'Full' && 'border-destructive text-destructive',
                          getOccupancyStatus(lot.current_occupancy, lot.capacity) === 'Busy' && 'border-warning text-warning',
                          getOccupancyStatus(lot.current_occupancy, lot.capacity) === 'Available' && 'border-success text-success',
                        )}
                      >
                        {lot.current_occupancy}/{lot.capacity}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
          <p className="text-xs font-medium text-foreground mb-2">Status</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span className="text-xs text-muted-foreground">Busy (70%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span className="text-xs text-muted-foreground">Full (90%+)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
