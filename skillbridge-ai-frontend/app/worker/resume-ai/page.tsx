"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileText, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ResumeUploadCard } from "@/features/worker/components/resume-ai/resume-upload-card";
import { ResumePreviewCard } from "@/features/worker/components/resume-ai/resume-preview-card";
import { ResumeAnalysisCard } from "@/features/worker/components/resume-ai/resume-analysis-card";
import { LearningRecommendationsCard } from "@/features/worker/components/resume-ai/learning-recommendations-card";
import { ApiError } from "@/services/api-client";
import { resumeService, type ResumeAnalysis, type ResumeAnalysisJob } from "@/services/resume.service";
import { useAuthStore } from "@/store/auth-store";

export default function ResumeAIPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [analysisJob, setAnalysisJob] = useState<ResumeAnalysisJob | null>(null);

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

  const waitForAnalysis = useCallback(async (initialJob: ResumeAnalysisJob, token: string) => {
    let job = initialJob;
    setAnalysisJob(job);
    while (job.status === "queued" || job.status === "processing") {
      if (!job.id) throw new ApiError("Resume analysis status is unavailable. Please try again.", 500);
      await new Promise((resolve) => setTimeout(resolve, 1_200));
      job = await resumeService.jobStatus(job.id, token);
      setAnalysisJob(job);
    }

    if (job.status === "failed") {
      const message = job.errorCode === "GEMINI_TIMEOUT" || job.errorCode === "GEMINI_RETRY_EXHAUSTED"
        ? "Resume analysis took longer than expected. Your previous results have been preserved. Please retry."
        : job.errorMessage || "Resume analysis failed. Your previous results have been preserved.";
      throw new ApiError(message, job.errorCode === "GEMINI_QUOTA_LIMIT" ? 429 : 502, job.errorCode || undefined);
    }
    if (!job.resume) throw new ApiError("Analysis completed without a saved result. Please retry.", 500);
    setAnalysis(job.resume);
    return job.resume;
  }, []);

  const handleFileSelect = useCallback(async (file: File, jobDescription: string) => {
    if (!accessToken) throw new ApiError("Sign in again to analyze a resume.", 401);
    setPageError(null);
    setAnalysisJob(null);
    setIsAnalyzing(true);
    try {
      const job = await resumeService.analyze(file, accessToken, jobDescription);
      if (job.status === "completed" && job.resume) {
        setAnalysis(job.resume);
        setAnalysisJob(job);
        return job.resume;
      }
      return await waitForAnalysis(job, accessToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resume analysis failed.";
      setPageError(message);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [accessToken, waitForAnalysis]);

  const retryFailedAnalysis = useCallback(async () => {
    if (!accessToken) throw new ApiError("Sign in again to retry analysis.", 401);
    if (!analysisJob?.id) throw new ApiError("The failed analysis job is unavailable. Upload the resume again to retry.", 404);
    setPageError(null);
    setIsAnalyzing(true);
    try {
      const job = await resumeService.retry(analysisJob.id, accessToken);
      return await waitForAnalysis(job, accessToken);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Resume analysis retry failed.");
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [accessToken, analysisJob, waitForAnalysis]);

  const stageLabel = !analysisJob && isAnalyzing
    ? "Submitting resume for analysis"
    : analysisJob?.status === "queued"
    ? "Queued for analysis"
    : analysisJob?.stage === "recommending"
      ? "Matching Learning Hub recommendations"
      : analysisJob?.stage === "saving"
        ? "Saving your results"
        : "Analyzing your resume";
  const progressWidth = analysisJob?.status === "completed"
    ? "100%"
    : analysisJob?.status === "queued"
      ? "12%"
      : analysisJob?.stage === "recommending"
        ? "72%"
        : analysisJob?.stage === "saving"
          ? "90%"
          : isAnalyzing
            ? "8%"
            : "0%";
  const progressLabel = isAnalyzing
    ? stageLabel
    : analysis
      ? "Analysis complete"
      : "Ready to analyze";

  return (
    <div>
      <PageHeader title="Resume AI" description="Upload, review, and improve your resume with AI-guided recommendations." />

      <Card className="mb-4 border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {isAnalyzing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resume analysis</p>
              <p className="font-display text-xl font-semibold" aria-live="polite">{progressLabel}</p>
            </div>
          </div>
          <div
            role="progressbar"
            aria-label="Resume analysis progress"
            aria-valuetext={isAnalyzing ? stageLabel : analysis ? "Analysis complete" : "Waiting for a resume"}
            aria-busy={isAnalyzing}
            className="h-2.5 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className={`h-full rounded-full bg-primary transition-[width] duration-500 ${isAnalyzing ? "animate-pulse" : ""}`}
              style={{ width: progressWidth }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {isAnalyzing
              ? stageLabel
              : analysis
                ? "Your results were generated and saved."
                : "Upload a PDF or DOCX to begin. Progress reflects the backend job stage."}
          </p>
        </CardContent>
      </Card>

      {analysis && analysis.analysisProvider !== "Gemini" && (
        <Card className="mb-4 border-signal-500/30 bg-signal-500/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">This saved analysis predates Gemini analysis.</p>
            <p className="mt-1 text-muted-foreground">Upload your resume again to run the new Gemini-powered analysis and refresh these results.</p>
          </CardContent>
        </Card>
      )}

      {analysis && <ResumeAnalysisCard metrics={analysis.metrics} />}

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <ResumeUploadCard
            onFileSelect={handleFileSelect}
            onRetry={retryFailedAnalysis}
            retryAvailable={analysisJob?.status === "failed"}
          />

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
