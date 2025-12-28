import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingBadgeProps {
  rating: number | null;
  reviewCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function RatingBadge({ 
  rating, 
  reviewCount = 0, 
  showCount = true,
  size = 'sm',
  className 
}: RatingBadgeProps) {
  if (rating === null || rating === 0) {
    return (
      <div className={cn(
        "flex items-center gap-1 text-muted-foreground",
        size === 'sm' ? 'text-xs' : 'text-sm',
        className
      )}>
        <Star className={cn(
          "text-muted-foreground/50",
          size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
        )} />
        <span>No ratings</span>
      </div>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-500';
    if (rating >= 4) return 'text-green-400';
    if (rating >= 3) return 'text-yellow-500';
    if (rating >= 2) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={cn(
      "flex items-center gap-1",
      size === 'sm' ? 'text-xs' : 'text-sm',
      className
    )}>
      <Star className={cn(
        "fill-current",
        getRatingColor(rating),
        size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
      )} />
      <span className={cn("font-medium", getRatingColor(rating))}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount > 0 && (
        <span className="text-muted-foreground">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
