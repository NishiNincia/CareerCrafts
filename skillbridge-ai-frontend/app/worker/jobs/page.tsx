"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { MapView } from "@/components/shared/map-view";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NearbyJobCard } from "@/features/worker/components/nearby-job-card";
import { useNearbyJobs, useWorkerProfile } from "@/features/worker/hooks/use-worker-data";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchX } from "lucide-react";
import type { JobType } from "@/types/job";

export default function NearbyJobsPage() {
  const { data: jobs, isLoading } = useNearbyJobs();
  const { data: profile } = useWorkerProfile();
  const [filter, setFilter] = useState<JobType | "all">("all");

  const filtered = jobs?.filter((j) => filter === "all" || j.type === filter) ?? [];

  return (
    <div>
      <PageHeader title="Nearby Jobs" description="AI-matched full-time and part-time openings near you." />

      <Card className="mb-4">
        <CardContent className="p-3">
          {isLoading || !profile ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : (
            <MapView
              height={280}
              pins={[
                { id: "me", geo: profile.geo, label: "You are here", variant: "success", center: true },
                ...(jobs ?? []).map((j) => ({ id: j.id, geo: j.geo, label: j.title, sublabel: `${j.company} · ${j.matchScore}% match`, variant: "primary" as const })),
              ]}
            />
          )}
        </CardContent>
      </Card>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as JobType | "all")} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="full-time">Full-time</TabsTrigger>
          <TabsTrigger value="part-time">Part-time</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
          : filtered.map((job) => <NearbyJobCard key={job.id} job={job} />)}
      </div>

      {!isLoading && filtered.length === 0 && (
        <EmptyState icon={SearchX} title="No jobs match this filter" description="Try a different job type or check back soon — new roles are added daily." />
      )}
    </div>
  );
}
