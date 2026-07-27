package com.skillbridge.platform.recommendations.strategy.impl;

import com.skillbridge.platform.jobs.entity.Job;
import com.skillbridge.platform.jobs.repository.JobRepository;
import com.skillbridge.platform.recommendations.dto.RecommendationItem;
import com.skillbridge.platform.recommendations.strategy.SkillGapRecommendationStrategy;
import com.skillbridge.platform.users.entity.WorkerSkill;
import com.skillbridge.platform.users.repository.WorkerSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DefaultSkillGapRecommendationStrategy implements SkillGapRecommendationStrategy {

    private final WorkerSkillRepository workerSkillRepository;
    private final JobRepository jobRepository;

    @Override
    public List<RecommendationItem> identifyGaps(UUID workerId, UUID targetJobId) {
        Set<String> workerSkills = workerSkillRepository.findByWorkerId(workerId).stream()
                .map(WorkerSkill::getSkillName).map(String::toLowerCase).collect(Collectors.toSet());

        List<Job> targetJobs = targetJobId != null
                ? jobRepository.findById(targetJobId).map(List::of).orElse(List.of())
                : jobRepository.findAll().stream().filter(j -> j.getStatus() == Job.JobStatus.OPEN).limit(20).toList();

        List<RecommendationItem> gaps = new ArrayList<>();
        for (Job job : targetJobs) {
            if (job.getRequiredSkills() == null) continue;
            for (String skill : job.getRequiredSkills().split(",")) {
                String normalized = skill.trim().toLowerCase();
                if (!normalized.isBlank() && !workerSkills.contains(normalized)) {
                    gaps.add(new RecommendationItem(job.getId(), 100.0,
                            "\"" + skill.trim() + "\" is required by \"" + job.getTitle() + "\" but not in your profile"));
                }
            }
        }
        return gaps;
    }
}
