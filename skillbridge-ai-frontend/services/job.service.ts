import { ApiError, backendRequest } from "./api-client";
import { useAuthStore } from "@/store/auth-store";
import type { Job, JobType } from "@/types/job";

export interface NearbyJobsSearch {
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  type: JobType;
  salaryMin: number;
  salaryMax: number;
  skills: string[];
}

interface JobListResponse {
  success: boolean;
  data: Job[];
  message?: string;
}

interface JobResponse {
  success: boolean;
  data: Job;
  message?: string;
}

interface ApplicationResponse {
  success: boolean;
  data: { id: string; jobId: string; status: "applied"; appliedAt: string };
  message?: string;
}

interface CloseJobResponse {
  success: boolean;
  data: { id: string; status: "closed" };
  message?: string;
}

function getAccessToken() {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new ApiError("Sign in to use the jobs service.", 401, "AUTH_REQUIRED");
  }
  return token;
}

async function getJobs(path: string): Promise<Job[]> {
  const response = await backendRequest<JobListResponse>(path, {
    headers: { authorization: `Bearer ${getAccessToken()}` },
  });
  if (!response.success || !Array.isArray(response.data)) {
    throw new ApiError(response.message ?? "The backend returned invalid job data.");
  }
  return response.data;
}

async function saveJob(path: string, method: "POST" | "PUT", job: CreateJobPayload): Promise<Job> {
  const response = await backendRequest<JobResponse>(path, {
    method,
    headers: {
      authorization: `Bearer ${getAccessToken()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      title: job.title,
      description: job.description,
      location: job.location,
      latitude: job.latitude,
      longitude: job.longitude,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      skills: job.skills,
    }),
  });
  if (!response.success || !response.data) {
    throw new ApiError(response.message ?? "The backend returned invalid job data.");
  }
  return response.data;
}

export const jobService = {
  getNearbyJobs: ({ lat, lng, radiusKm }: NearbyJobsSearch) => {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radiusKm: String(radiusKm),
    });
    return getJobs(`/api/v1/worker/jobs?${params.toString()}`);
  },

  getEmployerJobs: () => getJobs("/api/v1/employer/jobs"),

  applyToJob: async (jobId: string) => {
    const response = await backendRequest<ApplicationResponse>(
      `/api/v1/worker/jobs/${encodeURIComponent(jobId)}/applications`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${getAccessToken()}` },
      },
    );
    if (!response.success || !response.data) {
      throw new ApiError(response.message ?? "The backend returned an incomplete application.");
    }
    return response.data;
  },

  postJob: (job: CreateJobPayload) =>
    saveJob("/api/v1/employer/jobs", "POST", job),

  updateEmployerJob: (jobId: string, job: CreateJobPayload) =>
    saveJob(`/api/v1/employer/jobs/${encodeURIComponent(jobId)}`, "PUT", job),

  closeEmployerJob: async (jobId: string) => {
    const response = await backendRequest<CloseJobResponse>(
      `/api/v1/employer/jobs/${encodeURIComponent(jobId)}`,
      { method: "DELETE", headers: { authorization: `Bearer ${getAccessToken()}` } },
    );
    if (!response.success || !response.data) {
      throw new ApiError(response.message ?? "The backend could not close this job.");
    }
    return response.data;
  },
};
