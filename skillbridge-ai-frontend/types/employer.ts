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

export interface RevenuePoint {
  month: string;
  revenue: number;
  spending: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
}
