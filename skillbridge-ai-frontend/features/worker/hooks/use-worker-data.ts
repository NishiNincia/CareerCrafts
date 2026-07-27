"use client";

import { useQuery } from "@tanstack/react-query";
import { workerService } from "@/services/worker.service";

export function useWorkerProfile() {
  return useQuery({ queryKey: ["worker", "profile"], queryFn: workerService.getProfile });
}

export function useNearbyJobs() {
  return useQuery({ queryKey: ["worker", "jobs"], queryFn: workerService.getNearbyJobs });
}

export function useGigs() {
  return useQuery({ queryKey: ["worker", "gigs"], queryFn: workerService.getGigs });
}

export function useRecommendedCourses() {
  return useQuery({ queryKey: ["worker", "courses"], queryFn: workerService.getRecommendedCourses });
}

export function useSchemes() {
  return useQuery({ queryKey: ["worker", "schemes"], queryFn: workerService.getSchemes });
}

export function useApplications() {
  return useQuery({ queryKey: ["worker", "applications"], queryFn: workerService.getApplications });
}
