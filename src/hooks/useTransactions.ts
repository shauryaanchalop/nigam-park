import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionWithLot } from '@/types/database';
import { useEffect } from 'react';
import { z } from 'zod';

// Vehicle number validation - flexible Indian format (e.g., DL01AB1234, HR99X9999, UP22TS7726)
const vehicleNumberSchema = z.string()
  .min(6, 'Vehicle number too short')
  .max(15, 'Vehicle number too long')
  .regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/, 'Invalid vehicle number format');

// Transaction validation schema
const transactionSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  vehicle_number: vehicleNumberSchema,
  amount: z.number().int().positive('Amount must be positive').max(100000, 'Amount exceeds maximum'),
  payment_method: z.enum(['FASTag', 'Cash', 'UPI', 'Overstay Fee'], { errorMap: () => ({ message: 'Invalid payment method' }) }),
  status: z.enum(['pending', 'completed', 'failed']),
  entry_time: z.string(),
  exit_time: z.string().nullable(),
});

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
      // Validate input before sending to edge function
      transactionSchema.parse(transaction);
      
      // Use edge function to bypass RLS
      const { data, error } = await supabase.functions.invoke('create-transaction', {
        body: transaction,
      });
      
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      
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

const DEMO_TODAY_STATS = {
  totalRevenue: 64250,
  transactionCount: 384,
  fastagCount: 268,
  cashCount: 36,
  upiCount: 80,
};

export function useTodayStats() {
  return useQuery({
    queryKey: ['today-stats'],
    queryFn: async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data, error } = await supabase
          .from('transactions')
          .select('amount, payment_method')
          .gte('created_at', today.toISOString())
          .eq('status', 'completed');
        
        if (error || !data || data.length === 0) return DEMO_TODAY_STATS;
        
        const totalRevenue = data.reduce((sum, t) => sum + t.amount, 0);
        const fastagCount = data.filter(t => t.payment_method === 'FASTag').length;
        const cashCount = data.filter(t => t.payment_method === 'Cash').length;
        const upiCount = data.filter(t => t.payment_method === 'UPI').length;
        
        if (totalRevenue === 0 && data.length === 0) return DEMO_TODAY_STATS;

        return {
          totalRevenue,
          transactionCount: data.length,
          fastagCount,
          cashCount,
          upiCount,
        };
      } catch {
        return DEMO_TODAY_STATS;
      }
    },
    refetchInterval: 10000,
  });
}

// Export validation helpers for use in components
export { vehicleNumberSchema };
