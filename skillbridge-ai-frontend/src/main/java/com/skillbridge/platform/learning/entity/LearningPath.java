package com.skillbridge.platform.learning.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "learning_paths")
public class LearningPath extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Ordered comma-separated list of course ids making up this path. */
    @Column(name = "course_sequence", columnDefinition = "TEXT")
    private String courseSequence;

    @Column(name = "target_role")
    private String targetRole;
}
