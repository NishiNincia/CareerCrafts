"use client";

import { useQuery } from "@tanstack/react-query";
import { workerService } from "@/services/worker.service";
import type { NearbyJobsSearch } from "@/services/job.service";

export function useWorkerProfile() {
  return useQuery({ queryKey: ["worker", "profile"], queryFn: workerService.getProfile });
}

export function useNearbyJobs(search?: NearbyJobsSearch) {
  return useQuery({
    queryKey: ["worker", "jobs", search?.lat, search?.lng, search?.radiusKm],
    queryFn: () => {
      if (!search) throw new Error("Choose a location before searching for jobs.");
      return workerService.getNearbyJobs(search);
    },
    enabled: Boolean(search),
  });
}

export function useCourses() {
  return useQuery({ queryKey: ["worker", "courses"], queryFn: workerService.getCourses });
}

export function useApplications() {
  return useQuery({ queryKey: ["worker", "applications"], queryFn: workerService.getApplications });
}
