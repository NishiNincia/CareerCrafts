package com.skillbridge.platform.ai.impl;

import com.skillbridge.platform.ai.contract.ResumeParser;
import com.skillbridge.platform.ai.dto.ParsedResumeResult;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Placeholder implementation used until a real external resume-parsing
 * provider (LLM API, dedicated parsing SaaS, or OCR+NLP pipeline) is wired
 * in. Does a best-effort plain-text scan for an email/phone so the rest of
 * the pipeline (scoring, ATS, skill gap) can be exercised end-to-end in dev
 * and tests. Replace by registering a different {@link ResumeParser} bean.
 */
@Component
public class DefaultResumeParser implements ResumeParser {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[\\w.+-]+@[\\w-]+\\.[\\w.-]+");
    private static final Pattern PHONE_PATTERN = Pattern.compile("[+]?[0-9][0-9\\s-]{8,14}[0-9]");

    @Override
    public ParsedResumeResult parse(byte[] fileBytes, String fileName, String contentType) {
        String text = new String(fileBytes, StandardCharsets.UTF_8);

        String email = firstMatch(EMAIL_PATTERN, text);
        String phone = firstMatch(PHONE_PATTERN, text);

        return new ParsedResumeResult(
                null,
                email,
                phone,
                List.of(),
                null,
                null,
                text.length() > 5000 ? text.substring(0, 5000) : text
        );
    }

    private String firstMatch(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group() : null;
    }
}
