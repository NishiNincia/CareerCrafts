import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types/common";

interface AuthState {
  isAuthenticated: boolean;
  activeRole: Role;
  userName: string;
  accessToken: string | null;
  login: (role: Role, name: string, accessToken: string) => void;
  logout: () => void;
}

/**
 * Persist the backend session so refreshing a portal does not lose authentication.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      activeRole: "worker",
      userName: "Arjun Mehta",
      accessToken: null,
      login: (role, name, accessToken) => set({ isAuthenticated: true, activeRole: role, userName: name, accessToken }),
      logout: () => set({ isAuthenticated: false, activeRole: "worker", accessToken: null }),
    }),
    { name: "skillbridge-auth" }
  )
);
