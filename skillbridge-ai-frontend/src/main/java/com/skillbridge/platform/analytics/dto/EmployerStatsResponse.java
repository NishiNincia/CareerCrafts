package com.skillbridge.platform.analytics.dto;

public record EmployerStatsResponse(
        long totalJobsPosted,
        long totalGigsPosted,
        long totalApplicationsReceived,
        long totalHires,
        double averageRating
) {
}
