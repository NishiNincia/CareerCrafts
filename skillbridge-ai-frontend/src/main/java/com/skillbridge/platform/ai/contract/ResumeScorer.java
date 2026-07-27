package com.skillbridge.platform.ai.contract;

import com.skillbridge.platform.ai.dto.ParsedResumeResult;
import com.skillbridge.platform.ai.dto.ResumeScoreResult;

/** Contract for scoring overall resume quality (formatting, content, keyword usage). */
public interface ResumeScorer {
    ResumeScoreResult score(ParsedResumeResult parsedResume);
}
