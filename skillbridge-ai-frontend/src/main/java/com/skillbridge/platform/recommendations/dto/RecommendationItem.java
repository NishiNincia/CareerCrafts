package com.skillbridge.platform.recommendations.dto;

import java.util.UUID;

/** Provider-agnostic recommendation result: a target entity id, a score, and a human-readable reason. */
public record RecommendationItem(UUID targetId, double score, String reason) {
}
