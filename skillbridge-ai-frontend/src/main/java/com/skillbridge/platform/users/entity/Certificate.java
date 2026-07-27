package com.skillbridge.platform.users.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "certificates", indexes = @Index(name = "idx_certificate_worker", columnList = "worker_id"))
public class Certificate extends BaseEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Column(nullable = false)
    private String title;

    private String issuingOrganization;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "credential_url")
    private String credentialUrl;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "is_verified", nullable = false)
    private boolean verified = false;
}
