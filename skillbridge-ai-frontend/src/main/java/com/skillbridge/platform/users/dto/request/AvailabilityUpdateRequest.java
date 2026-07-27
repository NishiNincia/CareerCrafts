package com.skillbridge.platform.users.dto.request;

import jakarta.validation.constraints.NotNull;

public record AvailabilityUpdateRequest(@NotNull Boolean available) {
}
