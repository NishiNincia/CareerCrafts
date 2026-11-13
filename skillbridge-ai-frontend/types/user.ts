import type { GeoPoint, Role } from "./common";

export interface Worker {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  resume: {
    filename: string;
    title: string;
    summary: string;
    careerLevel: "Beginner" | "Intermediate" | "Advanced";
    yearsExperience: number;
    skills: string[];
    metrics: {
      atsScore: number;
      resumeScore: number;
      profileCompletion: number;
      skillStrength: number;
    };
  } | null;
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
