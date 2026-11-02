import { useAuthStore } from "@/store/auth-store";

/**
 * Mock API client.
 *
 * In production this file would wrap `fetch` against the real SkillBridge
 * backend (with auth headers, base URL, error normalization, etc). For this
 * build every "request" resolves local JSON fixtures with a simulated
 * network delay so the rest of the app (React Query hooks, loading states,
 * skeletons) behaves exactly as it would against a live API.
 */

const SIMULATED_LATENCY_MS = 500;

export const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL ?? "http://localhost:4000";

export async function mockRequest<T>(data: T, latency = SIMULATED_LATENCY_MS): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, latency));
  return structuredClone(data);
}

export class ApiError extends Error {
  constructor(message: string, public status = 500, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function backendRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_API_URL}${path}`, init);
  } catch {
    throw new ApiError("Could not reach the backend. Check that the API server is running.", 0);
  }

  const payload = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }
    throw new ApiError(payload?.message ?? "The backend request failed.", response.status, payload?.code);
  }

  return payload as T;
}
