"use client";

import { useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ActiveJobRow } from "@/features/employer/components/active-listing-row";
import { PostJobForm } from "@/features/employer/components/post-job-form";
import { useActiveJobs } from "@/features/employer/hooks/use-employer-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostJobPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: jobs, isLoading, isError, error } = useActiveJobs();

  return (
    <div>
      <PageHeader
        title="Your Job Listings"
        description="View and manage the jobs your company has posted."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Post a Job
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Posted jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <p role="alert" className="py-3 text-sm text-destructive">
              {error instanceof Error ? error.message : "Could not load your job listings."}
            </p>
          ) : jobs?.length ? (
            jobs.map((job) => <ActiveJobRow key={job.id} job={job} />)
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No jobs posted yet"
              description="Create your first job listing to start reaching qualified candidates."
              action={
                <Button type="button" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> Post a Job
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post a job</DialogTitle>
            <DialogDescription>
              Add the role details so candidates can find and apply to your listing.
            </DialogDescription>
          </DialogHeader>
          <PostJobForm
            onCancel={() => setCreateOpen(false)}
            onSaved={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
