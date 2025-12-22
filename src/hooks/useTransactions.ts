import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionWithLot } from '@/types/database';
import { useEffect } from 'react';

export function useTransactions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, parking_lots(*)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as TransactionWithLot[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['today-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createTransaction = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
    },
  });

  return {
    ...query,
    createTransaction,
  };
}

export function useTodayStats() {
  return useQuery({
    queryKey: ['today-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, payment_method')
        .gte('created_at', today.toISOString())
        .eq('status', 'completed');
      
      if (error) throw error;
      
      const totalRevenue = data.reduce((sum, t) => sum + t.amount, 0);
      const fastagCount = data.filter(t => t.payment_method === 'FASTag').length;
      const cashCount = data.filter(t => t.payment_method === 'Cash').length;
      const upiCount = data.filter(t => t.payment_method === 'UPI').length;
      
      return {
        totalRevenue,
        transactionCount: data.length,
        fastagCount,
        cashCount,
        upiCount,
      };
    },
    refetchInterval: 5000,
  });
}
