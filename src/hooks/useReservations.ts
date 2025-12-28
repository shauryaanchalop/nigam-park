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

  // Real-time subscription for reservation updates
  useQuery({
    queryKey: ['reservations-realtime', user?.id],
    queryFn: () => null,
    enabled: !!user,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
      toast.success('Reservation confirmed!', {
        description: 'View your reservation in My Reservations',
      });
    },
    onError: (error) => {
      toast.error(`Failed to create reservation: ${error.message}`);
    },
  });

  const cancelReservation = useMutation({
    mutationFn: async ({ reservationId }: { reservationId: string }) => {
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

  const updateReservationStatus = useMutation({
    mutationFn: async ({ reservationId, status }: { reservationId: string; status: string }) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (error) => {
      toast.error(`Failed to update reservation: ${error.message}`);
    },
  });

  const checkoutByVehicle = useMutation({
    mutationFn: async ({ vehicleNumber, lotId }: { vehicleNumber: string; lotId: string }) => {
      // Find active reservation for this vehicle at this lot
      const today = new Date().toISOString().split('T')[0];
      
      const { data: reservation, error: findError } = await supabase
        .from('reservations')
        .select('*')
        .eq('vehicle_number', vehicleNumber)
        .eq('lot_id', lotId)
        .eq('reservation_date', today)
        .in('status', ['confirmed', 'checked_in'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) throw findError;
      if (!reservation) throw new Error('No active reservation found for this vehicle');

      // Mark as completed
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'completed' })
        .eq('id', reservation.id);

      if (updateError) throw updateError;
      
      return reservation;
    },
    onSuccess: (reservation) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Vehicle checked out successfully', {
        description: `Reservation for ${reservation.vehicle_number} completed`,
      });
    },
    onError: (error) => {
      toast.error(`Checkout failed: ${error.message}`);
    },
  });

  return {
    reservations: reservationsQuery.data ?? [],
    isLoading: reservationsQuery.isLoading,
    createReservation,
    cancelReservation,
    updateReservationStatus,
    checkoutByVehicle,
  };
}
