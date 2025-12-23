import React, { useEffect, useState } from 'react';
import { MapPin, Car, Activity, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useParkingLots } from '@/hooks/useParkingLots';
import { cn } from '@/lib/utils';

export function ParkingMap() {
  const { data: lots, isLoading } = useParkingLots();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [updatedLots, setUpdatedLots] = useState<Set<string>>(new Set());

  // Track real-time updates
  useEffect(() => {
    if (lots) {
      setLastUpdate(new Date());
      // Flash animation for updated lots
      const newUpdated = new Set(lots.map(l => l.id));
      setUpdatedLots(newUpdated);
      const timer = setTimeout(() => setUpdatedLots(new Set()), 1500);
      return () => clearTimeout(timer);
    }
  }, [lots?.map(l => l.current_occupancy).join(',')]);

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
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="relative">
              <Wifi className="w-3.5 h-3.5 text-success" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-success rounded-full live-indicator" />
            </div>
            <span>Live</span>
          </div>
          <Badge variant="outline">{lots?.length ?? 0} Active Lots</Badge>
        </div>
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
            const isJustUpdated = updatedLots.has(lot.id);
            
            return (
              <div
                key={lot.id}
                className="absolute group cursor-pointer transition-all duration-300 hover:scale-110"
                style={{ top: pos.top, left: pos.left }}
              >
                {/* Pulse ring for real-time updates */}
                {isJustUpdated && (
                  <div className={cn(
                    'absolute inset-0 rounded-full animate-ping opacity-75',
                    getOccupancyColor(lot.current_occupancy, lot.capacity)
                  )} style={{ animationDuration: '1s' }} />
                )}
                
                {/* Marker */}
                <div className={cn(
                  'relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
                  getOccupancyColor(lot.current_occupancy, lot.capacity),
                  isJustUpdated && 'ring-4 ring-primary/30'
                )}>
                  <Car className="w-5 h-5 text-primary-foreground" />
                  
                  {/* Live activity indicator */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-card rounded-full flex items-center justify-center">
                    <Activity className="w-2 h-2 text-success" />
                  </div>
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
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          getOccupancyColor(lot.current_occupancy, lot.capacity)
                        )}
                        style={{ width: `${(lot.current_occupancy / lot.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3 h-3 text-success" />
            <p className="text-xs font-medium text-foreground">Real-time Status</p>
          </div>
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
          <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">
            Updated: {lastUpdate.toLocaleTimeString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
