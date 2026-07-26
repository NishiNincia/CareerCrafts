import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${rating} out of 5`}>
      <Star size={size} className="fill-signal-400 text-signal-400" />
      <span className="text-xs font-medium">{rating.toFixed(1)}</span>
    </span>
  );
}
