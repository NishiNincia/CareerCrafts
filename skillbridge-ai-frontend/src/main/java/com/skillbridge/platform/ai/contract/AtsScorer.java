package com.skillbridge.platform.ai.contract;

import com.skillbridge.platform.ai.dto.AtsScoreResult;
import com.skillbridge.platform.ai.dto.ParsedResumeResult;

/** Contract for scoring how well a resume would pass an Applicant Tracking System for a given job. */
public interface AtsScorer {
    AtsScoreResult scoreAgainstJob(ParsedResumeResult parsedResume, String jobDescription, String requiredSkills);
}
