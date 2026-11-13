import { ApiError, backendRequest } from "./api-client";
import { useAuthStore } from "@/store/auth-store";
import type { AssessmentResult, LearningResumeContext, LearningRoadmap } from "@/types/learning";

function authHeaders() {
  const token = useAuthStore.getState().accessToken;
  if (!token) throw new ApiError("Sign in to use the Learning Hub.", 401, "AUTH_REQUIRED");
  return { authorization: `Bearer ${token}` };
}

interface RoadmapResponse {
  success: boolean;
  roadmap: LearningRoadmap | null;
}

export const learningService = {
  getResumeContext: async () => {
    const response = await backendRequest<{
      success: boolean;
      resume: LearningResumeContext | null;
    }>("/api/learning/resume-context", {
      headers: authHeaders(),
    });
    if (!response.success) throw new ApiError("The backend could not load your resume skills.");
    return response.resume;
  },

  getRoadmap: async () => {
    const response = await backendRequest<RoadmapResponse>("/api/learning/roadmap", {
      headers: authHeaders(),
    });
    if (!response.success) throw new ApiError("The backend could not load your roadmap.");
    return response.roadmap;
  },

  createRoadmap: async (targetRole: string) => {
    const response = await backendRequest<RoadmapResponse>("/api/learning/roadmaps", {
      method: "POST",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ targetRole }),
    });
    if (!response.success || !response.roadmap) {
      throw new ApiError("The backend did not return a generated roadmap.");
    }
    return response.roadmap;
  },

  completeLesson: async (roadmapId: string, moduleId: string, lessonId: string) => {
    const response = await backendRequest<RoadmapResponse>(
      `/api/learning/roadmaps/${encodeURIComponent(roadmapId)}/modules/${encodeURIComponent(moduleId)}/lessons/${encodeURIComponent(lessonId)}/complete`,
      { method: "POST", headers: authHeaders() },
    );
    if (!response.success || !response.roadmap) throw new ApiError("Could not save lesson progress.");
    return response.roadmap;
  },

  completeExercise: async (roadmapId: string, moduleId: string, exerciseId: string) => {
    const response = await backendRequest<RoadmapResponse>(
      `/api/learning/roadmaps/${encodeURIComponent(roadmapId)}/modules/${encodeURIComponent(moduleId)}/exercises/${encodeURIComponent(exerciseId)}/complete`,
      { method: "POST", headers: authHeaders() },
    );
    if (!response.success || !response.roadmap) throw new ApiError("Could not save exercise progress.");
    return response.roadmap;
  },

  submitAssessment: async (roadmapId: string, assessmentId: string, answers: number[]) => {
    const response = await backendRequest<{
      success: boolean;
      result: AssessmentResult;
      roadmap: LearningRoadmap;
    }>(
      `/api/learning/roadmaps/${encodeURIComponent(roadmapId)}/assessments/${encodeURIComponent(assessmentId)}/attempts`,
      {
        method: "POST",
        headers: { ...authHeaders(), "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      },
    );
    if (!response.success || !response.roadmap || !response.result) {
      throw new ApiError("Could not save the assessment attempt.");
    }
    return response;
  },

  updateProject: async (roadmapId: string, projectId: string, status: "in_progress" | "submitted") => {
    const response = await backendRequest<RoadmapResponse>(
      `/api/learning/roadmaps/${encodeURIComponent(roadmapId)}/projects/${encodeURIComponent(projectId)}`,
      {
        method: "PATCH",
        headers: { ...authHeaders(), "content-type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    if (!response.success || !response.roadmap) throw new ApiError("Could not update project progress.");
    return response.roadmap;
  },
};
