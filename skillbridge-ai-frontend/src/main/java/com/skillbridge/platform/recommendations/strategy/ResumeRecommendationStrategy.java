package com.skillbridge.platform.recommendations.strategy;

import java.util.List;
import java.util.UUID;

/** Recommends concrete improvements to a worker's resume (as human-readable suggestions). */
public interface ResumeRecommendationStrategy {
    List<String> recommendImprovements(UUID resumeId);
}
