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

const DEMO_WALLET: Wallet = {
  id: 'demo-wallet-1',
  user_id: 'demo-user-id',
  balance: 1450,
  auto_debit: true,
  low_balance_threshold: 200,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function useWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const wallet = useQuery({
    queryKey: ['wallet', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Wallet | null> => {
      try {
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
          if (createError) return DEMO_WALLET;
          return (created as Wallet) || DEMO_WALLET;
        }
        return data as Wallet;
      } catch (e) {
        return DEMO_WALLET;
      }
    },
  });

  const ledger = useQuery({
    queryKey: ['wallet-ledger', userId],
    enabled: !!userId,
    queryFn: async (): Promise<WalletLedgerEntry[]> => {
      try {
        const { data, error } = await db
          .from('wallet_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error || !data || data.length === 0) return DEMO_WALLET_LEDGER;
        return data as WalletLedgerEntry[];
      } catch (e) {
        return DEMO_WALLET_LEDGER;
      }
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
      try {
        if (!userId) {
          throw new Error('demo-mode');
        }
        const { data, error } = await db.rpc('wallet_apply_transaction', {
          _amount: input.amount,
          _type: input.type,
          _description: input.description ?? null,
          _reference_id: input.referenceId ?? null,
        });
        if (error) throw error;
        return data as WalletLedgerEntry;
      } catch (e) {
        // Fallback for preview / demo mode
        const newBalance = (wallet.data?.balance ?? DEMO_WALLET.balance) + (input.type === 'debit' ? -input.amount : input.amount);
        DEMO_WALLET.balance = Math.max(0, newBalance);
        const newEntry: WalletLedgerEntry = {
          id: `demo-wt-${Date.now()}`,
          wallet_id: 'demo-wallet-1',
          user_id: userId || 'demo-user-id',
          amount: input.amount,
          transaction_type: input.type,
          description: input.description || 'Wallet transaction',
          reference_id: input.referenceId || null,
          balance_after: DEMO_WALLET.balance,
          created_at: new Date().toISOString(),
        };
        DEMO_WALLET_LEDGER.unshift(newEntry);
        return newEntry;
      }
    },
    onSuccess: invalidate,
  });

  const updateSettings = useMutation({
    mutationFn: async (patch: Partial<Pick<Wallet, 'auto_debit' | 'low_balance_threshold'>>) => {
      try {
        if (!userId) return;
        const { error } = await db.from('wallets').update(patch).eq('user_id', userId);
        if (error) throw error;
      } catch (e) {
        Object.assign(DEMO_WALLET, patch);
      }
    },
    onSuccess: invalidate,
  });

  return {
    wallet: wallet.data ?? DEMO_WALLET,
    isLoading: wallet.isLoading && !wallet.data,
    ledger: withDemoFallback<WalletLedgerEntry>(ledger.data, DEMO_WALLET_LEDGER),
    ledgerLoading: ledger.isLoading && !ledger.data,
    applyTransaction,
    updateSettings,
  };
}
