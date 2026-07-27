package com.skillbridge.platform.analytics.dto;

public record WorkerStatsResponse(
        long totalApplications,
        long totalGigsCompleted,
        double averageRating,
        double totalEarnings,
        long activeApplications
) {
}
