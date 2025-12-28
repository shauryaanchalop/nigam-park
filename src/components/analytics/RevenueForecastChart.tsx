import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface RevenueForecast {
  id: string;
  lot_id: string | null;
  forecast_date: string;
  predicted_revenue: number;
  confidence_score: number | null;
  model_version: string | null;
  created_at: string;
}

export function RevenueForecastChart() {
  const { data: forecasts, isLoading } = useQuery({
    queryKey: ['revenue-forecasts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_forecasts')
        .select('*')
        .order('forecast_date', { ascending: true })
        .limit(30);
      
      if (error) throw error;
      return data as RevenueForecast[];
    },
  });

  const { data: historicalRevenue } = useQuery({
    queryKey: ['historical-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lot_usage_stats')
        .select('stat_date, revenue')
        .order('stat_date', { ascending: true })
        .limit(14);
      
      if (error) throw error;
      return data;
    },
  });

  // Combine historical and forecast data
  const chartData = React.useMemo(() => {
    const combined: Array<{
      date: string;
      actual?: number;
      predicted?: number;
      confidence?: number;
    }> = [];

    // Add historical data
    historicalRevenue?.forEach((item) => {
      combined.push({
        date: format(new Date(item.stat_date), 'MMM dd'),
        actual: Number(item.revenue),
      });
    });

    // Add forecast data
    forecasts?.forEach((item) => {
      const existingIndex = combined.findIndex(
        (c) => c.date === format(new Date(item.forecast_date), 'MMM dd')
      );
      
      if (existingIndex >= 0) {
        combined[existingIndex].predicted = Number(item.predicted_revenue);
        combined[existingIndex].confidence = Number(item.confidence_score || 0.85) * 100;
      } else {
        combined.push({
          date: format(new Date(item.forecast_date), 'MMM dd'),
          predicted: Number(item.predicted_revenue),
          confidence: Number(item.confidence_score || 0.85) * 100,
        });
      }
    });

    return combined;
  }, [historicalRevenue, forecasts]);

  // Calculate trend
  const trend = React.useMemo(() => {
    if (!forecasts || forecasts.length < 2) return null;
    const first = Number(forecasts[0]?.predicted_revenue || 0);
    const last = Number(forecasts[forecasts.length - 1]?.predicted_revenue || 0);
    const percentChange = first > 0 ? ((last - first) / first) * 100 : 0;
    return {
      direction: percentChange >= 0 ? 'up' : 'down',
      percent: Math.abs(percentChange).toFixed(1),
    };
  }, [forecasts]);

  const totalPredicted = forecasts?.reduce(
    (sum, f) => sum + Number(f.predicted_revenue),
    0
  ) || 0;

  const avgConfidence = forecasts?.length
    ? (forecasts.reduce((sum, f) => sum + (Number(f.confidence_score) || 0.85), 0) / forecasts.length) * 100
    : 0;

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
            <TrendingUp className="w-5 h-5 text-primary" />
            Revenue Forecast
          </CardTitle>
          {trend && (
            <Badge variant={trend.direction === 'up' ? 'default' : 'destructive'}>
              {trend.direction === 'up' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {trend.percent}%
            </Badge>
          )}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Predicted Total: ₹{totalPredicted.toLocaleString()}</span>
          <span>Confidence: {avgConfidence.toFixed(0)}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString()}`,
                  name === 'actual' ? 'Actual Revenue' : 'Predicted Revenue'
                ]}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorActual)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#colorPredicted)"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(var(--chart-2))' }} />
            <span>Predicted</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
