"use client";

import { useMutation } from "@tanstack/react-query";
import { workerService } from "@/services/worker.service";
import { useGigStore } from "@/store/gig-store";
import { useToast } from "@/hooks/use-toast";
import { GIG_RESPONSE_WINDOW_SECONDS } from "@/lib/constants";
import type { Gig } from "@/types/gig";

/** Demo gig template used to simulate a live incoming offer (Rapido/Uber style). */
const DEMO_GIGS: Omit<Gig, "id">[] = [
  {
    businessName: "QuickFix Home Services",
    category: "AC Repair Visit",
    distanceKm: 1.8,
    etaMinutes: 9,
    durationHours: 2,
    payment: 650,
    employerRating: 4.6,
    geo: { lat: 19.1123, lng: 72.8654 },
    status: "pending",
    expiresInSeconds: GIG_RESPONSE_WINDOW_SECONDS,
  },
  {
    businessName: "Spark Electricals",
    category: "Wiring Inspection",
    distanceKm: 3.4,
    etaMinutes: 14,
    durationHours: 3,
    payment: 900,
    employerRating: 4.8,
    geo: { lat: 19.1301, lng: 72.8712 },
    status: "pending",
    expiresInSeconds: GIG_RESPONSE_WINDOW_SECONDS,
  },
  {
    businessName: "MetroMart Facilities",
    category: "Panel Maintenance",
    distanceKm: 2.4,
    etaMinutes: 11,
    durationHours: 1.5,
    payment: 520,
    employerRating: 4.4,
    geo: { lat: 19.1050, lng: 72.8600 },
    status: "pending",
    expiresInSeconds: GIG_RESPONSE_WINDOW_SECONDS,
  },
];

export function useIncomingGig() {
  const { showIncomingGig, resolveGig, beginJourney, clearOutcome } = useGigStore();
  const { toast } = useToast();

  const simulate = () => {
    const template = DEMO_GIGS[Math.floor(Math.random() * DEMO_GIGS.length)];
    showIncomingGig({ ...template, id: `g-${Date.now()}` });
  };

  const accept = useMutation({
    mutationFn: (gigId: string) => workerService.acceptGig(gigId),
    onSuccess: () => {
      resolveGig("accepted");
      beginJourney();
      toast({ title: "Gig accepted", description: "Head to the location — details sent to Messages.", variant: "success" });
    },
  });

  const decline = useMutation({
    mutationFn: (gigId: string) => workerService.declineGig(gigId),
    onSuccess: () => {
      resolveGig("declined");
      toast({ title: "Gig declined", description: "We'll keep sending better matches your way." });
    },
  });

  return { simulate, accept, decline, clearOutcome };
}
