import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FraudAlert, FraudSeverity, FraudStatus } from '@/types/ai-modules';
import { useEffect } from 'react';
import { Json } from '@/integrations/supabase/types';

export function useFraudAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select('*')
        .neq('status', 'RESOLVED')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FraudAlert[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('fraud-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
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
