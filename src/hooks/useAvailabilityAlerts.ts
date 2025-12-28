import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAlertNotifications } from './useAlertNotifications';

interface AvailabilitySubscription {
  id: string;
  user_id: string;
  lot_id: string;
  notify_when_available: boolean;
  threshold_percent: number;
  is_active: boolean;
  last_notified_at: string | null;
  created_at: string;
}

interface ParkingLotChange {
  id: string;
  name: string;
  current_occupancy: number;
  capacity: number;
}

export function useAvailabilityAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { playAlertSound, sendBrowserNotification, notificationPermission, requestNotificationPermission } = useAlertNotifications();
  const [watchedLots, setWatchedLots] = useState<Set<string>>(new Set());

  // Fetch user's subscriptions
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['availability-subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('availability_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as AvailabilitySubscription[];
    },
    enabled: !!user,
  });

  // Subscribe to a lot for availability alerts
  const subscribeLot = useMutation({
    mutationFn: async ({ lotId, thresholdPercent = 90 }: { lotId: string; thresholdPercent?: number }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('availability_subscriptions')
        .upsert({
          user_id: user.id,
          lot_id: lotId,
          threshold_percent: thresholdPercent,
          is_active: true,
          notify_when_available: true,
        }, {
          onConflict: 'user_id,lot_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-subscriptions'] });
    },
  });

  // Unsubscribe from a lot
  const unsubscribeLot = useMutation({
    mutationFn: async (lotId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('availability_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('lot_id', lotId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-subscriptions'] });
    },
  });

  // Listen for realtime parking lot changes
  useEffect(() => {
    if (!subscriptions || subscriptions.length === 0) return;

    const subscribedLotIds = subscriptions.map(s => s.lot_id);
    setWatchedLots(new Set(subscribedLotIds));

    const channel = supabase
      .channel('availability-alerts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parking_lots',
        },
        async (payload) => {
          const lot = payload.new as ParkingLotChange;
          const oldLot = payload.old as ParkingLotChange;
          
          // Check if this lot is subscribed
          const subscription = subscriptions.find(s => s.lot_id === lot.id);
          if (!subscription) return;

          const oldOccupancyPercent = (oldLot.current_occupancy / lot.capacity) * 100;
          const newOccupancyPercent = (lot.current_occupancy / lot.capacity) * 100;
          
          // Check if occupancy dropped below threshold (spot became available)
          if (oldOccupancyPercent >= subscription.threshold_percent && 
              newOccupancyPercent < subscription.threshold_percent) {
            const availableSpots = lot.capacity - lot.current_occupancy;
            
            // Play sound and send notification
            playAlertSound();
            sendBrowserNotification(
              '🅿️ Spot Available!',
              `${lot.name} now has ${availableSpots} spot${availableSpots > 1 ? 's' : ''} available!`,
              `availability-${lot.id}`
            );
            
            // Update last notified time
            await supabase
              .from('availability_subscriptions')
              .update({ last_notified_at: new Date().toISOString() })
              .eq('id', subscription.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subscriptions, playAlertSound, sendBrowserNotification]);

  const isSubscribed = useCallback((lotId: string) => {
    return watchedLots.has(lotId);
  }, [watchedLots]);

  return {
    subscriptions,
    isLoading,
    subscribeLot,
    unsubscribeLot,
    isSubscribed,
    notificationPermission,
    requestNotificationPermission,
  };
}
