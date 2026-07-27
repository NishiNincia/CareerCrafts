package com.skillbridge.platform.jobs.entity;

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
@Table(name = "job_bookmarks", indexes = @Index(name = "uq_bookmark_worker_job", columnList = "worker_id, job_id", unique = true))
public class JobBookmark extends BaseEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Column(name = "job_id", nullable = false)
    private UUID jobId;
}
