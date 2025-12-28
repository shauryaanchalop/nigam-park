import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subDays } from 'date-fns';

export interface AttendantPerformance {
  id: string;
  user_id: string;
  lot_id: string | null;
  performance_date: string;
  total_collections: number;
  transaction_count: number;
  avg_transaction_time: number | null;
  shift_hours: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
  };
  parking_lots?: {
    name: string;
  };
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  total_collections: number;
  transaction_count: number;
  efficiency_score: number;
  rank: number;
}

export function useAttendantPerformance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current user's performance
  const myPerformanceQuery = useQuery({
    queryKey: ['my-performance', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      // Get today's stats
      const { data: todayStats } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .eq('status', 'completed');

      // Get weekly stats from transactions
      const { data: weekStats } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', `${weekStart}T00:00:00`)
        .eq('status', 'completed');

      // Get monthly stats
      const { data: monthStats } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', `${monthStart}T00:00:00`)
        .eq('status', 'completed');

      return {
        today: {
          collections: todayStats?.reduce((sum, t) => sum + t.amount, 0) || 0,
          transactions: todayStats?.length || 0,
        },
        week: {
          collections: weekStats?.reduce((sum, t) => sum + t.amount, 0) || 0,
          transactions: weekStats?.length || 0,
        },
        month: {
          collections: monthStats?.reduce((sum, t) => sum + t.amount, 0) || 0,
          transactions: monthStats?.length || 0,
        },
      };
    },
    enabled: !!user,
  });

  // Get daily targets for attendant
  const dailyTargetQuery = useQuery({
    queryKey: ['daily-target'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('revenue_targets')
        .select('*')
        .eq('target_type', 'daily')
        .eq('target_date', today)
        .maybeSingle();

      if (error) throw error;
      return data?.target_amount || 5000; // Default target
    },
  });

  return {
    myPerformance: myPerformanceQuery.data,
    dailyTarget: dailyTargetQuery.data || 5000,
    isLoading: myPerformanceQuery.isLoading,
  };
}

// Admin hook for all attendant performance
export function useAdminAttendantPerformance() {
  const queryClient = useQueryClient();

  // Get leaderboard for current period
  const leaderboardQuery = useQuery({
    queryKey: ['attendant-leaderboard'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');

      // Get all transactions for this week with user info
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .gte('created_at', `${weekStart}T00:00:00`)
        .eq('status', 'completed');

      if (error) throw error;

      // Get all user roles that are attendants
      const { data: attendants } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          profiles:user_id (full_name)
        `)
        .eq('role', 'attendant');

      // Create leaderboard from demo data
      const leaderboard: LeaderboardEntry[] = (attendants || []).map((attendant, index) => {
        // Simulate performance data for demo
        const baseCollections = Math.random() * 15000 + 5000;
        const baseTxCount = Math.floor(Math.random() * 100 + 30);
        
        return {
          user_id: attendant.user_id,
          full_name: (attendant.profiles as any)?.full_name || 'Attendant',
          total_collections: Math.round(baseCollections),
          transaction_count: baseTxCount,
          efficiency_score: Math.round((baseTxCount / 8) * 10) / 10, // Transactions per hour
          rank: index + 1,
        };
      });

      // Sort by collections and assign ranks
      leaderboard.sort((a, b) => b.total_collections - a.total_collections);
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard;
    },
  });

  // Get performance history
  const performanceHistoryQuery = useQuery({
    queryKey: ['performance-history'],
    queryFn: async () => {
      // Get last 7 days of transaction data
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        days.push(date);
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .gte('created_at', `${days[0]}T00:00:00`)
        .eq('status', 'completed');

      const dailyData = days.map(date => {
        const dayTransactions = (transactions || []).filter(t => 
          t.created_at.startsWith(date)
        );
        return {
          date,
          collections: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
          transactions: dayTransactions.length,
        };
      });

      return dailyData;
    },
  });

  return {
    leaderboard: leaderboardQuery.data || [],
    performanceHistory: performanceHistoryQuery.data || [],
    isLoading: leaderboardQuery.isLoading,
  };
}
