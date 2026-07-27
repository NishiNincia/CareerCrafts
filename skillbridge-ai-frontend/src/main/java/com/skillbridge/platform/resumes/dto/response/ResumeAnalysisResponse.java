package com.skillbridge.platform.resumes.dto.response;

import java.util.List;
import java.util.UUID;

public record ResumeAnalysisResponse(
        UUID resumeId,
        String parseStatus,
        String candidateName,
        String email,
        String phone,
        List<String> skills,
        Double totalExperienceYears,
        String highestEducation,
        Double resumeOverallScore,
        String resumeFeedback,
        Double atsScore,
        List<String> missingKeywords
) {
}
