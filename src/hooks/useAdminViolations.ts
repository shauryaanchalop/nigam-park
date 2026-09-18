import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEMO_VIOLATION_REPORTS } from '@/lib/demoData';

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
      try {
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
        if (error || !data || data.length === 0) {
          const fallback = status && status !== 'all'
            ? DEMO_VIOLATION_REPORTS.filter((v) => v.status === status)
            : DEMO_VIOLATION_REPORTS;
          return fallback as ViolationReport[];
        }
        return data as ViolationReport[];
      } catch (err) {
        console.warn('Falling back to demo violation reports:', err);
        const fallback = status && status !== 'all'
          ? DEMO_VIOLATION_REPORTS.filter((v) => v.status === status)
          : DEMO_VIOLATION_REPORTS;
        return fallback as ViolationReport[];
      }
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
      // Demo mock support: if demo record, simulate success immediately
      if (id.startsWith('demo-')) {
        return { id, status, admin_notes };
      }

      try {
        // Update the violation report in Supabase
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
      } catch (err) {
        console.warn('Supabase update failed, continuing with cache update:', err);
      }

      return { id, status, admin_notes };
    },
    onSuccess: ({ id, status, admin_notes }) => {
      // Update in-memory demo records so state persists across tab switches
      const demoItem = DEMO_VIOLATION_REPORTS.find((v) => v.id === id);
      if (demoItem) {
        demoItem.status = status;
        demoItem.admin_notes = admin_notes ?? demoItem.admin_notes;
        demoItem.resolved_at = ['resolved', 'rejected', 'action_taken'].includes(status)
          ? new Date().toISOString()
          : null;
      }

      // Optimistically update React Query cache for instant UI feedback
      queryClient.setQueriesData<ViolationReport[]>({ queryKey: ['admin-violations'] }, (old) => {
        if (!old) return old;
        return old.map((v) =>
          v.id === id
            ? {
                ...v,
                status,
                admin_notes: admin_notes ?? v.admin_notes,
                resolved_at: ['resolved', 'rejected', 'action_taken'].includes(status)
                  ? new Date().toISOString()
                  : null,
              }
            : v
        );
      });

      queryClient.invalidateQueries({ queryKey: ['admin-violations'] });
      queryClient.invalidateQueries({ queryKey: ['violation-stats'] });
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
      let reports: { status: string }[] = [];
      try {
        const { data, error } = await supabase
          .from('violation_reports')
          .select('status');

        if (!error && data && data.length > 0) {
          reports = data;
        } else {
          reports = DEMO_VIOLATION_REPORTS;
        }
      } catch {
        reports = DEMO_VIOLATION_REPORTS;
      }

      const stats = {
        total: reports.length,
        pending: reports.filter((v) => v.status === 'pending').length,
        reviewing: reports.filter((v) => v.status === 'reviewing').length,
        resolved: reports.filter((v) => v.status === 'resolved').length,
        rejected: reports.filter((v) => v.status === 'rejected').length,
        action_taken: reports.filter((v) => v.status === 'action_taken').length,
      };

      return stats;
    },
  });
}

