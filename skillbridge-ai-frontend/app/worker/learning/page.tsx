"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { LearningCourseCard } from "@/features/worker/components/learning-hub/course-card";
import { LearningStatsCard } from "@/features/worker/components/learning-hub/learning-stats-card";
import { TabsPanel } from "@/features/worker/components/learning-hub/tabs-panel";
import { useRecommendedCourses } from "@/features/worker/hooks/use-worker-data";

const tabs = [
  { id: "recommended", label: "Recommended Courses", description: "AI-picked courses that match your background and target roles." },
  { id: "paths", label: "Learning Paths", description: "Structured journeys to grow from beginner to specialist in your field." },
  { id: "certificates", label: "My Certificates", description: "Track your completed credentials and showcase them on your profile." },
  { id: "progress", label: "Progress Tracker", description: "Monitor your active courses, completion trends, and next milestones." },
];

export default function LearningHubPage() {
  const { data: courses, isLoading } = useRecommendedCourses();

  return (
    <div className="space-y-4">
      <PageHeader title="Learning Hub" description="Upgrade your profile with guided courses, learning paths, and milestone tracking." />

      <div className="grid gap-4 md:grid-cols-3">
        <LearningStatsCard title="Active Courses" value="6" hint="Across 3 learning tracks" icon="book" />
        <LearningStatsCard title="Certificates" value="2" hint="Ready to share" icon="trophy" />
        <LearningStatsCard title="Completion" value="68%" hint="Steady weekly progress" icon="trend" />
      </div>

      <TabsPanel items={tabs} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-xl" />)
          : courses?.map((course) => <LearningCourseCard key={course.id} course={course} />)}
      </div>
    </div>
  );
}
