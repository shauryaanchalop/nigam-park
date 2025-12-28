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
    },
    onError: (error) => {
      toast.error(`Failed to resolve fine: ${error.message}`);
    },
  });

  return {
    fines: finesQuery.data ?? [],
    pendingFines: pendingFinesQuery.data?.fines ?? [],
    pendingFinesTotal: pendingFinesQuery.data?.total ?? 0,
    isLoading: finesQuery.isLoading,
    isPendingLoading: pendingFinesQuery.isLoading,
    resolveFine,
  };
}
