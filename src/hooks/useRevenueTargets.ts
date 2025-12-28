import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';

export interface RevenueTarget {
  id: string;
  lot_id: string | null;
  target_type: 'daily' | 'weekly' | 'monthly';
  target_amount: number;
  target_date: string;
  created_at: string;
  created_by: string | null;
}

export interface RevenueProgress {
  daily: {
    target: number;
    actual: number;
    percentage: number;
  };
  weekly: {
    target: number;
    actual: number;
    percentage: number;
  };
  monthly: {
    target: number;
    actual: number;
    percentage: number;
  };
}

export function useRevenueTargets() {
  const queryClient = useQueryClient();

  // Get current targets and progress
  const progressQuery = useQuery({
    queryKey: ['revenue-progress'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Get targets
      const { data: targets } = await supabase
        .from('revenue_targets')
        .select('*')
        .or(`target_date.eq.${today},target_date.eq.${weekStart},target_date.eq.${monthStart}`);

      // Get actual revenue
      const { data: todayRevenue } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .eq('status', 'completed');

      const { data: weekRevenue } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', `${weekStart}T00:00:00`)
        .lte('created_at', `${weekEnd}T23:59:59`)
        .eq('status', 'completed');

      const { data: monthRevenue } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', `${monthStart}T00:00:00`)
        .lte('created_at', `${monthEnd}T23:59:59`)
        .eq('status', 'completed');

      const dailyTarget = targets?.find(t => t.target_type === 'daily')?.target_amount || 10000;
      const weeklyTarget = targets?.find(t => t.target_type === 'weekly')?.target_amount || 70000;
      const monthlyTarget = targets?.find(t => t.target_type === 'monthly')?.target_amount || 300000;

      const dailyActual = todayRevenue?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const weeklyActual = weekRevenue?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const monthlyActual = monthRevenue?.reduce((sum, t) => sum + t.amount, 0) || 0;

      return {
        daily: {
          target: dailyTarget,
          actual: dailyActual,
          percentage: Math.min((dailyActual / dailyTarget) * 100, 100),
        },
        weekly: {
          target: weeklyTarget,
          actual: weeklyActual,
          percentage: Math.min((weeklyActual / weeklyTarget) * 100, 100),
        },
        monthly: {
          target: monthlyTarget,
          actual: monthlyActual,
          percentage: Math.min((monthlyActual / monthlyTarget) * 100, 100),
        },
      };
    },
  });

  // Get trend data for charts
  const trendQuery = useQuery({
    queryKey: ['revenue-trend'],
    queryFn: async () => {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .gte('created_at', format(days[0], 'yyyy-MM-dd'))
        .eq('status', 'completed');

      return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayTransactions = (transactions || []).filter(t => 
          t.created_at.startsWith(dateStr)
        );
        return {
          date: dateStr,
          revenue: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
          transactions: dayTransactions.length,
        };
      });
    },
  });

  // Set targets
  const setTarget = useMutation({
    mutationFn: async ({ 
      targetType, 
      amount, 
      date,
      lotId 
    }: { 
      targetType: 'daily' | 'weekly' | 'monthly';
      amount: number;
      date: string;
      lotId?: string;
    }) => {
      const { data, error } = await supabase
        .from('revenue_targets')
        .upsert({
          lot_id: lotId || null,
          target_type: targetType,
          target_amount: amount,
          target_date: date,
        }, {
          onConflict: 'lot_id,target_type,target_date',
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-progress'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-targets'] });
      toast.success('Revenue target updated');
    },
    onError: (error) => {
      toast.error(`Failed to set target: ${error.message}`);
    },
  });

  return {
    progress: progressQuery.data,
    trend: trendQuery.data || [],
    isLoading: progressQuery.isLoading,
    setTarget,
  };
}
