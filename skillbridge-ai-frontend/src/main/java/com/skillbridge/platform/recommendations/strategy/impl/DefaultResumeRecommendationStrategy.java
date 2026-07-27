package com.skillbridge.platform.recommendations.strategy.impl;

import com.skillbridge.platform.recommendations.strategy.ResumeRecommendationStrategy;
import com.skillbridge.platform.resumes.repository.ResumeMetadataRepository;
import com.skillbridge.platform.resumes.repository.ResumeScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DefaultResumeRecommendationStrategy implements ResumeRecommendationStrategy {

    private final ResumeMetadataRepository resumeMetadataRepository;
    private final ResumeScoreRepository resumeScoreRepository;

    @Override
    public List<String> recommendImprovements(UUID resumeId) {
        List<String> suggestions = new ArrayList<>();

        resumeMetadataRepository.findByResumeId(resumeId).ifPresent(metadata -> {
            if (metadata.getEmail() == null) suggestions.add("Add a professional email address near the top of your resume.");
            if (metadata.getPhone() == null) suggestions.add("Add a contact phone number.");
            if (metadata.getExtractedSkills() == null || metadata.getExtractedSkills().isBlank()) {
                suggestions.add("List your key skills explicitly in a dedicated Skills section.");
            }
        });

        resumeScoreRepository.findByResumeId(resumeId).ifPresent(score -> {
            if (score.getFormattingScore() != null && score.getFormattingScore() < 60) {
                suggestions.add("Improve formatting consistency (headings, spacing, bullet points).");
            }
            if (score.getKeywordScore() != null && score.getKeywordScore() < 60) {
                suggestions.add("Add more role-relevant keywords to improve ATS matching.");
            }
        });

        if (suggestions.isEmpty()) {
            suggestions.add("Your resume looks solid! Consider tailoring it further per job description.");
        }
        return suggestions;
    }
}
