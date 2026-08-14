import React from 'react';
import { Clock, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { predictAvailability } from '@/lib/occupancyPrediction';

interface EtaAvailabilityProps {
  capacity: number;
  currentOccupancy: number;
  distanceKm: number | null;
  className?: string;
  compact?: boolean;
}

/** Shows predicted free spaces at the driver's estimated time of arrival. */
export function EtaAvailability({
  capacity,
  currentOccupancy,
  distanceKm,
  className,
  compact,
}: EtaAvailabilityProps) {
  if (distanceKm === null) return null;

  const { etaMinutes, predictedFree, currentFree, confidence } = predictAvailability({
    capacity,
    currentOccupancy,
    distanceKm,
  });

  const delta = predictedFree - currentFree;
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const tone =
    predictedFree <= 0
      ? 'text-destructive'
      : predictedFree < capacity * 0.1
        ? 'text-warning'
        : 'text-success';

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <Badge variant="outline" className="gap-1 font-normal">
        <Clock className="w-3 h-3" />
        ETA {etaMinutes} min
      </Badge>
      <span className={cn('flex items-center gap-1 font-medium', tone)}>
        <TrendIcon className="w-3 h-3" />
        {predictedFree <= 0 ? 'Likely full on arrival' : `~${predictedFree} free on arrival`}
      </span>
      {!compact && (
        <span className="text-muted-foreground">{confidence}% confidence</span>
      )}
    </div>
  );
}
