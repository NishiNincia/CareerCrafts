import { MapPin, Clock3, Timer, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatCurrency } from "@/lib/utils";
import type { Gig } from "@/types/gig";

const STATUS_LABEL: Record<Gig["status"], string> = {
  pending: "Awaiting response",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  completed: "Completed",
};

export function GigCard({ gig }: { gig: Gig }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{gig.businessName}</p>
            <p className="text-sm text-muted-foreground">{gig.category}</p>
          </div>
          <Badge variant={gig.status === "completed" ? "success" : "secondary"}>{STATUS_LABEL[gig.status]}</Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {gig.distanceKm} km</span>
          <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {gig.etaMinutes} min</span>
          <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> {gig.durationHours} hrs</span>
          <span className="flex items-center gap-1 font-medium text-foreground"><IndianRupee className="h-3.5 w-3.5" /> {formatCurrency(gig.payment)}</span>
        </div>

        <div className="mt-3">
          <RatingStars rating={gig.employerRating} />
        </div>
      </CardContent>
    </Card>
  );
}
