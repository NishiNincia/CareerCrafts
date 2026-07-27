package com.skillbridge.platform.ai.dto;

import java.util.List;

/**
 * Normalized output contract that any external resume-parsing provider
 * (LLM-based, OCR + NLP pipeline, or a dedicated resume-parsing SaaS) must
 * produce. Keeping this a plain DTO means swapping providers never touches
 * the resumes module's business logic.
 */
public record ParsedResumeResult(
        String candidateName,
        String email,
        String phone,
        List<String> skills,
        Double totalExperienceYears,
        String highestEducation,
        String rawText
) {
}
