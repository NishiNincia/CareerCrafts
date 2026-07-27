package com.skillbridge.platform.recommendations.strategy.impl;

import com.skillbridge.platform.learning.entity.Course;
import com.skillbridge.platform.learning.repository.CourseRepository;
import com.skillbridge.platform.recommendations.dto.RecommendationItem;
import com.skillbridge.platform.recommendations.strategy.CourseRecommendationStrategy;
import com.skillbridge.platform.resumes.repository.SkillGapRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/** Recommends courses that close the worker's currently identified skill gaps. */
@Component
@RequiredArgsConstructor
public class DefaultCourseRecommendationStrategy implements CourseRecommendationStrategy {

    private final SkillGapRepository skillGapRepository;
    private final CourseRepository courseRepository;

    @Override
    public List<RecommendationItem> recommendCourses(UUID workerId, int limit) {
        return skillGapRepository.findByWorkerId(workerId).stream()
                .flatMap(gap -> courseRepository.findByPrimarySkillIgnoreCase(gap.getMissingSkill()).stream()
                        .map(course -> new RecommendationItem(course.getId(), priorityToScore(gap.getPriority()),
                                "Builds the \"" + gap.getMissingSkill() + "\" skill identified as a gap")))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private double priorityToScore(String priority) {
        return switch (priority == null ? "MEDIUM" : priority.toUpperCase()) {
            case "HIGH" -> 90.0;
            case "LOW" -> 40.0;
            default -> 65.0;
        };
    }
}
