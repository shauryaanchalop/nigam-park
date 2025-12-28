import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ViolationReport {
  id: string;
  reporter_id: string;
  lot_id: string | null;
  vehicle_number: string;
  violation_type: string;
  description: string | null;
  photo_url: string | null;
  location: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  parking_lots?: {
    name: string;
    zone: string;
  };
  profiles?: {
    full_name: string | null;
  };
}

export function useAdminViolations(status?: string) {
  return useQuery({
    queryKey: ['admin-violations', status],
    queryFn: async () => {
      let query = supabase
        .from('violation_reports')
        .select(`
          *,
          parking_lots (name, zone)
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ViolationReport[];
    },
  });
}

export function useUpdateViolationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      admin_notes,
      sendNotification = true,
    }: { 
      id: string; 
      status: string; 
      admin_notes?: string;
      sendNotification?: boolean;
    }) => {
      // Update the violation report
      const { error } = await supabase
        .from('violation_reports')
        .update({ 
          status, 
          admin_notes,
          resolved_at: ['resolved', 'rejected', 'action_taken'].includes(status) 
            ? new Date().toISOString() 
            : null,
        })
        .eq('id', id);

      if (error) throw error;

      // Send notification if enabled
      if (sendNotification) {
        try {
          await supabase.functions.invoke('send-violation-notification', {
            body: { violation_id: id, new_status: status, admin_notes },
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't fail the update if notification fails
        }
      }

      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-violations'] });
      toast.success('Violation status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useViolationStats() {
  return useQuery({
    queryKey: ['violation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('violation_reports')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(v => v.status === 'pending').length,
        reviewing: data.filter(v => v.status === 'reviewing').length,
        resolved: data.filter(v => v.status === 'resolved').length,
        rejected: data.filter(v => v.status === 'rejected').length,
        action_taken: data.filter(v => v.status === 'action_taken').length,
      };

      return stats;
    },
  });
}
