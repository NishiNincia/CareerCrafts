import { mockRequest } from "./api-client";
import workerData from "@/mock/worker.json";
import jobsData from "@/mock/jobs.json";
import gigsData from "@/mock/gigs.json";
import coursesData from "@/mock/courses.json";
import schemesData from "@/mock/schemes.json";
import applicationsData from "@/mock/applications.json";
import type { Worker } from "@/types/user";
import type { Job, Course, GovtScheme, Application } from "@/types/job";
import type { Gig } from "@/types/gig";

export const workerService = {
  getProfile: () => mockRequest(workerData as Worker),
  getNearbyJobs: () => mockRequest(jobsData as Job[]),
  getGigs: () => mockRequest(gigsData as Gig[]),
  getRecommendedCourses: () => mockRequest(coursesData as Course[]),
  getSchemes: () => mockRequest(schemesData as GovtScheme[]),
  getApplications: () => mockRequest(applicationsData as Application[]),

  /** Simulates accepting a gig offer within the countdown window. */
  acceptGig: (gigId: string) =>
    mockRequest({ gigId, status: "accepted" as const }, 700),

  declineGig: (gigId: string) =>
    mockRequest({ gigId, status: "declined" as const }, 300),
};
