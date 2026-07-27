package com.skillbridge.platform.gigs.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "gig_ratings", indexes = @Index(name = "idx_gig_rating_gig", columnList = "gig_id"))
public class GigRating extends BaseEntity {

    @Column(name = "gig_id", nullable = false)
    private UUID gigId;

    @Column(name = "rater_user_id", nullable = false)
    private UUID raterUserId;

    @Column(name = "ratee_user_id", nullable = false)
    private UUID rateeUserId;

    @Column(nullable = false)
    private int stars;

    @Column(columnDefinition = "TEXT")
    private String comment;
}
