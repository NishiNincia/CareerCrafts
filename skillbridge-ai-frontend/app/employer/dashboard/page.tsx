"use client";

import { NavLink } from "react-router-dom";
import { Briefcase, Zap, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CandidateRankRow } from "@/features/employer/components/candidate-rank-row";
import { HiringPipeline } from "@/features/employer/components/hiring-pipeline";
import { RevenueChart } from "@/features/employer/components/revenue-chart";
import { WorkerTrackingMap } from "@/features/employer/components/worker-tracking-map";
import { ActiveJobRow, ActiveGigRow } from "@/features/employer/components/active-listing-row";
import {
  useEmployerProfile,
  useCandidates,
  useTrackedWorkers,
  useRevenue,
  usePipeline,
  useActiveJobs,
  useActiveGigs,
} from "@/features/employer/hooks/use-employer-data";

export default function EmployerDashboardPage() {
  const { data: profile } = useEmployerProfile();
  const { data: candidates, isLoading: candidatesLoading } = useCandidates();
  const { data: workers, isLoading: workersLoading } = useTrackedWorkers();
  const { data: revenue, isLoading: revenueLoading } = useRevenue();
  const { data: pipeline, isLoading: pipelineLoading } = usePipeline();
  const { data: jobs, isLoading: jobsLoading } = useActiveJobs();
  const { data: gigs, isLoading: gigsLoading } = useActiveGigs();

  const topCandidates = [...(candidates ?? [])].sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);
  const totalRevenue = revenue?.reduce((sum, r) => sum + r.revenue, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title={`${profile?.companyName ?? "Your company"} overview`}
        description="Track hiring, live gigs, and spend in one place."
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <NavLink to="/employer/post-gig">Post a Gig</NavLink>
            </Button>
            <Button asChild>
              <NavLink to="/employer/post-job">Post a Job</NavLink>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Jobs" value={jobs ? `${jobs.length}` : "—"} icon={Briefcase} accent="bridge" />
        <StatCard label="Active Gigs" value={gigs ? `${gigs.filter((g) => g.status === "pending").length}` : "—"} icon={Zap} accent="signal" />
        <StatCard label="Candidates in Pipeline" value={candidates ? `${candidates.length}` : "—"} icon={Users} accent="bridge" />
        <StatCard label="Revenue (6 mo)" value={`₹${Math.round(totalRevenue / 1000)}k`} icon={Wallet} trend="+12% MoM" trendUp accent="success" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Spending</CardTitle>
          </CardHeader>
          <CardContent>{revenueLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : <RevenueChart data={revenue!} />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hiring Pipeline</CardTitle>
          </CardHeader>
          <CardContent>{pipelineLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : <HiringPipeline stages={pipeline!} />}</CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Live Worker Tracking</CardTitle>
            <NavLink to="/employer/tracking" className="text-sm font-medium text-primary hover:underline">
              Full map
            </NavLink>
          </CardHeader>
          <CardContent>
            {workersLoading || !profile ? (
              <Skeleton className="h-80 w-full rounded-2xl" />
            ) : (
              <WorkerTrackingMap workers={workers!} officeGeo={profile.geo} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Top Candidate Rankings</CardTitle>
            <NavLink to="/employer/candidates" className="text-sm font-medium text-primary hover:underline">
              View all
            </NavLink>
          </CardHeader>
          <CardContent>
            {candidatesLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="mb-2 h-12 w-full rounded-lg" />)
              : topCandidates.map((c, i) => <CandidateRankRow key={c.id} candidate={c} rank={i + 1} />)}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="mb-2 h-10 w-full rounded-lg" />)
              : jobs?.map((job) => <ActiveJobRow key={job.id} job={job} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Gigs</CardTitle>
          </CardHeader>
          <CardContent>
            {gigsLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="mb-2 h-10 w-full rounded-lg" />)
              : gigs?.map((gig) => <ActiveGigRow key={gig.id} gig={gig} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
