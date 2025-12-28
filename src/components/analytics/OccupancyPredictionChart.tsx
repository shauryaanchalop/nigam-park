import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParkingLots } from '@/hooks/useParkingLots';
import { format, addHours } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface OccupancyForecast {
  id: string;
  parking_lot_id: string;
  forecast_time: string;
  predicted_occupancy: number;
  confidence_score: number;
  created_at: string;
}

export function OccupancyPredictionChart() {
  const [selectedLotId, setSelectedLotId] = React.useState<string>('all');
  const { data: lots } = useParkingLots();

  const { data: forecasts, isLoading } = useQuery({
    queryKey: ['occupancy-forecasts', selectedLotId],
    queryFn: async () => {
      let query = supabase
        .from('occupancy_forecasts')
        .select('*')
        .gte('forecast_time', new Date().toISOString())
        .order('forecast_time', { ascending: true })
        .limit(48);

      if (selectedLotId !== 'all') {
        query = query.eq('parking_lot_id', selectedLotId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as OccupancyForecast[];
    },
  });

  const { data: currentOccupancy } = useQuery({
    queryKey: ['current-occupancy', selectedLotId],
    queryFn: async () => {
      if (selectedLotId === 'all') {
        const { data, error } = await supabase
          .from('parking_lots')
          .select('current_occupancy, capacity');
        if (error) throw error;
        const total = data?.reduce((sum, lot) => sum + lot.current_occupancy, 0) || 0;
        const capacity = data?.reduce((sum, lot) => sum + lot.capacity, 0) || 1;
        return Math.round((total / capacity) * 100);
      } else {
        const { data, error } = await supabase
          .from('parking_lots')
          .select('current_occupancy, capacity')
          .eq('id', selectedLotId)
          .maybeSingle();
        if (error) throw error;
        if (!data) return 0;
        return Math.round((data.current_occupancy / data.capacity) * 100);
      }
    },
  });

  const chartData = React.useMemo(() => {
    if (!forecasts) return [];

    // Start with current occupancy
    const data = [
      {
        time: format(new Date(), 'HH:mm'),
        occupancy: currentOccupancy || 0,
        predicted: currentOccupancy || 0,
        confidence: 100,
        label: 'Now',
      },
    ];

    // Add forecasts
    forecasts.forEach((forecast) => {
      data.push({
        time: format(new Date(forecast.forecast_time), 'HH:mm'),
        occupancy: null as any,
        predicted: forecast.predicted_occupancy,
        confidence: Math.round(forecast.confidence_score * 100),
        label: format(new Date(forecast.forecast_time), 'h:mm a'),
      });
    });

    return data;
  }, [forecasts, currentOccupancy]);

  // Find peak predicted time
  const peakPrediction = React.useMemo(() => {
    if (!forecasts || forecasts.length === 0) return null;
    const peak = forecasts.reduce((max, f) => 
      f.predicted_occupancy > max.predicted_occupancy ? f : max
    );
    return {
      time: format(new Date(peak.forecast_time), 'h:mm a'),
      occupancy: peak.predicted_occupancy,
    };
  }, [forecasts]);

  // Calculate trend
  const trend = React.useMemo(() => {
    if (!forecasts || forecasts.length < 2 || !currentOccupancy) return null;
    const nextHour = forecasts[0];
    if (!nextHour) return null;
    const change = nextHour.predicted_occupancy - currentOccupancy;
    return {
      direction: change >= 0 ? 'up' : 'down',
      value: Math.abs(change),
    };
  }, [forecasts, currentOccupancy]);

  const selectedLot = lots?.find(l => l.id === selectedLotId);
  const avgConfidence = forecasts?.length
    ? Math.round(forecasts.reduce((sum, f) => sum + f.confidence_score, 0) / forecasts.length * 100)
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[350px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Occupancy Prediction
            </CardTitle>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>Current: {currentOccupancy}%</span>
              {trend && (
                <span className={trend.direction === 'up' ? 'text-destructive' : 'text-success'}>
                  {trend.direction === 'up' ? (
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 inline mr-1" />
                  )}
                  {trend.value}% next hour
                </span>
              )}
            </div>
          </div>
          <Select value={selectedLotId} onValueChange={setSelectedLotId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select lot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lots</SelectItem>
              {lots?.map((lot) => (
                <SelectItem key={lot.id} value={lot.id}>
                  {lot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length <= 1 ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mb-2 opacity-50" />
            <p>No forecast data available</p>
            <p className="text-sm">Predictions will appear here once generated</p>
          </div>
        ) : (
          <>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${value}%`}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === 'predicted' ? 'Predicted Occupancy' : 'Current'
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.label || label;
                    }}
                  />
                  <ReferenceLine y={80} stroke="hsl(var(--warning))" strokeDasharray="3 3" />
                  <ReferenceLine y={95} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorPredicted)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap justify-between items-center mt-4 pt-4 border-t gap-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-warning" />
                  <span className="text-muted-foreground">High (80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-destructive" />
                  <span className="text-muted-foreground">Full (95%)</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {peakPrediction && (
                  <Badge variant="outline" className="gap-1">
                    Peak: {peakPrediction.time} ({peakPrediction.occupancy}%)
                  </Badge>
                )}
                <span className="text-muted-foreground">
                  Confidence: {avgConfidence}%
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
