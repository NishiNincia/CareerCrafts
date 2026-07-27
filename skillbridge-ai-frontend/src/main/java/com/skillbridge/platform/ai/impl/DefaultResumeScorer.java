package com.skillbridge.platform.ai.impl;

import com.skillbridge.platform.ai.contract.ResumeScorer;
import com.skillbridge.platform.ai.dto.ParsedResumeResult;
import com.skillbridge.platform.ai.dto.ResumeScoreResult;
import org.springframework.stereotype.Component;

/**
 * Deterministic placeholder scorer based on simple heuristics (presence of
 * contact info, extracted skill count, text length). Swap for an LLM-backed
 * {@link ResumeScorer} bean for real semantic scoring.
 */
@Component
public class DefaultResumeScorer implements ResumeScorer {

    @Override
    public ResumeScoreResult score(ParsedResumeResult parsedResume) {
        double formatting = parsedResume.rawText() != null && parsedResume.rawText().length() > 200 ? 70 : 40;
        double content = Math.min(100, (parsedResume.skills() == null ? 0 : parsedResume.skills().size()) * 10);
        double keyword = parsedResume.email() != null && parsedResume.phone() != null ? 80 : 50;
        double overall = Math.round(((formatting + content + keyword) / 3.0) * 100.0) / 100.0;

        String feedback = "Baseline heuristic score. Connect an external AI provider for detailed, " +
                "personalized resume feedback.";
        return new ResumeScoreResult(overall, formatting, content, keyword, feedback);
    }
}
