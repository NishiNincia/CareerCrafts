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
  switchRole: (role: Role) => void;
}

/**
 * Lightweight auth store. Persists to localStorage so refreshing the
 * dashboard doesn't bounce the user back to /login in this mock build.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      activeRole: "worker",
      userName: "Arjun Mehta",
      accessToken: null,
      login: (role, name, accessToken) => set({ isAuthenticated: true, activeRole: role, userName: name, accessToken }),
      logout: () => set({ isAuthenticated: false, accessToken: null }),
      switchRole: (role) => set({ activeRole: role }),
    }),
    { name: "skillbridge-auth" }
  )
);
