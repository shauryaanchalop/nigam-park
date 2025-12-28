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

export function useViolationReports(userId?: string) {
  return useQuery({
    queryKey: ['violation-reports', userId],
    queryFn: async () => {
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
      if (error) throw error;
      return data as ViolationReport[];
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violation-reports'] });
      toast.success('Violation report submitted successfully');
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
      const { error } = await supabase
        .from('violation_reports')
        .update({ 
          status, 
          admin_notes,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violation-reports'] });
      toast.success('Report status updated');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export async function uploadViolationPhoto(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('violations')
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('violations')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
