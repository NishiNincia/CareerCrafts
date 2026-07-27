package com.skillbridge.platform.users.dto.request;

import jakarta.validation.constraints.NotNull;

public record LocationUpdateRequest(
        @NotNull Double latitude,
        @NotNull Double longitude
) {
}
