import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ParkingLot } from '@/types/database';
import { useEffect } from 'react';
import { DEMO_PARKING_LOTS } from '@/lib/demoData';

export function useParkingLots() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['parking-lots'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('parking_lots')
          .select('*')
          .order('name');
        
        if (error) throw error;
        if (data && data.length > 0) return data as ParkingLot[];
        return DEMO_PARKING_LOTS;
      } catch (err) {
        console.warn('Using demo parking lots fallback:', err);
        return DEMO_PARKING_LOTS;
      }
    },
  });

  // Real-time subscription
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
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
    } catch {
      // Offline fallback
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [queryClient]);

  const updateOccupancy = useMutation({
    mutationFn: async ({ lotId, delta }: { lotId: string; delta: number }) => {
      try {
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
      } catch (err) {
        console.warn('Updating occupancy in local cache fallback:', err);
        // Optimistically update cache
        queryClient.setQueryData<ParkingLot[]>(['parking-lots'], (prev) => {
          if (!prev) return prev;
          return prev.map((l) =>
            l.id === lotId
              ? { ...l, current_occupancy: Math.max(0, Math.min(l.capacity, l.current_occupancy + delta)) }
              : l
          );
        });
      }
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
