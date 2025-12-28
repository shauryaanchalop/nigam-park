import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAlertNotifications } from '@/hooks/useAlertNotifications';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface FraudAlert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  description: string;
  status: string;
  created_at: string;
}

export function useFraudAlertsRealtime() {
  const { playAlertSound, sendBrowserNotification, isMuted, notificationPermission } = useAlertNotifications();
  const queryClient = useQueryClient();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Mark initial load as complete after a short delay
    const timer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 2000);

    const channel = supabase
      .channel('fraud-alerts-realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fraud_alerts',
        },
        (payload) => {
          const newAlert = payload.new as FraudAlert;
          
          // Skip notifications during initial load
          if (isInitialLoad.current) return;

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });

          // Handle based on severity
          if (newAlert.severity === 'CRITICAL') {
            // Play urgent alert sound
            playAlertSound();
            playAlertSound(); // Double beep for critical
            
            // Show toast
            toast.error('🚨 CRITICAL FRAUD ALERT', {
              description: `${newAlert.location}: ${newAlert.description}`,
              duration: 15000,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.href = '/fraud-hunter';
                },
              },
            });

            // Send browser notification
            sendBrowserNotification(
              '🚨 CRITICAL FRAUD ALERT',
              `${newAlert.location}: ${newAlert.description}`,
              `fraud-alert-${newAlert.id}`
            );

          } else if (newAlert.severity === 'HIGH') {
            // Play alert sound
            playAlertSound();
            
            // Show toast
            toast.warning('⚠️ High Priority Fraud Alert', {
              description: `${newAlert.location}: ${newAlert.description}`,
              duration: 10000,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.href = '/fraud-hunter';
                },
              },
            });

            // Send browser notification
            sendBrowserNotification(
              '⚠️ High Priority Alert',
              `${newAlert.location}: ${newAlert.description}`,
              `fraud-alert-${newAlert.id}`
            );

          } else if (newAlert.severity === 'MEDIUM') {
            // Just show toast for medium alerts
            toast.info('Fraud Alert', {
              description: `${newAlert.location}: ${newAlert.description}`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to fraud alerts realtime channel');
        }
      });

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [playAlertSound, sendBrowserNotification, queryClient]);

  return { isMuted, notificationPermission };
}
