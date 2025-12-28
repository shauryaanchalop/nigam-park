import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendNotificationParams {
  phone: string;
  message: string;
  type: 'sms' | 'whatsapp';
  user_id?: string;
  reservation_id?: string;
  demo_mode?: boolean;
}

export function useNotifications() {
  const sendNotification = useMutation({
    mutationFn: async (params: SendNotificationParams) => {
      const { data, error } = await supabase.functions.invoke('send-sms-notification', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (data?.demo_mode) {
        toast.success(`Demo: ${variables.type === 'whatsapp' ? 'WhatsApp' : 'SMS'} logged`, {
          description: 'Message recorded but not sent (demo mode)',
        });
      } else {
        toast.success(`${variables.type === 'whatsapp' ? 'WhatsApp' : 'SMS'} sent successfully`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to send notification: ${error.message}`);
    },
  });

  // Send parking reminder
  const sendParkingReminder = useMutation({
    mutationFn: async ({ 
      phone, 
      vehicleNumber, 
      lotName, 
      endTime,
      type = 'sms',
      userId,
      reservationId,
      demoMode = false,
    }: { 
      phone: string;
      vehicleNumber: string;
      lotName: string;
      endTime: string;
      type?: 'sms' | 'whatsapp';
      userId?: string;
      reservationId?: string;
      demoMode?: boolean;
    }) => {
      const message = `🚗 NigamPark Reminder: Your parking for ${vehicleNumber} at ${lotName} ends at ${endTime}. Please exit on time to avoid overstay charges.`;
      
      return sendNotification.mutateAsync({
        phone,
        message,
        type,
        user_id: userId,
        reservation_id: reservationId,
        demo_mode: demoMode,
      });
    },
  });

  // Send payment receipt
  const sendPaymentReceipt = useMutation({
    mutationFn: async ({ 
      phone, 
      vehicleNumber, 
      lotName, 
      amount,
      transactionId,
      type = 'sms',
      userId,
      demoMode = false,
    }: { 
      phone: string;
      vehicleNumber: string;
      lotName: string;
      amount: number;
      transactionId: string;
      type?: 'sms' | 'whatsapp';
      userId?: string;
      demoMode?: boolean;
    }) => {
      const message = `✅ NigamPark Receipt\n\n🚗 Vehicle: ${vehicleNumber}\n📍 Location: ${lotName}\n💰 Amount: ₹${amount}\n🧾 Ref: ${transactionId.slice(0, 8).toUpperCase()}\n\nThank you for using NigamPark!`;
      
      return sendNotification.mutateAsync({
        phone,
        message,
        type,
        user_id: userId,
        demo_mode: demoMode,
      });
    },
  });

  // Send reservation confirmation
  const sendReservationConfirmation = useMutation({
    mutationFn: async ({ 
      phone, 
      vehicleNumber, 
      lotName, 
      date,
      startTime,
      endTime,
      amount,
      type = 'sms',
      userId,
      reservationId,
      demoMode = false,
    }: { 
      phone: string;
      vehicleNumber: string;
      lotName: string;
      date: string;
      startTime: string;
      endTime: string;
      amount: number;
      type?: 'sms' | 'whatsapp';
      userId?: string;
      reservationId?: string;
      demoMode?: boolean;
    }) => {
      const message = `🎫 NigamPark Reservation Confirmed!\n\n🚗 ${vehicleNumber}\n📍 ${lotName}\n📅 ${date}\n⏰ ${startTime} - ${endTime}\n💰 ₹${amount}\n\nShow this message at the parking gate.`;
      
      return sendNotification.mutateAsync({
        phone,
        message,
        type,
        user_id: userId,
        reservation_id: reservationId,
        demo_mode: demoMode,
      });
    },
  });

  return {
    sendNotification,
    sendParkingReminder,
    sendPaymentReceipt,
    sendReservationConfirmation,
    isSending: sendNotification.isPending,
  };
}
