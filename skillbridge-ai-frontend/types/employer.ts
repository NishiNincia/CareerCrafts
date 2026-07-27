import type { GeoPoint } from "./common";
import type { ApplicationStatus } from "./job";

export interface Candidate {
  id: string;
  name: string;
  avatarUrl?: string;
  appliedFor: string;
  matchScore: number;
  experienceYears: number;
  skills: string[];
  status: ApplicationStatus;
  location: string;
}

export interface TrackedWorker {
  id: string;
  name: string;
  avatarUrl?: string;
  gigTitle: string;
  geo: GeoPoint;
  status: "en-route" | "on-site" | "completed";
  etaMinutes: number;
}

export interface Review {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  rating: number;
  comment: string;
  jobTitle: string;
  date: string;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  spending: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
}
