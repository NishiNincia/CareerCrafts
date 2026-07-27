package com.skillbridge.platform.ai.contract;

import com.skillbridge.platform.ai.dto.ParsedResumeResult;

/**
 * Contract for extracting structured data from an uploaded resume file.
 * Implementations plug in an external provider (LLM prompt-based extraction,
 * a dedicated resume-parsing API, or an OCR + NLP pipeline for scanned PDFs).
 * No AI/ML logic lives in this codebase - only this interface and a
 * deterministic stub used until a provider is wired up.
 */
public interface ResumeParser {
    ParsedResumeResult parse(byte[] fileBytes, String fileName, String contentType);
}
