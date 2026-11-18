import type { GeoPoint } from "./common";

export type MarketGigStatus = "open" | "in_progress" | "completed" | "cancelled";
export type GigWorkMode = "online" | "on_site";
export type GigApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type ProjectStatus = "active" | "submitted" | "changes_requested" | "completed" | "cancelled";

export interface MarketGig {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  requiredSkills: string[];
  budget: number;
  currency: string;
  deadline: string;
  workMode: GigWorkMode;
  locationAddress: string | null;
  geo: GeoPoint | null;
  status: MarketGigStatus;
  createdAt: string;
  applicationId?: string | null;
  applicationStatus?: GigApplicationStatus | null;
  applicationCount?: number;
}

export interface GigApplication {
  id: string;
  gigId: string;
  workerId?: string;
  workerName?: string;
  workerEmail?: string;
  title?: string;
  proposal: string;
  portfolioUrl: string | null;
  budget?: number;
  currency?: string;
  workMode?: GigWorkMode;
  status: GigApplicationStatus;
  submittedAt: string;
}

export interface Project {
  id: string;
  status: ProjectStatus;
  createdAt: string;
  completedAt: string | null;
  gig: Pick<
    MarketGig,
    "id" | "title" | "description" | "requiredSkills" | "budget" | "currency" |
    "deadline" | "workMode" | "locationAddress" | "geo"
  >;
  clientName: string;
  workerName: string;
  latestSubmission: {
    id: string;
    notes: string;
    workUrl: string | null;
    status: "submitted" | "changes_requested" | "approved";
    clientFeedback: string | null;
    submittedAt: string;
  } | null;
  locationEvents: { type: "travel_started" | "arrived"; createdAt: string }[];
}
