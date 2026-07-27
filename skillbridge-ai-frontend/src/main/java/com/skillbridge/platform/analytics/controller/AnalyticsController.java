package com.skillbridge.platform.analytics.controller;

import com.skillbridge.platform.analytics.dto.EmployerStatsResponse;
import com.skillbridge.platform.analytics.dto.PlatformStatsResponse;
import com.skillbridge.platform.analytics.dto.WorkerStatsResponse;
import com.skillbridge.platform.analytics.service.AnalyticsService;
import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Worker, employer, and platform-wide statistics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/worker")
    @PreAuthorize("hasRole('WORKER')")
    public ApiResponse<WorkerStatsResponse> workerStats() {
        return ApiResponse.success(analyticsService.getWorkerStats(CurrentUserId.get()));
    }

    @GetMapping("/employer")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ApiResponse<EmployerStatsResponse> employerStats() {
        return ApiResponse.success(analyticsService.getEmployerStats(CurrentUserId.get()));
    }

    @GetMapping("/platform")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PlatformStatsResponse> platformStats() {
        return ApiResponse.success(analyticsService.getPlatformStats());
    }
}
