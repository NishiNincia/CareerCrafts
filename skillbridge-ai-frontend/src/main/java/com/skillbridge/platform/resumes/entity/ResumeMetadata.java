package com.skillbridge.platform.resumes.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Structured facts extracted from a resume by the (external, pluggable) parser. */
@Getter
@Setter
@Entity
@Table(name = "resume_metadata", indexes = @Index(name = "idx_resume_metadata_resume", columnList = "resume_id", unique = true))
public class ResumeMetadata extends BaseEntity {

    @Column(name = "resume_id", nullable = false, unique = true)
    private UUID resumeId;

    @Column(name = "candidate_name")
    private String candidateName;

    private String email;

    private String phone;

    @Column(name = "extracted_skills", columnDefinition = "TEXT")
    private String extractedSkills; // comma separated

    @Column(name = "total_experience_years")
    private Double totalExperienceYears;

    @Column(name = "highest_education")
    private String highestEducation;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;
}
