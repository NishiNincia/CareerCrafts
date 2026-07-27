package com.skillbridge.platform.gigs.dto.response;

import com.skillbridge.platform.gigs.entity.Gig;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record GigResponse(
        UUID id,
        UUID employerId,
        String title,
        String description,
        String category,
        BigDecimal hourlyRate,
        Double estimatedHours,
        Instant scheduledStart,
        Instant expiresAt,
        String address,
        Double latitude,
        Double longitude,
        Gig.GigStatus status,
        Double distanceKm
) {
}
