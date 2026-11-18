import { ApiError, backendRequest } from "./api-client";
import { useAuthStore } from "@/store/auth-store";
import type { GigApplication, MarketGig, Project } from "@/types/gig";

function headers() {
  const token = useAuthStore.getState().accessToken;
  if (!token) throw new ApiError("Sign in to use the gig marketplace.", 401, "AUTH_REQUIRED");
  return { authorization: `Bearer ${token}` };
}

async function getData<T>(path: string): Promise<T> {
  const response = await backendRequest<{ success: boolean; data: T }>(path, { headers: headers() });
  if (!response.success || response.data === undefined || response.data === null) {
    throw new ApiError("The backend returned incomplete gig marketplace data.");
  }
  return response.data;
}

export interface GigDraft {
  title: string;
  description: string;
  requiredSkills: string[];
  budget: number;
  deadline: string;
  workMode: "online" | "on_site";
  locationAddress?: string;
  geo?: { lat: number; lng: number };
}

export const gigMarketplaceService = {
  browse: (search = "", skill = "") =>
    getData<MarketGig[]>(`/api/v1/worker/gigs?q=${encodeURIComponent(search)}&skill=${encodeURIComponent(skill)}`),
  apply: async (gigId: string, proposal: string, portfolioUrl?: string) => {
    const response = await backendRequest<{ success: boolean; data: GigApplication }>(
      `/api/v1/worker/gigs/${gigId}/applications`,
      {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ proposal, portfolioUrl }),
      }
    );
    if (!response.success || !response.data) throw new ApiError("The backend did not save your proposal.");
    return response.data;
  },
  workerApplications: () => getData<GigApplication[]>("/api/v1/worker/gig-applications"),
  workerProjects: () => getData<Project[]>("/api/v1/worker/projects"),
  submitWork: async (projectId: string, notes: string, workUrl?: string) => {
    const response = await backendRequest<{ success: boolean; data: Project["latestSubmission"] }>(
      `/api/v1/worker/projects/${projectId}/submissions`,
      {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ notes, workUrl }),
      }
    );
    if (!response.success || !response.data) throw new ApiError("The backend did not save your submission.");
    return response.data;
  },
  recordLocationEvent: async (projectId: string, eventType: "travel_started" | "arrived") => {
    const response = await backendRequest<{ success: boolean; data: Project["locationEvents"][number] }>(
      `/api/v1/worker/projects/${projectId}/location-events`,
      {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ eventType }),
      }
    );
    if (!response.success || !response.data) throw new ApiError("The backend did not save the travel update.");
    return response.data;
  },
  create: async (draft: GigDraft) => {
    const response = await backendRequest<{ success: boolean; data: MarketGig }>("/api/v1/employer/gigs", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!response.success || !response.data) throw new ApiError("The backend did not create the gig.");
    return response.data;
  },
  employerGigs: () => getData<MarketGig[]>("/api/v1/employer/gigs"),
  employerApplications: (gigId: string) => getData<GigApplication[]>(`/api/v1/employer/gigs/${gigId}/applications`),
  decideApplication: async (applicationId: string, decision: "accepted" | "rejected") => {
    const response = await backendRequest<{ success: boolean; data: { id: string; status: string } }>(
      `/api/v1/employer/gig-applications/${applicationId}`,
      {
        method: "PATCH",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      }
    );
    if (!response.success || !response.data) throw new ApiError("The backend did not update this application.");
    return response.data;
  },
  employerProjects: () => getData<Project[]>("/api/v1/employer/projects"),
  reviewSubmission: async (
    projectId: string,
    submissionId: string,
    decision: "approved" | "changes_requested",
    feedback: string
  ) => {
    const response = await backendRequest<{ success: boolean; data: { projectId: string; status: string } }>(
      `/api/v1/employer/projects/${projectId}/submissions/${submissionId}`,
      {
        method: "PATCH",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ decision, feedback }),
      }
    );
    if (!response.success || !response.data) throw new ApiError("The backend did not save this review.");
    return response.data;
  },
};
