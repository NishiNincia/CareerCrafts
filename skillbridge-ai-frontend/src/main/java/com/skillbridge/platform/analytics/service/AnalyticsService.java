package com.skillbridge.platform.analytics.service;

import com.skillbridge.platform.analytics.dto.EmployerStatsResponse;
import com.skillbridge.platform.analytics.dto.PlatformStatsResponse;
import com.skillbridge.platform.analytics.dto.WorkerStatsResponse;

import java.util.UUID;

public interface AnalyticsService {
    WorkerStatsResponse getWorkerStats(UUID workerUserId);
    EmployerStatsResponse getEmployerStats(UUID employerUserId);
    PlatformStatsResponse getPlatformStats();
}
