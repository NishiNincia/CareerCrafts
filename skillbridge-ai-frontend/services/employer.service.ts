import { mockRequest } from "./api-client";
import employerData from "@/mock/employer.json";
import candidatesData from "@/mock/candidates.json";
import trackedWorkersData from "@/mock/tracked-workers.json";
import reviewsData from "@/mock/reviews.json";
import revenueData from "@/mock/revenue.json";
import pipelineData from "@/mock/pipeline.json";
import { gigMarketplaceService } from "./gig-marketplace.service";
import { jobService } from "./job.service";
import type { Employer } from "@/types/user";
import type { Candidate, TrackedWorker, Review, RevenuePoint, PipelineStage } from "@/types/employer";

export const employerService = {
  getProfile: () => mockRequest(employerData as Employer),
  getCandidates: () => mockRequest(candidatesData as Candidate[]),
  getTrackedWorkers: () => mockRequest(trackedWorkersData as TrackedWorker[]),
  getReviews: () => mockRequest(reviewsData as Review[]),
  getRevenue: () => mockRequest(revenueData as RevenuePoint[]),
  getPipeline: () => mockRequest(pipelineData as PipelineStage[]),
  getActiveJobs: jobService.getEmployerJobs,
  getActiveGigs: gigMarketplaceService.employerGigs,

  postJob: jobService.postJob,
  updateJob: jobService.updateEmployerJob,
  closeJob: jobService.closeEmployerJob,
};
