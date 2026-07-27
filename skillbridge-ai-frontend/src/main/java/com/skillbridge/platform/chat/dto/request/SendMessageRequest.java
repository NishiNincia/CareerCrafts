package com.skillbridge.platform.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SendMessageRequest(
        @NotNull UUID recipientId,
        @NotBlank String content,
        String attachmentUrl,
        UUID contextId,
        String contextType
) {
}
