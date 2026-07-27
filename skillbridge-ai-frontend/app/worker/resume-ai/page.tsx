"use client";

import { useMemo } from "react";
import { FileText, Sparkles, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeScoreCard } from "@/features/worker/components/resume-score-card";
import { ResumeUploadCard } from "@/features/worker/components/resume-ai/resume-upload-card";
import { ResumePreviewCard } from "@/features/worker/components/resume-ai/resume-preview-card";
import { ResumeAnalysisCard } from "@/features/worker/components/resume-ai/resume-analysis-card";
import { ResumeImprovementCard } from "@/features/worker/components/resume-ai/resume-improvement-card";
import { TargetRoleCard } from "@/features/worker/components/resume-ai/target-role-card";
import { LearningRecommendationsCard } from "@/features/worker/components/resume-ai/learning-recommendations-card";
import { useWorkerProfile } from "@/features/worker/hooks/use-worker-data";
import mockCourses from "@/mock/courses.json";

const parsedResume = {
  name: "Aarav Sharma",
  title: "Frontend Developer • React • UI Systems",
  summary:
    "Product-focused frontend engineer with 4+ years building scalable React applications, design systems, and accessible user experiences for SaaS and B2B products.",
  education: [
    { school: "IIIT Bangalore", degree: "B.Tech in Information Technology", year: "2018 - 2022" },
    { school: "NPTEL", degree: "Advanced React & UI Engineering", year: "2023" },
  ],
  experience: [
    {
      role: "Senior Frontend Developer",
      company: "Nova Labs",
      period: "2022 - Present",
      bullets: ["Led migration to React 18 and improved Lighthouse score by 26%", "Built reusable design system components for 4 product teams"],
    },
    {
      role: "UI Engineer",
      company: "Northstar Studio",
      period: "2020 - 2022",
      bullets: ["Developed dashboards and internal tools for enterprise clients", "Improved accessibility and onboarding experience"],
    },
  ],
  skills: ["React", "TypeScript", "Tailwind CSS", "Framer Motion", "Next.js", "Accessibility"],
  projects: [
    { name: "Design System Foundation", description: "Built a scalable component library used across 3 product lines." },
    { name: "AI Hiring Assistant", description: "Delivered an onboarding assistant with analytics and workflow automation." },
  ],
  certifications: ["AWS Cloud Practitioner", "Google UX Design", "Meta Frontend Certificate"],
};

const analysisMetrics = {
  atsScore: 83,
  resumeScore: 86,
  profileCompletion: 78,
  skillStrength: 81,
  missingKeywords: ["React Server Components", "TypeScript generics", "Design systems"],
  missingSkills: ["Next.js App Router", "Performance tuning", "Accessibility audits"],
};

const improvementSuggestions = [
  { title: "Quantify impact", detail: "Add measurable outcomes like engagement lift or deployment time reduction." },
  { title: "Add AI keywords", detail: "Mention AI-powered, design systems, and performance optimization terms." },
  { title: "Showcase leadership", detail: "Highlight mentoring, roadmap ownership, or cross-functional collaboration." },
];

const targetRoles = [
  { label: "Frontend Developer", description: "Focus on React, TypeScript, component architecture, and accessibility." },
  { label: "Backend Developer", description: "Emphasize API design, system architecture, and deployment reliability." },
  { label: "Data Analyst", description: "Highlight SQL, dashboards, experiments, and data storytelling." },
  { label: "UI Designer", description: "Center your UI craft, prototyping, design systems, and visual storytelling." },
];

const gapAnalysis = [
  { label: "System Design", value: 72 },
  { label: "React Ecosystem", value: 90 },
  { label: "Accessibility", value: 78 },
  { label: "Visual Design", value: 66 },
];

export default function ResumeAIPage() {
  const { data: profile, isLoading } = useWorkerProfile();
  const courses = useMemo(
    () =>
      mockCourses as Array<{
        id: string;
        title: string;
        provider: string;
        durationHours: number;
        level: "Beginner" | "Intermediate" | "Advanced";
        progress: number;
        thumbnailColor: string;
        matchReason: string;
      }>,
    []
  );

  return (
    <div>
      <PageHeader title="Resume AI" description="Upload, review, and improve your resume with AI-guided recommendations." />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          {isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : profile && <ResumeScoreCard score={profile.resumeScore} />}

          <ResumeUploadCard />

          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bridge-500/10 text-bridge-600 dark:text-bridge-300">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Resume-ready for review</p>
              <p className="text-xs text-muted-foreground">Use the pipeline below to improve ATS fit and match rate.</p>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4" /> Review resume
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ResumePreviewCard parsedResume={parsedResume} />
          <ResumeAnalysisCard metrics={analysisMetrics} />
          <ResumeImprovementCard
            suggestions={improvementSuggestions}
            rewriteSummary="I build polished, accessible frontend experiences with React, TypeScript, and design systems — translating product needs into fast, intuitive interfaces that scale across teams."
            experienceTips={["Add impact metrics like latency reduction and conversion uplift.", "Mention your role in cross-functional launches and release milestones."]}
            projectTips={["Describe the problem, your solution, and the measurable outcome.", "Include stack details like Next.js, Tailwind, and testing tools."]}
            keywords={["React", "TypeScript", "Next.js", "Design Systems", "Accessibility", "Performance"]}
          />
          <TargetRoleCard roles={targetRoles} gapAnalysis={gapAnalysis} />
          <LearningRecommendationsCard courses={courses} />

          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-signal-400/10">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Sparkles className="h-4 w-4 text-signal-500" /> Resume boost mode
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Apply AI suggestions to refine your summary, experience, and keywords in one pass.</p>
              </div>
              <Button>Generate improvements</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
