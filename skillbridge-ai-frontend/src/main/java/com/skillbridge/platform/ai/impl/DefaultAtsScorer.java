package com.skillbridge.platform.ai.impl;

import com.skillbridge.platform.ai.contract.AtsScorer;
import com.skillbridge.platform.ai.dto.AtsScoreResult;
import com.skillbridge.platform.ai.dto.ParsedResumeResult;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/** Deterministic keyword-overlap ATS scorer placeholder; swap for an LLM/embedding-based scorer. */
@Component
public class DefaultAtsScorer implements AtsScorer {

    @Override
    public AtsScoreResult scoreAgainstJob(ParsedResumeResult parsedResume, String jobDescription, String requiredSkills) {
        if (requiredSkills == null || requiredSkills.isBlank()) {
            return new AtsScoreResult(0, List.of());
        }
        List<String> required = Arrays.stream(requiredSkills.split(","))
                .map(String::trim).map(s -> s.toLowerCase(Locale.ROOT))
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());

        String haystack = (parsedResume.rawText() == null ? "" : parsedResume.rawText()).toLowerCase(Locale.ROOT);

        List<String> missing = required.stream().filter(skill -> !haystack.contains(skill)).collect(Collectors.toList());
        double score = required.isEmpty() ? 0 :
                Math.round(((required.size() - missing.size()) * 100.0 / required.size()) * 100.0) / 100.0;

        return new AtsScoreResult(score, missing);
    }
}
