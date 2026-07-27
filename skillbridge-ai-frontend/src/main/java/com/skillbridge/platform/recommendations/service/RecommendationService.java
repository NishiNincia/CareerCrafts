package com.skillbridge.platform.recommendations.service;

import com.skillbridge.platform.recommendations.dto.RecommendationItem;

import java.util.List;
import java.util.UUID;

public interface RecommendationService {
    List<RecommendationItem> getJobRecommendations(UUID workerUserId, int limit);
    List<RecommendationItem> getCourseRecommendations(UUID workerUserId, int limit);
    List<RecommendationItem> getSchemeRecommendations(UUID workerUserId, int limit);
    List<String> getResumeImprovementSuggestions(UUID resumeId);
    List<RecommendationItem> getSkillGaps(UUID workerUserId, UUID targetJobId);
}
