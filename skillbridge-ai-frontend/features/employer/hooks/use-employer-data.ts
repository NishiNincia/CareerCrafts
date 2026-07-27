"use client";

import { useQuery } from "@tanstack/react-query";
import { employerService } from "@/services/employer.service";

export function useEmployerProfile() {
  return useQuery({ queryKey: ["employer", "profile"], queryFn: employerService.getProfile });
}

export function useCandidates() {
  return useQuery({ queryKey: ["employer", "candidates"], queryFn: employerService.getCandidates });
}

export function useTrackedWorkers() {
  return useQuery({ queryKey: ["employer", "tracked-workers"], queryFn: employerService.getTrackedWorkers });
}

export function useEmployerReviews() {
  return useQuery({ queryKey: ["employer", "reviews"], queryFn: employerService.getReviews });
}

export function useRevenue() {
  return useQuery({ queryKey: ["employer", "revenue"], queryFn: employerService.getRevenue });
}

export function usePipeline() {
  return useQuery({ queryKey: ["employer", "pipeline"], queryFn: employerService.getPipeline });
}

export function useActiveJobs() {
  return useQuery({ queryKey: ["employer", "active-jobs"], queryFn: employerService.getActiveJobs });
}

export function useActiveGigs() {
  return useQuery({ queryKey: ["employer", "active-gigs"], queryFn: employerService.getActiveGigs });
}
