package com.skillbridge.platform.chat.entity;

import com.skillbridge.platform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "chats", indexes = {
        @Index(name = "idx_chat_participant_a", columnList = "participant_a_id"),
        @Index(name = "idx_chat_participant_b", columnList = "participant_b_id")
})
public class Conversation extends BaseEntity {

    @Column(name = "participant_a_id", nullable = false)
    private UUID participantAId;

    @Column(name = "participant_b_id", nullable = false)
    private UUID participantBId;

    /** Optional context this conversation is about (a job or gig id). */
    @Column(name = "context_id")
    private UUID contextId;

    private String contextType; // JOB, GIG, GENERAL

    @Column(name = "last_message_at")
    private Instant lastMessageAt;
}
