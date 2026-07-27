package com.skillbridge.platform.employers.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "employers", indexes = @Index(name = "idx_employer_user", columnList = "user_id", unique = true))
public class EmployerProfile extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(name = "business_type")
    private String businessType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "gstin")
    private String gstin;

    @Column(name = "business_address")
    private String businessAddress;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "verification_document_url")
    private String verificationDocumentUrl;

    @Column(name = "average_rating")
    private Double averageRating = 0.0;

    @Column(name = "total_ratings")
    private Integer totalRatings = 0;

    public enum VerificationStatus { PENDING, VERIFIED, REJECTED }
}
