"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Separator } from "@/components/ui/separator";
import { ReviewStats } from "./ReviewStats";
import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";
import { MessageSquare } from "lucide-react";
import type { ReviewWithUser, RatingDistribution } from "@/types";

interface ReviewSectionProps {
  productId: string;
  productSlug: string;
  initialReviews: ReviewWithUser[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution[];
}

export function ReviewSection({
  productId,
  productSlug,
  initialReviews,
  averageRating,
  totalReviews,
  ratingDistribution,
}: ReviewSectionProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState({ averageRating, totalReviews, ratingDistribution });
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  // Check if user can review this product
  useEffect(() => {
    if (!session?.user) return;

    async function checkEligibility() {
      try {
        const response = await fetch(`/api/reviews/eligibility?productId=${productId}`);
        if (response.ok) {
          const data = await response.json();
          setEligibleOrderId(data.orderId || null);
          setHasExistingReview(data.hasExistingReview || false);
        }
      } catch {
        // Silently fail - form just won't show
      }
    }

    checkEligibility();
  }, [session, productId]);

  const handleReviewCreated = (review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { id: string; name: string | null; image: string | null };
  }) => {
    const newReview: ReviewWithUser = {
      ...review,
      adminReply: null,
      adminRepliedAt: null,
    };
    setReviews((prev) => [newReview, ...prev]);
    setHasExistingReview(true);

    // Update stats optimistically
    const newTotal = stats.totalReviews + 1;
    const newAvg = (stats.averageRating * stats.totalReviews + review.rating) / newTotal;
    const newDist = stats.ratingDistribution.map((d) =>
      d.rating === review.rating ? { ...d, count: d.count + 1 } : d
    );
    setStats({ averageRating: newAvg, totalReviews: newTotal, ratingDistribution: newDist });
  };

  const showForm = session?.user && eligibleOrderId && !hasExistingReview;

  return (
    <div className="mt-16">
      <div className="mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Stats + Form */}
        <div className="space-y-6">
          <ReviewStats
            averageRating={stats.averageRating}
            totalReviews={stats.totalReviews}
            ratingDistribution={stats.ratingDistribution}
          />

          {showForm && (
            <>
              <Separator />
              <ReviewForm
                productId={productId}
                orderId={eligibleOrderId}
                onReviewCreated={handleReviewCreated}
              />
            </>
          )}
        </div>

        {/* Right: Review List */}
        <div className="lg:col-span-2">
          <ReviewList
            productSlug={productSlug}
            initialReviews={reviews}
            totalReviews={stats.totalReviews}
          />
        </div>
      </div>
    </div>
  );
}
