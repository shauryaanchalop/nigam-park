import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo } from 'react';

// Demo parked vehicles for Chandni Chowk Metro Parking
const DEMO_PARKED_VEHICLES = [
  {
    id: 'demo-1',
    vehicle_number: 'DL01AB1234',
    start_time: '09:00:00',
    end_time: '12:00:00',
    checked_in_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: 'checked_in',
    parking_lots: { name: 'Chandni Chowk Metro Parking' }
  },
  {
    id: 'demo-2',
    vehicle_number: 'DL02CD5678',
    start_time: '10:00:00',
    end_time: '13:00:00',
    checked_in_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours ago
    status: 'checked_in',
    parking_lots: { name: 'Chandni Chowk Metro Parking' }
  },
  {
    id: 'demo-3',
    vehicle_number: 'HR26DK9999',
    start_time: '08:30:00',
    end_time: '11:30:00',
    checked_in_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago (overdue)
    status: 'checked_in',
    parking_lots: { name: 'Chandni Chowk Metro Parking' }
  },
  {
    id: 'demo-4',
    vehicle_number: 'UP16EF4321',
    start_time: '11:00:00',
    end_time: '14:00:00',
    checked_in_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    status: 'checked_in',
    parking_lots: { name: 'Chandni Chowk Metro Parking' }
  },
  {
    id: 'demo-5',
    vehicle_number: 'DL03GH7890',
    start_time: '09:30:00',
    end_time: '12:30:00',
    checked_in_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours ago
    status: 'checked_in',
    parking_lots: { name: 'Chandni Chowk Metro Parking' }
  }
];

// Update demo times dynamically based on current time
const getDemoVehiclesWithCurrentTimes = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  return DEMO_PARKED_VEHICLES.map((vehicle, index) => {
    // Create realistic time slots around current time
    const startOffset = [2, 1.5, 3, 0.75, 2.5][index];
    const duration = 3; // 3 hour slots
    
    const startHour = Math.max(0, currentHour - Math.floor(startOffset));
    const endHour = Math.min(23, startHour + duration);
    
    return {
      ...vehicle,
      start_time: `${String(startHour).padStart(2, '0')}:${String(Math.floor(currentMinutes / 15) * 15).padStart(2, '0')}:00`,
      end_time: `${String(endHour).padStart(2, '0')}:${String(Math.floor(currentMinutes / 15) * 15).padStart(2, '0')}:00`,
    };
  });
};

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

  // Combine real data with demo data for Chandni Chowk
  const parkedVehicles = useMemo(() => {
    const realData = query.data ?? [];
    
    // Add demo vehicles if no real vehicles (for demo purposes)
    if (realData.length === 0) {
      return getDemoVehiclesWithCurrentTimes();
    }
    
    return realData;
  }, [query.data]);

  return {
    parkedVehicles,
    isLoading: query.isLoading,
  };
}
