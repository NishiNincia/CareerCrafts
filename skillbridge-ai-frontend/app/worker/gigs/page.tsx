"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, CalendarDays, MapPin, Search, Send, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { gigMarketplaceService } from "@/services/gig-marketplace.service";
import { formatCurrency } from "@/lib/utils";
import type { MarketGig } from "@/types/gig";

function MarketplaceGigCard({
  gig,
  applying,
  onApply,
}: {
  gig: MarketGig;
  applying: boolean;
  onApply: (gigId: string, proposal: string, portfolioUrl: string) => void;
}) {
  const [proposal, setProposal] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [showForm, setShowForm] = useState(false);
  const alreadyApplied = Boolean(gig.applicationId || gig.applicationStatus);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold">{gig.title}</h2>
            <p className="text-sm text-muted-foreground">Posted by {gig.creatorName}</p>
          </div>
          <Badge variant={gig.workMode === "on_site" ? "signal" : "secondary"}>
            {gig.workMode === "on_site" ? "On-site" : "Online"}
          </Badge>
        </div>

        <p className="whitespace-pre-line text-sm text-muted-foreground">{gig.description}</p>
        <div className="flex flex-wrap gap-2">
          {gig.requiredSkills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <span className="flex items-center gap-2 font-medium"><Wallet className="h-4 w-4 text-primary" />{formatCurrency(gig.budget)} {gig.currency}</span>
          <span className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" />Due {new Date(gig.deadline).toLocaleDateString()}</span>
          {gig.workMode === "on_site" && <span className="flex items-center gap-2 text-muted-foreground sm:col-span-2"><MapPin className="h-4 w-4" />Work location shared after acceptance</span>}
        </div>

        {alreadyApplied ? (
          <Badge variant={gig.applicationStatus === "rejected" ? "destructive" : "success"}>
            {gig.applicationStatus === "accepted" ? "Application accepted" : gig.applicationStatus === "rejected" ? "Application declined" : "Proposal submitted"}
          </Badge>
        ) : showForm ? (
          <form
            className="space-y-3 border-t border-border pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              onApply(gig.id, proposal, portfolioUrl);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor={`proposal-${gig.id}`}>Your proposal</Label>
              <Textarea
                id={`proposal-${gig.id}`}
                minLength={20}
                maxLength={5000}
                required
                value={proposal}
                onChange={(event) => setProposal(event.target.value)}
                placeholder="Describe your relevant experience, approach, and availability."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`portfolio-${gig.id}`}>Portfolio link (optional)</Label>
              <Input
                id={`portfolio-${gig.id}`}
                type="url"
                value={portfolioUrl}
                onChange={(event) => setPortfolioUrl(event.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={applying || proposal.trim().length < 20}>
                <Send className="h-4 w-4" /> Submit proposal
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => setShowForm(true)}><BriefcaseBusiness className="h-4 w-4" />Apply to gig</Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function GigsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("");
  const gigsQuery = useQuery({
    queryKey: ["gig-marketplace", search, skill],
    queryFn: () => gigMarketplaceService.browse(search, skill),
  });
  const applicationsQuery = useQuery({
    queryKey: ["worker", "gig-applications"],
    queryFn: gigMarketplaceService.workerApplications,
  });
  const application = useMutation({
    mutationFn: ({ gigId, proposal, portfolioUrl }: { gigId: string; proposal: string; portfolioUrl: string }) =>
      gigMarketplaceService.apply(gigId, proposal, portfolioUrl || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gig-marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["worker", "gig-applications"] });
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Browse gigs" description="Find project work, send a proposal, and track accepted projects through delivery." />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search title, description, or client" aria-label="Search gigs" />
        </div>
        <Input value={skill} onChange={(event) => setSkill(event.target.value)} placeholder="Filter by skill (e.g. plumbing)" aria-label="Filter by skill" />
      </div>

      {application.isError && <p role="alert" className="text-sm text-destructive">{application.error.message}</p>}
      {gigsQuery.isError && <p role="alert" className="text-sm text-destructive">{gigsQuery.error.message}</p>}
      {applicationsQuery.isError && <p role="alert" className="text-sm text-destructive">{applicationsQuery.error.message}</p>}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">My proposals</h2>
        {applicationsQuery.isLoading ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : applicationsQuery.data?.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {applicationsQuery.data.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.budget ? formatCurrency(item.budget) : "Budget"} · Applied {new Date(item.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={item.status === "accepted" ? "success" : item.status === "rejected" ? "destructive" : "secondary"}>{item.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Your submitted proposals and their status will appear here.</p>
        )}
      </section>

      {gigsQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-xl" />)}
        </div>
      ) : gigsQuery.data?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {gigsQuery.data.map((gig) => (
            <MarketplaceGigCard
              key={gig.id}
              gig={gig}
              applying={application.isPending && application.variables?.gigId === gig.id}
              onApply={(gigId, proposal, portfolioUrl) => application.mutate({ gigId, proposal, portfolioUrl })}
            />
          ))}
        </div>
      ) : (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No open gigs match these filters. Try another search or check back later.</CardContent></Card>
      )}
    </div>
  );
}
