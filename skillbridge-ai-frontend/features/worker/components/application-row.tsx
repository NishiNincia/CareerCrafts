import { Badge } from "@/components/ui/badge";
import type { Application, ApplicationStatus } from "@/types/job";

const STATUS_VARIANT: Record<ApplicationStatus, "secondary" | "signal" | "success" | "destructive"> = {
  applied: "secondary",
  shortlisted: "signal",
  interview: "signal",
  hired: "success",
  rejected: "destructive",
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  hired: "Hired",
  rejected: "Not selected",
};

export function ApplicationRow({ application }: { application: Application }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{application.jobTitle}</p>
        <p className="text-xs text-muted-foreground">{application.company} · Applied {application.appliedAt}</p>
      </div>
      <Badge variant={STATUS_VARIANT[application.status]}>{STATUS_LABEL[application.status]}</Badge>
    </div>
  );
}
