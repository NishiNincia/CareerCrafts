import type { GeoPoint } from "./common";

export type GigStatus = "pending" | "accepted" | "declined" | "expired" | "completed";
export type GigJourneyStep = "offer" | "route" | "navigation" | "employer" | "otp" | "started" | "completed" | "payment";

export interface Gig {
  id: string;
  businessName: string;
  businessLogoUrl?: string;
  category: string;
  distanceKm: number;
  etaMinutes: number;
  durationHours: number;
  payment: number;
  employerRating: number;
  geo: GeoPoint;
  status: GigStatus;
  expiresInSeconds: number;
}
