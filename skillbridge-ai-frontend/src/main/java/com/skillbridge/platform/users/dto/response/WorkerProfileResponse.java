package com.skillbridge.platform.users.dto.response;

import java.time.LocalDate;
import java.util.UUID;

public record WorkerProfileResponse(
        UUID id,
        UUID userId,
        String fullName,
        String email,
        String bio,
        LocalDate dateOfBirth,
        String gender,
        Integer yearsOfExperience,
        boolean available,
        Double hourlyRate,
        Double preferredRadiusKm,
        Double latitude,
        Double longitude,
        Double resumeScore,
        Double atsScore
) {
}
