import type { GeoPoint, Role } from "./common";

export interface Worker {
  id: string;
  name: string;
  avatarUrl?: string;
  role: Role;
  title: string;
  location: string;
  geo: GeoPoint;
  resumeScore: number;
  skills: string[];
  rating: number;
  totalJobsCompleted: number;
  memberSince: string;
}

export interface Employer {
  id: string;
  companyName: string;
  logoUrl?: string;
  role: Role;
  industry: string;
  location: string;
  geo: GeoPoint;
  rating: number;
  verified: boolean;
}
