import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OccupancyForecast } from '@/types/ai-modules';

import { DEMO_OCCUPANCY_FORECASTS, withDemoFallback } from '@/lib/demoData';

export function useOccupancyForecasts(parkingLotId?: string) {
  const queryClient = useQueryClient();

  const { data: forecasts, isLoading, error } = useQuery({
    queryKey: ['occupancy-forecasts', parkingLotId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('occupancy_forecasts')
          .select('*')
          .order('forecast_time', { ascending: true });

        if (parkingLotId) {
          query = query.eq('parking_lot_id', parkingLotId);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          const fallback = parkingLotId
            ? DEMO_OCCUPANCY_FORECASTS.filter(f => f.parking_lot_id === parkingLotId)
            : DEMO_OCCUPANCY_FORECASTS;
          return (fallback.length > 0 ? fallback : DEMO_OCCUPANCY_FORECASTS) as OccupancyForecast[];
        }
        return withDemoFallback(data as OccupancyForecast[], DEMO_OCCUPANCY_FORECASTS);
      } catch {
        const fallback = parkingLotId
          ? DEMO_OCCUPANCY_FORECASTS.filter(f => f.parking_lot_id === parkingLotId)
          : DEMO_OCCUPANCY_FORECASTS;
        return (fallback.length > 0 ? fallback : DEMO_OCCUPANCY_FORECASTS) as OccupancyForecast[];
      }
    },
  });

  const createForecast = useMutation({
    mutationFn: async (forecast: {
      parking_lot_id: string;
      forecast_time: string;
      predicted_occupancy: number;
      confidence_score: number;
    }) => {
      const { data, error } = await supabase
        .from('occupancy_forecasts')
        .insert(forecast)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occupancy-forecasts'] });
    },
  });

  return {
    forecasts,
    isLoading,
    error,
    createForecast,
  };
}
