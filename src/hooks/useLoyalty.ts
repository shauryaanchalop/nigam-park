import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LoyaltyTier {
  id: string;
  name: string;
  min_points: number;
  discount_percentage: number;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface LoyaltyAccount {
  id: string;
  user_id: string;
  total_points: number;
  lifetime_points: number;
  current_tier_id: string | null;
  created_at: string;
  updated_at: string;
  loyalty_tiers?: LoyaltyTier;
}

export interface LoyaltyTransaction {
  id: string;
  account_id: string;
  points: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export function useLoyaltyTiers() {
  return useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('min_points', { ascending: true });
      if (error) throw error;
      return data as LoyaltyTier[];
    },
  });
}

export function useMyLoyaltyAccount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-loyalty-account', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('loyalty_accounts')
        .select(`
          *,
          loyalty_tiers (*)
        `)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as LoyaltyAccount | null;
    },
    enabled: !!user,
  });
}

export function useMyLoyaltyTransactions() {
  const { user } = useAuth();
  const { data: account } = useMyLoyaltyAccount();
  
  return useQuery({
    queryKey: ['my-loyalty-transactions', account?.id],
    queryFn: async () => {
      if (!account) return [];
      
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
    enabled: !!account,
  });
}

export function useAllLoyaltyAccounts() {
  return useQuery({
    queryKey: ['all-loyalty-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_accounts')
        .select(`
          *,
          loyalty_tiers (*)
        `)
        .order('total_points', { ascending: false });
      
      if (error) throw error;
      return data as LoyaltyAccount[];
    },
  });
}

export function useLoyaltyMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const awardPoints = useMutation({
    mutationFn: async ({ userId, points, description, referenceId }: {
      userId: string;
      points: number;
      description: string;
      referenceId?: string;
    }) => {
      // Get or create loyalty account
      let { data: account, error: accountError } = await supabase
        .from('loyalty_accounts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!account) {
        const { data: newAccount, error: createError } = await supabase
          .from('loyalty_accounts')
          .insert({ user_id: userId })
          .select()
          .single();
        if (createError) throw createError;
        account = newAccount;
      }

      // Add transaction
      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert({
          account_id: account.id,
          points,
          transaction_type: points > 0 ? 'earn' : 'redeem',
          description,
          reference_id: referenceId || null,
        });
      if (txError) throw txError;

      // Update account totals
      const newTotal = account.total_points + points;
      const newLifetime = points > 0 ? account.lifetime_points + points : account.lifetime_points;

      // Determine new tier
      const { data: tiers } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .lte('min_points', newLifetime)
        .order('min_points', { ascending: false })
        .limit(1);

      const { error: updateError } = await supabase
        .from('loyalty_accounts')
        .update({
          total_points: newTotal,
          lifetime_points: newLifetime,
          current_tier_id: tiers?.[0]?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-loyalty-account'] });
      queryClient.invalidateQueries({ queryKey: ['my-loyalty-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all-loyalty-accounts'] });
      toast.success('Points updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update points: ${error.message}`);
    },
  });

  return { awardPoints };
}