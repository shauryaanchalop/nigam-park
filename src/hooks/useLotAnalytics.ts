import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LotUsageStat {
  id: string;
  lot_id: string;
  stat_date: string;
  hour_of_day: number;
  avg_occupancy: number;
  peak_occupancy: number;
  total_vehicles: number;
  revenue: number;
  created_at: string;
  parking_lots?: {
    name: string;
  };
}

export interface RevenueForecast {
  id: string;
  lot_id: string | null;
  forecast_date: string;
  predicted_revenue: number;
  confidence_score: number;
  model_version: string;
  created_at: string;
}

export interface FraudPattern {
  id: string;
  pattern_type: string;
  description: string;
  detection_rules: Record<string, any>;
  severity: string;
  is_active: boolean;
  created_at: string;
}

export function useLotUsageStats(lotId?: string, days: number = 7) {
  return useQuery({
    queryKey: ['lot-usage-stats', lotId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let query = supabase
        .from('lot_usage_stats')
        .select(`
          *,
          parking_lots (name)
        `)
        .gte('stat_date', startDate.toISOString().split('T')[0])
        .order('stat_date', { ascending: true })
        .order('hour_of_day', { ascending: true });
      
      if (lotId) {
        query = query.eq('lot_id', lotId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as LotUsageStat[];
    },
  });
}

export function useHeatmapData(lotId?: string) {
  const { data: stats, isLoading } = useLotUsageStats(lotId, 30);
  
  // Aggregate by hour across all days
  const heatmapData = Array.from({ length: 24 }, (_, hour) => {
    const hourStats = stats?.filter(s => s.hour_of_day === hour) || [];
    const avgOccupancy = hourStats.length > 0 
      ? hourStats.reduce((sum, s) => sum + Number(s.avg_occupancy), 0) / hourStats.length 
      : 0;
    const totalVehicles = hourStats.reduce((sum, s) => sum + s.total_vehicles, 0);
    const avgRevenue = hourStats.length > 0
      ? hourStats.reduce((sum, s) => sum + Number(s.revenue), 0) / hourStats.length
      : 0;
    
    return {
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      avgOccupancy: Math.round(avgOccupancy),
      totalVehicles,
      avgRevenue: Math.round(avgRevenue),
    };
  });

  // Aggregate by day of week
  const dayData = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ].map((day, index) => {
    const dayStats = stats?.filter(s => new Date(s.stat_date).getDay() === index) || [];
    const avgOccupancy = dayStats.length > 0
      ? dayStats.reduce((sum, s) => sum + Number(s.avg_occupancy), 0) / dayStats.length
      : 0;
    
    return {
      day,
      dayIndex: index,
      avgOccupancy: Math.round(avgOccupancy),
      totalVehicles: dayStats.reduce((sum, s) => sum + s.total_vehicles, 0),
    };
  });

  return { heatmapData, dayData, isLoading };
}

export function useRevenueForecasts() {
  return useQuery({
    queryKey: ['revenue-forecasts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_forecasts')
        .select('*')
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date', { ascending: true })
        .limit(30);
      
      if (error) throw error;
      return data as RevenueForecast[];
    },
  });
}

export function useFraudPatterns() {
  return useQuery({
    queryKey: ['fraud-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_patterns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FraudPattern[];
    },
  });
}

export function useRevenueForecastStats() {
  const { data: forecasts } = useRevenueForecasts();
  
  const next7Days = forecasts?.slice(0, 7) || [];
  const totalPredicted = next7Days.reduce((sum, f) => sum + Number(f.predicted_revenue), 0);
  const avgConfidence = next7Days.length > 0
    ? next7Days.reduce((sum, f) => sum + Number(f.confidence_score), 0) / next7Days.length
    : 0;
  
  return {
    forecasts,
    next7DaysRevenue: totalPredicted,
    avgConfidence: Math.round(avgConfidence * 100),
  };
}