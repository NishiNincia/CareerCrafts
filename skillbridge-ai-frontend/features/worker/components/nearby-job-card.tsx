"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDistance } from "@/lib/utils";
import { jobService } from "@/services/job.service";
import type { Job } from "@/types/job";

export function NearbyJobCard({ job }: { job: Job }) {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  const matchScore = job.matchScore ?? 0;
  const matchTier = matchScore >= 85 ? "success" : matchScore >= 70 ? "signal" : "secondary";
  const applyMutation = useMutation({
    mutationFn: () => jobService.applyToJob(job.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["worker", "jobs"] }),
  });
  const hasApplied = Boolean(job.applicationStatus) || applyMutation.isSuccess;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display font-semibold">{job.title}</p>
              <p className="text-sm text-muted-foreground">{job.company}</p>
            </div>
            <Badge variant={matchTier as "success" | "signal" | "secondary"} className="shrink-0">
              {job.matchScore == null ? "Resume not analyzed" : `${matchScore}% resume match`}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location}
              {job.distanceKm === null ? "" : ` · ${formatDistance(job.distanceKm)}`}
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              {formatCurrency(job.salaryMin)}–{formatCurrency(job.salaryMax)}/mo
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.map((skill) => (
              <Badge key={skill} variant="outline" className="font-normal">
                {skill}
              </Badge>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={hasApplied || applyMutation.isPending}
              onClick={() => applyMutation.mutate()}
            >
              {applyMutation.isPending ? "Applying..." : hasApplied ? "Applied" : "Apply now"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              aria-expanded={showDetails}
              onClick={() => setShowDetails((visible) => !visible)}
            >
              {showDetails ? "Hide details" : "View details"}
            </Button>
          </div>
          {applyMutation.error instanceof Error && (
            <p role="alert" className="mt-2 text-sm text-destructive">{applyMutation.error.message}</p>
          )}
          {showDetails && (
            <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-sm">
              <p className="whitespace-pre-line">{job.description}</p>
              <p className="mt-2 text-muted-foreground">
                {job.type} · Posted {new Date(job.postedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
