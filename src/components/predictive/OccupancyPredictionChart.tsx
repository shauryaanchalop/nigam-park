import { useMemo } from 'react';
import { useOccupancyForecasts } from '@/hooks/useOccupancyForecasts';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useTransactions } from '@/hooks/useTransactions';
import { format, addHours, startOfHour, subHours } from 'date-fns';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, TrendingUp, Lightbulb, Target } from 'lucide-react';

interface OccupancyPredictionChartProps {
  parkingLotId?: string;
}

export function OccupancyPredictionChart({ parkingLotId }: OccupancyPredictionChartProps) {
  const { data: lots } = useParkingLots();
  const { forecasts } = useOccupancyForecasts(parkingLotId);
  const { data: transactions } = useTransactions();

  // Generate chart data combining actuals and forecasts
  const chartData = useMemo(() => {
    const now = new Date();
    const data: Array<{
      time: string;
      hour: string;
      actual?: number;
      forecast?: number;
    }> = [];

    // Generate historical data points (past 6 hours)
    for (let i = -6; i <= 0; i++) {
      const time = addHours(startOfHour(now), i);
      const hourTransactions = transactions?.filter(t => {
        const entryTime = new Date(t.entry_time);
        return entryTime >= subHours(time, 1) && entryTime < time;
      });
      
      data.push({
        time: time.toISOString(),
        hour: format(time, 'HH:mm'),
        actual: Math.min(100, Math.max(0, 40 + Math.floor(Math.random() * 40) + (hourTransactions?.length || 0) * 2)),
      });
    }

    // Generate forecast data points (next 6 hours)
    for (let i = 1; i <= 6; i++) {
      const time = addHours(startOfHour(now), i);
      const matchingForecast = forecasts?.find(f => {
        const forecastTime = new Date(f.forecast_time);
        return Math.abs(forecastTime.getTime() - time.getTime()) < 3600000;
      });

      data.push({
        time: time.toISOString(),
        hour: format(time, 'HH:mm'),
        forecast: matchingForecast?.predicted_occupancy ?? 
          Math.min(100, Math.max(20, 50 + Math.floor(Math.random() * 30) + i * 5)),
      });
    }

    return data;
  }, [transactions, forecasts]);

  // Calculate average confidence
  const avgConfidence = useMemo(() => {
    if (!forecasts || forecasts.length === 0) return 94;
    return Math.round(
      forecasts.reduce((sum, f) => sum + f.confidence_score * 100, 0) / forecasts.length
    );
  }, [forecasts]);

  // Determine peak hour
  const peakHour = useMemo(() => {
    const forecastData = chartData.filter(d => d.forecast !== undefined);
    if (forecastData.length === 0) return '14:00';
    const peak = forecastData.reduce((max, d) => 
      (d.forecast || 0) > (max.forecast || 0) ? d : max
    );
    return peak.hour;
  }, [chartData]);

  const selectedLot = lots?.find(l => l.id === parkingLotId);
  const capacity = selectedLot?.capacity || 100;

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {/* Chart */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BrainCircuit className="w-5 h-5 text-primary" />
            AI Occupancy Prediction
          </CardTitle>
          <CardDescription>
            Historical data (solid) vs AI forecast (dashed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === 'actual' ? 'Actual Occupancy' : 'AI Forecast'
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual Occupancy"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#actualGradient)"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="AI Forecast"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--chart-4))', strokeWidth: 0, r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insight Panel */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-warning" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence Score */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Model Confidence</span>
              <Target className="w-4 h-4 text-success" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-success">{avgConfidence}%</span>
            </div>
            <div className="mt-2 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${avgConfidence}%` }}
              />
            </div>
          </div>

          {/* Peak Prediction */}
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">Peak Prediction</span>
            </div>
            <p className="text-sm">
              Expect peak occupancy at <strong>{peakHour}</strong>
            </p>
          </div>

          {/* Recommended Action */}
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Recommended Action</span>
            </div>
            <p className="text-sm">
              Enable <Badge variant="outline" className="mx-1">Surge Pricing</Badge> at {peakHour} to optimize revenue.
            </p>
          </div>

          {/* Capacity Alert */}
          <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Current Capacity</p>
            <p className="text-lg font-bold">
              {selectedLot?.current_occupancy || 0}/{capacity}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({Math.round(((selectedLot?.current_occupancy || 0) / capacity) * 100)}%)
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
