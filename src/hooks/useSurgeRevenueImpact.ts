import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface SurgeRevenueData {
  date: string;
  actualRevenue: number;
  baseRevenue: number;
  surgeRevenue: number;
  transactionCount: number;
}

export function useSurgeRevenueImpact(days: number = 30) {
  return useQuery({
    queryKey: ['surge-revenue-impact', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      
      // Fetch transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('amount, created_at, lot_id')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');
      
      if (txError) throw txError;

      // Fetch parking lots for base rates
      const { data: lots, error: lotsError } = await supabase
        .from('parking_lots')
        .select('id, hourly_rate');
      
      if (lotsError) throw lotsError;

      // Fetch surge pricing rules
      const { data: surgeRules, error: surgeError } = await supabase
        .from('surge_pricing_rules')
        .select('*')
        .eq('is_active', true);
      
      if (surgeError) throw surgeError;

      const lotRates = new Map(lots?.map(l => [l.id, l.hourly_rate]) || []);
      
      // Group by date
      const dailyData = new Map<string, SurgeRevenueData>();
      
      transactions?.forEach(tx => {
        const date = format(new Date(tx.created_at), 'yyyy-MM-dd');
        const baseRate = lotRates.get(tx.lot_id) || 20;
        const actualAmount = Number(tx.amount);
        
        // Estimate base revenue (assuming 1 hour average parking)
        const estimatedBaseAmount = baseRate;
        const surgeAmount = Math.max(0, actualAmount - estimatedBaseAmount);
        
        const existing = dailyData.get(date) || {
          date,
          actualRevenue: 0,
          baseRevenue: 0,
          surgeRevenue: 0,
          transactionCount: 0,
        };
        
        dailyData.set(date, {
          date,
          actualRevenue: existing.actualRevenue + actualAmount,
          baseRevenue: existing.baseRevenue + estimatedBaseAmount,
          surgeRevenue: existing.surgeRevenue + surgeAmount,
          transactionCount: existing.transactionCount + 1,
        });
      });

      const sortedData = Array.from(dailyData.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculate totals
      const totals = sortedData.reduce(
        (acc, day) => ({
          actualRevenue: acc.actualRevenue + day.actualRevenue,
          baseRevenue: acc.baseRevenue + day.baseRevenue,
          surgeRevenue: acc.surgeRevenue + day.surgeRevenue,
          transactionCount: acc.transactionCount + day.transactionCount,
        }),
        { actualRevenue: 0, baseRevenue: 0, surgeRevenue: 0, transactionCount: 0 }
      );

      const surgePercentage = totals.baseRevenue > 0 
        ? ((totals.surgeRevenue / totals.baseRevenue) * 100).toFixed(1)
        : '0';

      return {
        dailyData: sortedData,
        totals,
        surgePercentage,
        avgSurgeMultiplier: totals.baseRevenue > 0 
          ? (totals.actualRevenue / totals.baseRevenue).toFixed(2)
          : '1.00',
        activeSurgeRules: surgeRules?.length || 0,
      };
    },
    refetchInterval: 60000,
  });
}
