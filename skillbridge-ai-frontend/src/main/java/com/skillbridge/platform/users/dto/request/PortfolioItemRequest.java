package com.skillbridge.platform.users.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PortfolioItemRequest(
        @NotBlank String title,
        String description,
        String mediaUrl,
        String projectUrl
) {
}
