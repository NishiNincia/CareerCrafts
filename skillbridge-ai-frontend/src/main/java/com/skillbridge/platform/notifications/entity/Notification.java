package com.skillbridge.platform.notifications.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_user", columnList = "user_id"),
        @Index(name = "idx_notification_read", columnList = "is_read")
})
public class Notification extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    /** Optional deep-link id (job id, gig id, application id, interview id, etc.) */
    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "sent_via_email", nullable = false)
    private boolean sentViaEmail = false;

    @Column(name = "sent_via_push", nullable = false)
    private boolean sentViaPush = false;

    public enum NotificationType {
        GIG_ALERT, INTERVIEW_ALERT, APPLICATION_UPDATE, PAYMENT_UPDATE, SYSTEM, CHAT_MESSAGE
    }
}
