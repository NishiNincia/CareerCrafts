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
    analysisMode?: "FULL_JOB_DESCRIPTION" | "ROLE_ONLY" | "NO_JOB_CONTEXT";
    jobDescriptionProvided?: boolean;
    missingKeywords: string[];
    missingSkills: string[];
    structureScore?: number | null;
    compatibilityScore?: number | null;
    employerCompatibilityScore?: number | null;
    estimatedRoleCompatibilityScore?: number | null;
    generalImprovementSuggestions?: string[];
    normalizedResumeSkills?: Array<{ skillName: string; skillId: string; sections: string[] }>;
    resumeStructureAssessment?: Record<string, unknown> | null;
    jobRequirements?: Array<{
      skillName: string;
      skillId?: string;
      category: string;
      importance: "Critical" | "High" | "Medium" | "Low";
      requirementType?: string;
      description?: string;
      relevanceReason?: string;
      sourceEvidence?: string;
      expectation?: "essential" | "preferred";
      matchStatus: "MATCHED" | "PARTIALLY_MATCHED" | "MISSING" | "UNVERIFIABLE" | "matched" | "partial" | "missing" | "unverifiable";
      supportingEvidence: string;
      explanation: string;
      identifiedGap: string;
      suggestedImprovement: string;
    }>;
    roleCompetencyProfile?: {
      roleTitle: string;
      expectedExperienceLevel: string;
      technicalSkills: string[];
      coreCompetencies: string[];
      toolsAndFrameworks: string[];
      educationalExpectations: string[];
      typicalResponsibilities: string[];
      competencies: Array<{
        skillName: string;
        skillId: string;
        category: string;
        importance: "Critical" | "High" | "Medium" | "Low";
        description: string;
        relevanceReason: string;
        expectation: "essential" | "preferred";
      }>;
    } | null;
    keywordAnalysis?: {
      present: string[];
      missingImportant: string[];
      presentWithoutEvidence: string[];
      shouldHighlight: string[];
      requireAcquisition: string[];
    };
    experienceRelevance?: unknown[];
    projectRelevance?: unknown[];
    improvementRecommendations?: Record<string, string[]>;
  };
  job?: { id: string | null; title: string; company: string; description: string };
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

  analyze: async (file: File, token: string, jobDescription = "", jobId = "") => {
    const formData = new FormData();
    formData.append("resume", file);
    if (jobDescription.trim()) {
      formData.append("jobDescription", jobDescription.trim());
    }
    if (jobId.trim()) {
      formData.append("jobId", jobId.trim());
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
