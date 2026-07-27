package com.skillbridge.platform.resumes.entity;

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
@Table(name = "ats_scores", indexes = @Index(name = "idx_ats_score_resume", columnList = "resume_id"))
public class AtsScore extends BaseEntity {

    @Column(name = "resume_id", nullable = false)
    private UUID resumeId;

    /** Nullable: an ATS score can be general, or computed against a specific job posting. */
    @Column(name = "job_id")
    private UUID jobId;

    @Column(name = "ats_score", nullable = false)
    private Double atsScore;

    @Column(name = "missing_keywords", columnDefinition = "TEXT")
    private String missingKeywords;
}
