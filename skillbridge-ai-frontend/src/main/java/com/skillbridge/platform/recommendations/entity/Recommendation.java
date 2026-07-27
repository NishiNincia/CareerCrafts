package com.skillbridge.platform.recommendations.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Persisted, auditable record of a recommendation surfaced to a user. */
@Getter
@Setter
@Entity
@Table(name = "recommendations", indexes = {
        @Index(name = "idx_recommendation_worker", columnList = "worker_id"),
        @Index(name = "idx_recommendation_type", columnList = "type")
})
public class Recommendation extends BaseEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecommendationType type;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(nullable = false)
    private double score;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "is_dismissed", nullable = false)
    private boolean dismissed = false;

    public enum RecommendationType { JOB, COURSE, SCHEME, RESUME_IMPROVEMENT, SKILL_GAP }
}
