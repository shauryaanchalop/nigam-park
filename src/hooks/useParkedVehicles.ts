import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export function useParkedVehicles(lotId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['parked-vehicles', lotId],
    queryFn: async () => {
      if (!lotId) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          vehicle_number,
          start_time,
          end_time,
          checked_in_at,
          status,
          parking_lots (
            name
          )
        `)
        .eq('lot_id', lotId)
        .eq('reservation_date', today)
        .eq('status', 'checked_in')
        .order('checked_in_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!lotId,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!lotId) return;

    const channel = supabase
      .channel('parked-vehicles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `lot_id=eq.${lotId}`,
        },
        () => {
          // Invalidate and refetch on any change
          queryClient.invalidateQueries({ queryKey: ['parked-vehicles', lotId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lotId, queryClient]);

  return {
    parkedVehicles: query.data ?? [],
    isLoading: query.isLoading,
  };
}
