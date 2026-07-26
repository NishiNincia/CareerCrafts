"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkerTrackingMap } from "@/features/employer/components/worker-tracking-map";
import { useTrackedWorkers, useEmployerProfile } from "@/features/employer/hooks/use-employer-data";

export default function TrackingPage() {
  const { data: workers, isLoading } = useTrackedWorkers();
  const { data: profile } = useEmployerProfile();

  return (
    <div>
      <PageHeader title="Live Worker Tracking" description="Real-time location and status of workers on active gigs." />
      <Card>
        <CardContent className="p-4">
          {isLoading || !profile ? (
            <Skeleton className="h-96 w-full rounded-2xl" />
          ) : (
            <WorkerTrackingMap workers={workers!} officeGeo={profile.geo} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
