package com.skillbridge.platform.recommendations.strategy.impl;

import com.skillbridge.platform.recommendations.dto.RecommendationItem;
import com.skillbridge.platform.recommendations.strategy.SchemeRecommendationStrategy;
import com.skillbridge.platform.schemes.service.SchemeService;
import com.skillbridge.platform.users.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Note: {@code workerId} here is the WorkerProfile id (the convention used by
 * every other module), so it is first resolved back to the auth User id that
 * {@link SchemeService} expects.
 */
@Component
@RequiredArgsConstructor
public class DefaultSchemeRecommendationStrategy implements SchemeRecommendationStrategy {

    private final SchemeService schemeService;
    private final WorkerProfileRepository workerProfileRepository;

    @Override
    public List<RecommendationItem> recommendSchemes(UUID workerId, int limit) {
        UUID userId = workerProfileRepository.findById(workerId)
                .map(com.skillbridge.platform.users.entity.WorkerProfile::getUserId)
                .orElse(workerId);
        return schemeService.getEligibleSchemes(userId).stream()
                .limit(limit)
                .map(scheme -> new RecommendationItem(scheme.getId(), 75.0,
                        "You meet the basic eligibility criteria for this scheme"))
                .collect(Collectors.toList());
    }
}
