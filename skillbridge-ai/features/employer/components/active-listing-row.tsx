import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDistance } from "@/lib/utils";
import type { Job } from "@/types/job";
import type { Gig } from "@/types/gig";

export function ActiveJobRow({ job }: { job: Job }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{job.title}</p>
        <p className="text-xs text-muted-foreground">{job.location} · {formatDistance(job.distanceKm)}</p>
      </div>
      <Badge variant="secondary" className="shrink-0">
        {formatCurrency(job.salaryMin)}–{formatCurrency(job.salaryMax)}
      </Badge>
    </div>
  );
}

export function ActiveGigRow({ gig }: { gig: Gig }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{gig.businessName}</p>
        <p className="text-xs text-muted-foreground">{gig.category} · {formatDistance(gig.distanceKm)}</p>
      </div>
      <Badge variant={gig.status === "pending" ? "signal" : "success"} className="shrink-0">
        {formatCurrency(gig.payment)}
      </Badge>
    </div>
  );
}
