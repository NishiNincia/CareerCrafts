package com.skillbridge.platform.gigs.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** A short, hyperlocal, hourly gig (e.g. "2 hours of moving help this evening"). */
@Getter
@Setter
@Entity
@Table(name = "hourly_gigs", indexes = {
        @Index(name = "idx_gig_employer", columnList = "employer_id"),
        @Index(name = "idx_gig_status", columnList = "status")
})
public class Gig extends BaseEntity {

    @Column(name = "employer_id", nullable = false)
    private UUID employerId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "estimated_hours")
    private Double estimatedHours;

    @Column(name = "scheduled_start", nullable = false)
    private Instant scheduledStart;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    private String address;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GigStatus status = GigStatus.OPEN;

    public enum GigStatus { OPEN, DISPATCHED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED }
}
