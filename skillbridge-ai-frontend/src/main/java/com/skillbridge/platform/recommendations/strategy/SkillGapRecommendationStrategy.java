package com.skillbridge.platform.recommendations.strategy;

import com.skillbridge.platform.recommendations.dto.RecommendationItem;

import java.util.List;
import java.util.UUID;

/** Identifies skill gaps for a worker, optionally scoped to a specific target job. */
public interface SkillGapRecommendationStrategy {
    List<RecommendationItem> identifyGaps(UUID workerId, UUID targetJobId);
}
