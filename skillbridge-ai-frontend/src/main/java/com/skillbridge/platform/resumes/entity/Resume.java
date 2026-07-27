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
@Table(name = "resumes", indexes = @Index(name = "idx_resume_worker", columnList = "worker_id"))
public class Resume extends BaseEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "parse_status", nullable = false)
    private String parseStatus = "PENDING"; // PENDING, PARSED, FAILED
}
