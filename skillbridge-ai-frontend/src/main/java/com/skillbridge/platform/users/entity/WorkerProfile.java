package com.skillbridge.platform.users.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "worker_profiles", indexes = {
        @Index(name = "idx_worker_profile_user", columnList = "user_id", unique = true)
})
public class WorkerProfile extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    private String gender;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "is_available", nullable = false)
    private boolean available = true;

    @Column(name = "hourly_rate")
    private Double hourlyRate;

    @Column(name = "preferred_radius_km")
    private Double preferredRadiusKm = 10.0;

    /** Current location, used for nearby job/gig matching (PostGIS geography point). */
    @Column(columnDefinition = "geometry(Point,4326)")
    private Point currentLocation;

    @Column(name = "resume_score")
    private Double resumeScore;

    @Column(name = "ats_score")
    private Double atsScore;
}
