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
@Table(name = "skill_gaps", indexes = @Index(name = "idx_skill_gap_worker", columnList = "worker_id"))
public class SkillGap extends BaseEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    /** Nullable: gap can be general (vs. market demand) or computed against a specific job. */
    @Column(name = "job_id")
    private UUID jobId;

    @Column(name = "missing_skill", nullable = false)
    private String missingSkill;

    @Column(name = "recommended_course_id")
    private UUID recommendedCourseId;

    @Column(nullable = false)
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH
}
