import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertWithLot } from '@/types/database';
import { useEffect } from 'react';
import { z } from 'zod';

// Alert validation schema
const alertSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID').nullable(),
  alert_type: z.enum(['fraud', 'capacity', 'maintenance']),
  message: z.string().min(1).max(500, 'Message too long'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  is_resolved: z.boolean(),
  sensor_log_id: z.string().uuid().nullable(),
});

export const DEMO_ALERTS: AlertWithLot[] = [
  {
    id: 'demo-alert-1',
    lot_id: '1',
    alert_type: 'fraud',
    message: 'Suspicious Barrier Bypass: Vehicle exited without payment gateway handshake at Gate 2',
    severity: 'critical',
    is_resolved: false,
    sensor_log_id: null,
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    parking_lots: {
      id: '1',
      name: 'Connaught Place - Block A',
      zone: 'North MCD',
      capacity: 200,
      current_occupancy: 156,
      hourly_rate: 40,
      lat: 28.6328,
      lng: 77.2197,
      status: 'active',
      has_ev_charging: true,
      created_at: new Date().toISOString(),
    }
  },
  {
    id: 'demo-alert-2',
    lot_id: '2',
    alert_type: 'fraud',
    message: 'Overstay Violation: DL 01 AB 1234 parked for > 5 hours exceeding paid slot window',
    severity: 'high',
    is_resolved: false,
    sensor_log_id: null,
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    parking_lots: {
      id: '2',
      name: 'Karol Bagh Market',
      zone: 'Central MCD',
      capacity: 150,
      current_occupancy: 87,
      hourly_rate: 30,
      lat: 28.6517,
      lng: 77.1906,
      status: 'active',
      has_ev_charging: true,
      created_at: new Date().toISOString(),
    }
  },
  {
    id: 'demo-alert-3',
    lot_id: '3',
    alert_type: 'maintenance',
    message: 'Sensor Discrepancy: Camera AI detected vehicle in Bay 14, loop detector reported idle',
    severity: 'medium',
    is_resolved: false,
    sensor_log_id: null,
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    parking_lots: {
      id: '3',
      name: 'Lajpat Nagar Central',
      zone: 'South MCD',
      capacity: 120,
      current_occupancy: 45,
      hourly_rate: 30,
      lat: 28.5677,
      lng: 77.2433,
      status: 'active',
      has_ev_charging: false,
      created_at: new Date().toISOString(),
    }
  },
  {
    id: 'demo-alert-4',
    lot_id: '4',
    alert_type: 'capacity',
    message: 'High Occupancy Threshold Exceeded: 90% capacity reached, automated dynamic surge active',
    severity: 'low',
    is_resolved: true,
    sensor_log_id: null,
    created_at: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    parking_lots: {
      id: '4',
      name: 'Chandni Chowk Multilevel',
      zone: 'City-SP MCD',
      capacity: 80,
      current_occupancy: 72,
      hourly_rate: 50,
      lat: 28.6562,
      lng: 77.2307,
      status: 'active',
      has_ev_charging: true,
      created_at: new Date().toISOString(),
    }
  }
];

export function useAlerts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('alerts')
          .select('*, parking_lots(*)')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error || !data || data.length === 0) {
          return DEMO_ALERTS;
        }
        return data as AlertWithLot[];
      } catch (err) {
        console.warn('[useAlerts] Supabase fetch failed, falling back to demo alerts:', err);
        return DEMO_ALERTS;
      }
    },
    initialData: DEMO_ALERTS,
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
      if (alertId.startsWith('demo-')) {
        queryClient.setQueryData<AlertWithLot[]>(['alerts'], (prev) =>
          prev ? prev.map(a => a.id === alertId ? { ...a, is_resolved: true } : a) : []
        );
        return;
      }

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

  const alertsList = query.data && query.data.length > 0 ? query.data : DEMO_ALERTS;
  const unresolvedCount = alertsList.filter(a => !a.is_resolved).length;
  const fraudAlerts = alertsList.filter(a => a.alert_type === 'fraud' && !a.is_resolved);

  return {
    ...query,
    data: alertsList,
    createAlert,
    resolveAlert,
    unresolvedCount,
    fraudAlerts,
  };
}
