import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/shared/rating-stars";
import { getInitials } from "@/lib/utils";
import type { Review } from "@/types/employer";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="flex gap-3 p-4">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback>{getInitials(review.authorName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{review.authorName}</p>
            <span className="text-xs text-muted-foreground">{review.date}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <RatingStars rating={review.rating} />
            <span className="text-xs text-muted-foreground">· {review.jobTitle}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
        </div>
      </CardContent>
    </Card>
  );
}
