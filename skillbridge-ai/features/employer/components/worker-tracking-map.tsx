"use client";

import { MapView } from "@/components/shared/map-view";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { TrackedWorker } from "@/types/employer";
import type { GeoPoint } from "@/types/common";

const STATUS_VARIANT: Record<TrackedWorker["status"], "signal" | "success" | "secondary"> = {
  "en-route": "signal",
  "on-site": "success",
  completed: "secondary",
};
const STATUS_LABEL: Record<TrackedWorker["status"], string> = {
  "en-route": "En route",
  "on-site": "On site",
  completed: "Completed",
};
const PIN_VARIANT: Record<TrackedWorker["status"], "signal" | "success" | "muted"> = {
  "en-route": "signal",
  "on-site": "success",
  completed: "muted",
};

export function WorkerTrackingMap({ workers, officeGeo }: { workers: TrackedWorker[]; officeGeo: GeoPoint }) {
  return (
    <div className="space-y-4">
      <MapView
        height={300}
        pins={[
          { id: "office", geo: officeGeo, label: "Your business", variant: "primary", center: true },
          ...workers.map((w) => ({
            id: w.id,
            geo: w.geo,
            label: w.name,
            sublabel: `${w.gigTitle} · ${STATUS_LABEL[w.status]}`,
            variant: PIN_VARIANT[w.status],
          })),
        ]}
      />
      <div className="space-y-2">
        {workers.map((w) => (
          <div key={w.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{getInitials(w.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{w.name}</p>
              <p className="truncate text-xs text-muted-foreground">{w.gigTitle}</p>
            </div>
            {w.status === "en-route" && (
              <span className="text-xs font-medium text-muted-foreground">{w.etaMinutes} min away</span>
            )}
            <Badge variant={STATUS_VARIANT[w.status]}>{STATUS_LABEL[w.status]}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
