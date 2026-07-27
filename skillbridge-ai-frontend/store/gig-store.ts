import { create } from "zustand";
import type { Gig, GigJourneyStep } from "@/types/gig";

interface GigState {
  incomingGig: Gig | null;
  lastOutcome: "accepted" | "declined" | null;
  journeyStep: GigJourneyStep;
  showIncomingGig: (gig: Gig) => void;
  resolveGig: (outcome: "accepted" | "declined") => void;
  beginJourney: () => void;
  advanceJourney: () => void;
  clearOutcome: () => void;
}

const JOURNEY_STEPS: GigJourneyStep[] = ["route", "navigation", "employer", "otp", "started", "completed", "payment"];

/**
 * Drives the Rapido/Uber-style incoming gig modal. `incomingGig` being
 * non-null triggers the modal to mount; `lastOutcome` powers the brief
 * success/decline confirmation state after the user responds.
 */
export const useGigStore = create<GigState>((set) => ({
  incomingGig: null,
  lastOutcome: null,
  journeyStep: "offer",
  showIncomingGig: (gig) => set({ incomingGig: gig, lastOutcome: null, journeyStep: "offer" }),
  resolveGig: (outcome) => set({ lastOutcome: outcome }),
  beginJourney: () => set({ journeyStep: "route" }),
  advanceJourney: () =>
    set((state) => {
      const currentIndex = JOURNEY_STEPS.indexOf(state.journeyStep);
      if (currentIndex < 0) return state;
      const nextIndex = Math.min(currentIndex + 1, JOURNEY_STEPS.length - 1);
      return { ...state, journeyStep: JOURNEY_STEPS[nextIndex] };
    }),
  clearOutcome: () => set({ incomingGig: null, lastOutcome: null, journeyStep: "offer" }),
}));
