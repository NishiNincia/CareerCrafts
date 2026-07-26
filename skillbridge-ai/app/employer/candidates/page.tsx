"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidateRankRow } from "@/features/employer/components/candidate-rank-row";
import { useCandidates } from "@/features/employer/hooks/use-employer-data";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import type { ApplicationStatus } from "@/types/job";

export default function CandidatesPage() {
  const { data: candidates, isLoading } = useCandidates();
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  const filtered = [...(candidates ?? [])]
    .filter((c) => filter === "all" || c.status === filter)
    .sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div>
      <PageHeader title="Candidate Management" description="Ranked by AI match score across all your open roles." />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as ApplicationStatus | "all")} className="mb-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="applied">Applied</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="hired">Hired</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="mb-2 h-14 w-full rounded-lg" />)
          ) : filtered.length > 0 ? (
            filtered.map((c, i) => <CandidateRankRow key={c.id} candidate={c} rank={i + 1} />)
          ) : (
            <EmptyState icon={Users} title="No candidates in this stage" description="Try a different filter or check back after your job posting reaches more workers." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
