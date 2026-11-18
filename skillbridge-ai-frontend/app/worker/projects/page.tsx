"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, MapPin, Navigation, Send } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MapView } from "@/components/shared/map-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { gigMarketplaceService } from "@/services/gig-marketplace.service";
import { formatCurrency } from "@/lib/utils";
import type { Project } from "@/types/gig";

function WorkerProjectCard({
  project,
  onSubmit,
  submitting,
  onLocationEvent,
  locationPending,
}: {
  project: Project;
  onSubmit: (projectId: string, notes: string, workUrl: string) => void;
  submitting: boolean;
  onLocationEvent: (projectId: string, eventType: "travel_started" | "arrived") => void;
  locationPending: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [workUrl, setWorkUrl] = useState("");
  const travelStarted = project.locationEvents.some((event) => event.type === "travel_started");
  const arrived = project.locationEvents.some((event) => event.type === "arrived");
  const directionsUrl = project.gig.geo
    ? `https://www.google.com/maps/dir/?api=1&destination=${project.gig.geo.lat},${project.gig.geo.lng}`
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{project.gig.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Client: {project.clientName} · {formatCurrency(project.gig.budget)} · Due {new Date(project.gig.deadline).toLocaleDateString()}</p>
          </div>
          <Badge variant={project.status === "completed" ? "success" : project.status === "submitted" ? "signal" : "secondary"}>
            {project.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-line text-sm text-muted-foreground">{project.gig.description}</p>

        {project.gig.workMode === "on_site" && (
          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-primary" />On-site work</p>
            <p className="text-sm text-muted-foreground">{project.gig.locationAddress}</p>
            {project.gig.geo && <MapView height={220} pins={[{ id: project.id, geo: project.gig.geo, label: project.gig.title, sublabel: project.gig.locationAddress ?? undefined }]} />}
            {directionsUrl && <a className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" href={directionsUrl} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4" />Open directions <ExternalLink className="h-3.5 w-3.5" /></a>}
            <div className="flex flex-wrap gap-2">
              {!travelStarted && project.status === "active" && (
                <Button size="sm" variant="outline" disabled={locationPending} onClick={() => onLocationEvent(project.id, "travel_started")}>
                  <Navigation className="h-4 w-4" />I started travelling
                </Button>
              )}
              {travelStarted && !arrived && project.status === "active" && (
                <Button size="sm" variant="outline" disabled={locationPending} onClick={() => onLocationEvent(project.id, "arrived")}>
                  <Check className="h-4 w-4" />I have arrived
                </Button>
              )}
              {arrived && <Badge variant="success">Arrival confirmed</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">These are manual confirmations only; the app does not track your live location.</p>
          </div>
        )}

        {project.latestSubmission?.clientFeedback && (
          <div className="rounded-xl border border-signal-300/50 bg-signal-500/5 p-3">
            <p className="text-xs font-medium">Client requested changes</p>
            <p className="mt-1 text-sm text-muted-foreground">{project.latestSubmission.clientFeedback}</p>
          </div>
        )}

        {["active", "changes_requested"].includes(project.status) && (project.gig.workMode !== "on_site" || arrived) && (
          <form
            className="space-y-3 border-t border-border pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(project.id, notes, workUrl);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor={`delivery-${project.id}`}>Work completed / delivery notes</Label>
              <Textarea id={`delivery-${project.id}`} required minLength={10} maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Summarize what you completed and how the client can review it." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`work-url-${project.id}`}>Work link (optional)</Label>
              <Input id={`work-url-${project.id}`} type="url" value={workUrl} onChange={(event) => setWorkUrl(event.target.value)} placeholder="https://" />
            </div>
            <Button type="submit" disabled={submitting || notes.trim().length < 10}><Send className="h-4 w-4" />Submit completed work</Button>
          </form>
        )}
        {project.status === "submitted" && <p className="text-sm text-muted-foreground">Your submission is with the client for review.</p>}
        {project.status === "completed" && <p className="text-sm font-medium text-success">Project approved and completed.</p>}
      </CardContent>
    </Card>
  );
}

export default function WorkerProjectsPage() {
  const queryClient = useQueryClient();
  const projects = useQuery({ queryKey: ["worker", "projects"], queryFn: gigMarketplaceService.workerProjects });
  const submit = useMutation({
    mutationFn: ({ projectId, notes, workUrl }: { projectId: string; notes: string; workUrl: string }) =>
      gigMarketplaceService.submitWork(projectId, notes, workUrl || undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["worker", "projects"] }),
  });
  const locationEvent = useMutation({
    mutationFn: ({ projectId, eventType }: { projectId: string; eventType: "travel_started" | "arrived" }) =>
      gigMarketplaceService.recordLocationEvent(projectId, eventType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["worker", "projects"] }),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="My projects" description="Accepted proposals become projects. Track on-site visits, submit completed work, and respond to client feedback here." />
      {submit.isError && <p role="alert" className="text-sm text-destructive">{submit.error.message}</p>}
      {locationEvent.isError && <p role="alert" className="text-sm text-destructive">{locationEvent.error.message}</p>}
      {projects.isLoading && Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-56 w-full rounded-xl" />)}
      {projects.isError && <p role="alert" className="text-sm text-destructive">{projects.error.message}</p>}
      {!projects.isLoading && !projects.isError && projects.data?.length === 0 && (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Accepted gig applications will appear here as active projects.</CardContent></Card>
      )}
      {projects.data?.map((project) => (
        <WorkerProjectCard
          key={project.id}
          project={project}
          submitting={submit.isPending && submit.variables?.projectId === project.id}
          locationPending={locationEvent.isPending && locationEvent.variables?.projectId === project.id}
          onSubmit={(projectId, notes, workUrl) => submit.mutate({ projectId, notes, workUrl })}
          onLocationEvent={(projectId, eventType) => locationEvent.mutate({ projectId, eventType })}
        />
      ))}
    </div>
  );
}
