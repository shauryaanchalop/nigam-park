import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns';

export type TimeRange = 'daily' | 'weekly' | 'monthly';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  transactions: number;
  fastag: number;
  cash: number;
  upi: number;
}

interface OccupancyDataPoint {
  lotName: string;
  zone: string;
  occupancy: number;
  capacity: number;
  percentage: number;
}

export function useRevenueAnalytics(timeRange: TimeRange) {
  return useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let dateFormat: string;

      switch (timeRange) {
        case 'daily':
          startDate = subDays(now, 7);
          dateFormat = 'MMM d';
          break;
        case 'weekly':
          startDate = subDays(now, 28);
          dateFormat = "'Week' w";
          break;
        case 'monthly':
          startDate = subDays(now, 180);
          dateFormat = 'MMM yyyy';
          break;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, payment_method, created_at')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const groupedData: Record<string, RevenueDataPoint> = {};

      data.forEach((transaction) => {
        const date = new Date(transaction.created_at);
        let key: string;

        switch (timeRange) {
          case 'daily':
            key = format(date, 'yyyy-MM-dd');
            break;
          case 'weekly':
            key = format(startOfWeek(date), 'yyyy-MM-dd');
            break;
          case 'monthly':
            key = format(startOfMonth(date), 'yyyy-MM');
            break;
        }

        if (!groupedData[key]) {
          groupedData[key] = {
            date: key,
            revenue: 0,
            transactions: 0,
            fastag: 0,
            cash: 0,
            upi: 0,
          };
        }

        groupedData[key].revenue += transaction.amount;
        groupedData[key].transactions += 1;

        switch (transaction.payment_method) {
          case 'FASTag':
            groupedData[key].fastag += transaction.amount;
            break;
          case 'Cash':
            groupedData[key].cash += transaction.amount;
            break;
          case 'UPI':
            groupedData[key].upi += transaction.amount;
            break;
        }
      });

      // Convert to array and format dates for display
      const result = Object.values(groupedData).map((point) => ({
        ...point,
        displayDate: format(new Date(point.date), dateFormat),
      }));

      // Sort by date
      result.sort((a, b) => a.date.localeCompare(b.date));

      return result;
    },
  });
}

export function useOccupancyAnalytics() {
  return useQuery({
    queryKey: ['occupancy-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parking_lots')
        .select('id, name, zone, current_occupancy, capacity')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      return data.map((lot) => ({
        lotName: lot.name,
        zone: lot.zone,
        occupancy: lot.current_occupancy,
        capacity: lot.capacity,
        percentage: Math.round((lot.current_occupancy / lot.capacity) * 100),
      })) as OccupancyDataPoint[];
    },
    refetchInterval: 10000,
  });
}

export function useReservationAnalytics(timeRange: TimeRange) {
  return useQuery({
    queryKey: ['reservation-analytics', timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'daily':
          startDate = subDays(now, 7);
          break;
        case 'weekly':
          startDate = subDays(now, 28);
          break;
        case 'monthly':
          startDate = subDays(now, 180);
          break;
      }

      const { data, error } = await supabase
        .from('reservations')
        .select('status, amount, reservation_date')
        .gte('reservation_date', format(startDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const stats = {
        total: data.length,
        confirmed: data.filter((r) => r.status === 'confirmed').length,
        checkedIn: data.filter((r) => r.status === 'checked_in').length,
        completed: data.filter((r) => r.status === 'completed').length,
        cancelled: data.filter((r) => r.status === 'cancelled').length,
        totalRevenue: data
          .filter((r) => ['confirmed', 'checked_in', 'completed'].includes(r.status))
          .reduce((sum, r) => sum + r.amount, 0),
      };

      return stats;
    },
  });
}

export function useSummaryStats() {
  return useQuery({
    queryKey: ['summary-stats'],
    queryFn: async () => {
      const today = new Date();
      const yesterday = subDays(today, 1);
      const lastWeek = subDays(today, 7);

      // Today's revenue
      const { data: todayData } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString())
        .eq('status', 'completed');

      // Yesterday's revenue
      const { data: yesterdayData } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', startOfDay(yesterday).toISOString())
        .lte('created_at', endOfDay(yesterday).toISOString())
        .eq('status', 'completed');

      // Last 7 days revenue
      const { data: weekData } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', startOfDay(lastWeek).toISOString())
        .eq('status', 'completed');

      const todayRevenue = todayData?.reduce((sum, t) => sum + t.amount, 0) ?? 0;
      const yesterdayRevenue = yesterdayData?.reduce((sum, t) => sum + t.amount, 0) ?? 0;
      const weekRevenue = weekData?.reduce((sum, t) => sum + t.amount, 0) ?? 0;

      const revenueChange = yesterdayRevenue > 0
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
        : 0;

      return {
        todayRevenue,
        yesterdayRevenue,
        weekRevenue,
        avgDailyRevenue: Math.round(weekRevenue / 7),
        revenueChange,
        transactionsToday: todayData?.length ?? 0,
        transactionsWeek: weekData?.length ?? 0,
      };
    },
    refetchInterval: 30000,
  });
}
