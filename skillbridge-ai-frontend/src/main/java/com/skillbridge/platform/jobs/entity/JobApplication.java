package com.skillbridge.platform.jobs.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "job_applications", indexes = {
        @Index(name = "idx_application_job", columnList = "job_id"),
        @Index(name = "idx_application_worker", columnList = "worker_id"),
        @Index(name = "uq_application_job_worker", columnList = "job_id, worker_id", unique = true)
})
public class JobApplication extends BaseEntity {

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Column(name = "cover_note", columnDefinition = "TEXT")
    private String coverNote;

    @Column(name = "match_score")
    private Double matchScore;

    public enum ApplicationStatus { APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, REJECTED, HIRED, WITHDRAWN }
}
