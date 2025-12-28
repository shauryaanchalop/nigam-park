import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface LotUsageStat {
  id: string;
  lot_id: string;
  stat_date: string;
  hour_of_day: number;
  avg_occupancy: number;
  peak_occupancy: number;
  total_vehicles: number;
  revenue: number;
}

export function UsageHeatmap({ lotId }: { lotId?: string }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['lot-usage-heatmap', lotId],
    queryFn: async () => {
      let query = supabase
        .from('lot_usage_stats')
        .select('*')
        .order('stat_date', { ascending: false })
        .limit(168); // 7 days * 24 hours

      if (lotId) {
        query = query.eq('lot_id', lotId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LotUsageStat[];
    },
  });

  // Process data into a heatmap grid
  const heatmapData = React.useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => 
      Array.from({ length: 24 }, () => 0)
    );
    
    const counts: number[][] = Array.from({ length: 7 }, () => 
      Array.from({ length: 24 }, () => 0)
    );

    stats?.forEach((stat) => {
      const date = new Date(stat.stat_date);
      const dayIndex = date.getDay();
      const hourIndex = stat.hour_of_day;
      
      grid[dayIndex][hourIndex] += Number(stat.avg_occupancy);
      counts[dayIndex][hourIndex]++;
    });

    // Average the values
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        if (counts[d][h] > 0) {
          grid[d][h] = Math.round(grid[d][h] / counts[d][h]);
        }
      }
    }

    return grid;
  }, [stats]);

  // Find peak times
  const peakTimes = React.useMemo(() => {
    const peaks: Array<{ day: string; hour: number; occupancy: number }> = [];
    
    heatmapData.forEach((dayData, dayIndex) => {
      dayData.forEach((occupancy, hourIndex) => {
        if (occupancy >= 80) {
          peaks.push({
            day: DAYS[dayIndex],
            hour: hourIndex,
            occupancy,
          });
        }
      });
    });

    return peaks.sort((a, b) => b.occupancy - a.occupancy).slice(0, 5);
  }, [heatmapData]);

  const getHeatColor = (value: number) => {
    if (value >= 90) return 'bg-red-500';
    if (value >= 70) return 'bg-orange-400';
    if (value >= 50) return 'bg-yellow-400';
    if (value >= 30) return 'bg-green-300';
    if (value >= 10) return 'bg-green-200';
    return 'bg-muted';
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Usage Heatmap
          </CardTitle>
          {peakTimes.length > 0 && (
            <Badge variant="destructive">
              Peak: {peakTimes[0]?.day} {formatHour(peakTimes[0]?.hour || 0)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex mb-1">
              <div className="w-12" />
              {HOURS.filter((_, i) => i % 3 === 0).map((hour) => (
                <div 
                  key={hour} 
                  className="flex-1 text-xs text-muted-foreground text-center"
                  style={{ minWidth: '36px' }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>
            
            {/* Heatmap grid */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-12 text-xs text-muted-foreground">{day}</div>
                <div className="flex flex-1 gap-0.5">
                  {HOURS.map((hour) => (
                    <div
                      key={`${day}-${hour}`}
                      className={cn(
                        "h-6 flex-1 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary",
                        getHeatColor(heatmapData[dayIndex][hour])
                      )}
                      title={`${day} ${formatHour(hour)}: ${heatmapData[dayIndex][hour]}% occupancy`}
                      style={{ minWidth: '12px' }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-2 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-300" />
            <span>30%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-400" />
            <span>50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-400" />
            <span>70%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>90%+</span>
          </div>
        </div>

        {/* Peak times summary */}
        {peakTimes.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Peak Usage Times:</p>
            <div className="flex flex-wrap gap-2">
              {peakTimes.map((peak, i) => (
                <Badge key={i} variant="secondary">
                  {peak.day} {formatHour(peak.hour)} ({peak.occupancy}%)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
