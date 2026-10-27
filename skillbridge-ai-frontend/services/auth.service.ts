import { backendRequest } from "./api-client";
import type { Role } from "@/types/common";

interface AuthData {
  token: string;
  user: {
    name: string;
    role: Role;
  };
}

interface AuthResponse {
  success: boolean;
  data?: AuthData;
  token?: string;
  user?: AuthData["user"];
}

function normalizeAuthResponse(response: AuthResponse): AuthData {
  const result: AuthData | undefined = response.data
    ?? (response.token && response.user ? { token: response.token, user: response.user } : undefined);
  if (!result || !response.success) {
    throw new Error("The backend returned an incomplete authentication response.");
  }
  return result;
}

export const authService = {
  login: async (email: string, password: string) => {
    const response = await backendRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return normalizeAuthResponse(response);
  },

  register: async (name: string, email: string, password: string, role: Role) => {
    const response = await backendRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    return normalizeAuthResponse(response);
  },
};
