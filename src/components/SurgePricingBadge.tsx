import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface SurgePricingBadgeProps {
  multiplier: number;
  isSurge: boolean;
  originalPrice: number;
  surgePrice: number;
}

export function SurgePricingBadge({ multiplier, isSurge, originalPrice, surgePrice }: SurgePricingBadgeProps) {
  const { isHindi } = useLanguage();
  
  if (!isSurge) return null;
  
  const surgePercent = Math.round((multiplier - 1) * 100);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1 animate-pulse">
            <Zap className="w-3 h-3" />
            <span>{isHindi ? `${surgePercent}% अधिक` : `+${surgePercent}%`}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {isHindi ? 'उच्च मांग मूल्य निर्धारण' : 'High Demand Pricing'}
            </p>
            <p className="text-muted-foreground mt-1">
              {isHindi 
                ? `सामान्य: ₹${originalPrice}/घंटा → वर्तमान: ₹${surgePrice}/घंटा`
                : `Normal: ₹${originalPrice}/hr → Current: ₹${surgePrice}/hr`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isHindi 
                ? 'उच्च अधिभोग के कारण कीमतें बढ़ी हैं'
                : 'Prices increased due to high occupancy'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
