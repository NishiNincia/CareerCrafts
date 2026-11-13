"use client";

import { useQuery } from "@tanstack/react-query";
import { learningService } from "@/services/learning.service";

export function useLearningResumeContext() {
  return useQuery({
    queryKey: ["worker", "learning-resume-context"],
    queryFn: learningService.getResumeContext,
    staleTime: 0,
  });
}

export function useLearningRoadmap() {
  return useQuery({
    queryKey: ["worker", "learning-roadmap"],
    queryFn: learningService.getRoadmap,
  });
}
