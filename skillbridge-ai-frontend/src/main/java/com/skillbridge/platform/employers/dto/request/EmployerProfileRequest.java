package com.skillbridge.platform.employers.dto.request;

import jakarta.validation.constraints.NotBlank;

public record EmployerProfileRequest(
        @NotBlank String businessName,
        String businessType,
        String description,
        String gstin,
        String businessAddress,
        Double latitude,
        Double longitude
) {
}
