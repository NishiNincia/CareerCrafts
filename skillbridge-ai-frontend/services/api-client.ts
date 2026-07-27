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

export async function mockRequest<T>(data: T, latency = SIMULATED_LATENCY_MS): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, latency));
  return structuredClone(data);
}

export class ApiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
    this.name = "ApiError";
  }
}
