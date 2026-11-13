import { ApiError, backendRequest } from "./api-client";
import { useAuthStore } from "@/store/auth-store";
import type { CompanySize } from "@/types/common";
import type { GovtScheme } from "@/types/job";

export type { CompanySize } from "@/types/common";

export interface CompanyProfile {
  companySize: CompanySize | null;
  annualTurnoverCr: number | null;
  eligible: boolean;
  turnoverLimitCr: number | null;
}

function authHeaders() {
  const token = useAuthStore.getState().accessToken;
  if (!token) throw new ApiError("Sign in to load company eligibility.", 401, "AUTH_REQUIRED");
  return { authorization: `Bearer ${token}` };
}

export const companySchemesService = {
  getProfile: async () => {
    const response = await backendRequest<{ success: boolean; data: CompanyProfile }>(
      "/api/v1/employer/company-profile",
      { headers: authHeaders() }
    );
    if (!response.success || !response.data) {
      throw new ApiError("The backend returned incomplete company eligibility data.");
    }
    return response.data;
  },

  updateProfile: async (profile: { companySize: CompanySize; annualTurnoverCr: number }) => {
    const response = await backendRequest<{ success: boolean; data: CompanyProfile }>(
      "/api/v1/employer/company-profile",
      {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      }
    );
    if (!response.success || !response.data) {
      throw new ApiError("The backend did not save company eligibility data.");
    }
    return response.data;
  },

  getSchemes: async () => {
    const response = await backendRequest<{ success: boolean; data: GovtScheme[] }>(
      "/api/v1/employer/schemes",
      { headers: authHeaders() }
    );
    if (!response.success || !Array.isArray(response.data)) {
      throw new ApiError("The backend returned incomplete government scheme data.");
    }
    return response.data;
  },
};
