package com.skillbridge.platform.gigs.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;

public record GigCreateRequest(
        @NotBlank String title,
        String description,
        String category,
        @NotNull @Positive BigDecimal hourlyRate,
        Double estimatedHours,
        @NotNull @Future Instant scheduledStart,
        @NotNull Instant expiresAt,
        String address,
        @NotNull Double latitude,
        @NotNull Double longitude
) {
}
