package com.skillbridge.platform.jobs.mapper;

import com.skillbridge.platform.common.util.GeoUtils;
import com.skillbridge.platform.jobs.dto.response.JobResponse;
import com.skillbridge.platform.jobs.entity.Job;

public final class JobMapper {

    private JobMapper() {
    }

    public static JobResponse toResponse(Job job) {
        return toResponse(job, null, null);
    }

    public static JobResponse toResponse(Job job, Double matchScore, Double distanceKm) {
        Double lat = job.getLocation() != null ? GeoUtils.getLatitude(job.getLocation()) : null;
        Double lng = job.getLocation() != null ? GeoUtils.getLongitude(job.getLocation()) : null;
        return new JobResponse(
                job.getId(), job.getEmployerId(), job.getTitle(), job.getDescription(), job.getCategory(),
                job.getEmploymentType(), job.getMinSalary(), job.getMaxSalary(), job.getExperienceRequiredYears(),
                job.getRequiredSkills(), job.getAddress(), lat, lng, job.getStatus(), job.getOpenings(),
                matchScore, distanceKm, job.getCreatedAt());
    }
}
