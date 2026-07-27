package com.skillbridge.platform.recommendations.repository;

import com.skillbridge.platform.recommendations.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RecommendationRepository extends JpaRepository<Recommendation, UUID> {
    List<Recommendation> findByWorkerIdAndTypeAndDismissedFalse(UUID workerId, Recommendation.RecommendationType type);
}
