package com.skillbridge.platform.learning.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "learning_progress", indexes = {
        @Index(name = "idx_progress_worker", columnList = "worker_id"),
        @Index(name = "uq_progress_worker_course", columnList = "worker_id, course_id", unique = true)
})
public class LearningProgress extends BaseEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "progress_percent", nullable = false)
    private int progressPercent = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.NOT_STARTED;

    @Column(name = "certificate_url")
    private String certificateUrl;

    public enum Status { NOT_STARTED, IN_PROGRESS, COMPLETED }
}
