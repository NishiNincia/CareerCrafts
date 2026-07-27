package com.skillbridge.platform.users.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record WorkerEducationRequest(
        @NotBlank String institution,
        String degree,
        String fieldOfStudy,
        LocalDate startDate,
        LocalDate endDate
) {
}
