import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FraudAlert, FraudSeverity, FraudStatus } from '@/types/ai-modules';
import { useEffect, useRef, useCallback } from 'react';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// Inline audio function to avoid hook dependency issues
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(660, now + 0.15);
    oscillator.frequency.setValueAtTime(880, now + 0.3);
    oscillator.frequency.setValueAtTime(660, now + 0.45);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gainNode.gain.setValueAtTime(0.3, now + 0.13);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.17);
    gainNode.gain.setValueAtTime(0.3, now + 0.28);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.3);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.32);
    gainNode.gain.setValueAtTime(0.3, now + 0.43);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.45);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.47);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
    
    oscillator.start(now);
    oscillator.stop(now + 0.6);
  } catch (error) {
    console.warn('Could not play alert sound:', error);
  }
}

export function useFraudAlerts() {
  const queryClient = useQueryClient();
  const isInitialLoad = useRef(true);

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

  // Real-time subscription with sound notification for critical alerts
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
          
          // Play sound and show toast for critical alerts
          if (newAlert.severity === 'CRITICAL' && !isInitialLoad.current) {
            playAlertSound();
            toast.error('🚨 CRITICAL FRAUD ALERT', {
              description: `${newAlert.location}: ${newAlert.description}`,
              duration: 10000,
            });
          } else if (newAlert.severity === 'HIGH' && !isInitialLoad.current) {
            toast.warning('⚠️ High Priority Alert', {
              description: `${newAlert.location}: ${newAlert.description}`,
              duration: 5000,
            });
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
  }, [queryClient]);

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
  };
}
