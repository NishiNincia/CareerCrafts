package com.skillbridge.platform.employers.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Tracks a candidate's progress through an employer's hiring pipeline for a given application. */
@Getter
@Setter
@Entity
@Table(name = "hiring_pipeline_stages", indexes = @Index(name = "idx_pipeline_application", columnList = "application_id"))
public class HiringPipelineStage extends BaseEntity {

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Stage stage = Stage.APPLIED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum Stage { APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, REJECTED }
}
