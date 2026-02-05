"use client";

import { StarRating } from "./StarRating";

interface RatingDistribution {
  rating: number;
  count: number;
}

interface ReviewStatsProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: RatingDistribution[];
}

export function ReviewStats({ averageRating, totalReviews, ratingDistribution }: ReviewStatsProps) {
  if (totalReviews === 0) return null;

  return (
    <div className="space-y-4">
      {/* Average Rating */}
      <div className="flex items-center gap-3">
        <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
        <div>
          <StarRating value={Math.round(averageRating)} size="md" />
          <p className="text-muted-foreground mt-1 text-sm">
            {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      {ratingDistribution && ratingDistribution.length > 0 && (
        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count }) => {
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right">{rating} ★</span>
                <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-8">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
