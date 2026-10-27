"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Sparkles, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ResumeScoreCard } from "@/features/worker/components/resume-score-card";
import { ResumeUploadCard } from "@/features/worker/components/resume-ai/resume-upload-card";
import { ResumePreviewCard } from "@/features/worker/components/resume-ai/resume-preview-card";
import { ResumeAnalysisCard } from "@/features/worker/components/resume-ai/resume-analysis-card";
import { LearningRecommendationsCard } from "@/features/worker/components/resume-ai/learning-recommendations-card";
import { ApiError } from "@/services/api-client";
import { resumeService, type ResumeAnalysis } from "@/services/resume.service";
import { useAuthStore } from "@/store/auth-store";

export default function ResumeAIPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!accessToken) {
      setAnalysis(null);
      setIsLoading(false);
      setPageError("Sign in again to analyze and view your saved resume.");
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    resumeService.latest(accessToken)
      .then((resume) => {
        if (!active) return;
        setAnalysis(resume);
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPageError(error instanceof Error ? error.message : "Could not load your saved resume.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!accessToken) throw new ApiError("Sign in again to analyze a resume.", 401);
    setPageError(null);
    try {
      const result = await resumeService.analyze(file, accessToken);
      setAnalysis(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resume analysis failed.";
      setPageError(message);
      throw error;
    }
  }, [accessToken]);

  return (
    <div>
      <PageHeader title="Resume AI" description="Upload, review, and improve your resume with AI-guided recommendations." />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          {analysis && <ResumeScoreCard score={analysis.metrics.resumeScore} />}
          <ResumeUploadCard onFileSelect={handleFileSelect} />

          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bridge-500/10 text-bridge-600 dark:text-bridge-300">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">{analysis ? "Resume analyzed" : "Ready for resume review"}</p>
              <p className="text-xs text-muted-foreground">
                {analysis ? `Career level: ${analysis.careerLevel}` : "Upload a PDF or DOCX to extract your profile and career level."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {pageError && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{pageError}</p>}
          {isLoading ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading your saved resume...</CardContent></Card>
          ) : analysis ? (
            <>
              <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="flex items-center gap-2 font-display text-lg font-semibold">
                      <Sparkles className="h-4 w-4 text-signal-500" /> Career level: {analysis.careerLevel}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Estimated experience: {analysis.yearsExperience} years. Recommendations are matched to this level and your skill gaps.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <ResumePreviewCard parsedResume={analysis} />
              <ResumeAnalysisCard metrics={analysis.metrics} />
              <LearningRecommendationsCard courses={analysis.recommendations} />
            </>
          ) : (
            <Card>
              <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Your resume analysis will appear here</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Upload a resume to extract education, experience, projects, skills, certifications, scores, and level-matched courses.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
