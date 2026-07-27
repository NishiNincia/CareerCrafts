package com.skillbridge.platform.learning.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "courses", indexes = @Index(name = "idx_course_skill", columnList = "primary_skill"))
public class Course extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "primary_skill", nullable = false)
    private String primarySkill;

    @Column(name = "provider_name")
    private String providerName;

    @Column(name = "external_url")
    private String externalUrl;

    @Column(name = "duration_hours")
    private Double durationHours;

    @Column(nullable = false)
    private String level = "BEGINNER"; // BEGINNER, INTERMEDIATE, ADVANCED

    @Column(nullable = false)
    private boolean free = true;

    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal price;
}
