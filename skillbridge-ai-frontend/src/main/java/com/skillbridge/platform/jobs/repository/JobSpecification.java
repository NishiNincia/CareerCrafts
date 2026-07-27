package com.skillbridge.platform.jobs.repository;

import com.skillbridge.platform.jobs.entity.Job;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

/**
 * Dynamic filter builder for the job search endpoint - keeps the controller/service
 * free of ad-hoc query string concatenation.
 */
public final class JobSpecification {

    private JobSpecification() {
    }

    public static Specification<Job> filter(String keyword, String category, Job.EmploymentType employmentType,
                                             BigDecimal minSalary, Integer maxExperience) {
        return (root, query, cb) -> {
            var predicate = cb.equal(root.get("status"), Job.JobStatus.OPEN);
            predicate = cb.and(predicate, cb.isFalse(root.get("deleted")));

            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.toLowerCase() + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("description")), like)));
            }
            if (category != null && !category.isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("category"), category));
            }
            if (employmentType != null) {
                predicate = cb.and(predicate, cb.equal(root.get("employmentType"), employmentType));
            }
            if (minSalary != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("maxSalary"), minSalary));
            }
            if (maxExperience != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("experienceRequiredYears"), maxExperience));
            }
            return predicate;
        };
    }
}
