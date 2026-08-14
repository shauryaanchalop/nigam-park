import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_WALLET_LEDGER, withDemoFallback } from '@/lib/demoData';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  auto_debit: boolean;
  low_balance_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface WalletLedgerEntry {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  transaction_type: 'topup' | 'debit' | 'refund' | 'bonus';
  description: string | null;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}

const db = supabase as any;

export function useWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const wallet = useQuery({
    queryKey: ['wallet', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Wallet | null> => {
      const { data, error } = await db
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;

      if (!data) {
        const { data: created, error: createError } = await db
          .from('wallets')
          .insert({ user_id: userId })
          .select('*')
          .maybeSingle();
        if (createError) return null;
        return created as Wallet;
      }
      return data as Wallet;
    },
  });

  const ledger = useQuery({
    queryKey: ['wallet-ledger', userId],
    enabled: !!userId,
    queryFn: async (): Promise<WalletLedgerEntry[]> => {
      const { data, error } = await db
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as WalletLedgerEntry[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
    queryClient.invalidateQueries({ queryKey: ['wallet-ledger', userId] });
  };

  const applyTransaction = useMutation({
    mutationFn: async (input: {
      amount: number;
      type: WalletLedgerEntry['transaction_type'];
      description?: string;
      referenceId?: string | null;
    }) => {
      const { data, error } = await db.rpc('wallet_apply_transaction', {
        _amount: input.amount,
        _type: input.type,
        _description: input.description ?? null,
        _reference_id: input.referenceId ?? null,
      });
      if (error) throw new Error(error.message);
      return data as WalletLedgerEntry;
    },
    onSuccess: invalidate,
  });

  const updateSettings = useMutation({
    mutationFn: async (patch: Partial<Pick<Wallet, 'auto_debit' | 'low_balance_threshold'>>) => {
      const { error } = await db.from('wallets').update(patch).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    wallet: wallet.data ?? null,
    isLoading: wallet.isLoading,
    ledger: withDemoFallback<WalletLedgerEntry>(ledger.data, DEMO_WALLET_LEDGER),
    ledgerLoading: ledger.isLoading,
    applyTransaction,
    updateSettings,
  };
}
