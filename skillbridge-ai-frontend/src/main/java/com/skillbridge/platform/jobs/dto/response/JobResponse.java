package com.skillbridge.platform.jobs.dto.response;

import com.skillbridge.platform.jobs.entity.Job;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record JobResponse(
        UUID id,
        UUID employerId,
        String title,
        String description,
        String category,
        Job.EmploymentType employmentType,
        BigDecimal minSalary,
        BigDecimal maxSalary,
        Integer experienceRequiredYears,
        String requiredSkills,
        String address,
        Double latitude,
        Double longitude,
        Job.JobStatus status,
        Integer openings,
        Double matchScore,
        Double distanceKm,
        Instant createdAt
) {
}
