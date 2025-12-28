import { useParkingLots } from '@/hooks/useParkingLots';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Car, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OccupancyChange {
  lotId: string;
  previousOccupancy: number;
  currentOccupancy: number;
  timestamp: Date;
}

export function RealTimeOccupancyWidget() {
  const { data: lots, isLoading } = useParkingLots();
  const [recentChanges, setRecentChanges] = useState<OccupancyChange[]>([]);
  const [previousData, setPreviousData] = useState<Record<string, number>>({});
  const [pulsingLots, setPulsingLots] = useState<Set<string>>(new Set());

  // Track changes when lots data updates
  useEffect(() => {
    if (!lots) return;

    const newChanges: OccupancyChange[] = [];
    const newPulsingLots = new Set<string>();

    lots.forEach((lot) => {
      const prev = previousData[lot.id];
      if (prev !== undefined && prev !== lot.current_occupancy) {
        newChanges.push({
          lotId: lot.id,
          previousOccupancy: prev,
          currentOccupancy: lot.current_occupancy,
          timestamp: new Date(),
        });
        newPulsingLots.add(lot.id);
      }
    });

    if (newChanges.length > 0) {
      setRecentChanges((prev) => [...newChanges, ...prev].slice(0, 5));
      setPulsingLots(newPulsingLots);

      // Clear pulse animation after 2 seconds
      setTimeout(() => {
        setPulsingLots(new Set());
      }, 2000);
    }

    // Update previous data
    const newPrevData: Record<string, number> = {};
    lots.forEach((lot) => {
      newPrevData[lot.id] = lot.current_occupancy;
    });
    setPreviousData(newPrevData);
  }, [lots]);

  const getOccupancyStatus = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 90) return { label: 'Full', color: 'bg-destructive', textColor: 'text-destructive' };
    if (percentage >= 70) return { label: 'Busy', color: 'bg-warning', textColor: 'text-warning' };
    return { label: 'Available', color: 'bg-success', textColor: 'text-success' };
  };

  const totalCapacity = lots?.reduce((sum, lot) => sum + lot.capacity, 0) || 0;
  const totalOccupancy = lots?.reduce((sum, lot) => sum + lot.current_occupancy, 0) || 0;
  const overallPercentage = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            Loading...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Real-Time Occupancy
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-xs text-muted-foreground">LIVE</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Stats */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">System Overview</span>
            <Badge variant="outline" className="text-xs">
              {totalOccupancy}/{totalCapacity} spots
            </Badge>
          </div>
          <Progress value={overallPercentage} className="h-2" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">{overallPercentage}% occupied</span>
            <span className="text-xs text-muted-foreground">{totalCapacity - totalOccupancy} available</span>
          </div>
        </div>

        {/* Parking Lots Grid */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {lots?.map((lot) => {
            const percentage = Math.round((lot.current_occupancy / lot.capacity) * 100);
            const status = getOccupancyStatus(lot.current_occupancy, lot.capacity);
            const isPulsing = pulsingLots.has(lot.id);
            const recentChange = recentChanges.find((c) => c.lotId === lot.id);

            return (
              <div
                key={lot.id}
                className={`p-2.5 rounded-lg border transition-all duration-300 ${
                  isPulsing 
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                    : 'border-border/50 bg-background/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Car className={`h-3.5 w-3.5 ${status.textColor}`} />
                    <span className="text-sm font-medium truncate max-w-[120px]">{lot.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {recentChange && (
                      <span className={`text-xs flex items-center gap-0.5 ${
                        recentChange.currentOccupancy > recentChange.previousOccupancy 
                          ? 'text-destructive' 
                          : 'text-success'
                      }`}>
                        {recentChange.currentOccupancy > recentChange.previousOccupancy ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : recentChange.currentOccupancy < recentChange.previousOccupancy ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                      </span>
                    )}
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 ${status.textColor}`}
                    >
                      {status.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={percentage} 
                    className={`h-1.5 flex-1 ${isPulsing ? 'animate-pulse' : ''}`}
                  />
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {lot.current_occupancy}/{lot.capacity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        {recentChanges.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Recent Activity</p>
            <div className="space-y-1">
              {recentChanges.slice(0, 3).map((change, idx) => {
                const lot = lots?.find((l) => l.id === change.lotId);
                const isIncrease = change.currentOccupancy > change.previousOccupancy;
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {isIncrease ? (
                      <TrendingUp className="h-3 w-3 text-destructive" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-success" />
                    )}
                    <span className="text-muted-foreground">
                      {lot?.name}: {change.previousOccupancy} → {change.currentOccupancy}
                    </span>
                    <span className="text-muted-foreground/50 ml-auto">
                      {change.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
