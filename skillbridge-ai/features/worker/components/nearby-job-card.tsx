"use client";

import { motion } from "framer-motion";
import { MapPin, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDistance, cn } from "@/lib/utils";
import type { Job } from "@/types/job";

export function NearbyJobCard({ job }: { job: Job }) {
  const matchTier = job.matchScore >= 85 ? "success" : job.matchScore >= 70 ? "signal" : "secondary";

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
              {job.matchScore}% match
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location} · {formatDistance(job.distanceKm)}
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
            <Button size="sm" className="flex-1">
              Apply now
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              View details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
