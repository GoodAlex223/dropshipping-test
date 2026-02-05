"use client";

import { StarRating } from "./StarRating";
import { Store } from "lucide-react";

interface ReviewItemProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    adminReply: string | null;
    adminRepliedAt: string | null;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ReviewItem({ review }: ReviewItemProps) {
  return (
    <div className="border-b py-5 last:border-0">
      {/* Header: name + rating + date */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{review.user.name || "Anonymous"}</span>
        <StarRating value={review.rating} size="sm" />
        <span className="text-muted-foreground text-sm">{formatDate(review.createdAt)}</span>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{review.comment}</p>
      )}

      {/* Admin Reply */}
      {review.adminReply && (
        <div className="bg-muted/50 mt-3 rounded-md p-3">
          <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium">
            <Store className="h-3 w-3" />
            Store Response
            {review.adminRepliedAt && (
              <span className="font-normal"> &middot; {formatDate(review.adminRepliedAt)}</span>
            )}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.adminReply}</p>
        </div>
      )}
    </div>
  );
}
