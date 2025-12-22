import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ParkingLot } from '@/types/database';
import { useEffect } from 'react';

export function useParkingLots() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['parking-lots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parking_lots')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ParkingLot[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('parking-lots-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parking_lots',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['parking-lots'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateOccupancy = useMutation({
    mutationFn: async ({ lotId, delta }: { lotId: string; delta: number }) => {
      // First get current occupancy
      const { data: lot, error: fetchError } = await supabase
        .from('parking_lots')
        .select('current_occupancy, capacity')
        .eq('id', lotId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newOccupancy = Math.max(0, Math.min(lot.capacity, lot.current_occupancy + delta));
      
      const { error } = await supabase
        .from('parking_lots')
        .update({ current_occupancy: newOccupancy })
        .eq('id', lotId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-lots'] });
    },
  });

  return {
    ...query,
    updateOccupancy,
  };
}
