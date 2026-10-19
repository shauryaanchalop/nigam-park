import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DEMO_LOYALTY_TRANSACTIONS, withDemoFallback } from '@/lib/demoData';

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

export const DEFAULT_LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'tier-bronze',
    name: 'Bronze',
    min_points: 0,
    discount_percentage: 5,
    icon: 'award',
    color: 'amber',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tier-silver',
    name: 'Silver',
    min_points: 500,
    discount_percentage: 10,
    icon: 'star',
    color: 'slate',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tier-gold',
    name: 'Gold',
    min_points: 1500,
    discount_percentage: 15,
    icon: 'crown',
    color: 'yellow',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tier-platinum',
    name: 'Platinum',
    min_points: 3000,
    discount_percentage: 20,
    icon: 'gem',
    color: 'purple',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export const DEFAULT_DEMO_LOYALTY_ACCOUNT: LoyaltyAccount = {
  id: 'demo-loyalty-acc-1',
  user_id: 'demo-user',
  total_points: 1250,
  lifetime_points: 1850,
  current_tier_id: 'tier-silver',
  created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  loyalty_tiers: DEFAULT_LOYALTY_TIERS[1], // Silver Tier (10% discount)
};

export function useLoyaltyTiers() {
  return useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('loyalty_tiers')
          .select('*')
          .order('min_points', { ascending: true });
        if (error || !data || data.length === 0) return DEFAULT_LOYALTY_TIERS;
        return data as LoyaltyTier[];
      } catch {
        return DEFAULT_LOYALTY_TIERS;
      }
    },
    initialData: DEFAULT_LOYALTY_TIERS,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useMyLoyaltyAccount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-loyalty-account', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_DEMO_LOYALTY_ACCOUNT;
      
      try {
        const { data, error } = await supabase
          .from('loyalty_accounts')
          .select(`
            *,
            loyalty_tiers (*)
          `)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error || !data) return DEFAULT_DEMO_LOYALTY_ACCOUNT;
        return data as LoyaltyAccount;
      } catch {
        return DEFAULT_DEMO_LOYALTY_ACCOUNT;
      }
    },
    initialData: DEFAULT_DEMO_LOYALTY_ACCOUNT,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useMyLoyaltyTransactions() {
  const { user } = useAuth();
  const { data: account } = useMyLoyaltyAccount();
  
  return useQuery({
    queryKey: ['my-loyalty-transactions', account?.id],
    queryFn: async () => {
      if (!account) return DEMO_LOYALTY_TRANSACTIONS as LoyaltyTransaction[];
      
      try {
        const { data, error } = await supabase
          .from('loyalty_transactions')
          .select('*')
          .eq('account_id', account.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error || !data || data.length === 0) {
          return DEMO_LOYALTY_TRANSACTIONS as LoyaltyTransaction[];
        }
        return withDemoFallback<LoyaltyTransaction>(data as LoyaltyTransaction[], DEMO_LOYALTY_TRANSACTIONS);
      } catch {
        return DEMO_LOYALTY_TRANSACTIONS as LoyaltyTransaction[];
      }
    },
    initialData: DEMO_LOYALTY_TRANSACTIONS as LoyaltyTransaction[],
    staleTime: 5 * 60 * 1000,
    retry: 1,
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
      const { data: initialAccount, error: accountError } = await supabase
        .from('loyalty_accounts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      let account = initialAccount;
      
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