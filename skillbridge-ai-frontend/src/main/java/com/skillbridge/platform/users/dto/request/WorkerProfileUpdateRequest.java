package com.skillbridge.platform.users.dto.request;

import java.time.LocalDate;

public record WorkerProfileUpdateRequest(
        String bio,
        LocalDate dateOfBirth,
        String gender,
        Integer yearsOfExperience,
        Double hourlyRate,
        Double preferredRadiusKm
) {
}
