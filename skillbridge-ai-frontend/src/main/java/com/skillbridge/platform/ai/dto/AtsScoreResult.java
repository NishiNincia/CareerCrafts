package com.skillbridge.platform.ai.dto;

import java.util.List;

public record AtsScoreResult(
        double atsScore,
        List<String> missingKeywords
) {
}
