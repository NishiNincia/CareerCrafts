import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types/common";

interface AuthState {
  isAuthenticated: boolean;
  activeRole: Role;
  userName: string;
  login: (role: Role, name: string) => void;
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
      isAuthenticated: true,
      activeRole: "worker",
      userName: "Arjun Mehta",
      login: (role, name) => set({ isAuthenticated: true, activeRole: role, userName: name }),
      logout: () => set({ isAuthenticated: false }),
      switchRole: (role) => set({ activeRole: role }),
    }),
    { name: "skillbridge-auth" }
  )
);
