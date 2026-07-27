package com.skillbridge.platform.employers.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "interview_schedules", indexes = @Index(name = "idx_interview_application", columnList = "application_id"))
public class InterviewSchedule extends BaseEntity {

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    private String mode = "IN_PERSON"; // IN_PERSON, VIDEO, PHONE

    private String location;

    @Column(name = "meeting_link")
    private String meetingLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.SCHEDULED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum Status { SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED }
}
