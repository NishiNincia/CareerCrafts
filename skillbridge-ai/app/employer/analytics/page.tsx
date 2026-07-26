"use client";

import { TrendingUp, Users, Clock3, Target } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "@/features/employer/components/revenue-chart";
import { HiringPipeline } from "@/features/employer/components/hiring-pipeline";
import { useRevenue, usePipeline, useCandidates } from "@/features/employer/hooks/use-employer-data";

export default function AnalyticsPage() {
  const { data: revenue, isLoading: revenueLoading } = useRevenue();
  const { data: pipeline, isLoading: pipelineLoading } = usePipeline();
  const { data: candidates } = useCandidates();

  const avgMatch = candidates?.length
    ? Math.round(candidates.reduce((sum, c) => sum + c.matchScore, 0) / candidates.length)
    : 0;
  const hired = pipeline?.find((p) => p.stage === "Hired")?.count ?? 0;
  const applied = pipeline?.find((p) => p.stage === "Applied")?.count ?? 1;
  const conversion = Math.round((hired / applied) * 100);

  return (
    <div>
      <PageHeader title="Hiring Analytics" description="Understand funnel efficiency, spend, and candidate quality at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Avg. Match Score" value={`${avgMatch}%`} icon={Target} accent="bridge" />
        <StatCard label="Applied → Hired" value={`${conversion}%`} icon={TrendingUp} accent="success" trend="+3pts vs last quarter" trendUp />
        <StatCard label="Total Candidates" value={`${candidates?.length ?? 0}`} icon={Users} accent="signal" />
        <StatCard label="Avg. Time to Hire" value="6.2 days" icon={Clock3} accent="bridge" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>{revenueLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : <RevenueChart data={revenue!} />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hiring Funnel</CardTitle>
          </CardHeader>
          <CardContent>{pipelineLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : <HiringPipeline stages={pipeline!} />}</CardContent>
        </Card>
      </div>
    </div>
  );
}
