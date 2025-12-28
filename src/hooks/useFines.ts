import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserFine {
  id: string;
  user_id: string;
  reservation_id: string | null;
  amount: number;
  reason: string;
  status: string;
  applied_to_transaction_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface FineWithUser extends UserFine {
  profiles?: {
    full_name: string | null;
  };
  reservations?: {
    vehicle_number: string;
    parking_lots?: {
      name: string;
    };
  };
}

export function useFines() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const finesQuery = useQuery({
    queryKey: ['user-fines', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_fines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserFine[];
    },
    enabled: !!user,
  });

  const pendingFinesQuery = useQuery({
    queryKey: ['pending-fines', user?.id],
    queryFn: async () => {
      if (!user) return { fines: [], total: 0 };
      
      const { data, error } = await supabase
        .from('user_fines')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      
      const total = (data as UserFine[]).reduce((sum, fine) => sum + fine.amount, 0);
      return { fines: data as UserFine[], total };
    },
    enabled: !!user,
  });

  const resolveFine = useMutation({
    mutationFn: async ({ fineId, transactionId }: { fineId: string; transactionId?: string }) => {
      const { error } = await supabase
        .from('user_fines')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          applied_to_transaction_id: transactionId || null,
        })
        .eq('id', fineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-fines'] });
      queryClient.invalidateQueries({ queryKey: ['pending-fines'] });
      queryClient.invalidateQueries({ queryKey: ['admin-fines'] });
    },
    onError: (error) => {
      toast.error(`Failed to resolve fine: ${error.message}`);
    },
  });

  const resolveFines = useMutation({
    mutationFn: async ({ fineIds, transactionId }: { fineIds: string[]; transactionId?: string }) => {
      const { error } = await supabase
        .from('user_fines')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          applied_to_transaction_id: transactionId || null,
        })
        .in('id', fineIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-fines'] });
      queryClient.invalidateQueries({ queryKey: ['pending-fines'] });
      queryClient.invalidateQueries({ queryKey: ['admin-fines'] });
    },
    onError: (error) => {
      toast.error(`Failed to resolve fines: ${error.message}`);
    },
  });

  return {
    fines: finesQuery.data ?? [],
    pendingFines: pendingFinesQuery.data?.fines ?? [],
    pendingFinesTotal: pendingFinesQuery.data?.total ?? 0,
    isLoading: finesQuery.isLoading,
    isPendingLoading: pendingFinesQuery.isLoading,
    resolveFine,
    resolveFines,
  };
}

// Admin hook for managing all fines
export function useAdminFines() {
  const queryClient = useQueryClient();

  const allFinesQuery = useQuery({
    queryKey: ['admin-fines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_fines')
        .select(`
          *,
          reservations (
            vehicle_number,
            parking_lots (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FineWithUser[];
    },
  });

  const waiveFine = useMutation({
    mutationFn: async ({ fineId }: { fineId: string }) => {
      const { error } = await supabase
        .from('user_fines')
        .update({ 
          status: 'waived',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', fineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fines'] });
      queryClient.invalidateQueries({ queryKey: ['user-fines'] });
      queryClient.invalidateQueries({ queryKey: ['pending-fines'] });
      toast.success('Fine waived successfully');
    },
    onError: (error) => {
      toast.error(`Failed to waive fine: ${error.message}`);
    },
  });

  const resolveFine = useMutation({
    mutationFn: async ({ fineId }: { fineId: string }) => {
      const { error } = await supabase
        .from('user_fines')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', fineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fines'] });
      queryClient.invalidateQueries({ queryKey: ['user-fines'] });
      queryClient.invalidateQueries({ queryKey: ['pending-fines'] });
      toast.success('Fine marked as resolved');
    },
    onError: (error) => {
      toast.error(`Failed to resolve fine: ${error.message}`);
    },
  });

  const adjustFine = useMutation({
    mutationFn: async ({ fineId, newAmount }: { fineId: string; newAmount: number }) => {
      const { error } = await supabase
        .from('user_fines')
        .update({ amount: newAmount })
        .eq('id', fineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fines'] });
      queryClient.invalidateQueries({ queryKey: ['user-fines'] });
      queryClient.invalidateQueries({ queryKey: ['pending-fines'] });
      toast.success('Fine adjusted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to adjust fine: ${error.message}`);
    },
  });

  const fineStats = {
    total: allFinesQuery.data?.length ?? 0,
    pending: allFinesQuery.data?.filter(f => f.status === 'pending').length ?? 0,
    resolved: allFinesQuery.data?.filter(f => f.status === 'resolved').length ?? 0,
    waived: allFinesQuery.data?.filter(f => f.status === 'waived').length ?? 0,
    totalPendingAmount: allFinesQuery.data?.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0) ?? 0,
    totalCollectedAmount: allFinesQuery.data?.filter(f => f.status === 'resolved').reduce((sum, f) => sum + f.amount, 0) ?? 0,
  };

  return {
    fines: allFinesQuery.data ?? [],
    isLoading: allFinesQuery.isLoading,
    waiveFine,
    resolveFine,
    adjustFine,
    fineStats,
  };
}
