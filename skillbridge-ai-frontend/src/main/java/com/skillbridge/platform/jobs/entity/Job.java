package com.skillbridge.platform.jobs.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "jobs", indexes = {
        @Index(name = "idx_job_employer", columnList = "employer_id"),
        @Index(name = "idx_job_status", columnList = "status"),
        @Index(name = "idx_job_category", columnList = "category")
})
public class Job extends BaseEntity {

    @Column(name = "employer_id", nullable = false)
    private UUID employerId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false)
    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    @Column(name = "min_salary", precision = 12, scale = 2)
    private BigDecimal minSalary;

    @Column(name = "max_salary", precision = 12, scale = 2)
    private BigDecimal maxSalary;

    @Column(name = "experience_required_years")
    private Integer experienceRequiredYears;

    @Column(name = "required_skills", columnDefinition = "TEXT")
    private String requiredSkills; // comma separated; normalized read model can move to a join table later

    private String address;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status = JobStatus.OPEN;

    @Column(name = "openings", nullable = false)
    private Integer openings = 1;

    @Column(name = "views_count", nullable = false)
    private long viewsCount = 0;

    public enum EmploymentType { FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP }
    public enum JobStatus { OPEN, PAUSED, CLOSED, FILLED }
}
