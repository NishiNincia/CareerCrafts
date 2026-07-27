package com.skillbridge.platform.jobs.dto.request;

import com.skillbridge.platform.jobs.entity.Job.EmploymentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record JobCreateRequest(
        @NotBlank String title,
        @NotBlank String description,
        String category,
        @NotNull EmploymentType employmentType,
        BigDecimal minSalary,
        BigDecimal maxSalary,
        Integer experienceRequiredYears,
        String requiredSkills,
        String address,
        Double latitude,
        Double longitude,
        Integer openings
) {
}
