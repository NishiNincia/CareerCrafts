package com.skillbridge.platform.analytics.dto;

public record PlatformStatsResponse(
        long totalWorkers,
        long totalEmployers,
        long totalJobs,
        long totalGigs,
        long totalApplications,
        long totalCompletedGigs
) {
}
