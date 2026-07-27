package com.skillbridge.platform.recommendations.strategy;

import com.skillbridge.platform.recommendations.dto.RecommendationItem;

import java.util.List;
import java.util.UUID;

public interface SchemeRecommendationStrategy {
    List<RecommendationItem> recommendSchemes(UUID workerId, int limit);
}
