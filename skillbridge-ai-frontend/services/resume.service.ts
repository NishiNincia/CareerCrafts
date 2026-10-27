import { ApiError, backendRequest } from "./api-client";
import type { Course } from "@/types/job";

export interface ResumeAnalysis {
  id: string;
  filename: string;
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
  projects: Array<{ name: string; description: string }>;
  certifications: string[];
  metrics: {
    atsScore: number;
    resumeScore: number;
    profileCompletion: number;
    skillStrength: number;
    missingKeywords: string[];
    missingSkills: string[];
  };
  recommendations: Array<Course & { matchingSkills: string[] }>;
}

interface AnalyzeResumeResponse {
  success: boolean;
  resume: ResumeAnalysis;
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

  analyze: async (file: File, token: string) => {
    const formData = new FormData();
    formData.append("resume", file);
    const response = await backendRequest<AnalyzeResumeResponse>("/api/resumes/analyze", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: formData,
    });
    return response.resume;
  },
};
