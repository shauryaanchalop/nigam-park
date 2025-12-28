import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SurgePricingRule {
  id: string;
  lot_id: string | null;
  min_occupancy_percent: number;
  max_occupancy_percent: number;
  multiplier: number;
  is_active: boolean;
}

export function useSurgePricing() {
  return useQuery({
    queryKey: ['surge-pricing-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surge_pricing_rules')
        .select('*')
        .eq('is_active', true)
        .order('min_occupancy_percent', { ascending: true });
      
      if (error) throw error;
      return data as SurgePricingRule[];
    },
  });
}

export function calculateSurgePrice(
  basePrice: number,
  currentOccupancy: number,
  capacity: number,
  rules: SurgePricingRule[] | undefined,
  lotId?: string
): { price: number; multiplier: number; isSurge: boolean } {
  if (!rules || rules.length === 0 || capacity === 0) {
    return { price: basePrice, multiplier: 1, isSurge: false };
  }

  const occupancyPercent = (currentOccupancy / capacity) * 100;
  
  // Find applicable rule (prefer lot-specific rules)
  const lotSpecificRule = rules.find(
    rule => rule.lot_id === lotId &&
    occupancyPercent >= rule.min_occupancy_percent &&
    occupancyPercent < rule.max_occupancy_percent
  );
  
  const globalRule = rules.find(
    rule => rule.lot_id === null &&
    occupancyPercent >= rule.min_occupancy_percent &&
    occupancyPercent < rule.max_occupancy_percent
  );
  
  const applicableRule = lotSpecificRule || globalRule;
  
  if (!applicableRule) {
    return { price: basePrice, multiplier: 1, isSurge: false };
  }
  
  const multiplier = Number(applicableRule.multiplier);
  const surgePrice = Math.round(basePrice * multiplier);
  
  return {
    price: surgePrice,
    multiplier,
    isSurge: multiplier > 1,
  };
}
