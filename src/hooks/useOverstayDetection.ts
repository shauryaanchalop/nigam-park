import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ANPRDetection {
  id: string;
  lot_id: string;
  camera_id: string | null;
  vehicle_number: string;
  detection_type: string;
  confidence_score: number;
  image_url: string | null;
  detected_at: string;
  processed: boolean;
  parking_lots?: {
    name: string;
  };
}

export interface OverstayAlert {
  id: string;
  lot_id: string;
  vehicle_number: string;
  entry_time: string;
  expected_exit_time: string | null;
  overstay_minutes: number;
  status: string;
  fine_id: string | null;
  created_at: string;
  resolved_at: string | null;
  parking_lots?: {
    name: string;
  };
}

export function useANPRDetections(lotId?: string) {
  return useQuery({
    queryKey: ['anpr-detections', lotId],
    queryFn: async () => {
      let query = supabase
        .from('anpr_detections')
        .select(`
          *,
          parking_lots (name)
        `)
        .order('detected_at', { ascending: false })
        .limit(100);
      
      if (lotId) {
        query = query.eq('lot_id', lotId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ANPRDetection[];
    },
  });
}

export function useOverstayAlerts(status?: string) {
  return useQuery({
    queryKey: ['overstay-alerts', status],
    queryFn: async () => {
      let query = supabase
        .from('overstay_alerts')
        .select(`
          *,
          parking_lots (name)
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as OverstayAlert[];
    },
  });
}

export function useOverstayStats() {
  const { data: alerts } = useOverstayAlerts();
  
  return {
    total: alerts?.length ?? 0,
    active: alerts?.filter(a => a.status === 'active').length ?? 0,
    resolved: alerts?.filter(a => a.status === 'resolved').length ?? 0,
    totalOverstayMinutes: alerts?.reduce((sum, a) => sum + a.overstay_minutes, 0) ?? 0,
  };
}

export function useOverstayMutations() {
  const queryClient = useQueryClient();

  const simulateDetection = useMutation({
    mutationFn: async ({ lotId, vehicleNumber, detectionType }: {
      lotId: string;
      vehicleNumber: string;
      detectionType: 'entry' | 'exit';
    }) => {
      const { data, error } = await supabase
        .from('anpr_detections')
        .insert({
          lot_id: lotId,
          vehicle_number: vehicleNumber.toUpperCase(),
          detection_type: detectionType,
          confidence_score: 0.85 + Math.random() * 0.15,
          detected_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anpr-detections'] });
      toast.success('Vehicle detection recorded');
    },
    onError: (error) => {
      toast.error(`Detection failed: ${error.message}`);
    },
  });

  const createOverstayAlert = useMutation({
    mutationFn: async ({ lotId, vehicleNumber, entryTime, overstayMinutes }: {
      lotId: string;
      vehicleNumber: string;
      entryTime: string;
      overstayMinutes: number;
    }) => {
      const { data, error } = await supabase
        .from('overstay_alerts')
        .insert({
          lot_id: lotId,
          vehicle_number: vehicleNumber.toUpperCase(),
          entry_time: entryTime,
          overstay_minutes: overstayMinutes,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overstay-alerts'] });
      toast.warning('Overstay alert created');
    },
  });

  const resolveOverstayAlert = useMutation({
    mutationFn: async ({ alertId, fineId }: { alertId: string; fineId?: string }) => {
      const { error } = await supabase
        .from('overstay_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          fine_id: fineId || null,
        })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overstay-alerts'] });
      toast.success('Overstay alert resolved');
    },
  });

  return { simulateDetection, createOverstayAlert, resolveOverstayAlert };
}