"use client";

import { Briefcase, MapPin, UserRound, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { MapView } from "@/components/shared/map-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeScoreCard } from "@/features/worker/components/resume-score-card";
import { NearbyJobCard } from "@/features/worker/components/nearby-job-card";
import { SchemeCard } from "@/features/worker/components/scheme-card";
import { ApplicationRow } from "@/features/worker/components/application-row";
import {
  useWorkerProfile,
  useNearbyJobs,
  useSchemes,
  useApplications,
} from "@/features/worker/hooks/use-worker-data";
import { useLearningRoadmap } from "@/features/worker/hooks/use-learning-roadmap";
import { useIncomingGig } from "@/features/worker/hooks/use-incoming-gig";
import { NavLink } from "react-router-dom";

export default function WorkerDashboardPage() {
  const { data: profile, isLoading: profileLoading } = useWorkerProfile();
  const { data: jobs, isLoading: jobsLoading } = useNearbyJobs();
  const { data: roadmap, isLoading: roadmapLoading } = useLearningRoadmap();
  const { data: schemes, isLoading: schemesLoading } = useSchemes();
  const { data: applications, isLoading: applicationsLoading } = useApplications();
  const { simulate } = useIncomingGig();

  const bestMatch = jobs?.[0];

  return (
    <div>
      <PageHeader
        title={`Welcome back${profile ? `, ${profile.name.split(" ")[0]}` : ""}`}
        description="Here's what's happening with your job search today."
        action={
          <Button variant="signal" onClick={simulate}>
            <Zap className="h-4 w-4" /> Simulate incoming gig
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Best Job Match" value={bestMatch ? `${bestMatch.matchScore}%` : "—"} icon={Briefcase} accent="bridge" />
        <StatCard label="Nearby Jobs" value={jobs ? `${jobs.length} open` : "—"} icon={MapPin} accent="signal" />
        <StatCard label="Roadmap Topics" value={roadmap ? `${roadmap.modules.length}` : "—"} icon={Zap} accent="success" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {profileLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : profile?.resume && <ResumeScoreCard score={profile.resume.metrics.resumeScore} />}
        </div>
        <div className="lg:col-span-1">
          {profileLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : profile ? (
            <Card className="h-full">
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-primary" /> Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4 text-sm">
                <p className="font-medium">{profile.name}</p>
                <p className="text-muted-foreground">{profile.email}</p>
                <p className="text-xs capitalize text-muted-foreground">{profile.role} account</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-0">
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="mb-2 h-10 w-full rounded-lg" />)
                : applications?.slice(0, 4).map((app) => <ApplicationRow key={app.id} application={app} />)}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Nearby Jobs Map</CardTitle>
            <NavLink to="/worker/jobs" className="text-sm font-medium text-primary hover:underline">
              View all
            </NavLink>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <Skeleton className="h-80 w-full rounded-2xl" />
            ) : (
              <MapView
                height={320}
                pins={jobs!.map((j) => ({ id: j.id, geo: j.geo, label: j.title, sublabel: j.company, variant: "primary" as const }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Top Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobsLoading
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
              : jobs?.slice(0, 2).map((job) => <NearbyJobCard key={job.id} job={job} />)}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Learning Roadmap</CardTitle>
            <NavLink to="/worker/learning" className="text-sm font-medium text-primary hover:underline">
              Open hub
            </NavLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {roadmapLoading ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : roadmap ? (
              <>
                <p className="font-medium">{roadmap.title}</p>
                <p className="text-sm text-muted-foreground">Target role: {roadmap.targetRole}</p>
                <p className="text-sm text-muted-foreground">
                  {roadmap.modules.filter((module) => module.progress.mastered).length} of {roadmap.modules.length} topics mastered
                </p>
                <NavLink to="/worker/learning" className="inline-flex text-sm font-medium text-primary hover:underline">
                  Continue learning
                </NavLink>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Create a roadmap from your resume in the Learning Hub.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Government Schemes</CardTitle>
            <NavLink to="/worker/schemes" className="text-sm font-medium text-primary hover:underline">
              View all
            </NavLink>
          </CardHeader>
          <CardContent className="space-y-3">
            {schemesLoading
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
              : schemes?.slice(0, 2).map((scheme) => <SchemeCard key={scheme.id} scheme={scheme} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
