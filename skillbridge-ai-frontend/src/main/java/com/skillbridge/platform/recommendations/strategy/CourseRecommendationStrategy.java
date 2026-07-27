package com.skillbridge.platform.recommendations.strategy;

import com.skillbridge.platform.recommendations.dto.RecommendationItem;

import java.util.List;
import java.util.UUID;

public interface CourseRecommendationStrategy {
    List<RecommendationItem> recommendCourses(UUID workerId, int limit);
}
