package com.skillbridge.platform.recommendations.strategy;

import com.skillbridge.platform.recommendations.dto.RecommendationItem;

import java.util.List;
import java.util.UUID;

/**
 * Strategy contract for job recommendations. The default implementation uses
 * a local skill-overlap heuristic; a production deployment can register an
 * alternative bean (e.g. backed by an external ML ranking service or LLM)
 * without touching any caller.
 */
public interface JobRecommendationStrategy {
    List<RecommendationItem> recommendJobs(UUID workerId, int limit);
}
