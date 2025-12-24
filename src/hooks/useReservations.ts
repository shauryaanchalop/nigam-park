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

interface CreateReservationWithSMS extends CreateReservationData {
  lotName?: string;
  userPhone?: string;
  smsEnabled?: boolean;
}

async function sendReservationSMS(
  phone: string,
  lotName: string,
  date: string,
  startTime: string,
  endTime: string,
  vehicleNumber: string,
  amount: number
) {
  try {
    const message = `✅ NIGAM-Park Reservation Confirmed!\n\n📍 ${lotName}\n📅 ${date}\n⏰ ${startTime} - ${endTime}\n🚗 ${vehicleNumber}\n💰 ₹${amount}\n\nShow this SMS at entry. Safe travels!`;
    
    await supabase.functions.invoke('send-sms', {
      body: { to: phone, message, type: 'reservation' },
    });
  } catch (error) {
    console.error('Failed to send reservation SMS:', error);
  }
}

async function sendCancellationSMS(phone: string, lotName: string, date: string) {
  try {
    const message = `❌ NIGAM-Park Reservation Cancelled\n\n📍 ${lotName}\n📅 ${date}\n\nYour reservation has been cancelled. Any applicable refund will be processed within 3-5 business days.`;
    
    await supabase.functions.invoke('send-sms', {
      body: { to: phone, message, type: 'reservation' },
    });
  } catch (error) {
    console.error('Failed to send cancellation SMS:', error);
  }
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
    mutationFn: async (data: CreateReservationWithSMS) => {
      if (!user) throw new Error('Must be logged in to create a reservation');

      const { lotName, userPhone, smsEnabled, ...reservationData } = data;

      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert({
          ...reservationData,
          user_id: user.id,
          status: 'confirmed',
        })
        .select()
        .single();

      if (error) throw error;

      // Send SMS if enabled and phone available
      if (smsEnabled && userPhone && lotName) {
        sendReservationSMS(
          userPhone,
          lotName,
          data.reservation_date,
          data.start_time,
          data.end_time,
          data.vehicle_number,
          data.amount
        );
      }

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
    mutationFn: async ({ 
      reservationId, 
      lotName, 
      date, 
      userPhone, 
      smsEnabled 
    }: { 
      reservationId: string; 
      lotName?: string; 
      date?: string; 
      userPhone?: string; 
      smsEnabled?: boolean;
    }) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) throw error;

      // Send cancellation SMS if enabled
      if (smsEnabled && userPhone && lotName && date) {
        sendCancellationSMS(userPhone, lotName, date);
      }
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

  return {
    reservations: reservationsQuery.data ?? [],
    isLoading: reservationsQuery.isLoading,
    createReservation,
    cancelReservation,
    updateReservationStatus,
  };
}
