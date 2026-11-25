import { ApiError, backendRequest } from "./api-client";
import { useAuthStore } from "@/store/auth-store";

export interface ChatContact {
  id: string;
  name: string;
  role: string;
}

export interface ChatConversation {
  id: string;
  participantId: string;
  name: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
  contextId: string | null;
  contextType: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderIsCurrentUser: boolean;
  text: string;
  attachmentUrl: string | null;
  read: boolean;
  createdAt: string;
}

function headers() {
  const token = useAuthStore.getState().accessToken;
  if (!token) throw new ApiError("Sign in to use messaging.", 401, "AUTH_REQUIRED");
  return { authorization: `Bearer ${token}` };
}

async function getData<T>(path: string) {
  const response = await backendRequest<{ success: boolean; data: T }>(path, { headers: headers() });
  if (!response.success || response.data === undefined || response.data === null) {
    throw new ApiError("The backend returned incomplete messaging data.");
  }
  return response.data;
}

export const chatService = {
  contacts: (search = "") =>
    getData<ChatContact[]>(`/api/chat/contacts?q=${encodeURIComponent(search)}`),

  conversations: () =>
    getData<ChatConversation[]>("/api/chat/conversations"),

  messages: (conversationId: string) =>
    getData<ChatMessage[]>(`/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`),

  send: async (recipientId: string, content: string, context?: { contextId?: string; contextType?: "general" | "job" | "gig" }) => {
    const response = await backendRequest<{ success: boolean; data: ChatMessage & { conversationId: string } }>(
      "/api/chat/messages",
      {
        method: "POST",
        headers: { ...headers(), "content-type": "application/json" },
        body: JSON.stringify({ recipientId, content, ...context }),
      },
    );
    if (!response.success || !response.data) throw new ApiError("The backend did not save your message.");
    return response.data;
  },

  markRead: async (conversationId: string) => {
    await backendRequest<{ success: boolean }>(
      `/api/chat/conversations/${encodeURIComponent(conversationId)}/read`,
      { method: "PATCH", headers: headers() },
    );
  },
};
