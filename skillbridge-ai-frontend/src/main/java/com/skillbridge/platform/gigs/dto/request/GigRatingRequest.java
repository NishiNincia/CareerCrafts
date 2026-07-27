package com.skillbridge.platform.gigs.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GigRatingRequest(
        @NotNull UUID rateeUserId,
        @Min(1) @Max(5) int stars,
        String comment
) {
}
