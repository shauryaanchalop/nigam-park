import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface AttendantShift {
  id: string;
  user_id: string;
  lot_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  parking_lots?: {
    name: string;
  };
  profiles?: {
    full_name: string | null;
  };
}

export interface AttendanceRecord {
  id: string;
  shift_id: string;
  user_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location: { lat: number; lng: number } | null;
  check_out_location: { lat: number; lng: number } | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export function useShiftTemplates() {
  return useQuery({
    queryKey: ['shift-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_templates')
        .select('*')
        .order('start_time');
      if (error) throw error;
      return data as ShiftTemplate[];
    },
  });
}

export function useAttendantShifts(lotId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['attendant-shifts', lotId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('attendant_shifts')
        .select(`
          *,
          parking_lots (name)
        `)
        .order('shift_date', { ascending: true });
      
      if (lotId) {
        query = query.eq('lot_id', lotId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AttendantShift[];
    },
    enabled: !!user,
  });
}

export function useMyShifts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-shifts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('attendant_shifts')
        .select(`
          *,
          parking_lots (name)
        `)
        .eq('user_id', user.id)
        .gte('shift_date', new Date().toISOString().split('T')[0])
        .order('shift_date', { ascending: true });
      
      if (error) throw error;
      return data as AttendantShift[];
    },
    enabled: !!user,
  });
}

export function useAttendanceRecords(shiftId?: string) {
  return useQuery({
    queryKey: ['attendance-records', shiftId],
    queryFn: async () => {
      let query = supabase
        .from('attendance_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (shiftId) {
        query = query.eq('shift_id', shiftId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AttendanceRecord[];
    },
  });
}

export function useShiftMutations() {
  const queryClient = useQueryClient();

  const createShift = useMutation({
    mutationFn: async (shift: {
      user_id: string;
      lot_id: string;
      shift_date: string;
      start_time: string;
      end_time: string;
    }) => {
      const { data, error } = await supabase
        .from('attendant_shifts')
        .insert(shift)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendant-shifts'] });
      toast.success('Shift scheduled successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create shift: ${error.message}`);
    },
  });

  const updateShiftStatus = useMutation({
    mutationFn: async ({ shiftId, status }: { shiftId: string; status: string }) => {
      const { error } = await supabase
        .from('attendant_shifts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', shiftId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendant-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
    },
  });

  const checkIn = useMutation({
    mutationFn: async ({ shiftId, location }: { shiftId: string; location?: { lat: number; lng: number } }) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('attendance_records')
        .insert({
          shift_id: shiftId,
          user_id: currentUser.id,
          check_in_time: new Date().toISOString(),
          check_in_location: location || null,
          status: 'checked_in',
        });
      if (error) throw error;

      await supabase
        .from('attendant_shifts')
        .update({ status: 'in_progress' })
        .eq('id', shiftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      toast.success('Checked in successfully');
    },
    onError: (error) => {
      toast.error(`Check-in failed: ${error.message}`);
    },
  });

  const checkOut = useMutation({
    mutationFn: async ({ recordId, location, notes }: { 
      recordId: string; 
      location?: { lat: number; lng: number };
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('attendance_records')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_location: location || null,
          status: 'completed',
          notes,
        })
        .eq('id', recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      toast.success('Checked out successfully');
    },
    onError: (error) => {
      toast.error(`Check-out failed: ${error.message}`);
    },
  });

  return { createShift, updateShiftStatus, checkIn, checkOut };
}