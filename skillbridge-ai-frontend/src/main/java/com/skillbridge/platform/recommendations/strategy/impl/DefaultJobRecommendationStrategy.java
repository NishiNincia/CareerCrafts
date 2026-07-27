package com.skillbridge.platform.recommendations.strategy.impl;

import com.skillbridge.platform.jobs.entity.Job;
import com.skillbridge.platform.jobs.repository.JobRepository;
import com.skillbridge.platform.recommendations.dto.RecommendationItem;
import com.skillbridge.platform.recommendations.strategy.JobRecommendationStrategy;
import com.skillbridge.platform.users.entity.WorkerSkill;
import com.skillbridge.platform.users.repository.WorkerProfileRepository;
import com.skillbridge.platform.users.repository.WorkerSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Local skill-overlap baseline. Register a different {@link JobRecommendationStrategy}
 * bean (e.g. calling an external ML ranking / LLM service) to replace this without
 * touching the recommendations service or controller.
 */
@Component
@RequiredArgsConstructor
public class DefaultJobRecommendationStrategy implements JobRecommendationStrategy {

    private final WorkerProfileRepository workerProfileRepository;
    private final WorkerSkillRepository workerSkillRepository;
    private final JobRepository jobRepository;

    @Override
    public List<RecommendationItem> recommendJobs(UUID workerId, int limit) {
        var profile = workerProfileRepository.findById(workerId).orElse(null);
        if (profile == null) return List.of();

        Set<String> skills = workerSkillRepository.findByWorkerId(profile.getId()).stream()
                .map(WorkerSkill::getSkillName).map(String::toLowerCase).collect(Collectors.toSet());

        return jobRepository.findAll().stream()
                .filter(j -> j.getStatus() == Job.JobStatus.OPEN)
                .map(job -> new RecommendationItem(job.getId(), matchScore(skills, job),
                        "Matches " + overlapCount(skills, job) + " of your listed skills"))
                .filter(item -> item.score() > 0)
                .sorted(Comparator.comparingDouble(RecommendationItem::score).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    private long overlapCount(Set<String> skills, Job job) {
        if (job.getRequiredSkills() == null) return 0;
        return Arrays.stream(job.getRequiredSkills().split(","))
                .map(String::trim).map(String::toLowerCase)
                .filter(skills::contains).count();
    }

    private double matchScore(Set<String> skills, Job job) {
        if (job.getRequiredSkills() == null || job.getRequiredSkills().isBlank()) return 0;
        String[] required = job.getRequiredSkills().split(",");
        if (required.length == 0) return 0;
        return Math.round((overlapCount(skills, job) * 100.0 / required.length) * 100.0) / 100.0;
    }
}
