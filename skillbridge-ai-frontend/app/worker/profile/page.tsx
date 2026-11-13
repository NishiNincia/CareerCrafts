"use client";

import { Calendar, FileText, Mail, UserRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import { useWorkerProfile } from "@/features/worker/hooks/use-worker-data";
import { useLearningRoadmap } from "@/features/worker/hooks/use-learning-roadmap";
import { NavLink } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";

export default function WorkerProfilePage() {
  const { data: profile, isLoading, isError, error } = useWorkerProfile();
  const { data: roadmap } = useLearningRoadmap();

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }
  if (isError || !profile) {
    return <p role="alert" className="text-sm text-destructive">{error instanceof Error ? error.message : "Could not load your account."}</p>;
  }

  return (
    <div>
      <PageHeader title="Profile" description="Your account details and latest saved resume analysis." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-20 w-20 text-lg">
              <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
            </Avatar>
            <p className="mt-3 font-display text-lg font-semibold">{profile.name}</p>
            <Badge className="mt-2 capitalize">{profile.role}</Badge>

            <div className="mt-5 grid w-full grid-cols-1 gap-2 text-left text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> {profile.email}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-5 w-full text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resume skills</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {profile.resume?.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
              {roadmap?.modules.some((module) => module.progress.mastered) && (
                <>
                  <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills mastered in Learning Hub</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {roadmap.modules
                      .filter((module) => module.progress.mastered)
                      .map((module) => <Badge key={module.id} variant="success">{module.skill}</Badge>)}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Latest Resume
            </CardTitle>
          </CardHeader>
          {profile.resume ? (
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{profile.resume.title || profile.resume.filename}</p>
                <p className="mt-1 text-sm text-muted-foreground">{profile.resume.careerLevel} · {profile.resume.yearsExperience} years experience</p>
              </div>
              {profile.resume.summary && <p className="text-sm text-muted-foreground">{profile.resume.summary}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-secondary/60 p-3">
                  <p className="text-xs text-muted-foreground">Resume score</p>
                  <p className="mt-1 font-display text-xl font-semibold">{profile.resume.metrics.resumeScore}/100</p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3">
                  <p className="text-xs text-muted-foreground">Profile completion</p>
                  <p className="mt-1 font-display text-xl font-semibold">{profile.resume.metrics.profileCompletion}%</p>
                </div>
              </div>
              <Button asChild>
                <NavLink to="/worker/resume-ai">View full analysis</NavLink>
              </Button>
            </CardContent>
          ) : (
            <CardContent>
              <EmptyState
                icon={UserRound}
                title="No analyzed resume yet"
                description="Upload a resume to save your skills and career details to your account."
                action={<Button asChild><NavLink to="/worker/resume-ai">Analyze a resume</NavLink></Button>}
              />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
