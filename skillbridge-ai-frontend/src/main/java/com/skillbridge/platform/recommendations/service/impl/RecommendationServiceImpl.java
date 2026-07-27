package com.skillbridge.platform.recommendations.service.impl;

import com.skillbridge.platform.common.exception.ErrorCode;
import com.skillbridge.platform.common.exception.ResourceNotFoundException;
import com.skillbridge.platform.recommendations.dto.RecommendationItem;
import com.skillbridge.platform.recommendations.service.RecommendationService;
import com.skillbridge.platform.recommendations.strategy.*;
import com.skillbridge.platform.users.entity.WorkerProfile;
import com.skillbridge.platform.users.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Facade over the pluggable recommendation strategies (Strategy Pattern - see
 * the {@code strategy} package). Resolves the caller's User id to their
 * WorkerProfile id once, then delegates to whichever strategy bean is wired
 * for each recommendation type.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationServiceImpl implements RecommendationService {

    private final WorkerProfileRepository workerProfileRepository;
    private final JobRecommendationStrategy jobRecommendationStrategy;
    private final CourseRecommendationStrategy courseRecommendationStrategy;
    private final SchemeRecommendationStrategy schemeRecommendationStrategy;
    private final ResumeRecommendationStrategy resumeRecommendationStrategy;
    private final SkillGapRecommendationStrategy skillGapRecommendationStrategy;

    @Override
    public List<RecommendationItem> getJobRecommendations(UUID workerUserId, int limit) {
        return jobRecommendationStrategy.recommendJobs(profileId(workerUserId), limit);
    }

    @Override
    public List<RecommendationItem> getCourseRecommendations(UUID workerUserId, int limit) {
        return courseRecommendationStrategy.recommendCourses(profileId(workerUserId), limit);
    }

    @Override
    public List<RecommendationItem> getSchemeRecommendations(UUID workerUserId, int limit) {
        return schemeRecommendationStrategy.recommendSchemes(profileId(workerUserId), limit);
    }

    @Override
    public List<String> getResumeImprovementSuggestions(UUID resumeId) {
        return resumeRecommendationStrategy.recommendImprovements(resumeId);
    }

    @Override
    public List<RecommendationItem> getSkillGaps(UUID workerUserId, UUID targetJobId) {
        return skillGapRecommendationStrategy.identifyGaps(profileId(workerUserId), targetJobId);
    }

    private UUID profileId(UUID workerUserId) {
        WorkerProfile profile = workerProfileRepository.findByUserId(workerUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "Worker profile not found"));
        return profile.getId();
    }
}
