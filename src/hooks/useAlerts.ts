import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertWithLot } from '@/types/database';
import { useEffect } from 'react';
import { z } from 'zod';

// Alert validation schema
const alertSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID').nullable(),
  alert_type: z.string().min(1).max(50, 'Alert type too long'),
  message: z.string().min(1).max(500, 'Message too long'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  is_resolved: z.boolean(),
  sensor_log_id: z.string().uuid().nullable(),
});

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
      // Validate input before database operation
      alertSchema.parse(alert);
      
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
      // Validate alertId is a valid UUID
      z.string().uuid().parse(alertId);
      
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
