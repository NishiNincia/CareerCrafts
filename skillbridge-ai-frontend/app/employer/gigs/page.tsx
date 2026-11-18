"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ExternalLink, MessageSquareText, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { gigMarketplaceService } from "@/services/gig-marketplace.service";
import { formatCurrency } from "@/lib/utils";
import type { MarketGig, Project } from "@/types/gig";

function EmployerGigCard({
  gig,
  expanded,
  onToggle,
  onDecision,
  pending,
}: {
  gig: MarketGig;
  expanded: boolean;
  onToggle: () => void;
  onDecision: (applicationId: string, decision: "accepted" | "rejected") => void;
  pending: boolean;
}) {
  const applications = useQuery({
    queryKey: ["employer", "gig-applications", gig.id],
    queryFn: () => gigMarketplaceService.employerApplications(gig.id),
    enabled: expanded,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{gig.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatCurrency(gig.budget)} · Due {new Date(gig.deadline).toLocaleDateString()} · {gig.workMode === "on_site" ? "On-site" : "Online"}
            </p>
          </div>
          <Badge variant={gig.status === "open" ? "signal" : gig.status === "completed" ? "success" : "secondary"}>
            {gig.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{gig.description}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {gig.requiredSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
        </div>
        <Button type="button" variant="outline" onClick={onToggle}>
          <ChevronDown className="h-4 w-4" /> {expanded ? "Hide proposals" : `Review proposals (${gig.applicationCount ?? 0})`}
        </Button>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {applications.isLoading && <Skeleton className="h-24 w-full rounded-lg" />}
            {applications.isError && <p role="alert" className="text-sm text-destructive">{applications.error.message}</p>}
            {!applications.isLoading && !applications.isError && applications.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No proposals have been submitted yet.</p>
            )}
            {applications.data?.map((application) => (
              <div key={application.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{application.workerName}</p>
                    <p className="text-xs text-muted-foreground">{application.workerEmail} · {new Date(application.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={application.status === "accepted" ? "success" : application.status === "rejected" ? "destructive" : "secondary"}>
                    {application.status}
                  </Badge>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm">{application.proposal}</p>
                {application.portfolioUrl && (
                  <a className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline" href={application.portfolioUrl} target="_blank" rel="noreferrer">
                    Portfolio <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {application.status === "pending" && gig.status === "open" && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" disabled={pending} onClick={() => onDecision(application.id, "accepted")}><Check className="h-4 w-4" />Accept & start project</Button>
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => onDecision(application.id, "rejected")}><X className="h-4 w-4" />Decline</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectReviewCard({
  project,
  feedback,
  onFeedbackChange,
  onReview,
  pending,
}: {
  project: Project;
  feedback: string;
  onFeedbackChange: (value: string) => void;
  onReview: (decision: "approved" | "changes_requested") => void;
  pending: boolean;
}) {
  const submission = project.latestSubmission;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div><CardTitle className="text-base">{project.gig.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Worker: {project.workerName}</p></div>
          <Badge variant={project.status === "completed" ? "success" : project.status === "submitted" ? "signal" : "secondary"}>{project.status.replace("_", " ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {submission ? (
          <>
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-xs font-medium text-muted-foreground">Delivery notes</p>
              <p className="mt-1 whitespace-pre-line text-sm">{submission.notes}</p>
              {submission.workUrl && <a className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline" href={submission.workUrl} target="_blank" rel="noreferrer">View submitted work <ExternalLink className="h-3.5 w-3.5" /></a>}
            </div>
            {submission.clientFeedback && <p className="text-sm text-muted-foreground">Your feedback: {submission.clientFeedback}</p>}
            {submission.status === "submitted" && (
              <div className="space-y-2">
                <Input value={feedback} onChange={(event) => onFeedbackChange(event.target.value)} placeholder="Feedback (required when requesting changes)" />
                <div className="flex flex-wrap gap-2">
                  <Button disabled={pending} onClick={() => onReview("approved")}><Check className="h-4 w-4" />Approve work</Button>
                  <Button variant="outline" disabled={pending || feedback.trim().length < 5} onClick={() => onReview("changes_requested")}><MessageSquareText className="h-4 w-4" />Request changes</Button>
                </div>
              </div>
            )}
          </>
        ) : <p className="text-sm text-muted-foreground">Waiting for the worker to submit the completed work.</p>}
      </CardContent>
    </Card>
  );
}

export default function EmployerGigsPage() {
  const queryClient = useQueryClient();
  const [expandedGig, setExpandedGig] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const gigs = useQuery({ queryKey: ["employer", "marketplace-gigs"], queryFn: gigMarketplaceService.employerGigs });
  const projects = useQuery({ queryKey: ["employer", "marketplace-projects"], queryFn: gigMarketplaceService.employerProjects });
  const decision = useMutation({
    mutationFn: ({ applicationId, decision }: { applicationId: string; decision: "accepted" | "rejected" }) =>
      gigMarketplaceService.decideApplication(applicationId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer", "marketplace-gigs"] });
      queryClient.invalidateQueries({ queryKey: ["employer", "gig-applications"] });
      queryClient.invalidateQueries({ queryKey: ["employer", "marketplace-projects"] });
    },
  });
  const review = useMutation({
    mutationFn: ({ projectId, submissionId, decision }: { projectId: string; submissionId: string; decision: "approved" | "changes_requested" }) =>
      gigMarketplaceService.reviewSubmission(projectId, submissionId, decision, feedback[projectId] ?? ""),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employer", "marketplace-projects"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage gigs and projects"
        description="Review worker proposals, start projects by accepting an application, then approve deliveries or request changes."
        action={<Button asChild><NavLink to="/employer/post-gig">Post a gig</NavLink></Button>}
      />
      {decision.isError && <p role="alert" className="text-sm text-destructive">{decision.error.message}</p>}
      {review.isError && <p role="alert" className="text-sm text-destructive">{review.error.message}</p>}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Your gigs</h2>
        {gigs.isLoading && <Skeleton className="h-40 w-full rounded-xl" />}
        {gigs.isError && <p role="alert" className="text-sm text-destructive">{gigs.error.message}</p>}
        {!gigs.isLoading && !gigs.isError && gigs.data?.length === 0 && <p className="text-sm text-muted-foreground">You have not posted a gig yet.</p>}
        {gigs.data?.map((gig) => (
          <EmployerGigCard
            key={gig.id}
            gig={gig}
            expanded={expandedGig === gig.id}
            onToggle={() => setExpandedGig(expandedGig === gig.id ? null : gig.id)}
            pending={decision.isPending}
            onDecision={(applicationId, nextDecision) => decision.mutate({ applicationId, decision: nextDecision })}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Active projects and submissions</h2>
        {projects.isLoading && <Skeleton className="h-40 w-full rounded-xl" />}
        {projects.isError && <p role="alert" className="text-sm text-destructive">{projects.error.message}</p>}
        {!projects.isLoading && !projects.isError && projects.data?.length === 0 && <p className="text-sm text-muted-foreground">Accepted proposals will appear here as projects.</p>}
        {projects.data?.map((project) => (
          <ProjectReviewCard
            key={project.id}
            project={project}
            feedback={feedback[project.id] ?? ""}
            onFeedbackChange={(value) => setFeedback((previous) => ({ ...previous, [project.id]: value }))}
            pending={review.isPending && review.variables?.projectId === project.id}
            onReview={(nextDecision) => project.latestSubmission && review.mutate({
              projectId: project.id,
              submissionId: project.latestSubmission.id,
              decision: nextDecision,
            })}
          />
        ))}
      </section>
    </div>
  );
}
