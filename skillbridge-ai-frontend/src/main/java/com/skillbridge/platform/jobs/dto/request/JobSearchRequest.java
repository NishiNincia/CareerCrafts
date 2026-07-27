package com.skillbridge.platform.jobs.dto.request;

import com.skillbridge.platform.jobs.entity.Job.EmploymentType;

import java.math.BigDecimal;

public record JobSearchRequest(
        String keyword,
        String category,
        EmploymentType employmentType,
        BigDecimal minSalary,
        Integer maxExperience,
        Integer page,
        Integer size
) {
}
