import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import type { Candidate } from "@/types/employer";
import type { ApplicationStatus } from "@/types/job";

const STATUS_VARIANT: Record<ApplicationStatus, "secondary" | "signal" | "success" | "destructive"> = {
  applied: "secondary",
  shortlisted: "signal",
  interview: "signal",
  hired: "success",
  rejected: "destructive",
};

export function CandidateRankRow({ candidate, rank }: { candidate: Candidate; rank: number }) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
      <span className="w-5 shrink-0 text-center font-display text-sm font-semibold text-muted-foreground">#{rank}</span>
      <Avatar className="h-9 w-9">
        <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{candidate.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {candidate.appliedFor} · {candidate.experienceYears} yrs · {candidate.location}
        </p>
      </div>
      <Badge variant={candidate.matchScore >= 85 ? "success" : "signal"} className="shrink-0">
        {candidate.matchScore}%
      </Badge>
      <Badge variant={STATUS_VARIANT[candidate.status]} className="hidden shrink-0 sm:inline-flex">
        {candidate.status}
      </Badge>
      <Button size="sm" variant="outline" className="shrink-0">
        View
      </Button>
    </div>
  );
}
