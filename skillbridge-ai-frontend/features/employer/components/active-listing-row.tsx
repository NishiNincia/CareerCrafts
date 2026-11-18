"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArchiveX, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDistance } from "@/lib/utils";
import { employerService } from "@/services/employer.service";
import { useToast } from "@/hooks/use-toast";
import { PostJobForm } from "@/features/employer/components/post-job-form";
import type { Job } from "@/types/job";
import type { MarketGig } from "@/types/gig";

export function ActiveJobRow({ job }: { job: Job }) {
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const closeJob = useMutation({
    mutationFn: () => employerService.closeJob(job.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employer", "active-jobs"] });
      toast({
        title: "Job listing closed",
        description: "Workers can no longer find or apply to this job.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Could not close job",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{job.title}</p>
          <p className="text-xs text-muted-foreground">
            {job.location}{job.distanceKm === null ? "" : ` · ${formatDistance(job.distanceKm)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="shrink-0">
            {formatCurrency(job.salaryMin)}–{formatCurrency(job.salaryMax)}
          </Badge>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={closeJob.isPending}
            onClick={() => {
              if (window.confirm(`Close "${job.title}"? It will no longer appear in worker searches.`)) {
                closeJob.mutate();
              }
            }}
          >
            <ArchiveX className="h-4 w-4" /> {closeJob.isPending ? "Closing..." : "Close"}
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit job listing</DialogTitle>
          </DialogHeader>
          <PostJobForm job={job} onCancel={() => setEditOpen(false)} onSaved={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ActiveGigRow({ gig }: { gig: MarketGig }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{gig.title}</p>
        <p className="text-xs capitalize text-muted-foreground">{gig.workMode.replace("_", " ")} · {gig.status.replace("_", " ")}</p>
      </div>
      <Badge variant={gig.status === "open" ? "signal" : "success"} className="shrink-0">
        {formatCurrency(gig.budget)}
      </Badge>
    </div>
  );
}
