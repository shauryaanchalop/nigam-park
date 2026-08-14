import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ZoneTransparencyRow {
  zone: string;
  lot_count: number;
  total_capacity: number;
  current_occupancy: number;
  occupancy_percent: number;
  total_revenue: number;
  transaction_count: number;
}

export interface DailyTransparencyRow {
  day: string;
  total_revenue: number;
  transaction_count: number;
}

const db = supabase as any;

export function useZoneTransparency(days = 30) {
  return useQuery({
    queryKey: ['transparency-zones', days],
    queryFn: async (): Promise<ZoneTransparencyRow[]> => {
      const { data, error } = await db.rpc('get_zone_transparency', { _days: days });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        lot_count: Number(r.lot_count),
        total_capacity: Number(r.total_capacity),
        current_occupancy: Number(r.current_occupancy),
        occupancy_percent: Number(r.occupancy_percent),
        total_revenue: Number(r.total_revenue),
        transaction_count: Number(r.transaction_count),
      }));
    },
    refetchInterval: 60000,
  });
}

export function useDailyTransparency(days = 14) {
  return useQuery({
    queryKey: ['transparency-daily', days],
    queryFn: async (): Promise<DailyTransparencyRow[]> => {
      const { data, error } = await db.rpc('get_daily_transparency', { _days: days });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        day: r.day,
        total_revenue: Number(r.total_revenue),
        transaction_count: Number(r.transaction_count),
      }));
    },
    refetchInterval: 60000,
  });
}
