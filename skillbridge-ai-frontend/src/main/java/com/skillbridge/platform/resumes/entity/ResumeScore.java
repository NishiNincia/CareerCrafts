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
@Table(name = "resume_scores", indexes = @Index(name = "idx_resume_score_resume", columnList = "resume_id", unique = true))
public class ResumeScore extends BaseEntity {

    @Column(name = "resume_id", nullable = false, unique = true)
    private UUID resumeId;

    @Column(name = "overall_score", nullable = false)
    private Double overallScore;

    @Column(name = "formatting_score")
    private Double formattingScore;

    @Column(name = "content_score")
    private Double contentScore;

    @Column(name = "keyword_score")
    private Double keywordScore;

    @Column(columnDefinition = "TEXT")
    private String feedback;
}
