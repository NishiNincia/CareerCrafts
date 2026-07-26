"use client";

import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

/** Minimal in-house toast store (avoids pulling in the full shadcn toast machinery). */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((s) => ({ toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function useToast() {
  const push = useToastStore((s) => s.push);
  return { toast: push };
}
