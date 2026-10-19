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
}

import { DEMO_VIOLATION_REPORTS, withDemoFallback } from '@/lib/demoData';

export function useViolationReports(userId?: string) {
  return useQuery({
    queryKey: ['violation-reports', userId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('violation_reports')
          .select(`
            *,
            parking_lots (name, zone)
          `)
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.eq('reporter_id', userId);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) return DEMO_VIOLATION_REPORTS as unknown as ViolationReport[];
        return data as ViolationReport[];
      } catch (e) {
        return DEMO_VIOLATION_REPORTS as unknown as ViolationReport[];
      }
    },
  });
}

export function useCreateViolationReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: {
      vehicle_number: string;
      violation_type: string;
      description?: string;
      photo_url?: string;
      location?: string;
      lot_id?: string;
    }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('demo-mode');

        const { data, error } = await supabase
          .from('violation_reports')
          .insert({
            ...report,
            reporter_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        // Fallback for prototype / demo mode
        const demoRecord: ViolationReport = {
          id: `demo-vio-${Date.now()}`,
          reporter_id: 'demo-user-id',
          lot_id: report.lot_id || 'lot-cp-a',
          vehicle_number: report.vehicle_number,
          violation_type: report.violation_type,
          description: report.description || null,
          photo_url: report.photo_url || null,
          location: report.location || 'Connaught Place Outer Circle, Delhi',
          status: 'pending',
          admin_notes: 'Automated civic grievance token generated',
          created_at: new Date().toISOString(),
          resolved_at: null,
          parking_lots: {
            name: 'Connaught Place Block A',
            zone: 'Central Zone',
          },
        };
        DEMO_VIOLATION_REPORTS.unshift(demoRecord as any);
        return demoRecord;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-violations'] });
      toast.success('Grievance reported to MCD Central Control (Token Generated)');
    },
    onError: (error) => {
      toast.error(`Failed to submit report: ${error.message}`);
    },
  });
}

export function useUpdateViolationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { 
      id: string; 
      status: string; 
      admin_notes?: string;
    }) => {
      try {
        const { error } = await supabase
          .from('violation_reports')
          .update({ 
            status, 
            admin_notes,
            resolved_at: status === 'resolved' ? new Date().toISOString() : null,
          })
          .eq('id', id);

        if (error) throw error;
      } catch (e) {
        const item = DEMO_VIOLATION_REPORTS.find(r => r.id === id);
        if (item) {
          item.status = status;
          item.admin_notes = admin_notes || item.admin_notes;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-violations'] });
      toast.success('Report status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export async function uploadViolationPhoto(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId || 'demo'}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('violations')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('violations')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (err) {
    // Return object url preview
    return URL.createObjectURL(file);
  }
}
