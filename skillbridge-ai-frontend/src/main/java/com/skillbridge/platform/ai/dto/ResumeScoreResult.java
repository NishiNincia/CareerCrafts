package com.skillbridge.platform.ai.dto;

public record ResumeScoreResult(
        double overallScore,
        double formattingScore,
        double contentScore,
        double keywordScore,
        String feedback
) {
}
