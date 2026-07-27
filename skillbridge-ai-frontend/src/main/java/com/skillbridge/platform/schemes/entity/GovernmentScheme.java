package com.skillbridge.platform.schemes.entity;

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
@Table(name = "government_schemes", indexes = @Index(name = "idx_scheme_category", columnList = "category"))
public class GovernmentScheme extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    private String category; // e.g. SKILL_DEVELOPMENT, FINANCIAL_AID, HEALTH, HOUSING

    @Column(name = "issuing_body")
    private String issuingBody;

    @Column(name = "eligibility_criteria", columnDefinition = "TEXT")
    private String eligibilityCriteria; // e.g. "min_age:18,max_income:250000,state:TN"

    @Column(name = "benefit_summary", columnDefinition = "TEXT")
    private String benefitSummary;

    @Column(name = "official_url")
    private String officialUrl;

    @Column(nullable = false)
    private boolean active = true;
}
