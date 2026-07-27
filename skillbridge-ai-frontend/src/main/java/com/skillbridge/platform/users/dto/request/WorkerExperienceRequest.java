package com.skillbridge.platform.users.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record WorkerExperienceRequest(
        @NotBlank String jobTitle,
        @NotBlank String companyName,
        LocalDate startDate,
        LocalDate endDate,
        boolean current,
        String description
) {
}
