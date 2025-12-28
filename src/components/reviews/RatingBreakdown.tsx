import React from 'react';
import { Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RatingBreakdownProps {
  reviews: Array<{ rating: number }>;
  averageRating: number;
  totalReviews: number;
}

export function RatingBreakdown({ reviews, averageRating, totalReviews }: RatingBreakdownProps) {
  // Calculate distribution
  const distribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => r.rating === rating).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { rating, count, percentage };
  });

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-4 bg-muted/30 rounded-lg">
      {/* Average Rating */}
      <div className="flex flex-col items-center justify-center min-w-[120px]">
        <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
        <div className="flex gap-0.5 my-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= Math.round(averageRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* Rating Bars */}
      <div className="flex-1 space-y-2">
        {distribution.map(({ rating, count, percentage }) => (
          <div key={rating} className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium">{rating}</span>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
            <Progress value={percentage} className="h-2 flex-1" />
            <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}