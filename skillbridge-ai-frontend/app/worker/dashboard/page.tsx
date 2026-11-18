"use client";

import { Briefcase, UserRound, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeScoreCard } from "@/features/worker/components/resume-score-card";
import { ApplicationRow } from "@/features/worker/components/application-row";
import {
  useWorkerProfile,
  useApplications,
} from "@/features/worker/hooks/use-worker-data";
import { useLearningRoadmap } from "@/features/worker/hooks/use-learning-roadmap";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function WorkerDashboardPage() {
  const { data: profile, isLoading: profileLoading } = useWorkerProfile();
  const { data: roadmap, isLoading: roadmapLoading } = useLearningRoadmap();
  const { data: applications, isLoading: applicationsLoading } = useApplications();

  return (
    <div>
      <PageHeader
        title={`Welcome back${profile ? `, ${profile.name.split(" ")[0]}` : ""}`}
        description="Here's what's happening with your job search today."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Nearby Jobs" value="Explore" icon={Briefcase} accent="signal" />
        <StatCard label="Roadmap Topics" value={roadmap ? `${roadmap.modules.length}` : "—"} icon={Zap} accent="success" />
        <StatCard label="Resume Status" value={profile?.resume ? "Analyzed" : "Ready"} icon={UserRound} accent="bridge" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild><NavLink to="/worker/jobs">Find nearby jobs</NavLink></Button>
        <Button asChild variant="outline"><NavLink to="/worker/resume-ai">Analyze resume</NavLink></Button>
        <Button asChild variant="outline"><NavLink to="/worker/learning">Open Learning Hub</NavLink></Button>
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
                : applications?.length
                  ? applications.slice(0, 4).map((app) => <ApplicationRow key={app.id} application={app} />)
                  : <div className="space-y-2 py-3 text-sm text-muted-foreground">
                    <p>You have not applied to any jobs or gigs yet.</p>
                    <NavLink to="/worker/jobs" className="inline-flex font-medium text-primary hover:underline">
                      Find nearby jobs
                    </NavLink>
                  </div>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
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

      </div>
    </div>
  );
}
