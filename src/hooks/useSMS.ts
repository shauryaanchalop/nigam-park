import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SendSMSParams {
  to: string;
  message: string;
  type?: 'alert' | 'reservation' | 'general';
}

export function useSMS() {
  const sendSMS = useMutation({
    mutationFn: async ({ to, message, type = 'general' }: SendSMSParams) => {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to, message, type },
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('SMS send error:', error);
      toast.error('Failed to send SMS notification');
    },
  });

  const sendAlertSMS = async (phone: string, alertType: string, message: string) => {
    const smsMessage = `🚨 NIGAM-Park Alert\n\nType: ${alertType}\n${message}\n\nPlease take necessary action.`;
    return sendSMS.mutateAsync({ to: phone, message: smsMessage, type: 'alert' });
  };

  const sendReservationConfirmation = async (
    phone: string,
    lotName: string,
    date: string,
    startTime: string,
    endTime: string,
    vehicleNumber: string,
    amount: number
  ) => {
    const smsMessage = `✅ NIGAM-Park Reservation Confirmed!\n\n📍 ${lotName}\n📅 ${date}\n⏰ ${startTime} - ${endTime}\n🚗 ${vehicleNumber}\n💰 ₹${amount}\n\nShow this SMS at entry. Safe travels!`;
    return sendSMS.mutateAsync({ to: phone, message: smsMessage, type: 'reservation' });
  };

  const sendReservationCancellation = async (
    phone: string,
    lotName: string,
    date: string
  ) => {
    const smsMessage = `❌ NIGAM-Park Reservation Cancelled\n\n📍 ${lotName}\n📅 ${date}\n\nYour reservation has been cancelled. Any applicable refund will be processed within 3-5 business days.`;
    return sendSMS.mutateAsync({ to: phone, message: smsMessage, type: 'reservation' });
  };

  return {
    sendSMS,
    sendAlertSMS,
    sendReservationConfirmation,
    sendReservationCancellation,
    isLoading: sendSMS.isPending,
  };
}
