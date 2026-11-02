import { ApiError, backendRequest } from "./api-client";
import type { Course } from "@/types/job";

export interface ResumeAnalysis {
  id: string;
  filename: string;
  analysisProvider?: string;
  analysisModel?: string;
  name: string;
  title: string;
  summary: string;
  email: string;
  phone: string;
  yearsExperience: number;
  careerLevel: "Beginner" | "Intermediate" | "Advanced";
  education: Array<{ school: string; degree: string; year: string }>;
  experience: Array<{ role: string; company: string; period: string; bullets: string[] }>;
  skills: string[];
  projects: Array<{ name: string; description: string; technologies?: string[]; outcomes?: string[] }>;
  certifications: string[];
  achievements?: string[];
  competitions?: string[];
  languages?: string[];
  interests?: string[];
  metrics: {
    atsScore: number;
    resumeScore: number;
    profileCompletion: number;
    skillStrength: number;
    jobDescriptionProvided?: boolean;
    missingKeywords: string[];
    missingSkills: string[];
  };
  recommendations: Array<Course & { matchingSkills: string[] }>;
}

interface AnalyzeResumeResponse {
  success: boolean;
  job: ResumeAnalysisJob;
  resume?: ResumeAnalysis | null;
}

export interface ResumeAnalysisJob {
  id: string | null;
  status: "queued" | "processing" | "completed" | "failed";
  stage: string;
  errorCode: string | null;
  errorMessage: string | null;
  attemptCount: number;
  updatedAt?: string;
  resume?: ResumeAnalysis | null;
}

interface ResumeAnalysisJobResponse {
  success: boolean;
  job: ResumeAnalysisJob;
}

export const resumeService = {
  latest: async (token: string) => {
    try {
      const response = await backendRequest<{ success: boolean; resume: ResumeAnalysis }>("/api/resumes/latest", {
        headers: { authorization: `Bearer ${token}` },
      });
      return response.resume;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  analyze: async (file: File, token: string, jobDescription = "") => {
    const formData = new FormData();
    formData.append("resume", file);
    if (jobDescription.trim()) {
      formData.append("jobDescription", jobDescription.trim());
    }
    const response = await backendRequest<AnalyzeResumeResponse>("/api/resumes/analyze", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: formData,
    });
    return response.job;
  },

  jobStatus: async (jobId: string, token: string) => {
    const response = await backendRequest<ResumeAnalysisJobResponse>(`/api/resumes/jobs/${encodeURIComponent(jobId)}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    return response.job;
  },

  retry: async (jobId: string, token: string) => {
    const response = await backendRequest<ResumeAnalysisJobResponse>(`/api/resumes/jobs/${encodeURIComponent(jobId)}/retry`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    return response.job;
  },
};
