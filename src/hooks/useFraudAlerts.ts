import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FraudAlert, FraudSeverity, FraudStatus } from '@/types/ai-modules';
import { useEffect, useRef } from 'react';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useAlertNotifications } from './useAlertNotifications';

export function useFraudAlerts() {
  const queryClient = useQueryClient();
  const isInitialLoad = useRef(true);
  const { playAlertSound, sendBrowserNotification, isMuted, toggleMute, notificationPermission, requestNotificationPermission } = useAlertNotifications();

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select('*')
        .neq('status', 'RESOLVED')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      isInitialLoad.current = false;
      return data as FraudAlert[];
    },
  });

  // Real-time subscription with sound and browser notification for critical alerts
  useEffect(() => {
    const channel = supabase
      .channel('fraud-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fraud_alerts',
        },
        (payload) => {
          const newAlert = payload.new as FraudAlert;
          
          // Play sound and show notifications for critical alerts
          if (newAlert.severity === 'CRITICAL' && !isInitialLoad.current) {
            playAlertSound();
            toast.error('🚨 CRITICAL FRAUD ALERT', {
              description: `${newAlert.location}: ${newAlert.description}`,
              duration: 10000,
            });
            sendBrowserNotification(
              '🚨 CRITICAL FRAUD ALERT',
              `${newAlert.location}: ${newAlert.description}`,
              `fraud-${newAlert.id}`
            );
          } else if (newAlert.severity === 'HIGH' && !isInitialLoad.current) {
            toast.warning('⚠️ High Priority Alert', {
              description: `${newAlert.location}: ${newAlert.description}`,
              duration: 5000,
            });
            sendBrowserNotification(
              '⚠️ High Priority Alert',
              `${newAlert.location}: ${newAlert.description}`,
              `fraud-${newAlert.id}`
            );
          }
          
          queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fraud_alerts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'fraud_alerts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, playAlertSound, sendBrowserNotification]);

  const createFraudAlert = useMutation({
    mutationFn: async (alert: {
      severity: FraudSeverity;
      location: string;
      description: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .insert([{
          severity: alert.severity,
          location: alert.location,
          description: alert.description,
          status: 'NEW' as FraudStatus,
          metadata: (alert.metadata || {}) as Json,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
    },
  });

  const updateFraudStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FraudStatus }) => {
      const { error } = await supabase
        .from('fraud_alerts')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
    },
  });

  return {
    alerts,
    isLoading,
    error,
    createFraudAlert,
    updateFraudStatus,
    isMuted,
    toggleMute,
    notificationPermission,
    requestNotificationPermission,
  };
}
