import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateReservationData {
  lot_id: string;
  vehicle_number: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  amount: number;
}

export function useReservations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reservationsQuery = useQuery({
    queryKey: ['reservations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          parking_lots (
            name,
            zone
          )
        `)
        .eq('user_id', user.id)
        .order('reservation_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createReservation = useMutation({
    mutationFn: async (data: CreateReservationData) => {
      if (!user) throw new Error('Must be logged in to create a reservation');

      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert({
          ...data,
          user_id: user.id,
          status: 'confirmed',
        })
        .select()
        .single();

      if (error) throw error;
      return reservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reservation confirmed!');
    },
    onError: (error) => {
      toast.error(`Failed to create reservation: ${error.message}`);
    },
  });

  const cancelReservation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reservation cancelled');
    },
    onError: (error) => {
      toast.error(`Failed to cancel reservation: ${error.message}`);
    },
  });

  return {
    reservations: reservationsQuery.data ?? [],
    isLoading: reservationsQuery.isLoading,
    createReservation,
    cancelReservation,
  };
}
