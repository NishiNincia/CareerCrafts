package com.skillbridge.platform.users.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "worker_skills", indexes = @Index(name = "idx_worker_skill_worker", columnList = "worker_id"))
public class WorkerSkill extends BaseEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Column(nullable = false)
    private String skillName;

    @Enumerated(EnumType.STRING)
    @Column(name = "proficiency_level", nullable = false)
    private ProficiencyLevel proficiencyLevel = ProficiencyLevel.BEGINNER;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "is_verified", nullable = false)
    private boolean verified = false;

    public enum ProficiencyLevel { BEGINNER, INTERMEDIATE, ADVANCED, EXPERT }
}
