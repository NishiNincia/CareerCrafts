package com.skillbridge.platform.recommendations.controller;

import com.skillbridge.platform.common.dto.ApiResponse;
import com.skillbridge.platform.recommendations.dto.RecommendationItem;
import com.skillbridge.platform.recommendations.service.RecommendationService;
import com.skillbridge.platform.security.annotation.CurrentUserId;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('WORKER')")
@Tag(name = "Recommendations", description = "Job, course, scheme, resume, and skill-gap recommendations (Strategy pattern, AI-pluggable)")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/jobs")
    public ApiResponse<List<RecommendationItem>> jobs(@RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.success(recommendationService.getJobRecommendations(CurrentUserId.get(), limit));
    }

    @GetMapping("/courses")
    public ApiResponse<List<RecommendationItem>> courses(@RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.success(recommendationService.getCourseRecommendations(CurrentUserId.get(), limit));
    }

    @GetMapping("/schemes")
    public ApiResponse<List<RecommendationItem>> schemes(@RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.success(recommendationService.getSchemeRecommendations(CurrentUserId.get(), limit));
    }

    @GetMapping("/resumes/{resumeId}/improvements")
    public ApiResponse<List<String>> resumeImprovements(@PathVariable UUID resumeId) {
        return ApiResponse.success(recommendationService.getResumeImprovementSuggestions(resumeId));
    }

    @GetMapping("/skill-gaps")
    public ApiResponse<List<RecommendationItem>> skillGaps(@RequestParam(required = false) UUID targetJobId) {
        return ApiResponse.success(recommendationService.getSkillGaps(CurrentUserId.get(), targetJobId));
    }
}
