import { mockRequest } from "./api-client";
import employerData from "@/mock/employer.json";
import candidatesData from "@/mock/candidates.json";
import trackedWorkersData from "@/mock/tracked-workers.json";
import reviewsData from "@/mock/reviews.json";
import revenueData from "@/mock/revenue.json";
import pipelineData from "@/mock/pipeline.json";
import jobsData from "@/mock/jobs.json";
import gigsData from "@/mock/gigs.json";
import type { Employer } from "@/types/user";
import type { Candidate, TrackedWorker, Review, RevenuePoint, PipelineStage } from "@/types/employer";
import type { Job } from "@/types/job";
import type { Gig } from "@/types/gig";

export const employerService = {
  getProfile: () => mockRequest(employerData as Employer),
  getCandidates: () => mockRequest(candidatesData as Candidate[]),
  getTrackedWorkers: () => mockRequest(trackedWorkersData as TrackedWorker[]),
  getReviews: () => mockRequest(reviewsData as Review[]),
  getRevenue: () => mockRequest(revenueData as RevenuePoint[]),
  getPipeline: () => mockRequest(pipelineData as PipelineStage[]),
  getActiveJobs: () => mockRequest(jobsData as Job[]),
  getActiveGigs: () => mockRequest(gigsData as Gig[]),

  postJob: (payload: Partial<Job>) => mockRequest({ ...payload, id: `j-${Date.now()}` }, 800),
  postGig: (payload: Partial<Gig>) => mockRequest({ ...payload, id: `g-${Date.now()}` }, 800),
};
