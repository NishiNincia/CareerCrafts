import { ApiError, backendRequest, mockRequest } from "./api-client";
import jobsData from "@/mock/jobs.json";
import gigsData from "@/mock/gigs.json";
import applicationsData from "@/mock/applications.json";
import { resumeService } from "./resume.service";
import { useAuthStore } from "@/store/auth-store";
import type { Worker } from "@/types/user";
import type { Job, Course, Application } from "@/types/job";
import type { Gig } from "@/types/gig";

function getAccessToken() {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new ApiError("Sign in to load your account data.", 401, "AUTH_REQUIRED");
  }
  return token;
}

export const workerService = {
  getProfile: async (): Promise<Worker> => {
    const token = getAccessToken();
    const response = await backendRequest<{
      success: boolean;
      data: Omit<Worker, "resume">;
    }>("/api/v1/me", {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.success || !response.data) {
      throw new ApiError("The backend returned incomplete account data.");
    }

    const resume = await resumeService.latest(token);
    return {
      ...response.data,
      resume: resume
        ? {
            filename: resume.filename,
            title: resume.title,
            summary: resume.summary,
            careerLevel: resume.careerLevel,
            yearsExperience: resume.yearsExperience,
            skills: resume.skills,
            metrics: resume.metrics,
          }
        : null,
    };
  },
  getNearbyJobs: () => mockRequest(jobsData as Job[]),
  getGigs: () => mockRequest(gigsData as Gig[]),
  getCourses: async (): Promise<Course[]> => {
    const token = getAccessToken();
    const response = await backendRequest<{ success: boolean; data: Course[] }>("/api/v1/worker/courses", {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.success || !Array.isArray(response.data)) {
      throw new ApiError("The backend returned incomplete course data.");
    }
    return response.data;
  },
  getApplications: () => mockRequest(applicationsData as Application[]),

  /** Simulates accepting a gig offer within the countdown window. */
  acceptGig: (gigId: string) =>
    mockRequest({ gigId, status: "accepted" as const }, 700),

  declineGig: (gigId: string) =>
    mockRequest({ gigId, status: "declined" as const }, 300),
};
