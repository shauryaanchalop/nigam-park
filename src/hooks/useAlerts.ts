import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertWithLot } from '@/types/database';
import { useEffect } from 'react';

export function useAlerts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, parking_lots(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as AlertWithLot[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createAlert = useMutation({
    mutationFn: async (alert: Omit<Alert, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('alerts')
        .insert(alert)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ is_resolved: true })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const unresolvedCount = query.data?.filter(a => !a.is_resolved).length ?? 0;
  const fraudAlerts = query.data?.filter(a => a.alert_type === 'fraud' && !a.is_resolved) ?? [];

  return {
    ...query,
    createAlert,
    resolveAlert,
    unresolvedCount,
    fraudAlerts,
  };
}
