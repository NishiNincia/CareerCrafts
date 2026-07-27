package com.skillbridge.platform.tracking.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LocationPingRequest(
        @NotNull Double latitude,
        @NotNull Double longitude,
        Double headingDegrees,
        Double speedKmh,
        UUID activeGigId
) {
}
