import type { GeoPoint } from "./common";

export type JobType = "full-time" | "part-time" | "contract";
export type ApplicationStatus = "applied" | "shortlisted" | "interview" | "hired" | "rejected";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogoUrl?: string;
  location: string;
  geo: GeoPoint;
  distanceKm: number;
  type: JobType;
  salaryMin: number;
  salaryMax: number;
  matchScore: number;
  skills: string[];
  postedAt: string;
  description: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  durationHours: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  progress?: number;
  thumbnailColor: string;
  matchReason: string;
}

export interface GovtScheme {
  id: string;
  name: string;
  department: string;
  benefit: string;
  eligibility: string;
  deadline?: string;
  category: string;
}
