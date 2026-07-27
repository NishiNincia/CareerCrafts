package com.skillbridge.platform.gigs.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents one worker being offered a gig. Multiple dispatch rows can
 * exist per gig (fan-out to nearby available workers); the first ACCEPT wins
 * and the rest are auto-declined by the dispatch service.
 */
@Getter
@Setter
@Entity
@Table(name = "gig_dispatches", indexes = {
        @Index(name = "idx_dispatch_gig", columnList = "gig_id"),
        @Index(name = "idx_dispatch_worker", columnList = "worker_id")
})
public class GigDispatch extends BaseEntity {

    @Column(name = "gig_id", nullable = false)
    private UUID gigId;

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DispatchStatus status = DispatchStatus.OFFERED;

    @Column(name = "offered_at", nullable = false)
    private Instant offeredAt = Instant.now();

    @Column(name = "responded_at")
    private Instant respondedAt;

    /** Hashed OTP used by the worker to confirm on-site arrival / completion. */
    @Column(name = "start_otp_hash")
    private String startOtpHash;

    @Column(name = "completion_otp_hash")
    private String completionOtpHash;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public enum DispatchStatus { OFFERED, ACCEPTED, DECLINED, EXPIRED, IN_PROGRESS, COMPLETED }
}
