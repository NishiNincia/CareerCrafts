import { ApiError, backendRequest } from "./api-client";
import { useAuthStore } from "@/store/auth-store";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  category: "gig" | "job" | "interview" | "payment" | "scheme" | "message" | "system";
  route: string;
}

export interface NotificationPreferences {
  gigRadiusKm: number;
  latitude: number | null;
  longitude: number | null;
}

function headers() {
  const token = useAuthStore.getState().accessToken;
  if (!token) throw new ApiError("Sign in to view notifications.", 401, "AUTH_REQUIRED");
  return { authorization: `Bearer ${token}` };
}

export const notificationService = {
  getAll: async () => {
    const response = await backendRequest<{ success: boolean; data: AppNotification[] }>(
      "/api/notifications",
      { headers: headers() },
    );
    if (!response.success || !Array.isArray(response.data)) {
      throw new ApiError("The backend returned invalid notifications.");
    }
    return response.data;
  },

  unreadCount: async () => {
    const response = await backendRequest<{ success: boolean; unreadCount: number }>(
      "/api/notifications/unread-count",
      { headers: headers() },
    );
    if (!response.success || !Number.isFinite(response.unreadCount)) {
      throw new ApiError("The backend returned an invalid unread notification count.");
    }
    return response.unreadCount;
  },

  markRead: async (id: string) => {
    await backendRequest<{ success: boolean }>(
      `/api/notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH", headers: headers() },
    );
  },

  markAllRead: async () => {
    await backendRequest<{ success: boolean }>("/api/notifications/read-all", {
      method: "PATCH",
      headers: headers(),
    });
  },

  getPreferences: async () => {
    const response = await backendRequest<{ success: boolean; preferences: NotificationPreferences }>(
      "/api/notifications/preferences",
      { headers: headers() },
    );
    if (!response.success || !response.preferences) {
      throw new ApiError("The backend returned invalid notification preferences.");
    }
    return response.preferences;
  },

  savePreferences: async (preferences: NotificationPreferences) => {
    const response = await backendRequest<{ success: boolean; preferences: NotificationPreferences }>(
      "/api/notifications/preferences",
      {
        method: "PUT",
        headers: { ...headers(), "content-type": "application/json" },
        body: JSON.stringify(preferences),
      },
    );
    if (!response.success || !response.preferences) {
      throw new ApiError("The backend did not save notification preferences.");
    }
    return response.preferences;
  },
};
