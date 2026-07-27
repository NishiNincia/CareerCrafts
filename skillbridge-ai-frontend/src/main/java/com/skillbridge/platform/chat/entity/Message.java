package com.skillbridge.platform.chat.entity;

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
@Table(name = "messages", indexes = @Index(name = "idx_message_conversation", columnList = "conversation_id"))
public class Message extends BaseEntity {

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    /** Placeholder for future file/image attachments - stores a storage URL when present. */
    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;
}
